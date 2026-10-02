import { describe, expect, it } from 'vitest';
import { formatSeed, randomRunSeed, seedOfTheDay } from '../src/core/rng.ts';
import { App } from '../src/ui/app.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import { stubSize } from '../src/game/run.ts';
import { testCharacter } from './helpers.ts';

const DAY = new Date('2026-10-01T23:30:00Z');
const make = (seeds: number[] = [0x0a1b2c3d, 0xdeadbeef], now: Date = DAY): App => {
  let n = 0;
  return new App({ newCharacter: testCharacter, randomSeed: () => seeds[n++ % seeds.length]!, now: () => now });
};
const screen = (app: App): string[] => {
  const g = new Grid();
  app.draw(g);
  return Array.from({ length: 40 }, (_, y) => Array.from({ length: COLS }, (_, x) => CP437_TO_UNICODE[g.glyph[y * COLS + x]!]).join(''));
};
const text = (app: App): string => screen(app).join('\n');
const press = (app: App, ...keys: string[]): void => keys.forEach((key) => app.handleKey({ key }));

describe('seeds (Spec 02)', () => {
  it('formats a seed as eight upper-case hex digits', () => {
    expect(formatSeed(0x0a1b2c3d)).toBe('0A1B2C3D');
    expect(formatSeed(0)).toBe('00000000');
    expect(formatSeed(0xffffffff)).toBe('FFFFFFFF');
  });

  it('draws a random seed from the crypto source, and the seed of the day is the same for the whole UTC day', () => {
    expect(Number.isInteger(randomRunSeed())).toBe(true);
    expect(seedOfTheDay('2026-10-01')).toBe(seedOfTheDay(new Date('2026-10-01T00:00:00Z')));
    expect(seedOfTheDay(new Date('2026-10-01T23:59:59Z'))).toBe(seedOfTheDay('2026-10-01'));
    expect(seedOfTheDay('2026-10-02')).not.toBe(seedOfTheDay('2026-10-01'));
  });
});

describe('title screen (Spec 01, Overlays and screens)', () => {
  it('opens first, on the full grid with no panes, and shows both seeds and the date', () => {
    const app = make();
    expect(app.shell).toBeNull();
    const t = text(app);
    for (const s of ['M E G A D U N G E O N', 'New game: random seed', '0A1B2C3D', 'New game: seed of the day', '2026-10-01', formatSeed(seedOfTheDay('2026-10-01')), 'Continue', 'Leaderboard']) {
      expect(t).toContain(s);
    }
    expect(t).not.toContain('Character');
    expect(t).not.toContain('Log');
  });

  it('carries the font credit', () => {
    expect(text(make())).toContain('VileR');
    expect(text(make())).toContain('CC BY-SA 4.0');
  });

  it('highlights the selection and moves it with W/S or the arrows, wrapping', () => {
    const app = make();
    expect(app.title!.selected).toBe(0);
    press(app, 's');
    expect(app.title!.selected).toBe(1);
    press(app, 'ArrowDown', 'ArrowDown', 'ArrowDown');
    expect(app.title!.selected).toBe(0); // wrapped
    press(app, 'w');
    expect(app.title!.selected).toBe(3);
    expect(screen(app).some((l) => l.includes('> Leaderboard'))).toBe(true);
  });

  it('with no save slot or leaderboard, Continue and Leaderboard say so and stay on the title', () => {
    const app = make();
    press(app, 's', 's', 'Enter');
    expect(app.shell).toBeNull();
    expect(text(app)).toContain('There is no saved game yet');
    press(app, 's', 'Enter');
    expect(text(app)).toContain('The leaderboard is not available');
  });

  it('ignores keys with no meaning on the title', () => {
    const app = make();
    expect(app.handleKey({ key: 'q' })).toBe(true); // in the key map: swallowed, does nothing
    expect(app.handleKey({ key: 'F9' })).toBe(false);
    expect(app.shell).toBeNull();
  });
});

describe('both seed options start a run (task 1.10)', () => {
  it('new game with the random seed uses the seed shown on the title', () => {
    const app = make();
    press(app, 'Enter');
    expect(app.title).toBeNull();
    const run = app.shell!.run!;
    expect(run.runSeed).toBe(0x0a1b2c3d);
    expect(run.inVillage).toBe(true);
    expect(text(app)).toContain('Surface Village');
    expect(app.shell!.log.lines(app.shell!.turn).some((l) => l.text === 'New run, random seed: 0A1B2C3D.')).toBe(true);
  });

  it('new game with the seed of the day uses the hash of the UTC date', () => {
    const app = make();
    press(app, 's', 'Enter');
    expect(app.shell!.run!.runSeed).toBe(seedOfTheDay('2026-10-01'));
    expect(app.shell!.log.lines(app.shell!.turn).some((l) => l.text.startsWith('New run, seed of the day 2026-10-01:'))).toBe(true);
  });

  it('E also confirms', () => {
    const app = make();
    press(app, 'e');
    expect(app.shell).not.toBeNull();
  });

  it('the same seed gives the same level 1 however the run was started', () => {
    const a = make();
    const b = make([1], new Date('2026-10-01T01:00:00Z'));
    press(a, 's', 'Enter');
    press(b, 's', 'Enter');
    for (const app of [a, b]) press(app, 'w', 'Enter'); // Go down
    const level = (app: App) => app.shell!.game!.state.map.level;
    expect(JSON.stringify(level(a))).toBe(JSON.stringify(level(b)));
    expect(JSON.stringify(level(a))).toBe(JSON.stringify(generateLevel(seedOfTheDay('2026-10-01'), 1, stubSize(1))));
  });

  it('a different day gives a different seed and so a different level', () => {
    const a = make([1], new Date('2026-10-01T12:00:00Z'));
    const b = make([1], new Date('2026-10-02T12:00:00Z'));
    press(a, 's', 'Enter');
    press(b, 's', 'Enter');
    expect(a.shell!.run!.runSeed).not.toBe(b.shell!.run!.runSeed);
  });

  it('starts each run with its own character, so a second run is not carrying the first one\'s wounds', () => {
    const app = make();
    press(app, 'Enter');
    app.shell!.run!.player.pools.combat.dice = 0;
    app.shell!.character.stats[0]!.current = 0;
    press(app, 'Escape', 'w', 'Enter'); // game menu, Quit without saving (the last item)
    expect(app.shell).toBeNull();
    press(app, 'Enter');
    expect(app.shell!.run!.player.pools.combat.dice).toBe(2);
    expect(app.shell!.character.stats[0]!.current).toBe(2);
  });
});

describe('quitting returns to the title (Spec 01, Game menu)', () => {
  it('Quit without saving from the game menu opens a fresh title with a newly drawn random seed', () => {
    const app = make();
    press(app, 'Enter');
    press(app, 'Escape', 'w', 'Enter'); // Quit without saving, the last item of the game menu
    expect(app.shell).toBeNull();
    expect(app.title).not.toBeNull();
    expect(text(app)).toContain('DEADBEEF'); // the second random seed
    expect(text(app)).not.toContain('0A1B2C3D');
  });
});
