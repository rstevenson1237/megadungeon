// The main view's map (Spec 01, "Main view and camera"): unseen cells blank, remembered
// cells dimmed, visible cells in full colour; the player on top.

import type { MapState } from '../game/map-state.ts';
import { TILE } from '../rules/world/level.ts';
import { cameraOrigin } from './camera.ts';
import type { Grid } from './grid.ts';
import { MAP } from './palette.ts';
import { MAIN_PANE, inner } from './panes.ts';

const GLYPH_PLAYER = 64;
const GLYPH_FLOOR = 250;
const GLYPH_WALL = 35;
const GLYPH_UP = 60;
const GLYPH_DOWN = 62;

/** Glyph and colour pair for a terrain character in one of its two drawn states. */
function terrain(tile: string, visible: boolean): [number, number] {
  const state = visible ? 'visible' : 'remembered';
  switch (tile) {
    case TILE.wall:
      return [GLYPH_WALL, MAP.wall[state]];
    case TILE.stairsUp:
      return [GLYPH_UP, MAP.stairs[state]];
    case TILE.stairsDown:
      return [GLYPH_DOWN, MAP.stairs[state]];
    default:
      return [GLYPH_FLOOR, MAP.floor[state]];
  }
}

export function drawMap(grid: Grid, state: MapState): void {
  const view = inner(MAIN_PANE);
  const { level, exploration, visible, player } = state;
  const origin = cameraOrigin(level.width, level.height, player, view.w, view.h);
  for (let vy = 0; vy < view.h; vy++) {
    for (let vx = 0; vx < view.w; vx++) {
      const lx = origin.x + vx;
      const ly = origin.y + vy;
      if (lx < 0 || ly < 0 || lx >= level.width || ly >= level.height) continue;
      const i = ly * level.width + lx;
      if (!exploration.explored[i]) continue;
      const [glyph, fg] = terrain(level.tiles[ly]![lx]!, visible[i] === 1);
      grid.set(view.x + vx, view.y + vy, glyph, fg, MAP.background);
    }
  }
  grid.set(view.x + player.x - origin.x, view.y + player.y - origin.y, GLYPH_PLAYER, MAP.player, MAP.background);
}
