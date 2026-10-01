// Prices (Spec 05, "Prices, shops and starting gear" and the clarifications of task 2.9): what an item is
// worth, what a village charges and pays, and what its services cost. Pure arithmetic over `Item` values.

import { QUALITY_VALUE } from './gear.ts';
import type { Item } from './types.ts';

/** List prices rise 20% for each village below the surface (Spec 05). */
export const DEPTH_RISE = 0.2;

/** The multiplier of a village: 1 on the surface, and 1.2, 1.4 ... for each one below it, so the fifth below charges 200%. */
export const villageMultiplier = (villagesBelowSurface: number): number => 1 + DEPTH_RISE * villagesBelowSurface;

/** Shops pay half an item's value (Spec 05). */
export const SELL_RATE = 0.5;
/** The Fence minor ability adds 20% to what shops pay (Spec 03). */
export const FENCE_BONUS = 0.2;
/** Traders in the dungeon sell at 150% of value (Spec 05). */
export const TRADER_RATE = 1.5;
/** Identification costs about 100 gp at the surface, and repair about 30% of value (Spec 05). */
export const IDENTIFY_PRICE = 100;
export const REPAIR_RATE = 0.3;

/**
 * What an item is worth at the surface, in gp, before any multiplier: its base price times its quality
 * (crude half, normal one, fine three times), for a stack its units, and for a gem or jewelry its appraised value
 * or, unappraised, the base value. An artifact is priceless, which here is 0: it cannot be sold (Spec 05).
 */
export function itemValue(item: Item): number {
  switch (item.kind) {
    case 'artifact':
      return 0;
    case 'weapon':
    case 'ranged':
    case 'armour':
    case 'shield':
      return item.quality === 'artifact' ? 0 : Math.round(item.value * QUALITY_VALUE[item.quality]);
    case 'ammo':
      return Math.round((item.value * item.count) / item.per);
    case 'potion':
    case 'key':
    case 'lockpicks':
      return item.value * item.count;
    case 'gem':
    case 'jewelry':
      return item.appraised ?? item.value;
    default:
      return item.value;
  }
}

/** What a village charges for an item: its value times the village's multiplier, rounded up to a whole gp. */
export const buyPrice = (item: Item, villagesBelowSurface: number): number => Math.ceil(itemValue(item) * villageMultiplier(villagesBelowSurface));

/** What a trader in the dungeon charges: 150% of value. */
export const traderPrice = (item: Item): number => Math.ceil(itemValue(item) * TRADER_RATE);

/**
 * What a shop pays: half the value, with no depth multiplier so that buying in one village and selling in
 * another is never a profit; the Fence adds 20% of that. An artifact cannot be sold.
 */
export function sellPrice(item: Item, fence = false): number {
  const value = itemValue(item);
  if (value <= 0) return 0;
  return Math.floor(value * SELL_RATE * (1 + (fence ? FENCE_BONUS : 0)));
}

/** What the identify service costs in a village (Spec 05). */
export const identifyPrice = (villagesBelowSurface: number): number => Math.ceil(IDENTIFY_PRICE * villageMultiplier(villagesBelowSurface));

/** What the smith asks to repair a broken piece: 30% of its value, scaled by the village. */
export const repairPrice = (item: Item, villagesBelowSurface: number): number => Math.ceil(itemValue(item) * REPAIR_RATE * villageMultiplier(villagesBelowSurface));
