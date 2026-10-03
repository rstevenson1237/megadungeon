import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game.ts';
import { chestLocked } from '../src/game/features/locks.ts';
import { contentsOf, listLines, summon } from '../src/game/features/index.ts';
import { isClear } from '../src/game/map-state.ts';
import { validTargets } from '../src/game/targeting.ts';
import { blinkCells } from '../src/game/magic.ts';
import { hasStatus } from '../src/rules/magic/status.ts';
import type { Feature, Level, Loot } from '../src/rules/world/level.ts';
import { CONTENT, ITEMS, appears, SPELLS, cell, gameOn, gear, keyItem, monsterAt, picksItem, rig, room, slingKit, spell, testPlayer, withThings } from './helpers.ts';

type Container = Extract<Feature, { type: 'container' }>;
const coins = (amount: number): Loot => ({ kind: 'coins', amount });
const gem: Loot = { kind: 'gem', id: 'gem_stub_ruby', name: 'ruby', value: 500 };
const chest = (contents: Loot[], extra: Partial<Container> = {}): Container => ({ type: 'container', kind: 'chest', x: 3, y: 3, contents, ...extra });
/** A room with the given features; tests put the player at (2,3) with `start`. A chest at (3,3) is east of them; they face south, so E finds it among the others. */
const level = (...features: Feature[]): Level => withThings(room(12, 5, 1, 1), { features });
/** A game with the player off the stair, at (2,3). */
const start = (lvl: Level, extra: Parameters<typeof gameOn>[1] = {}): Game => {
  const game = gameOn(lvl, extra);
  game.state.map.player = { x: 2, y: 3 };
  game.refreshSight();
  return game;
};
const bare = { pack: [], equipment: {}, coins: 0, combatDice: 4, combatMax: 4, skill: { step: 6 as const, dice: 2, max: 2 } };
const interact = (game: Game) => game.act({ type: 'interact' })!;
const said = (r: { messages: { text: string }[] }): string => r.messages.map((m) => m.text).join(' | ');

describe('Spec 06: opening a chest, sack or weapon rack', () => {
  it('E opens it for one round and shows the pick-up list; nothing is taken yet', () => {
    const game = start(level(chest([coins(50), gem])), bare);
    const result = interact(game);
    expect(result).toMatchObject({ spent: true, opened: 0 });
    expect(game.state.round).toBe(2);
    expect(said(result)).toContain('You open the chest.');
    expect(game.state.player.coins).toBe(0);
    expect(listLines(game, 0)).toEqual(['50 gp', 'ruby']);
  });

  it('taking from the list costs no round: one line, or everything that fits', () => {
    const game = start(level(chest([coins(50), gem, { kind: 'key' }])), bare);
    interact(game);
    const round = game.state.round;
    expect(game.take(0, 1)).toMatchObject({ spent: false });
    expect(game.state.player.pack.map((i) => i.kind)).toEqual(['gem']);
    expect(listLines(game, 0)).toEqual(['50 gp', 'key']);
    game.take(0, 'all');
    expect(game.state.player.coins).toBe(50);
    expect(game.state.player.pack.map((i) => i.kind)).toEqual(['gem', 'key']);
    expect(game.state.round).toBe(round);
    expect(game.state.looted.features).toEqual([0]);
  });

  it('a full pack takes what fits and leaves the rest in the container, which can be taken later', () => {
    const full = Array.from({ length: 12 }, () => gear('dagger'));
    const game = start(level(chest([gem, coins(30)])), { ...bare, pack: full });
    interact(game);
    const r = game.take(0, 'all');
    expect(said(r)).toContain('Your pack is full.');
    expect(game.state.player.pack).toHaveLength(12);
    expect(contentsOf(game, 0)).toHaveLength(2);
    expect(game.state.looted.features).toEqual([]);
    game.drop(full[0]!);
    game.take(0, 'all');
    expect(contentsOf(game, 0)).toEqual([coins(30)]); // the gem; the coins need a slot of their own and the dropped dagger's is gone? it took the gem
  });

  it('an opened container that was not emptied shows its list again for free; an emptied one is looted and says so', () => {
    const game = start(level(chest([coins(10), coins(20)])), bare);
    interact(game);
    game.take(0, 0);
    const again = interact(game);
    expect(again).toMatchObject({ spent: false, opened: 0 });
    game.take(0, 'all');
    const empty = interact(game);
    expect(said(empty)).toBe('It is empty.');
    expect(empty).toMatchObject({ spent: false });
  });

  it('sacks and weapon racks open the same way', () => {
    for (const kind of ['sack', 'rack'] as const) {
      const game = start(level(chest([coins(5)], { kind })), bare);
      expect(interact(game)).toMatchObject({ spent: true, opened: 0 });
      expect(said(game.act({ type: 'wait' })!)).not.toContain('empty');
    }
  });

  it('what is taken and what is left are part of the level delta', () => {
    const lvl = level(chest([coins(10), gem, { kind: 'key' }]));
    const game = start(lvl, bare);
    interact(game);
    game.take(0, 1);
    const back = new Game(1, lvl, game.state.player, { delta: game.captureDelta(), items: ITEMS, content: CONTENT });
    expect(contentsOf(back, 0)).toEqual([coins(10), { kind: 'key' }]);
    back.take(0, 'all');
    const again = new Game(1, lvl, back.state.player, { delta: back.captureDelta(), items: ITEMS, content: CONTENT });
    expect(again.state.looted.features).toEqual([0]);
    expect(contentsOf(again, 0)).toEqual([]);
  });

  it('a rival takes what is left in a container the player half emptied, and not what was taken', () => {
    const lvl = level(chest([coins(10), coins(20)]));
    const game = start(lvl, { ...bare, combatDice: 6, combatMax: 6 });
    interact(game);
    game.take(0, 0);
    const rival = monsterAt(4, 2, { kind: 'rival', hostile: false, awareness: 'unaware', dice: 5, maxDice: 5, modifier: -6 });
    game.state.monsters.push(rival);
    for (let i = 0; i < 4; i++) game.act({ type: 'wait' });
    expect(rival.carried).toEqual([coins(20)]);
    expect(game.state.looted.features).toEqual([0]);
  });
});

describe('Spec 06: containers and fixtures block movement but not sight or shots', () => {
  const things = (): Feature[] => [
    chest([]),
    { type: 'container', kind: 'pottery', x: 2, y: 4, contents: [] },
    { type: 'fixture', kind: 'fountain', x: 1, y: 3 },
    { type: 'fixture', kind: 'rune', x: 2, y: 2 },
    { type: 'debris', x: 3, y: 2 },
  ];

  it('the player cannot walk into a container or a fixture, for no round; debris and floor runes can be walked on', () => {
    const game = start(level(...things()), bare);
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0]] as const) {
      expect(game.act({ type: 'move', dx, dy }), `${dx},${dy}`).toMatchObject({ spent: false });
    }
    expect(game.state.map.player).toEqual({ x: 2, y: 3 });
    game.act({ type: 'move', dx: 0, dy: -1 }); // onto the rune
    expect(game.state.map.player).toEqual({ x: 2, y: 2 });
    game.act({ type: 'move', dx: 1, dy: 0 }); // onto the debris
    expect(game.state.map.player).toEqual({ x: 3, y: 2 });
  });

  it('they do not block sight or a clear line of fire', () => {
    const game = start(level(chest([])), { ...bare, ...slingKit(5) });
    expect(isClear(game.state.map, 3, 3)).toBe(true);
    const target = monsterAt(5, 3, { awareness: 'unaware', dice: 30, maxDice: 30, modifier: -6 });
    game.state.monsters.push(target);
    expect(game.state.map.visible[3 * game.state.map.level.width + 5]).toBe(1);
    expect(validTargets(game, 6)).toEqual([target]); // the chest is on the line, and does not stop it
    rig(game, 5);
    expect(game.fire(target)).toMatchObject({ spent: true });
    expect(target.dice).toBe(29);
  });

  it('a monster cannot walk through one, and Blink cannot land on one', () => {
    const lvl = level(chest([]));
    const game = start(lvl, { ...bare, spells: SPELLS.map((s) => s.id), magic: { step: 6, dice: 3, max: 3 } });
    const m = monsterAt(5, 3, { alert: true, dice: 30, maxDice: 30, modifier: -6 });
    game.state.monsters.push(m);
    for (let i = 0; i < 6; i++) game.act({ type: 'wait' });
    expect(m).not.toMatchObject({ x: 3, y: 3 });
    expect(blinkCells(game, spell('blink')).some((c) => c.x === 3 && c.y === 3)).toBe(false);
  });
});

describe('Spec 06: pottery', () => {
  const pot = (contents: Loot[]): Container => ({ type: 'container', kind: 'pottery', x: 3, y: 3, contents });

  it('E smashes it: the contents spill on its cell, it can be walked over and shows dimmed', () => {
    const game = start(level(pot([coins(8)])), bare);
    expect(said(interact(game))).toContain('You smash the pot.');
    expect(game.state.drops).toEqual([{ x: 3, y: 3, contents: [coins(8)] }]);
    expect(game.state.looted.features).toEqual([0]);
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(game.state.map.player).toEqual({ x: 3, y: 3 });
    expect(game.act({ type: 'pickup' })).toMatchObject({ spent: true });
    expect(game.state.player.coins).toBe(8);
  });

  it('an empty pot just breaks, and a smashed pot is part of the level delta', () => {
    const lvl = level(pot([]));
    const game = start(lvl, bare);
    expect(said(interact(game))).toContain('It is empty.');
    const back = new Game(1, lvl, game.state.player, { delta: game.captureDelta(), items: ITEMS, content: CONTENT, at: { x: 2, y: 3 } });
    back.act({ type: 'move', dx: 1, dy: 0 });
    expect(back.state.map.player).toEqual({ x: 3, y: 3 });
  });

  it('the noise alerts unaware creatures within 4 cells, and no others', () => {
    const game = start(level(pot([])), bare);
    const near = monsterAt(7, 3, { awareness: 'unaware', dice: 30, maxDice: 30, modifier: -6 }); // 4 from the pot
    const far = monsterAt(8, 3, { awareness: 'unaware', dice: 30, maxDice: 30, modifier: -6 });
    const asleep = monsterAt(4, 4, { awareness: 'asleep', dice: 30, maxDice: 30, modifier: -6 });
    game.state.monsters.push(near, far, asleep);
    rig(game, 4, 1, 1, 1);
    interact(game);
    expect([near.awareness, far.awareness, asleep.awareness]).toEqual(['alert', 'unaware', 'asleep']);
  });

  it('about 1 pot in 8 releases vermin: a rat or the weakest creature of the depth table', () => {
    let released = 0;
    for (let seed = 0; seed < 800; seed++) {
      const game = new Game(seed, level(pot([])), testPlayer(bare), { items: ITEMS, content: CONTENT, spells: SPELLS });
      game.state.map.player = { x: 2, y: 3 };
      if (appears(said(interact(game)), 'vermin')) released++;
    }
    expect(released / 800).toBeCloseTo(1 / 8, 1);
  });
});

describe('Spec 06: trapped containers', () => {
  const trapped = (trap: string, extra: Partial<Container> = {}): Level => level(chest([coins(10)], { trap, ...extra }));
  const found = (game: Game) => game.state.revealed.push(cell(game.state.map.level, 3, 3));

  it('opening one whose trap is not found springs it, then opens it', () => {
    const game = start(trapped('trap_poison_needle'), bare);
    const result = interact(game);
    expect(hasStatus(game.state.player.statuses, 'poisoned')).toBe(true);
    expect(said(result)).toContain('You set off a poison needle!');
    expect(said(result)).toContain('You open the chest.');
    expect(result.opened).toBe(0);
    expect(game.state.used.features[0]!.trapGone).toBe(true);
  });

  it('a fire burst costs a Combat die; an alarm rouses the level; a summoning brings a creature beside the chest', () => {
    const fire = start(trapped('trap_fire_burst'), bare);
    interact(fire);
    expect(fire.state.player.pools.combat.dice).toBe(3);

    const alarm = start(trapped('trap_container_alarm'), bare);
    const sleeper = monsterAt(9, 1, { awareness: 'asleep', dice: 1, maxDice: 1, modifier: 0 });
    alarm.state.monsters.push(sleeper);
    interact(alarm);
    expect(sleeper.awareness).toBe('alert');

    const summoning = start(trapped('trap_summoning'), bare);
    expect(said(interact(summoning))).toMatch(/A [\w -]+ appears!/);
    expect(summoning.state.monsters).toHaveLength(1);
    expect(summoning.state.monsters[0]!.awareness).toBe('alert');
    // Where it appears: beside the chest, before it moves.
    const direct = start(trapped('trap_summoning'), bare);
    const m = summon(direct, { x: 3, y: 3 }, []);
    expect(Math.abs(m!.x - 3) + Math.abs(m!.y - 3)).toBe(1);
  });

  it('a trap found by searching is disarmed first with E: 4 or more removes it, and the next E opens the chest', () => {
    const game = start(trapped('trap_poison_needle'), bare);
    found(game);
    rig(game, 5);
    const first = interact(game);
    expect(first).toMatchObject({ spent: true });
    expect(first.opened).toBeUndefined();
    expect(said(first)).toContain('You disarm the poison needle.');
    expect(game.state.used.features[0]!.trapGone).toBe(true);
    expect(hasStatus(game.state.player.statuses, 'poisoned')).toBe(false);
    expect(interact(game).opened).toBe(0);
    expect(hasStatus(game.state.player.statuses, 'poisoned')).toBe(false);
  });

  it('2 to 3 fails safely and the trap stays; a 1 springs it', () => {
    const game = start(trapped('trap_poison_needle'), bare);
    found(game);
    rig(game, 3);
    expect(said(interact(game))).toContain('You fail to disarm the poison needle, but nothing happens.');
    expect(game.state.used.features[0]?.trapGone).toBeUndefined();
    expect(hasStatus(game.state.player.statuses, 'poisoned')).toBe(false);
    rig(game, 1);
    interact(game);
    expect(hasStatus(game.state.player.statuses, 'poisoned')).toBe(true);
    expect(game.state.used.features[0]!.trapGone).toBe(true);
  });
});

describe('Spec 06: locked chests are opened as doors are', () => {
  /** A level of many chests, and the index of one that is locked and one that is not. */
  const many = (): { level: Level; locked: number; plain: number } => {
    const features: Feature[] = Array.from({ length: 12 }, (_, i) => ({ type: 'container', kind: 'chest', x: 3 + i, y: 3, contents: [coins(5)] }) as Feature);
    const lvl = withThings(room(16, 5, 1, 1), { features });
    const probe = gameOn(lvl);
    return { level: lvl, locked: features.findIndex((_, i) => chestLocked(probe, i)), plain: features.findIndex((_, i) => !chestLocked(probe, i)) };
  };
  /** A player standing west of chest `i`, facing it. */
  const at = (level: Level, i: number, pack: Parameters<typeof gameOn>[1]) => {
    const game = gameOn(level, { ...bare, ...pack });
    game.state.map.player = { x: 2 + i, y: 3 };
    game.refreshSight();
    game.state.player.facing = { dx: 1, dy: 0 };
    return game;
  };

  it('there is a locked chest and a plain one on this seed', () => {
    const { locked, plain } = many();
    expect(locked).toBeGreaterThanOrEqual(0);
    expect(plain).toBeGreaterThanOrEqual(0);
  });

  it('a key opens it in one action and is used up; the chest then stays unlocked', () => {
    const { level: lvl, locked } = many();
    const game = at(lvl, locked, { pack: [keyItem()] });
    const result = interact(game);
    expect(result).toMatchObject({ spent: true, opened: locked });
    expect(game.state.player.pack).toEqual([]);
    expect(chestLocked(game, locked)).toBe(false);
  });

  it('lockpicks and force work too; a failed try leaves it locked and the round spent', () => {
    const { level: lvl, locked } = many();
    const picks = at(lvl, locked, { pack: [picksItem(2)] });
    rig(picks, 3);
    expect(interact(picks)).toMatchObject({ spent: true });
    expect(chestLocked(picks, locked)).toBe(true);
    rig(picks, 5);
    expect(interact(picks)).toMatchObject({ spent: true, opened: locked });

    const forced = at(lvl, locked, { pack: [] });
    rig(forced, 6);
    expect(interact(forced)).toMatchObject({ spent: true, opened: locked });
    const strained = at(lvl, locked, { pack: [] });
    rig(strained, 1);
    interact(strained);
    expect(strained.state.player.pools.combat.dice).toBe(3);
    expect(chestLocked(strained, locked)).toBe(true);
  });

  it('forcing a chest makes noise, and a plain chest is just opened', () => {
    const { level: lvl, locked, plain } = many();
    const game = at(lvl, locked, { pack: [] });
    const m = monsterAt(9, 2, { awareness: 'unaware', dice: 30, maxDice: 30, modifier: -6 });
    game.state.monsters.push(m);
    rig(game, 3, 1, 1);
    interact(game);
    expect(m.awareness).toBe('alert');
    expect(interact(at(lvl, plain, { pack: [] })).opened).toBe(plain);
  });

  it('magic and gear in a chest come out as items with their disguises', () => {
    const lvl = level(chest([{ kind: 'magic', id: 'wand_sleep', name: 'Wand of Sleep' }]));
    const game = start(lvl, bare);
    interact(game);
    expect(listLines(game, 0)).toEqual([`${game.disguises.get('wand_sleep')} wand`]);
  });
});
