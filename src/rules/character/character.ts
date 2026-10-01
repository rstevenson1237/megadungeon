// The character (Spec 03): three dice pools, a level and XP, and the minor abilities drawn so far.
// Plain serialisable data (Spec 09); classes arrive as data (task 2.6 reads them from the content tables).

import { POOL_NAMES, type Pool, type PoolName, type Step } from './dice.ts';

/** One entry of a class's minor ability pool (Spec 03, Minor abilities). Effects belong to later tasks. */
export interface MinorAbilityDef {
  id: string;
  /** Shown in the level-up message; the id until the content table gives one. */
  name?: string;
  /** May be drawn more than once (such as Pack Mule); everything else at most once per character. */
  stackable?: boolean;
}

/** The levels at which a class steps one pool (Spec 03, Classes). */
export const STEP_LEVELS = [4, 7, 9] as const;
export type StepLevel = (typeof STEP_LEVELS)[number];

/** What the rules need from a class: starting steps, step changes and its minor ability pool. */
export interface ClassDef {
  id: string;
  name: string;
  /** The major ability every character of the class has from level 1 (Spec 03); its effect is code (Specs 04, 05). */
  majorAbility: { id: string; name: string; text: string };
  /** Starting step of each pool; the two allowed arrays are all d6, or one each of d4, d6 and d8. */
  start: Record<PoolName, Step>;
  /** The pool that steps up one at each of levels 4, 7 and 9. */
  steps: Record<StepLevel, PoolName>;
  minorAbilities: readonly MinorAbilityDef[];
  /** Spells known at level 1, and the one the class always has (Spec 04); none when absent. */
  spells?: { count: number; always?: string };
  /** Starting equipment: base or magic item ids, with a count for a stack (Spec 05). */
  gear?: { id: string; count?: number }[];
}

export interface Character {
  name: string;
  classId: string;
  /** 1 to 10; XP keeps counting past level 10 as the high score. */
  level: number;
  xp: number;
  pools: Record<PoolName, Pool>;
  /** Minor abilities drawn, in order; a stackable one appears once per draw. */
  minorAbilities: string[];
  /** Consecutive rounds of waiting so far (Spec 03, Waiting). */
  waited: number;
}

/** A level 1 character: one full die per pool at the class's starting steps (Spec 03, Character creation). */
export function createCharacter(name: string, cls: ClassDef): Character {
  const pools = {} as Record<PoolName, Pool>;
  for (const pool of POOL_NAMES) pools[pool] = { step: cls.start[pool], dice: 1, max: 1 };
  return { name, classId: cls.id, level: 1, xp: 0, pools, minorAbilities: [], waited: 0 };
}

/** Dice a character holds in total, counting the level 1 start (a level 10 character has 12). */
export const totalDice = (c: Character): number => POOL_NAMES.reduce((n, p) => n + c.pools[p].max, 0);
