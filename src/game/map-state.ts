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
  /**
   * Derived from the level and open doors, so never saved. One byte per cell:
   * 0 where walls and closed doors block movement and sight, 1 elsewhere.
   */
  terrain: Uint8Array;
  /** Derived from the player's position, so never saved: 1 where a cell is visible now. */
  visible: Uint8Array;
}

/** Terrain map for movement and sight: 0 for walls and closed doors, 1 for everything else. */
export function buildTerrain(level: Level, openDoors: readonly number[]): Uint8Array {
  const terrain = new Uint8Array(level.width * level.height);
  const open = new Set(openDoors);
  for (let y = 0; y < level.height; y++) {
    const row = level.tiles[y]!;
    for (let x = 0; x < level.width; x++) {
      const tile = row[x];
      terrain[y * level.width + x] = tile === TILE.wall || (tile === TILE.door && !open.has(y * level.width + x)) ? 0 : 1;
    }
  }
  return terrain;
}

/** Start on the up stair with its surroundings seen. */
export function createMapState(level: Level, openDoors: number[] = []): MapState {
  const exploration = createExploration(level);
  const player = { ...level.upStair };
  const terrain = buildTerrain(level, openDoors);
  return { level, player, exploration, openDoors, terrain, visible: updateExploration(exploration, player, terrain) };
}

/** Recompute what is visible after the player moves or a door opens or closes. */
export function refreshSight(state: MapState): void {
  state.visible = updateExploration(state.exploration, state.player, state.terrain);
}

/** True if movement and sight pass through the cell. Out-of-bounds cells are blocked. */
export function isOpen(state: MapState, x: number, y: number): boolean {
  const { width, height } = state.level;
  return x >= 0 && y >= 0 && x < width && y < height && state.terrain[y * width + x] === 1;
}
