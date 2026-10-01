// The death screen (Spec 01, "Overlays and screens"; Spec 09, "Death and new characters"): full grid. The cause and the
// depth, then three ways on. The death is already on the leaderboard when this opens.

import type { Command } from '../game/commands.ts';
import { nextBank } from '../game/lifecycle.ts';
import type { Item } from '../rules/items/types.ts';
import { toCp437 } from './cp437.ts';
import { COLS, type Grid, ROWS } from './grid.ts';
import { OVERLAY, UI } from './palette.ts';

export type DeathChoice = { kind: 'save' } | { kind: 'same_seed'; item?: Item } | { kind: 'new_seed' };

export interface DeathInfo {
  name: string;
  className: string;
  level: number;
  /** The level the character died on. */
  depth: number;
  cause: string;
  /** The bank the dead character held, of which a new character on the seed keeps 10%. */
  bank: number;
  /** What they carried or wore, one of which the next character may keep, named as the player knew it. */
  items: { item: Item; label: string }[];
}

export class DeathScreen {
  selected = 0;
  private step: 'menu' | 'item' = 'menu';
  private itemSelected = 0;

  constructor(
    private readonly info: DeathInfo,
    private readonly choose: (choice: DeathChoice) => void,
  ) {}

  private get options(): { label: string; detail: string }[] {
    return [
      { label: 'Return to last save', detail: 'The same character plays on, as at your last rest.' },
      { label: 'New character, same seed', detail: `The world starts fresh. You keep ${nextBank(this.info.bank)} gp in the bank (20 gp and 10% of ${this.info.bank}) and one item.` },
      { label: 'New seed', detail: 'Back to the title screen.' },
    ];
  }

  handle(command: Command): void {
    const count = this.step === 'menu' ? this.options.length : this.info.items.length;
    switch (command.type) {
      case 'move':
        if (command.dy === 0) return;
        if (this.step === 'menu') this.selected = (this.selected + command.dy + count) % count;
        else this.itemSelected = (this.itemSelected + command.dy + count) % count;
        return;
      case 'cancel':
        if (this.step === 'item') this.step = 'menu';
        return;
      case 'confirm':
      case 'interact':
        if (this.step === 'item') {
          this.choose({ kind: 'same_seed', item: this.info.items[this.itemSelected]!.item });
          return;
        }
        if (this.selected === 0) this.choose({ kind: 'save' });
        else if (this.selected === 2) this.choose({ kind: 'new_seed' });
        else if (this.info.items.length === 0) this.choose({ kind: 'same_seed' });
        else this.step = 'item';
        return;
    }
  }

  draw(grid: Grid): void {
    grid.clear(UI.background);
    const centre = (y: number, text: string, fg: number): void => grid.text(Math.floor((COLS - [...text].length) / 2), y, text, fg, UI.background);
    centre(5, 'Y O U   H A V E   D I E D', 0xe05040);
    centre(8, `${this.info.name} the ${this.info.className}, level ${this.info.level}`, UI.value);
    centre(10, `Died on level ${this.info.depth}`, UI.gold);
    centre(11, this.info.cause, UI.label);
    centre(13, 'Your death is on the leaderboard.', OVERLAY.hint);
    const width = 70;
    const left = Math.floor((COLS - width) / 2);
    if (this.step === 'menu') {
      this.options.forEach((option, i) => {
        const on = i === this.selected;
        const y = 17 + i * 3;
        grid.fill(left, y, width, 1, toCp437(' '), UI.text, on ? OVERLAY.selectedBg : UI.background);
        grid.text(left, y, `${on ? '> ' : '  '}${option.label}`, on ? OVERLAY.selectedFg : UI.value, on ? OVERLAY.selectedBg : UI.background);
        grid.text(left + 2, y + 1, option.detail.slice(0, width - 2), UI.label, UI.background);
      });
    } else {
      centre(16, 'Choose one item to keep:', UI.value);
      const room = ROWS - 24;
      const first = Math.max(0, Math.min(this.itemSelected - Math.floor(room / 2), this.info.items.length - room));
      this.info.items.slice(first, first + room).forEach(({ label }, i) => {
        const on = first + i === this.itemSelected;
        const y = 18 + i;
        grid.fill(left, y, width, 1, toCp437(' '), UI.text, on ? OVERLAY.selectedBg : UI.background);
        grid.text(left, y, `${on ? '> ' : '  '}${label}`, on ? OVERLAY.selectedFg : UI.value, on ? OVERLAY.selectedBg : UI.background);
      });
    }
    centre(ROWS - 3, this.step === 'menu' ? 'W/S or the arrows to choose, Enter to confirm.' : 'W/S choose, Enter keep it, Esc back.', OVERLAY.hint);
  }
}
