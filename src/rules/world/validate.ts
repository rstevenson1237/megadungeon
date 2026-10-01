// Step 12 of the pipeline, "Validate" (Spec 02): four-direction connectivity (deep water and lava count
// as walls), the stair rules, and the reachability and door rules for everything steps 4 to 11 place.

import {
  FLOOR,
  ORTHOGONAL,
  SECRET_DOOR,
  STAIRS_DOWN,
  STAIRS_UP,
  WALL,
  distancesFrom,
  isOpenWalkable,
  isWalkable,
  toCells,
} from './grid.ts';
import { distanceSq } from './geometry.ts';
import { MAX_DEPTH, type Level, type Point } from './level.ts';
import { entranceRooms, roomIndexMap } from './placement/board.ts';

/** True when `dist` is at least 60% of `longest`, the longest walkable distance from the up stair (Spec 02, step 3). */
export const farEnough = (dist: number, longest: number): boolean => dist * 5 >= longest * 3;

/** Monsters keep this far from the up stair (Spec 02, step 8): none within 8 cells. */
const SAFE_RADIUS_SQ = 64;

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
  if (problems.length > 0) return problems;
  return placementProblems(level, cells);
}

const key = (p: Point): string => `${p.x},${p.y}`;

/** The rules of "Reachability and door rules" for doors, keys and everything placed (Spec 02, task 2.4). */
function placementProblems(level: Level, cells: Uint8Array): string[] {
  const { width, height } = level;
  const problems: string[] = [];
  const idx = (p: Point): number => p.y * width + p.x;
  const roomOf = roomIndexMap(level.rooms, width, height);

  // Doors: a known kind, drawn as the spec says, in a one-cell doorway with wall on both sides.
  const doorAt = new Set<string>();
  for (const d of level.doors) {
    const tile = level.tiles[d.y]![d.x];
    const want = d.kind === 'secret' ? '#' : '+';
    if (tile !== want) problems.push(`${d.kind} door at ${key(d)} is drawn as "${tile}", not "${want}"`);
    if (doorAt.has(key(d))) problems.push(`two doors at ${key(d)}`);
    doorAt.add(key(d));
    const i = idx(d);
    const sideways = cells[i - 1] === WALL && cells[i + 1] === WALL;
    const upright = cells[i - width] === WALL && cells[i + width] === WALL;
    if (!sideways && !upright) problems.push(`door at ${key(d)} is not in a one-cell doorway with wall on both sides`);
    if (ORTHOGONAL.some(([dx, dy]) => doorAt.has(key({ x: d.x + dx, y: d.y + dy })))) problems.push(`doors side by side at ${key(d)}`);
  }

  // The critical path: stairs, teleporters and the boss with no secret, locked or sealed door, deep water or lava.
  const open = distancesFrom(cells, width, height, level.upStair, isOpenWalkable);
  const noSecret = distancesFrom(cells, width, height, level.upStair, (c) => isWalkable(c) && c !== SECRET_DOOR);
  const critical: [string, Point][] = [];
  if (level.downStair) critical.push(['down stair', level.downStair]);
  for (const s of level.specials) if (s.kind === 'teleporter' || s.kind === 'landing') critical.push([s.kind, s]);
  for (const m of level.monsters) if (m.role === 'boss') critical.push(['boss', m]);
  for (const [what, p] of critical) {
    if (open[idx(p)]! < 0) problems.push(`${what} at ${key(p)} needs a secret, locked or sealed door to reach`);
  }

  // Keys: one per locked door, each reachable without passing any locked door (or secret one).
  const locked = level.doors.filter((d) => d.kind === 'locked').length;
  const keys = level.piles.filter((p) => p.contents.some((c) => c.kind === 'key'));
  if (keys.length !== locked) problems.push(`${locked} locked doors but ${keys.length} keys`);
  for (const k of keys) if (open[idx(k)]! < 0) problems.push(`key at ${key(k)} is behind a locked or secret door`);

  // Quest goals and link pieces: reachable without a secret door; the loot of a link piece also without a locked one.
  const holders: (Point & { contents: Level['piles'][number]['contents'] })[] = [
    ...level.piles,
    ...level.features.flatMap((f) => (f.type === 'container' ? [f] : [])),
  ];
  for (const h of holders) {
    for (const c of h.contents) {
      const needsOpen = c.kind === 'vault_key' || c.kind === 'map_fragment';
      const dist = needsOpen ? open : c.kind === 'quest_item' ? noSecret : undefined;
      if (dist && dist[idx(h)]! < 0) problems.push(`${c.kind} at ${key(h)} cannot be reached without ${needsOpen ? 'a locked or secret' : 'a secret'} door`);
    }
  }
  for (const n of level.npcs) {
    if ((n.quest || n.link) && noSecret[idx(n)]! < 0) problems.push(`${n.kind} "${n.name}" at ${key(n)} is behind a secret door`);
  }
  for (const m of level.monsters) {
    if (m.quest && noSecret[idx(m)]! < 0) problems.push(`${m.name} of quest ${m.quest} at ${key(m)} is behind a secret door`);
  }

  // Every placed thing stands on plain floor (a lore mark on wall), and no two share a cell.
  const taken = new Map<string, string>();
  const stand = (what: string, p: Point, tile: number = FLOOR): void => {
    if (cells[idx(p)] !== tile) problems.push(`${what} at ${key(p)} is not on ${tile === FLOOR ? 'plain floor' : 'wall'}`);
    const was = taken.get(key(p));
    if (was) problems.push(`${what} shares ${key(p)} with ${was}`);
    taken.set(key(p), what);
  };
  for (const f of level.features) stand(f.type, f);
  for (const p of level.piles) stand('pile', p);
  for (const t of level.traps) stand('trap', t);
  for (const m of level.monsters) stand(`monster ${m.name}`, m);
  for (const n of level.npcs) stand(`${n.kind} ${n.name}`, n);
  for (const l of level.lore) stand(`${l.kind} mark`, l, WALL);
  // (An altar of a rune word and a vault's chest are also features, so only the others stand alone.)
  for (const s of level.specials) if (s.kind === 'teleporter' || s.kind === 'landing' || s.kind === 'lever') stand(s.kind, s);

  // Traps never lie in a doorway.
  for (const t of level.traps) {
    if (entranceRooms(cells, width, roomOf, t.x, t.y).length > 0) problems.push(`trap at ${key(t)} is in a doorway`);
  }

  // Monsters keep out of the safe radius around the up stair.
  for (const m of level.monsters) {
    if (distanceSq(m, level.upStair) <= SAFE_RADIUS_SQ) problems.push(`${m.name} at ${key(m)} is within 8 cells of the up stair`);
  }
  for (const n of level.npcs) {
    if (n.kind === 'bandit' && distanceSq(n, level.upStair) <= SAFE_RADIUS_SQ) problems.push(`bandit at ${key(n)} is within 8 cells of the up stair`);
  }

  // Containers, fixtures and NPCs never block: every other walkable cell is still reachable from the up stair.
  const solid = new Set<number>();
  for (const f of level.features) if (f.type !== 'debris') solid.add(idx(f));
  for (const n of level.npcs) solid.add(idx(n));
  if (solid.size > 0) {
    const around = distancesFrom(cells, width, height, level.upStair, (c) => isWalkable(c));
    // distancesFrom cannot skip single cells, so count with a fresh search that treats them as walls.
    const blocked = cells.slice();
    for (const i of solid) blocked[i] = WALL;
    const reach = distancesFrom(blocked, width, height, level.upStair);
    for (let i = 0; i < cells.length; i++) {
      if (isWalkable(cells[i]!) && !solid.has(i) && reach[i]! < 0 && around[i]! >= 0) {
        problems.push(`a container, fixture or NPC cuts ${i % width},${Math.floor(i / width)} off from the up stair`);
        break;
      }
    }
  }
  return problems;
}

export const isValid = (level: Level): boolean => findProblems(level).length === 0;
