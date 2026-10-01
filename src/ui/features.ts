// The overlays for what a level's features offer (Spec 01, "Overlays and screens"; Spec 06): the pick-up list of an
// opened container, the offering at an altar, and the journal of everything read.

import type { Command } from '../game/commands.ts';
import { journalByLevel, listLines } from '../game/features/index.ts';
import type { Game, JournalEntry } from '../game/game.ts';
import { wrapText } from '../game/log.ts';
import { describeItem } from '../rules/items/magic.ts';
import type { Item } from '../rules/items/types.ts';
import type { ItemCtx } from '../game/items.ts';
import type { Grid } from './grid.ts';
import { FULL_WINDOW, Menu, type MenuItem, type Overlay, type OverlayResult, centred, drawWindow } from './overlay.ts';
import { OVERLAY, UI } from './palette.ts';
import { inner } from './panes.ts';

/** What the pick-up list asks of the shell. */
export interface LootHost {
  take(index: number, which: number | 'all'): void;
}

const KIND_TITLE: Record<string, string> = { chest: 'Chest', sack: 'Sack', rack: 'Weapon rack', pottery: 'Pot', sarcophagus: 'Sarcophagus' };

/** The pick-up list of an opened container (Spec 01, Spec 06): Enter takes the selected line, or everything that fits. Taking costs nothing. */
export class LootOverlay implements Overlay {
  selected = 0;

  constructor(
    private readonly game: Game,
    private readonly index: number,
    private readonly host: LootHost,
  ) {}

  private lines(): string[] {
    return listLines(this.game, this.index);
  }

  draw(grid: Grid): void {
    const f = this.game.state.map.level.features[this.index]!;
    const lines = this.lines();
    const rows = [...lines, ...(lines.length > 1 ? ['Take all'] : [])];
    const w = Math.min(60, Math.max(30, ...rows.map((l) => l.length + 6)));
    const r = centred(w, Math.max(rows.length, 1) + 5);
    drawWindow(grid, r, KIND_TITLE[f.type === 'fixture' ? f.kind : f.type === 'container' ? f.kind : ''] ?? 'Container');
    if (rows.length === 0) grid.text(r.x + 2, r.y + 2, 'Empty.', UI.label, UI.background);
    rows.forEach((line, i) => {
      const on = i === this.selected;
      grid.text(r.x + 2, r.y + 2 + i, `${on ? '> ' : '  '}${line}`.padEnd(r.w - 4), on ? OVERLAY.selectedFg : UI.value, on ? OVERLAY.selectedBg : UI.background);
    });
    grid.text(r.x + 2, r.y + r.h - 2, 'Enter take  Esc close', OVERLAY.hint, UI.background);
  }

  handle(command: Command): OverlayResult {
    const lines = this.lines();
    const rows = lines.length + (lines.length > 1 ? 1 : 0);
    switch (command.type) {
      case 'move':
        if (command.dy !== 0 && rows > 0) this.selected = (this.selected + command.dy + rows) % rows;
        return {};
      case 'confirm': {
        if (rows === 0) return { close: true };
        this.host.take(this.index, this.selected < lines.length ? this.selected : 'all');
        const left = this.lines().length;
        this.selected = Math.min(this.selected, Math.max(0, left + (left > 1 ? 1 : 0) - 1));
        return left === 0 ? { close: true } : {};
      }
      case 'cancel':
        return { close: true };
      default:
        return {};
    }
  }
}

/** What the altar menu asks of the shell. */
export interface OfferHost {
  offer(index: number, what: 'gold' | Item): void;
}

/** The offering at an altar (Spec 06): the gold it asks, or one item of the pack. */
export function offerMenu(ctx: ItemCtx, index: number, cost: number, host: OfferHost): Menu {
  const items: MenuItem[] = [
    { label: `Offer ${cost} gp${ctx.player.coins < cost ? ' (you have too little)' : ''}`, choose: () => (host.offer(index, 'gold'), { close: true }) },
    ...ctx.player.pack.map((item): MenuItem => ({ label: `Offer ${describeItem(item, ctx.knowledge)}`, choose: () => (host.offer(index, item), { close: true }) })),
    { label: 'Leave', choose: () => ({ close: true }) },
  ];
  return new Menu('Altar', items, 'Make an offering, then your Magic is tested.');
}

const KIND_LABEL: Record<JournalEntry['kind'], string> = { sign: 'Sign', graffiti: 'Graffiti', book: 'Book', rune: 'Rune', rumour: 'Rumour', quest: 'Quest' };

/** The lines of the journal: each level that has entries, then its entries wrapped (Spec 06). */
export function journalLines(journal: readonly JournalEntry[], width = 64): { text: string; header: boolean }[] {
  const out: { text: string; header: boolean }[] = [];
  for (const { depth, entries } of journalByLevel(journal)) {
    out.push({ text: depth === 0 ? 'Surface' : `Level ${depth}`, header: true });
    for (const e of entries) {
      wrapText(`${KIND_LABEL[e.kind]}: ${e.text}`, width - 2).forEach((line, i) => out.push({ text: `${i === 0 ? '' : '  '}${line}`, header: false }));
    }
  }
  return out;
}

/** The journal overlay (J): everything read, grouped by level, scrolled with W and S. */
export class JournalOverlay implements Overlay {
  scroll = 0;

  constructor(private readonly journal: () => readonly JournalEntry[]) {}

  private get rows(): number {
    return inner(FULL_WINDOW).h - 1;
  }

  draw(grid: Grid): void {
    drawWindow(grid, FULL_WINDOW, 'Journal');
    const area = inner(FULL_WINDOW);
    const lines = journalLines(this.journal(), area.w - 2);
    if (lines.length === 0) grid.text(area.x + 1, area.y, 'Nothing read yet. Signs, graffiti, books and runes are kept here.', UI.label, UI.background);
    const first = Math.max(0, Math.min(this.scroll, lines.length - this.rows));
    lines.slice(first, first + this.rows).forEach((line, i) => {
      grid.text(area.x + 1 + (line.header ? 0 : 2), area.y + i, line.text, line.header ? UI.gold : UI.value, UI.background);
    });
    grid.text(area.x + 1, area.y + area.h - 1, 'W/S scroll  Esc close', OVERLAY.hint, UI.background);
  }

  handle(command: Command): OverlayResult {
    if (command.type === 'move' && command.dy !== 0) {
      const total = journalLines(this.journal()).length;
      this.scroll = Math.max(0, Math.min(Math.max(0, total - this.rows), this.scroll + command.dy));
      return {};
    }
    return command.type === 'cancel' || command.type === 'journal' ? { close: true } : {};
  }
}
