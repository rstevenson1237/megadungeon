// Step 12 of the pipeline, "Validate" (Spec 02), for the rules that exist so far:
// four-direction connectivity (deep water and lava count as walls) and the stair rules.

import { STAIRS_DOWN, STAIRS_UP, WALL, distancesFrom, isWalkable, toCells } from './grid.ts';
import { MAX_DEPTH, type Level } from './level.ts';

/** True when `dist` is at least 60% of `longest`, the longest walkable distance from the up stair (Spec 02, step 3). */
export const farEnough = (dist: number, longest: number): boolean => dist * 5 >= longest * 3;

/** Every rule the level breaks, in plain words; empty when the level is valid. */
export function findProblems(level: Level): string[] {
  const { width, height } = level;
  const cells = toCells(level);
  if (!cells) return ['tiles do not form a width x height grid of known characters'];
  const problems: string[] = [];

  for (let x = 0; x < width; x++) {
    if (cells[x] !== WALL || cells[(height - 1) * width + x] !== WALL) problems.push('top or bottom edge is not wall');
  }
  for (let y = 0; y < height; y++) {
    if (cells[y * width] !== WALL || cells[y * width + width - 1] !== WALL) problems.push('left or right edge is not wall');
  }

  const count = (tile: number): number => cells.reduce((n, c) => n + (c === tile ? 1 : 0), 0);
  const at = (p: { x: number; y: number }): number => cells[p.y * width + p.x]!;
  if (count(STAIRS_UP) !== 1 || at(level.upStair) !== STAIRS_UP) problems.push('needs exactly one up stair, at upStair');
  const downs = count(STAIRS_DOWN);
  if (level.depth >= MAX_DEPTH) {
    if (downs !== 0 || level.downStair !== null) problems.push('level 100 has no down stair');
  } else if (downs !== 1 || !level.downStair || at(level.downStair) !== STAIRS_DOWN) {
    problems.push('needs exactly one down stair, at downStair');
  }
  if (problems.length > 0) return problems;

  const dist = distancesFrom(cells, width, height, level.upStair);
  let longest = 0;
  for (let i = 0; i < cells.length; i++) {
    if (!isWalkable(cells[i]!)) continue;
    if (dist[i] === -1) {
      problems.push(`cell ${i % width},${Math.floor(i / width)} is not reachable from the up stair`);
      break;
    }
    if (dist[i]! > longest) longest = dist[i]!;
  }
  if (level.downStair && problems.length === 0) {
    const d = dist[level.downStair.y * width + level.downStair.x]!;
    if (!farEnough(d, longest)) problems.push(`down stair is ${d} steps from the up stair, under 60% of ${longest}`);
  }
  return problems;
}

export const isValid = (level: Level): boolean => findProblems(level).length === 0;
