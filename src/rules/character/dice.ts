// Dice steps and roll resolution (Spec 03, "Stats and dice pools" and "Resolving rolls").
// Rules only: results and numbers come back, nothing is drawn here.

import type { Rng } from '../../core/rng.ts';

/** The five die steps; no pool passes d12 (Spec 03). */
export const STEPS = [4, 6, 8, 10, 12] as const;
export type Step = (typeof STEPS)[number];

/** The three stats, each a pool of identical dice (Spec 03). */
export const POOL_NAMES = ['combat', 'skill', 'magic'] as const;
export type PoolName = (typeof POOL_NAMES)[number];

/** No pool holds more than this many dice (Spec 03, Pool size). */
export const MAX_POOL_DICE = 6;

/** One stat: every die shares the step; `dice` is what is left, `max` what the pool holds when full. */
export interface Pool {
  step: Step;
  dice: number;
  max: number;
}

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

/** The next step up, capped at d12. */
export function stepUp(step: Step): Step {
  return STEPS[Math.min(STEPS.indexOf(step) + 1, STEPS.length - 1)]!;
}

/**
 * One die of `sides`. Advantage rolls two and keeps the higher, disadvantage keeps the lower;
 * at most one die is ever lost however many are rolled (Spec 03, Advantage and disadvantage).
 */
export function rollFace(rng: Rng, sides: number, mode: RollMode = 'normal'): number {
  const first = rng.int(1, sides);
  if (mode === 'normal') return first;
  const second = rng.int(1, sides);
  return mode === 'advantage' ? Math.max(first, second) : Math.min(first, second);
}

/**
 * The four roll types that use a single pool die; melee is an opposed roll (Spec 04) and is
 * resolved by comparing totals.
 */
export type RollType = 'check' | 'skill' | 'spell' | 'ranged';

/** What a face means for a roll type (Spec 03, Resolving rolls). */
export interface FaceOutcome {
  /** A success, or a hit for a ranged attack. */
  success: boolean;
  /** The die rolled is lost (skill uses, spells and ranged attacks only). */
  dieLost: boolean;
  /** A 1 on a check adds a negative effect (Spec 06 tables). */
  negative: boolean;
}

/** 4 or more succeeds; 2 to 3 is a failure on a check and a success that costs the die otherwise; 1 fails. */
export function classifyFace(type: RollType, face: number): FaceOutcome {
  const costs = type !== 'check';
  if (face >= 4) return { success: true, dieLost: false, negative: false };
  if (face >= 2) return { success: costs, dieLost: costs, negative: false };
  return { success: false, dieLost: costs, negative: !costs };
}

export interface RollResult extends FaceOutcome {
  /** The face kept after advantage or disadvantage. */
  face: number;
  /** The roll was made from an empty pool, so at disadvantage. */
  fromEmpty: boolean;
}

/**
 * Roll one die from a pool and spend it where the roll type says so. An empty pool rolls at the
 * stat's step with disadvantage whatever else applies, and with no die to lose a 2 to 3 or a 1
 * costs nothing further (Spec 03, Empty pools).
 */
export function rollPool(rng: Rng, pool: Pool, type: RollType, mode: RollMode = 'normal'): RollResult {
  const fromEmpty = pool.dice <= 0;
  const face = rollFace(rng, pool.step, fromEmpty ? 'disadvantage' : mode);
  const outcome = classifyFace(type, face);
  if (outcome.dieLost) {
    if (fromEmpty) outcome.dieLost = false;
    else pool.dice--;
  }
  return { ...outcome, face, fromEmpty };
}
