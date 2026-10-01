// Melee resolution (Spec 03 "Resolving rolls", Spec 04 "Attacks"): the opposed roll.
// Only what task 1.8's stub fight needs; the full character and combat systems are
// tasks 2.5 and 2.7.

import type { Rng } from '../../core/rng.ts';

/**
 * Roll one die of `sides`. With disadvantage, roll two and keep the lower
 * (Spec 03 "Advantage and disadvantage").
 */
export function rollDie(rng: Rng, sides: number, disadvantage = false): number {
  const first = rng.int(1, sides);
  return disadvantage ? Math.min(first, rng.int(1, sides)) : first;
}

export interface MeleeOutcome {
  /** The defender loses a die. */
  defenderHit: boolean;
  /** The attacker loses a die. */
  attackerHit: boolean;
}

/** The higher total hits the other side; a tie hits both (Spec 03, Melee). */
export function meleeOutcome(attackerTotal: number, defenderTotal: number): MeleeOutcome {
  return { defenderHit: attackerTotal >= defenderTotal, attackerHit: defenderTotal >= attackerTotal };
}

/** A monster's melee roll: d6 plus its modifier (Spec 04, Attacks). */
export const monsterRoll = (rng: Rng, modifier: number): number => rollDie(rng, 6) + modifier;
