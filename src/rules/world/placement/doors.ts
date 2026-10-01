// Steps 4 and 5 of the pipeline (Spec 02): doors at room entrances, then one key per locked door. Also
// the two rooms the later steps keep apart from the rest: the boss room and the sealed vault.

import type { DoorWeightKey } from '../../../core/catalog.ts';
import type { Rng } from '../../../core/rng.ts';
import { pickWeighted } from '../../../core/roller.ts';
import { DOOR, FLOOR, LOCKED_DOOR, ORTHOGONAL, SEALED_DOOR, SECRET_DOOR, WALL, doorCell, fillRect } from '../grid.ts';
import type { Door, DoorKind, Pile, Point, Rect } from '../level.ts';
import type { Board, Entrance } from './board.ts';
import type { PlacementTheme } from './plan.ts';

/** Door odds per entrance (Spec 02, clarifications of task 2.4); a theme's `doors` field replaces any of them. */
export const DEFAULT_DOOR_WEIGHTS: Record<DoorWeightKey, number> = { none: 40, normal: 40, locked: 10, secret: 10 };

/** Doors only appear where a theme's layout has literal rooms; cellular caves have clearings instead. */
export function placeDoors(board: Board, theme: PlacementTheme | undefined, rng: Rng): Door[] {
  const weights = { ...DEFAULT_DOOR_WEIGHTS, ...theme?.doors };
  const rows = (Object.keys(weights) as DoorWeightKey[]).map((id) => ({ id, weight: weights[id] }));
  const doors: Door[] = [];
  const { cells, width } = board;
  for (const e of board.entrances) {
    const i = board.index(e);
    board.doorways[i] = 1;
  }
  for (const e of board.entrances) {
    const i = board.index(e);
    // Never two doors side by side: a doorway next to another door would make a double door.
    if ([i - 1, i + 1, i - width, i + width].some((n) => isDoorCell(cells[n]!))) continue;
    const roll = pickWeighted(rows, rng)!.id;
    if (roll === 'none') continue;
    let kind: DoorKind = roll;
    if (kind === 'locked' || kind === 'secret') {
      // Optional areas only: a locked or secret door may not cut the down stair off the up stair.
      cells[i] = doorCell(kind);
      if (!downReachable(board)) kind = 'normal';
    }
    cells[i] = doorCell(kind);
    doors.push({ x: e.x, y: e.y, kind });
  }
  return doors;
}

const isDoorCell = (c: number): boolean => c === DOOR || c === SECRET_DOOR || c === LOCKED_DOOR || c === SEALED_DOOR;

function downReachable(board: Board): boolean {
  if (!board.down) return true;
  return board.openDistances()[board.index(board.down)]! >= 0;
}

/** The rooms of the open region with their walking distance from the up stair: the distance to the cell nearest each centre. */
export function roomDistances(board: Board, open: Int32Array): { room: number; dist: number }[] {
  const out: { room: number; dist: number }[] = [];
  board.rooms.forEach((r, room) => {
    const cx = r.x + (r.w >> 1);
    const cy = r.y + (r.h >> 1);
    let best = -1;
    let bestSq = Infinity;
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        const d = open[y * board.width + x]!;
        const sq = (x - cx) ** 2 + (y - cy) ** 2;
        if (d >= 0 && sq < bestSq) {
          best = d;
          bestSq = sq;
        }
      }
    }
    if (best >= 0) out.push({ room, dist: best });
  });
  return out;
}

const contains = (r: Rect, p: Point): boolean => p.x >= r.x && p.y >= r.y && p.x < r.x + r.w && p.y < r.y + r.h;

/** The boss's room: the room of the open region farthest from the up stair by walking distance (Spec 02, step 11). */
export function pickBossRoom(board: Board): number | undefined {
  const open = board.openDistances();
  let best: { room: number; dist: number } | undefined;
  for (const c of roomDistances(board, open)) {
    if (contains(board.rooms[c.room]!, board.up)) continue;
    if (!best || c.dist > best.dist) best = c;
  }
  return best?.room;
}

/**
 * A room for a sealed vault: one with no stair, never the boss room, that can be shut at every entrance without
 * cutting anything outside it off from the up stair. A dead end with a single entrance is preferred; a crypt in a
 * maze may have several, and all of them are sealed. Seals the entrances and returns the room.
 */
export function sealVault(board: Board, doors: Door[], bossRoom: number | undefined, rng: Rng): number | undefined {
  const entrancesOf = new Map<number, Entrance[]>();
  for (const e of board.entrances) for (const r of e.rooms) entrancesOf.set(r, [...(entrancesOf.get(r) ?? []), e]);
  const before = board.openDistances();
  const fits = board.rooms
    .map((_, i) => i)
    .filter((i) => {
      const r = board.rooms[i]!;
      return (
        i !== bossRoom &&
        (entrancesOf.get(i)?.length ?? 0) > 0 &&
        !contains(r, board.up) &&
        !(board.down && contains(r, board.down)) &&
        before[(r.y + (r.h >> 1)) * board.width + r.x + (r.w >> 1)]! >= 0 &&
        r.w >= 3 &&
        r.h >= 3
      );
    });
  const single = rng.shuffle(fits.filter((i) => entrancesOf.get(i)!.length === 1));
  const several = rng.shuffle(fits.filter((i) => entrancesOf.get(i)!.length > 1));
  for (const room of [...single, ...several]) {
    const gates = entrancesOf.get(room)!;
    const was = gates.map((e) => board.cells[board.index(e)]!);
    for (const e of gates) board.cells[board.index(e)] = SEALED_DOOR;
    const after = board.openDistances();
    const r = board.rooms[room]!;
    const gate = new Set(gates.map((e) => board.index(e)));
    let leak = false;
    for (let c = 0; c < after.length && !leak; c++) {
      if (before[c]! >= 0 && after[c]! < 0 && !contains(r, board.point(c)) && !gate.has(c)) leak = true;
    }
    if (leak) {
      gates.forEach((e, n) => (board.cells[board.index(e)] = was[n]!));
      continue;
    }
    for (const e of gates) {
      const existing = doors.find((d) => d.x === e.x && d.y === e.y);
      if (existing) existing.kind = 'sealed';
      else doors.push({ x: e.x, y: e.y, kind: 'sealed' });
    }
    return room;
  }
  return undefined;
}

/** Vault interior, in cells. */
const VAULT_W = 5;
const VAULT_H = 3;

/**
 * A layout with no dead-end room (caves above all) gets a vault bolted on: a 5 x 3 room cut into solid rock
 * behind a one-cell sealed doorway that opens from plain floor. Returns the new room, or undefined when no rock
 * is thick enough.
 */
export function carveVault(board: Board, doors: Door[], rng: Rng): number | undefined {
  const { cells, width, height } = board;
  const starts = rng.shuffle(board.floorCells()).slice(0, 600);
  for (const c of starts) {
    for (const [dx, dy] of rng.shuffle(ORTHOGONAL)) {
      const k = { x: c.x + dx, y: c.y + dy };
      // The room lies beyond the doorway, centred on its line.
      const room: Rect =
        dx !== 0
          ? { x: dx > 0 ? k.x + 1 : k.x - VAULT_W, y: c.y - 1, w: VAULT_W, h: VAULT_H }
          : { x: c.x - 2, y: dy > 0 ? k.y + 1 : k.y - VAULT_H, w: VAULT_W, h: VAULT_H };
      // The room, its wall ring and the doorway cell with its two side walls must all be solid rock.
      const lo = { x: Math.min(room.x - 1, k.x), y: Math.min(room.y - 1, k.y) };
      const hi = { x: Math.max(room.x + room.w, k.x), y: Math.max(room.y + room.h, k.y) };
      if (lo.x < 2 || lo.y < 2 || hi.x > width - 3 || hi.y > height - 3) continue;
      let solid = true;
      for (let y = lo.y; y <= hi.y && solid; y++) for (let x = lo.x; x <= hi.x && solid; x++) solid = cells[y * width + x] === WALL;
      if (!solid) continue;
      fillRect(cells, width, room, FLOOR);
      cells[board.index(k)] = SEALED_DOOR;
      board.doorways[board.index(k)] = 1;
      doors.push({ ...k, kind: 'sealed' });
      return board.addRoom(room);
    }
  }
  return undefined;
}

/**
 * Step 5, "Keys": exactly one key per locked door, on plain room floor reachable from the up stair with no
 * locked, secret or sealed door on the way. Returns the piles and the number of keys that found no spot.
 */
export function placeKeys(board: Board, doors: readonly Door[], rng: Rng): { piles: Pile[]; missing: number } {
  const locked = doors.filter((d) => d.kind === 'locked').length;
  const open = board.openDistances();
  const spots = rng.shuffle(board.roomCells(board.openRooms(), false).filter((p) => open[board.index(p)]! >= 0));
  const piles: Pile[] = [];
  for (let n = 0; n < locked && n < spots.length; n++) {
    const at = spots[n]!;
    board.put(at);
    piles.push({ ...at, contents: [{ kind: 'key' }] });
  }
  return { piles, missing: locked - piles.length };
}
