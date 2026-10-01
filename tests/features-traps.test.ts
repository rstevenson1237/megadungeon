import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game.ts';
import { Run } from '../src/game/run.ts';
import { hiddenNear, trapDice } from '../src/game/features/index.ts';
import { TERRAIN_OPEN } from '../src/game/map-state.ts';
import { hasStatus, statusOf } from '../src/rules/magic/status.ts';
import type { Level } from '../src/rules/world/level.ts';
import { CONTENT, ITEMS, SPELLS, cell, gameAt, levelFrom, monsterAt, rig, room, testPlayer, withThings } from './helpers.ts';

const bare = { pack: [], equipment: {}, combatDice: 4, combatMax: 4, skill: { step: 6 as const, dice: 2, max: 2 } };
/** A room with one hidden floor trap at (3,3), and the player at (2,3) ready to step east onto it. */
const trapLevel = (id: string, depth = 1): Level => ({ ...withThings(room(12, 5, 1, 1), { traps: [{ x: 3, y: 3, id }] }), depth });
const stepOn = (game: Game) => game.act({ type: 'move', dx: 1, dy: 0 })!;
const said = (r: { messages: { text: string }[] }): string => r.messages.map((m) => m.text).join(' | ');
/** Step onto the trap with a failed avoid check (a 2), so it springs. */
const spring = (id: string, depth = 1, extra: Parameters<typeof gameAt>[3] = {}) => {
  const game = gameAt(trapLevel(id, depth), 2, 3, { ...bare, ...extra });
  rig(game, 2);
  const result = stepOn(game);
  return { game, result };
};

describe('Spec 06: stepping on a hidden floor trap', () => {
  it('a Skill check to avoid it: 4 or more jumps clear and finds it, and it does not spring', () => {
    const level = trapLevel('trap_dart');
    const game = gameAt(level, 2, 3, bare);
    rig(game, 4);
    const result = stepOn(game);
    expect(said(result)).toContain('You spot a trap at the last moment and jump clear!');
    expect(game.state.player.combatDice).toBe(4);
    expect(game.state.map.player).toEqual({ x: 3, y: 3 });
    expect(game.state.revealed).toEqual([cell(level, 3, 3)]);
    expect(game.state.used.disarmed).toEqual([]); // still there
  });

  it('2 to 3 springs it, and so does a 1; a check costs no die', () => {
    for (const roll of [2, 3, 1]) {
      const game = gameAt(trapLevel('trap_dart'), 2, 3, bare);
      rig(game, roll);
      stepOn(game);
      expect(game.state.player.combatDice, `roll ${roll}`).toBe(3);
      expect(game.state.player.skill.dice).toBe(2);
    }
  });

  it('a found trap is walked around or disarmed, never stepped on: the step is refused for no round', () => {
    const game = gameAt(trapLevel('trap_dart'), 2, 3, bare);
    game.state.revealed.push(cell(game.state.map.level, 3, 3));
    const round = game.state.round;
    const result = stepOn(game);
    expect(result).toMatchObject({ spent: false });
    expect(said(result)).toContain('There is a trap there.');
    expect(game.state.map.player).toEqual({ x: 2, y: 3 });
    expect(game.state.round).toBe(round);
  });

  it('a sprung trap is spent: stepping there again is safe, and it stays so in the delta', () => {
    const lvl = trapLevel('trap_dart');
    const { game } = spring('trap_dart');
    expect(game.state.used.disarmed).toEqual([cell(lvl, 3, 3)]);
    game.act({ type: 'move', dx: -1, dy: 0 });
    stepOn(game);
    expect(game.state.player.combatDice).toBe(3); // no second hit
  });
});

describe('Spec 06: what the floor traps do', () => {
  it('dart and pit each cost one Combat die; below level 50 the dart, fire and collapse cost two, the pit still one', () => {
    expect(spring('trap_dart').game.state.player.combatDice).toBe(3);
    expect(spring('trap_pit').game.state.player.combatDice).toBe(3);
    expect(spring('trap_dart', 50).game.state.player.combatDice).toBe(3); // level 50 itself is not below it
    expect(spring('trap_dart', 51).game.state.player.combatDice).toBe(2);
    expect(spring('trap_pit', 80).game.state.player.combatDice).toBe(3);
    expect(spring('trap_collapse', 51).game.state.player.combatDice).toBe(2);
    expect(trapDice(CONTENT.traps.get('trap_fire_burst')!, 51)).toBe(2);
    expect(trapDice(CONTENT.traps.get('trap_fire_burst')!, 50)).toBe(1);
    expect(trapDice(CONTENT.traps.get('trap_deep_pit')!, 90)).toBe(1);
  });

  it('a trap that takes dice kills a player with none left, as any hit does; a Shield absorbs the first', () => {
    expect(spring('trap_dart', 1, { combatDice: 0 }).game.state.player.dead).toBe(true);
    expect(spring('trap_dart', 1, { shield: 5 }).game.state.player.combatDice).toBe(4);
    expect(spring('trap_dart', 51, { combatDice: 1, combatMax: 4 }).game.state.player.dead).toBe(true);
  });

  it('poison gas poisons; sleep gas puts the player to sleep for 5 rounds; a net holds them for 3', () => {
    expect(hasStatus(spring('trap_poison_gas').game.state.player.statuses, 'poisoned')).toBe(true);
    const asleep = spring('trap_sleep_gas').game;
    expect(statusOf(asleep.state.player.statuses, 'asleep')!.rounds).toBe(4); // 5, less the round it began in
    const held = spring('trap_net').game;
    expect(statusOf(held.state.player.statuses, 'held')!.rounds).toBe(2);
  });

  it('an alarm rouses every monster on the level, the sleeping and the unaware', () => {
    const game = gameAt(trapLevel('trap_alarm'), 2, 3, bare);
    const monsters = [monsterAt(10, 1, { awareness: 'asleep' }), monsterAt(10, 5, { awareness: 'unaware' }), monsterAt(9, 3, { awareness: 'asleep' })];
    game.state.monsters.push(...monsters);
    rig(game, 2);
    stepOn(game);
    expect(monsters.map((m) => m.awareness)).toEqual(['alert', 'alert', 'alert']);
  });

  it('a teleport trap moves the player to a random walkable cell, never one with a creature or a trap', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const lvl = trapLevel('trap_teleport');
      const g = new Game(seed, lvl, testPlayer(bare), { items: ITEMS, content: CONTENT, spells: SPELLS });
      g.state.map.player = { x: 2, y: 3 };
      g.state.monsters.push(monsterAt(9, 3, { awareness: 'asleep' }));
      rig(g, 2);
      stepOn(g);
      const { x, y } = g.state.map.player;
      seen.add(`${x},${y}`);
      expect(g.state.map.terrain[y * lvl.width + x]).toBe(TERRAIN_OPEN);
      expect([x, y]).not.toEqual([3, 3]);
      expect([x, y]).not.toEqual([9, 3]);
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  it('a collapse costs a Combat die and leaves debris where the floor gave way, which can be searched', () => {
    const lvl = trapLevel('trap_collapse');
    const { game } = spring('trap_collapse');
    expect(game.state.used.collapsed).toEqual([cell(lvl, 3, 3)]);
    expect(game.state.player.combatDice).toBe(3);
    game.act({ type: 'move', dx: -1, dy: 0 });
    expect(hiddenNear(game, game.state.map.player).map((t) => t.kind)).toEqual(['debris']);
  });

  it('a deep pit drops the player to the level below at a random walkable cell, costing a die', () => {
    const levels: Record<number, Level> = {
      4: { ...withThings(room(12, 5, 1, 1), { traps: [{ x: 3, y: 3, id: 'trap_deep_pit' }] }), depth: 4 },
      5: { ...room(30, 12, 1, 1), depth: 5 },
    };
    const landed = new Set<string>();
    for (let seed = 1; seed <= 30; seed++) {
      const run = new Run(seed, testPlayer(bare), { startDepth: 4, levelFor: (d) => levels[d]!, villages: [0], items: ITEMS, spells: SPELLS, content: CONTENT });
      run.game!.state.map.player = { x: 2, y: 3 };
      rig(run.game!, 2);
      const result = run.game!.act({ type: 'move', dx: 1, dy: 0 })!;
      expect(result.fall).toBe(true);
      expect(run.player.combatDice).toBe(3);
      run.fall();
      expect(run.depth).toBe(5);
      const { x, y } = run.game!.state.map.player;
      expect(run.game!.state.map.terrain[y * 32 + x]).toBe(TERRAIN_OPEN);
      landed.add(`${x},${y}`);
    }
    expect(landed.size).toBeGreaterThan(15);
  });

  it('nothing else moves when the player falls: the monsters do not act', () => {
    const lvl = { ...withThings(room(12, 5, 1, 1), { traps: [{ x: 3, y: 3, id: 'trap_deep_pit' }] }), depth: 4 };
    const game = gameAt(lvl, 2, 3, bare);
    const m = monsterAt(9, 3, { alert: true, dice: 30, maxDice: 30, modifier: -6 });
    game.state.monsters.push(m);
    rig(game, 2);
    stepOn(game);
    expect(m.x).toBe(9);
  });
});

describe('Spec 06: disarming a found trap', () => {
  const found = (id = 'trap_dart') => {
    const lvl = trapLevel(id);
    const game = gameAt(lvl, 2, 3, bare);
    game.state.revealed.push(cell(lvl, 3, 3));
    game.state.player.facing = { dx: 1, dy: 0 };
    return { game, lvl };
  };
  const interact = (game: Game) => game.act({ type: 'interact' })!;

  it('E on a found trap is a Skill check: 4 or more removes it, and the cell can then be crossed', () => {
    const { game, lvl } = found();
    rig(game, 5);
    const result = interact(game);
    expect(result.spent).toBe(true);
    expect(said(result)).toContain('You disarm the dart trap.');
    expect(game.state.used.disarmed).toEqual([cell(lvl, 3, 3)]);
    stepOn(game);
    expect(game.state.map.player).toEqual({ x: 3, y: 3 });
    expect(game.state.player.combatDice).toBe(4);
  });

  it('2 to 3 fails safely and the trap stays', () => {
    const { game } = found();
    rig(game, 3);
    expect(said(interact(game))).toContain('You fail to disarm the dart trap, but nothing happens.');
    expect(game.state.used.disarmed).toEqual([]);
    expect(game.state.player.combatDice).toBe(4);
  });

  it('a 1 springs it', () => {
    const { game } = found();
    rig(game, 1);
    interact(game);
    expect(game.state.player.combatDice).toBe(3);
    expect(game.state.used.disarmed).toHaveLength(1);
  });
});

describe('Spec 06: monsters never trigger traps', () => {
  it('a creature in a one-cell corridor will not step on a trap, and the trap stays whole', () => {
    const lvl = withThings(levelFrom(['###########', '#<.......m#', '###########'].map((r) => r.replace('m', '.'))), { traps: [{ x: 5, y: 1, id: 'trap_dart' }] });
    const game = gameAt(lvl, 1, 1, { ...bare, combatDice: 6, combatMax: 6 });
    const m = monsterAt(8, 1, { alert: true, dice: 30, maxDice: 30, modifier: -6 });
    game.state.monsters.push(m);
    for (let i = 0; i < 12; i++) game.act({ type: 'wait' });
    expect(m.x).toBeGreaterThan(5); // there is no way round, so it never crosses the trap
    expect(game.state.used.disarmed).toEqual([]);
  });

  it('in the open it goes round', () => {
    const lvl = withThings(room(12, 5, 1, 1), { traps: [{ x: 5, y: 3, id: 'trap_dart' }] });
    const game = gameAt(lvl, 2, 3, { ...bare, combatDice: 6, combatMax: 6 });
    const m = monsterAt(9, 3, { alert: true, dice: 30, maxDice: 30, modifier: -6 });
    game.state.monsters.push(m);
    for (let i = 0; i < 12; i++) game.act({ type: 'wait' });
    expect(Math.abs(m.x - 3) + Math.abs(m.y - 3)).toBeLessThanOrEqual(1); // beside the player
    expect(game.state.used.disarmed).toEqual([]);
  });

  it('a rival walking to the stair also goes round', () => {
    const lvl = withThings(levelFrom(['########', '#<.....#', '#......#', '#.....>#', '########']), { traps: [{ x: 3, y: 2, id: 'trap_dart' }, { x: 2, y: 2, id: 'trap_dart' }, { x: 4, y: 2, id: 'trap_dart' }] });
    const game = gameAt(lvl, 6, 1, { ...bare, combatDice: 6, combatMax: 6 });
    const rival = monsterAt(1, 1, { kind: 'rival', hostile: false, dice: 5, maxDice: 5, modifier: -6 });
    game.state.monsters.push(rival);
    for (let i = 0; i < 20; i++) game.act({ type: 'wait' });
    expect(game.state.used.disarmed).toEqual([]);
    expect(rival.x).toBeGreaterThan(1);
  });
});
