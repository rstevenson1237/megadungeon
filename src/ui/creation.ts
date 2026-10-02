// Character creation (Spec 01, Addendum A; Spec 03, "Character creation"): full grid. Step 1 picks the class from the
// 20, showing each one's starting dice, major ability, level 10 dice, starting spells and starting gear; step 2 takes a
// name, typed or random. Finishing starts the run, which is saved at once (Spec 09, Addendum A).

import { wrapText } from '../game/log.ts';
import type { ClassDef } from '../rules/character/character.ts';
import type { PoolName, Step } from '../rules/character/dice.ts';
import { toCp437 } from './cp437.ts';
import { COLS, type Grid, ROWS } from './grid.ts';
import { type KeyInput, keyToCommand } from './input.ts';
import { OVERLAY, UI } from './palette.ts';

/** The longest name, and the characters a name may hold (Spec 01, Addendum A). */
export const NAME_LIMIT = 16;
const NAME_CHAR = /^[A-Za-z' -]$/;

/** What the screen shows about one class. */
export interface ClassCard {
  cls: ClassDef;
  levelTen: Record<PoolName, Step>;
  /** "2 (Arcane Bolt and 1 more)", or "none". */
  spells: string;
  /** Each starting item, named. */
  gear: string[];
}

export interface CreationSetup {
  cards: readonly ClassCard[];
  /** The seed line under the heading, e.g. "Random seed 0A1B2C3D". */
  seed: string;
  /** After a same-seed death: what the new character keeps (Spec 09). */
  inheritance?: string;
  /** A random name: the nth asked for on this screen, or undefined when the table is empty. */
  randomName: (asked: number) => string | undefined;
  /** The player finished: the chosen class and name. */
  done: (cls: ClassDef, name: string) => void;
  /** Esc on the class list: back to where creation came from. */
  back: () => void;
}

const dice = (s: Record<PoolName, Step>): string => `d${s.combat} / d${s.skill} / d${s.magic}`;

export class CreationScreen {
  step: 'class' | 'name' = 'class';
  selected = 0;
  name = '';
  /** How many random names have been asked for, so Tab gives the next one. */
  private asked = 0;

  constructor(private readonly setup: CreationSetup) {}

  get card(): ClassCard {
    return this.setup.cards[this.selected]!;
  }

  /** Raw keys, since the name step types letters (W, A, S and D among them). Returns true if the key was used. */
  handle(e: KeyInput): boolean {
    return this.step === 'class' ? this.handleClass(e) : this.handleName(e);
  }

  private handleClass(e: KeyInput): boolean {
    const command = keyToCommand(e);
    if (!command) return false;
    const n = this.setup.cards.length;
    if (command.type === 'move' && command.dy !== 0) this.selected = (this.selected + command.dy + n) % n;
    else if (command.type === 'confirm' || command.type === 'interact') this.step = 'name';
    else if (command.type === 'cancel') this.setup.back();
    return true;
  }

  private handleName(e: KeyInput): boolean {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    switch (e.key) {
      case 'Escape':
        this.step = 'class';
        return true;
      case 'Backspace':
        this.name = this.name.slice(0, -1);
        return true;
      case 'Tab':
        this.name = this.nextRandom() ?? this.name;
        return true;
      case 'Enter': {
        const name = this.name.trim() || this.nextRandom() || 'Nameless';
        this.setup.done(this.card.cls, name);
        return true;
      }
      default:
        if (e.key.length === 1 && NAME_CHAR.test(e.key) && this.name.length < NAME_LIMIT && !(e.key === ' ' && this.name.length === 0)) this.name += e.key;
        return e.key.length === 1;
    }
  }

  private nextRandom(): string | undefined {
    return this.setup.randomName(this.asked++);
  }

  draw(grid: Grid): void {
    grid.clear(UI.background);
    const centre = (y: number, text: string, fg: number): void => grid.text(Math.floor((COLS - [...text].length) / 2), y, text, fg, UI.background);
    centre(2, 'C R E A T E   A   C H A R A C T E R', UI.gold);
    centre(3, this.setup.seed, UI.label);
    if (this.setup.inheritance) centre(4, this.setup.inheritance, UI.target);

    // The class list on the left.
    const left = 6;
    grid.text(left, 6, 'CLASS', UI.title, UI.background);
    this.setup.cards.forEach((card, i) => {
      const on = i === this.selected;
      const y = 8 + i;
      const bg = on && this.step === 'class' ? OVERLAY.selectedBg : UI.background;
      grid.fill(left, y, 24, 1, toCp437(' '), UI.text, bg);
      grid.text(left, y, `${on ? '> ' : '  '}${card.cls.name}`, on ? OVERLAY.selectedFg : UI.value, bg);
    });

    // The chosen class on the right.
    const x = 34;
    const width = COLS - x - 4;
    const card = this.card;
    let y = 6;
    const line = (label: string, value: string, fg: number = UI.value): void => {
      grid.text(x, y, label, UI.label, UI.background);
      const lines = wrapText(value, width - 16);
      lines.forEach((l, i) => grid.text(x + 16, y + i, l, fg, UI.background));
      y += Math.max(1, lines.length);
    };
    grid.text(x, y, card.cls.name.toUpperCase(), UI.title, UI.background);
    y += 2;
    line('Starting dice', `${dice(card.cls.start)}  (Combat / Skill / Magic)`);
    line('Level 10 dice', dice(card.levelTen));
    y++;
    line('Major ability', card.cls.majorAbility.name, UI.bright);
    line('', card.cls.majorAbility.text);
    y++;
    line('Spells', card.spells);
    line('Starting gear', card.gear.length > 0 ? card.gear.join(', ') : 'nothing');

    // The name, once the class is chosen.
    y = 30;
    if (this.step === 'name') {
      grid.text(x, y, 'Name', UI.label, UI.background);
      grid.fill(x + 16, y, NAME_LIMIT + 1, 1, toCp437(' '), UI.text, OVERLAY.selectedBg);
      grid.text(x + 16, y, `${this.name}_`, OVERLAY.selectedFg, OVERLAY.selectedBg);
      centre(ROWS - 4, 'Type a name (letters, spaces, \' and -). Tab: a random name. Enter: begin. Esc: choose again.', OVERLAY.hint);
    } else {
      centre(ROWS - 4, 'W/S or the arrows to choose a class, Enter to confirm, Esc to go back.', OVERLAY.hint);
    }
  }
}
