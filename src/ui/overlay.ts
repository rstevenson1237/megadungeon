// The overlay framework (Spec 01, "Overlays and screens"): boxed windows drawn
// over the main view so the character pane and log stay visible. An overlay
// takes the keyboard while open and closes with Esc.

import type { Command } from '../game/commands.ts';
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
