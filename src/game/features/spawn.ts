// Creatures that arrive during play (Spec 02, "Restocking and wandering monsters"; Spec 06): wanderers, summons,
// a water creature, an undead rising. They come from the depth table by the rating ceiling.

import type { LogMessage } from '../../core/log.ts';
import { eligibleEntries, pickWeighted } from '../../core/roller.ts';
import type { Monster as MonsterRow } from '../../core/schemas.ts';
import { ratingCeiling } from '../../rules/world/depth.ts';
import { monsterBudget, restockCount } from '../../rules/world/restock.ts';
import { distanceSq } from '../../rules/world/geometry.ts';
import type { Point } from '../../rules/world/level.ts';
import { placedFrom, withinCeiling } from '../../rules/world/placement/contents.ts';
import { alert, hurtPlayer } from '../combat.ts';
import type { Game } from '../game.ts';
import { TERRAIN_OPEN } from '../map-state.ts';
import { type Monster, spawn } from '../monsters.ts';
import { ORTH, around, cellOf, depthOf, inBounds, trapAt } from './common.ts';

/**
 * A row of the monsters table that can appear at this depth (its dice within the rating ceiling, Spec 02),
 * preferring ones with all the given tags and falling back to any eligible row.
 */
export function pickRow(game: Game, tags: readonly string[] = [], lowestOnly = false): MonsterRow | undefined {
  const depth = depthOf(game);
  const rows = withinCeiling(eligibleEntries(game.content.monsters, { depth }), ratingCeiling(depth));
  const wanted = tags.length > 0 ? rows.filter((r) => tags.every((t) => r.tags?.includes(t))) : [];
  const pool = wanted.length > 0 ? wanted : rows;
  if (pool.length === 0) return undefined;
  if (lowestOnly) {
    const dice = (r: MonsterRow): number => Number(/^(\d+)d/.exec(r.rating)?.[1] ?? 1);
    const least = Math.min(...pool.map(dice));
    return pickWeighted(pool.filter((r) => dice(r) === least), game.rng);
  }
  return pickWeighted(pool, game.rng);
}

/** A free open cell beside a point: orthogonal neighbours first, then diagonal ones. */
export function freeBeside(game: Game, at: Point): Point | undefined {
  const { map } = game.state;
  const ok = (p: Point): boolean =>
    inBounds(game, p.x, p.y) && map.terrain[cellOf(game, p)] === TERRAIN_OPEN && !game.monsterAt(p.x, p.y) && !(map.player.x === p.x && map.player.y === p.y) && !trapAt(game, p.x, p.y);
  const orth = ORTH.map(([dx, dy]) => ({ x: at.x + dx, y: at.y + dy })).filter(ok);
  if (orth.length > 0) return game.rng.pick(orth);
  const diag = around(game, at).filter(ok);
  return diag.length > 0 ? game.rng.pick(diag) : undefined;
}

/** Bring a creature of the row into play at a cell, hunting. */
export function placeCreature(game: Game, row: MonsterRow, at: Point): Monster {
  const { monsters } = game.state;
  const id = monsters.reduce((n, m) => Math.max(n, m.id), -1) + 1;
  const group = monsters.reduce((n, m) => Math.max(n, m.group), -1) + 1;
  const m = spawn(placedFrom(row, at, group), id);
  m.awareness = 'alert';
  monsters.push(m);
  return m;
}

/** Summon a creature of the depth table beside a point (a summoning trap, a water creature, an undead rising, vermin). */
export function summon(game: Game, near: Point, messages: LogMessage[], tags: readonly string[] = [], lowestOnly = false): Monster | undefined {
  const row = pickRow(game, tags, lowestOnly);
  const at = freeBeside(game, near);
  if (!row || !at) return undefined;
  const m = placeCreature(game, row, at);
  messages.push({ kind: 'warning', text: `A ${m.name} appears!` });
  return m;
}

/**
 * A wandering monster arrives (Spec 02, Spec 06): it enters from out of sight, never adjacent to the player, and
 * hunts. With no eligible row, or no such cell, nothing comes.
 */
export function wanderer(game: Game, messages: LogMessage[]): Monster | undefined {
  const { map } = game.state;
  const row = pickRow(game);
  if (!row) return undefined;
  const cells: Point[] = [];
  const { width, height } = map.level;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (map.terrain[i] !== TERRAIN_OPEN || map.visible[i] === 1 || distanceSq({ x, y }, map.player) <= 2 || game.monsterAt(x, y) || trapAt(game, x, y)) continue;
      cells.push({ x, y });
    }
  }
  if (cells.length === 0) return undefined;
  const m = placeCreature(game, row, game.rng.pick(cells));
  messages.push({ kind: 'warning', text: 'Something stirs in the dark, and it is coming for you.' });
  return m;
}

/**
 * The player returns to a level after `turnsAway` turns (Spec 02): new monsters from the depth table as it stands, out of
 * sight of where the player arrives, each asleep or unaware like any placed monster. Returns how many came.
 */
export function restock(game: Game, turnsAway: number): number {
  const { map, monsters } = game.state;
  const alive = monsters.filter((m) => m.role === 'normal' && m.kind === 'monster').length;
  const count = restockCount(monsterBudget(map.level), turnsAway, alive);
  if (count === 0) return 0;
  const cells: Point[] = [];
  const { width, height } = map.level;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (map.terrain[i] !== TERRAIN_OPEN || map.visible[i] === 1 || game.monsterAt(x, y) || trapAt(game, x, y) || (map.player.x === x && map.player.y === y)) continue;
      cells.push({ x, y });
    }
  }
  const spots = game.rng.shuffle(cells);
  let placed = 0;
  while (placed < count && spots.length > 0) {
    const row = pickRow(game);
    if (!row) break;
    const at = spots.pop()!;
    const id = monsters.reduce((n, m) => Math.max(n, m.id), -1) + 1;
    const group = monsters.reduce((n, m) => Math.max(n, m.group), -1) + 1;
    monsters.push(spawn(placedFrom(row, at, group), id, game.rng));
    placed++;
  }
  return placed;
}

/** Every unaware creature within `radius` cells of a point is alerted: the noise of forcing a lock or smashing pottery (Spec 06). */
export function noiseAt(game: Game, at: Point, radius: number): void {
  for (const m of game.state.monsters) {
    if (m.awareness === 'unaware' && m.kind !== 'rival' && distanceSq(m, at) <= radius * radius) alert(game, m);
  }
}

/** Move the player to a random walkable cell of the level: no creature, no trap, not where they stand. */
export function teleportPlayer(game: Game, messages: LogMessage[]): void {
  const { map } = game.state;
  const { width, height } = map.level;
  const cells: Point[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (map.terrain[y * width + x] === TERRAIN_OPEN && !game.monsterAt(x, y) && !trapAt(game, x, y) && !(map.player.x === x && map.player.y === y)) cells.push({ x, y });
    }
  }
  if (cells.length === 0) return;
  map.player = game.rng.pick(cells);
  game.refreshSight();
  messages.push({ kind: 'warning', text: 'The world lurches, and you stand somewhere else.' });
}

/** The strain of forcing a lock, the lid of a sarcophagus, a trap's bite: one Combat die as a hit takes one (Spec 03). */
export const hurt = (game: Game, messages: LogMessage[], cause: string): boolean => hurtPlayer(game, messages, { hit: `${cause}.`, kill: `${cause}, and it kills you.` });
