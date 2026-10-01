// Explored cells (Spec 02, "Visibility and explored cells"): every cell the player has
// seen stays explored. Plain and serialisable; it is the level's "explored cells" delta.

import type { Level, Point } from '../rules/world/level.ts';
import { computeVisible } from '../rules/world/visibility.ts';

export interface Exploration {
  width: number;
  height: number;
  /** One entry per cell, row by row: 1 once the cell has been seen, else 0. */
  explored: number[];
}

export function createExploration(level: Pick<Level, 'width' | 'height'>): Exploration {
  return { width: level.width, height: level.height, explored: new Array<number>(level.width * level.height).fill(0) };
}

/**
 * Cells visible from `from`, and mark them all explored. `terrain` is 0 where a cell blocks
 * sight (walls and closed doors). Returns the visible set (1 = visible).
 */
export function updateExploration(exploration: Exploration, from: Point, terrain: Uint8Array): Uint8Array {
  const { width, height } = exploration;
  const visible = computeVisible(width, height, from, (x, y) => terrain[y * width + x] === 0);
  for (let i = 0; i < visible.length; i++) if (visible[i]) exploration.explored[i] = 1;
  return visible;
}
