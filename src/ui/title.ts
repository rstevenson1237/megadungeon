// The title screen (Spec 01, "Overlays and screens"; Spec 09, "Run lifecycle"): full grid.
// New game with a random seed or the seed of the day, Continue, Leaderboard. The random seed
// is drawn when the screen opens and shown (Spec 02). Continue resumes the saved run at the village of
// its last rest; the app tells the screen whether there is one (task 2.13).

import { formatSeed, randomRunSeed, seedOfTheDay } from '../core/rng.ts';
import type { Command } from '../game/commands.ts';
import { COLS, type Grid, ROWS } from './grid.ts';
import { OVERLAY, UI } from './palette.ts';
import { toCp437 } from './cp437.ts';

export interface RunChoice {
  seed: number;
  /** The UTC date, e.g. "2026-10-01", when the seed is the seed of the day. */
  daily?: string;
}

export interface TitleDeps {
  /** Draws a random run seed. */
  randomSeed?: () => number;
  /** The current time, for the seed of the day. */
  now?: () => Date;
  /** Continue was chosen and there is a save. */
  onContinue?: () => void;
  /** The leaderboard was chosen. */
  onLeaderboard?: () => void;
  /** Shown once, before the first game: where the save lives and what deletes it (Spec 09). */
  warning?: string;
}

const BANNER = [
  '╔═══════════════════════════════════════╗',
  '║          M E G A D U N G E O N        ║',
  '╚═══════════════════════════════════════╝',
];

const CREDIT = 'Font: IBM VGA 9x16, The Ultimate Oldschool PC Font Pack by VileR, CC BY-SA 4.0';

type ItemId = 'random' | 'daily' | 'continue' | 'leaderboard';

export class TitleScreen {
  selected = 0;
  /** The random seed this screen offers, drawn once when it opens. */
  readonly randomSeed: number;
  /** The UTC date and seed of the day, fixed when the screen opens. */
  readonly day: string;
  readonly dailySeed: number;
  /** The last note to the player, e.g. that there is nothing to continue. */
  notice = '';
  /** Whether a saved run waits: the app finds out asynchronously and sets it. */
  hasSave = false;
  private readonly items: { id: ItemId; label: string; detail: string }[];
  private readonly deps: TitleDeps;

  /**
   * @param start Called with the chosen seed when a new game starts.
   */
  constructor(
    private readonly start: (choice: RunChoice) => void,
    deps: TitleDeps = {},
  ) {
    const now = (deps.now ?? (() => new Date()))();
    this.randomSeed = (deps.randomSeed ?? randomRunSeed)() >>> 0;
    this.day = now.toISOString().slice(0, 10);
    this.dailySeed = seedOfTheDay(this.day);
    this.deps = deps;
    this.items = [
      { id: 'random', label: 'New game: random seed', detail: formatSeed(this.randomSeed) },
      { id: 'daily', label: 'New game: seed of the day', detail: `${this.day}  ${formatSeed(this.dailySeed)}` },
      { id: 'continue', label: 'Continue', detail: '' },
      { id: 'leaderboard', label: 'Leaderboard', detail: '' },
    ];
  }

  /** W/S or arrows move (wrapping); Enter or E choose. Other commands do nothing here. */
  handle(command: Command): void {
    const n = this.items.length;
    switch (command.type) {
      case 'move':
        if (command.dy !== 0) this.selected = (this.selected + command.dy + n) % n;
        return;
      case 'confirm':
      case 'interact':
        this.choose(this.items[this.selected]!.id);
        return;
    }
  }

  private choose(id: ItemId): void {
    switch (id) {
      case 'random':
        this.start({ seed: this.randomSeed });
        return;
      case 'daily':
        this.start({ seed: this.dailySeed, daily: this.day });
        return;
      case 'continue':
        if (this.hasSave && this.deps.onContinue) this.deps.onContinue();
        else this.notice = 'There is no saved game yet. A game is saved when you rest at a village lodging.';
        return;
      case 'leaderboard':
        if (this.deps.onLeaderboard) this.deps.onLeaderboard();
        else this.notice = 'The leaderboard is not available.';
        return;
    }
  }

  draw(grid: Grid): void {
    grid.clear(UI.background);
    const centre = (y: number, text: string, fg: number): void => grid.text(Math.floor((COLS - [...text].length) / 2), y, text, fg, UI.background);
    BANNER.forEach((line, i) => centre(5 + i, line, UI.gold));
    centre(10, 'A roguelike megadungeon of 100 levels.', UI.label);

    const width = 58;
    const left = Math.floor((COLS - width) / 2);
    this.items.forEach((item, i) => {
      const on = i === this.selected;
      const y = 15 + i * 2;
      grid.fill(left, y, width, 1, toCp437(' '), UI.text, on ? OVERLAY.selectedBg : UI.background);
      grid.text(left, y, `${on ? '> ' : '  '}${item.label}`, on ? OVERLAY.selectedFg : UI.value, on ? OVERLAY.selectedBg : UI.background);
      const detail = item.id === 'continue' ? (this.hasSave ? 'Resume at your last rest' : 'No saved game') : item.detail;
      grid.text(left + width - [...detail].length, y, detail, on ? OVERLAY.selectedFg : UI.label, on ? OVERLAY.selectedBg : UI.background);
    });

    centre(25, 'W/S or the arrows to choose, Enter or E to confirm.', OVERLAY.hint);
    if (this.notice) centre(27, this.notice, UI.target);
    if (this.deps.warning) centre(29, this.deps.warning, UI.label);
    centre(ROWS - 2, CREDIT, UI.label);
  }
}
