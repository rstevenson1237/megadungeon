// Stub monsters for the Phase 1 slice. The real bestiary, depth tables and placement
// pipeline arrive in tasks 2.4 and 3.3; what is here follows Spec 02's depth scaling and
// monster counts so the numbers are already the real ones.

import type { Rng } from '../core/rng.ts';
import { distanceSq } from '../rules/world/geometry.ts';
import { type Level, type Point, type SizeClass } from '../rules/world/level.ts';

export type Speed = 'slow' | 'normal' | 'fast';

export interface Monster {
  id: number;
  name: string;
  glyph: string;
  colour: number;
  x: number;
  y: number;
  /** Dice left (health). The monster dies at zero. */
  dice: number;
  /** Dice it started with: its rating (Spec 02), shown as "3d6+1". */
  maxDice: number;
  modifier: number;
  speed: Speed;
  /** Stub awareness: false until the player sees it, then it hunts. Real rolls arrive in task 2.7. */
  alert: boolean;
}

interface StubKind {
  name: string;
  glyph: string;
  colour: number;
  speed: Speed;
}

/** Three placeholder kinds, one per speed, so the turn loop's speeds can be seen in play. */
export const STUB_KINDS: readonly StubKind[] = [
  { name: 'rat', glyph: 'r', colour: 0xb08a5a, speed: 'fast' },
  { name: 'goblin', glyph: 'g', colour: 0x7fc75a, speed: 'normal' },
  { name: 'ogre', glyph: 'O', colour: 0xe07a3a, speed: 'slow' },
];

/** Monster count range per size class (Spec 02, Depth scaling). */
export const MONSTER_COUNTS: Record<SizeClass, [number, number]> = {
  small: [8, 12],
  medium: [14, 20],
  large: [22, 30],
};

/** Rating ceiling in dice: 1 + depth / 5 rounded down, capped at 20 (Spec 02). */
export const ratingCeiling = (depth: number): number => Math.min(20, 1 + Math.floor(depth / 5));

/** "3d6+1", "d6", "2d6-1" (Spec 01 target block). */
export function ratingText(m: Pick<Monster, 'maxDice' | 'modifier'>): string {
  const dice = m.maxDice === 1 ? 'd6' : `${m.maxDice}d6`;
  return m.modifier === 0 ? dice : `${dice}${m.modifier > 0 ? '+' : ''}${m.modifier}`;
}

/** Monsters may not stand within 8 cells of the up stair (Spec 02, step 8). */
export const STAIR_SAFE_RADIUS = 8;

/**
 * Place the level's stub monsters on room cells, none within 8 cells of the up stair.
 * Each rolls between half the rating ceiling and the ceiling in dice, with a modifier of
 * depth / 15 (capped at +6) varied by up to 2 either way, within -2 to +6 (Spec 02).
 */
export function placeStubMonsters(level: Level, rng: Rng): Monster[] {
  const [lo, hi] = MONSTER_COUNTS[level.size];
  const spots: Point[] = [];
  for (const r of level.rooms) {
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        if (level.tiles[y]![x] !== '.') continue; // floor only: no stairs, doors
        if (distanceSq({ x, y }, level.upStair) <= STAIR_SAFE_RADIUS ** 2) continue;
        spots.push({ x, y });
      }
    }
  }
  const chosen = rng.shuffle(spots).slice(0, rng.int(lo, hi));
  const ceiling = ratingCeiling(level.depth);
  const baseModifier = Math.min(6, Math.floor(level.depth / 15));
  return chosen.map((at, id) => {
    const kind = rng.pick(STUB_KINDS);
    const dice = rng.int(Math.max(1, Math.ceil(ceiling / 2)), ceiling);
    return {
      id,
      name: kind.name,
      glyph: kind.glyph,
      colour: kind.colour,
      x: at.x,
      y: at.y,
      dice,
      maxDice: dice,
      modifier: Math.max(-2, Math.min(6, baseModifier + rng.int(-2, 2))),
      speed: kind.speed,
      alert: false,
    };
  });
}
