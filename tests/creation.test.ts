import { describe, expect, it } from 'vitest';
import { characterNameSchema } from '../src/core/schemas.ts';
import { Leaderboard, MemoryStorage } from '../src/game/leaderboard.ts';
import { creationContentOf, levelTenSteps, randomName, startingPlayer } from '../src/game/lifecycle.ts';
import { MemoryStore, SaveSlot } from '../src/game/store.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { EQUIP_SLOTS, type Item } from '../src/rules/items/types.ts';
import { App } from '../src/ui/app.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { content, createAs } from './helpers.ts';

const CREATION = creationContentOf(content().bundle);
const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const press = (app: App, ...keys: string[]): void => keys.forEach((key) => app.handleKey({ key }));
const text = (app: App): string => {
  const g = new Grid();
  app.draw(g);
  return Array.from({ length: 40 }, (_, y) => Array.from({ length: COLS }, (_, x) => CP437_TO_UNICODE[g.glyph[y * COLS + x]!]).join('')).join('\n');
};
const make = (store = new MemoryStore()) =>
  new App({
    creation: CREATION,
    randomSeed: () => 0x13572468,
    now: () => new Date('2026-10-02T12:00:00Z'),
    runOptions: (seed) => runOptionsFor(content().bundle, seed),
    saves: new SaveSlot(store),
    board: new Leaderboard(new MemoryStorage()),
    flags: new MemoryStorage(),
    contentVersion: 'test',
  });

/** Spec 03, Classes: the 20 classes in table order, and their level 10 dice (Combat / Skill / Magic). */
const SPEC_03: [string, number, number, number][] = [
  ['Warrior', 12, 8, 4], ['Mage', 4, 8, 12], ['Thief', 8, 12, 4], ['Priest', 8, 6, 10], ['Barbarian', 10, 10, 4],
  ['Knight', 12, 6, 6], ['Paladin', 10, 6, 8], ['Ranger', 8, 10, 6], ['Monk', 10, 8, 6], ['Bard', 6, 10, 8],
  ['Druid', 6, 8, 10], ['Necromancer', 4, 8, 12], ['Sorcerer', 6, 6, 12], ['Illusionist', 4, 10, 10], ['Warlock', 8, 4, 12],
  ['Assassin', 8, 12, 4], ['Alchemist', 4, 12, 8], ['Shaman', 6, 6, 12], ['Witch Hunter', 8, 12, 4], ['Beastmaster', 8, 10, 6],
];

describe('Spec 01, Addendum A: the creation screen', () => {
  it('opens after the title, lists the 20 classes in Spec 03 order, and shows the chosen one in full', () => {
    const app = make();
    press(app, 'Enter');
    expect(app.creation).not.toBeNull();
    const shown = text(app);
    for (const [name] of SPEC_03) expect(shown).toContain(name);
    expect(app.creation!.card.cls.name).toBe('Warrior');
    for (const s of ['Starting dice', 'd8 / d6 / d4', 'Level 10 dice', 'd12 / d8 / d4', 'Cleave', 'A melee hit that kills carries into an', 'adjacent monster', 'Spells', 'none', 'Starting gear', 'Long sword', 'Random seed 13572468']) {
      expect(shown, s).toContain(s);
    }
    press(app, 's');
    expect(text(app)).toContain('3 (Arcane Bolt and 2 more)');
  });

  it("every class's level 10 dice match the Spec 03 table", () => {
    expect(CREATION.classes.map((c) => c.name)).toEqual(SPEC_03.map(([name]) => name));
    for (const [name, c, s, m] of SPEC_03) expect(levelTenSteps(CREATION.classes.find((k) => k.name === name)!), name).toEqual({ combat: c, skill: s, magic: m });
  });

  it('Esc on the class list goes back to the title; Esc on the name goes back to the class list', () => {
    const app = make();
    press(app, 'Enter', 's', 'Enter');
    expect(app.creation!.step).toBe('name');
    press(app, 'Escape');
    expect(app.creation!.step).toBe('class');
    expect(app.creation!.card.cls.name).toBe('Mage');
    press(app, 'Escape');
    expect(app.creation).toBeNull();
    expect(app.title).not.toBeNull();
  });

  it('a name is typed: W, A, S and D are letters here; only letters, spaces, apostrophes and hyphens; at most 16', () => {
    const app = make();
    press(app, 'Enter', 'Enter');
    press(app, ...'Wade d\'Asa-Sol!9'.split(''));
    expect(app.creation!.name).toBe("Wade d'Asa-Sol");
    press(app, ...'xxxxxxxx'.split(''));
    expect(app.creation!.name).toHaveLength(16);
    press(app, 'Backspace');
    expect(app.creation!.name).toHaveLength(15);
    expect(text(app)).toContain("Wade d'Asa-Solx_");
  });

  it('Tab fills a random name from the table, the next one each time, the same for the same seed', () => {
    const names = CREATION.names.map((n) => n.name);
    const app = make();
    press(app, 'Enter', 'Enter', 'Tab');
    const first = app.creation!.name;
    expect(names).toContain(first);
    expect(first).toBe(randomName(0x13572468, 0, CREATION.names));
    press(app, 'Tab');
    expect(app.creation!.name).toBe(randomName(0x13572468, 1, CREATION.names));
    const again = make();
    press(again, 'Enter', 'Enter', 'Tab');
    expect(again.creation!.name).toBe(first);
  });

  it('Enter with no name takes a random one', async () => {
    const app = make();
    press(app, 'Enter', 'Enter', 'Enter');
    await flush();
    expect(CREATION.names.map((n) => n.name)).toContain(app.shell!.run!.player.name);
  });

  it('finishing starts the run in the surface village and saves it at once', async () => {
    const store = new MemoryStore();
    const app = make(store);
    press(app, 'Enter');
    createAs(app, 'Bard', 'Lio');
    await flush();
    const run = app.shell!.run!;
    expect([run.depth, run.player.name, run.classDef!.name]).toEqual([0, 'Lio', 'Bard']);
    expect(await new SaveSlot(store).exists()).toBe(true);
    expect((await new SaveSlot(store).read())!.player.name).toBe('Lio');
    expect(app.shell!.character).toMatchObject({ name: 'Lio', className: 'Bard', abilities: ['Fascinate'] });
  });
});

describe('Spec 03 and 05: every class starts with its own dice, spells and gear', () => {
  const carried = (p: { equipment: Partial<Record<string, Item>>; pack: Item[] }): Map<string, number> => {
    const n = new Map<string, number>();
    for (const item of [...EQUIP_SLOTS.map((s) => p.equipment[s]).filter((i): i is Item => !!i), ...p.pack]) {
      n.set(item.id, (n.get(item.id) ?? 0) + ('count' in item && typeof item.count === 'number' && item.kind !== 'potion' ? item.count : 1));
    }
    return n;
  };

  for (const cls of CREATION.classes) {
    it(`${cls.name}: level 1 dice at the class's steps, its gear worn and packed, its spells and major ability`, () => {
      const p = startingPlayer(99, 'Test', cls, CREATION);
      expect(p.pools).toEqual({ combat: { step: cls.start.combat, dice: 1, max: 1 }, skill: { step: cls.start.skill, dice: 1, max: 1 }, magic: { step: cls.start.magic, dice: 1, max: 1 } });
      expect([p.level, p.xp, p.town.bank, p.classId, p.name]).toEqual([1, 0, 20, cls.id, 'Test']);
      expect(p.abilities).toEqual([cls.majorAbility.id]);
      // Gear: every entry is carried, counts and all; weapons, armour and shields are worn when a slot is free.
      const want = new Map<string, number>();
      for (const g of cls.gear ?? []) want.set(g.id, (want.get(g.id) ?? 0) + (g.count ?? 1));
      expect(cls.gear?.length, 'every class has starting gear').toBeGreaterThan(0);
      expect(carried(p)).toEqual(want);
      expect(p.equipment.main ?? p.equipment.ranged, 'something to fight with').toBeDefined();
      for (const item of p.pack) if (item.kind === 'armour') expect(p.equipment.body).toBeDefined();
      // Spells: the class's number, its guaranteed one, no repeats; none for classes without spells.
      expect(p.spells).toHaveLength(cls.spells?.count ?? 0);
      if (cls.spells?.always) expect(p.spells).toContain(cls.spells.always);
      expect(new Set(p.spells).size).toBe(p.spells.length);
      // The potions it set out with are known by name.
      for (const item of p.pack) if (item.kind === 'potion') expect(p.known).toContain(item.id);
    });
  }

  it('every class can be created from the title screen, and its run is saved', async () => {
    for (const cls of CREATION.classes) {
      const store = new MemoryStore();
      const app = make(store);
      press(app, 'Enter');
      createAs(app, cls.name, 'Rook');
      await flush();
      expect(app.shell!.run!.classDef!.id).toBe(cls.id);
      expect((await new SaveSlot(store).read())!.player.classId).toBe(cls.id);
    }
  });
});

describe('Spec 08, Addendum A: the character_names table', () => {
  it('holds names of 1 to 16 letters, spaces, apostrophes and hyphens', () => {
    expect(CREATION.names.length).toBeGreaterThan(0);
    for (const ok of ['Ada', "O'Neil", 'Anne-Marie', 'Sixteen Letters!'.slice(0, 15)]) expect(characterNameSchema.safeParse({ id: 'n', name: ok }).success, ok).toBe(true);
    for (const bad of ['', 'Seventeen letters', 'R2D2', ' Ada', 'Ada ']) expect(characterNameSchema.safeParse({ id: 'n', name: bad }).success, bad).toBe(false);
  });
});
