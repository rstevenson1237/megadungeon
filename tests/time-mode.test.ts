import { describe, expect, it } from 'vitest';
import type { TimeMode } from '../src/game/game.ts';
import { type BoardEntry, Leaderboard, MemoryStorage } from '../src/game/leaderboard.ts';
import { boardEntry, creationContentOf } from '../src/game/lifecycle.ts';
import { SAVE_FORMAT, parseSave, restoreRun, serialise, toSave } from '../src/game/save.ts';
import { MemoryStore, SaveSlot } from '../src/game/store.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { classById } from '../src/rules/character/classes.ts';
import { App, TIME_KEY } from '../src/ui/app.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { timeParam } from '../src/ui/title.ts';
import { content, createAs, townRun } from './helpers.ts';

// Task 5.6 (Spec 01 and Spec 09, Addendum B): the time mode end to end. The title's time row and `?time=` choose the
// mode of a new game, the save keeps it (format 7), Continue plays it, and the leaderboard records and filters by it.

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

interface Rig {
  app: App;
  store: MemoryStore;
  board: Leaderboard;
  flags: MemoryStorage;
}

function rig(options: { time?: TimeMode; flags?: MemoryStorage; store?: MemoryStore; board?: Leaderboard } = {}): Rig {
  const store = options.store ?? new MemoryStore();
  const board = options.board ?? new Leaderboard(new MemoryStorage());
  const flags = options.flags ?? new MemoryStorage();
  const app = new App({
    creation: creationContentOf(content().bundle),
    randomSeed: () => 0x1234abcd,
    now: () => new Date('2026-10-01T12:00:00Z'),
    runOptions: (seed) => runOptionsFor(content().bundle, seed),
    saves: new SaveSlot(store),
    board,
    flags,
    contentVersion: 'test',
    ...(options.time ? { time: options.time } : {}),
  });
  return { app, store, board, flags };
}

const press = (app: App, ...keys: string[]): void => keys.forEach((key) => app.handleKey({ key }));
const lines = (app: App): string[] => {
  const g = new Grid();
  app.draw(g);
  return Array.from({ length: 40 }, (_, y) => Array.from({ length: COLS }, (_, x) => CP437_TO_UNICODE[g.glyph[y * COLS + x]!]).join(''));
};
const text = (app: App): string => lines(app).join('\n');
/** Choose a row of the open list by its text. */
function choose(app: App, label: string): void {
  for (let i = 0; i < 20; i++) {
    if (lines(app).some((l) => l.includes(`> ${label}`))) return void press(app, 'Enter');
    press(app, 's');
  }
  throw new Error(`no row "${label}"`);
}
/** From the title: a new random-seed game with a Thief. */
async function begin(app: App): Promise<void> {
  choose(app, 'New game: random seed');
  createAs(app, 'Thief', 'Mara');
  await flush();
}

describe('Spec 01, Addendum B: the time row on the title screen', () => {
  it('sits under New game, reads "Time: Turn-based", and Enter switches it', () => {
    const { app } = rig();
    const rows = lines(app);
    const at = (label: string): number => rows.findIndex((l) => l.includes(label));
    expect(at('Time: Turn-based')).toBeGreaterThan(at('New game: seed of the day'));
    expect(at('Time: Turn-based')).toBeLessThan(at('Continue'));
    choose(app, 'Time: Turn-based');
    expect(text(app)).toContain('> Time: Real time');
    expect(app.title).not.toBeNull(); // the row switches; no game starts
    press(app, 'Enter');
    expect(text(app)).toContain('> Time: Turn-based');
  });

  it('a new game plays the chosen mode: turn-based by default, real time after switching', async () => {
    const turn = rig();
    await begin(turn.app);
    expect(turn.app.shell!.run!.time).toBe('turn');
    expect(turn.app.realTime).toBe(false);

    const real = rig();
    choose(real.app, 'Time: Turn-based');
    await begin(real.app);
    expect(real.app.shell!.run!.time).toBe('real');
    real.app.shell!.run!.travel('down');
    expect(real.app.shell!.game!.time).toBe('real');
    expect(real.app.realTime).toBe(true);
  });

  it('the seed of the day takes the chosen mode too', async () => {
    const { app } = rig();
    choose(app, 'Time: Turn-based');
    choose(app, 'New game: seed of the day');
    createAs(app, 'Thief', 'Mara');
    await flush();
    expect(app.shell!.run!.daily).toBe('2026-10-01');
    expect(app.shell!.run!.time).toBe('real');
  });

  it('the choice is remembered in local storage for the next visit', () => {
    const first = rig();
    choose(first.app, 'Time: Turn-based');
    expect(first.flags.getItem(TIME_KEY)).toBe('real');
    const next = rig({ flags: first.flags });
    expect(text(next.app)).toContain('Time: Real time');
    choose(next.app, 'Time: Real time');
    expect(first.flags.getItem(TIME_KEY)).toBe('turn');
  });

  it('quitting to the title keeps the choice for the next new game', async () => {
    const { app } = rig();
    choose(app, 'Time: Turn-based');
    await begin(app);
    press(app, 'Escape');
    choose(app, 'Quit');
    expect(app.title).not.toBeNull();
    expect(text(app)).toContain('Time: Real time');
  });
});

describe('Spec 01, Addendum B: the page parameter ?time=', () => {
  it('reads real or turn, and nothing else', () => {
    expect(timeParam('?time=real')).toBe('real');
    expect(timeParam('?time=turn')).toBe('turn');
    expect(timeParam('?display=iso&time=real')).toBe('real');
    expect(timeParam('')).toBeUndefined();
    expect(timeParam('?time=fast')).toBeUndefined();
  });

  it('presets the row over the remembered choice, without changing what is remembered', async () => {
    const flags = new MemoryStorage();
    flags.setItem(TIME_KEY, 'turn');
    const { app } = rig({ time: 'real', flags });
    expect(text(app)).toContain('Time: Real time');
    expect(flags.getItem(TIME_KEY)).toBe('turn');
    await begin(app);
    expect(app.shell!.run!.time).toBe('real');

    const other = new MemoryStorage();
    other.setItem(TIME_KEY, 'real');
    expect(text(rig({ time: 'turn', flags: other }).app)).toContain('Time: Turn-based');
  });

  it('the player can still switch the row after a preset, and that choice is remembered', () => {
    const { app, flags } = rig({ time: 'real' });
    choose(app, 'Time: Real time');
    expect(text(app)).toContain('Time: Turn-based');
    expect(flags.getItem(TIME_KEY)).toBe('turn');
  });
});

describe('Spec 09, Addendum B: save format 7 keeps the time mode', () => {
  it('a save records the run\'s mode, and loads as it', () => {
    expect(SAVE_FORMAT).toBe(7);
    for (const time of ['turn', 'real'] as const) {
      const run = townRun(77, {}, 0, { time });
      const save = toSave({ run, contentVersion: 'v' });
      expect(save.time).toBe(time);
      const loaded = parseSave(serialise(save));
      expect(restoreRun(loaded, runOptionsFor(content().bundle, loaded.seed), classById(content().bundle, 'thief')).time).toBe(time);
    }
  });

  it('a save holds no tick, cooldown or schedule: only the mode is new', () => {
    const save = toSave({ run: townRun(77, {}, 0, { time: 'real' }), contentVersion: 'v' });
    const text = serialise(save);
    for (const word of ['"tick"', 'cooldown', 'nextAct', 'schedule']) expect(text).not.toContain(word);
  });

  it('a format 6 save loads as a turn-based run', () => {
    const now = toSave({ run: townRun(77), contentVersion: 'v' });
    const { time: _time, ...old } = now;
    const loaded = parseSave(JSON.stringify({ ...old, format: 6 }));
    expect([loaded.format, loaded.time]).toEqual([SAVE_FORMAT, 'turn']);
    expect(restoreRun(loaded, runOptionsFor(content().bundle, loaded.seed)).time).toBe('turn');
  });

  it('Continue plays the save\'s own mode, whatever the time row says', async () => {
    const store = new MemoryStore();
    const first = rig({ store });
    choose(first.app, 'Time: Turn-based');
    await begin(first.app); // real time, saved at once
    const back = rig({ store }); // the row says turn-based on this visit
    expect(text(back.app)).toContain('Time: Turn-based');
    await flush();
    choose(back.app, 'Continue');
    await flush();
    await flush();
    expect(back.app.shell!.run!.time).toBe('real');

    const other = new MemoryStore();
    await begin(rig({ store: other }).app); // turn-based, saved at once
    const preset = rig({ store: other, time: 'real' });
    await flush();
    choose(preset.app, 'Continue');
    await flush();
    await flush();
    expect(preset.app.shell!.run!.time).toBe('turn');
  });
});

describe('Spec 09, Addendum B: death keeps the run\'s mode', () => {
  /** A real-time run that dies in the dungeon, leaving the title row on turn-based. */
  async function diedInRealTime(): Promise<Rig> {
    const r = rig({ time: 'real' });
    await begin(r.app);
    const run = r.app.shell!.run!;
    run.travel('down');
    run.player.dead = true;
    run.player.deathCause = 'The goblin kills you.';
    press(r.app, 'x');
    expect(r.app.death).not.toBeNull();
    return r;
  }

  it('the death is recorded as a real-time run', async () => {
    const r = await diedInRealTime();
    expect(r.board.all()[0]!.time).toBe('real');
  });

  it('a new character on the same seed plays the same mode', async () => {
    const r = await diedInRealTime();
    choose(r.app, 'New character, same seed');
    press(r.app, 'Enter'); // keep the first item
    createAs(r.app, 'Priest', 'Odo');
    await flush();
    expect(r.app.shell!.run!.time).toBe('real');
  });

  it('a new seed goes back to the title, where the time row chooses again', async () => {
    const r = await diedInRealTime();
    choose(r.app, 'New seed');
    expect(r.app.title).not.toBeNull();
    expect(text(r.app)).toContain('Time: Real time'); // the preset of this page
    choose(r.app, 'Time: Real time');
    await begin(r.app);
    expect(r.app.shell!.run!.time).toBe('turn');
  });
});

describe('Spec 09, Addendum B: the leaderboard records and filters by mode', () => {
  const entry = (id: string, deepest: number, extra: Partial<BoardEntry> = {}): BoardEntry => ({
    id, seed: 1, name: id, className: 'Necromancer', level: 3, deepest, kills: 4, score: 100, outcome: 'died', cause: 'A trap.', diedAtLevel: deepest, date: '2026-10-01T00:00:00.000Z', ...extra,
  });

  it('an entry carries its run\'s mode', () => {
    expect(boardEntry(townRun(5, {}, 0, { time: 'real' }), 'died').time).toBe('real');
    expect(boardEntry(townRun(5), 'died').time).toBe('turn');
  });

  it('the view filters by mode; an entry from before format 7 counts as turn-based', () => {
    const board = new Leaderboard(new MemoryStorage());
    board.record(entry('old', 9)); // no mode: written before format 7
    board.record(entry('turn', 5, { time: 'turn' }));
    board.record(entry('real', 7, { time: 'real' }));
    board.record(entry('daily', 3, { time: 'real', daily: '2026-10-01' }));
    expect(board.view().map((e) => e.id)).toEqual(['old', 'real', 'turn', 'daily']);
    expect(board.view('all', 'turn').map((e) => e.id)).toEqual(['old', 'turn']);
    expect(board.view('all', 'real').map((e) => e.id)).toEqual(['real', 'daily']);
    expect(board.view({ daily: '2026-10-01' }, 'real').map((e) => e.id)).toEqual(['daily']);
    expect(board.view({ daily: '2026-10-01' }, 'turn')).toEqual([]);
  });

  it('shows "RT" after the class of a real-time run; Tab cycles All, Turn-based, Real time; Shift+Tab goes back', () => {
    const r = rig();
    r.board.record(entry('Ada', 9, { time: 'real' }));
    r.board.record(entry('Bo', 5));
    choose(r.app, 'Leaderboard');
    const row = (name: string): string | undefined => lines(r.app).find((l) => l.includes(` ${name} `));
    expect(text(r.app)).toContain('Leaderboard: all runs, time: All');
    expect(row('Ada')).toContain('Necromancer RT');
    expect(row('Bo')).toContain('Necromancer');
    expect(row('Bo')).not.toContain('RT');
    press(r.app, 'Tab');
    expect(text(r.app)).toContain('time: Turn-based');
    expect([row('Ada'), row('Bo')].map(Boolean)).toEqual([false, true]);
    press(r.app, 'Tab');
    expect(text(r.app)).toContain('time: Real time');
    expect([row('Ada'), row('Bo')].map(Boolean)).toEqual([true, false]);
    press(r.app, 'Tab');
    expect(text(r.app)).toContain('time: All');
    r.app.handleKey({ key: 'Tab', shiftKey: true });
    expect(text(r.app)).toContain('time: Real time');
    press(r.app, 'Enter'); // the seed of the day, still real time only
    expect(text(r.app)).toContain('Leaderboard: seed of the day, 2026-10-01, time: Real time');
    expect(text(r.app)).toContain('No real time runs here yet.');
  });

  it('Tab cycles the filter in the game menu\'s leaderboard too', async () => {
    const r = rig();
    r.board.record(entry('Ada', 9, { time: 'real' }));
    await begin(r.app);
    press(r.app, 'Escape');
    choose(r.app, 'Leaderboard');
    expect(text(r.app)).toContain('Necromancer RT');
    press(r.app, 'Tab');
    expect(text(r.app)).toContain('time: Turn-based');
    expect(text(r.app)).not.toContain('Necromancer RT');
  });
});
