// Explored cells (Spec 02, "Visibility and explored cells"): every cell the player has
// seen stays explored. Plain and serialisable; it is the level's "explored cells" delta.

import { TILE, type Level, type Point } from '../rules/world/level.ts';
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

/** Walls block sight. Closed doors join them when doors exist (task 1.8). */
export function blocksSight(level: Level, x: number, y: number): boolean {
  return level.tiles[y]![x] === TILE.wall;
}

/** Cells visible from `from`, and mark them all explored. Returns the visible set (1 = visible). */
export function updateExploration(level: Level, exploration: Exploration, from: Point): Uint8Array {
  const visible = computeVisible(level.width, level.height, from, (x, y) => blocksSight(level, x, y));
  for (let i = 0; i < visible.length; i++) if (visible[i]) exploration.explored[i] = 1;
  return visible;
}
