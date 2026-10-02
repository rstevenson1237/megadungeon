import { describe, expect, it } from 'vitest';
import { Leaderboard, MemoryStorage } from '../src/game/leaderboard.ts';
import { MemoryStore, SaveSlot } from '../src/game/store.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { createCharacter } from '../src/rules/character/character.ts';
import { classById } from '../src/rules/character/classes.ts';
import { startingKit } from '../src/rules/items/kit.ts';
import { itemDataFrom } from '../src/rules/items/magic.ts';
import { App } from '../src/ui/app.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { content, createAs } from './helpers.ts';
import { creationContentOf } from '../src/game/lifecycle.ts';

// The Systems complete gate (plan, Phase 2): a full loop with stub content: delve, loot, bank, level up, rest, use the
// lift, die and try each death option. The dungeon part is played through the real shell and game; what the player would
// pick up on the way is placed in the pack, since the generated levels are not scripted.

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const thief = classById(content().bundle, 'thief');
const press = (app: App, ...keys: string[]): void => keys.forEach((key) => app.handleKey({ key }));
const text = (app: App): string => {
  const g = new Grid();
  app.draw(g);
  return Array.from({ length: 40 }, (_, y) => Array.from({ length: COLS }, (_, x) => CP437_TO_UNICODE[g.glyph[y * COLS + x]!]).join('')).join('\n');
};
/** The run was moved directly (the dungeon is not scripted): bring the shell in line, as it does after stairs. */
const moved = (app: App): void => app.shell!['moved']([]);
function choose(app: App, label: string): void {
  for (let i = 0; i < 30; i++) {
    if (text(app).split('\n').some((l) => l.includes(`> ${label}`))) return void press(app, 'Enter');
    press(app, 's');
  }
  throw new Error(`no row "${label}"`);
}

describe('Gate: Systems complete', () => {
  it('delve, loot, bank, level up, rest, use the lift, die, and take each death option', async () => {
    const store = new MemoryStore();
    const board = new Leaderboard(new MemoryStorage());
    const app = new App({
      creation: creationContentOf(content().bundle),
      randomSeed: () => 0x2468ace0,
      now: () => new Date('2026-10-01T12:00:00Z'),
      runOptions: (seed) => runOptionsFor(content().bundle, seed),
      saves: new SaveSlot(store),
      board,
      flags: new MemoryStorage(),
    });
    press(app, 'Enter'); // new game, random seed
    createAs(app, 'Thief', 'Mara'); // then character creation: the surface village
    await flush();
    const run = app.shell!.run!;
    expect(run.depth).toBe(0);

    // Delve: down the stairs to the first level, playing a few turns there.
    choose(app, 'Go down');
    while (run.inVillage) run.travel('down'); // level 1 may itself be a village
    moved(app);
    press(app, 'd', 'd', 's', 'x');
    expect(run.game).not.toBeNull();
    expect(run.player.stats.deepest).toBeGreaterThanOrEqual(1);

    // Loot, then back up to the village.
    run.player.coins += 2600;
    while (!run.inVillage) run.travel('up');
    moved(app);
    await flush();

    // Bank: 1 XP per gp, and the level-up screens run.
    choose(app, 'Bank');
    press(app, 'Enter');
    expect(run.character.xp).toBe(2600);
    expect(text(app)).toContain('You reach level 2');
    choose(app, 'Skill');
    expect(run.character.level).toBe(2);
    press(app, 'Escape');

    // Rest: saves the game.
    run.player.pools.combat.dice = 0;
    choose(app, 'Lodging');
    press(app, 'Enter');
    press(app, 'Escape');
    await flush();
    expect(run.player.pools.combat.dice).toBe(run.player.pools.combat.max);
    expect(await new SaveSlot(store).exists()).toBe(true);

    // The lift: another village, once it has been visited.
    const other = run.layout!.villages[0]!.level;
    run.player.town.visited.push(other);
    run.player.town.bank = 5000;
    choose(app, 'Lift');
    press(app, 'Enter');
    expect(run.depth).toBe(other);
    expect(run.inVillage).toBe(true);

    // Die in the dungeon.
    while (run.inVillage) run.travel('down');
    moved(app);
    run.player.dead = true;
    run.player.deathCause = 'The goblin kills you.';
    press(app, 'x');
    expect(board.all()).toHaveLength(1);
    expect(text(app)).toContain('Return to last save');

    // Death option 1: return to the last save.
    press(app, 'Enter');
    await flush();
    expect(app.shell!.run!.player.dead).toBe(false);
    expect(app.shell!.run!.player.rests).toBe(1);

    // Die again; option 2: a new character on the same seed.
    const second = app.shell!.run!;
    while (second.inVillage) second.travel('down');
    moved(app);
    second.player.dead = true;
    second.player.deathCause = 'A trap.';
    press(app, 'x');
    press(app, 's', 'Enter', 'Enter'); // keep the first item
    createAs(app, 'Warrior', 'Brannoc'); // creation again, with the seed fixed
    await flush();
    expect(app.shell!.run!.runSeed).toBe(run.runSeed);
    expect(app.shell!.run!.character.xp).toBe(0);

    // Die once more; option 3: a new seed.
    const third = app.shell!.run!;
    while (third.inVillage) third.travel('down');
    moved(app);
    third.player.dead = true;
    press(app, 'x');
    press(app, 's', 's', 'Enter');
    expect(app.title).not.toBeNull();
    // One entry per character: the first character died twice (once before returning to the save, once after), the second once.
    expect(board.all()).toHaveLength(2);
  });
});
