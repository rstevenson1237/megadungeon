// The title screen (Spec 01, "Overlays and screens"; Spec 09, "Run lifecycle"): full grid.
// New game with a random seed or the seed of the day, the time mode of the next new game (Spec 01, Addendum B),
// Continue, Leaderboard. The random seed
// is drawn when the screen opens and shown (Spec 02). Continue resumes the saved run at the village of
// its last rest; the app tells the screen whether there is one (task 2.13).

import { formatSeed, randomRunSeed, seedOfTheDay } from '../core/rng.ts';
import type { Command } from '../game/commands.ts';
import type { TimeMode } from '../game/game.ts';
import { COLS, type Grid, ROWS } from './grid.ts';
import { OVERLAY, UI } from './palette.ts';
import { toCp437 } from './cp437.ts';

export interface RunChoice {
  seed: number;
  /** The UTC date, e.g. "2026-10-01", when the seed is the seed of the day. */
  daily?: string;
  /** Turn-based or real time: the run plays in it throughout (Spec 04, Addendum B). */
  time?: TimeMode;
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
  /** The time mode the time row starts on: turn-based unless it says real time. */
  time?: TimeMode;
  /** The time row was switched: the app remembers the choice. */
  onTime?: (time: TimeMode) => void;
}

const BANNER = [
  '╔═══════════════════════════════════════╗',
  '║          M E G A D U N G E O N        ║',
  '╚═══════════════════════════════════════╝',
];

const CREDIT = 'Font: IBM VGA 9x16, The Ultimate Oldschool PC Font Pack by VileR, CC BY-SA 4.0';

type ItemId = 'random' | 'daily' | 'time' | 'continue' | 'leaderboard';

/** The page parameter `?time=real` or `?time=turn` (Spec 01, Addendum B); anything else presets nothing. */
export function timeParam(search: string): TimeMode | undefined {
  const time = new URLSearchParams(search).get('time');
  return time === 'real' || time === 'turn' ? time : undefined;
}

const TIME_NAME: Record<TimeMode, string> = { turn: 'Turn-based', real: 'Real time' };

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
  /** The time mode of the next new game; Enter on the time row switches it. */
  time: TimeMode;
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
    this.time = deps.time ?? 'turn';
    this.items = [
      { id: 'random', label: 'New game: random seed', detail: formatSeed(this.randomSeed) },
      { id: 'daily', label: 'New game: seed of the day', detail: `${this.day}  ${formatSeed(this.dailySeed)}` },
      { id: 'time', label: 'Time', detail: 'Enter to switch, for new games' },
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
        this.start({ seed: this.randomSeed, time: this.time });
        return;
      case 'daily':
        this.start({ seed: this.dailySeed, daily: this.day, time: this.time });
        return;
      case 'time':
        this.time = this.time === 'turn' ? 'real' : 'turn';
        this.deps.onTime?.(this.time);
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
      const label = item.id === 'time' ? `Time: ${TIME_NAME[this.time]}` : item.label;
      grid.text(left, y, `${on ? '> ' : '  '}${label}`, on ? OVERLAY.selectedFg : UI.value, on ? OVERLAY.selectedBg : UI.background);
      const detail = item.id === 'continue' ? (this.hasSave ? 'Resume at your last rest' : 'No saved game') : item.detail;
      grid.text(left + width - [...detail].length, y, detail, on ? OVERLAY.selectedFg : UI.label, on ? OVERLAY.selectedBg : UI.background);
    });

    centre(25, 'W/S or the arrows to choose, Enter or E to confirm.', OVERLAY.hint);
    if (this.notice) centre(27, this.notice, UI.target);
    if (this.deps.warning) centre(29, this.deps.warning, UI.label);
    centre(ROWS - 2, CREDIT, UI.label);
  }
}
