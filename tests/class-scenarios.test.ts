import { describe, expect, it } from 'vitest';
import { activeAbilities, derivedFor, isActive, knownIds, timedLeft } from '../src/game/abilities.ts';
import type { Game, PlayerState } from '../src/game/game.ts';
import { Leaderboard, MemoryStorage } from '../src/game/leaderboard.ts';
import { creationContentOf } from '../src/game/lifecycle.ts';
import { creature, type Monster } from '../src/game/monsters.ts';
import type { Run } from '../src/game/run.ts';
import { MemoryStore, SaveSlot } from '../src/game/store.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { classById } from '../src/rules/character/classes.ts';
import { hasStatus } from '../src/rules/magic/status.ts';
import { App } from '../src/ui/app.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { CONTENT, content, createAs, rig, room } from './helpers.ts';

// Task 3.11, class scenarios (Spec 03, Addendum A): every class is created through the creation screen, uses its
// ability in an arena through the real shell, and is banked up to level 10 through the village's level-up screens,
// with every minor ability it draws in effect.

const bundle = content().bundle;
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const press = (app: App, ...keys: string[]): void => keys.forEach((key) => app.handleKey({ key }));
const screen = (app: App): string => {
  const g = new Grid();
  app.draw(g);
  return Array.from({ length: 40 }, (_, y) => Array.from({ length: COLS }, (_, x) => CP437_TO_UNICODE[g.glyph[y * COLS + x]!]).join('')).join('\n');
};
function choose(app: App, label: string): void {
  for (let i = 0; i < 30; i++) {
    if (screen(app).split('\n').some((l) => l.includes(`> ${label}`))) return void press(app, 'Enter');
    press(app, 's');
  }
  throw new Error(`no row "${label}"`);
}
/** The run was moved directly: bring the shell in line, as it does after stairs. */
const moved = (app: App): void => app.shell!['moved']([]);
const logText = (app: App): string => app.shell!.log.lines(app.shell!.turn).map((l) => l.text).join(' | ');

/** A goblin of the arena, at (x, y): alert, three dice, and stunned unless `acts`, so it spends its first action doing nothing. */
function goblin(game: Game, x: number, y: number, extra: Partial<Monster> = {}, acts = false): Monster {
  const m = creature({ id: 100 + game.state.monsters.length, name: 'goblin', glyph: 'g', colour: 0, x, y, dice: 3, modifier: 0, awareness: 'alert', stunned: !acts, ...extra });
  game.state.monsters.push(m);
  return m;
}

interface Scenario {
  /** Place the arena's creatures and set the player up; the player stands at (4, 3). */
  setup: (game: Game) => Monster[];
  /** The keys that use the ability, with the dice to deal before each step. */
  play: (app: App, game: Game, foes: Monster[]) => void;
  /** What shows that the ability worked. */
  check: (game: Game, foes: Monster[], app: App) => void;
}

/** Q on a passive ability says so and spends no round (Spec 03, Addendum A). */
function passiveQ(app: App, game: Game): void {
  const round = game.state.round;
  press(app, 'q');
  expect(game.state.round).toBe(round);
}

const SCENARIOS: Record<string, Scenario> = {
  warrior: {
    // Cleave: a kill carries into the next adjacent foe, clockwise from north.
    setup: (g) => [goblin(g, 5, 3, { dice: 1 }), goblin(g, 4, 2, { dice: 1 })],
    play: (app, g) => {
      passiveQ(app, g);
      rig(g, 8, 1, 100, 8, 1, 100); // each hit, then the sword's roll to break (100: it holds)
      press(app, 'd');
    },
    check: (g, [a, b], app) => {
      expect(g.state.monsters).not.toContain(a);
      expect(g.state.monsters).not.toContain(b);
      expect(logText(app)).toContain('You cleave on into the goblin.');
    },
  },
  mage: {
    // Arcane Bolt from Q, cast as C would.
    setup: (g) => [goblin(g, 8, 3, { dice: 2 })],
    play: (app, g) => {
      press(app, 'q');
      rig(g, 6);
      press(app, 'Enter');
    },
    check: (_g, [m]) => expect(m!.dice).toBeLessThan(2),
  },
  thief: {
    // Backstab: a Light weapon on an unaware creature hits with no exchange and removes 2 dice.
    setup: (g) => {
      const p = g.state.player;
      p.equipment.main = p.pack.find((i) => i.id === 'dagger') ?? p.equipment.main;
      return [goblin(g, 5, 3, { awareness: 'unaware' })];
    },
    play: (app, g) => {
      passiveQ(app, g);
      press(app, 'd');
    },
    check: (_g, [m]) => expect(m!.dice).toBe(1),
  },
  priest: {
    // Heal from Q, at once.
    setup: (g) => {
      g.state.player.pools.combat.dice = 0;
      return [];
    },
    play: (app, g) => {
      rig(g, 6);
      press(app, 'q');
    },
    check: (g) => expect(g.state.player.pools.combat.dice).toBe(1),
  },
  barbarian: {
    setup: () => [],
    play: (app, g) => {
      rig(g, 5);
      press(app, 'q');
    },
    check: (g) => expect(timedLeft(g.state.player, 'rage')).toBeGreaterThan(0),
  },
  knight: {
    // Shield Wall: the first hit in a fight is ignored.
    setup: (g) => [goblin(g, 5, 3, {}, true)],
    play: (app, g) => {
      passiveQ(app, g);
      rig(g, 6, 1);
      press(app, ' ');
    },
    check: (g, _f, app) => {
      expect(g.state.player.pools.combat.dice).toBe(1);
      expect(logText(app)).toContain('Your shield wall turns the blow.');
    },
  },
  paladin: {
    setup: () => [],
    play: (app, g) => {
      const round = g.state.round;
      press(app, 'q');
      expect(g.state.round).toBe(round);
    },
    check: (g) => expect(g.state.player.smite).toBe(true),
  },
  ranger: {
    // Volley: one roll, a shot at each of two targets.
    setup: (g) => [goblin(g, 8, 3), goblin(g, 8, 6)],
    play: (app, g) => {
      press(app, 'q', 'Enter');
      rig(g, 5);
      press(app, 'Enter');
    },
    check: (_g, foes) => expect(foes.map((m) => m.dice)).toEqual([2, 2]),
  },
  monk: {
    // Flurry: winning by 3 or more removes one extra die.
    setup: (g) => [goblin(g, 5, 3)],
    play: (app, g) => {
      passiveQ(app, g);
      rig(g, 6, 1);
      press(app, 'd');
    },
    check: (_g, [m]) => expect(m!.dice).toBe(1),
  },
  bard: {
    setup: (g) => [goblin(g, 8, 3, {}, true)],
    play: (app, g) => {
      press(app, 'q');
      rig(g, 5, 6);
      press(app, 'Enter');
    },
    check: (_g, [m]) => expect(hasStatus(m!.statuses, 'held')).toBe(true),
  },
  druid: {
    setup: () => [],
    play: (app, g) => {
      rig(g, 5);
      press(app, 'q');
    },
    check: (g) => expect(timedLeft(g.state.player, 'wild_shape')).toBeGreaterThan(0),
  },
  necromancer: {
    // Raise: kill a goblin, then call it up.
    setup: (g) => [goblin(g, 5, 3, { dice: 1 })],
    play: (app, g) => {
      rig(g, 4, 1);
      press(app, 'd');
      rig(g, 5);
      press(app, 'q');
    },
    check: (g) => expect(g.state.monsters.find((m) => m.ally === 'raised')).toMatchObject({ x: 5, y: 3, kind: 'ally' }),
  },
  sorcerer: {
    // Overchannel: in a fight, the first spell roll of 2 to 3 loses no die. A starting spell, cast after an exchange.
    setup: (g) => [goblin(g, 5, 3, { dice: 6 })],
    play: (app, g, [m]) => {
      passiveQ(app, g);
      rig(g, 4, 1);
      press(app, 'd'); // an exchange: the fight begins
      const spell = g.state.player.spells.map((id) => g.spells.get(id)!).find((sp) => sp.id !== 'blink')!;
      rig(g, 3, 6, 6, 6);
      const result = g.cast(spell, spell.shape === 'self' ? undefined : m!);
      expect(result.spent).toBe(true);
      expect(result.messages.map((x) => x.text)).toContain('You overchannel the spell and keep your Magic die.');
    },
    check: (g) => expect(g.state.player.pools.magic.dice).toBe(1),
  },
  illusionist: {
    setup: () => [],
    play: (app, g) => {
      press(app, 'q', 'd', 'd');
      rig(g, 5);
      press(app, 'Enter');
    },
    check: (g) => expect(g.state.monsters.find((m) => m.ally === 'phantom')).toMatchObject({ x: 6, y: 3 }),
  },
  warlock: {
    // Pact: one Combat die for one Magic die, one round, no roll.
    setup: (g) => {
      g.state.player.pools.magic.dice = 0;
      return [];
    },
    play: (app) => press(app, 'q'),
    check: (g) => expect([g.state.player.pools.combat.dice, g.state.player.pools.magic.dice]).toEqual([0, 1]),
  },
  assassin: {
    setup: (g) => [goblin(g, 8, 3, { awareness: 'unaware' })],
    play: (app, g) => {
      press(app, 'q');
      rig(g, 5);
      press(app, 'Enter');
    },
    check: (g, [m]) => expect(g.state.mark).toBe(m!.id),
  },
  alchemist: {
    // Brew: every potion shows its true kind.
    setup: () => [],
    play: (app, g) => passiveQ(app, g),
    check: (g) => {
      const potions = [...g.items.magic.values()].filter((r) => r.kind === 'potion');
      expect(potions.length).toBeGreaterThan(0);
      expect(knownIds(g.state.player, potions)).toEqual(expect.arrayContaining(potions.map((p) => p.id)));
    },
  },
  shaman: {
    setup: () => [],
    play: (app, g) => {
      rig(g, 5);
      press(app, 'q');
    },
    check: (g) => expect(g.state.map.totem).toBeTruthy(),
  },
  witch_hunter: {
    // Hex Breaker: a ranged hit on a caster removes one extra die (the crossbow's two, and one more).
    setup: (g) => [goblin(g, 8, 3, { behaviour: 'caster', dice: 5 })],
    play: (app, g) => {
      passiveQ(app, g);
      press(app, 'f');
      rig(g, 5);
      press(app, 'Enter');
    },
    check: (_g, [m]) => expect(m!.dice).toBe(2),
  },
  beastmaster: {
    // Companion: an animal ally arrives beside the player.
    setup: () => [],
    play: (app, g) => passiveQ(app, g),
    check: (g) => expect(g.state.monsters.find((m) => m.ally === 'companion')).toMatchObject({ kind: 'ally', dice: 1 }),
  },
};

const CLASS_NAMES = Object.fromEntries((bundle.tables.classes as { id: string; name: string }[]).map((c) => [c.id, c.name]));

/** An app whose dungeon level 1 is a bare arena and whose only village is the surface. */
function arenaApp(store = new MemoryStore()): App {
  return new App({
    creation: creationContentOf(bundle),
    randomSeed: () => 0x5eed3110,
    now: () => new Date('2026-10-02T12:00:00Z'),
    runOptions: (seed) => ({ ...runOptionsFor(bundle, seed), villages: [0], levelFor: (depth) => ({ ...room(12, 7, 1, 1), depth }) }),
    saves: new SaveSlot(store),
    board: new Leaderboard(new MemoryStorage()),
    flags: new MemoryStorage(),
    contentVersion: 'test',
  });
}

/** Every minor ability drawn is in effect: an active one is offered by Q, any other changes what the player's numbers are. */
function drawsInEffect(player: PlayerState): void {
  const minors = CONTENT.minors;
  for (const id of new Set(player.minorAbilities)) {
    const spec = minors.get(id)!;
    expect(spec, id).toBeDefined();
    if (isActive(spec)) {
      expect(activeAbilities(player, minors), id).toContain(id);
      continue;
    }
    const without: PlayerState = { ...player, minorAbilities: player.minorAbilities.filter((m) => m !== id) };
    expect(JSON.stringify(derivedFor(player, minors)), id).not.toBe(JSON.stringify(derivedFor(without, minors)));
  }
}

describe('Task 3.11: every class created, its ability used in an arena, and played to level 10 with its draws in effect', () => {
  it('covers all 20 classes', () => {
    expect(Object.keys(SCENARIOS)).toEqual((bundle.tables.classes as { id: string }[]).map((c) => c.id));
  });

  it.each(Object.keys(SCENARIOS))('%s', async (id) => {
    const cls = classById(bundle, id);
    const scenario = SCENARIOS[id]!;
    const store = new MemoryStore();
    const app = arenaApp(store);

    // Created through the creation screen: the class's dice, its ability on the pane, and the first save.
    press(app, 'Enter');
    createAs(app, CLASS_NAMES[id]!, 'Tester');
    await flush();
    const run: Run = app.shell!.run!;
    expect(run.character.classId).toBe(id);
    expect((['combat', 'skill', 'magic'] as const).map((p) => run.character.pools[p].step)).toEqual([cls.start.combat, cls.start.skill, cls.start.magic]);
    expect(screen(app)).toContain(cls.majorAbility.name);
    expect(await new SaveSlot(store).exists()).toBe(true);

    // Down to the arena, and the ability used through the shell.
    choose(app, 'Go down');
    const game = run.game!;
    expect(game).not.toBeNull();
    game.state.map.player = { x: 4, y: 3 };
    game.refreshSight();
    const foes = scenario.setup(game);
    game.refreshSight();
    scenario.play(app, game, foes);
    scenario.check(game, foes, app);
    expect(run.player.dead).toBe(false);

    // Back to the village, bank enough for level 10, and take the nine level-up screens.
    run.travel('up');
    moved(app);
    run.player.coins += 512_000;
    choose(app, 'Bank');
    press(app, 'Enter');
    for (let n = 0; n < 9 && run.levelsOwed > 0; n++) press(app, 'Enter');
    expect(run.character.level).toBe(10);
    expect(run.levelsOwed).toBe(0);
    // Every level-up die arrived; the pool table caps at 6 dice each.
    const total = run.character.pools.combat.max + run.character.pools.skill.max + run.character.pools.magic.max;
    expect(total).toBe(12);
    // The draws: one per level 2 to 10, nine from a pool of 12, each in effect.
    expect(run.character.minorAbilities.length).toBe(9);
    drawsInEffect(run.player);
    // The pane lists the major ability first and then the draws by name.
    const shown = screen(app);
    for (const drawn of new Set(run.character.minorAbilities)) expect(shown).toContain(CONTENT.minorNames.get(drawn)!);
  });
});
