// The inventory screen (Spec 01, "Overlays and screens"; Spec 05): slots used and total, what is worn and
// wielded by slot, then the pack. Enter on a row offers its actions: use, equip, unequip, drop, inspect.

import type { Command } from '../game/commands.ts';
import { type ItemCtx, inspectItem, itemName } from '../game/items.ts';
import { describeItem } from '../rules/items/magic.ts';
import { slotsUsed } from '../rules/items/inventory.ts';
import { EQUIP_SLOTS, type EquipSlot, type Item } from '../rules/items/types.ts';
import type { Grid } from './grid.ts';
import { FULL_WINDOW, Menu, type MenuItem, type Overlay, type OverlayResult, centred, drawWindow } from './overlay.ts';
import { OVERLAY, UI } from './palette.ts';
import { inner } from './panes.ts';

/** What the inventory asks of the shell; each acts on the game and logs what happened. */
export interface InventoryHost {
  equip(item: Item): void;
  unequip(slot: EquipSlot): void;
  drop(item: Item): void;
  use(item: Item): void;
}

const SLOT_LABEL: Record<EquipSlot, string> = {
  main: 'Main hand',
  off: 'Off hand',
  ranged: 'Ranged',
  body: 'Body',
  cloak: 'Cloak',
  boots: 'Boots',
  gloves: 'Gloves',
  hat: 'Hat',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
};

interface Row {
  label: string;
  item?: Item;
  slot?: EquipSlot;
}

/** The quality shown after a piece of gear: Broken, or its quality. */
const qualityOf = (item: Item): string => (item.kind === 'weapon' || item.kind === 'ranged' || item.kind === 'armour' || item.kind === 'shield' ? (item.broken ? 'Broken' : item.quality[0]!.toUpperCase() + item.quality.slice(1)) : '');

/** The one-line text of an item: its name as the player knows it, and its quality. */
export function itemLine(ctx: ItemCtx, item: Item): string {
  const text = describeItem(item, ctx.knowledge);
  const quality = qualityOf(item);
  return quality ? `${text} (${quality})` : text;
}

export class InventoryOverlay implements Overlay {
  selected = 0;

  constructor(
    private readonly ctx: ItemCtx,
    private readonly host: InventoryHost,
  ) {}

  /** Every row, in order: the ten equipment slots, then the pack. */
  rows(): Row[] {
    const { equipment, pack } = this.ctx.player;
    return [
      ...EQUIP_SLOTS.map((slot): Row => ({ label: SLOT_LABEL[slot], slot, ...(equipment[slot] ? { item: equipment[slot]! } : {}) })),
      ...pack.map((item): Row => ({ label: '', item })),
    ];
  }

  draw(grid: Grid): void {
    drawWindow(grid, FULL_WINDOW, 'Inventory');
    const area = inner(FULL_WINDOW);
    const { player } = this.ctx;
    const used = slotsUsed(player);
    grid.text(area.x + 1, area.y, `Slots ${used}/${player.packSlots}`, used > player.packSlots ? UI.statCombat : UI.value, UI.background);
    grid.text(area.x + 20, area.y, `${player.coins} gp`, UI.gold, UI.background);
    const rows = this.rows();
    const listTop = area.y + 2;
    const room = area.h - 4;
    const first = Math.max(0, Math.min(this.selected - Math.floor(room / 2), rows.length - room));
    rows.slice(first, first + room).forEach((row, i) => {
      const y = listTop + i;
      const on = first + i === this.selected;
      const fg = on ? OVERLAY.selectedFg : UI.value;
      const bg = on ? OVERLAY.selectedBg : UI.background;
      grid.fill(area.x + 1, y, area.w - 2, 1, 32, fg, bg);
      if (row.slot) {
        grid.text(area.x + 2, y, row.label.padEnd(11), on ? OVERLAY.selectedFg : UI.label, bg);
        grid.text(area.x + 13, y, row.item ? itemLine(this.ctx, row.item) : '-', row.item ? fg : UI.label, bg);
      } else grid.text(area.x + 2, y, itemLine(this.ctx, row.item!), fg, bg);
    });
    grid.text(area.x + 1, area.y + area.h - 1, 'W/S select  Enter actions  Esc close', OVERLAY.hint, UI.background);
  }

  handle(command: Command): OverlayResult {
    const rows = this.rows();
    switch (command.type) {
      case 'move':
        if (command.dy !== 0) this.selected = (this.selected + command.dy + rows.length) % rows.length;
        return {};
      case 'confirm': {
        const row = rows[this.selected];
        return row?.item ? { open: this.actions(row) } : {};
      }
      case 'cancel':
      case 'inventory':
        return { close: true };
      default:
        return {};
    }
  }

  /** The action menu for a row: what can be done to this item now. */
  private actions(row: Row): Menu {
    const item = row.item!;
    const done = (run: () => void): OverlayResult => (run(), { close: true });
    const items: MenuItem[] = [];
    const wearable = ['weapon', 'ranged', 'armour', 'shield', 'staff', 'ring', 'clothing', 'artifact'].includes(item.kind);
    if (row.slot) items.push({ label: 'Unequip', choose: () => done(() => this.host.unequip(row.slot!)) });
    else if (wearable) items.push({ label: 'Equip', choose: () => done(() => this.host.equip(item)) });
    if (['potion', 'wand', 'rod', 'staff', 'clothing', 'spellbook'].includes(item.kind)) {
      items.push({ label: item.kind === 'spellbook' ? 'Read' : 'Use', choose: () => done(() => this.host.use(item)) });
    }
    items.push({ label: 'Drop', choose: () => done(() => this.host.drop(item)) });
    items.push({ label: 'Inspect', choose: () => ({ close: true, open: new TextWindow(itemName(this.ctx, item), inspectItem(this.ctx, item)) }) });
    return new Menu(itemName(this.ctx, item), items);
  }
}

/** A small boxed window of text lines, closed with Esc or Enter. */
export class TextWindow implements Overlay {
  constructor(
    private readonly title: string,
    private readonly lines: readonly string[],
  ) {}

  draw(grid: Grid): void {
    const w = Math.min(60, Math.max(this.title.length + 6, ...this.lines.map((l) => l.length + 4)));
    const r = centred(w, this.lines.length + 4);
    drawWindow(grid, r, this.title);
    this.lines.forEach((line, i) => grid.text(r.x + 2, r.y + 2 + i, line, UI.value, UI.background));
  }

  handle(command: Command): OverlayResult {
    return command.type === 'cancel' || command.type === 'confirm' ? { close: true } : {};
  }
}
