// The prices and amounts of the economy (Spec 07): lodging, rumours, hermits, the bank's deposit. Pure arithmetic.
// "About" figures in the spec are taken at the number given, then scaled by the village multiplier.

import { appraise, isTreasure } from '../items/treasure.ts';
import { IDENTIFY_PRICE, villageMultiplier } from '../items/prices.ts';
import type { Item, TreasureItem } from '../items/types.ts';

export const LODGING_PRICE = 10;
/** A rest passes this many turns, which counts as time away for restocking (Spec 02, Spec 07). */
export const LODGING_TURNS = 200;
export const RUMOUR_PRICE = 25;
export const QUEST_LIMIT = 3;
export const BOARD_SIZE = 3;
/** The share of a level's treasure budget a quest pays, and the chance in N of an item as well (clarifications of task 2.11). */
export const QUEST_ITEM_ONE_IN = 4;

export const HERMIT_PRICES = { identify: IDENTIFY_PRICE, restore: 25, curse: 100, rumour: 25 } as const;
export type HermitService = keyof typeof HERMIT_PRICES;

const scaled = (base: number, villages: number): number => Math.ceil(base * villageMultiplier(villages));

export const lodgingPrice = (villages: number): number => scaled(LODGING_PRICE, villages);
export const rumourPrice = (villages: number): number => scaled(RUMOUR_PRICE, villages);
export const hermitPrice = (service: HermitService, villages: number): number => scaled(HERMIT_PRICES[service], villages);

/** What a deposit would bank: carried coins and the appraised pieces; unappraised ones are held back (Spec 07). */
export function depositOf(coins: number, pack: readonly Item[]): { gold: number; pieces: TreasureItem[]; heldBack: TreasureItem[] } {
  const pieces: TreasureItem[] = [];
  const heldBack: TreasureItem[] = [];
  for (const item of pack) {
    if (!isTreasure(item)) continue;
    (item.appraised !== undefined ? pieces : heldBack).push(item);
  }
  return { gold: coins + pieces.reduce((n, p) => n + p.appraised!, 0), pieces, heldBack };
}

/** Value every carried gem and jewelry piece that has no value yet: free (Spec 07). Returns how many were valued. */
export function appraiseAll(runSeed: number, pack: readonly Item[]): TreasureItem[] {
  const valued: TreasureItem[] = [];
  for (const item of pack) {
    if (!isTreasure(item) || item.appraised !== undefined) continue;
    item.appraised = appraise(runSeed, item);
    valued.push(item);
  }
  return valued;
}
