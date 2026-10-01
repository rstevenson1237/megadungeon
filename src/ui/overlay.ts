// The overlay framework (Spec 01, "Overlays and screens"): boxed windows drawn
// over the main view so the character pane and log stay visible. An overlay
// takes the keyboard while open and closes with Esc.

import type { Command } from '../game/commands.ts';
import { wrapText } from '../game/log.ts';
import type { LogMessage } from '../core/log.ts';
import type { Grid } from './grid.ts';
import { MAIN_PANE, type Rect, drawFrame } from './panes.ts';
import { OVERLAY, UI } from './palette.ts';

/** What an overlay asks the shell to do after a key. Nothing set means stay as is. */
export interface OverlayResult {
  /** Close this overlay. */
  close?: boolean;
  /** Open another overlay (after closing this one, if `close` is also set). */
  open?: Overlay;
  /** Add a message to the log. */
  message?: LogMessage;
  /** Add several messages to the log, in order. */
  messages?: readonly LogMessage[];
}

export interface Overlay {
  /** Draw the whole window, frame included. */
  draw(grid: Grid, currentTurn: number): void;
  /** React to a command. Esc (cancel) closes by default; overlays may override. */
  handle(command: Command): OverlayResult;
}

/** The window covering the whole main pane (70 x 28 usable). */
export const FULL_WINDOW: Rect = MAIN_PANE;

/** A window of the given size, centred in the main pane. */
export function centred(w: number, h: number): Rect {
  return { x: MAIN_PANE.x + Math.floor((MAIN_PANE.w - w) / 2), y: MAIN_PANE.y + Math.floor((MAIN_PANE.h - h) / 2), w, h };
}

/** Clear a window's interior and draw its frame and title. */
export function drawWindow(grid: Grid, r: Rect, title: string): void {
  grid.fill(r.x, r.y, r.w, r.h, 32, UI.text, UI.background);
  drawFrame(grid, r, title, OVERLAY.frame);
}

export interface MenuItem {
  label: string;
  /** Called on Enter. */
  choose: () => OverlayResult;
}

/**
 * A vertical menu: arrows or W/S move the selection (wrapping), Enter chooses,
 * Esc closes, so a player never needs to leave the movement keys.
 */
export class Menu implements Overlay {
  selected = 0;

  constructor(
    private readonly title: string,
    private readonly items: readonly MenuItem[],
    private readonly intro?: string,
  ) {}

  private get window(): Rect {
    const widest = Math.max(this.title.length + 6, this.intro?.length ?? 0, ...this.items.map((i) => i.label.length + 4));
    const w = Math.min(widest + 4, MAIN_PANE.w - 2);
    return centred(w, this.items.length + 4 + (this.intro ? 2 : 0));
  }

  draw(grid: Grid): void {
    const r = this.window;
    drawWindow(grid, r, this.title);
    let y = r.y + 2;
    if (this.intro) {
      grid.text(r.x + 2, y, this.intro, OVERLAY.hint, UI.background);
      y += 2;
    }
    this.items.forEach((item, i) => {
      const on = i === this.selected;
      const text = `${on ? '> ' : '  '}${item.label}`.padEnd(r.w - 4);
      grid.text(r.x + 2, y + i, text, on ? OVERLAY.selectedFg : UI.value, on ? OVERLAY.selectedBg : UI.background);
    });
  }

  handle(command: Command): OverlayResult {
    const n = this.items.length;
    switch (command.type) {
      case 'move':
        if (command.dy !== 0) this.selected = (this.selected + command.dy + n) % n;
        return {};
      case 'confirm':
        return this.items[this.selected]!.choose();
      case 'cancel':
        return { close: true };
      default:
        return {};
    }
  }
}

/** One row of a list: its text, what is shown at the right (a price), and what choosing it does. */
export interface ListRow {
  label: string;
  detail?: string;
  /** Drawn dimmed: it cannot be chosen now, but the player may want to see it. */
  dim?: boolean;
  choose: () => OverlayResult;
}

/**
 * A list that can be long and can change as it is used (a shop's stock, a quest board): the rows are asked for each
 * time, so a purchase that removes one shows at once. Long labels wrap; the list scrolls to keep the selection in view.
 */
export class ListMenu implements Overlay {
  selected = 0;

  constructor(
    private readonly title: string,
    private readonly rows: () => readonly ListRow[],
    private readonly intro: () => string = () => '',
    private readonly empty = 'There is nothing here.',
    /** Size the window to its rows instead of filling the main view. */
    private readonly compact = false,
  ) {}

  draw(grid: Grid): void {
    const rows = this.rows();
    this.selected = Math.max(0, Math.min(this.selected, rows.length - 1));
    const width = Math.min(MAIN_PANE.w - 2, 68);
    const lines = rows.reduce((n, row) => n + wrapText(row.label, width - 8).length, 0);
    const r = centred(width, this.compact ? Math.min(MAIN_PANE.h - 2, lines + 6 + (this.intro() ? 2 : 0)) : MAIN_PANE.h - 2);
    drawWindow(grid, r, this.title);
    const intro = this.intro();
    let y = r.y + 2;
    if (intro) {
      grid.text(r.x + 2, y, intro, OVERLAY.hint, UI.background);
      y += 2;
    }
    if (rows.length === 0) {
      grid.text(r.x + 2, y, this.empty, UI.label, UI.background);
    }
    const room = r.y + r.h - 3 - y;
    const detailWidth = Math.max(0, ...rows.map((row) => row.detail?.length ?? 0));
    const labelWidth = r.w - 6 - (detailWidth > 0 ? detailWidth + 2 : 0);
    const wrapped = rows.map((row) => wrapText(row.label, labelWidth));
    // Scroll so the selected row is fully on screen.
    let first = 0;
    const height = (i: number): number => wrapped[i]!.length;
    const used = (from: number, to: number): number => wrapped.slice(from, to + 1).reduce((n, w) => n + w.length, 0);
    while (first < this.selected && used(first, this.selected) > room) first++;
    let line = 0;
    for (let i = first; i < rows.length && line + height(i) <= room; i++) {
      const row = rows[i]!;
      const on = i === this.selected;
      const fg = on ? OVERLAY.selectedFg : row.dim ? OVERLAY.hint : UI.value;
      const bg = on ? OVERLAY.selectedBg : UI.background;
      wrapped[i]!.forEach((text, n) => {
        grid.text(r.x + 2, y + line + n, `${n === 0 ? (on ? '> ' : '  ') : '  '}${text}`.padEnd(r.w - 4), fg, bg);
      });
      if (row.detail) grid.text(r.x + r.w - 2 - row.detail.length, y + line, row.detail, on ? OVERLAY.selectedFg : UI.gold, bg);
      line += height(i);
    }
    grid.text(r.x + 2, r.y + r.h - 2, 'W/S choose  Enter select  Esc back', OVERLAY.hint, UI.background);
  }

  handle(command: Command): OverlayResult {
    const rows = this.rows();
    switch (command.type) {
      case 'move':
        if (command.dy !== 0 && rows.length > 0) this.selected = (this.selected + command.dy + rows.length) % rows.length;
        return {};
      case 'confirm':
        return rows[this.selected]?.choose() ?? {};
      case 'cancel':
        return { close: true };
      default:
        return {};
    }
  }
}
