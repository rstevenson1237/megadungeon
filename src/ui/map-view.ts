// The main view's map (Spec 01, "Main view and camera"): unseen cells blank, remembered
// cells dimmed, visible cells in full colour. Draw order per cell: terrain, feature, item,
// monster or player, then the targeting overlay.

import type { GameState } from '../game/game.ts';
import type { Targeting } from '../game/targeting.ts';
import { TILE } from '../rules/world/level.ts';
import { toCp437 } from './cp437.ts';
import { cameraOrigin } from './camera.ts';
import { COLS, type Grid } from './grid.ts';
import { MAP, TARGET } from './palette.ts';
import { MAIN_PANE, inner } from './panes.ts';

const GLYPH_PLAYER = 64;
const GLYPH_FLOOR = 250;
const GLYPH_WALL = 35;
const GLYPH_UP = 60;
const GLYPH_DOWN = 62;
const GLYPH_DOOR_CLOSED = 43;
const GLYPH_DOOR_OPEN = 39;

/** Glyph and colour pair for a terrain character in one of its two drawn states. */
function terrain(tile: string, visible: boolean, open: boolean): [number, number] {
  const state = visible ? 'visible' : 'remembered';
  switch (tile) {
    case TILE.wall:
      return [GLYPH_WALL, MAP.wall[state]];
    case TILE.stairsUp:
      return [GLYPH_UP, MAP.stairs[state]];
    case TILE.stairsDown:
      return [GLYPH_DOWN, MAP.stairs[state]];
    case TILE.door:
      return [open ? GLYPH_DOOR_OPEN : GLYPH_DOOR_CLOSED, MAP.door[state]];
    default:
      return [GLYPH_FLOOR, MAP.floor[state]];
  }
}

export function drawMap(grid: Grid, state: GameState, targeting: Targeting | null = null): void {
  const view = inner(MAIN_PANE);
  const { level, exploration, visible, player, openDoors } = state.map;
  const origin = cameraOrigin(level.width, level.height, player, view.w, view.h);
  const open = new Set(openDoors);
  // Level cell to screen cell, or null when off the window.
  const screen = (x: number, y: number): [number, number] | null => {
    const sx = x - origin.x;
    const sy = y - origin.y;
    return sx < 0 || sy < 0 || sx >= view.w || sy >= view.h ? null : [view.x + sx, view.y + sy];
  };

  for (let vy = 0; vy < view.h; vy++) {
    for (let vx = 0; vx < view.w; vx++) {
      const lx = origin.x + vx;
      const ly = origin.y + vy;
      if (lx < 0 || ly < 0 || lx >= level.width || ly >= level.height) continue;
      const i = ly * level.width + lx;
      if (!exploration.explored[i]) continue;
      const [glyph, fg] = terrain(level.tiles[ly]![lx]!, visible[i] === 1, open.has(i));
      grid.set(view.x + vx, view.y + vy, glyph, fg, MAP.background);
    }
  }

  // Monsters show only on visible cells, never on remembered ones.
  for (const m of state.monsters) {
    const at = screen(m.x, m.y);
    if (at && visible[m.y * level.width + m.x]) grid.set(at[0], at[1], toCp437(m.glyph), m.colour, MAP.background);
  }
  const me = screen(player.x, player.y);
  if (me) grid.set(me[0], me[1], GLYPH_PLAYER, MAP.player, MAP.background);

  if (targeting) drawTargeting(grid, targeting, screen);
}

function drawTargeting(grid: Grid, t: Targeting, screen: (x: number, y: number) => [number, number] | null): void {
  for (const c of t.footprint()) {
    const at = screen(c.x, c.y);
    if (at) grid.setBg(at[0], at[1], TARGET.footprintBg);
  }
  for (const c of t.path()) {
    const at = screen(c.x, c.y);
    if (at) grid.set(at[0], at[1], GLYPH_FLOOR, TARGET.path, grid.bg[at[1] * COLS + at[0]]!);
  }
  for (const m of t.marked()) {
    const at = screen(m.x, m.y);
    if (at) grid.setBg(at[0], at[1], TARGET.markedBg);
  }
  const sel = screen(t.selected.x, t.selected.y);
  if (sel) grid.set(sel[0], sel[1], toCp437(t.selected.glyph), TARGET.selectedFg, TARGET.selectedBg);
}
