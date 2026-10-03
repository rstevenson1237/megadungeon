// Task 3.5: the effect vocabulary (Spec 08, Addendum A) and the 16 example minor abilities (Spec 03, Addendum A).
// Each example row has its own test; the build fails on a row naming an effect not on the list or missing its fields.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { ABILITY_EFFECTS, ABILITY_EFFECT_IDS } from '../src/core/catalog.ts';
import type { LogMessage } from '../src/core/log.ts';
import { activeAbilities, derivedFor, packSizeOf } from '../src/game/abilities.ts';
import { hurtPlayer, monsterAttacks, playerAttacks } from '../src/game/combat.ts';
import { Game, createPlayer, type PlayerState } from '../src/game/game.ts';
import { ctxOf, drinkPotion, equipItem } from '../src/game/items.ts';
import { asCast, targetSpecOf, widened } from '../src/game/magic.ts';
import { Run } from '../src/game/run.ts';
import { createCharacter, type ClassDef } from '../src/rules/character/character.ts';
import { classById } from '../src/rules/character/classes.ts';
import { derive } from '../src/rules/items/gear.ts';
import type { Item } from '../src/rules/items/types.ts';
import { applyStatus, hasStatus } from '../src/rules/magic/status.ts';
import type { Feature, Level } from '../src/rules/world/level.ts';
import { shopStock } from '../src/rules/villages/stock.ts';
import { buildContent } from '../tools/content-build.ts';
import { CONTENT, ITEMS, SPELLS, castingGame, cell, content, gameAt, gameOn, gear, magic, monsterAt, rig, room, spell, townRun, withThings } from './helpers.ts';

const said = (r: { messages: { text: string }[] }): string => r.messages.map((m) => m.text).join(' | ');
const minors = CONTENT.minors;
const derivedOf = (p: PlayerState) => derivedFor(p, minors);
const bare = { pack: [], equipment: {}, combatDice: 4, combatMax: 4, skill: { step: 6 as const, dice: 2, max: 2 } };

/** A warrior whose every minor draw is the one ability given (as its class pool has it), for a level up sure to draw it. */
function classDrawing(id: string): ClassDef {
  const pools = ['warrior', 'mage', 'thief', 'priest'].flatMap((c) => classById(content().bundle, c).minorAbilities);
  return { ...classById(content().bundle, 'warrior'), minorAbilities: [pools.find((a) => a.id === id)!] };
}

/** A run whose character draws `id` at the next level up, wielding `main` (or bare-handed). */
function drawing(id: string, main?: Item): Run {
  const cls = classDrawing(id);
  const player = createPlayer({ character: createCharacter('Ilse', cls), pack: [], equipment: main ? { main } : {} });
  const run = new Run(3, player, { classDef: cls, items: ITEMS, content: CONTENT, spells: SPELLS });
  run.player.xp = 2000;
  return run;
}

describe('Spec 08, Addendum A: one effect vocabulary in code', () => {
  it('every example minor ability, artifact and shrine buff in the content names an effect on the list', () => {
    const tables = content().bundle.tables;
    const named = [
      ...(tables.minor_abilities as { effect: string }[]),
      ...(tables.artifacts as { effect: string }[]),
      ...(tables.altar_gods as { buff: { effect: string } }[]).map((g) => g.buff),
    ];
    expect(named.length).toBe(43 + 20 + 3);
    for (const row of named) expect(ABILITY_EFFECT_IDS).toContain(row.effect);
    // Every effect on the list says what it does and of what kind it is.
    for (const id of ABILITY_EFFECT_IDS) expect(ABILITY_EFFECTS[id].text.length).toBeGreaterThan(0);
  });

  it('the 16 examples map to their effects, with Blessed renamed Hallowed', () => {
    const SPEC_EXAMPLES = ['hardy', 'weapon_master', 'pack_mule', 'second_wind', 'focus', 'scholar', 'widen', 'mana_well', 'keen_eye', 'light_step', 'fence', 'quick_hands', 'hallowed', 'sanctuary', 'tithe', 'purify'];
    expect(Object.fromEntries([...minors].filter(([id]) => SPEC_EXAMPLES.includes(id)).map(([id, spec]) => [id, spec.effect]))).toEqual({
      hardy: 'wait_rounds',
      weapon_master: 'weapon_melee',
      pack_mule: 'pack_slots',
      second_wind: 'rally',
      focus: 'spell_focus',
      scholar: 'book_lore',
      widen: 'spell_widen',
      mana_well: 'potion_magic',
      keen_eye: 'advantage',
      light_step: 'sure_footing',
      fence: 'sell_bonus',
      quick_hands: 'careful_opening',
      hallowed: 'against_tag',
      sanctuary: 'sanctuary',
      tithe: 'rest_cost',
      purify: 'purify',
    });
    expect(CONTENT.minorNames.get('hallowed')).toBe('Hallowed');
  });

  it('a ring of searching and a shrine buff go through the same effects as an ability: search advantage from any of them', () => {
    const ring = { ...bare, equipment: { ring1: magic('ring_searching', false) } };
    expect(derivedOf(gameOn(room(5, 5, 2, 2), ring).state.player).search).toBe('advantage');
    expect(derivedOf(gameOn(room(5, 5, 2, 2), { ...bare, buffs: [{ effect: 'advantage', rolls: 'search' }] }).state.player).search).toBe('advantage');
    expect(derivedOf(gameOn(room(5, 5, 2, 2), { ...bare, minorAbilities: ['keen_eye'] }).state.player).search).toBe('advantage');
    // A cursed ring of searching still reverses, and cancels an ability's advantage (Spec 05).
    expect(derivedOf(gameOn(room(5, 5, 2, 2), { ...bare, equipment: { ring1: magic('ring_searching', true) }, minorAbilities: ['keen_eye'] }).state.player).search).toBe('normal');
  });

  it('an artifact carries its effect from its row, and wearing it gives that effect', () => {
    const row = ITEMS.artifacts.get('stub_artifact_02')!;
    expect(row).toMatchObject({ effect: 'melee', amount: 1 });
    const game = gameOn(room(5, 5, 2, 2), bare);
    const before = derivedOf(game.state.player).melee;
    game.state.player.equipment.ring1 = { kind: 'artifact', uid: 1, id: row.id, name: row.name, value: 0, slot: 'ring', effect: { effect: 'melee', amount: 1 }, cursed: false, identified: true };
    expect(derivedOf(game.state.player).melee).toBe(before + 1);
  });
});

describe('Spec 08, Addendum A: a row naming an unknown effect, or missing its fields, fails the build', () => {
  const dirs: string[] = [];
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });
  const build = (files: Record<string, string>): string => {
    const dir = mkdtempSync(join(tmpdir(), 'effects-'));
    dirs.push(dir);
    for (const [name, text] of Object.entries(files)) {
      mkdirSync(join(dir, name, '..'), { recursive: true });
      writeFileSync(join(dir, name), text);
    }
    return buildContent(dir).errors.join('\n');
  };
  const cls = '- id: x\n  name: X\n  start: { combat: 8, skill: 6, magic: 4 }\n  steps: [combat, combat, skill]\n  ability: { id: y, name: Y, text: z }\n';
  const minor = (fields: string) => ({ 'classes.yaml': cls, 'minor_abilities.yaml': `- id: m\n  name: M\n  text: t\n  classes: [x]\n${fields}` });

  it('a minor ability: a good row builds; an unknown effect, no effect, a missing field or a stray field fails', () => {
    expect(build(minor('  effect: wait_rounds\n  amount: 8\n'))).toBe('');
    expect(build(minor('  effect: fly\n'))).toMatch(/effect/);
    expect(build(minor(''))).toMatch(/effect/);
    expect(build(minor('  effect: wait_rounds\n'))).toMatch(/wait_rounds needs `amount`/);
    expect(build(minor('  effect: stealth\n  amount: 2\n'))).toMatch(/stealth takes no `amount`/);
    expect(build(minor('  effect: advantage\n  rolls: [search, dance]\n'))).not.toBe('');
    expect(build(minor('  effect: advantage\n  rolls: search\n  shape: area\n'))).toMatch(/`shape` goes with the roll type `spell`/);
    expect(build(minor('  effect: against_tag\n  tag: dragon\n'))).not.toBe('');
    expect(build(minor('  effect: rest_cost\n  amount: 150\n'))).toMatch(/rest_cost needs an `amount` from 0 to 100/);
    expect(build(minor('  effect: sanctuary\n  amount: 2\n'))).toMatch(/sanctuary needs `rounds`/);
  });

  it('an artifact: it must name an effect, and an active or a bound effect belongs to minor abilities only', () => {
    expect(build({ 'artifacts.yaml': '- id: a\n  name: A\n  effect: defence\n  amount: 1\n' })).toBe('');
    expect(build({ 'artifacts.yaml': '- id: a\n  name: A\n' })).toMatch(/effect/);
    expect(build({ 'artifacts.yaml': '- id: a\n  name: A\n  passive: search\n' })).not.toBe('');
    expect(build({ 'artifacts.yaml': '- id: a\n  name: A\n  effect: purify\n' })).toMatch(/purify is only for minor_abilities/);
    expect(build({ 'artifacts.yaml': '- id: a\n  name: A\n  effect: weapon_melee\n  amount: 1\n' })).toMatch(/weapon_melee is only for minor_abilities/);
  });

  it('a shrine buff: an altar god names its buff from the list, with its fields', () => {
    const god = (buff: string) => ({ 'altar_gods.yaml': `- id: g\n  name: G\n  blessing: bless\n  buff: ${buff}\n` });
    expect(build(god('{ effect: melee, amount: 1 }'))).toBe('');
    expect(build(god('{ effect: melee }'))).toMatch(/melee needs `amount`/);
    expect(build(god('{ effect: luck }'))).not.toBe('');
    expect(build(god('{ passive: search }'))).not.toBe('');
    expect(build(god('{ effect: sanctuary, amount: 2, rounds: 3 }'))).toMatch(/only for minor_abilities/);
  });
});

describe('Spec 03, Addendum A: the example minor abilities, each as its row says', () => {
  it('Hardy: waiting restores a Combat die in 8 rounds', () => {
    const game = gameOn(room(6, 4, 2, 2), { combatDice: 1, combatMax: 2, minorAbilities: ['hardy'] });
    for (let i = 0; i < 7; i++) game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBe(1);
    game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBe(2);
  });

  it('Weapon Master: +1 on melee with the weapon base wielded when drawn, and none with another', () => {
    const run = drawing('weapon_master', gear('short_sword', 'normal'));
    const plain = derive(run.player.equipment).melee;
    expect(run.levelUp('combat')?.minor).toBe('weapon_master');
    expect(run.player.bindings).toEqual({ weapon_master: 'short_sword' });
    expect(derivedOf(run.player).melee).toBe(plain + 1);
    // Wielding a long sword instead: no bonus; back to a short sword (any one), the bonus returns.
    const long = gear('long_sword', 'normal');
    run.player.pack.push(long);
    expect(equipItem(run.ctx(), long, [])).toBe(true);
    expect(derivedOf(run.player).melee).toBe(derive(run.player.equipment).melee);
    const other = gear('short_sword', 'normal');
    run.player.pack.push(other);
    equipItem(run.ctx(), other, []);
    expect(derivedOf(run.player).melee).toBe(plain + 1);
  });

  it('Weapon Master drawn bare-handed attaches to the next weapon equipped', () => {
    const run = drawing('weapon_master');
    run.levelUp('combat');
    expect(run.player.bindings).toEqual({ weapon_master: null });
    expect(derivedOf(run.player).melee).toBe(-1); // bare hands, and nothing bound yet
    const dagger = gear('dagger', 'normal');
    run.player.pack.push(dagger);
    equipItem(run.ctx(), dagger, []);
    expect(run.player.bindings).toEqual({ weapon_master: 'dagger' });
    expect(derivedOf(run.player).melee).toBe(derive(run.player.equipment).melee + 1);
    // The binding stays with the dagger: a mace wielded later does not take it.
    const mace = gear('mace', 'normal');
    run.player.pack.push(mace);
    equipItem(run.ctx(), mace, []);
    expect(run.player.bindings).toEqual({ weapon_master: 'dagger' });
    expect(derivedOf(run.player).melee).toBe(derive(run.player.equipment).melee);
  });

  it('Pack Mule: +2 pack slots, stackable; the pack grows the moment it is drawn', () => {
    const run = drawing('pack_mule');
    expect(packSizeOf(run.player, minors)).toBe(12);
    run.player.xp = 4000;
    run.levelUp('skill');
    expect(packSizeOf(run.player, minors)).toBe(14);
    run.levelUp('skill');
    expect(run.player.minorAbilities).toEqual(['pack_mule', 'pack_mule']);
    expect(packSizeOf(run.player, minors)).toBe(16);
  });

  it('Second Wind: once per level visit, a hit that leaves one Combat die gives one back', () => {
    const hit = { hit: 'Ow.', kill: 'Dead.' };
    const game = gameOn(room(6, 4, 2, 2), { combatDice: 3, combatMax: 3, minorAbilities: ['second_wind'] });
    const messages: LogMessage[] = [];
    hurtPlayer(game, messages, hit);
    expect(game.state.player.pools.combat.dice).toBe(2);
    hurtPlayer(game, messages, hit);
    expect(game.state.player.pools.combat.dice).toBe(2); // left at one, and one came back
    expect(messages.map((m) => m.text)).toContain('A second wind fills you: one Combat die returns.');
    hurtPlayer(game, messages, hit);
    expect(game.state.player.pools.combat.dice).toBe(1); // spent for this visit
    // A new visit to a level (a new game on arrival) has it again.
    const next = new Game(1, room(6, 4, 2, 2), game.state.player, { content: CONTENT, items: ITEMS });
    game.state.player.pools.combat.dice = 2;
    hurtPlayer(next, [], hit);
    expect(next.state.player.pools.combat.dice).toBe(2);
    // Without it, the hit just takes the die.
    const plain = gameOn(room(6, 4, 2, 2), { combatDice: 2, combatMax: 3 });
    hurtPlayer(plain, [], hit);
    expect(plain.state.player.pools.combat.dice).toBe(1);
  });

  it('Focus: advantage on spell rolls while no hostile creature is adjacent', () => {
    const cast = (extra: { minorAbilities?: string[] }, adjacent?: 'hostile' | 'friendly') => {
      const game = castingGame(room(10, 5, 2, 2), extra);
      if (adjacent === 'hostile') game.state.monsters.push(monsterAt(3, 2, { alert: true, dice: 3 }));
      if (adjacent === 'friendly') game.state.monsters.push(monsterAt(3, 2, { kind: 'rival', hostile: false, dice: 3 }));
      rig(game, 1, 5); // advantage keeps the 5; a plain roll is the 1
      return said(game.cast(spell('shield')));
    };
    expect(cast({ minorAbilities: ['focus'] })).not.toContain('fizzles');
    expect(cast({ minorAbilities: ['focus'] }, 'friendly')).not.toContain('fizzles'); // a rival not yet hostile is no foe
    expect(cast({ minorAbilities: ['focus'] }, 'hostile')).toContain('fizzles');
    expect(cast({})).toContain('fizzles');
  });

  it('Scholar: a spellbook shows its spell before reading, and is learned on 2 to 3 as well as 4 or more', () => {
    const scholar = castingGame(room(10, 3, 1, 2), { spells: ['heal'], minorAbilities: ['scholar'] });
    rig(scholar, 3);
    expect(scholar.readBook({ spell: 'fireball' })).toMatchObject({ spent: true, used: true });
    expect(scholar.state.player.spells).toContain('fireball');
    rig(scholar, 1);
    expect(scholar.readBook({ spell: 'sleep' })).toMatchObject({ used: true }); // a 1 still destroys it
    expect(scholar.state.player.spells).not.toContain('sleep');
    const plain = castingGame(room(10, 3, 1, 2), { spells: ['heal'] });
    rig(plain, 3);
    expect(plain.readBook({ spell: 'fireball' })).toMatchObject({ used: false });
    // Every spellbook in this build comes from a shop already named by its spell, for anyone; no book yet holds a
    // lore-chain place (chain entries are graffiti). So showing them adds nothing until one does (clarification of task 3.5).
    const stock = shopStock(ITEMS, SPELLS, 1, 0, 0, 0).filter((i) => i.kind === 'spellbook');
    for (const b of stock) expect(b.name).toBe(`Spellbook of ${SPELLS.find((sp) => b.kind === 'spellbook' && sp.id === b.spell)!.name}`);
  });

  it("Widen: an area spell's footprint grows by one cell each way, and a caster-centred spell reaches one further", () => {
    expect(widened(spell('fireball'), 1).size).toBe(5);
    expect(widened(spell('blizzard'), 1).size).toBe(7);
    expect(widened(spell('thunderclap'), 1).reach).toBe((spell('thunderclap').reach ?? 0) + 1);
    expect(widened(spell('arcane_bolt'), 1)).toBe(spell('arcane_bolt'));
    // In play: a goblin two cells from the aim is caught only when widened, and the targeting shows 5 x 5.
    const hits = (minor: string[]) => {
      const game = castingGame(room(12, 5, 1, 3), { minorAbilities: minor });
      const aim = monsterAt(6, 3, { alert: true });
      const far = monsterAt(8, 3, { alert: true, id: 99 });
      game.state.monsters.push(aim, far);
      game.refreshSight();
      expect(targetSpecOf(asCast(game, spell('fireball'))).shape).toEqual({ kind: 'area', size: minor.length ? 5 : 3 });
      rig(game, 6);
      game.cast(spell('fireball'), aim);
      return game.state.monsters.includes(far);
    };
    expect(hits(['widen'])).toBe(false);
    expect(hits([])).toBe(true);
  });

  it('Mana Well: potions that restore Magic dice restore one extra; others are unchanged', () => {
    const drink = (minor: string[], id: string) => {
      const game = gameOn(room(5, 5, 2, 2), { magic: { step: 6, dice: 0, max: 4 }, combatDice: 1, combatMax: 4, minorAbilities: minor, pack: [] });
      const potion = magic(id) as Extract<Item, { kind: 'potion' }>;
      game.state.player.pack.push(potion);
      drinkPotion(ctxOf(game), potion, []);
      return [game.state.player.pools.magic.dice, game.state.player.pools.combat.dice];
    };
    expect(drink(['mana_well'], 'potion_clarity')).toEqual([2, 1]);
    expect(drink([], 'potion_clarity')).toEqual([1, 1]);
    expect(drink(['mana_well'], 'potion_healing')).toEqual([0, 2]);
  });

  it('Keen Eye: advantage on search checks, and passive notice is rolled normally instead of with disadvantage', () => {
    const level = withThings(room(12, 5, 1, 1), { traps: [{ x: 4, y: 3, id: 'trap_dart' }] });
    const notice = (minor: string[]) => {
      const game = gameAt(level, 2, 3, { ...bare, minorAbilities: minor });
      rig(game, 5, 1); // with disadvantage the lower die, a 1; rolled normally, the 5
      game.act({ type: 'move', dx: 1, dy: 0 });
      return game.state.revealed.includes(cell(level, 4, 3));
    };
    expect(notice(['keen_eye'])).toBe(true);
    expect(notice([])).toBe(false);
    const search = (minor: string[]) => {
      const game = gameAt(level, 3, 3, { ...bare, minorAbilities: minor });
      game.state.used.noticed.push(cell(level, 4, 3));
      rig(game, 1, 5); // with advantage the higher die, a 5
      game.act({ type: 'search' });
      return game.state.revealed.includes(cell(level, 4, 3));
    };
    expect(search(['keen_eye'])).toBe(true);
    expect(search([])).toBe(false);
  });

  it('Light Step: on the avoid check, 2 to 3 jumps clear like 4 or more, and a 1 springs it one time in two', () => {
    const level: Level = withThings(room(12, 5, 1, 1), { traps: [{ x: 3, y: 3, id: 'trap_dart' }] });
    const step = (minor: string[], ...faces: number[]) => {
      const game = gameAt(level, 2, 3, { ...bare, minorAbilities: minor });
      rig(game, ...faces);
      const result = game.act({ type: 'move', dx: 1, dy: 0 })!;
      return { sprung: game.state.player.pools.combat.dice < 4, found: game.state.revealed.includes(cell(level, 3, 3)), text: said(result) };
    };
    for (const face of [2, 3]) {
      expect(step(['light_step'], face)).toMatchObject({ sprung: false, found: true });
      expect(step([], face)).toMatchObject({ sprung: true });
    }
    expect(step(['light_step'], 1, 1)).toMatchObject({ sprung: true }); // the one time in two
    expect(step(['light_step'], 1, 2)).toMatchObject({ sprung: false, found: true });
    expect(step([], 1)).toMatchObject({ sprung: true });
  });

  it('Fence: +20% when selling', () => {
    const price = (minor: string[]) => townRun(12345, { minorAbilities: minor, pack: [gear('long_sword', 'normal')] }).town.sellable()[0]!.price;
    expect(price([])).toBe(20);
    expect(price(['fence'])).toBe(24);
  });

  it('Quick Hands: opening a container whose trap is not found makes a Skill check; only a 1 springs it, otherwise it is found', () => {
    const chest: Feature = { type: 'container', kind: 'chest', x: 3, y: 3, contents: [{ kind: 'coins', amount: 5 }], trap: 'trap_poison_needle' };
    const level = withThings(room(12, 5, 1, 1), { features: [chest] });
    const open = (minor: string[], face?: number) => {
      const game = gameAt(level, 2, 3, { ...bare, minorAbilities: minor });
      if (face !== undefined) rig(game, face);
      const result = game.act({ type: 'interact' })!;
      return { game, result, poisoned: hasStatus(game.state.player.statuses, 'poisoned'), found: game.state.revealed.includes(cell(level, 3, 3)) };
    };
    for (const face of [2, 3, 4, 6]) {
      const r = open(['quick_hands'], face);
      expect(r).toMatchObject({ poisoned: false, found: true });
      expect(r.result.spent).toBe(true);
      expect(r.result.opened).toBeUndefined(); // found, not sprung: the trap is disarmed before it opens
    }
    expect(open(['quick_hands'], 1)).toMatchObject({ poisoned: true });
    expect(open([])).toMatchObject({ poisoned: true }); // without it, no check: the trap springs
  });

  it('Hallowed: advantage on the Combat die in melee against undead, attacking and defending', () => {
    const attack = (minor: string[], undead: boolean) => {
      const game = gameAt(room(8, 5, 1, 1), 2, 3, { ...bare, minorAbilities: minor });
      const m = monsterAt(3, 3, { alert: true, dice: 3, undead });
      game.state.monsters.push(m);
      rig(game, 1, 6, 3); // the player's die (two with advantage), then the monster's
      playerAttacks(game, m, []);
      return m.dice;
    };
    expect(attack(['hallowed'], true)).toBe(2); // 6 beats 3
    expect(attack(['hallowed'], false)).toBe(3); // a plain 1 loses
    expect(attack([], true)).toBe(3);
    const defend = (minor: string[], undead: boolean) => {
      const game = gameAt(room(8, 5, 1, 1), 2, 3, { ...bare, minorAbilities: minor });
      const m = monsterAt(3, 3, { alert: true, dice: 3, undead });
      game.state.monsters.push(m);
      rig(game, 4, 1, 6); // the monster's 4, then the player's die (two with advantage)
      monsterAttacks(game, m, []);
      return game.state.player.pools.combat.dice;
    };
    expect(defend(['hallowed'], true)).toBe(4);
    expect(defend(['hallowed'], false)).toBe(3);
  });

  it('Sanctuary: an active skill use; for 3 rounds monsters take -2 on melee rolls against the player', () => {
    const game = gameAt(room(8, 5, 1, 1), 2, 3, { ...bare, minorAbilities: ['sanctuary'] });
    expect(activeAbilities(game.state.player, minors)).toEqual(['sanctuary']);
    rig(game, 5);
    const used = game.useAbility('sanctuary');
    expect(used.spent).toBe(true);
    expect(game.state.player.pools.skill.dice).toBe(2); // a 4 or more costs no die
    expect(game.state.player.timed).toMatchObject([{ id: 'sanctuary', name: 'Sanctuary', rounds: 2 }]);
    const m = monsterAt(3, 3, { alert: true, dice: 3 });
    game.state.monsters.push(m);
    rig(game, 5, 4); // the monster's 5 becomes 3 and loses to the player's 4
    monsterAttacks(game, m, []);
    expect(game.state.player.pools.combat.dice).toBe(4);
    expect(m.dice).toBe(2);
    game.state.monsters.length = 0;
    game.act({ type: 'wait' });
    const ends = game.act({ type: 'wait' })!;
    expect(said(ends)).toContain('Sanctuary ends.');
    expect(game.state.player.timed).toEqual([]);
    game.state.monsters.push(m);
    rig(game, 5, 4);
    monsterAttacks(game, m, []);
    expect(game.state.player.pools.combat.dice).toBe(3);
  });

  it('Sanctuary as a skill use: 2 to 3 works and loses the die, 1 fails and loses it, an empty pool rolls with disadvantage', () => {
    const at = (skillDice: number, ...faces: number[]) => {
      const game = gameAt(room(8, 5, 1, 1), 2, 3, { ...bare, skill: { step: 6, dice: skillDice, max: 2 }, minorAbilities: ['sanctuary'] });
      rig(game, ...faces);
      game.useAbility('sanctuary');
      return [game.state.player.timed.length, game.state.player.pools.skill.dice];
    };
    expect(at(2, 3)).toEqual([1, 1]);
    expect(at(2, 1)).toEqual([0, 1]);
    expect(at(0, 6, 2)).toEqual([1, 0]); // the lower of two dice, a 2: it works and loses nothing more
    // An ability not drawn, or a passive one, cannot be used and costs nothing.
    const game = gameAt(room(8, 5, 1, 1), 2, 3, { ...bare, minorAbilities: ['hardy'] });
    expect(game.useAbility('sanctuary')).toMatchObject({ spent: false });
    expect(game.useAbility('hardy')).toMatchObject({ spent: false });
  });

  it('Tithe: village rest is free', () => {
    const run = townRun(12345, { minorAbilities: ['tithe'] });
    run.player.town.bank = 0;
    expect(run.town.restPrice).toBe(0);
    expect(run.town.rest().ok).toBe(true);
    const plain = townRun(12345);
    plain.player.town.bank = 0;
    expect(plain.town.restPrice).toBe(10);
    expect(plain.town.rest().ok).toBe(false);
  });

  it('Purify: lifts the curse of one worn cursed item (and Cursed if none is left), or else ends Poisoned', () => {
    const ring = magic('ring_searching', true);
    const cloak = magic('cloak_shadows', true);
    const game = gameAt(room(8, 5, 1, 1), 2, 3, { ...bare, minorAbilities: ['purify'], equipment: { ring1: ring, cloak } });
    applyStatus(game.state.player.statuses, 'cursed', null);
    rig(game, 5);
    expect(game.useAbility('purify').spent).toBe(true);
    expect(['cursed' in cloak && cloak.cursed, 'cursed' in ring && ring.cursed]).toEqual([false, true]); // the cloak's slot comes first
    expect(hasStatus(game.state.player.statuses, 'cursed')).toBe(true); // a worn curse is left
    rig(game, 5);
    game.useAbility('purify');
    expect('cursed' in ring && ring.cursed).toBe(false);
    expect(hasStatus(game.state.player.statuses, 'cursed')).toBe(false);
    // No worn curse: it ends Poisoned; with neither, it cannot be used and costs nothing.
    applyStatus(game.state.player.statuses, 'poisoned', 10);
    rig(game, 5);
    game.useAbility('purify');
    expect(hasStatus(game.state.player.statuses, 'poisoned')).toBe(false);
    expect(game.useAbility('purify')).toMatchObject({ spent: false, messages: [{ text: 'There is no curse or poison to cleanse.' }] });
  });
});
