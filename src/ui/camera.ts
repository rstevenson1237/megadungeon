// The camera (Spec 01, "Main view and camera"): centred on the player, clamped at level
// edges so no empty space shows past a wall; a level smaller than the window is centred in it.

import type { Point } from '../rules/world/level.ts';

/** Map cells shown in the main view. */
export const VIEW_W = 70;
export const VIEW_H = 28;

function axis(view: number, size: number, at: number): number {
  if (size <= view) return size === view ? 0 : -Math.floor((view - size) / 2);
  return Math.min(Math.max(at - Math.floor(view / 2), 0), size - view);
}

/**
 * Level coordinates of the window's top-left cell. Negative when the level is smaller than
 * the window on that axis, which centres it.
 */
export function cameraOrigin(levelW: number, levelH: number, player: Point, viewW = VIEW_W, viewH = VIEW_H): Point {
  return { x: axis(viewW, levelW, player.x), y: axis(viewH, levelH, player.y) };
}
