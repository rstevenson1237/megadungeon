// Working grid for level generation: one byte per cell, row by row. Core of the
// four-direction rules: every step here is orthogonal, never diagonal (Spec 01, 02).

import { TILE, type Level, type Point } from './level.ts';

export const WALL = 0;
export const FLOOR = 1;
export const STAIRS_UP = 2;
export const STAIRS_DOWN = 3;

const TILE_CHARS = [TILE.wall, TILE.floor, TILE.stairsUp, TILE.stairsDown];

export const ORTHOGONAL: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/** Everything but a wall is walkable. (Water and lava arrive with later layouts.) */
export const isWalkable = (cell: number): boolean => cell !== WALL;

export function toRows(cells: Uint8Array, width: number, height: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) row += TILE_CHARS[cells[y * width + x]!];
    rows.push(row);
  }
  return rows;
}

/** Parse a level's rows back to cells; null when a row has the wrong length or an unknown character. */
export function toCells(level: Pick<Level, 'tiles' | 'width' | 'height'>): Uint8Array | null {
  const { tiles, width, height } = level;
  if (tiles.length !== height) return null;
  const cells = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    const row = tiles[y]!;
    if (row.length !== width) return null;
    for (let x = 0; x < width; x++) {
      const cell = TILE_CHARS.indexOf(row[x] as (typeof TILE_CHARS)[number]);
      if (cell < 0) return null;
      cells[y * width + x] = cell;
    }
  }
  return cells;
}

/** Steps from `start` to every cell through orthogonal moves over walkable cells; -1 where unreachable. */
export function distancesFrom(cells: Uint8Array, width: number, height: number, start: Point): Int32Array {
  const dist = new Int32Array(width * height).fill(-1);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const s = start.y * width + start.x;
  if (!isWalkable(cells[s]!)) return dist;
  dist[s] = 0;
  queue[tail++] = s;
  while (head < tail) {
    const i = queue[head++]!;
    const x = i % width;
    const y = (i - x) / width;
    for (const [dx, dy] of ORTHOGONAL) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const n = ny * width + nx;
      if (dist[n] !== -1 || !isWalkable(cells[n]!)) continue;
      dist[n] = dist[i]! + 1;
      queue[tail++] = n;
    }
  }
  return dist;
}

/** Label each four-direction region of walkable cells 1, 2, ...; walls are 0. */
export function labelRegions(cells: Uint8Array, width: number, height: number): { labels: Int32Array; count: number } {
  const labels = new Int32Array(width * height);
  const stack: number[] = [];
  let count = 0;
  for (let start = 0; start < cells.length; start++) {
    if (!isWalkable(cells[start]!) || labels[start] !== 0) continue;
    count++;
    labels[start] = count;
    stack.push(start);
    while (stack.length > 0) {
      const i = stack.pop()!;
      const x = i % width;
      const y = (i - x) / width;
      for (const [dx, dy] of ORTHOGONAL) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const n = ny * width + nx;
        if (labels[n] !== 0 || !isWalkable(cells[n]!)) continue;
        labels[n] = count;
        stack.push(n);
      }
    }
  }
  return { labels, count };
}

/**
 * Carve a one-cell corridor from `a` to `b`: straight when they share a row or column,
 * otherwise an L with one corner. The corner cell belongs to both legs, so the path is
 * connected orthogonally.
 */
export function carveCorridor(cells: Uint8Array, width: number, a: Point, b: Point, horizontalFirst: boolean): void {
  const cornerX = horizontalFirst ? b.x : a.x;
  const cornerY = horizontalFirst ? a.y : b.y;
  const line = (from: Point, to: Point): void => {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    let x = from.x;
    let y = from.y;
    for (;;) {
      cells[y * width + x] = cells[y * width + x] === WALL ? FLOOR : cells[y * width + x]!;
      if (x === to.x && y === to.y) break;
      x += dx;
      y += dy;
    }
  };
  line(a, { x: cornerX, y: cornerY });
  line({ x: cornerX, y: cornerY }, b);
}
