import { describe, expect, it } from 'vitest';
import { MAX_SIMULATED, actionsInRound } from '../src/game/game.ts';
import { MONSTER_COUNTS, STUB_KINDS, placeStubMonsters, ratingCeiling } from '../src/game/monsters.ts';
import { createRng } from '../src/core/rng.ts';
import { meleeOutcome, rollDie } from '../src/rules/combat/melee.ts';
import { distanceSq } from '../src/rules/world/geometry.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import type { SizeClass } from '../src/rules/world/level.ts';
import { gameOn, levelFrom, monsterAt, press, room, shellOn, walk } from './helpers.ts';

describe('turn loop (Spec 04, Turns and timing)', () => {
  it('moves nothing until the player spends an action; free actions cost no round', () => {
    const shell = shellOn(room(20, 5, 2, 3), [monsterAt(8, 3, { alert: true })]);
    const game = shell.game!;
    const before = JSON.stringify(game.state);
    for (const key of ['f', 'Tab', 'Escape', 'i', 'l', 'm', 'Escape', '?', 'Escape']) press(shell, key);
    expect(JSON.stringify(game.state)).toBe(before);
    expect(game.state.round).toBe(1);
    press(shell, ' '); // waiting spends a round
    expect(game.state.round).toBe(2);
    expect(game.state.monsters[0]!.x).toBe(7);
  });

  it('a bump into a wall costs nothing, and so does a diagonal', () => {
    const game = gameOn(levelFrom(['#####', '#<..#', '#####']));
    expect(game.act({ type: 'move', dx: 0, dy: -1 })).toEqual({ messages: [], spent: false });
    expect(game.act({ type: 'move', dx: 1, dy: 1 })!.spent).toBe(false);
    expect(game.state.round).toBe(1);
    expect(game.act({ type: 'move', dx: 1, dy: 0 })!.spent).toBe(true);
    expect(game.state.round).toBe(2);
  });

  it('leaves commands it does not handle to the caller', () => {
    const game = gameOn(room(5, 5, 2, 2));
    for (const type of ['inventory', 'look', 'search', 'pickup', 'cast', 'journal', 'waitLong'] as const) {
      expect(game.act({ type })).toBeUndefined();
    }
  });

  it('fast, normal and slow creatures act 2, 1 and 0.5 times per round over 100 rounds', () => {
    const total = (speed: 'fast' | 'normal' | 'slow'): number =>
      Array.from({ length: 100 }, (_, i) => actionsInRound(speed, i + 1)).reduce((a, b) => a + b, 0);
    expect(total('fast')).toBe(200);
    expect(total('normal')).toBe(100);
    expect(total('slow')).toBe(50);
  });

  it('moves creatures by their speed: a rat covers 2 cells a round, a goblin 1, an ogre 1 every other', () => {
    const run = (speed: 'fast' | 'normal' | 'slow'): number[] => {
      const game = gameOn(room(30, 3, 1, 2));
      const m = monsterAt(21, 2, { speed, alert: true });
      game.state.monsters.push(m);
      const xs: number[] = [];
      for (let i = 0; i < 4; i++) {
        game.act({ type: 'wait' });
        xs.push(m.x);
      }
      return xs;
    };
    expect(run('fast')).toEqual([19, 17, 15, 13]);
    expect(run('normal')).toEqual([20, 19, 18, 17]);
    expect(run('slow')).toEqual([21, 20, 20, 19]); // acts on even rounds only
  });

  it('simulates at most 50 creatures a round, nearest first', () => {
    expect(MAX_SIMULATED).toBe(50);
    const game = gameOn(room(70, 12, 1, 1));
    const monsters = Array.from({ length: 60 }, (_, i) =>
      monsterAt(3 + (i % 30) * 2, 4 + 4 * Math.floor(i / 30), { id: i, alert: true }),
    );
    game.state.monsters.push(...monsters);
    const from = monsters.map((m) => ({ x: m.x, y: m.y }));
    const origin = game.state.map.player;
    game.act({ type: 'wait' });
    const unmoved = monsters.filter((m, i) => m.x === from[i]!.x && m.y === from[i]!.y).map((m) => m.id);
    const farthest = monsters
      .map((m, i) => ({ id: m.id, d: distanceSq(from[i]!, origin) }))
      .sort((a, b) => b.d - a.d || b.id - a.id)
      .slice(0, 10)
      .map((m) => m.id);
    expect(unmoved.sort((a, b) => a - b)).toEqual(farthest.sort((a, b) => a - b));
  });

  it('keeps stub monsters idle until the player sees them, then hunts', () => {
    const game = gameOn(room(30, 3, 1, 2));
    const near = monsterAt(5, 2);
    const far = monsterAt(28, 2);
    game.state.monsters.push(near, far);
    game.act({ type: 'wait' });
    expect(near.alert).toBe(true); // in sight within 8
    expect(near.x).toBe(4);
    expect(far.alert).toBe(false);
    expect(far.x).toBe(28);
  });
});

describe('doors (Spec 06, Doors and locks)', () => {
  const level = () => levelFrom(['#########', '#<..+...#', '#########']);

  it('a closed door blocks sight; moving into it opens it, costs the move and the player stays', () => {
    const game = gameOn(level());
    const { map } = game.state;
    expect(map.visible[1 * 9 + 6]).toBe(0);
    walk(game, 'dd'); // stand next to the door at (4,1)
    expect(map.player).toEqual({ x: 3, y: 1 });
    const round = game.state.round;
    expect(game.act({ type: 'move', dx: 1, dy: 0 })!.spent).toBe(true);
    expect(map.player).toEqual({ x: 3, y: 1 });
    expect(game.state.round).toBe(round + 1);
    expect(map.openDoors).toEqual([1 * 9 + 4]);
    expect(map.visible[1 * 9 + 6]).toBe(1); // sight now passes
    walk(game, 'd');
    expect(map.player).toEqual({ x: 4, y: 1 });
  });

  it('interact closes an adjacent open door, which blocks sight again; nothing to close leaves E to the caller', () => {
    const game = gameOn(level());
    expect(game.act({ type: 'interact' })).toBeUndefined();
    walk(game, 'dddd'); // opens, then steps through to the door cell
    walk(game, 'd');
    const { map } = game.state;
    expect(map.player).toEqual({ x: 5, y: 1 });
    walk(game, 'a'); // step back, facing west... the door is now west of the player
    walk(game, 'a');
    expect(map.player).toEqual({ x: 3, y: 1 });
    const result = game.act({ type: 'interact' });
    expect(result!.spent).toBe(true);
    expect(map.openDoors).toEqual([]);
    expect(map.visible[1 * 9 + 6]).toBe(0);
  });

  it('refuses to close a door with a creature in the doorway', () => {
    const game = gameOn(level());
    walk(game, 'dd');
    walk(game, 'd'); // open
    const m = monsterAt(4, 1);
    game.state.monsters.push(m);
    const result = game.act({ type: 'interact' })!;
    expect(result.spent).toBe(false);
    expect(result.messages[0]!.text).toContain('doorway');
    expect(game.state.map.openDoors).toHaveLength(1);
  });

  it('a closed door stops a hunting monster; an open one does not', () => {
    const game = gameOn(level());
    const m = monsterAt(6, 1, { alert: true });
    game.state.monsters.push(m);
    game.act({ type: 'wait' });
    expect(m.x).toBe(6); // behind the closed door, no path
    walk(game, 'dd');
    walk(game, 'd'); // open it
    game.act({ type: 'wait' });
    expect(m.x).toBeLessThan(6);
  });

  it('door state is plain data: open doors are a list of cell indices', () => {
    const game = gameOn(level());
    walk(game, 'ddd');
    expect(JSON.parse(JSON.stringify(game.state.map.openDoors))).toEqual([13]);
  });
});

describe('stub melee (Spec 03, Melee; Spec 04, Attacks)', () => {
  it('the higher total hits and a tie hits both', () => {
    expect(meleeOutcome(5, 3)).toEqual({ defenderHit: true, attackerHit: false });
    expect(meleeOutcome(3, 5)).toEqual({ defenderHit: false, attackerHit: true });
    expect(meleeOutcome(4, 4)).toEqual({ defenderHit: true, attackerHit: true });
  });

  it('rolls with disadvantage as the lower of two dice', () => {
    const rng = createRng(3);
    const plain = Array.from({ length: 3000 }, () => rollDie(rng, 6));
    const dis = Array.from({ length: 3000 }, () => rollDie(rng, 6, true));
    const mean = (a: number[]): number => a.reduce((x, y) => x + y, 0) / a.length;
    expect(mean(plain)).toBeGreaterThan(3.3);
    expect(mean(dis)).toBeLessThan(2.8); // expected 2.53
    expect(Math.min(...dis)).toBe(1);
    expect(Math.max(...plain)).toBe(6);
  });

  it('moving into a monster attacks it and the player does not move; it dies at zero dice', () => {
    const game = gameOn(room(8, 3, 1, 2));
    const m = monsterAt(2, 2, { dice: 2, maxDice: 2, modifier: -10 }); // can never win a roll
    game.state.monsters.push(m);
    const first = game.act({ type: 'move', dx: 1, dy: 0 })!;
    expect(game.state.map.player).toEqual({ x: 1, y: 2 });
    expect(first.spent).toBe(true);
    // The player's attack hits; the monster then sees the player and attacks, loses that
    // exchange too (the higher total hits), and falls.
    expect(first.messages.map((x) => x.text)).toEqual(['You hit the goblin.', 'You kill the goblin.']);
    expect(first.messages.every((x) => x.kind === 'combat')).toBe(true);
    expect(game.state.monsters).toHaveLength(0);
    expect(game.state.player.combatDice).toBe(2);
    game.act({ type: 'move', dx: 1, dy: 0 }); // now an empty cell: the player steps in
    expect(game.state.map.player).toEqual({ x: 2, y: 2 });
  });

  it('a monster hit removes a Combat die, and a hit with none left is fatal', () => {
    const game = gameOn(room(8, 3, 1, 2));
    game.state.monsters.push(monsterAt(2, 2, { modifier: 6, alert: true })); // always beats a d6
    game.act({ type: 'wait' });
    expect(game.state.player.combatDice).toBe(1);
    game.act({ type: 'wait' });
    expect(game.state.player.combatDice).toBe(0);
    const fatal = game.act({ type: 'wait' })!;
    expect(fatal.messages.map((x) => x.text)).toEqual(['The goblin kills you.']);
    expect(game.state.player.dead).toBe(true);
    const after = game.act({ type: 'move', dx: 1, dy: 0 })!;
    expect(after.spent).toBe(false);
    expect(after.messages[0]!.text).toContain('dead');
  });

  it('is deterministic: the same seed gives the same fight', () => {
    const fight = (): string[] => {
      const game = gameOn(room(8, 3, 1, 2));
      game.state.monsters.push(monsterAt(2, 2, { dice: 3, maxDice: 3, alert: true }));
      const out: string[] = [];
      for (let i = 0; i < 12 && !game.state.player.dead; i++) {
        for (const m of game.act({ type: 'move', dx: 1, dy: 0 })!.messages) out.push(m.text);
        if (game.state.monsters.length === 0) break;
      }
      return out;
    };
    expect(fight()).toEqual(fight());
    expect(fight().length).toBeGreaterThan(0);
  });

  it('shows combat in the log and the Combat pool in the character pane', () => {
    const shell = shellOn(room(8, 3, 1, 2), [monsterAt(2, 2, { modifier: 6, alert: true })]);
    press(shell, ' ');
    expect(shell.character.stats[0]!.current).toBe(1);
    expect(shell.log.lines(shell.turn).some((l) => l.text === 'The goblin hits you.' && l.kind === 'combat')).toBe(true);
    expect(shell.turn).toBe(2);
  });
});

describe('stub monster placement (Spec 02, Depth scaling and step 8)', () => {
  const sizes: SizeClass[] = ['small', 'medium', 'large'];

  it('places the counts for each size, on floor cells, none within 8 cells of the up stair', () => {
    for (let seed = 0; seed < 60; seed++) {
      const size = sizes[seed % 3]!;
      const level = generateLevel(seed, 1 + seed, size);
      const monsters = placeStubMonsters(level, createRng(seed));
      const [lo, hi] = MONSTER_COUNTS[size];
      expect(monsters.length).toBeGreaterThanOrEqual(lo);
      expect(monsters.length).toBeLessThanOrEqual(hi);
      const cells = new Set<string>();
      for (const m of monsters) {
        expect(level.tiles[m.y]![m.x]).toBe('.');
        expect(distanceSq(m, level.upStair)).toBeGreaterThan(64);
        cells.add(`${m.x},${m.y}`);
      }
      expect(cells.size).toBe(monsters.length);
    }
  });

  it('rolls ratings between half the ceiling and the ceiling, with the Spec 02 modifier', () => {
    expect(ratingCeiling(1)).toBe(1);
    expect(ratingCeiling(10)).toBe(3);
    expect(ratingCeiling(99)).toBe(20);
    expect(ratingCeiling(100)).toBe(20);
    for (const depth of [1, 20, 55, 99]) {
      const level = generateLevel(7, depth, 'large');
      const ceiling = ratingCeiling(depth);
      for (const m of placeStubMonsters(level, createRng(depth))) {
        expect(m.maxDice).toBeGreaterThanOrEqual(Math.ceil(ceiling / 2));
        expect(m.maxDice).toBeLessThanOrEqual(ceiling);
        const base = Math.min(6, Math.floor(depth / 15));
        expect(m.modifier).toBeGreaterThanOrEqual(Math.max(-2, base - 2));
        expect(m.modifier).toBeLessThanOrEqual(Math.min(6, base + 2));
        expect(STUB_KINDS.some((k) => k.name === m.name)).toBe(true);
      }
    }
  });

  it('is deterministic per seed and level', () => {
    const level = generateLevel(5, 12, 'medium');
    expect(placeStubMonsters(level, createRng(1))).toEqual(placeStubMonsters(level, createRng(1)));
  });
});
