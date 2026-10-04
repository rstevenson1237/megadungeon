// The working board of the placement pipeline (Spec 02, steps 4 to 11): the level's cells with what has
// been put where, and the questions the steps ask of it: which cells are free, which are entrances,
// which part of the level is reachable without a locked, secret or sealed door.

import type { Rng } from '../../../core/rng.ts';
import {
  DOOR,
  FLOOR,
  LOCKED_DOOR,
  ORTHOGONAL,
  SEALED_DOOR,
  SECRET_DOOR,
  WALL,
  distancesFrom,
  interiorOf,
  isOpenWalkable,
  isWalkable,
} from '../grid.ts';
import type { Point, Rect } from '../level.ts';

/** A one-cell gap with wall on both sides that leads into a room (Spec 02, clarifications of task 2.4). */
export interface Entrance extends Point {
  /** Indexes of the rooms it opens into: one, or two when it joins two rooms. */
  rooms: number[];
}

const RING = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
] as const;

export class Board {
  /** The index of the room whose rectangle holds each cell, or -1. A later room wins where two overlap. */
  readonly roomOf: Int16Array;
  /** Cells holding something placed: a feature, an item, a trap, a creature, a mark on a wall. */
  readonly used: Uint8Array;
  /** Cells that block walking: containers, fixtures and NPCs (Spec 02, "Blocking features"). */
  readonly solid: Uint8Array;
  /** Every entrance, whether or not it got a door: doorways never hold a trap. */
  readonly doorways: Uint8Array;
  entrances: Entrance[] = [];
  /** A cell no locked or secret door may cut off from the up stair, besides the down stair: the throne room's centre. */
  goal: Point | null = null;
  /** Rooms the generic steps leave alone: the boss room and the vault. */
  readonly reserved = new Set<number>();
  /** The vault: nothing but its chest is ever placed in it, not even a trap or debris. */
  readonly sealed = new Set<number>();

  /** The level's rooms; a vault carved by step 11 is added to the end. */
  readonly rooms: Rect[];

  constructor(
    readonly cells: Uint8Array,
    readonly width: number,
    readonly height: number,
    rooms: readonly Rect[],
    readonly up: Point,
    readonly down: Point | null,
  ) {
    this.rooms = rooms.slice();
    const size = width * height;
    this.roomOf = new Int16Array(size).fill(-1);
    this.used = new Uint8Array(size);
    this.solid = new Uint8Array(size);
    this.doorways = new Uint8Array(size);
    this.rooms.forEach((_, i) => this.stampRoom(i));
  }

  private stampRoom(i: number): void {
    const r = this.rooms[i]!;
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) this.roomOf[y * this.width + x] = i;
  }

  /** Add a room already carved into the cells; returns its index. */
  addRoom(r: Rect): number {
    this.rooms.push(r);
    this.stampRoom(this.rooms.length - 1);
    return this.rooms.length - 1;
  }

  index = (p: Point): number => p.y * this.width + p.x;
  point = (i: number): Point => ({ x: i % this.width, y: Math.floor(i / this.width) });

  /** Plain floor with nothing on it. */
  free(p: Point): boolean {
    const i = this.index(p);
    return this.cells[i] === FLOOR && this.used[i] === 0 && this.doorways[i] === 0;
  }

  /**
   * True when a blocker may stand on `p`: no other blocker in the 8 cells around it, and the walkable cells around it
   * stay in one piece without it (the walkable ring of 8 is one run), so it never cuts a corridor, a doorway or a
   * room in two and can never wall anything in.
   */
  roomForSolid(p: Point): boolean {
    const ring: boolean[] = [];
    for (const [dx, dy] of RING) {
      const n = (p.y + dy) * this.width + p.x + dx;
      if (this.solid[n] === 1) return false;
      ring.push(isWalkable(this.cells[n]!));
    }
    let runs = 0;
    for (let i = 0; i < 8; i++) if (ring[i] && !ring[(i + 7) % 8]) runs++;
    return runs <= 1;
  }

  put(p: Point, solid = false): void {
    const i = this.index(p);
    this.used[i] = 1;
    if (solid) this.solid[i] = 1;
  }

  /** Rooms the generic steps may use, in order. */
  openRooms(): number[] {
    return this.rooms.map((_, i) => i).filter((i) => !this.reserved.has(i));
  }

  /** Floor cells of the given rooms (their whole rectangle, or only the cells one in from its edge), free ones only. */
  roomCells(rooms: readonly number[], interior: boolean): Point[] {
    const out: Point[] = [];
    for (const i of rooms) {
      const r = interior ? interiorOf(this.rooms[i]!) : this.rooms[i]!;
      for (let y = r.y; y < r.y + r.h; y++) {
        for (let x = r.x; x < r.x + r.w; x++) if (this.free({ x, y })) out.push({ x, y });
      }
    }
    return out;
  }

  /**
   * Free spots a blocker (container, fixture, NPC) may stand on, shuffled: cells one in from a room's edge, or any cell
   * of a room too small to have them (the rooms of a warren).
   */
  solidSpots(rooms: readonly number[], rng: Rng): Point[] {
    const out: Point[] = [];
    for (const room of rooms) {
      const inner = this.roomCells([room], true);
      out.push(...(inner.length > 0 ? inner : this.roomCells([room], false)));
    }
    return rng.shuffle(out);
  }

  /**
   * Hold `n` blocker spots in the open region for the pieces of step 11, so the generic steps cannot use them all up
   * (a warren has few room cells). Held spots look occupied until `release`.
   */
  hold(n: number, rng: Rng, open: Int32Array): Point[] {
    const held: Point[] = [];
    for (const p of this.solidSpots(this.openRooms(), rng)) {
      if (held.length >= n) break;
      if (open[this.index(p)]! < 0 || !this.free(p) || !this.roomForSolid(p)) continue;
      this.put(p, true);
      held.push(p);
    }
    return held;
  }

  release(held: readonly Point[]): void {
    for (const p of held) {
      this.used[this.index(p)] = 0;
      this.solid[this.index(p)] = 0;
    }
  }

  /** Walking distance from the up stair over cells with no locked, secret or sealed door; -1 elsewhere. */
  openDistances(): Int32Array {
    return distancesFrom(this.cells, this.width, this.height, this.up, isOpenWalkable);
  }

  /** Walking distance that may pass locked and sealed doors but not secret ones. */
  noSecretDistances(): Int32Array {
    return distancesFrom(this.cells, this.width, this.height, this.up, (c) => isWalkable(c) && c !== SECRET_DOOR);
  }

  private inVault(p: Point): boolean {
    const room = this.roomOf[this.index(p)]!;
    return room >= 0 && this.sealed.has(room);
  }

  /** Floor cells with exactly one walkable neighbour: dead ends, where treasure may lie. */
  deadEnds(): Point[] {
    const out: Point[] = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const p = { x, y };
        if (!this.free(p) || this.inVault(p)) continue;
        let open = 0;
        for (const [dx, dy] of ORTHOGONAL) if (isWalkable(this.cells[(y + dy) * this.width + x + dx]!)) open++;
        if (open === 1) out.push(p);
      }
    }
    return out;
  }

  /** Free floor cells anywhere, in scan order. */
  floorCells(): Point[] {
    const out: Point[] = [];
    for (let i = 0; i < this.cells.length; i++) {
      const p = this.point(i);
      if (this.free(p) && !this.inVault(p)) out.push(p);
    }
    return out;
  }

  /** Wall cells with plain floor beside them, where graffiti, signs and runes go; the edge ring is left alone. */
  wallSpots(): Point[] {
    const { cells, width, height } = this;
    const out: Point[] = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = y * width + x;
        if (cells[i] !== WALL || this.used[i] === 1) continue;
        if (ORTHOGONAL.some(([dx, dy]) => cells[i + dy * width + dx] === FLOOR)) out.push({ x, y });
      }
    }
    return out;
  }
}

/** The room index of each cell: -1 outside every room, the last room where two overlap. */
export function roomIndexMap(rooms: readonly Rect[], width: number, height: number): Int16Array {
  const roomOf = new Int16Array(width * height).fill(-1);
  rooms.forEach((r, i) => {
    for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) roomOf[y * width + x] = i;
  });
  return roomOf;
}

/**
 * The rooms a cell is an entrance to (Spec 02, clarifications of task 2.4), or none when it is not one: a cell
 * outside every room, plain floor or a door, with wall on two opposite sides and walkable cells on the other two,
 * at least one of which is a room's cell. The wall on both sides is what makes the doorway one cell wide, so a
 * door never sits in a diagonal gap.
 */
export function entranceRooms(cells: Uint8Array, width: number, roomOf: Int16Array, x: number, y: number): number[] {
  const i = y * width + x;
  const c = cells[i]!;
  const plain = c === FLOOR || c === DOOR || c === SECRET_DOOR || c === LOCKED_DOOR || c === SEALED_DOOR;
  if (roomOf[i] !== -1 || !plain) return [];
  const wall = (n: number): boolean => cells[n] === WALL;
  const open = (n: number): boolean => isWalkable(cells[n]!);
  let pair: [number, number] | undefined;
  if (wall(i - width) && wall(i + width) && open(i - 1) && open(i + 1)) pair = [i - 1, i + 1];
  else if (wall(i - 1) && wall(i + 1) && open(i - width) && open(i + width)) pair = [i - width, i + width];
  if (!pair) return [];
  return [...new Set(pair.map((n) => roomOf[n]!).filter((r) => r >= 0))];
}

/** Find every entrance of the board's rooms. */
export function findEntrances(board: Board): Entrance[] {
  const { cells, width, height, roomOf } = board;
  const out: Entrance[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      if (cells[y * width + x] !== FLOOR) continue;
      const rooms = entranceRooms(cells, width, roomOf, x, y);
      if (rooms.length > 0) out.push({ x, y, rooms });
    }
  }
  return out;
}
