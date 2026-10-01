// Awareness and stealth (Spec 04, "Awareness and stealth", and the clarifications of task 2.7).
// Pure rules: whether a roll or an event changes a creature's state. The game applies the result.

import type { Rng } from '../../core/rng.ts';
import { rollFace } from '../character/dice.ts';

export type Awareness = 'asleep' | 'unaware' | 'alert';

/** A sleeping or unaware creature notices the player within this many cells, in sight. */
export const NOTICE_RANGE = 8;
/** The d6 roll that wakes a sleeper (6) or alerts an unaware creature (4 or more). */
export const NOTICE_TARGET: Record<'asleep' | 'unaware', number> = { asleep: 6, unaware: 4 };
/** Combat within this many cells alerts a creature in that state. */
export const COMBAT_RADIUS: Record<'asleep' | 'unaware', number> = { asleep: 3, unaware: 6 };
/** An alert creature loses track after this many rounds with the player out of sight. */
export const LOSE_TRACK_ROUNDS = 20;

/** The once-a-round notice roll. A stealth buff gives the creature disadvantage on it. */
export function noticeRoll(rng: Rng, state: 'asleep' | 'unaware', stealth = false): boolean {
  return rollFace(rng, 6, stealth ? 'disadvantage' : 'normal') >= NOTICE_TARGET[state];
}

/** Whether combat `distSq` (squared cells) away alerts a creature in this state. */
export const alertedByCombat = (state: Awareness, distSq: number): boolean =>
  state !== 'alert' && distSq <= COMBAT_RADIUS[state] ** 2;
