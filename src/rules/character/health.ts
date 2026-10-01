// Health, waiting and village rest (Spec 03, "Health, recovery and death").
// Combat dice are health; Skill and Magic dice are fuel. Only a village fully restores them.

import { POOL_NAMES, type Pool } from './dice.ts';

/** Consecutive rounds of waiting that restore one Combat die (Spec 03, Waiting). */
export const WAIT_ROUNDS_PER_DIE = 10;

/** The part of a character the health rules read. */
export interface Hurt {
  pools: { combat: Pool };
}

/**
 * A hit on the character removes one Combat die; a hit when none are left is fatal
 * (Spec 03, Melee and Health).
 */
export function hitCharacter(character: Hurt): 'hit' | 'killed' {
  const { combat } = character.pools;
  if (combat.dice <= 0) return 'killed';
  combat.dice--;
  return 'hit';
}

/**
 * Count one round of waiting. After `interval` consecutive rounds one Combat die comes back and
 * the count starts again; at full health the count stays at zero. Returns the new count and
 * whether a die was restored. Any action or move resets the count (the caller sets it to 0).
 */
export function waitRound(
  waited: number,
  combat: { dice: number; max: number },
  interval = WAIT_ROUNDS_PER_DIE,
): { waited: number; restored: boolean } {
  if (combat.dice >= combat.max) return { waited: 0, restored: false };
  if (waited + 1 < interval) return { waited: waited + 1, restored: false };
  combat.dice++;
  return { waited: 0, restored: true };
}

/** Restore dice to a pool, never past its maximum; returns how many came back. */
export function restoreDice(pool: Pool, count: number): number {
  const gained = Math.max(0, Math.min(count, pool.max - pool.dice));
  pool.dice += gained;
  return gained;
}

/** Village rest: every die in every pool is restored (Spec 03). The cost and the save belong to Spec 07 and 09. */
export function restAll(character: { pools: Record<(typeof POOL_NAMES)[number], Pool>; waited: number }): void {
  for (const name of POOL_NAMES) character.pools[name].dice = character.pools[name].max;
  character.waited = 0;
}
