import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game.ts';
import { chestLocked, LOCKED_CHEST_ONE_IN } from '../src/game/features/locks.ts';
import type { Level } from '../src/rules/world/level.ts';
import { applyStatus } from '../src/rules/magic/status.ts';
import { CONTENT, ITEMS, SPELLS, cell, gameOn, keyItem, levelFrom, magic, monsterAt, picksItem, rig, testPlayer, vaultKeyItem, withThings } from './helpers.ts';

const rows = ['###########', '#<..+.....#', '###########'];
const doorLevel = (kind: 'locked' | 'sealed' | 'normal' | 'secret' = 'locked', extra: Partial<Level> = {}): Level => withThings(levelFrom(rows), { doors: [{ x: 4, y: 1, kind }], ...extra });
const step = (game: Game, n = 1, dx = 1) => {
  for (let i = 0; i < n; i++) game.act({ type: 'move', dx, dy: 0 });
};
const interact = (game: Game) => game.act({ type: 'interact' })!;
const open = (game: Game) => game.state.map.openDoors.includes(1 * game.state.map.level.width + 4);
const stack = (game: Game, kind: string) => game.state.player.pack.find((i) => i.kind === kind) as { count: number } | undefined;
/** A player beside the door at (3,1) facing it, carrying `pack`. */
const beside = (pack: Parameters<typeof gameOn>[1], level = doorLevel()) => {
  const game = gameOn(level, { combatDice: 4, combatMax: 4, skill: { step: 6, dice: 2, max: 2 }, equipment: {}, ...pack });
  step(game, 2);
  return game;
};

describe('Spec 06: doors', () => {
  it('a normal door opens when moved into, and costs the move', () => {
    const game = beside({ pack: [] }, doorLevel('normal'));
    expect(game.act({ type: 'move', dx: 1, dy: 0 })).toMatchObject({ spent: true });
    expect(open(game)).toBe(true);
    expect(game.state.map.player).toEqual({ x: 3, y: 1 });
  });

  it('a locked door with no key stays shut and says so, for no round', () => {
    const game = beside({ pack: [] });
    const round = game.state.round;
    const result = game.act({ type: 'move', dx: 1, dy: 0 })!;
    expect(result).toMatchObject({ spent: false });
    expect(result.messages.map((m) => m.text)).toEqual(['The door is locked.']);
    expect(open(game)).toBe(false);
    expect(game.state.round).toBe(round);
  });

  it('moving into it with a key opens it for the move, and the key is consumed', () => {
    const game = beside({ pack: [keyItem(2)] });
    const result = game.act({ type: 'move', dx: 1, dy: 0 })!;
    expect(result.spent).toBe(true);
    expect(open(game)).toBe(true);
    expect(stack(game, 'key')!.count).toBe(1);
    expect(game.act({ type: 'move', dx: 1, dy: 0 })).toMatchObject({ spent: true });
    expect(game.state.map.player).toEqual({ x: 4, y: 1 }); // and it can be walked through
  });

  it('the last key goes with the stack', () => {
    const game = beside({ pack: [keyItem(1)] });
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(game.state.player.pack).toEqual([]);
  });

  it('a monster never opens a locked door', () => {
    const game = gameOn(doorLevel(), { combatDice: 6, combatMax: 6 });
    const m = monsterAt(6, 1, { alert: true, dice: 30, maxDice: 30, modifier: -6 });
    game.state.monsters.push(m);
    for (let i = 0; i < 8; i++) game.act({ type: 'wait' });
    expect(m.x).toBeGreaterThan(4);
    expect(open(game)).toBe(false);
  });

  it('E closes an open door; closing is an interact action', () => {
    const game = beside({ pack: [keyItem()] });
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(interact(game)).toMatchObject({ spent: true });
    expect(open(game)).toBe(false);
  });
});

describe('Spec 06: picking a lock', () => {
  it('E with lockpicks is a Skill check: 4 or more opens the door and keeps the picks', () => {
    const game = beside({ pack: [picksItem(3)] });
    rig(game, 5);
    const result = interact(game);
    expect(result.spent).toBe(true);
    expect(open(game)).toBe(true);
    expect(stack(game, 'lockpicks')!.count).toBe(3);
    expect(game.state.player.pools.skill.dice).toBe(2); // a check costs no die
  });

  it('2 to 3 fails and leaves the door to try again', () => {
    const game = beside({ pack: [picksItem(3)] });
    rig(game, 3);
    expect(interact(game).messages.map((m) => m.text)).toContain('The lock holds.');
    expect(open(game)).toBe(false);
    expect(stack(game, 'lockpicks')!.count).toBe(3);
    rig(game, 4);
    interact(game);
    expect(open(game)).toBe(true);
  });

  it('a 1 breaks one lockpick, and the last one takes the bundle with it', () => {
    const game = beside({ pack: [picksItem(2)] });
    rig(game, 1);
    const said = interact(game).messages.map((m) => m.text);
    expect(said).toContain('A lockpick snaps in the lock.');
    expect(stack(game, 'lockpicks')!.count).toBe(1);
    rig(game, 1);
    interact(game);
    expect(game.state.player.pack).toEqual([]);
    expect(open(game)).toBe(false);
  });

  it('Gloves of Finesse give advantage on lockpicking; Blessed and Cursed apply', () => {
    const run = (equipment: NonNullable<Parameters<typeof gameOn>[1]>['equipment'], status?: 'blessed' | 'cursed') => {
      const game = beside({ pack: [picksItem(3)], equipment });
      if (status) applyStatus(game.state.player.statuses, status, null);
      rig(game, 1, 6);
      interact(game);
      return open(game);
    };
    expect(run({})).toBe(false);
    expect(run({ gloves: magic('gloves_finesse', false) })).toBe(true);
    expect(run({}, 'blessed')).toBe(true);
    expect(run({ gloves: magic('gloves_finesse', true) })).toBe(false);
  });

  it('picks come first: with picks and a key, E picks, and the key is kept', () => {
    const game = beside({ pack: [keyItem(), picksItem(2)] });
    rig(game, 6);
    interact(game);
    expect(open(game)).toBe(true);
    expect(stack(game, 'key')!.count).toBe(1);
  });

  it('with a key and no picks, E uses the key', () => {
    const game = beside({ pack: [keyItem()] });
    interact(game);
    expect(open(game)).toBe(true);
    expect(game.state.player.pack).toEqual([]);
  });
});

describe('Spec 06: forcing a lock', () => {
  it('E with no key and no picks is a Combat check: 4 or more breaks it open for good, and it cannot be closed', () => {
    const game = beside({ pack: [] });
    rig(game, 5);
    interact(game);
    expect(open(game)).toBe(true);
    expect(game.state.used.broken).toEqual([cell(game.state.map.level, 4, 1)]);
    game.act({ type: 'move', dx: 1, dy: 0 });
    game.act({ type: 'move', dx: -1, dy: 0 });
    expect(interact(game).messages.map((m) => m.text)).toContain('The door is broken and will not close.');
    expect(open(game)).toBe(true);
  });

  it('2 to 3 and 1 leave it shut; a 1 costs a Combat die', () => {
    const game = beside({ pack: [] });
    rig(game, 3);
    interact(game);
    expect(open(game)).toBe(false);
    expect(game.state.player.pools.combat.dice).toBe(4);
    rig(game, 1);
    const said = interact(game).messages.map((m) => m.text);
    expect(open(game)).toBe(false);
    expect(game.state.player.pools.combat.dice).toBe(3);
    expect(said.join(' ')).toContain('The strain tears something in you');
  });

  it('every attempt, success or not, alerts unaware creatures within 6 cells and no others', () => {
    const near = monsterAt(9, 1, { awareness: 'unaware', dice: 30, maxDice: 30, modifier: -6 }); // 6 cells from (3,1)
    const far = monsterAt(10, 1, { awareness: 'unaware', dice: 30, maxDice: 30, modifier: -6 }); // 7 cells
    const asleep = monsterAt(5, 1, { awareness: 'asleep', dice: 30, maxDice: 30, modifier: -6 });
    for (const roll of [3, 6]) {
      const game = beside({ pack: [] });
      game.state.monsters.push(near, far, asleep);
      near.awareness = far.awareness = 'unaware';
      asleep.awareness = 'asleep';
      rig(game, roll, 1, 1, 1);
      interact(game);
      expect(near.awareness, `roll ${roll}`).toBe('alert');
      expect(far.awareness, `roll ${roll}`).toBe('unaware');
      expect(asleep.awareness, `roll ${roll}`).toBe('asleep');
    }
  });

  it('uses the Combat die and its step, so a better fighter forces more often', () => {
    const rate = (step: 4 | 12) => {
      let opened = 0;
      for (let seed = 0; seed < 400; seed++) {
        const game = new Game(seed, doorLevel(), testPlayer({ combatStep: step, combatDice: 3, combatMax: 3, pack: [], equipment: {} }), { items: ITEMS, content: CONTENT, spells: SPELLS });
        game.state.map.player = { x: 3, y: 1 };
        game.state.player.facing = { dx: 1, dy: 0 };
        interact(game);
        if (open(game)) opened++;
      }
      return opened / 400;
    };
    expect(rate(4)).toBeCloseTo(0.25, 1); // d4: 4 only
    expect(rate(12)).toBeCloseTo(0.75, 1);
  });
});

describe('Spec 06: sealed vault doors', () => {
  const vaultLevel = (): Level => withThings(doorLevel('sealed'), { specials: [{ kind: 'vault', x: 7, y: 1, link: 'vault_1', name: 'the Last Treasury', room: { x: 5, y: 1, w: 5, h: 1 } }] });

  it('open only to the vault key that names their vault, and the key is used up', () => {
    const game = beside({ pack: [vaultKeyItem('vault_1'), keyItem()] }, vaultLevel());
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(open(game)).toBe(true);
    expect(game.state.player.pack).toHaveLength(1); // the plain key is left
    expect(game.state.player.pack[0]!.kind).toBe('key');
  });

  it('a generic key, picks and force do nothing to them, and E says so with no round spent', () => {
    const game = beside({ pack: [keyItem(), picksItem(3)] }, vaultLevel());
    const walk = game.act({ type: 'move', dx: 1, dy: 0 })!;
    expect(walk).toMatchObject({ spent: false });
    expect(walk.messages.map((m) => m.text)).toEqual(['The door is sealed. Only its own key will open it.']);
    const e = interact(game);
    expect(e).toMatchObject({ spent: false });
    expect(e.messages[0]!.text).toContain('cannot be picked or forced');
    expect(open(game)).toBe(false);
    expect(stack(game, 'key')!.count).toBe(1);
  });

  it('a key to another vault does not open it', () => {
    const game = beside({ pack: [vaultKeyItem('vault_2')] }, vaultLevel());
    expect(game.act({ type: 'move', dx: 1, dy: 0 })).toMatchObject({ spent: false });
    expect(open(game)).toBe(false);
  });

  it('E opens it with the right key', () => {
    const game = beside({ pack: [vaultKeyItem('vault_1')] }, vaultLevel());
    expect(interact(game)).toMatchObject({ spent: true });
    expect(open(game)).toBe(true);
  });
});

describe('Spec 06: locked chests', () => {
  const chests = (n: number): Level => withThings(levelFrom(['#'.repeat(30), `#<${'.'.repeat(27)}#`, `#${'.'.repeat(28)}#`, '#'.repeat(30)]), {
    features: Array.from({ length: n }, (_, i) => ({ type: 'container' as const, kind: 'chest' as const, x: 2 + i, y: 2, contents: [] })),
  });

  it('about 1 plain chest in 4 is locked, fixed by the run seed', () => {
    let locked = 0;
    let total = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const game = new Game(seed, chests(25), testPlayer(), { items: ITEMS, content: CONTENT });
      for (let i = 0; i < 25; i++) {
        total++;
        if (chestLocked(game, i)) locked++;
      }
    }
    expect(LOCKED_CHEST_ONE_IN).toBe(4);
    expect(locked / total).toBeGreaterThan(0.2);
    expect(locked / total).toBeLessThan(0.3);
    const a = gameOn(chests(25));
    expect([...Array(25).keys()].map((i) => chestLocked(a, i))).toEqual([...Array(25).keys()].map((i) => chestLocked(gameOn(chests(25)), i)));
  });

  it('vault, cache and stash chests (those with a link), racks and sacks are never locked', () => {
    const lvl = withThings(levelFrom(['#'.repeat(30), `#<${'.'.repeat(27)}#`, `#${'.'.repeat(28)}#`, '#'.repeat(30)]), {
      features: Array.from({ length: 60 }, (_, i) => ({ type: 'container' as const, kind: i % 3 === 0 ? ('chest' as const) : i % 3 === 1 ? ('sack' as const) : ('rack' as const), x: 2 + (i % 27), y: 2, contents: [], ...(i % 3 === 0 ? { link: 'vault_1' } : {}) })),
    });
    const game = gameOn(lvl);
    for (let i = 0; i < 60; i++) expect(chestLocked(game, i), `${i}`).toBe(false);
  });
});
