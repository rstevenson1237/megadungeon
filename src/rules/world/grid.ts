// Working grid for level generation: one byte per cell, row by row. Core of the
// four-direction rules: every step here is orthogonal, never diagonal (Spec 01, 02).

import { TILE, type Door, type DoorKind, type Level, type Point, type Rect } from './level.ts';

export const WALL = 0;
export const FLOOR = 1;
export const STAIRS_UP = 2;
export const STAIRS_DOWN = 3;
export const DOOR = 4;
export const SHALLOW = 5;
export const DEEP = 6;
export const LAVA = 7;

/**
 * Doors that are not plain: a secret door is drawn as wall, a locked or sealed one as a door (Spec 02, task 2.4).
 * All three can be walked once opened or found, so they count as walkable for four-direction connectivity,
 * but not for the critical path (`isOpenWalkable`).
 */
export const SECRET_DOOR = 8;
export const LOCKED_DOOR = 9;
export const SEALED_DOOR = 10;

const TILE_CHARS = [
  TILE.wall,
  TILE.floor,
  TILE.stairsUp,
  TILE.stairsDown,
  TILE.door,
  TILE.shallowWater,
  TILE.deepWater,
  TILE.lava,
  TILE.wall, // secret door
  TILE.door, // locked door
  TILE.door, // sealed door
];

const DOOR_CELL: Record<DoorKind, number> = { normal: DOOR, locked: LOCKED_DOOR, secret: SECRET_DOOR, sealed: SEALED_DOOR };

export const ORTHOGONAL: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/** Everything but a wall, deep water and lava is walkable; those three count as walls for reachability (Spec 02, "Liquids"). */
export const isWalkable = (cell: number): boolean => cell !== WALL && cell !== DEEP && cell !== LAVA;

/** Walkable with no secret, locked or sealed door on the way: the rule for the critical path (Spec 02, "Reachability"). */
export const isOpenWalkable = (cell: number): boolean => isWalkable(cell) && cell !== SECRET_DOOR && cell !== LOCKED_DOOR && cell !== SEALED_DOOR;

/** The cell code a door of this kind has in the working grid. */
export const doorCell = (kind: DoorKind): number => DOOR_CELL[kind];

export function toRows(cells: Uint8Array, width: number, height: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) row += TILE_CHARS[cells[y * width + x]!];
    rows.push(row);
  }
  return rows;
}

/**
 * Parse a level's rows back to cells; null when a row has the wrong length or an unknown character.
 * Given the level's doors, secret, locked and sealed doors come back as such instead of wall and door.
 */
export function toCells(level: Pick<Level, 'tiles' | 'width' | 'height'> & { doors?: readonly Door[] }): Uint8Array | null {
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
  for (const d of level.doors ?? []) {
    if (d.x >= 0 && d.y >= 0 && d.x < width && d.y < height) cells[d.y * width + d.x] = DOOR_CELL[d.kind];
  }
  return cells;
}

/**
 * Steps from `start` to every cell through orthogonal moves over walkable cells; -1 where unreachable.
 * `walkable` says which cell values can be stepped on; the default is `isWalkable`.
 */
export function distancesFrom(
  cells: Uint8Array,
  width: number,
  height: number,
  start: Point,
  walkable: (cell: number) => boolean = isWalkable,
): Int32Array {
  const dist = new Int32Array(width * height).fill(-1);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const s = start.y * width + start.x;
  if (!walkable(cells[s]!)) return dist;
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
      if (dist[n] !== -1 || !walkable(cells[n]!)) continue;
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
 * connected orthogonally. Walls become floor; deep water becomes a ford of shallow water
 * and lava a stone causeway, so the corridor is walkable from end to end (Spec 02, task 2.3).
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
      const here = cells[y * width + x]!;
      if (here === WALL || here === LAVA) cells[y * width + x] = FLOOR;
      else if (here === DEEP) cells[y * width + x] = SHALLOW;
      if (x === to.x && y === to.y) break;
      x += dx;
      y += dy;
    }
  };
  line(a, { x: cornerX, y: cornerY });
  line({ x: cornerX, y: cornerY }, b);
}

/** Fill a rectangle with one cell value. */
export function fillRect(cells: Uint8Array, width: number, r: Rect, value: number): void {
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) cells[y * width + x] = value;
  }
}

/** The smaller rectangle of a room that is plain floor in every state: never the room's edge cells. */
export const interiorOf = (r: Rect): Rect => ({ x: r.x + 1, y: r.y + 1, w: r.w - 2, h: r.h - 2 });

/** Turn every walkable region but the largest back into wall; returns the size of the one kept (0 when there is no floor). */
export function keepLargestRegion(cells: Uint8Array, width: number, height: number): number {
  const { labels, count } = labelRegions(cells, width, height);
  if (count === 0) return 0;
  const sizes = new Int32Array(count + 1);
  for (const label of labels) sizes[label]!++;
  let keep = 1;
  for (let l = 2; l <= count; l++) if (sizes[l]! > sizes[keep]!) keep = l;
  for (let i = 0; i < cells.length; i++) if (labels[i] !== keep) cells[i] = WALL;
  return sizes[keep]!;
}

const CLEARING_MIN_W = 5;
const CLEARING_MIN_H = 3;
const CLEARING_MAX_W = 11;
const CLEARING_MAX_H = 7;
const CLEARING_GAP = 2;

/**
 * Clearings for layouts without literal rooms (Spec 02, clarifications of task 2.3): floor-only
 * rectangles, 5 x 3 up to 11 x 7, found by scanning row by row, grown as far as plain floor allows,
 * and kept 2 cells apart. Deterministic: no randomness, so the same cells give the same clearings.
 */
export function findClearings(cells: Uint8Array, width: number, height: number): Rect[] {
  const taken = new Uint8Array(width * height);
  const rooms: Rect[] = [];
  const free = (x: number, y: number): boolean =>
    x > 0 && y > 0 && x < width - 1 && y < height - 1 && cells[y * width + x] === FLOOR && taken[y * width + x] === 0;
  const rowFree = (x0: number, x1: number, y: number): boolean => {
    for (let x = x0; x <= x1; x++) if (!free(x, y)) return false;
    return true;
  };
  const colFree = (x: number, y0: number, y1: number): boolean => {
    for (let y = y0; y <= y1; y++) if (!free(x, y)) return false;
    return true;
  };
  for (let y = 1; y < height - CLEARING_MIN_H; y++) {
    for (let x = 1; x < width - CLEARING_MIN_W; x++) {
      if (!free(x, y)) continue;
      let r: Rect = { x, y, w: CLEARING_MIN_W, h: CLEARING_MIN_H };
      let ok = true;
      for (let yy = y; yy < y + CLEARING_MIN_H && ok; yy++) ok = rowFree(x, x + CLEARING_MIN_W - 1, yy);
      if (!ok) continue;
      // Grow to the right, then down, then left and up, while the new edge is all plain floor.
      for (let grown = true; grown; ) {
        grown = false;
        if (r.w < CLEARING_MAX_W && colFree(r.x + r.w, r.y, r.y + r.h - 1)) { r = { ...r, w: r.w + 1 }; grown = true; }
        if (r.h < CLEARING_MAX_H && rowFree(r.x, r.x + r.w - 1, r.y + r.h)) { r = { ...r, h: r.h + 1 }; grown = true; }
        if (r.w < CLEARING_MAX_W && colFree(r.x - 1, r.y, r.y + r.h - 1)) { r = { ...r, x: r.x - 1, w: r.w + 1 }; grown = true; }
        if (r.h < CLEARING_MAX_H && rowFree(r.x, r.x + r.w - 1, r.y - 1)) { r = { ...r, y: r.y - 1, h: r.h + 1 }; grown = true; }
      }
      rooms.push(r);
      for (let yy = Math.max(0, r.y - CLEARING_GAP); yy < Math.min(height, r.y + r.h + CLEARING_GAP); yy++) {
        for (let xx = Math.max(0, r.x - CLEARING_GAP); xx < Math.min(width, r.x + r.w + CLEARING_GAP); xx++) {
          taken[yy * width + xx] = 1;
        }
      }
    }
  }
  return rooms;
}
