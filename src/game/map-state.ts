// What the main view needs about the current level: the level, where the player stands,
// what has been explored and what is visible now. Task 1.8 replaces `stepPlayer` with the
// turn loop (doors, monsters, turns); here it only moves and updates sight.

import type { Level, Point } from '../rules/world/level.ts';
import { TILE } from '../rules/world/level.ts';
import { type Exploration, createExploration, updateExploration } from './exploration.ts';

export interface MapState {
  level: Level;
  player: Point;
  exploration: Exploration;
  /** Derived from the player's position, so never saved: 1 where a cell is visible now. */
  visible: Uint8Array;
}

/** Start on the up stair with its surroundings seen. */
export function createMapState(level: Level): MapState {
  const exploration = createExploration(level);
  const player = { ...level.upStair };
  return { level, player, exploration, visible: updateExploration(level, exploration, player) };
}

/** Move one cell in an orthogonal direction if it is not a wall. Returns true if the player moved. */
export function stepPlayer(state: MapState, dx: number, dy: number): boolean {
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false;
  const x = state.player.x + dx;
  const y = state.player.y + dy;
  if (state.level.tiles[y]?.[x] === undefined || state.level.tiles[y]![x] === TILE.wall) return false;
  state.player = { x, y };
  state.visible = updateExploration(state.level, state.exploration, state.player);
  return true;
}
