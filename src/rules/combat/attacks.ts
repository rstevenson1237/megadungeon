// The four attack kinds (Spec 04, "Attacks"). Each attack is its own exchange.
// Pure rules over a seeded generator; the game applies the hits.

import type { Rng } from '../../core/rng.ts';
import { rollFace, rollPool, type Pool, type RollMode, type RollResult } from '../character/dice.ts';
import { meleeOutcome, type MeleeOutcome } from './melee.ts';

/** The step and dice left of a pool, which is all a defence or Combat roll reads. */
export interface DieSource {
  step: number;
  dice: number;
}

/** One die from a pool, not spent; an empty pool rolls with disadvantage (Spec 03, Empty pools). */
export function poolDie(rng: Rng, pool: DieSource, mode: RollMode = 'normal'): number {
  return rollFace(rng, pool.step, pool.dice <= 0 ? 'disadvantage' : mode);
}

/** A monster's roll: d6 plus its modifier. Advantage is an ambusher's first attack; disadvantage an unaware defender's. */
export const monsterDie = (rng: Rng, modifier: number, mode: RollMode = 'normal'): number => rollFace(rng, 6, mode) + modifier;

export interface MeleeExchange extends MeleeOutcome {
  /** The totals rolled, attacker first. */
  attacker: number;
  defender: number;
}

/**
 * Player melee: one Combat die against the monster's d6 plus modifier. An unaware or asleep
 * monster rolls with disadvantage (Spec 04). Higher hits; a tie hits both.
 */
export function playerMelee(rng: Rng, combat: DieSource, monster: { modifier: number; unaware: boolean }): MeleeExchange {
  const attacker = poolDie(rng, combat);
  const defender = monsterDie(rng, monster.modifier, monster.unaware ? 'disadvantage' : 'normal');
  return { ...meleeOutcome(attacker, defender), attacker, defender };
}

/** Monster melee: d6 plus modifier against one Combat die. `ambush` is advantage on the first attack of an ambusher. */
export function monsterMelee(rng: Rng, monster: { modifier: number; ambush: boolean }, combat: DieSource): MeleeExchange {
  const attacker = monsterDie(rng, monster.modifier, monster.ambush ? 'advantage' : 'normal');
  const defender = poolDie(rng, combat);
  return { ...meleeOutcome(attacker, defender), attacker, defender };
}

/** Two creatures fighting each other (a rival and a monster): both roll d6 plus modifier. */
export function creatureMelee(rng: Rng, a: { modifier: number; unaware?: boolean }, b: { modifier: number; unaware?: boolean }): MeleeExchange {
  const attacker = monsterDie(rng, a.modifier, a.unaware ? 'disadvantage' : 'normal');
  const defender = monsterDie(rng, b.modifier, b.unaware ? 'disadvantage' : 'normal');
  return { ...meleeOutcome(attacker, defender), attacker, defender };
}

/**
 * Player ranged: one Skill die as a skill use. 4 or more hits, 2 to 3 hits but the die is lost,
 * 1 misses and the die is lost. An adjacent target gives the attacker disadvantage.
 */
export function playerRanged(rng: Rng, skill: Pool, adjacent: boolean): RollResult {
  return rollPool(rng, skill, 'ranged', adjacent ? 'disadvantage' : 'normal');
}

/**
 * Monster ranged attack or spell: d6 plus modifier against one unspent Skill die (ranged) or Magic die
 * (spell) of the player. Only a higher total hits; a tie misses.
 */
export function monsterRanged(rng: Rng, modifier: number, defence: DieSource): { hit: boolean; attacker: number; defender: number } {
  const attacker = monsterDie(rng, modifier);
  const defender = poolDie(rng, defence);
  return { hit: attacker > defender, attacker, defender };
}

/** Morale (Spec 04): a creature reduced to one die rolls a d6 each round and flees on 1 or 2. */
export function failsMorale(rng: Rng, c: { dice: number; maxDice: number; fearless: boolean }): boolean {
  if (c.fearless || c.maxDice <= 1 || c.dice !== 1) return false;
  return rollFace(rng, 6) <= 2;
}

/** The gold a bandit takes in one theft: 10% of what is carried, rounded up and at least 1 (Spec 04, task 2.7). */
export const theftAmount = (carried: number): number => (carried <= 0 ? 0 : Math.max(1, Math.ceil(carried * 0.1)));

/** Thefts after which a bandit flees (Spec 04). */
export const THEFTS_BEFORE_FLEEING = 2;
