// Treasure, appraisal, banking and theft (Spec 05, "Treasure and appraisal"; Spec 04, bandits).

import { createRng, hash32 } from '../../core/rng.ts';
import type { Item, TreasureItem } from './types.ts';

/** The appraiser values a piece at 60% to 120% of base (Spec 05). */
export const APPRAISAL_LOW = 0.6;
export const APPRAISAL_HIGH = 1.2;

export const isTreasure = (item: Item): item is TreasureItem => item.kind === 'gem' || item.kind === 'jewelry';

/**
 * Value a piece: rolled once, from the run seed and the piece, and fixed after (Spec 05). A piece already
 * appraised keeps its value however often it is shown to an appraiser.
 */
export function appraise(runSeed: number, piece: TreasureItem): number {
  if (piece.appraised !== undefined) return piece.appraised;
  const u = createRng(hash32('appraise', runSeed >>> 0, piece.uid, piece.id)).float();
  piece.appraised = Math.max(1, Math.round(piece.value * (APPRAISAL_LOW + (APPRAISAL_HIGH - APPRAISAL_LOW) * u)));
  return piece.appraised;
}

/** Banking takes coins and appraised pieces only (Spec 05). */
export const bankable = (item: Item): boolean => !isTreasure(item) || item.appraised !== undefined;

/** The value a deposit of these pieces is worth in XP: appraised pieces only. */
export const depositValue = (pieces: readonly Item[]): number => pieces.reduce((n, p) => n + (isTreasure(p) && p.appraised !== undefined ? p.appraised : 0), 0);

/** A piece's value for the carried estimate and for theft: appraised, else base (Spec 01, Spec 05). */
export const pieceValue = (p: TreasureItem): number => p.appraised ?? p.value;

/** The estimate the character pane shows: coins at face value, gems and jewelry at base or appraised value. */
export const carriedEstimate = (coins: number, pack: readonly Item[]): number => coins + pack.reduce((n, i) => n + (isTreasure(i) ? pieceValue(i) : 0), 0);

/**
 * What one bandit theft takes (Spec 05, task 2.9): 10% of the carried treasure value, rounded up and at least 1,
 * coins first and, when coins do not cover it, the cheapest pieces until it is covered. A theft that finds
 * no treasure takes nothing.
 */
export function theftTake(coins: number, pack: readonly Item[]): { coins: number; pieces: TreasureItem[] } {
  const total = carriedEstimate(coins, pack);
  if (total <= 0) return { coins: 0, pieces: [] };
  const target = Math.max(1, Math.ceil(total * 0.1));
  const fromCoins = Math.min(coins, target);
  let remaining = target - fromCoins;
  const pieces: TreasureItem[] = [];
  const cheapest = pack.filter(isTreasure).sort((a, b) => pieceValue(a) - pieceValue(b) || a.uid - b.uid);
  for (const p of cheapest) {
    if (remaining <= 0) break;
    pieces.push(p);
    remaining -= pieceValue(p);
  }
  return { coins: fromCoins, pieces };
}
