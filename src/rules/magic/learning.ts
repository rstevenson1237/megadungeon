// Learning spells from books (Spec 04, "Spells"): reading one is a Magic check. Rules only; the game
// layer decides what a round costs and applies the curse.

import type { Rng } from '../../core/rng.ts';
import { rollPool, type Pool, type RollMode } from '../character/dice.ts';

/** A spellbook: one spell, and the rest count at which it last failed (it cannot be retried until the next rest). */
export interface Spellbook {
  spell: string;
  failedAtRest?: number;
}

/** How long a destroyed book leaves the reader Cursed (Spec 06). */
export const BOOK_CURSE_ROUNDS = 20;

export type ReadOutcome =
  /** 4 or more: the spell is known for good, and the book is used up. */
  | { kind: 'learned' }
  /** 2 to 3: no luck; try again after the next village rest. */
  | { kind: 'failed' }
  /** 1: the book is destroyed and the reader is Cursed for 20 rounds (Spec 06, negative effects). */
  | { kind: 'destroyed' }
  /** Already tried since the last rest; nothing rolled. */
  | { kind: 'wait' }
  /** The spell is known already; nothing rolled and the book is kept. */
  | { kind: 'known' };

/** What reading reads from the reader: the Magic pool, the spells known, village rests taken, and Blessed or Cursed. */
export interface Reader {
  magic: Pool;
  spells: string[];
  /** Village rests taken so far. */
  rests: number;
  mode: RollMode;
  /** Scholar: a 2 to 3 learns the spell as well as a 4 or more (Spec 03, Addendum A). */
  scholar?: boolean;
}

/** Whether a book can be read now: the spell is known already, the book is waiting for a rest, or it is ready. */
export function readiness(book: Spellbook, reader: Pick<Reader, 'spells' | 'rests'>): 'ready' | 'known' | 'wait' {
  if (reader.spells.includes(book.spell)) return 'known';
  if (book.failedAtRest !== undefined && reader.rests <= book.failedAtRest) return 'wait';
  return 'ready';
}

/**
 * Read a spellbook: a Magic check (a check costs no die). A learned spell joins `reader.spells`; a failure
 * records the rest count on the book; a 1 destroys it. A Scholar learns on 2 to 3 as well.
 */
export function readSpellbook(rng: Rng, book: Spellbook, reader: Reader): ReadOutcome {
  const ready = readiness(book, reader);
  if (ready !== 'ready') return { kind: ready };
  const roll = rollPool(rng, reader.magic, 'check', reader.mode);
  if (roll.success || (reader.scholar === true && !roll.negative)) {
    reader.spells.push(book.spell);
    return { kind: 'learned' };
  }
  if (roll.negative) return { kind: 'destroyed' };
  book.failedAtRest = reader.rests;
  return { kind: 'failed' };
}
