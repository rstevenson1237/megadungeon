// Starting gear (Spec 05, "Prices, shops and starting gear"): a class's `gear` list made into items, with the
// weapons, armour and shield wielded and worn and everything else in the pack.

import { createRng, hash32 } from '../../core/rng.ts';
import { makeGear } from './gear.ts';
import { equip, packCapacity } from './inventory.ts';
import { type ItemData, makeAmmo, makeMagicItem } from './magic.ts';
import type { Equipment, Item } from './types.ts';

/** One entry of a class's starting gear: a base or magic item id, with a count for a stack. */
export interface GearEntry {
  id: string;
  count?: number;
}

export interface Kit {
  pack: Item[];
  equipment: Equipment;
}

/** What a new character carries: the gear made at normal quality, then equipped in the order ranged, armour, weapon, shield. */
export function startingKit(gear: readonly GearEntry[], data: ItemData, runSeed = 0, minorAbilities: readonly string[] = []): Kit {
  const pack: Item[] = [];
  gear.forEach((entry, i) => {
    const uid = hash32('kit', runSeed >>> 0, entry.id, i);
    const base = data.bases.get(entry.id);
    if (base) {
      pack.push(base.type === 'ammo' ? makeAmmo(base, uid, entry.count ?? base.per!) : makeGear(base, uid));
      return;
    }
    const row = data.magic.get(entry.id);
    if (!row) throw new RangeError(`starting gear "${entry.id}" is not in the tables`);
    const item = makeMagicItem(row, uid, createRng(uid), data);
    if (item.kind === 'potion') item.count = entry.count ?? 1;
    pack.push(item);
  });
  const kit: Kit = { pack, equipment: {} };
  const capacity = packCapacity(minorAbilities);
  const first = (pred: (i: Item) => boolean): Item | undefined => kit.pack.find(pred);
  for (const pick of [
    first((i) => i.kind === 'ranged'),
    first((i) => i.kind === 'armour'),
    first((i) => i.kind === 'weapon'),
    first((i) => i.kind === 'shield'),
  ]) {
    if (pick) equip({ coins: 0, pack: kit.pack, equipment: kit.equipment }, capacity, pick);
  }
  return kit;
}
