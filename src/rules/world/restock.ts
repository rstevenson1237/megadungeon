// Restocking and wandering monsters (Spec 02, "Restocking and wandering monsters"; clarifications of task 2.12).
// Only monsters return; treasure never does. Pure arithmetic: the game layer places what these numbers call for.

import type { Level } from './level.ts';

/** A level regains 10% of its original monster budget for each 500 turns the player was away, up to 50%. */
export const RESTOCK_RATE = 0.1;
export const RESTOCK_PER_TURNS = 500;
export const RESTOCK_CAP = 0.5;
/** A wandering monster arrives with chance 1 in 200 each turn on a dungeon level. */
export const WANDER_ONE_IN = 200;

/** The original monster budget of a level: the ordinary monsters it was generated with (bosses, guards and opponents are not part of it). */
export const monsterBudget = (level: Pick<Level, 'monsters'>): number => level.monsters.filter((m) => m.role === 'normal').length;

/** The share of the budget that returns after `turnsAway` turns: 10% for each whole 500, at most 50%. */
export const restockShare = (turnsAway: number): number => Math.min(RESTOCK_CAP, RESTOCK_RATE * Math.floor(Math.max(0, turnsAway) / RESTOCK_PER_TURNS));

/**
 * How many monsters a revisit adds: that share of the budget, rounded, but never so many that the ordinary monsters
 * alive exceed the original budget, so a level never fills beyond what it was generated with.
 */
export function restockCount(budget: number, turnsAway: number, alive: number): number {
  return Math.max(0, Math.min(Math.round(budget * restockShare(turnsAway)), budget - alive));
}
