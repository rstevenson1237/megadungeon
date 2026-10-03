// Creatures in play (Spec 04). The placement pipeline decides which monsters a level holds and where
// (Spec 02, step 8, in rules/world/placement); the game brings them to life here. Bandits and rivals
// (Spec 02, step 10) become creatures too; traders, hermits and captives never fight and stay with the level.

import type { Rng } from '../core/rng.ts';
import type { Awareness } from '../rules/combat/awareness.ts';
import type { Speed, StatusEffect } from '../rules/magic/status.ts';
import { npcRating } from '../rules/world/depth.ts';
import type { Level, Loot, MonsterRole, PlacedMonster } from '../rules/world/level.ts';

export type { Speed };
export type CreatureKind = 'monster' | 'bandit' | 'rival' | 'ally';
/** The three kinds of ally (Spec 04, Addendum A): a raised creature, the Beastmaster's companion, the Illusionist's phantom. */
export type AllyKind = 'raised' | 'companion' | 'phantom';

/** Shots a skirmisher (or a hostile rival) carries before it closes in (Spec 04, task 2.7). */
export const SKIRMISHER_SHOTS = 6;

export interface Monster {
  id: number;
  name: string;
  glyph: string;
  colour: number;
  x: number;
  y: number;
  /** Dice left (health). The monster dies at zero. */
  dice: number;
  /** Dice it started with: its rating (Spec 02), shown as "3d6+1". */
  maxDice: number;
  modifier: number;
  speed: Speed;
  /** One of the six behaviours (Spec 04), or `stub` for the Phase 2 stub rows, which fight as brutes. */
  behaviour: string;
  kind: CreatureKind;
  role: MonsterRole;
  /** Never flees: undead, constructs and bosses (Spec 04, Morale). */
  fearless: boolean;
  /** A row tagged undead: Turn Undead reaches it (Spec 04). */
  undead: boolean;
  /** Stunned by a mace: it loses its next action (Spec 05). */
  stunned: boolean;
  /** Active status effects (Spec 04, "Status effects"). */
  statuses: StatusEffect[];
  awareness: Awareness;
  /** Rounds spent alert with the player out of sight (Spec 04, Awareness). */
  lost: number;
  /** Fleeing (morale, a bandit's second theft) until out of sight for 20 rounds. */
  fleeing: boolean;
  /** Rounds spent fleeing with the player out of sight. */
  fleeLost: number;
  /** Ranged shots left; casters ignore it. */
  shots: number;
  /** An ambusher's first attack is still to come (advantage). */
  ambush: boolean;
  /** What it carries: stolen gold, or a rival's loot. Dropped where it dies. */
  carried: Loot[];
  thefts: number;
  /** False for a rival until it is attacked. */
  hostile: boolean;
  /** Monsters placed together share a group; a pack wakes together. */
  group: number;
  /** Where it was placed: unaware creatures wander within 3 cells of here. */
  home: { x: number; y: number };
  /** The quest whose opponent it is: its death meets that quest's goal (Spec 07, task 2.11). */
  quest?: string;
  /** Which kind of ally it is, for a creature on the player's side (`kind: 'ally'`; Spec 04, Addendum A). */
  ally?: AllyKind;
  /** Rounds left before a raised ally crumbles or a phantom vanishes, counting the round it came. */
  expires?: number;
  /** The final boss on level 100 (Spec 02, Addendum A), and whether the artifact seals have been counted against it. */
  final?: boolean;
  sealed?: boolean;
  /** The named rival's link (Spec 02, Addendum A): one rival across its appearances. */
  link?: string;
}

/** Colour names used by the monster tables (Spec 08), as 24-bit colours; any other name draws light grey. */
export const MONSTER_COLOURS: Readonly<Record<string, number>> = {
  moss: 0x7fc75a,
  rust: 0xc0703c,
  bone: 0xe0d8b8,
  ochre: 0xd0a030,
  slate: 0x8a98b0,
  azure: 0x58a8e8,
  violet: 0xb870e0,
  ember: 0xf08030,
  ivory: 0xf4f0e0,
  blood: 0xe04848,
  ash: 0xa8a0a0,
};
export const DEFAULT_MONSTER_COLOUR = 0xc8c8c8;
/** Bandits and rivals have no table row; they draw as B and R. */
export const BANDIT = { glyph: 'B', colour: 0xd06a5a } as const;
export const RIVAL = { glyph: 'R', colour: 0x6ab0d0 } as const;
/** Allies draw in the ally colour (Spec 04, Addendum A); the companion as d and the phantom as @ (task 3.8). */
export const ALLY_COLOUR = 0xe0c050;
export const COMPANION_GLYPH = 'd';
export const PHANTOM_GLYPH = '@';

/** True for a creature on the player's side. */
export const isAlly = (m: Monster): boolean => m.kind === 'ally';

/** "3d6+1", "d6", "2d6-1" (Spec 01 target block). */
export function ratingText(m: Pick<Monster, 'maxDice' | 'modifier'>): string {
  const dice = m.maxDice === 1 ? 'd6' : `${m.maxDice}d6`;
  return m.modifier === 0 ? dice : `${dice}${m.modifier > 0 ? '+' : ''}${m.modifier}`;
}

/** A creature with every field at rest; callers override what differs. */
export function creature(base: Pick<Monster, 'id' | 'name' | 'glyph' | 'colour' | 'x' | 'y' | 'dice' | 'modifier'> & Partial<Monster>): Monster {
  return {
    maxDice: base.dice,
    speed: 'normal',
    behaviour: 'brute',
    kind: 'monster',
    role: 'normal',
    fearless: false,
    undead: false,
    stunned: false,
    statuses: [],
    awareness: 'unaware',
    lost: 0,
    fleeing: false,
    fleeLost: 0,
    shots: SKIRMISHER_SHOTS,
    ambush: false,
    carried: [],
    thefts: 0,
    hostile: true,
    group: 0,
    home: { x: base.x, y: base.y },
    ...base,
  };
}

/**
 * The monster a placed one becomes when the level is first entered, at full health. It starts asleep or
 * unaware by a 1 in 2 roll; ambushers start unaware, and bosses and bandits are handled by the turn loop
 * when the player comes into their room or sight (Spec 04, clarifications of task 2.7).
 */
export const spawn = (p: PlacedMonster, id: number, rng?: Rng): Monster => {
  const ambusher = p.behaviour === 'ambusher';
  const roll = rng ? rng.oneIn(2) : false; // always consume one value per monster so the stream stays aligned
  return creature({
    id,
    name: p.name,
    glyph: p.glyph,
    colour: MONSTER_COLOURS[p.colour] ?? DEFAULT_MONSTER_COLOUR,
    x: p.x,
    y: p.y,
    dice: p.dice,
    modifier: p.modifier,
    speed: p.speed,
    behaviour: p.behaviour,
    role: p.role,
    fearless: p.fearless === true || p.role === 'boss',
    undead: p.undead === true,
    awareness: ambusher || p.role === 'boss' ? 'unaware' : roll ? 'asleep' : 'unaware',
    ambush: ambusher,
    group: p.group,
    // A boss carries its artifact and drops it where it dies (Spec 05, task 2.9).
    carried: [...(p.artifact ? [{ kind: 'artifact' as const, id: p.artifact.id, name: p.artifact.name }] : []), ...(p.liftToken ? [{ kind: 'lift_token' as const }] : [])],
    ...(p.quest ? { quest: p.quest } : {}),
    ...(p.final ? { final: true } : {}),
  });
};

/** Every monster the level was generated with, then its bandits and rivals, ready to play. */
export function spawnAll(level: Level, rng?: Rng): Monster[] {
  const monsters = level.monsters.map((m, i) => spawn(m, i, rng));
  const { dice, modifier } = npcRating(level.depth);
  level.npcs.forEach((npc, i) => {
    if (npc.kind !== 'bandit' && npc.kind !== 'rival') return;
    const rival = npc.kind === 'rival';
    monsters.push(
      creature({
        id: level.monsters.length + i,
        name: npc.name,
        glyph: (rival ? RIVAL : BANDIT).glyph,
        colour: (rival ? RIVAL : BANDIT).colour,
        x: npc.x,
        y: npc.y,
        dice,
        modifier,
        kind: npc.kind,
        behaviour: rival ? 'skirmisher' : 'brute',
        hostile: !rival,
        ...(rival && npc.link ? { link: npc.link } : {}),
      }),
    );
  });
  return monsters;
}
