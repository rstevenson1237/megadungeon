// The turn loop (Spec 04, "Turns and timing"): strictly turn-based. Nothing moves until the
// player spends an action; then every monster acts, nearest first, up to 50 per round.
// Task 1.8 builds the loop, movement, doors and a stub melee fight. Awareness rolls, the six
// behaviours, items and the full character come with tasks 2.5 to 2.9.

import type { LogMessage } from '../core/log.ts';
import { createRng, hash32, levelSeed, type Rng } from '../core/rng.ts';
import { meleeOutcome, monsterRoll, rollDie } from '../rules/combat/melee.ts';
import { distancesFrom } from '../rules/world/grid.ts';
import { distanceSq } from '../rules/world/geometry.ts';
import { TILE, type Level, type Point } from '../rules/world/level.ts';
import type { Command } from './commands.ts';
import { type MapState, TERRAIN_BLOCKED, TERRAIN_OPEN, createMapState, isOpen, refreshSight } from './map-state.ts';
import { type Monster, type Speed, spawnAll } from './monsters.ts';

/** At most this many creatures act per round, nearest first (Spec 04). */
export const MAX_SIMULATED = 50;

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
  dead: boolean;
  /** Direction of the last move, so closing a door prefers the one the player faces. */
  facing: { dx: number; dy: number };
  /** The readied ranged weapon, if any; its range sets how far targeting reaches (Spec 05). */
  ranged: { name: string; range: number } | null;
}

/** A living player with the given Combat pool, facing south. */
export function createPlayer(pool: Pick<PlayerState, 'combatStep' | 'combatDice' | 'combatMax' | 'ranged'>): PlayerState {
  return { ...pool, dead: false, facing: { dx: 0, dy: 1 } };
}

export interface GameState {
  map: MapState;
  monsters: Monster[];
  player: PlayerState;
  /** Rounds begin at 1. */
  round: number;
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
   * The monsters still alive, as the player left them: where they stand, how hurt and whether
   * alert (Spec 04: they stay where they were). A generated monster missing here is dead.
   */
  monsters: Monster[];
  /** The round the player left, for restocking (task 2.12). */
  turnLeft: number;
}

export interface ArrivalOptions {
  /** Which stair the player arrives on; the up stair by default (arriving from above). */
  stair?: 'up' | 'down';
  delta?: LevelDelta;
  /** The run's round counter on arrival; 1 for a new run. */
  round?: number;
}

/** How many times a creature acts in the given round (Spec 04): fast twice, normal once, slow every other round. */
export function actionsInRound(speed: Speed, round: number): number {
  if (speed === 'fast') return 2;
  if (speed === 'normal') return 1;
  return round % 2 === 0 ? 1 : 0;
}

export class Game {
  readonly state: GameState;
  /** The level's runtime stream (Spec 02): combat and wandering never share a sequence with layout. */
  readonly rng: Rng;

  constructor(runSeed: number, level: Level, player: PlayerState, arrival: ArrivalOptions = {}) {
    const seed = levelSeed(runSeed, level.depth);
    const round = arrival.round ?? 1;
    const { delta } = arrival;
    // The runtime stream is mixed with the arrival round, so a revisit does not replay the
    // dice of the last visit; the monsters come from the generated level, so they regenerate identically.
    this.rng = createRng(hash32('runtime', seed, round));
    const at = arrival.stair === 'down' ? level.downStair ?? level.upStair : level.upStair;
    this.state = {
      map: createMapState(level, { at, openDoors: delta?.openDoors.slice(), explored: delta?.explored.slice() }),
      monsters: delta ? delta.monsters.map((m) => ({ ...m })) : spawnAll(level),
      player,
      round,
    };
  }

  /** Snapshot what a revisit must replay: doors, explored cells and the living monsters. */
  captureDelta(): LevelDelta {
    const { map, monsters, round } = this.state;
    return {
      explored: map.exploration.explored.slice(),
      openDoors: map.openDoors.slice(),
      monsters: monsters.map((m) => ({ ...m })),
      turnLeft: round,
    };
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
    switch (command.type) {
      case 'move':
        return this.move(command.dx, command.dy, messages);
      case 'wait':
        return this.endRound(messages);
      case 'interact':
        return this.useStairs(messages) ?? this.closeDoor(messages);
      default:
        return undefined;
    }
  }

  /** Interact on a stair: ask the run to change level. Using stairs ends any pursuit, so the monsters do not act (Spec 04). */
  private useStairs(messages: LogMessage[]): ActResult | undefined {
    const { map } = this.state;
    const tile = map.level.tiles[map.player.y]![map.player.x];
    if (tile === TILE.stairsUp) return { messages, spent: false, stairs: 'up' };
    if (tile === TILE.stairsDown) return { messages, spent: false, stairs: 'down' };
    return undefined;
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
      this.playerAttacks(monster, messages);
      return this.endRound(messages);
    }
    const cell = y * level.width + x;
    if (level.tiles[y]![x] === TILE.door && !isOpen(map, x, y)) {
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

  // One exchange of the opposed Combat roll (Spec 03, Melee).
  private playerAttacks(monster: Monster, messages: LogMessage[]): void {
    const { player } = this.state;
    const mine = rollDie(this.rng, player.combatStep, player.combatDice === 0);
    const theirs = monsterRoll(this.rng, monster.modifier);
    const outcome = meleeOutcome(mine, theirs);
    if (outcome.defenderHit) this.hitMonster(monster, messages);
    if (outcome.attackerHit) this.hitPlayer(monster, messages);
  }

  private monsterAttacks(monster: Monster, messages: LogMessage[]): void {
    const { player } = this.state;
    const mine = monsterRoll(this.rng, monster.modifier);
    const theirs = rollDie(this.rng, player.combatStep, player.combatDice === 0);
    const outcome = meleeOutcome(mine, theirs);
    if (outcome.defenderHit) this.hitPlayer(monster, messages);
    if (outcome.attackerHit) this.hitMonster(monster, messages);
  }

  private hitMonster(monster: Monster, messages: LogMessage[]): void {
    monster.dice--;
    if (monster.dice > 0) {
      messages.push({ kind: 'combat', text: `You hit the ${monster.name}.` });
      return;
    }
    messages.push({ kind: 'combat', text: `You kill the ${monster.name}.` });
    this.state.monsters.splice(this.state.monsters.indexOf(monster), 1);
  }

  /** A hit removes one Combat die; a hit with none left is fatal (Spec 03). */
  private hitPlayer(monster: Monster, messages: LogMessage[]): void {
    const { player } = this.state;
    if (player.combatDice === 0) {
      player.dead = true;
      messages.push({ kind: 'combat', text: `The ${monster.name} kills you.` });
      return;
    }
    player.combatDice--;
    messages.push({ kind: 'combat', text: `The ${monster.name} hits you.` });
  }

  /** The player has spent an action: every monster acts, then the round ends. */
  private endRound(messages: LogMessage[]): ActResult {
    this.monstersAct(messages);
    this.state.round++;
    return { messages, spent: true };
  }

  // Stub behaviour (until task 2.7): a monster waits until the player sees it, then hunts by
  // the shortest path and attacks when next to the player. Doors stay shut to it.
  private monstersAct(messages: LogMessage[]): void {
    const { map, monsters, round, player } = this.state;
    const at = map.player;
    const { width, height } = map.level;
    const order = monsters
      .slice()
      .sort((a, b) => distanceSq(a, at) - distanceSq(b, at) || a.id - b.id)
      .slice(0, MAX_SIMULATED);
    let dist: Int32Array | null = null;
    for (const m of order) {
      for (let n = actionsInRound(m.speed, round); n > 0; n--) {
        if (player.dead) return;
        if (!m.alert && map.visible[m.y * width + m.x]) m.alert = true;
        if (!m.alert) break;
        if (Math.abs(m.x - at.x) + Math.abs(m.y - at.y) === 1) {
          this.monsterAttacks(m, messages);
          continue;
        }
        dist ??= distancesFrom(map.terrain, width, height, at, (t) => t === TERRAIN_OPEN);
        const here = dist[m.y * width + m.x]!;
        if (here < 0) break;
        let best: Point | null = null;
        let bestDist = here;
        for (const [dx, dy] of NESW) {
          const nx = m.x + dx;
          const ny = m.y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const d = dist[ny * width + nx]!;
          if (d < 0 || d >= bestDist || this.monsterAt(nx, ny) || (nx === at.x && ny === at.y)) continue;
          best = { x: nx, y: ny };
          bestDist = d;
        }
        if (best) {
          m.x = best.x;
          m.y = best.y;
        }
      }
    }
  }
}
