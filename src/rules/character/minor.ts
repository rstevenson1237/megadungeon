// Minor ability draws (Spec 03, Minor abilities): one at random from the class pool at each
// level from 2 to 10, seeded so a character always draws the same ones.

import { createRng, hash32, type Rng } from '../../core/rng.ts';
import type { Character, ClassDef, MinorAbilityDef } from './character.ts';

/** The levels that draw a minor ability: 2 to 10, so nine draws in all (Spec 03). */
export const FIRST_DRAW_LEVEL = 2;
export const LAST_DRAW_LEVEL = 10;

/** The generator for one draw: fixed by the run seed, the character and the level (Spec 03, Draws are seeded). */
export function minorRng(runSeed: number, character: Pick<Character, 'name' | 'classId'>, level: number): Rng {
  return createRng(hash32('minor', runSeed >>> 0, character.name, character.classId, level));
}

/** Entries the character may still draw: stackable ones always, the rest until drawn once. */
export function eligibleMinors(character: Pick<Character, 'minorAbilities'>, cls: ClassDef): MinorAbilityDef[] {
  return cls.minorAbilities.filter((a) => a.stackable === true || !character.minorAbilities.includes(a.id));
}

/** Draw one minor ability for `level` and record it; null when the level draws none or nothing is left. */
export function drawMinor(runSeed: number, character: Character, cls: ClassDef, level: number): MinorAbilityDef | null {
  if (level < FIRST_DRAW_LEVEL || level > LAST_DRAW_LEVEL) return null;
  const eligible = eligibleMinors(character, cls);
  if (eligible.length === 0) return null;
  const drawn = minorRng(runSeed, character, level).pick(eligible);
  character.minorAbilities.push(drawn.id);
  return drawn;
}
