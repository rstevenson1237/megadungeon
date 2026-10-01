// Draws the message log into its pane (Spec 01, "Message log").

import type { MessageLog } from '../game/log.ts';
import type { Grid } from './grid.ts';
import { LOG_PANE, inner } from './panes.ts';
import { LOG_COLOURS, UI } from './palette.ts';

/** Show the newest messages, oldest at the top, newest at the bottom; this turn's in bright colour. */
export function drawLog(grid: Grid, log: MessageLog, currentTurn: number): void {
  const area = inner(LOG_PANE);
  const lines = log.tail(area.h, currentTurn);
  for (let row = 0; row < area.h; row++) grid.fill(area.x, area.y + row, area.w, 1, 32, UI.text, UI.background);
  lines.forEach((line, i) => {
    const colour = LOG_COLOURS[line.kind];
    grid.text(area.x, area.y + i, line.text, line.current ? colour.bright : colour.dim, UI.background);
  });
}
