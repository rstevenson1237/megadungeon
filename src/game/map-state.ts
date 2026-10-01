// What the main view needs about the current level: the level, where the player stands,
// what has been explored, which doors are open and what is visible now.

import type { Level, Point } from '../rules/world/level.ts';
import { TILE } from '../rules/world/level.ts';
import { type Exploration, createExploration, updateExploration } from './exploration.ts';

export interface MapState {
  level: Level;
  player: Point;
  exploration: Exploration;
  /** Cell indices (y * width + x) of doors that are open: the level's door delta. Saved. */
  openDoors: number[];
  /** Cells of features that no longer block (smashed pottery): part of the level delta. */
  cleared: number[];
  /**
   * Derived from the level and open doors, so never saved. One byte per cell:
   * 0 where walls and closed doors block movement and sight, 2 where deep water and lava block
   * movement only, 1 elsewhere.
   */
  terrain: Uint8Array;
  /** Derived from the player's position, so never saved: 1 where a cell is visible now. */
  visible: Uint8Array;
}

/**
 * Terrain map for movement and sight: 0 for walls and closed doors (block both), 1 for open cells,
 * 2 for deep water and lava (block movement, never sight: Spec 02, "Liquids" and "Visibility").
 */
export function buildTerrain(level: Level, openDoors: readonly number[], cleared: readonly number[] = []): Uint8Array {
  const terrain = new Uint8Array(level.width * level.height);
  const open = new Set(openDoors);
  for (let y = 0; y < level.height; y++) {
    const row = level.tiles[y]!;
    for (let x = 0; x < level.width; x++) {
      const tile = row[x];
      const cell = y * level.width + x;
      // An open door is passable whatever the tile: a secret door that was found and opened is a wall tile (Spec 06).
      if (open.has(cell)) terrain[cell] = TERRAIN_OPEN;
      else if (tile === TILE.wall || tile === TILE.door) terrain[cell] = TERRAIN_BLOCKED;
      else if (tile === TILE.deepWater || tile === TILE.lava) terrain[cell] = TERRAIN_LIQUID;
      else terrain[cell] = TERRAIN_OPEN;
    }
  }
  // Chests, sacks, racks, pottery, fountains, altars, sarcophagi and levers block movement but not sight (Spec 06).
  const gone = new Set(cleared);
  const block = (p: { x: number; y: number }): void => {
    const cell = p.y * level.width + p.x;
    if (terrain[cell] === TERRAIN_OPEN && !gone.has(cell)) terrain[cell] = TERRAIN_LIQUID;
  };
  for (const f of level.features) if (f.type === 'container' || (f.type === 'fixture' && f.kind !== 'rune')) block(f);
  for (const sp of level.specials) if (sp.kind === 'lever') block(sp);
  return terrain;
}

export const TERRAIN_BLOCKED = 0;
export const TERRAIN_OPEN = 1;
export const TERRAIN_LIQUID = 2;

export interface MapOptions {
  /** Pottery cells already smashed (the level's cleared-cells delta). */
  cleared?: number[];
  /** Doors already open (the level's door delta). */
  openDoors?: number[];
  /** Cells already explored (the level's explored-cells delta). */
  explored?: number[];
  /** Where the player stands; the up stair when omitted. */
  at?: Point;
}

/** Start at `at` (default the up stair) with its surroundings seen, on top of any saved deltas. */
export function createMapState(level: Level, options: MapOptions = {}): MapState {
  const openDoors = options.openDoors ?? [];
  const exploration = createExploration(level);
  if (options.explored) exploration.explored = options.explored;
  const player = { ...(options.at ?? level.upStair) };
  const cleared = options.cleared ?? [];
  const terrain = buildTerrain(level, openDoors, cleared);
  return { level, player, exploration, openDoors, cleared, terrain, visible: updateExploration(exploration, player, terrain) };
}

/** Rebuild the terrain after pottery is smashed. */
export function refreshTerrain(state: MapState): void {
  state.terrain = buildTerrain(state.level, state.openDoors, state.cleared);
}

/** Recompute what is visible after the player moves or a door opens or closes. */
export function refreshSight(state: MapState): void {
  state.visible = updateExploration(state.exploration, state.player, state.terrain);
}

/** True if sight and shots pass through the cell: everything but walls and closed doors. Water and lava let them by. */
export function isClear(state: MapState, x: number, y: number): boolean {
  const { width, height } = state.level;
  return x >= 0 && y >= 0 && x < width && y < height && state.terrain[y * width + x] !== TERRAIN_BLOCKED;
}

/** True if movement and sight pass through the cell. Out-of-bounds cells are blocked. */
export function isOpen(state: MapState, x: number, y: number): boolean {
  const { width, height } = state.level;
  return x >= 0 && y >= 0 && x < width && y < height && state.terrain[y * width + x] === TERRAIN_OPEN;
}
