// The overlays that need nothing from later systems: message history, help,
// and the game menu. (Inventory, spells, journal and the rest arrive with
// their own tasks.)

import type { Command } from '../game/commands.ts';
import type { MessageLog } from '../game/log.ts';
import { wrapText } from '../game/log.ts';
import type { Grid } from './grid.ts';
import { KEY_BINDINGS } from './input.ts';
import { FULL_WINDOW, Menu, type Overlay, type OverlayResult, drawWindow } from './overlay.ts';
import { LOG_COLOURS, OVERLAY, UI } from './palette.ts';
import { inner } from './panes.ts';

const closeOnCancel = (command: Command): OverlayResult | undefined => (command.type === 'cancel' ? { close: true } : undefined);

/** The last 200 log lines, scrollable with arrows or W/S. Starts at the newest line. */
export class HistoryOverlay implements Overlay {
  /** How many lines back from the newest the view is scrolled. */
  scroll = 0;

  constructor(
    private readonly log: MessageLog,
    private readonly turn: number,
  ) {}

  private get rows(): number {
    return inner(FULL_WINDOW).h - 1; // the last row holds the hint line
  }

  private maxScroll(total: number): number {
    return Math.max(0, total - this.rows);
  }

  draw(grid: Grid): void {
    drawWindow(grid, FULL_WINDOW, 'Message History');
    const area = inner(FULL_WINDOW);
    const lines = this.log.lines(this.turn);
    const end = lines.length - Math.min(this.scroll, this.maxScroll(lines.length));
    const shown = lines.slice(Math.max(0, end - this.rows), end);
    shown.forEach((line, i) => {
      const colour = LOG_COLOURS[line.kind];
      grid.text(area.x, area.y + i, line.text, line.current ? colour.bright : colour.dim, UI.background);
    });
    const first = Math.max(0, end - this.rows) + 1;
    const position = lines.length === 0 ? 'No messages' : `Lines ${first}-${end} of ${lines.length}`;
    const hint = 'W/S scroll  Esc close';
    grid.text(area.x, area.y + area.h - 1, hint, OVERLAY.hint, UI.background);
    grid.text(area.x + area.w - position.length, area.y + area.h - 1, position, OVERLAY.hint, UI.background);
  }

  handle(command: Command): OverlayResult {
    if (command.type === 'move' && command.dy !== 0) {
      const total = this.log.lines(this.turn).length;
      // Up scrolls to older lines (dy -1), down to newer ones.
      this.scroll = Math.max(0, Math.min(this.maxScroll(total), this.scroll - command.dy));
      return {};
    }
    return closeOnCancel(command) ?? {};
  }
}

/** The key list, built from the key map so the two cannot drift apart. */
export class HelpOverlay implements Overlay {
  draw(grid: Grid): void {
    drawWindow(grid, FULL_WINDOW, 'Help');
    const area = inner(FULL_WINDOW);
    const keyWidth = 20;
    let y = area.y + 1;
    for (const b of KEY_BINDINGS) {
      const lines = wrapText(b.action, area.w - keyWidth - 2);
      grid.text(area.x + 1, y, b.keys, UI.gold, UI.background);
      lines.forEach((text, i) => grid.text(area.x + 1 + keyWidth, y + i, text, UI.value, UI.background));
      y += lines.length;
    }
    grid.text(area.x + 1, y + 1, 'In menus, arrows or W/S move the selection and Enter confirms.', OVERLAY.hint, UI.background);
    grid.text(area.x + 1, area.y + area.h - 1, 'Esc close', OVERLAY.hint, UI.background);
  }

  handle(command: Command): OverlayResult {
    return closeOnCancel(command) ?? {};
  }
}

/** What the game menu can offer beyond help and quitting: the app provides each, or the item says it is not available. */
export interface GameMenuHost {
  /** The leaderboard window. */
  leaderboard?: () => Overlay;
  /** Download the save as a file. */
  exportSave?: () => void;
  /** Load a save from a file, replacing the one in the browser. */
  importSave?: () => void;
}

/**
 * The game menu Esc opens when there is nothing to cancel (Spec 01, Spec 09). `onQuit` returns to the title screen
 * without saving: everything since the last rest is lost, and Continue loads that rest.
 */
export function gameMenu(onQuit?: () => void, host: GameMenuHost = {}): Menu {
  const unavailable = (what: string): OverlayResult => ({
    close: true,
    message: { kind: 'system', text: `${what} is not available.` },
  });
  return new Menu('Game Menu', [
    { label: 'Help', choose: () => ({ close: true, open: new HelpOverlay() }) },
    { label: 'Leaderboard', choose: () => (host.leaderboard ? { close: true, open: host.leaderboard() } : unavailable('The leaderboard')) },
    { label: 'Export save to a file', choose: () => (host.exportSave ? (host.exportSave(), { close: true }) : unavailable('Export')) },
    { label: 'Import save from a file', choose: () => (host.importSave ? (host.importSave(), { close: true }) : unavailable('Import')) },
    {
      label: 'Quit without saving',
      choose: () => (onQuit ? (onQuit(), { close: true }) : unavailable('Quitting')),
    },
  ]);
}
