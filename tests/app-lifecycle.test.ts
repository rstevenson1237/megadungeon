import { SAVE_FORMAT } from '../src/game/save.ts';
import { describe, expect, it } from 'vitest';
import { removeDie } from '../src/game/combat.ts';
import { Leaderboard, MemoryStorage } from '../src/game/leaderboard.ts';
import { creature } from '../src/game/monsters.ts';
import { recoverableItems } from '../src/game/lifecycle.ts';
import { MemoryStore, SaveSlot } from '../src/game/store.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { createCharacter } from '../src/rules/character/character.ts';
import { classById } from '../src/rules/character/classes.ts';
import { startingKit } from '../src/rules/items/kit.ts';
import { itemDataFrom } from '../src/rules/items/magic.ts';
import type { RunOptions } from '../src/game/run.ts';
import { App } from '../src/ui/app.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { content, createAs, gameOn, levelFrom, testCharacter } from './helpers.ts';
import { creationContentOf } from '../src/game/lifecycle.ts';

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const thief = classById(content().bundle, 'thief');

class CountingStore extends MemoryStore {
  writes = 0;
  override async set(key: string, value: string): Promise<void> {
    if (key.startsWith('save-')) this.writes++;
    return super.set(key, value);
  }
}

interface Rig {
  app: App;
  store: CountingStore;
  board: Leaderboard;
  flags: MemoryStorage;
}

function rig(runOptions?: (seed: number) => RunOptions, withSaves = true): Rig {
  const store = new CountingStore();
  const board = new Leaderboard(new MemoryStorage());
  const flags = new MemoryStorage();
  let n = 0;
  const seeds = [0x1234abcd, 0x0badf00d];
  const app = new App({
    creation: creationContentOf(content().bundle),
    randomSeed: () => seeds[n++ % seeds.length]!,
    now: () => new Date('2026-10-01T12:00:00Z'),
    runOptions: runOptions ?? ((seed) => runOptionsFor(content().bundle, seed)),
    ...(withSaves ? { saves: new SaveSlot(store) } : {}),
    board,
    flags,
    contentVersion: 'test',
  });
  return { app, store, board, flags };
}

const press = (app: App, ...keys: string[]): void => keys.forEach((key) => app.handleKey({ key }));
const text = (app: App): string => {
  const g = new Grid();
  app.draw(g);
  return Array.from({ length: 40 }, (_, y) => Array.from({ length: COLS }, (_, x) => CP437_TO_UNICODE[g.glyph[y * COLS + x]!]).join('')).join('\n');
};
/** Start a new random-seed run. */
async function begin(r: Rig): Promise<void> {
  press(r.app, 'Enter');
  createAs(r.app, 'Thief', 'Mara');
  await flush();
}
/** Choose a row of the open list by its text. */
function choose(app: App, label: string): void {
  for (let i = 0; i < 20; i++) {
    if (text(app).split('\n').some((l) => l.includes(`> ${label}`))) return void press(app, 'Enter');
    press(app, 's');
  }
  throw new Error(`no row "${label}"`);
}
const rest = (r: Rig): void => {
  const run = r.app.shell!.run!;
  run.player.town.bank = Math.max(run.player.town.bank, 100);
  choose(r.app, 'Lodging');
  press(r.app, 'Enter'); // Rest
  press(r.app, 'Escape');
};
const dungeon = (r: Rig): void => {
  const run = r.app.shell!.run!;
  while (run.inVillage) run.travel('down');
};

describe('Spec 09: saving only on a village rest and when a run begins', () => {
  it('a new run is saved at once, so Continue always has something to load', async () => {
    const r = rig();
    expect(await r.app['deps'].saves!.exists()).toBe(false);
    await begin(r);
    expect(r.store.writes).toBe(1);
    expect(await r.app['deps'].saves!.exists()).toBe(true);
  });

  it('walking, stairs, fighting and looting never save; resting does', async () => {
    const r = rig();
    await begin(r);
    const run = r.app.shell!.run!;
    run.player.town.bank = 500;
    dungeon(r);
    press(r.app, 'd', 'd', 'a', 's', 'w', 'x');
    run.player.coins += 50;
    run.travel('up');
    await flush();
    expect(r.store.writes).toBe(1);
    while (!run.inVillage) run.travel('up');
    await flush();
    expect(r.store.writes).toBe(1);
    run.onRest!();
    await flush();
    expect(r.store.writes).toBe(2);
    expect(r.app.shell!.log.lines(run.round).some((l) => l.text === 'The game is saved.')).toBe(true);
  });

  it('a rest from the lodging screen saves, and a rest the bank cannot pay for does not', async () => {
    const r = rig();
    await begin(r);
    r.app.shell!.run!.player.town.bank = 3;
    choose(r.app, 'Lodging');
    press(r.app, 'Enter'); // Rest: refused
    await flush();
    expect(r.store.writes).toBe(1);
    press(r.app, 'Escape');
    rest(r);
    await flush();
    expect(r.store.writes).toBe(2);
  });
});

describe('Spec 09: continue', () => {
  it('after a quit, Continue resumes at the village of the last rest with nothing since kept', async () => {
    const r = rig();
    await begin(r);
    const run = r.app.shell!.run!;
    run.player.coins = 7;
    rest(r);
    await flush();
    expect(run.player.rests).toBe(1);
    // Everything after the rest is lost.
    run.player.coins = 999;
    run.player.town.bank = 12345;
    dungeon(r);
    run.player.pools.combat.dice = 0;
    press(r.app, 'Escape', 'w', 'Enter'); // Quit without saving
    expect(r.app.shell).toBeNull();
    await flush();
    expect(r.app.title!.hasSave).toBe(true);
    expect(text(r.app)).toContain('Resume at your last rest');
    press(r.app, 's', 's', 'Enter'); // Continue
    await flush();
    const back = r.app.shell!.run!;
    expect(back.inVillage).toBe(true);
    expect(back.depth).toBe(0);
    expect(back.player.coins).toBe(7);
    expect(back.player.town.bank).toBeLessThan(100);
    expect(back.player.rests).toBe(1);
    expect(back.player.pools.combat.dice).toBe(back.player.pools.combat.max);
    expect(r.app.shell!.character.bank).toBe(back.player.town.bank);
  });

  it('closing the tab is the same as quitting: a new App on the same store continues from the last rest', async () => {
    const r = rig();
    await begin(r);
    r.app.shell!.run!.player.coins = 40;
    rest(r);
    await flush();
    r.app.shell!.run!.player.coins = 41;
    const reopened = new App({ ...r.app['deps'] });
    await flush();
    expect(reopened.title!.hasSave).toBe(true);
    press(reopened, 's', 's', 'Enter');
    await flush();
    expect(reopened.shell!.run!.player.coins).toBe(40);
  });

  it('Continue with no save says so, and an unreadable save says why without crashing', async () => {
    const r = rig();
    press(r.app, 's', 's', 'Enter');
    await flush();
    expect(text(r.app)).toContain('There is no saved game yet');
    const store = new MemoryStore();
    await new SaveSlot(store).write('{"format": 99}');
    const app = new App({ ...r.app['deps'], saves: new SaveSlot(store) });
    await flush();
    press(app, 's', 's', 'Enter');
    await flush();
    expect(text(app)).toContain('newer version of the game');
    expect(app.shell).toBeNull();
  });

  it('the title warns once that clearing browser data deletes the save', async () => {
    const r = rig();
    expect(text(r.app)).toContain('clearing site data deletes it');
    await begin(r);
    press(r.app, 'Escape', 'w', 'Enter');
    expect(text(r.app)).not.toContain('clearing site data deletes it');
  });
});

describe('Spec 09: death', () => {
  /** A run that rests once, then dies in the dungeon. */
  async function died(r: Rig): Promise<void> {
    await begin(r);
    const run = r.app.shell!.run!;
    run.player.town.bank = 1000;
    run.player.coins = 5;
    rest(r);
    await flush();
    dungeon(r);
    run.player.dead = true;
    run.player.deathCause = 'The goblin kills you.';
    run.player.stats.kills = 3;
    press(r.app, 'x'); // any action: the shell notices
  }

  it('the death is on the leaderboard before the player chooses, and the death screen shows cause and depth', async () => {
    const r = rig();
    await died(r);
    const [entry] = r.board.all();
    expect(entry).toMatchObject({ name: 'Mara', className: 'Thief', outcome: 'died', cause: 'The goblin kills you.', kills: 3 });
    expect(r.board.all()).toHaveLength(1);
    expect(r.app.death).not.toBeNull();
    const screen = text(r.app);
    expect(screen).toContain('The goblin kills you.');
    expect(screen).toContain(`Died on level ${r.app.shell!.run!.depth}`);
    for (const option of ['Return to last save', 'New character, same seed', 'New seed']) expect(screen).toContain(option);
  });

  it('Return to last save loads the last rest, the same character playing on, and the death still counts', async () => {
    const r = rig();
    await died(r);
    press(r.app, 'Enter');
    await flush();
    expect(r.app.death).toBeNull();
    const run = r.app.shell!.run!;
    expect(run.player.dead).toBe(false);
    expect(run.inVillage).toBe(true);
    expect(run.player.rests).toBe(1);
    expect(r.board.all()).toHaveLength(1);
  });

  it('New character, same seed: a fresh world, 20 gp plus 10% of the old bank, and one chosen item', async () => {
    const r = rig();
    await died(r);
    const dead = r.app.shell!.run!;
    const bank = dead.player.town.bank;
    const writes = r.store.writes;
    press(r.app, 's', 'Enter'); // the item list opens
    expect(text(r.app)).toContain('Choose one item to keep');
    press(r.app, 's'); // the second item
    const kept = recoverableItems(dead.player)[1]!;
    press(r.app, 'Enter');
    // Creation opens with the seed fixed, and says what the new character keeps (Spec 09, Addendum A).
    expect(r.app.creation).not.toBeNull();
    expect(text(r.app)).toContain(`From your last character you keep ${20 + Math.floor(bank * 0.1)} gp in the bank and`);
    press(r.app, 'Escape'); // back to the death screen ...
    expect(r.app.death).not.toBeNull();
    press(r.app, 'Enter'); // ... which still has the same item chosen
    createAs(r.app, 'Priest', 'Odo');
    await flush();
    const run = r.app.shell!.run!;
    expect(run).not.toBe(dead);
    expect(run.player.name).toBe('Odo');
    expect(run.classDef!.name).toBe('Priest');
    expect(run.runSeed).toBe(dead.runSeed);
    expect(run.player.town.bank).toBe(20 + Math.floor(bank * 0.1));
    expect(run.player.pack).toContain(kept);
    expect(run.character.xp).toBe(0);
    expect(Object.keys(run.deltas)).toEqual([]);
    expect(run.depth).toBe(0);
    expect(run.player.dead).toBe(false);
    expect(run.characterId).not.toBe(dead.characterId);
    expect(r.store.writes).toBe(writes + 1); // a new run saves at once
  });

  it('New seed goes back to the title screen', async () => {
    const r = rig();
    await died(r);
    press(r.app, 's', 's', 'Enter');
    expect(r.app.shell).toBeNull();
    expect(r.app.death).toBeNull();
    expect(r.app.title).not.toBeNull();
  });

  it('Esc steps back from the item list to the three choices', async () => {
    const r = rig();
    await died(r);
    press(r.app, 's', 'Enter', 'Escape');
    expect(text(r.app)).toContain('Return to last save');
  });
});

describe('Spec 09: reaching level 100 and defeating the final boss', () => {
  const rows = ['#########', '#<.....>#', '#########'];
  const nearTheBottom = (seed: number): RunOptions => ({ startDepth: 99, villages: [0], levelFor: (depth) => ({ ...levelFrom(rows), depth }), spells: [] , items: itemDataFrom(content().bundle) });

  it('arriving on level 100 records a win and play continues; the final boss is a further achievement; dying later updates the entry', async () => {
    const r = rig(nearTheBottom, false);
    press(r.app, 'Enter');
    createAs(r.app, 'Thief', 'Mara');
    for (let i = 0; i < 6; i++) press(r.app, 'd');
    expect(r.board.all()).toHaveLength(0);
    press(r.app, 'e'); // down to level 100
    const run = r.app.shell!.run!;
    expect(run.depth).toBe(100);
    expect(r.app.death).toBeNull();
    expect(r.board.all()).toHaveLength(1);
    expect(r.board.all()[0]).toMatchObject({ outcome: 'reached_100', deepest: 100 });
    // Play goes on as a sandbox.
    press(r.app, 'd');
    expect(r.app.shell).not.toBeNull();
    // The final boss dies.
    const game = r.app.shell!.game!;
    const boss = creature({ id: 9, name: 'the Abyssal King', glyph: 'K', colour: 0, x: 4, y: 1, dice: 1, modifier: 0, role: 'boss' });
    game.state.monsters.push(boss);
    removeDie(game, boss, [], { hit: '', kill: '' }, false);
    expect(run.player.stats.finalBoss).toBe(true);
    press(r.app, 'd');
    expect(r.board.all()).toHaveLength(1);
    expect(r.board.all()[0]!.outcome).toBe('final_boss');
    // And a later death updates the same entry.
    run.player.dead = true;
    run.player.deathCause = 'The poison kills you.';
    press(r.app, 'x');
    expect(r.board.all()).toHaveLength(1);
    expect(r.board.all()[0]).toMatchObject({ outcome: 'final_boss', cause: 'The poison kills you.', diedAtLevel: 100 });
  });

  it('only the final boss on level 100 counts, not any other boss', () => {
    const game = gameOn({ ...levelFrom(rows), depth: 40 });
    const boss = creature({ id: 9, name: 'a boss', glyph: 'B', colour: 0, x: 4, y: 1, dice: 1, modifier: 0, role: 'boss' });
    game.state.monsters.push(boss);
    removeDie(game, boss, [], { hit: '', kill: '' }, false);
    expect(game.state.player.stats.finalBoss).toBe(false);
  });

  it('the deepest level and the kills are kept as the run goes', () => {
    const game = gameOn(levelFrom(rows));
    const rat = creature({ id: 1, name: 'rat', glyph: 'r', colour: 0, x: 3, y: 1, dice: 1, modifier: 0 });
    game.state.monsters.push(rat);
    removeDie(game, rat, [], { hit: '', kill: '' }, false);
    expect(game.state.player.stats.kills).toBe(1);
  });
});

describe('Spec 01 and 09: the leaderboard screens', () => {
  it('opens from the title as a full-grid screen and closes with Esc; Enter switches to the seed of the day', async () => {
    const r = rig();
    r.board.record({ id: 'a', seed: 1, name: 'Ada', className: 'Mage', level: 4, deepest: 12, kills: 30, score: 8800, outcome: 'died', cause: 'The wraith kills you.', diedAtLevel: 12, date: '2026-10-01T00:00:00.000Z' });
    r.board.record({ id: 'b', seed: 2, daily: '2026-10-01', name: 'Bo', className: 'Thief', level: 2, deepest: 3, kills: 5, score: 100, outcome: 'died', cause: 'A trap.', diedAtLevel: 3, date: '2026-10-01T00:00:00.000Z' });
    press(r.app, 'w', 'Enter'); // Leaderboard, the last item
    expect(r.app.leaderboard).not.toBeNull();
    let screen = text(r.app);
    expect(screen).toContain('Leaderboard: all runs');
    expect(screen).toContain('Ada');
    expect(screen).toContain('Bo');
    expect(screen).toContain('Died on level 12: The wrait');
    press(r.app, 'Enter');
    screen = text(r.app);
    expect(screen).toContain('seed of the day, 2026-10-01');
    expect(screen).toContain('Bo');
    expect(screen).not.toContain('Ada');
    press(r.app, 'Escape');
    expect(r.app.leaderboard).toBeNull();
    expect(text(r.app)).toContain('New game: random seed');
  });

  it('opens from the game menu as a window over the main view', async () => {
    const r = rig();
    await begin(r);
    press(r.app, 'Escape', 's', 'Enter');
    expect(text(r.app)).toContain('Leaderboard: all runs');
    expect(text(r.app)).toContain('Nothing here yet');
    press(r.app, 'Escape');
    expect(r.app.shell!.overlays).toHaveLength(0);
  });
});

describe('Spec 09: export and import from the game menu', () => {
  it('Export downloads the save as a file; Import loads a file into the slot and refuses a bad one', async () => {
    const r = rig();
    const downloads: [string, string][] = [];
    let next: string | undefined;
    const app = new App({ ...r.app['deps'], download: (name, body) => downloads.push([name, body]), upload: async () => next });
    press(app, 'Enter');
    createAs(app, 'Thief', 'Mara');
    await flush();
    press(app, 'Escape', 's', 's', 'Enter'); // Export
    await flush();
    expect(downloads).toHaveLength(1);
    expect(downloads[0]![0]).toMatch(/^megadungeon-[0-9A-F]{8}\.save\.json$/);
    const text1 = downloads[0]![1];
    expect(JSON.parse(text1).format).toBe(SAVE_FORMAT);

    const other = new MemoryStore();
    const fresh = new App({ ...r.app['deps'], saves: new SaveSlot(other), download: () => undefined, upload: async () => next });
    await flush();
    press(fresh, 'Enter');
    createAs(fresh, 'Thief', 'Mara');
    await flush();
    next = text1;
    press(fresh, 'Escape', 's', 's', 's', 'Enter'); // Import
    await flush();
    const log = (): string => fresh.shell!.log.lines(fresh.shell!.turn).map((l) => l.text).join(' | ');
    expect(log()).toContain('is loaded into this browser');
    next = '{"format": 99}';
    press(fresh, 'Escape', 's', 's', 's', 'Enter');
    await flush();
    expect(log()).toContain('newer version of the game');
  });
});
