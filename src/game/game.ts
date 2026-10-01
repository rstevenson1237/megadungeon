// The turn loop (Spec 04, "Turns and timing"): strictly turn-based. Nothing moves until the player
// spends an action; then every creature acts, nearest first, up to 50 per round (game/ai.ts).
// Spells, items and class abilities come with tasks 2.8 to 2.10.

import type { LogMessage } from '../core/log.ts';
import { createRng, hash32, levelSeed, type Rng } from '../core/rng.ts';
import type { Spell } from '../core/schemas.ts';
import type { Pool } from '../rules/character/dice.ts';
import { waitRound } from '../rules/character/health.ts';
import { BOOK_CURSE_ROUNDS, readSpellbook, readiness, type Spellbook } from '../rules/magic/learning.ts';
import { resolvesAtOnce } from '../rules/magic/spells.ts';
import {
  type StatusEffect,
  applyStatus,
  cannotAct,
  checkMode,
  describeStatus,
  effectiveSpeed,
  hasStatus,
  removeStatus,
  statusOf,
  tickStatuses,
} from '../rules/magic/status.ts';
import { distanceSq } from '../rules/world/geometry.ts';
import { TILE, type Level, type Pile, type Point } from '../rules/world/level.ts';
import { MAX_SIMULATED, actionsInRound, creaturesAct } from './ai.ts';
import { nameOf, playerAttacks, playerFires, removeDie } from './combat.ts';
import type { Command } from './commands.ts';
import { type MapState, TERRAIN_BLOCKED, TERRAIN_OPEN, createMapState, isOpen, refreshSight } from './map-state.ts';
import { castSpell, spellAimError } from './magic.ts';
import { type Monster, spawnAll } from './monsters.ts';

export { MAX_SIMULATED, actionsInRound };

const NESW: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export interface PlayerState {
  /** Sides of each Combat die, and the dice left and at most held. The Combat pool is health. */
  combatStep: number;
  combatDice: number;
  combatMax: number;
  /** Skill and Magic pools: the dice a monster's ranged attack or spell is rolled against (Spec 04), and fuel (Spec 03). */
  skill: Pool;
  magic: Pool;
  /** Carried gold, which bandits steal from (Spec 04). Gems, jewelry and items arrive with task 2.9. */
  coins: number;
  /** A stealth buff gives monsters disadvantage on their notice roll (Spec 04). */
  stealth: boolean;
  dead: boolean;
  /** Consecutive rounds spent waiting; 10 restore a Combat die, an action or move resets it (Spec 03). */
  waited: number;
  /** Direction of the last move, so closing a door prefers the one the player faces. */
  facing: { dx: number; dy: number };
  /** The readied ranged weapon, if any: its range sets how far targeting reaches and each shot spends one ammunition (Spec 04, 05). */
  ranged: { name: string; range: number; ammo: number } | null;
  /** Active status effects (Spec 04, "Status effects"). */
  statuses: StatusEffect[];
  /** Rounds left of a Shield, which absorbs the next hit (Spec 04, task 2.8); 0 when there is none. */
  shield: number;
  /** Ids of the spells known (Spec 04, "Spells"). */
  spells: string[];
  /** Major abilities with a rule in code that the game reads, by id (such as `arcane_bolt`). */
  abilities: string[];
  /** Village rests taken, which a failed spellbook waits for (Spec 04). */
  rests: number;
  /** The first of a hasted pair of actions is done, so the monsters have not yet acted for this round. */
  halfRound: boolean;
}

type PlayerSetup = Pick<PlayerState, 'combatStep' | 'combatDice' | 'combatMax'> &
  Partial<Pick<PlayerState, 'skill' | 'magic' | 'coins' | 'stealth' | 'ranged' | 'spells' | 'abilities'>>;

/** A living player with the given Combat pool, facing south. Skill and Magic default to one d6 each. */
export function createPlayer(setup: PlayerSetup): PlayerState {
  return {
    skill: { step: 6, dice: 1, max: 1 },
    magic: { step: 6, dice: 1, max: 1 },
    coins: 0,
    stealth: false,
    ranged: null,
    spells: [],
    abilities: [],
    ...setup,
    dead: false,
    waited: 0,
    facing: { dx: 0, dy: 1 },
    statuses: [],
    shield: 0,
    rests: 0,
    halfRound: false,
  };
}

/**
 * A village rest (Spec 03): every die in every pool comes back, Poisoned ends, and the rest count a failed
 * spellbook waits for goes up. The cost and the save belong to the village (task 2.11).
 */
export function takeRest(player: PlayerState): void {
  player.combatDice = player.combatMax;
  player.skill.dice = player.skill.max;
  player.magic.dice = player.magic.max;
  player.waited = 0;
  player.halfRound = false;
  removeStatus(player.statuses, 'poisoned');
  player.rests++;
}

export interface GameState {
  map: MapState;
  monsters: Monster[];
  player: PlayerState;
  /** Rounds begin at 1. */
  round: number;
  /** What dead bandits and rivals dropped, on the cell where they fell (Spec 04). Picking it up comes with task 2.10. */
  drops: Pile[];
  /** Containers (indices into `level.features`) and floor piles (into `level.piles`) a rival has emptied (Spec 04, task 2.7). */
  looted: { features: number[]; piles: number[] };
  /** Cells (y * width + x) of hidden things the player has found: floor traps, container traps and secret doors (Spec 04, Detect; Spec 06). */
  revealed: number[];
}

export interface ActResult {
  messages: LogMessage[];
  /** True when the action cost a round, so the monsters acted. */
  spent: boolean;
  /** Set when the player used the stairs they stand on; the run changes the level (Spec 02). */
  stairs?: 'up' | 'down';
}

/** What a revisit replays on top of the regenerated level (Spec 02, Persistence; Spec 09, Level deltas). */
export interface LevelDelta {
  /** Cells seen so far, one entry per cell. */
  explored: number[];
  /** Cell indices of open doors. */
  openDoors: number[];
  /**
   * The creatures still alive, as the player left them: where they stand, how hurt and how aware
   * (Spec 04: they stay where they were). A generated monster missing here is dead.
   */
  monsters: Monster[];
  /** What dead creatures dropped and what rivals took. */
  drops: Pile[];
  looted: { features: number[]; piles: number[] };
  /** Hidden things found on this level (Spec 06: once found, always found). */
  revealed: number[];
  /** The round the player left, for restocking (task 2.12). */
  turnLeft: number;
}

export interface ArrivalOptions {
  /** Which stair the player arrives on; the up stair by default (arriving from above). */
  stair?: 'up' | 'down';
  delta?: LevelDelta;
  /** The run's round counter on arrival; 1 for a new run. */
  round?: number;
  /** The spell table, so the spells a player knows can be cast (Spec 04). */
  spells?: readonly Spell[];
}

export class Game {
  readonly state: GameState;
  /** The level's runtime stream (Spec 02): combat and wandering never share a sequence with layout. */
  readonly rng: Rng;
  /** Every spell in the content, by id. Derived from the content, so never saved. */
  readonly spells: ReadonlyMap<string, Spell>;

  constructor(runSeed: number, level: Level, player: PlayerState, arrival: ArrivalOptions = {}) {
    const seed = levelSeed(runSeed, level.depth);
    const round = arrival.round ?? 1;
    const { delta } = arrival;
    // The runtime stream is mixed with the arrival round, so a revisit does not replay the
    // dice of the last visit; the monsters come from the generated level, so they regenerate identically.
    this.rng = createRng(hash32('runtime', seed, round));
    this.spells = new Map((arrival.spells ?? []).map((sp) => [sp.id, sp]));
    const at = arrival.stair === 'down' ? level.downStair ?? level.upStair : level.upStair;
    this.state = {
      map: createMapState(level, { at, openDoors: delta?.openDoors.slice(), explored: delta?.explored.slice() }),
      // Which monsters start asleep is rolled from the level's own seed, so it is the same whenever the level is first entered.
      monsters: delta ? structuredClone(delta.monsters) : spawnAll(level, createRng(hash32('awareness', seed))),
      player,
      round,
      drops: delta ? structuredClone(delta.drops) : [],
      looted: delta ? structuredClone(delta.looted) : { features: [], piles: [] },
      revealed: delta ? delta.revealed.slice() : [],
    };
  }

  /** Snapshot what a revisit must replay: doors, explored cells, the living creatures and what they dropped or took. */
  captureDelta(): LevelDelta {
    const { map, monsters, round, drops, looted, revealed } = this.state;
    return {
      explored: map.exploration.explored.slice(),
      openDoors: map.openDoors.slice(),
      monsters: structuredClone(monsters),
      drops: structuredClone(drops),
      looted: structuredClone(looted),
      revealed: revealed.slice(),
      turnLeft: round,
    };
  }

  /** Recompute what the player sees after the player moves or a door opens (Blink uses it). */
  refreshSight(): void {
    refreshSight(this.state.map);
  }

  monsterAt(x: number, y: number): Monster | undefined {
    return this.state.monsters.find((m) => m.x === x && m.y === y);
  }

  /**
   * Carry out a command that costs a round or acts on the map. Returns undefined for any
   * command this loop does not handle, so the caller can open an overlay or say it is not yet
   * available. Free actions (looking, targeting, menus) never come here.
   */
  act(command: Command): ActResult | undefined {
    const { player } = this.state;
    if (player.dead) {
      return { messages: [{ kind: 'system', text: 'You are dead. Death options arrive in task 2.13.' }], spent: false };
    }
    const messages: LogMessage[] = [];
    if (['move', 'wait', 'interact'].includes(command.type)) {
      const helpless = this.helpless(messages);
      if (helpless) return helpless;
    }
    switch (command.type) {
      case 'move':
        return this.move(command.dx, command.dy, messages);
      case 'wait':
        return this.endRound(messages, true);
      case 'interact':
        return this.useStairs(messages) ?? this.closeDoor(messages);
      default:
        return undefined;
    }
  }

  /**
   * Fire the readied ranged weapon at a creature (Spec 04): one Skill die as a skill use and one
   * shot of ammunition, hit or miss. With none left the weapon cannot fire and no round passes.
   */
  fire(target: Monster): ActResult {
    const { player } = this.state;
    const messages: LogMessage[] = [];
    if (player.dead) return { messages: [{ kind: 'system', text: 'You are dead.' }], spent: false };
    if (!player.ranged) {
      messages.push({ kind: 'system', text: 'You have no ranged weapon readied.' });
      return { messages, spent: false };
    }
    if (player.ranged.ammo <= 0) {
      messages.push({ kind: 'system', text: `Your ${player.ranged.name} is out of ammunition.` });
      return { messages, spent: false };
    }
    const helpless = this.helpless(messages);
    if (helpless) return helpless;
    player.ranged.ammo--;
    playerFires(this, target, messages);
    return this.endRound(messages);
  }

  /**
   * Cast a spell the player knows (Spec 04, "Spells"): one round and one Magic die rolled as a spell roll.
   * `aim` is the creature a targeted spell or the centre of a targeted area is aimed at, or the cell Blink
   * goes to; self spells and spells centred on the caster need none. A cast that cannot be made (an
   * unknown spell, a bad aim) costs no round.
   */
  cast(spell: Spell, aim?: Monster | Point): ActResult {
    const { player } = this.state;
    const messages: LogMessage[] = [];
    if (player.dead) return { messages: [{ kind: 'system', text: 'You are dead.' }], spent: false };
    const problem = !player.spells.includes(spell.id) ? `You do not know ${spell.name}.` : spellAimError(this, spell, aim);
    if (problem) return { messages: [{ kind: 'system', text: problem }], spent: false };
    const helpless = this.helpless(messages);
    if (helpless) return helpless;
    castSpell(this, spell, aim, messages);
    return this.endRound(messages);
  }

  /** Whether choosing the spell is the whole of casting it (a self spell or an area around the caster). */
  castsAtOnce(spell: Spell): boolean {
    return resolvesAtOnce(spell);
  }

  /**
   * Read a spellbook (Spec 04, "Spells"): a Magic check, so Blessed and Cursed apply. 4 or more learns the
   * spell; 2 to 3 fails until the next village rest; 1 destroys the book and leaves the reader Cursed for 20
   * rounds (Spec 06). A book that cannot be read costs no round. Returns whether the book was used up.
   */
  readBook(book: Spellbook): ActResult & { used: boolean } {
    const { player } = this.state;
    const messages: LogMessage[] = [];
    const name = this.spells.get(book.spell)?.name ?? book.spell;
    if (player.dead) return { messages: [{ kind: 'system', text: 'You are dead.' }], spent: false, used: false };
    const reader = { magic: player.magic, spells: player.spells, rests: player.rests, mode: checkMode(player.statuses) };
    // A known spell or a book waiting for a rest costs nothing.
    const ready = readiness(book, reader);
    if (ready !== 'ready') {
      messages.push({ kind: 'system', text: ready === 'known' ? `You already know ${name}.` : 'The words will not come. Try again after a rest.' });
      return { messages, spent: false, used: false };
    }
    const helpless = this.helpless(messages);
    if (helpless) return { ...helpless, used: false };
    const outcome = readSpellbook(this.rng, book, reader);
    let used = false;
    if (outcome.kind === 'learned') {
      used = true;
      messages.push({ kind: 'discovery', text: `You learn ${name}.` });
    } else if (outcome.kind === 'failed') {
      messages.push({ kind: 'warning', text: 'The words slip away. Try again after a rest.' });
    } else if (outcome.kind === 'destroyed') {
      used = true;
      applyStatus(player.statuses, 'cursed', BOOK_CURSE_ROUNDS);
      messages.push({ kind: 'warning', text: 'The book crumbles to dust, and a curse settles on you.' });
    }
    return { ...this.endRound(messages), used };
  }

  /** An Asleep or Held player cannot act: the action is lost and the round goes by (Spec 04, Status effects). */
  private helpless(messages: LogMessage[]): ActResult | undefined {
    if (!cannotAct(this.state.player.statuses)) return undefined;
    messages.push({ kind: 'warning', text: hasStatus(this.state.player.statuses, 'asleep') ? 'You are asleep.' : 'You are held fast.' });
    return this.endRound(messages);
  }

  /** Interact on a stair: ask the run to change level. Using stairs ends any pursuit, so the monsters do not act (Spec 04). */
  private useStairs(messages: LogMessage[]): ActResult | undefined {
    const { map } = this.state;
    const tile = map.level.tiles[map.player.y]![map.player.x];
    const stairs = tile === TILE.stairsUp ? 'up' : tile === TILE.stairsDown ? 'down' : null;
    if (!stairs) return undefined;
    this.state.player.waited = 0;
    return { messages, spent: false, stairs };
  }

  private move(dx: number, dy: number, messages: LogMessage[]): ActResult {
    const { map, player } = this.state;
    const { level } = map;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return { messages, spent: false };
    player.facing = { dx, dy };
    const x = map.player.x + dx;
    const y = map.player.y + dy;
    if (x < 0 || y < 0 || x >= level.width || y >= level.height) return { messages, spent: false };

    const monster = this.monsterAt(x, y);
    if (monster) {
      playerAttacks(this, monster, messages);
      return this.endRound(messages);
    }
    const cell = y * level.width + x;
    // A frightened player may not step nearer to what frightens them, though they may still fight (Spec 04, task 2.8).
    const scare = statusOf(player.statuses, 'frightened')?.source;
    if (scare && distanceSq({ x, y }, scare) < distanceSq(map.player, scare)) {
      messages.push({ kind: 'warning', text: 'You are too frightened to go that way.' });
      return { messages, spent: false };
    }
    const foundSecret = this.state.revealed.includes(cell) && level.doors.some((d) => d.x === x && d.y === y && d.kind === 'secret');
    if ((level.tiles[y]![x] === TILE.door || foundSecret) && !isOpen(map, x, y)) {
      // Locked and sealed doors stay shut until keys and picking arrive (task 2.10); trying one is free.
      if (level.doors.some((d) => d.x === x && d.y === y && (d.kind === 'locked' || d.kind === 'sealed'))) {
        messages.push({ kind: 'system', text: 'The door is locked.' });
        return { messages, spent: false };
      }
      // A normal door opens when moved into; it costs the move (Spec 06).
      map.openDoors.push(cell);
      map.terrain[cell] = TERRAIN_OPEN;
      refreshSight(map);
      return this.endRound(messages);
    }
    if (!isOpen(map, x, y)) return { messages, spent: false }; // bumping a wall is free
    map.player = { x, y };
    refreshSight(map);
    return this.endRound(messages);
  }

  /** Close an adjacent open door: the one the player faces, else the first found (Spec 06, "Closing a door is an interact action"). */
  private closeDoor(messages: LogMessage[]): ActResult | undefined {
    const { map, player } = this.state;
    const { level } = map;
    const around = [[player.facing.dx, player.facing.dy] as const, ...NESW];
    for (const [dx, dy] of around) {
      const x = map.player.x + dx;
      const y = map.player.y + dy;
      const cell = y * level.width + x;
      if (!map.openDoors.includes(cell)) continue;
      if (this.monsterAt(x, y)) {
        messages.push({ kind: 'system', text: 'Something is in the doorway.' });
        return { messages, spent: false };
      }
      map.openDoors.splice(map.openDoors.indexOf(cell), 1);
      map.terrain[cell] = TERRAIN_BLOCKED;
      refreshSight(map);
      return this.endRound(messages);
    }
    return undefined;
  }

  /**
   * The player has spent an action: every creature acts, then the round ends. Waiting counts toward
   * the next Combat die; any other action or move resets the count (Spec 03, Waiting). A hasted player acts
   * twice a round, so every first action of a pair passes no time; a slowed one takes two rounds to act.
   */
  private endRound(messages: LogMessage[], waiting = false): ActResult {
    const { player } = this.state;
    if (!waiting) player.waited = 0;
    const speed = effectiveSpeed('normal', player.statuses);
    if (speed === 'fast' && !player.halfRound) {
      player.halfRound = true;
      return { messages, spent: true };
    }
    player.halfRound = false;
    for (let rounds = speed === 'slow' ? 2 : 1; rounds > 0 && !player.dead; rounds--) this.runRound(messages, waiting);
    return { messages, spent: true };
  }

  /** One round of the level: every creature acts, effects tick down, waiting counts, and the round number goes up. */
  private runRound(messages: LogMessage[], waiting: boolean): void {
    const { player } = this.state;
    creaturesAct(this, messages);
    if (!player.dead) {
      this.endOfRound(messages);
      // Waiting does not recover dice while poisoned (Spec 04).
      if (hasStatus(player.statuses, 'poisoned')) player.waited = 0;
      else if (waiting && !player.dead) {
        const pool = { dice: player.combatDice, max: player.combatMax };
        const wait = waitRound(player.waited, pool);
        player.waited = wait.waited;
        player.combatDice = pool.dice;
        if (wait.restored) messages.push({ kind: 'system', text: 'You feel your strength return.' });
      }
    }
    this.state.round++;
  }

  /** End of a round (Spec 04, task 2.8): the player's and every monster's effects lose a round and poison bites. */
  private endOfRound(messages: LogMessage[]): void {
    const { player, monsters } = this.state;
    const mine = tickStatuses(player.statuses);
    for (const id of mine.ended) messages.push({ kind: 'system', text: `You are no longer ${describeStatus({ id, rounds: null, clock: 0 }).toLowerCase()}.` });
    if (player.shield > 0 && --player.shield === 0) messages.push({ kind: 'system', text: 'Your shield fades.' });
    if (mine.poisonDue) {
      if (player.combatDice <= 0) {
        player.dead = true;
        messages.push({ kind: 'combat', text: 'The poison kills you.' });
      } else {
        player.combatDice--;
        messages.push({ kind: 'combat', text: 'The poison burns in your blood.' });
      }
    }
    for (const m of monsters.slice()) {
      const theirs = tickStatuses(m.statuses);
      if (theirs.poisonDue) {
        const shown = this.state.map.visible[m.y * this.state.map.level.width + m.x] === 1;
        removeDie(this, m, messages, { hit: `The poison burns ${nameOf(m)}.`, kill: `The poison kills ${nameOf(m)}.` }, shown, false);
      }
    }
  }
}
