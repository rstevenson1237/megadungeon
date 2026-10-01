// Status effects (Spec 04, "Status effects" and the clarifications of task 2.8). Pure rules over a plain list
// that sits on the player and on every monster: what is active, for how long, and what it changes.

import { STATUS_IDS, type StatusId } from '../../core/catalog.ts';
import type { Point } from '../world/level.ts';
import type { RollMode } from '../character/dice.ts';

export { STATUS_IDS };
export type { StatusId };

export type Speed = 'slow' | 'normal' | 'fast';

/** One active effect. Never two of the same id in a list (effects never stack). */
export interface StatusEffect {
  id: StatusId;
  /** Rounds left, counting the current one; null for an effect with no duration (poisoned, cursed). */
  rounds: number | null;
  /** Rounds poisoned since the last lost die. */
  clock: number;
  /** What a frightened creature runs from: the caster, or whatever scared the player. */
  source?: Point;
}

export const STATUS_NAMES: Readonly<Record<StatusId, string>> = {
  poisoned: 'Poisoned',
  slowed: 'Slowed',
  hasted: 'Hasted',
  asleep: 'Asleep',
  held: 'Held',
  frightened: 'Frightened',
  blessed: 'Blessed',
  cursed: 'Cursed',
};

/** A poisoned creature loses one Combat die every this many rounds (Spec 04). */
export const POISON_INTERVAL = 20;

export const hasStatus = (list: readonly StatusEffect[], id: StatusId): boolean => list.some((e) => e.id === id);

export const statusOf = (list: readonly StatusEffect[], id: StatusId): StatusEffect | undefined => list.find((e) => e.id === id);

/**
 * Apply an effect. One already there is not duplicated: it keeps the longer duration, and no duration
 * is the longest of all. Returns what happened, so a caller can log it.
 */
export function applyStatus(list: StatusEffect[], id: StatusId, rounds: number | null, source?: Point): 'added' | 'extended' | 'kept' {
  const have = statusOf(list, id);
  if (!have) {
    list.push({ id, rounds, clock: 0, ...(source ? { source: { ...source } } : {}) });
    return 'added';
  }
  if (source) have.source = { ...source };
  if (have.rounds === null || (rounds !== null && rounds <= have.rounds)) return 'kept';
  have.rounds = rounds;
  return 'extended';
}

/** Remove an effect; true if it was there. */
export function removeStatus(list: StatusEffect[], id: StatusId): boolean {
  const i = list.findIndex((e) => e.id === id);
  if (i < 0) return false;
  list.splice(i, 1);
  return true;
}

/**
 * End of a round, after every creature has acted: timed effects lose a round and end at zero. Returns
 * the effects that ended and whether a poisoned creature is due to lose a Combat die.
 */
export function tickStatuses(list: StatusEffect[]): { ended: StatusId[]; poisonDue: boolean } {
  const ended: StatusId[] = [];
  let poisonDue = false;
  for (const effect of list.slice()) {
    if (effect.id === 'poisoned' && ++effect.clock >= POISON_INTERVAL) {
      effect.clock = 0;
      poisonDue = true;
    }
    if (effect.rounds === null) continue;
    if (--effect.rounds <= 0) {
      removeStatus(list, effect.id);
      ended.push(effect.id);
    }
  }
  return { ended, poisonDue };
}

/**
 * How fast a creature acts: Hasted is fast and Slowed slow, and both together cancel to its own speed
 * (Spec 04, clarifications of task 2.8).
 */
export function effectiveSpeed(base: Speed, list: readonly StatusEffect[]): Speed {
  const hasted = hasStatus(list, 'hasted');
  const slowed = hasStatus(list, 'slowed');
  if (hasted === slowed) return base;
  return hasted ? 'fast' : 'slow';
}

/** Blessed gives advantage on checks and Cursed disadvantage; together they cancel (Spec 04, Spec 03). */
export function checkMode(list: readonly StatusEffect[]): RollMode {
  const blessed = hasStatus(list, 'blessed');
  const cursed = hasStatus(list, 'cursed');
  if (blessed === cursed) return 'normal';
  return blessed ? 'advantage' : 'disadvantage';
}

/** A creature that cannot act this round: asleep or held. */
export const cannotAct = (list: readonly StatusEffect[]): boolean => hasStatus(list, 'asleep') || hasStatus(list, 'held');

/** "Slowed 5", or "Poisoned" for an effect with no duration: one line of the Status block. */
export const describeStatus = (e: StatusEffect): string => (e.rounds === null ? STATUS_NAMES[e.id] : `${STATUS_NAMES[e.id]} ${e.rounds}`);
