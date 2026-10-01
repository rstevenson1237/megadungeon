// The lift (Spec 07, "Lift"): it links the villages the player has visited. The fare is 10 gp times the levels
// travelled times (0.5 + the deeper village's level / 100) times a seeded factor of 0.8 to 1.2, fixed for each pair
// of villages for the run and the same both ways. A lift token makes every trip cheaper (clarifications of task 2.11).

import { createRng, hash32 } from '../../core/rng.ts';

export const FARE_PER_LEVEL = 10;
export const FARE_FACTOR: readonly [number, number] = [0.8, 1.2];
/** What a trip costs with the lift keeper's token: half (Spec 07 says "free or cheaper"; this picks cheaper). */
export const TOKEN_RATE = 0.5;

/** The seeded factor of a pair of villages, 0.8 to 1.2 in steps of 0.001, the same whichever way the trip goes. */
export function fareFactor(runSeed: number, a: number, b: number): number {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  const rng = createRng(hash32('lift-fare', runSeed >>> 0, lo, hi));
  const [min, max] = FARE_FACTOR;
  return (Math.round(min * 1000) + rng.int(0, Math.round((max - min) * 1000))) / 1000;
}

/** The fare between two villages, in gp, before any token. Zero for a trip to where you are. */
export function liftFare(runSeed: number, a: number, b: number): number {
  const [lo, hi] = a < b ? [a, b] : [b, a];
  if (lo === hi) return 0;
  return Math.round(FARE_PER_LEVEL * (hi - lo) * (0.5 + hi / 100) * fareFactor(runSeed, lo, hi));
}

/** What the player pays: the fare, halved (rounded up) with a lift token. */
export const fareToPay = (runSeed: number, a: number, b: number, token: boolean): number => {
  const fare = liftFare(runSeed, a, b);
  return token ? Math.ceil(fare * TOKEN_RATE) : fare;
};
