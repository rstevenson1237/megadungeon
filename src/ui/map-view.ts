// The main view's map (Spec 01, "Main view and camera"): unseen cells blank, remembered cells dimmed, visible cells
// in full colour. It draws the scene model (Spec 01b; task 6.2) cell by cell: terrain, a found trap, feature, item,
// then whoever stands there, then the targeting overlay.

import type { GameState } from '../game/game.ts';
import type { CellCursor, Targeting } from '../game/targeting.ts';
import { toCp437 } from './cp437.ts';
import { cameraOrigin } from './camera.ts';
import { COLS, type Grid } from './grid.ts';
import { DEFAULT_LOOK, MAP, TARGET, type MapLook } from './palette.ts';
import { MAIN_PANE, inner } from './panes.ts';
import { buildScene } from './scene.ts';

/** The targeting path draws as dots (Spec 01, Targeting), whatever floor glyph the theme uses. */
const GLYPH_DOT = 250;

/** Draw the level; `look` is its theme's colours and tiles (Spec 01, Rendering), the default set when omitted. */
export function drawMap(grid: Grid, state: GameState, targeting: Targeting | null = null, cursor: CellCursor | null = null, look: MapLook = DEFAULT_LOOK): void {
  const view = inner(MAIN_PANE);
  const { level, player } = state.map;
  const origin = cameraOrigin(level.width, level.height, player, view.w, view.h);
  const scene = buildScene(state, { x: origin.x, y: origin.y, w: view.w, h: view.h }, look);
  scene.cells.forEach((cell, i) => {
    if (!cell) return;
    const sx = view.x + (i % view.w);
    const sy = view.y + Math.floor(i / view.w);
    for (const layer of [cell.terrain, cell.trap, cell.feature, cell.item, cell.occupant]) if (layer) grid.set(sx, sy, layer.glyph, layer.fg, MAP.background);
  });
  // Level cell to screen cell, or null when off the window.
  const screen = (x: number, y: number): [number, number] | null => {
    const sx = x - origin.x;
    const sy = y - origin.y;
    return sx < 0 || sy < 0 || sx >= view.w || sy >= view.h ? null : [view.x + sx, view.y + sy];
  };
  if (targeting) drawTargeting(grid, targeting, screen);
  if (cursor) drawCursor(grid, cursor, screen);
}

/** Blink's cell choice: every valid destination tinted, the cursor on top. */
function drawCursor(grid: Grid, c: CellCursor, screen: (x: number, y: number) => [number, number] | null): void {
  for (const p of c.cells) {
    const at = screen(p.x, p.y);
    if (at) grid.setBg(at[0], at[1], TARGET.footprintBg);
  }
  const at = screen(c.at.x, c.at.y);
  if (at) grid.setBg(at[0], at[1], c.ok ? TARGET.selectedBg : TARGET.markedBg);
}

function drawTargeting(grid: Grid, t: Targeting, screen: (x: number, y: number) => [number, number] | null): void {
  for (const c of t.footprint()) {
    const at = screen(c.x, c.y);
    if (at) grid.setBg(at[0], at[1], TARGET.footprintBg);
  }
  for (const c of t.path()) {
    const at = screen(c.x, c.y);
    if (at) grid.set(at[0], at[1], GLYPH_DOT, TARGET.path, grid.bg[at[1] * COLS + at[0]]!);
  }
  for (const m of t.marked()) {
    const at = screen(m.x, m.y);
    if (at) grid.setBg(at[0], at[1], TARGET.markedBg);
  }
  const sel = screen(t.selected.x, t.selected.y);
  if (sel) grid.set(sel[0], sel[1], toCp437(t.selected.glyph), TARGET.selectedFg, TARGET.selectedBg);
}
