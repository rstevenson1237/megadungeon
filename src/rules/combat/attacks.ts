// The four attack kinds (Spec 04, "Attacks"). Each attack is its own exchange.
// Pure rules over a seeded generator; the game applies the hits.

import type { Rng } from '../../core/rng.ts';
import { combineModes, rollFace, rollPool, type Pool, type RollMode, type RollResult } from '../character/dice.ts';
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
 * monster rolls with disadvantage (Spec 04). Higher hits; a tie hits both. `mode` is any other advantage on the
 * player's die, such as Hallowed against the undead (Spec 03, Addendum A).
 */
export function playerMelee(rng: Rng, combat: DieSource, monster: { modifier: number; unaware: boolean; asleep?: boolean; mode?: RollMode }, attackMod = 0, mode: RollMode = 'normal'): MeleeExchange {
  // Melee against an Asleep creature has advantage (Spec 04, Status effects). The weapon's modifier adds to the die (Spec 05).
  const attacker = poolDie(rng, combat, combineModes(monster.asleep ? 'advantage' : 'normal', mode)) + attackMod;
  // `monster.mode` is a mode on all of the creature's rolls against the player, such as a boss's known weakness (Spec 02, Addendum A).
  const defender = monsterDie(rng, monster.modifier, combineModes(monster.unaware ? 'disadvantage' : 'normal', monster.mode ?? 'normal'));
  return { ...meleeOutcome(attacker, defender), attacker, defender };
}

/**
 * Monster melee: d6 plus modifier against one Combat die. `ambush` is advantage on the first attack of an
 * ambusher, and so is attacking a player who is Asleep. `defenceMode` is advantage on the player's die (Hallowed),
 * and `penalty` what the monster's roll loses (Sanctuary; Spec 03, Addendum A).
 */
export function monsterMelee(
  rng: Rng,
  monster: { modifier: number; ambush: boolean; mode?: RollMode },
  combat: DieSource,
  playerAsleep = false,
  defenceMod = 0,
  defenceMode: RollMode = 'normal',
  penalty = 0,
): MeleeExchange {
  const attacker = monsterDie(rng, monster.modifier, combineModes(monster.ambush || playerAsleep ? 'advantage' : 'normal', monster.mode ?? 'normal')) - penalty;
  // Armour and shield modifiers add to the player's die when defending against melee only (Spec 05).
  const defender = poolDie(rng, combat, defenceMode) + defenceMod;
  return { ...meleeOutcome(attacker, defender), attacker, defender };
}

/** Two creatures fighting each other (a rival and a monster): both roll d6 plus modifier. */
export function creatureMelee(rng: Rng, a: { modifier: number; unaware?: boolean }, b: { modifier: number; unaware?: boolean; asleep?: boolean }): MeleeExchange {
  const attacker = monsterDie(rng, a.modifier, a.unaware ? 'disadvantage' : b.asleep ? 'advantage' : 'normal');
  const defender = monsterDie(rng, b.modifier, b.unaware ? 'disadvantage' : 'normal');
  return { ...meleeOutcome(attacker, defender), attacker, defender };
}

/**
 * Player ranged: one Skill die as a skill use. 4 or more hits, 2 to 3 hits but the die is lost,
 * 1 misses and the die is lost. An adjacent target gives the attacker disadvantage, and so does a tower shield
 * (`disadvantage`); both together are still one disadvantage.
 */
export function playerRanged(rng: Rng, skill: Pool, adjacent: boolean, disadvantage = false): RollResult {
  return rollPool(rng, skill, 'ranged', adjacent || disadvantage ? 'disadvantage' : 'normal');
}

/**
 * Monster ranged attack or spell: d6 plus modifier against one unspent Skill die (ranged) or Magic die
 * (spell) of the player. Only a higher total hits; a tie misses.
 */
export function monsterRanged(rng: Rng, modifier: number, defence: DieSource, mode: RollMode = 'normal'): { hit: boolean; attacker: number; defender: number } {
  const attacker = monsterDie(rng, modifier, mode);
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
