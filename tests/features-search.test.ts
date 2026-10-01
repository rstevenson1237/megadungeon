import { describe, expect, it } from 'vitest';
import type { Rng } from '../src/core/rng.ts';
import { Game } from '../src/game/game.ts';
import { hiddenNear } from '../src/game/features/index.ts';
import { applyStatus } from '../src/rules/magic/status.ts';
import type { Level } from '../src/rules/world/level.ts';
import { CONTENT, ITEMS, SPELLS, cell, gameOn, magic, rig, room, testPlayer, withThings } from './helpers.ts';

const left = (game: Game): number => ((game.rng as Rng & { queue?: number[] }).queue ?? []).length;
const search = (game: Game) => game.act({ type: 'search' })!;
const texts = (r: { messages: { text: string }[] }): string[] => r.messages.map((m) => m.text);

/** A room around a player at (5,5) with one hidden thing of each kind among the 8 cells. */
const hidden = (): Level =>
  withThings(room(12, 9, 5, 5), {
    traps: [{ x: 4, y: 4, id: 'trap_dart' }, { x: 9, y: 9, id: 'trap_pit' }],
    features: [
      { type: 'container', kind: 'chest', x: 6, y: 5, contents: [], trap: 'trap_poison_needle' },
      { type: 'debris', x: 5, y: 6 },
    ],
    doors: [{ x: 5, y: 0, kind: 'secret' }],
  });

describe('Spec 06: searching', () => {
  it('is one round, and rolls one Skill check for each hidden thing in the 8 cells around, not beyond', () => {
    const game = gameOn(hidden(), { skill: { step: 6, dice: 2, max: 2 } });
    const things = hiddenNear(game, game.state.map.player);
    expect(things.map((t) => t.kind).sort()).toEqual(['container_trap', 'debris', 'floor_trap']); // the far trap and the far door are out of reach
    rig(game, 4, 4, 4, 5, 5); // three checks, and two more faces that must not be used
    const result = search(game);
    expect(result.spent).toBe(true);
    expect(game.state.round).toBe(2);
    expect(left(game)).toBe(2); // exactly three rolls were made
  });

  it('a 4 or more finds a trap, a container trap and a secret door, and they stay found', () => {
    const level = hidden();
    const game = gameOn({ ...level, doors: [{ x: 5, y: 4, kind: 'secret' }] }, { skill: { step: 6, dice: 2, max: 2 } });
    rig(game, 6, 6, 6, 6);
    const said = texts(search(game));
    expect(said).toEqual(expect.arrayContaining(['You find a trap.', 'You find a trap on a container.', 'You find a secret door.']));
    expect(game.state.revealed.sort()).toEqual([cell(level, 4, 4), cell(level, 5, 4), cell(level, 6, 5)].sort());
    // Found for good: it is part of the level delta.
    const back = new Game(1, level, game.state.player, { delta: game.captureDelta(), items: ITEMS, content: CONTENT });
    expect(back.state.revealed).toEqual(game.state.revealed);
    // The fourth roll went to the debris, so a second search has nothing left to look at.
    expect(game.state.used.searched).toEqual([cell(level, 5, 6)]);
    expect(hiddenNear(game, game.state.map.player)).toEqual([]);
  });

  it('a 2 to 3 or a 1 finds nothing, and leaves it to try again; a failed check costs no die', () => {
    const game = gameOn(hidden(), { skill: { step: 6, dice: 2, max: 2 } });
    rig(game, 3, 2, 3);
    const said = texts(search(game));
    expect(said).toContain('You search and find nothing.');
    expect(game.state.revealed).toEqual([]);
    expect(game.state.player.skill.dice).toBe(2);
    expect(hiddenNear(game, game.state.map.player)).toHaveLength(3);
  });

  it('with nothing hidden near, it says so and still takes the round', () => {
    const game = gameOn(room(8, 5, 3, 3));
    const result = search(game);
    expect(texts(result)).toEqual(['You search and find nothing.']);
    expect(result.spent).toBe(true);
  });

  it('a Ring of Searching gives advantage; Blessed and Cursed apply; an advantage and a disadvantage cancel', () => {
    const run = (extra: Parameters<typeof gameOn>[1], statuses: ('blessed' | 'cursed')[] = []) => {
      const level = withThings(room(8, 5, 3, 3), { traps: [{ x: 4, y: 3, id: 'trap_dart' }] });
      const game = gameOn(level, { skill: { step: 6, dice: 2, max: 2 }, ...extra });
      for (const s of statuses) applyStatus(game.state.player.statuses, s, null);
      rig(game, 1, 6); // keeps 6 with advantage, the first die (a 1) otherwise, the lower (1) with disadvantage
      search(game);
      return game.state.revealed.length === 1;
    };
    expect(run({})).toBe(false);
    expect(run({ equipment: { ring1: magic('ring_searching', false) }, pack: [] })).toBe(true);
    expect(run({}, ['blessed'])).toBe(true);
    expect(run({}, ['cursed'])).toBe(false);
    expect(run({ equipment: { ring1: magic('ring_searching', false) }, pack: [] }, ['cursed'])).toBe(false); // advantage and disadvantage cancel: the first die, a 1
    expect(run({ equipment: { ring1: magic('ring_searching', true) }, pack: [] })).toBe(false);
  });

  it('an empty Skill pool rolls with disadvantage and nothing more is lost', () => {
    const level = withThings(room(8, 5, 3, 3), { traps: [{ x: 4, y: 3, id: 'trap_dart' }] });
    const game = gameOn(level, { skill: { step: 6, dice: 0, max: 2 } });
    rig(game, 6, 1);
    search(game);
    expect(game.state.revealed).toEqual([]);
    expect(game.state.player.skill.dice).toBe(0);
  });

  it('a 1 on any check triggers the Search negative effect once, not once per hidden thing', () => {
    const game = gameOn(hidden(), { skill: { step: 6, dice: 2, max: 2 } });
    const before = game.state.monsters.length;
    rig(game, 1, 1, 1);
    const said = texts(search(game));
    expect(game.state.monsters.length).toBe(before + 1);
    expect(said.filter((t) => t.includes('Something stirs')).length).toBe(1);
  });
});

describe('Spec 06: passive notice', () => {
  const trapLevel = () => withThings(room(12, 5, 2, 3), { traps: [{ x: 6, y: 3, id: 'trap_dart' }], doors: [{ x: 5, y: 0, kind: 'secret' }] });
  const step = (game: Game, dx: number) => game.act({ type: 'move', dx, dy: 0 })!;

  it('the first time a step ends beside a hidden trap it gets one free Skill check with disadvantage', () => {
    const level = trapLevel();
    const game = gameOn(level, { skill: { step: 6, dice: 2, max: 2 } });
    step(game, 1);
    step(game, 1);
    rig(game, 6, 1); // disadvantage keeps the lower die, so a 6 and a 1 is a 1
    step(game, 1); // (5,3) is next to the trap at (6,3)
    expect(game.state.revealed).toEqual([]);
    expect(game.state.used.noticed).toContain(cell(level, 6, 3));
    // Stepping away and back does not roll again.
    rig(game, 6, 6);
    step(game, -1);
    step(game, 1);
    expect(game.state.revealed).toEqual([]);
    expect(left(game)).toBe(2);
  });

  it('notices on a 4 or more, with two dice kept low, and is found for good', () => {
    const level = trapLevel();
    const game = gameOn(level, { skill: { step: 6, dice: 2, max: 2 } });
    step(game, 1);
    step(game, 1);
    rig(game, 5, 6);
    const said = texts(step(game, 1));
    expect(said).toContain('You find a trap.');
    expect(game.state.revealed).toEqual([cell(level, 6, 3)]);
  });

  it('never triggers a negative effect, even on a 1', () => {
    const game = gameOn(trapLevel(), { skill: { step: 6, dice: 2, max: 2 } });
    step(game, 1);
    step(game, 1);
    const before = game.state.monsters.length;
    rig(game, 1, 1);
    step(game, 1);
    expect(game.state.monsters.length).toBe(before);
  });

  it('fires once per hidden thing: a trap and a secret door each get their own free check', () => {
    const level = withThings(room(12, 5, 5, 2), { traps: [{ x: 6, y: 2, id: 'trap_dart' }], doors: [{ x: 5, y: 0, kind: 'secret' }] });
    const game = gameOn(level, { skill: { step: 6, dice: 2, max: 2 } });
    rig(game, 1, 1, 1, 1, 1, 1);
    step(game, 0);
    game.act({ type: 'move', dx: 0, dy: 1 }); // to (5,3): beside the trap (6,2) only
    expect(game.state.used.noticed).toEqual([cell(level, 6, 2)]);
    game.act({ type: 'move', dx: 0, dy: -1 }); // back to (5,2): beside the trap and the door at (5,0)? no, 2 away
    game.act({ type: 'move', dx: 0, dy: -1 }); // (5,1): beside the door
    expect(game.state.used.noticed).toEqual([cell(level, 6, 2), cell(level, 5, 0)]);
  });

  it('debris is not found by noticing, only by searching', () => {
    const level = withThings(room(12, 5, 2, 3), { features: [{ type: 'debris', x: 4, y: 3 }] });
    const game = gameOn(level);
    step(game, 1);
    expect(game.state.used.noticed).toEqual([]);
  });
});

describe('Spec 06: debris', () => {
  const level = () => withThings(room(12, 5, 5, 3), { features: [{ type: 'debris', x: 6, y: 3 }] });

  it('a successful search turns up one thing from the small table, and the debris is then spent', () => {
    const game = gameOn(level(), { skill: { step: 6, dice: 2, max: 2 }, pack: [], coins: 0 });
    rig(game, 6);
    const said = texts(search(game));
    expect(said.some((t) => t.startsWith('In the debris you find'))).toBe(true);
    expect(game.state.used.searched).toEqual([cell(level(), 6, 3)]);
    expect(search(game).messages.map((m) => m.text)).toEqual(['You search and find nothing.']); // spent
  });

  it('a failed search leaves it to try again', () => {
    const game = gameOn(level(), { skill: { step: 6, dice: 2, max: 2 } });
    rig(game, 3);
    search(game);
    expect(game.state.used.searched).toEqual([]);
    expect(hiddenNear(game, game.state.map.player).map((t) => t.kind)).toEqual(['debris']);
  });

  it('coin finds are scaled by depth: the same table row pays 10 times as much on level 10', () => {
    const only = { ...CONTENT, debris: CONTENT.debris.filter((d) => d.id === 'debris_coins_few') };
    const coins = (depth: number) => {
      const lvl = { ...level(), depth };
      const game = gameOn(lvl, { skill: { step: 6, dice: 2, max: 2 }, pack: [], coins: 0 }, { content: only });
      rig(game, 6, 1, 1); // the check, then the table pick and the amount
      search(game);
      return game.state.player.coins;
    };
    expect(coins(1)).toBeGreaterThanOrEqual(1);
    expect(coins(10)).toBeGreaterThanOrEqual(10);
    expect(coins(10) % 10).toBe(0);
    expect(coins(10)).toBeGreaterThan(coins(1));
  });

  it('an item find goes to the pack, or to the floor when the pack is full', () => {
    const only = { ...CONTENT, debris: CONTENT.debris.filter((d) => d.id === 'debris_lockpicks') };
    const game = gameOn(level(), { skill: { step: 6, dice: 2, max: 2 }, pack: [], coins: 0 }, { content: only });
    rig(game, 6);
    search(game);
    expect(game.state.player.pack[0]).toMatchObject({ kind: 'lockpicks', count: 3 });
    const full = gameOn(level(), { skill: { step: 6, dice: 2, max: 2 }, pack: Array.from({ length: 12 }, () => magic('potion_cure', false, 1)).map((p, i) => ({ ...p, id: `x${i}`, uid: i })), coins: 0 }, { content: only });
    rig(full, 6);
    search(full);
    expect(full.state.player.pack).toHaveLength(12);
    expect(full.state.drops[0]!.contents).toHaveLength(1);
  });

  it('a collapse makes debris that can be searched', () => {
    const lvl = withThings(room(12, 5, 5, 3), {});
    const game = gameOn(lvl, { skill: { step: 6, dice: 2, max: 2 } });
    game.state.used.collapsed.push(cell(lvl, 6, 3));
    expect(hiddenNear(game, game.state.map.player).map((t) => t.kind)).toEqual(['debris']);
  });
});

describe('the monster that arrives', () => {
  it('a wandering monster arrives hunting, out of sight and never adjacent', () => {
    const rows = ['#####################', ...Array.from({ length: 5 }, () => '#...................#'), '#####################'];
    const lvl = withThings({ ...room(19, 5, 3, 3), tiles: rows }, { traps: [{ x: 4, y: 3, id: 'trap_dart' }] });
    for (let seed = 0; seed < 30; seed++) {
      const game = new Game(seed, lvl, testPlayer({ skill: { step: 6, dice: 2, max: 2 } }), { items: ITEMS, spells: SPELLS, content: CONTENT });
      rig(game, 1);
      search(game);
      expect(game.state.monsters).toHaveLength(1);
      const m = game.state.monsters[0]!;
      expect(m.awareness).toBe('alert');
      expect(Math.max(Math.abs(m.x - game.state.map.player.x), Math.abs(m.y - game.state.map.player.y))).toBeGreaterThan(1);
    }
  });
});
