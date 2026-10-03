// Spells as the rules read them (Spec 04, "Spells" and "Starting spell list"): the table rows, the casting
// roll, and the draw of a class's starting spells. What each effect does to the level is the game layer's.

import { createRng, hash32 } from '../../core/rng.ts';
import type { ContentBundle, Spell } from '../../core/schemas.ts';
import type { Rng } from '../../core/rng.ts';
import { rollPool, type Pool, type RollMode, type RollResult } from '../character/dice.ts';
import type { Character, ClassDef } from '../character/character.ts';

export type { Spell };

/** Every spell in the bundle, in table order. */
export const spellsFrom = (bundle: ContentBundle): Spell[] => (bundle.tables.spells ?? []) as Spell[];

/** The straight-line reach of a spell in cells; a self spell without one acts on the caster alone. */
export const reachOf = (spell: Spell): number => spell.reach ?? 0;

/**
 * True when choosing the spell is the whole of casting: a self spell, or an area centred on the caster. Blink
 * is the one self spell that needs a cell, which the game asks for (Spec 04, task 2.8).
 */
export const resolvesAtOnce = (spell: Spell): boolean => spell.effect !== 'blink' && (spell.shape === 'self' || spell.centred === true);

/** Whether the effect needs a destination cell rather than a creature. */
export const needsCell = (spell: Spell): boolean => spell.effect === 'blink';

/**
 * The spell roll (Spec 03): one Magic die. 4 or more works; 2 to 3 works and the die is lost; 1 fails and the
 * die is lost. An empty pool rolls with disadvantage and loses nothing. `lossFree` is the Mage's Arcane Bolt:
 * a 2 to 3 costs no die. `mode` is plate armour's disadvantage or a staff's advantage (Spec 05).
 */
export function castRoll(rng: Rng, magic: Pool, lossFree = false, mode: RollMode = 'normal'): RollResult {
  const before = magic.dice;
  const result = rollPool(rng, magic, 'spell', mode);
  if (lossFree && result.success && result.dieLost) {
    magic.dice = before;
    result.dieLost = false;
  }
  return result;
}

/** The generator for a class's starting spells: fixed by the run seed, the character and the class (Spec 04, task 2.8). */
export const startingSpellsRng = (runSeed: number, character: Pick<Character, 'name' | 'classId'>): Rng =>
  createRng(hash32('spells', runSeed >>> 0, character.name, character.classId));

/**
 * The spells a new character of the class knows: its guaranteed spell, then random ones from the starting
 * list with no repeats, up to the class's count. Classes with no `spells` entry start with none.
 */
export function startingSpells(runSeed: number, character: Pick<Character, 'name' | 'classId'>, cls: Pick<ClassDef, 'spells'>, all: readonly Spell[]): string[] {
  if (!cls.spells) return [];
  const known: string[] = [];
  const always = cls.spells.always;
  if (always) known.push(always);
  const rng = startingSpellsRng(runSeed, character);
  // The draw is from the starting list (Spec 04); a table with none tagged draws from every row.
  const listed = all.filter((s) => s.tags?.includes('starting'));
  const rest = rng.shuffle((listed.length > 0 ? listed : all).map((s) => s.id).filter((id) => id !== always));
  while (known.length < cls.spells.count && rest.length > 0) known.push(rest.shift()!);
  return known;
}
