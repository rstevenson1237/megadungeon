// The pack and the equipment slots (Spec 05, "Equipment slots and inventory"): how many slots things use,
// how stacks merge, what a full pack refuses, and how equipping works. Pure rules over plain data.

import type { AmmoType } from '../../core/catalog.ts';
import { EQUIP_SLOTS, isCursed, type Equipment, type EquipSlot, type Item } from './types.ts';

/** Units per inventory slot (Spec 05). */
export const PER_SLOT = { coins: 100, gems: 100, ammo: 20, keys: 10, lockpicks: 10, potions: 5 } as const;

/** The pack starts at 12 slots, and each Pack Mule drawn adds 2 (Spec 03, Spec 05). */
export const PACK_BASE = 12;
export const PACK_MULE_SLOTS = 2;

export const packCapacity = (minorAbilities: readonly string[]): number => PACK_BASE + PACK_MULE_SLOTS * minorAbilities.filter((id) => id === 'pack_mule').length;

/** What the pack holds: coins as a count, everything else as items. Equipment is separate and uses no slots. */
export interface Carried {
  coins: number;
  pack: Item[];
}

/** Whether an unequipped piece of gear is large: two-handed weapons and plate take 2 slots (Spec 05). */
const isLarge = (item: Item): boolean => (item.kind === 'weapon' || item.kind === 'armour' || item.kind === 'shield' || item.kind === 'ranged') && (item.large === true || item.hands === 2);

/** Inventory slots in use: coins and gems by hundreds, ammunition per type by twenties, keys by tens, potions per kind by fives, the rest one each. */
export function slotsUsed(c: Carried): number {
  let slots = Math.ceil(c.coins / PER_SLOT.coins);
  let gems = 0;
  let keys = 0;
  let lockpicks = 0;
  const ammo = new Map<AmmoType, number>();
  const potions = new Map<string, number>();
  for (const item of c.pack) {
    switch (item.kind) {
      case 'gem':
        gems++;
        break;
      case 'key':
        keys += item.count;
        break;
      case 'vault_key':
        keys++;
        break;
      case 'lockpicks':
        lockpicks += item.count;
        break;
      case 'ammo':
        ammo.set(item.ammo, (ammo.get(item.ammo) ?? 0) + item.count);
        break;
      case 'potion':
        potions.set(item.id, (potions.get(item.id) ?? 0) + item.count);
        break;
      default:
        slots += isLarge(item) ? 2 : 1;
    }
  }
  slots += Math.ceil(gems / PER_SLOT.gems) + Math.ceil(keys / PER_SLOT.keys) + Math.ceil(lockpicks / PER_SLOT.lockpicks);
  for (const n of ammo.values()) slots += Math.ceil(n / PER_SLOT.ammo);
  for (const n of potions.values()) slots += Math.ceil(n / PER_SLOT.potions);
  return slots;
}

export const freeSlots = (c: Carried, capacity: number): number => capacity - slotsUsed(c);

/** The stack an item joins: the same kind of potion, the same ammunition, plain keys, lockpicks. */
function stackWith(pack: readonly Item[], item: Item): Item | undefined {
  switch (item.kind) {
    case 'potion':
      return pack.find((p) => p.kind === 'potion' && p.id === item.id);
    case 'ammo':
      return pack.find((p) => p.kind === 'ammo' && p.ammo === item.ammo);
    case 'key':
      return pack.find((p) => p.kind === 'key');
    case 'lockpicks':
      return pack.find((p) => p.kind === 'lockpicks');
    default:
      return undefined;
  }
}

const countOf = (item: Item): number => ('count' in item ? item.count : 1);

/**
 * Put an item in the pack. A stack takes as many as fit and the rest is left; anything else goes in whole or
 * not at all. Returns how many were taken (a full pack refuses: 0).
 */
export function addToPack(c: Carried, capacity: number, item: Item): number {
  const want = countOf(item);
  const existing = stackWith(c.pack, item);
  const fits = (n: number): boolean => {
    const trial: Item[] = existing ? c.pack.map((p) => (p === existing ? ({ ...p, count: countOf(p) + n } as Item) : p)) : [...c.pack, { ...item, ...('count' in item ? { count: n } : {}) } as Item];
    return slotsUsed({ coins: c.coins, pack: trial }) <= capacity;
  };
  // Slots used only rise with the count, so search for the most that fits.
  let lo = 0;
  let hi = want;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (fits(mid)) lo = mid;
    else hi = mid - 1;
  }
  if (lo === 0) return 0;
  if (existing && 'count' in existing) existing.count += lo;
  else c.pack.push('count' in item ? ({ ...item, count: lo } as Item) : item);
  return lo;
}

/** Add coins up to what the pack has room for. Returns how many were taken. */
export function addCoins(c: Carried, capacity: number, amount: number): number {
  const others = slotsUsed({ coins: 0, pack: c.pack });
  const most = Math.max(0, (capacity - others) * PER_SLOT.coins - c.coins);
  const taken = Math.min(amount, most);
  c.coins += taken;
  return taken;
}

/** Remove one unit of an item from the pack: a whole item, or a count off a stack. Returns the unit removed. */
export function takeFromPack(pack: Item[], item: Item, count = 1): Item | undefined {
  const i = pack.indexOf(item);
  if (i < 0) return undefined;
  if (!('count' in item) || item.count <= count) {
    pack.splice(i, 1);
    return item;
  }
  item.count -= count;
  return { ...item, count } as Item;
}

// --- Equipment ---

export type EquipOutcome = { ok: true; slot: EquipSlot; displaced: Item[] } | { ok: false; reason: string };

const twoHanded = (item: Item | undefined): boolean => item?.kind === 'weapon' && item.hands === 2;

/** The slot an item is worn in, or why it cannot be worn; rings take the first empty ring slot. */
export function slotFor(item: Item, equipment: Equipment): EquipSlot | string {
  switch (item.kind) {
    case 'weapon':
    case 'staff':
      return 'main';
    case 'ranged':
      return 'ranged';
    case 'armour':
      return 'body';
    case 'shield':
      return 'off';
    case 'ring':
      return !equipment.ring1 ? 'ring1' : !equipment.ring2 ? 'ring2' : 'Both ring slots are full.';
    case 'clothing':
    case 'artifact':
      if (item.slot !== 'ring') return item.slot;
      return !equipment.ring1 ? 'ring1' : !equipment.ring2 ? 'ring2' : 'Both ring slots are full.';
    default:
      return 'That cannot be worn or wielded.';
  }
}

/**
 * Equip an item from the pack. A two-handed weapon and a shield displace each other, and anything displaced goes
 * to the pack, which must have room. A cursed item in a slot to be vacated cannot be displaced (Spec 05).
 */
export function equip(c: Carried & { equipment: Equipment }, capacity: number, item: Item): EquipOutcome {
  if (!c.pack.includes(item)) return { ok: false, reason: 'You are not carrying that.' };
  const slot = slotFor(item, c.equipment);
  if (!(EQUIP_SLOTS as readonly string[]).includes(slot)) return { ok: false, reason: slot };
  const target = slot as EquipSlot;
  const vacate: EquipSlot[] = [target];
  if (twoHanded(item)) vacate.push('off');
  if (item.kind === 'shield' && twoHanded(c.equipment.main)) vacate.push('main');
  const displaced = vacate.map((s) => c.equipment[s]).filter((i): i is Item => i !== undefined);
  for (const old of displaced) {
    if (isCursed(old)) return { ok: false, reason: `You cannot remove your ${old.name}: it is cursed.` };
  }
  const pack = c.pack.filter((p) => p !== item).concat(displaced);
  if (slotsUsed({ coins: c.coins, pack }) > capacity) return { ok: false, reason: 'Your pack is full.' };
  for (const s of vacate) delete c.equipment[s];
  c.pack.splice(0, c.pack.length, ...pack);
  c.equipment[target] = item;
  return { ok: true, slot: target, displaced };
}

/** Take an item off into the pack; refused for a cursed item or a full pack. */
export function unequip(c: Carried & { equipment: Equipment }, capacity: number, slot: EquipSlot): EquipOutcome {
  const item = c.equipment[slot];
  if (!item) return { ok: false, reason: 'Nothing is there.' };
  if (isCursed(item)) return { ok: false, reason: `You cannot remove your ${item.name}: it is cursed.` };
  const pack = [...c.pack, item];
  if (slotsUsed({ coins: c.coins, pack }) > capacity) return { ok: false, reason: 'Your pack is full.' };
  delete c.equipment[slot];
  c.pack.push(item);
  return { ok: true, slot, displaced: [] };
}

/** Every equipped item with the slot it sits in. */
export const equipped = (e: Equipment): { slot: EquipSlot; item: Item }[] =>
  EQUIP_SLOTS.flatMap((slot) => (e[slot] ? [{ slot, item: e[slot]! }] : []));

/** Pieces of the given ammunition type the pack holds. */
export const ammoCount = (pack: readonly Item[], type: AmmoType): number =>
  pack.reduce((n, i) => n + (i.kind === 'ammo' && i.ammo === type ? i.count : 0), 0);

/** Spend one piece of ammunition; the stack goes when it empties. True if there was one. */
export function spendAmmo(pack: Item[], type: AmmoType): boolean {
  const stack = pack.find((i) => i.kind === 'ammo' && i.ammo === type);
  if (!stack || stack.kind !== 'ammo') return false;
  if (--stack.count <= 0) pack.splice(pack.indexOf(stack), 1);
  return true;
}
