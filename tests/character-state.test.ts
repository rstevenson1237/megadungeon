import { describe, expect, it } from 'vitest';
import { levelThemeSchema } from '../src/core/schemas.ts';
import { Game, createPlayer } from '../src/game/game.ts';
import { Run } from '../src/game/run.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { createCharacter, type ClassDef } from '../src/rules/character/character.ts';
import { classById } from '../src/rules/character/classes.ts';
import { packSize } from '../src/rules/items/inventory.ts';
import { Grid } from '../src/ui/grid.ts';
import { drawMap } from '../src/ui/map-view.ts';
import { DEFAULT_LOOK, MAP, dimmed, mapLook } from '../src/ui/palette.ts';
import { MAIN_PANE, inner } from '../src/ui/panes.ts';
import { Shell, abilityLines } from '../src/ui/shell.ts';
import { CONTENT, ITEMS, SPELLS, content, gear, room, testCharacter, testPlayer } from './helpers.ts';

const thief = (): ClassDef => classById(content().bundle, 'thief');
/** A class whose every minor draw is Pack Mule, so a level up is sure to draw it. */
const muleClass = (): ClassDef => ({ ...thief(), minorAbilities: [{ id: 'pack_mule', name: 'Pack Mule', stackable: true }] });

describe('Spec 03, Addendum A: one record of the character', () => {
  it('the player is the character: the run hands out the player itself, and the old copies are gone', () => {
    const player = createPlayer({ character: createCharacter('Ilse', thief()) });
    const run = new Run(3, player, { classDef: thief() });
    expect(run.character).toBe(run.player);
    for (const gone of ['combatDice', 'combatMax', 'combatStep', 'skill', 'magic', 'packSlots']) expect(player).not.toHaveProperty(gone);
    expect(player.pools).toEqual({ combat: { step: 6, dice: 1, max: 1 }, skill: { step: 8, dice: 1, max: 1 }, magic: { step: 4, dice: 1, max: 1 } });
  });

  it('a level up changes the pools the game rolls from, with nothing to copy across', () => {
    const run = new Run(3, createPlayer({ character: createCharacter('Ilse', thief()) }), { classDef: thief() });
    run.player.xp = 2000;
    run.player.pools.combat.dice = 0; // hurt: the new die arrives full, the hurt stays
    expect(run.levelUp('combat')).not.toBeNull();
    expect(run.player.level).toBe(2);
    expect(run.player.pools.combat).toEqual({ step: 6, dice: 1, max: 2 });
  });

  it('a Pack Mule drawn at level up grows the pack at once, and the pack really holds more', () => {
    const run = new Run(3, createPlayer({ character: createCharacter('Ilse', muleClass()), pack: [], equipment: {} }), { classDef: muleClass(), items: ITEMS });
    expect(packSize(run.player)).toBe(12);
    run.player.xp = 4000;
    run.levelUp('skill');
    expect(run.player.minorAbilities).toEqual(['pack_mule']);
    expect(packSize(run.player)).toBe(14);
    run.levelUp('skill');
    expect(packSize(run.player)).toBe(16);
    // Thirteen one-slot items: more than the 12 slots a new character has.
    const game = new Game(1, room(6, 4, 2, 2), run.player, { items: ITEMS, content: CONTENT });
    for (let i = 0; i < 13; i++) game.state.player.pack.push(gear('dagger', 'normal'));
    game.state.drops.push({ x: 2, y: 2, contents: [{ kind: 'item', item: gear('dagger', 'normal') }] });
    expect(game.act({ type: 'pickup' })!.messages.map((m) => m.text).join()).not.toContain('full');
    expect(game.state.player.pack).toHaveLength(14);
  });

  it("a shrine set's lasting buff now reaches the rules that read it: a wait buff of 8 brings a die back in 8 rounds", () => {
    const game = new Game(1, room(6, 4, 2, 2), testPlayer({ combatDice: 1, combatMax: 2, buffs: [{ passive: 'wait', amount: 8 }] }), { spells: SPELLS, items: ITEMS, content: CONTENT });
    for (let i = 0; i < 7; i++) game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBe(1);
    game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBe(2);
  });
});

describe('Spec 01: the character pane shows only real state', () => {
  const shellFor = (run: Run): Shell => {
    const stats = (['Combat', 'Skill', 'Magic'] as const).map((name) => ({ name, step: 6, current: 1, max: 1 }));
    const shell = new Shell('Test', { ...testCharacter(), name: 'Pane test data', stats, abilities: ['Fake', 'Data'], wait: { rounds: 3, needed: 10 } });
    shell.setRun(run);
    return shell;
  };

  it('identity, abilities, stats and the wait counter come from the player and the class', () => {
    const player = createPlayer({ character: createCharacter('Ilse', muleClass()) });
    player.minorAbilities.push('pack_mule', 'pack_mule');
    player.waited = 4;
    const shell = shellFor(new Run(5, player, { classDef: muleClass(), levelFor: () => room(8, 6, 2, 2), startDepth: 1, villages: [0] }));
    expect(shell.character.name).toBe('Ilse');
    expect(shell.character.className).toBe('Thief');
    expect(shell.character.abilities).toEqual(['Backstab', 'Pack Mule x2']);
    expect(shell.character.wait).toEqual({ rounds: 4, needed: 10 });
    expect(shell.character.inventory.total).toBe(16);
    expect(shell.character.stats.find((s) => s.name === 'Skill')).toMatchObject({ step: 8, current: 1, max: 1 });
  });

  it('the wait counter climbs as the player waits, and the steps follow a level up', () => {
    const run = new Run(5, createPlayer({ character: createCharacter('Ilse', thief()) }), { classDef: thief(), levelFor: () => room(8, 6, 2, 2), startDepth: 1, villages: [0] });
    run.player.pools.combat.max = 2; // room to recover
    const shell = shellFor(run);
    shell.handleKey({ key: ' ', shiftKey: false });
    shell.handleKey({ key: ' ', shiftKey: false });
    expect(shell.character.wait.rounds).toBe(2);
    run.player.xp = 8000;
    run.levelUp('skill');
    run.levelUp('skill');
    run.levelUp('skill'); // level 4: the thief's Skill steps up
    shell.setRun(run);
    expect(shell.character.stats.find((s) => s.name === 'Skill')).toMatchObject({ step: 10, max: 4 });
  });

  it('ability lines: the major ability first, then minor abilities by name, a repeated stackable one counted', () => {
    expect(abilityLines(['keen_eye', 'fence'], thief())).toEqual(['Backstab', 'Keen Eye', 'Fence']);
    expect(abilityLines(['pack_mule', 'pack_mule', 'pack_mule'], muleClass())).toEqual(['Backstab', 'Pack Mule x3']);
    expect(abilityLines(['pack_mule'], undefined)).toEqual(['pack_mule']);
  });
});

describe('Spec 01, Addendum A: the header names the theme', () => {
  it('a dungeon level is headed by its theme and depth; a village keeps its own name', () => {
    const bundle = content().bundle;
    const options = runOptionsFor(bundle, 2026);
    const depth = [1, 2, 3, 4, 5].find((d) => !options.layout!.villages.some((v) => v.level === d))!;
    const theme = (bundle.tables.level_themes as { id: string; name: string }[]).find((t) => t.id === options.layout!.themes[depth])!;
    const run = new Run(2026, testPlayer(), { ...options, startDepth: depth });
    expect(run.title).toBe(`${theme.name}, Level ${depth}`);
    expect(new Run(2026, testPlayer(), options).title).toBe('Surface Village');
  });
});

describe('Spec 08, Addendum A: theme palettes and tiles', () => {
  const palette = { wall: '#203040', floor: '#405060', door: '#a0a0a0', stairs: '#ffffff', shallow_water: '#00a0ff', deep_water: '#0040a0', lava: '#ff4000', accent: '#ff00ff' };
  const base = { id: 'test_theme', name: 'Test', layout: 'rooms_and_corridors', size: 'small' } as const;

  it('the schema takes a full palette and a wall glyph of #, a solid block or a dark shade, and refuses anything else', () => {
    expect(levelThemeSchema.safeParse({ ...base, palette, tiles: { wall: 219, floor: 250 } }).success).toBe(true);
    expect(levelThemeSchema.safeParse({ ...base, palette: { ...palette, wall: 'grey' } }).success).toBe(false);
    expect(levelThemeSchema.safeParse({ ...base, palette: { wall: '#000000' } }).success).toBe(false);
    expect(levelThemeSchema.safeParse({ ...base, tiles: { wall: 36, floor: 250 } }).success).toBe(false);
    expect(levelThemeSchema.safeParse({ ...base }).success).toBe(true);
  });

  it('a theme without a palette draws in the default set; one with a palette draws in it, remembered cells at half brightness', () => {
    expect(mapLook(undefined)).toBe(DEFAULT_LOOK);
    expect(mapLook({})).toBe(DEFAULT_LOOK);
    const look = mapLook({ palette, tiles: { wall: 178, floor: 46 } });
    expect(look.colours.wall).toEqual({ visible: 0x203040, remembered: dimmed(0x203040) });
    expect(dimmed(0x203040)).toBe(0x101820);
    expect(look.colours.special.visible).toBe(0xff00ff);
    expect([look.wallGlyph, look.floorGlyph]).toEqual([178, 46]);
  });

  it("the map draws a level in its theme's look: wall and floor glyphs and colours", () => {
    const game = new Game(1, room(6, 4, 2, 2), testPlayer(), { items: ITEMS, content: CONTENT });
    const view = inner(MAIN_PANE);
    const cellAt = (grid: Grid, x: number, y: number) => {
      const i = y * 100 + x;
      return [grid.glyph[i], grid.fg[i]];
    };
    const plain = new Grid();
    drawMap(plain, game.state);
    const themed = new Grid();
    drawMap(themed, game.state, null, null, mapLook({ palette, tiles: { wall: 219, floor: 46 } }));
    // The room is centred in the view; find its top-left wall and a floor cell.
    let corner: [number, number] | undefined;
    for (let y = view.y; y < view.y + view.h && !corner; y++) for (let x = view.x; x < view.x + view.w && !corner; x++) if (plain.glyph[y * 100 + x] === 35) corner = [x, y];
    const [cx, cy] = corner!;
    expect(cellAt(plain, cx, cy)).toEqual([35, MAP.wall.visible]);
    expect(cellAt(themed, cx, cy)).toEqual([219, 0x203040]);
    expect(cellAt(plain, cx + 1, cy + 1)).toEqual([250, MAP.floor.visible]);
    expect(cellAt(themed, cx + 1, cy + 1)).toEqual([46, 0x405060]);
  });
});
