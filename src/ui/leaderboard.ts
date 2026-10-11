// The leaderboard screen (Spec 01, "Overlays and screens"; Spec 09): every character that died or won, deepest level
// first. All runs, or the seed of the day only. A full-grid screen from the title, a window over the main view from the
// game menu; Enter switches the view, Tab cycles the time filter (Spec 09, Addendum B) and Esc closes.

import type { Command } from '../game/commands.ts';
import { type BoardEntry, type Leaderboard, type TimeFilter, timeOf } from '../game/leaderboard.ts';
import { TRUNCATED } from './cp437.ts';
import { COLS, type Grid, ROWS } from './grid.ts';
import { type Overlay, type OverlayResult, drawWindow } from './overlay.ts';
import { OVERLAY, UI } from './palette.ts';
import { FULL_WINDOW } from './overlay.ts';
import { type Rect, inner } from './panes.ts';

export const FULL_GRID: Rect = { x: 0, y: 0, w: COLS, h: ROWS };

const fit = (text: string, width: number): string => (text.length > width ? `${text.slice(0, Math.max(0, width - 1))}${TRUNCATED}` : text);
const outcomeText = (e: BoardEntry): string => {
  switch (e.outcome) {
    case 'final_boss':
      return 'Defeated the final boss';
    case 'reached_100':
      return e.cause ? `Reached level 100, then died on level ${e.diedAtLevel}` : 'Reached level 100';
    default:
      return `Died on level ${e.diedAtLevel ?? e.deepest}: ${e.cause ?? 'unknown'}`;
  }
};

/** Tab's order of the time filter, and how the title names each (Spec 09, Addendum B). */
const FILTERS: readonly TimeFilter[] = ['all', 'turn', 'real'];
const FILTER_NAME: Record<TimeFilter, string> = { all: 'All', turn: 'Turn-based', real: 'Real time' };

/** The class column: the class, then "RT" for a real-time run. */
const classText = (e: BoardEntry): string => (timeOf(e) === 'real' ? `${e.className} RT` : e.className);

export class LeaderboardOverlay implements Overlay {
  /** The seed-of-the-day view when set. */
  daily = false;
  /** Which time mode's runs show. */
  time: TimeFilter = 'all';
  scroll = 0;

  constructor(
    private readonly board: Leaderboard,
    private readonly today: string,
    private readonly area: Rect = FULL_WINDOW,
  ) {}

  entries(): BoardEntry[] {
    return this.board.view(this.daily ? { daily: this.today } : 'all', this.time);
  }

  draw(grid: Grid): void {
    const which = this.daily ? `seed of the day, ${this.today}` : 'all runs';
    drawWindow(grid, this.area, `Leaderboard: ${which}, time: ${FILTER_NAME[this.time]}`);
    const r = inner(this.area);
    const wide = r.w >= 90;
    const cols: [string, number][] = [['#', 3], ['Name', 11], ['Class', 14], ['Lv', 3], ['Deepest', 7], ['Kills', 5], ['Score', 9]];
    if (wide) cols.push(['Seed', 9]);
    const used = cols.reduce((n, [, w]) => n + w + 1, 0);
    cols.push(['Outcome', Math.max(10, r.w - used - 1)]);
    let x = r.x + 1;
    for (const [label, width] of cols) {
      grid.text(x, r.y, label, UI.label, UI.background);
      x += width + 1;
    }
    const rows = this.entries();
    const none = this.time !== 'all' ? `No ${FILTER_NAME[this.time].toLowerCase()} runs here yet.` : this.daily ? 'No runs on this seed of the day yet.' : 'Nothing here yet. Every character that dies or wins is recorded.';
    if (rows.length === 0) grid.text(r.x + 1, r.y + 2, none, UI.label, UI.background);
    const room = r.h - 4;
    const first = Math.max(0, Math.min(this.scroll, rows.length - room));
    rows.slice(first, first + room).forEach((e, i) => {
      const cells = [String(first + i + 1), e.name, classText(e), String(e.level), String(e.deepest), String(e.kills), e.score.toLocaleString('en-US'), ...(wide ? [e.seed.toString(16).toUpperCase().padStart(8, '0')] : []), outcomeText(e)];
      let cx = r.x + 1;
      cells.forEach((text, n) => {
        const width = cols[n]![1];
        grid.text(cx, r.y + 2 + i, fit(text, width), n === 4 ? UI.gold : n === cols.length - 1 && e.outcome !== 'died' ? UI.bright : UI.value, UI.background);
        cx += width + 1;
      });
    });
    grid.text(r.x + 1, r.y + r.h - 1, 'W/S scroll  Enter all runs / seed of the day  Tab time  Esc close', OVERLAY.hint, UI.background);
  }

  handle(command: Command): OverlayResult {
    switch (command.type) {
      case 'move':
        if (command.dy !== 0) this.scroll = Math.max(0, this.scroll + command.dy);
        return {};
      case 'confirm':
        this.daily = !this.daily;
        this.scroll = 0;
        return {};
      case 'nextTarget':
      case 'prevTarget': {
        const step = command.type === 'nextTarget' ? 1 : FILTERS.length - 1;
        this.time = FILTERS[(FILTERS.indexOf(this.time) + step) % FILTERS.length]!;
        this.scroll = 0;
        return {};
      }
      case 'cancel':
        return { close: true };
      default:
        return {};
    }
  }
}
