import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game.ts';
import { Run } from '../src/game/run.ts';
import { offeringCost } from '../src/game/features/index.ts';
import { fountainDrinks } from '../src/game/features/fixtures.ts';
import { derive } from '../src/rules/items/gear.ts';
import { isIdentified } from '../src/rules/items/magic.ts';
import type { MapFragmentItem, WornItem } from '../src/rules/items/types.ts';
import { hasStatus, statusOf } from '../src/rules/magic/status.ts';
import type { Feature, Level, LoreMark } from '../src/rules/world/level.ts';
import { CONTENT, ITEMS, SPELLS, cell, gameAt, levelFrom, gameOn, magic, monsterAt, rig, room, testPlayer, withThings } from './helpers.ts';

const bare = { pack: [], equipment: {}, coins: 0, combatDice: 3, combatMax: 4, skill: { step: 6 as const, dice: 2, max: 2 }, magic: { step: 6 as const, dice: 2, max: 2 } };
const fixture = (kind: 'fountain' | 'altar' | 'sarcophagus' | 'rune', extra: Partial<Extract<Feature, { type: 'fixture' }>> = {}): Feature => ({ type: 'fixture', kind, x: 3, y: 3, ...extra });
const level = (feature: Feature, depth = 1, extra: Partial<Level> = {}): Level => ({ ...withThings(room(12, 5, 1, 1), { features: [feature] }), depth, ...extra });
const interact = (game: Game) => game.act({ type: 'interact' })!;
const said = (r: { messages: { text: string }[] }): string => r.messages.map((m) => m.text).join(' | ');
const only = (id: string) => ({ ...CONTENT, fountains: CONTENT.fountains.filter((f) => f.id === id) });

describe('Spec 06: fountains', () => {
  it('give 1 to 3 drinks, fixed by the run and the fountain, and run dry', () => {
    const counts = new Set<number>();
    for (let seed = 0; seed < 60; seed++) {
      const game = new Game(seed, level(fixture('fountain')), testPlayer(bare), { items: ITEMS, content: only('fountain_nothing'), spells: SPELLS });
      game.state.map.player = { x: 2, y: 3 };
      const n = fountainDrinks(game, 0);
      counts.add(n);
      expect(fountainDrinks(game, 0)).toBe(n);
    }
    expect([...counts].sort()).toEqual([1, 2, 3]);
  });

  it('a drink costs a round; once dry it says so and costs nothing', () => {
    const game = gameAt(level(fixture('fountain')), 2, 3, bare, { content: only('fountain_nothing') });
    const limit = fountainDrinks(game, 0);
    for (let i = 1; i <= limit; i++) {
      const r = interact(game);
      expect(r.spent).toBe(true);
      expect(said(r).includes('The fountain runs dry.')).toBe(i === limit);
    }
    const dry = interact(game);
    expect(dry).toMatchObject({ spent: false });
    expect(said(dry)).toBe('The fountain is dry.');
  });

  it('restores a Combat, Skill or Magic die, never past the maximum', () => {
    for (const [id, pool] of [['fountain_restore_combat', 'combatDice'], ['fountain_restore_skill', 'skill'], ['fountain_restore_magic', 'magic']] as const) {
      const game = gameAt(level(fixture('fountain')), 2, 3, { ...bare, skill: { step: 6, dice: 0, max: 2 }, magic: { step: 6, dice: 0, max: 2 } }, { content: only(id) });
      interact(game);
      const p = game.state.player;
      expect(pool === 'combatDice' ? p.combatDice : p[pool].dice, id).toBe(pool === 'combatDice' ? 4 : 1);
    }
    const full = gameAt(level(fixture('fountain')), 2, 3, { ...bare, combatDice: 4 }, { content: only('fountain_restore_combat') });
    interact(full);
    expect(full.state.player.combatDice).toBe(4);
  });

  it('cures poison, reveals the level map, pays coins scaled by depth, poisons, or does nothing', () => {
    const poisoned = gameAt(level(fixture('fountain')), 2, 3, bare, { content: only('fountain_cure') });
    poisoned.state.player.statuses.push({ id: 'poisoned', rounds: null, clock: 0 });
    interact(poisoned);
    expect(hasStatus(poisoned.state.player.statuses, 'poisoned')).toBe(false);

    const map = gameAt(level(fixture('fountain')), 2, 3, bare, { content: only('fountain_map') });
    expect(map.state.map.exploration.explored.some((e) => e === 0)).toBe(true);
    interact(map);
    expect(map.state.map.exploration.explored.every((e) => e === 1)).toBe(true);

    for (const depth of [1, 5]) {
      const coins = gameAt(level(fixture('fountain'), depth), 2, 3, bare, { content: only('fountain_coins') });
      interact(coins);
      expect(coins.state.player.coins, `depth ${depth}`).toBeGreaterThanOrEqual(2 * depth);
      expect(coins.state.player.coins, `depth ${depth}`).toBeLessThanOrEqual(8 * depth);
    }

    const foul = gameAt(level(fixture('fountain')), 2, 3, bare, { content: only('fountain_poison') });
    interact(foul);
    expect(hasStatus(foul.state.player.statuses, 'poisoned')).toBe(true);

    const still = gameAt(level(fixture('fountain')), 2, 3, bare, { content: only('fountain_nothing') });
    expect(said(interact(still))).toContain('nothing happens');
  });

  it('a water creature is an aquatic creature of the depth table, beside the fountain', () => {
    const game = gameAt(level(fixture('fountain')), 2, 3, bare, { content: only('fountain_creature') });
    expect(said(interact(game))).toContain('A stub eel appears!');
    expect(game.state.monsters).toHaveLength(1);
    expect(game.state.monsters[0]!.awareness).toBe('alert');
  });

  it('what has been drunk is part of the level delta', () => {
    const lvl = level(fixture('fountain'));
    const game = gameAt(lvl, 2, 3, bare, { content: only('fountain_nothing') });
    interact(game);
    const back = new Game(1, lvl, game.state.player, { delta: game.captureDelta(), items: ITEMS, content: only('fountain_nothing'), at: { x: 2, y: 3 } });
    expect(back.state.used.features[0]!.drinks).toBe(1);
  });
});

describe('Spec 06: altars', () => {
  const altar = (god?: string, extra: Partial<Extract<Feature, { type: 'fixture' }>> = {}) => fixture('altar', { ...(god ? { god: { id: god, name: god } } : {}), ...extra });

  it('E asks for an offering and spends nothing yet', () => {
    const game = gameAt(level(altar('god_stub_01'), 3), 2, 3, bare);
    const r = interact(game);
    expect(r).toMatchObject({ spent: false, offer: 0 });
    expect(offeringCost(game)).toBe(30);
  });

  it('gold costs 10 gp times the depth and an offering is one round; too little gold is refused for free', () => {
    const poor = gameAt(level(altar('god_stub_01'), 3), 2, 3, { ...bare, coins: 29 });
    expect(poor.offerAt(0, 'gold')).toMatchObject({ spent: false });
    expect(poor.state.player.coins).toBe(29);
    expect(poor.state.used.features[0]?.done).toBeUndefined();
    const rich = gameAt(level(altar('god_stub_01'), 3), 2, 3, { ...bare, coins: 100 });
    rig(rich, 6);
    expect(rich.offerAt(0, 'gold')).toMatchObject({ spent: true });
    expect(rich.state.player.coins).toBe(70);
  });

  it('an item from the pack can be offered instead, one of it; one not carried is refused', () => {
    const potion = magic('potion_cure');
    const game = gameAt(level(altar('god_stub_01')), 2, 3, { ...bare, pack: [potion] });
    expect(game.offerAt(0, magic('ring_might'))).toMatchObject({ spent: false });
    rig(game, 3);
    expect(game.offerAt(0, potion)).toMatchObject({ spent: true });
    expect(game.state.player.pack).toEqual([]);
  });

  it('a Magic check: 4 or more is the blessing, 2 to 3 nothing, and a 1 leaves the player Cursed until lifted; each spends the offering', () => {
    const run = (roll: number) => {
      const game = gameAt(level(altar('god_stub_01')), 2, 3, { ...bare, coins: 50 });
      rig(game, roll);
      const r = game.offerAt(0, 'gold');
      return { game, r };
    };
    const good = run(5);
    expect(statusOf(good.game.state.player.statuses, 'blessed')).toMatchObject({ rounds: null, bound: true });
    const meh = run(3);
    expect(said(meh.r)).toContain('The altar does not answer.');
    expect(meh.game.state.player.statuses).toEqual([]);
    const bad = run(1);
    expect(statusOf(bad.game.state.player.statuses, 'cursed')).toMatchObject({ rounds: null });
    for (const g of [good, meh, bad]) expect(g.game.state.used.features[0]!.done).toBe(true);
    expect(good.game.act({ type: 'wait' })).toBeTruthy();
  });

  it('an altar takes one offering only', () => {
    const game = gameAt(level(altar('god_stub_01')), 2, 3, { ...bare, coins: 50 });
    rig(game, 5);
    game.offerAt(0, 'gold');
    const again = interact(game);
    expect(again).toMatchObject({ spent: false });
    expect(again.offer).toBeUndefined();
    expect(said(again)).toContain('The altar is silent.');
    expect(game.offerAt(0, 'gold')).toMatchObject({ spent: false });
    expect(game.state.player.coins).toBe(40);
  });

  it('the god gives its own blessing: Blessed until the player leaves the level, a curse lifted, or an item identified', () => {
    const blessed = gameAt(level(altar('god_stub_01')), 2, 3, { ...bare, coins: 50 });
    rig(blessed, 6);
    blessed.offerAt(0, 'gold');
    expect(hasStatus(blessed.state.player.statuses, 'blessed')).toBe(true);

    const ring = magic('ring_might', true) as WornItem;
    const lifted = gameAt(level(altar('god_stub_02')), 2, 3, { ...bare, coins: 50, equipment: { ring1: ring } });
    lifted.state.player.statuses.push({ id: 'cursed', rounds: null, clock: 0 });
    // Cursed gives disadvantage on the Magic check, so it takes two faces.
    rig(lifted, 6, 6);
    lifted.offerAt(0, 'gold');
    expect((lifted.state.player.equipment.ring1 as WornItem).cursed).toBe(false);
    expect(hasStatus(lifted.state.player.statuses, 'cursed')).toBe(false);

    const unknown = magic('ring_stealth', false) as WornItem;
    const known = gameAt(level(altar('god_stub_03')), 2, 3, { ...bare, coins: 50, pack: [unknown] });
    rig(known, 6);
    expect(isIdentified(unknown, known.state.player.known)).toBe(false);
    known.offerAt(0, 'gold');
    expect(isIdentified(unknown, known.state.player.known)).toBe(true);
  });

  it('a blessing from an altar ends when the player leaves the level', () => {
    const lvl = level(altar('god_stub_01'));
    const run = new Run(1, testPlayer({ ...bare, coins: 50 }), { startDepth: 1, levelFor: () => lvl, items: ITEMS, spells: SPELLS, content: CONTENT, villages: [0] });
    run.game!.state.map.player = { x: 2, y: 3 };
    rig(run.game!, 6);
    run.game!.offerAt(0, 'gold');
    expect(hasStatus(run.player.statuses, 'blessed')).toBe(true);
    run.travel('up');
    expect(hasStatus(run.player.statuses, 'blessed')).toBe(false);
  });

  it('the three altars of a shrine set: the third success grants the god\'s lasting buff', () => {
    const player = testPlayer({ ...bare, coins: 500 });
    const wins = [];
    for (let n = 0; n < 3; n++) {
      const game = new Game(1, level(altar('god_stub_02', { link: 'shrine_1' })), player, { items: ITEMS, content: CONTENT, spells: SPELLS, at: { x: 2, y: 3 } });
      rig(game, 6);
      wins.push(said(game.offerAt(0, 'gold')));
    }
    expect(player.shrines.shrine_1).toBe(3);
    expect(wins[0]).not.toContain('lasting gift');
    expect(wins[1]).not.toContain('lasting gift');
    expect(wins[2]).toContain('lasting gift');
    expect(player.buffs).toEqual([{ passive: 'melee', amount: 1 }]);
    expect(derive({}, false, player.buffs).melee).toBe(0); // bare hands -1, and the buff +1
  });

  it('a failed offering at a shrine altar does not count toward its set', () => {
    const player = testPlayer({ ...bare, coins: 500 });
    const game = new Game(1, level(altar('god_stub_02', { link: 'shrine_1' })), player, { items: ITEMS, content: CONTENT, spells: SPELLS, at: { x: 2, y: 3 } });
    rig(game, 3);
    game.offerAt(0, 'gold');
    expect(player.shrines.shrine_1).toBeUndefined();
  });
});

describe('Spec 06: sarcophagi', () => {
  const sarcophagus = (): Level => level(fixture('sarcophagus'), 20);
  const lift = (seed: number, roll: number) => {
    const game = new Game(seed, sarcophagus(), testPlayer({ ...bare, combatDice: 3, combatMax: 4 }), { items: ITEMS, content: CONTENT, spells: SPELLS, at: { x: 2, y: 3 } });
    rig(game, roll);
    return { game, result: interact(game) };
  };

  it('a Combat check: 4 or more lifts the lid and shows the treasure; it stays open', () => {
    const { game, result } = lift(1, 6);
    expect(result).toMatchObject({ spent: true, opened: 0 });
    expect(said(result)).toContain('the lid slides aside');
    expect(game.state.used.features[0]!.done).toBe(true);
    expect(game.state.used.features[0]!.left!.length).toBeGreaterThanOrEqual(1);
    const again = interact(game);
    expect(again).toMatchObject({ spent: false, opened: 0 });
  });

  it('2 to 3 the lid holds and can be tried again; a 1 crushes it down: a Combat die', () => {
    const held = lift(1, 3);
    expect(said(held.result)).toContain('The lid will not budge.');
    expect(held.game.state.used.features[0]?.done).toBeUndefined();
    expect(held.game.state.player.combatDice).toBe(3);
    const crushed = lift(1, 1);
    expect(crushed.game.state.player.combatDice).toBe(2);
    expect(crushed.game.state.used.features[0]?.done).toBeUndefined();
  });

  it('the treasure is jewelry about three times in four, else a gem, with a magic item now and then', () => {
    let jewelry = 0;
    let magicItems = 0;
    const n = 600;
    for (let seed = 0; seed < n; seed++) {
      const { game } = lift(seed, 6);
      const loot = game.state.used.features[0]!.left!;
      if (loot[0]!.kind === 'jewelry') jewelry++;
      if (loot.some((l) => l.kind === 'magic')) magicItems++;
    }
    expect(jewelry / n).toBeCloseTo(0.75, 1);
    expect(magicItems / n).toBeCloseTo(0.2, 1);
  });

  it('one time in three an undead rises beside it', () => {
    let rose = 0;
    const n = 600;
    for (let seed = 0; seed < n; seed++) {
      const { result } = lift(seed, 6);
      if (said(result).includes('A stub skeleton appears!')) rose++;
    }
    expect(rose / n).toBeCloseTo(1 / 3, 1);
  });

  it('the treasure can be taken from the list like a chest\'s', () => {
    const { game } = lift(3, 6);
    game.take(0, 'all');
    expect(game.state.player.pack.length + (game.state.player.coins > 0 ? 1 : 0)).toBeGreaterThanOrEqual(1);
    expect(said(interact(game))).toContain('empty');
  });
});

describe('Spec 06: magical runes', () => {
  const floorRune = (): Level => level(fixture('rune'));
  const onto = (seed: number, roll: number) => {
    const game = new Game(seed, floorRune(), testPlayer({ ...bare, combatDice: 3 }), { items: ITEMS, content: CONTENT, spells: SPELLS, at: { x: 2, y: 3 } });
    rig(game, roll);
    const result = game.act({ type: 'move', dx: 1, dy: 0 })!;
    return { game, result };
  };

  it('a floor rune is read by stepping on it: 4 or more gives a ward of 20 rounds, and the rune is spent', () => {
    const { game, result } = onto(1, 5);
    expect(said(result)).toContain('a ward settles over you');
    expect(game.state.player.shield).toBe(19); // 20, less the round it was given in
    expect(game.state.used.features[0]!.done).toBe(true);
    game.act({ type: 'move', dx: -1, dy: 0 });
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(game.state.player.shield).toBeLessThan(19); // nothing more from it
  });

  it('2 to 3 does nothing and the rune is not spent; a 1 discharges, by fire or a teleport, and spends it', () => {
    const meh = onto(1, 3);
    expect(meh.game.state.used.features[0]?.done).toBeUndefined();
    expect(meh.game.state.player.combatDice).toBe(3);
    const outcomes = new Set<string>();
    for (let seed = 0; seed < 80; seed++) {
      const { game } = onto(seed, 1);
      expect(game.state.used.features[0]!.done).toBe(true);
      outcomes.add(game.state.player.combatDice < 3 ? 'fire' : 'teleport');
    }
    expect([...outcomes].sort()).toEqual(['fire', 'teleport']);
  });

  describe('wall runes and the rune word', () => {
    const marks: LoreMark[] = [
      { x: 3, y: 0, kind: 'rune', id: 'rune_letter_k', text: 'K', link: 'rune_word_1', index: 0 },
      { x: 4, y: 0, kind: 'rune', id: 'rune_letter_e', text: 'E', link: 'rune_word_1', index: 1 },
    ];
    const wall = (): Level => ({ ...withThings(room(12, 5, 1, 1), { lore: marks }), depth: 5 });

    it('E reads a wall rune: a Magic check, 4 or more teaches its letter, kept in the journal; it is then spent', () => {
      const game = gameAt(wall(), 3, 1, bare);
      game.state.player.facing = { dx: 0, dy: -1 };
      rig(game, 5);
      const r = interact(game);
      expect(said(r)).toContain('The rune burns itself into your mind: K.');
      expect(game.state.player.letters).toEqual({ rune_word_1: { 0: 'K' } });
      expect(game.state.player.journal).toEqual([{ depth: 5, kind: 'rune', id: 'rune_letter_k@3,0', text: 'A rune of K.' }]);
      const again = interact(game);
      expect(said(again)).toBe('The rune is spent.');
      expect(again).toMatchObject({ spent: false });
    });

    it('2 to 3 does nothing and leaves it to try again; a 1 discharges and spends it', () => {
      const game = gameAt(wall(), 3, 1, bare);
      game.state.player.facing = { dx: 0, dy: -1 };
      rig(game, 3);
      expect(said(interact(game))).toContain('glows faintly');
      expect(game.state.used.marks).toEqual([]);
      rig(game, 1, 1);
      interact(game);
      expect(game.state.used.marks).toEqual([0]);
      expect(game.state.player.letters).toEqual({});
    });

    it('speaking the word at the marked altar needs every letter, and blesses the player until they leave the level', () => {
      const altarLevel: Level = { ...withThings(room(12, 5, 1, 1), { features: [fixture('altar', { link: 'rune_word_1' })], specials: [{ kind: 'rune_altar', x: 3, y: 3, link: 'rune_word_1', word: 'KE' }] }), depth: 5 };
      const game = gameAt(altarLevel, 2, 3, bare);
      expect(said(interact(game))).toContain('you know too few of them');
      game.state.player.letters.rune_word_1 = { 0: 'K' };
      expect(interact(game)).toMatchObject({ spent: false });
      game.state.player.letters.rune_word_1 = { 0: 'K', 1: 'E' };
      const spoken = interact(game);
      expect(spoken).toMatchObject({ spent: true });
      expect(said(spoken)).toContain('You speak "KE".');
      expect(statusOf(game.state.player.statuses, 'blessed')).toMatchObject({ bound: true });
      expect(said(interact(game))).toContain('the word has been spoken');
      // It is a rune altar, so it asks for no offering.
      expect(interact(game).offer).toBeUndefined();
    });
  });
});

describe('Spec 02 and 06: the teleporter, the lever and map fragments', () => {
  const a: Level = { ...withThings(room(12, 5, 1, 1), { specials: [{ kind: 'teleporter', x: 5, y: 3, to: 9 }] }), depth: 4 };
  const b: Level = { ...withThings(room(12, 5, 1, 1), { specials: [{ kind: 'teleporter', x: 8, y: 2, to: 4 }] }), depth: 9 };

  it('E on a teleporter takes the player to the paired level\'s teleporter, and back', () => {
    const levels: Record<number, Level> = { 4: a, 9: b };
    const run = new Run(1, testPlayer(bare), { startDepth: 4, levelFor: (d) => levels[d]!, villages: [0], items: ITEMS, spells: SPELLS, content: CONTENT });
    run.game!.state.map.player = { x: 5, y: 3 };
    const result = run.game!.act({ type: 'interact' })!;
    expect(result.teleport).toBe(9);
    run.teleport(result.teleport!);
    expect(run.depth).toBe(9);
    expect(run.game!.state.map.player).toEqual({ x: 8, y: 2 });
    const back = run.game!.act({ type: 'interact' })!;
    expect(back.teleport).toBe(4);
    run.teleport(back.teleport!);
    expect([run.depth, run.game!.state.map.player]).toEqual([4, { x: 5, y: 3 }]);
  });

  it('a pulled lever opens its level\'s down stair onto the landing of the collapsed passage', () => {
    const top: Level = { ...withThings(levelFrom(['##########', '#<......>#', '##########']), { specials: [{ kind: 'lever', x: 3, y: 1, link: 'passage_1', landingLevel: 9 }] }), depth: 4 };
    const next: Level = { ...levelFrom(['##########', '#<......>#', '##########']), depth: 5 };
    const landing: Level = { ...withThings(levelFrom(['##########', '#<.....>.#', '##########']), { specials: [{ kind: 'landing', x: 6, y: 1, link: 'passage_1' }] }), depth: 9 };
    const levels: Record<number, Level> = { 4: top, 5: next, 9: landing };
    const make = () => {
      const run = new Run(1, testPlayer(bare), { startDepth: 4, levelFor: (d) => levels[d]!, villages: [0], items: ITEMS, spells: SPELLS, content: CONTENT });
      return run;
    };
    const closed = make();
    closed.game!.state.map.player = { x: 7, y: 1 };
    closed.travel('down');
    expect(closed.depth).toBe(5);

    const run = make();
    const game = run.game!;
    game.state.map.player = { x: 2, y: 1 };
    game.state.player.facing = { dx: 1, dy: 0 };
    expect(game.act({ type: 'move', dx: 1, dy: 0 })).toMatchObject({ spent: false }); // the lever blocks the way
    const pulled = game.act({ type: 'interact' })!;
    expect(pulled.spent).toBe(true);
    expect(said(pulled)).toContain('a stair opens toward level 9');
    expect(said(game.act({ type: 'interact' })!)).toBe('The lever is already down.');
    game.state.map.player = { x: 8, y: 1 }; // the down stair
    run.travel('down');
    expect(run.depth).toBe(9);
    expect(run.game!.state.map.player).toEqual({ x: 6, y: 1 });
  });

  it('a map fragment maps a deeper level: its layout, secret doors and vault show on arrival', () => {
    const deep: Level = { ...withThings(room(16, 7, 1, 1), { doors: [{ x: 8, y: 0, kind: 'secret' }] }), depth: 7 };
    const other: Level = { ...room(16, 7, 1, 1), depth: 3 };
    const fragment: MapFragmentItem = { kind: 'map_fragment', uid: 1, id: 'map_fragment', name: 'map fragment', value: 0, link: 'map_1', mappedLevel: 7 };
    const levels: Record<number, Level> = { 2: { ...room(16, 7, 1, 1), depth: 2 }, 3: other, 7: deep };
    const run = new Run(1, testPlayer({ ...bare, pack: [fragment] }), { startDepth: 2, levelFor: (d) => levels[d]!, villages: [0], items: ITEMS, spells: SPELLS, content: CONTENT });
    const used = run.game!.use(fragment);
    expect(used.spent).toBe(true);
    expect(said(used)).toContain('The torn map shows the layout of level 7.');
    expect(run.player.pack).toEqual([]);
    expect(run.player.mapped).toEqual([7]);
    run.travel('down');
    expect(run.game!.state.map.exploration.explored.some((e) => e === 0)).toBe(true); // level 3 is not mapped
    const direct = new Game(1, deep, run.player, { items: ITEMS, content: CONTENT });
    expect(direct.state.map.exploration.explored.every((e) => e === 1)).toBe(true);
    expect(direct.state.revealed).toEqual([cell(deep, 8, 0)]);
  });

  it('a fragment used on the mapped level itself maps it at once', () => {
    const deep: Level = { ...room(16, 7, 1, 1), depth: 7 };
    const fragment: MapFragmentItem = { kind: 'map_fragment', uid: 1, id: 'map_fragment', name: 'map fragment', value: 0, link: 'map_1', mappedLevel: 7 };
    const game = gameOn(deep, { ...bare, pack: [fragment] });
    game.use(fragment);
    expect(game.state.map.exploration.explored.every((e) => e === 1)).toBe(true);
  });
});

describe('what the monsters do around fixtures', () => {
  it('a rival walks to the stair round an altar and does not loot it', () => {
    const lvl: Level = { ...withThings(levelFrom(['#########', '#<......#', '#.......#', '#......>#', '#########']), { features: [fixture('altar', { x: 3, y: 2 })] }) };
    const game = gameAt(lvl, 7, 1, { ...bare, combatDice: 6, combatMax: 6 });
    game.state.monsters.push(monsterAt(1, 1, { kind: 'rival', hostile: false, dice: 5, maxDice: 5, modifier: -6 }));
    for (let i = 0; i < 20; i++) game.act({ type: 'wait' });
    expect(game.state.monsters[0]!.carried).toEqual([]);
    expect(game.state.monsters[0]!.x).toBeGreaterThan(1);
  });
});
