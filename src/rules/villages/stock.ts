// What shops and traders sell (Spec 05, "Prices, shops and starting gear"; Spec 07, "Shops, appraiser and smith";
// clarifications of task 2.11). Stock is rolled from a seed, so the same village at the same rest count always holds
// the same things, and is kept on the player once rolled so a bought item stays bought.

import { createRng, hash32 } from '../../core/rng.ts';
import type { Spell } from '../../core/schemas.ts';
import { eligibleEntries, pickWeighted } from '../../core/roller.ts';
import { makeGear } from '../items/gear.ts';
import { type ItemData, makeAmmo, makeLockpicks, makeMagicItem } from '../items/magic.ts';
import type { Item, SpellbookItem } from '../items/types.ts';

/** Potions every shop sells (Spec 05); deeper shops add more kinds. */
export const SURFACE_POTIONS: readonly string[] = ['potion_healing', 'potion_clarity', 'potion_cure'];
/** A subterranean shop adds this many fine pieces, extra potion kinds and so on per village below the surface. */
export const FINE_PER_VILLAGE = 1;
/** One in this many subterranean shops stocks a spellbook, and what it costs at the surface. */
export const SPELLBOOK_ONE_IN = 3;
export const SPELLBOOK_PRICE = 150;
/** A lockpick bundle a deeper shop stocks. */
export const LOCKPICKS_SOLD = 3;
/** A trader sells this many things. */
export const TRADER_STOCK: readonly [number, number] = [3, 6];

const GEAR_TYPES = new Set(['melee', 'ranged', 'armour', 'shield']);

/** The stock of the shop of a village: `number` is how many villages lie below the surface down to this one (0 for the surface). */
export function shopStock(data: ItemData, spells: readonly Spell[], runSeed: number, depth: number, number: number, rests: number): Item[] {
  const seed = (...parts: (number | string)[]): number => hash32('shop', runSeed >>> 0, depth, rests, ...parts);
  const rng = createRng(seed('stock'));
  const items: Item[] = [];
  const bases = [...data.bases.values()];
  const gear = bases.filter((b) => GEAR_TYPES.has(b.type));
  gear.forEach((b, i) => items.push(makeGear(b, seed('gear', i), 'normal')));
  bases.filter((b) => b.type === 'ammo').forEach((b, i) => items.push(makeAmmo(b, seed('ammo', i), b.per!)));
  const potions = [...data.magic.values()].filter((m) => m.kind === 'potion');
  const surface = potions.filter((p) => SURFACE_POTIONS.includes(p.id));
  const others = potions.filter((p) => !SURFACE_POTIONS.includes(p.id));
  const makePotion = (row: (typeof potions)[number], i: number): Item => makeMagicItem(row, seed('potion', i), createRng(seed('potion-rng', i)), data);
  surface.forEach((p, i) => items.push(makePotion(p, i)));
  if (number > 0) {
    // Fine pieces: distinct bases, as many as villages below the surface.
    rng.shuffle(gear).slice(0, Math.min(gear.length, FINE_PER_VILLAGE * (number + 1))).forEach((b, i) => items.push(makeGear(b, seed('fine', i), 'fine')));
    rng.shuffle(others).slice(0, Math.min(others.length, number)).forEach((p, i) => items.push(makePotion(p, 10 + i)));
    const picks = data.bases.get('lockpicks');
    if (picks) items.push(makeLockpicks(picks, seed('picks'), LOCKPICKS_SOLD));
    if (spells.length > 0 && rng.oneIn(SPELLBOOK_ONE_IN)) {
      const spell = rng.pick(spells);
      const book: SpellbookItem = { kind: 'spellbook', uid: seed('book'), id: `spellbook_${spell.id}`, name: `Spellbook of ${spell.name}`, value: SPELLBOOK_PRICE, spell: spell.id };
      items.push(book);
    }
  }
  return items;
}

/** What a trader in the dungeon sells: 3 to 6 things, magic items among them (Spec 05, Spec 07), by depth and where it stands. */
export function traderStock(data: ItemData, runSeed: number, depth: number, x: number, y: number): Item[] {
  const rng = createRng(hash32('trader', runSeed >>> 0, depth, x, y));
  const count = rng.int(TRADER_STOCK[0], TRADER_STOCK[1]);
  const magic = eligibleEntries([...data.magic.values()], { depth });
  const gear = [...data.bases.values()].filter((b) => GEAR_TYPES.has(b.type) || b.type === 'ammo');
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    const uid = hash32('trader-item', runSeed >>> 0, depth, x, y, i);
    const row = rng.oneIn(2) ? pickWeighted(magic, rng) : undefined;
    if (row) items.push(makeMagicItem(row, uid, createRng(uid), data));
    else {
      const base = rng.pick(gear);
      items.push(base.type === 'ammo' ? makeAmmo(base, uid, base.per!) : makeGear(base, uid, 'normal'));
    }
  }
  return items;
}
