// Depth scaling figures (Spec 02, "Depth scaling"). Starting values for playtesting.

import type { SizeClass } from './level.ts';

/** Nominal treasure budget of a level, in gp, before the up-to-50% variation: 50 + 10 x depth squared. */
export const treasureBudget = (depth: number): number => 50 + 10 * depth * depth;

/** Monster count range per size class (Spec 02, Depth scaling). */
export const MONSTER_COUNTS: Record<SizeClass, [number, number]> = {
  small: [8, 12],
  medium: [14, 20],
  large: [22, 30],
};

/** Rating ceiling in dice: 1 + depth / 5 rounded down, capped at 20 (Spec 02). */
export const ratingCeiling = (depth: number): number => Math.min(20, 1 + Math.floor(depth / 5));

/** A boss's rating is the ceiling plus 3 dice, capped at 20 (Spec 02). */
export const bossCeiling = (depth: number): number => Math.min(20, ratingCeiling(depth) + 3);

/** A monster table row's rating, "3d6+1": the dice (health) and the modifier (Spec 03, Monsters). */
export function parseRating(rating: string): { dice: number; modifier: number } {
  const m = /^(\d+)d\d+([+-]\d+)$/.exec(rating);
  if (!m) throw new RangeError(`bad rating: ${rating}`);
  return { dice: Number(m[1]), modifier: Number(m[2]) };
}

/** Counts a level places by size class, small / medium / large (Spec 02, clarifications of task 2.4). */
export type Range = readonly [number, number];
export const PLACEMENT_COUNTS = {
  containers: { small: [6, 10], medium: [10, 16], large: [16, 24] },
  fixtures: { small: [2, 4], medium: [3, 6], large: [5, 9] },
  debris: { small: [4, 8], medium: [6, 12], large: [10, 18] },
  floorTraps: { small: [3, 6], medium: [5, 10], large: [8, 16] },
} as const satisfies Record<string, Record<SizeClass, Range>>;

/**
 * A bandit's or rival's rating (Spec 04, clarifications of task 2.7): the level's rating ceiling in dice and a modifier
 * of depth / 15 (rounded down, capped at +6).
 */
export const npcRating = (depth: number): { dice: number; modifier: number } => ({
  dice: ratingCeiling(depth),
  modifier: Math.min(6, Math.floor(depth / 15)),
});
