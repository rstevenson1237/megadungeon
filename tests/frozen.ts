// Whole-level determinism against frozen tables (Spec 02, Addendum A): a copy of the stub content kept with the
// tests, so editing the real tables never changes these hashes, and only a change to the generator code does.

import frozen from './fixtures/frozen-content-bundle.json';
import { hash32 } from '../src/core/rng.ts';
import type { ContentBundle } from '../src/core/schemas.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import type { Level } from '../src/rules/world/level.ts';

export const FROZEN = frozen as unknown as ContentBundle;

/** Level `depth` of the run `seed`, with its theme and full contents rolled from the frozen tables; null on a village. */
export function frozenLevel(seed: number, depth: number, version?: number): Level | null {
  const options = runOptionsFor(FROZEN, seed);
  if (options.layout?.villages.some((v) => v.level === depth)) return null;
  return generateLevel(seed, depth, options.sizeFor!(depth), options.styleFor!(depth), options.contentsFor!(depth), version);
}

/** A hash of everything a level holds: tiles, rooms, stairs and every placement. */
export const levelHash = (level: Level): number => hash32(JSON.stringify(level));

/** Fixed seeds and depths that cover every size, most themes, the deepest bands and level 100. */
export const GOLDEN_CASES: readonly [number, number][] = [
  [1, 1], [1, 7], [2, 13], [3, 22], [7, 31], [42, 44], [42, 58], [1234, 63], [1234, 77], [99, 85], [5, 92], [8, 99], [11, 100],
];
