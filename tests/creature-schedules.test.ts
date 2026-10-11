import { afterEach, describe, expect, it, vi } from 'vitest';
import { FROZEN } from './frozen.ts';
import { PHANTOM_ROUNDS, allyOf, decoy, placeCompanion } from '../src/game/allies.ts';
import { type Game, MAX_SIMULATED, TICKS_PER_ROUND } from '../src/game/game.ts';
import type { Monster } from '../src/game/monsters.ts';
import { STAGGER_TICKS, Schedule, TICKS_PER_ACTION, staggerOf } from '../src/game/schedule.ts';
import { applyStatus } from '../src/rules/magic/status.ts';
import { distanceSq } from '../src/rules/world/geometry.ts';
import { CONTENT, ITEMS, SPELLS, gameAt, gameOn, monsterAt, room } from './helpers.ts';
import { crowdedGame } from './turn-budget.ts';

// Task 5.3, creature schedules (Spec 04, Addendum B): each creature's next-act tick from its speed, the stagger,
// ordering within a tick, the 50-creature cap, notice rolls at the boundary, allies and the phantom. The fake clock
// is `advance`, one tick at a time, with the player idle.

/** Every turn creatures take, tick by tick: who, at which tick, and where they stood when the tick began. */
interface Turn {
  m: Monster;
  tick: number;
  /** Its squared distance from the player and its place in the level list as the tick began. */
  d: number;
  index: number;
}

/** Watch the creatures' turns while `run` advances the game. */
function turnsDuring(game: Game, run: () => void): Turn[] {
  const turns: Turn[] = [];
  const real = Schedule.prototype.tick;
  const spy = vi.spyOn(Schedule.prototype, 'tick').mockImplementation(function (this: Schedule, messages) {
    const { monsters, map } = game.state;
    const before = new Map(monsters.map((m, index) => [m, { d: distanceSq(m, map.player), index }]));
    const order = real.call(this, messages);
    for (const m of order) turns.push({ m, tick: game.tick, ...before.get(m)! });
    return order;
  });
  run();
  spy.mockRestore();
  return turns;
}

afterEach(() => vi.restoreAllMocks());

/** A creature that takes its turns but stays where it is: unaware and far from home's reach, it wanders in place at most. */
const idler = (x: number, y: number, extra: Parameters<typeof monsterAt>[2] = {}): Monster =>
  monsterAt(x, y, { awareness: 'unaware', behaviour: 'ambusher', ...extra }); // an unaware ambusher holds its ground

describe('Spec 04, Addendum B: each creature acts on its own schedule (task 5.3)', () => {
  it('fast, normal and slow creatures act 2, 1 and 0.5 times per round over 100 rounds', () => {
    const game = gameOn(room(40, 9, 1, 1));
    const fast = idler(30, 2, { id: 1, speed: 'fast' });
    const normal = idler(30, 4, { id: 2, speed: 'normal' });
    const slow = idler(30, 6, { id: 3, speed: 'slow' });
    game.state.monsters.push(fast, normal, slow);
    const turns = turnsDuring(game, () => {
      for (let t = 0; t < 100 * TICKS_PER_ROUND; t++) game.advance(1);
    });
    const perRound = (m: Monster): number[] => {
      const counts = Array.from({ length: 100 }, () => 0);
      for (const t of turns) if (t.m === m) counts[Math.ceil(t.tick / TICKS_PER_ROUND) - 1]!++;
      return counts;
    };
    // The first round depends on where the stagger falls; every round after it is exact.
    expect(perRound(fast).slice(1).every((n) => n === 2)).toBe(true);
    expect(perRound(normal).every((n) => n === 1)).toBe(true);
    const slows = perRound(slow);
    expect(slows.slice(0, 98).every((n, r) => n + slows[r + 1]! === 1)).toBe(true);
    const total = (m: Monster): number => perRound(m).reduce((a, b) => a + b, 0);
    expect(total(fast)).toBeGreaterThanOrEqual(199);
    expect(total(fast)).toBeLessThanOrEqual(200);
    expect(total(normal)).toBe(100);
    expect(total(slow)).toBe(50);
  });

  it('moves a creature on by 10 ticks normal, 5 fast and 20 slow; Hasted and Slowed change it as they change the player', () => {
    expect(TICKS_PER_ACTION).toEqual({ fast: 5, normal: 10, slow: 20 });
    const gaps = (setup: (m: Monster) => void): number[] => {
      const game = gameOn(room(40, 9, 1, 1));
      const m = idler(30, 4);
      setup(m);
      game.state.monsters.push(m);
      const ticks = turnsDuring(game, () => game.advance(100)).map((t) => t.tick);
      return ticks.slice(1).map((t, i) => t - ticks[i]!);
    };
    const all = (gap: number) => (list: number[]) => list.length > 2 && list.every((g) => g === gap);
    expect(gaps(() => {})).toSatisfy(all(10));
    expect(gaps((m) => applyStatus(m.statuses, 'hasted', 50))).toSatisfy(all(5));
    expect(gaps((m) => applyStatus(m.statuses, 'slowed', 50))).toSatisfy(all(20));
    expect(gaps((m) => (applyStatus(m.statuses, 'hasted', 50), applyStatus(m.statuses, 'slowed', 50)))).toSatisfy(all(10));
    expect(gaps((m) => (m.speed = 'fast'))).toSatisfy(all(5));
  });

  it('an alert creature hunts at its own pace: a fast one closes two cells a round, a slow one one cell every other round', () => {
    const run = (speed: Monster['speed']): number => {
      const game = gameOn(room(30, 3, 1, 2));
      const m = monsterAt(21, 2, { speed, alert: true });
      game.state.monsters.push(m);
      game.advance(TICKS_PER_ROUND); // past the first round, where the stagger falls
      const from = m.x;
      game.advance(4 * TICKS_PER_ROUND);
      return from - m.x;
    };
    expect(run('fast')).toBe(8);
    expect(run('normal')).toBe(4);
    expect(run('slow')).toBe(2);
  });
});

describe('Spec 04, Addendum B: the stagger', () => {
  it('a creature first acts 1 to 10 ticks after arrival, from the level seed and its id, the same every time', () => {
    const make = (): Game => {
      const game = gameOn(room(40, 9, 1, 1));
      for (let i = 0; i < 30; i++) game.state.monsters.push(idler(5 + i, 2 + (i % 5), { id: 100 + i }));
      game.advance(0);
      return game;
    };
    const [a, b] = [make(), make()];
    const firsts = a.state.monsters.map((m) => a.schedule!.nextAct(m)!);
    expect(b.state.monsters.map((m) => b.schedule!.nextAct(m))).toEqual(firsts);
    expect(firsts.every((t) => t >= 1 && t <= STAGGER_TICKS)).toBe(true);
    expect(new Set(firsts).size).toBeGreaterThan(5); // not in lockstep
    expect(a.state.monsters.map((m) => staggerOf(a, m))).toEqual(firsts);
  });

  it('a creature that appears later is staggered from the tick it appears', () => {
    const game = gameOn(room(40, 9, 1, 1));
    game.advance(37);
    const m = idler(20, 4, { id: 7 });
    game.state.monsters.push(m);
    game.advance(1);
    expect(game.schedule!.nextAct(m)).toBe(37 + staggerOf(game, m));
  });

  it('a creature that cannot act still moves on, so it never stores up actions', () => {
    const game = gameOn(room(40, 1, 1, 1));
    const m = monsterAt(30, 1, { alert: true });
    applyStatus(m.statuses, 'held', 5);
    game.state.monsters.push(m);
    game.advance(5 * TICKS_PER_ROUND);
    expect(m.x).toBe(30);
    expect(game.schedule!.nextAct(m)).toBeGreaterThan(game.tick);
    expect(game.schedule!.nextAct(m)).toBeLessThanOrEqual(game.tick + 10);
    game.advance(2 * TICKS_PER_ROUND);
    expect(m.x).toBe(28); // one step a round once free, no burst
  });
});

describe('Spec 04, Addendum B: order within a tick and the 50-creature cap', () => {
  it('within a tick, creatures act nearest the player first, ties by their order in the level list', () => {
    const game = gameOn(room(40, 12, 1, 1));
    for (let i = 0; i < 40; i++) game.state.monsters.push(idler(4 + (i % 20) * 1.5 | 0, 3 + 5 * Math.floor(i / 20), { id: 500 - i }));
    const turns = turnsDuring(game, () => game.advance(30));
    const byTick = new Map<number, Turn[]>();
    for (const t of turns) byTick.set(t.tick, [...(byTick.get(t.tick) ?? []), t]);
    let shared = 0;
    for (const order of byTick.values()) {
      if (order.length > 1) shared++;
      for (let i = 1; i < order.length; i++) {
        const [a, b] = [order[i - 1]!, order[i]!];
        expect(a.d < b.d || (a.d === b.d && a.index < b.index)).toBe(true);
      }
    }
    expect(shared).toBeGreaterThan(0); // several creatures did share a tick
  });

  it('the nearer of two creatures due on the same tick takes the free cell, and the other chooses again', () => {
    // A corridor with the player at its end: both brutes want the one cell beside the player.
    const game = gameOn(room(12, 3, 1, 2));
    const near = monsterAt(3, 2, { alert: true, id: 1 });
    const far = monsterAt(4, 2, { alert: true, id: 2 });
    game.state.monsters.push(far, near); // the far one first in the list
    game.advance(0);
    const due = Math.max(game.schedule!.nextAct(near)!, game.schedule!.nextAct(far)!);
    game.advance(due);
    expect([near.x, far.x]).toEqual([2, 3]);
  });

  it('only the 50 nearest act in a round, and each boundary chooses again', () => {
    expect(MAX_SIMULATED).toBe(50);
    const game = gameOn(room(70, 12, 1, 1));
    const monsters = Array.from({ length: 60 }, (_, i) => idler(3 + (i % 30) * 2, 4 + 4 * Math.floor(i / 30), { id: i }));
    game.state.monsters.push(...monsters);
    const nearest = (): Set<Monster> =>
      new Set(monsters.slice().sort((a, b) => distanceSq(a, game.state.map.player) - distanceSq(b, game.state.map.player) || a.id - b.id).slice(0, 50));
    let chosen = nearest();
    let turns = turnsDuring(game, () => game.advance(TICKS_PER_ROUND));
    expect(new Set(turns.map((t) => t.m))).toEqual(chosen);
    // The player moves to the far corner; the next boundary simulates the creatures nearest there.
    game.state.map.player = { x: 68, y: 10 };
    turns = turnsDuring(game, () => game.advance(TICKS_PER_ROUND));
    expect(new Set(turns.map((t) => t.m))).toEqual(chosen); // this round was chosen at the last boundary
    chosen = nearest();
    turns = turnsDuring(game, () => game.advance(TICKS_PER_ROUND));
    expect(new Set(turns.map((t) => t.m))).toEqual(chosen);
    expect(turns.length).toBe(50);
  });
});

describe('Spec 04, Addendum B: notice rolls at the round boundary', () => {
  it('asleep and unaware creatures notice only at a boundary, and one that becomes alert acts in that round', () => {
    // Cowards 7 to 8 cells off: in notice range, they close in to 6 once alert and never come to blows, so no
    // exchange alerts anyone between boundaries (combat alerts at the tick it happens).
    const game = gameOn(room(20, 9, 2, 4));
    const cells = [1, 2, 3, 4, 5, 6, 7].map((y) => [9, y] as const);
    const sleepers = cells.map(([x, y], i) => monsterAt(x, y, { id: i, awareness: i === 3 ? 'asleep' : 'unaware', behaviour: 'coward' }));
    game.state.monsters.push(...sleepers);
    const woke = new Map<Monster, number>();
    const moved = new Map<Monster, number>();
    const from = new Map(sleepers.map((m) => [m, `${m.x},${m.y}`]));
    game.advance(0); // arrival begins the first round, with its notice rolls
    for (const m of sleepers) if (m.awareness === 'alert') woke.set(m, 0);
    for (let t = 0; t < 30 * TICKS_PER_ROUND; t++) {
      const asleep = sleepers.filter((m) => m.awareness !== 'alert');
      game.state.player.pools.combat.dice = game.state.player.pools.combat.max; // keep the player standing
      game.advance(1);
      for (const m of asleep) if (m.awareness === 'alert' && !woke.has(m)) woke.set(m, game.tick);
      for (const m of sleepers) if (!moved.has(m) && woke.has(m) && `${m.x},${m.y}` !== from.get(m)) moved.set(m, game.tick);
    }
    expect(woke.size).toBeGreaterThan(3);
    for (const [m, tick] of woke) {
      expect(tick % TICKS_PER_ROUND).toBe(0);
      if (moved.has(m)) expect(moved.get(m)!).toBeLessThanOrEqual(tick + TICKS_PER_ROUND);
    }
    expect(moved.size).toBeGreaterThan(0);
  });

  it('a creature not simulated this round makes no notice roll', () => {
    const game = gameOn(room(70, 12, 1, 1));
    // 50 held creatures crowd the player; a sleeper farther off, in sight and range, is the 51st.
    for (let i = 0; i < 50; i++) {
      const m = monsterAt(2 + (i % 10), 2 + Math.floor(i / 10), { id: i, alert: true });
      applyStatus(m.statuses, 'held', 500);
      game.state.monsters.push(m);
    }
    const sleeper = monsterAt(9, 8, { id: 99, awareness: 'unaware' });
    game.state.monsters.push(sleeper);
    game.advance(100 * TICKS_PER_ROUND);
    expect(game.schedule!.isSimulated(sleeper)).toBe(false);
    expect(sleeper.awareness).toBe('unaware');
  });
});

describe('Spec 04, Addendum B: allies and the phantom', () => {
  it('the companion follows its schedule like any creature, one turn a round', () => {
    const game = gameAt(room(20, 9, 1, 1), 8, 4, { abilities: ['companion'] });
    placeCompanion(game);
    const companion = allyOf(game, 'companion')!;
    const turns = turnsDuring(game, () => game.advance(20 * TICKS_PER_ROUND)).filter((t) => t.m === companion);
    expect(turns.length).toBe(20);
  });

  it('the phantom has a schedule but never acts, and its 5 rounds count at the boundary', () => {
    const game = gameAt(room(20, 9, 1, 1), 4, 4, { abilities: ['decoy'] });
    const foe = monsterAt(16, 4, { alert: true, id: 3 });
    game.state.monsters.push(foe);
    decoy(game, { x: 8, y: 4 }, []);
    const phantom = allyOf(game, 'phantom')!;
    game.advance(0);
    expect(game.schedule!.nextAct(phantom)).toBeDefined();
    const said = game.advance((PHANTOM_ROUNDS - 1) * TICKS_PER_ROUND).map((m) => m.text);
    expect(phantom).toMatchObject({ x: 8, y: 4 });
    expect(said).not.toContain('The phantom fades away.');
    expect(game.advance(TICKS_PER_ROUND).map((m) => m.text)).toContain('The phantom fades away.');
    expect(allyOf(game, 'phantom')).toBeUndefined();
  });
});

describe('Spec 04, Addendum B: determinism and the time budget', () => {
  it('the same level and the same ticks give the same game, however the ticks are grouped', () => {
    const make = (): Game => {
      const game = gameOn(room(30, 12, 2, 2), { combatDice: 6, combatMax: 6 });
      for (let i = 0; i < 20; i++) game.state.monsters.push(monsterAt(6 + (i % 10) * 2, 4 + 3 * Math.floor(i / 10), { id: i, awareness: i % 3 ? 'unaware' : 'alert', speed: (['fast', 'normal', 'slow'] as const)[i % 3] }));
      return game;
    };
    const [a, b] = [make(), make()];
    a.advance(400);
    for (const n of [1, 9, 10, 33, 47, 100, 200]) b.advance(n);
    expect(JSON.stringify(b.state)).toBe(JSON.stringify(a.state));
  });

  it('a round on a crowded large level stays within the turn time budget, and no tick takes over 16 ms', () => {
    const game = crowdedGame({ levels: FROZEN, spells: SPELLS, items: ITEMS, content: CONTENT }, 80);
    expect(game.state.monsters.length).toBe(80);
    const { player } = game.state;
    const round = (): { took: number; worstTick: number } => {
      let worstTick = 0;
      const start = performance.now();
      for (let t = 0; t < TICKS_PER_ROUND; t++) {
        const s = performance.now();
        game.advance(1);
        worstTick = Math.max(worstTick, performance.now() - s);
      }
      player.pools.combat.dice = player.pools.combat.max; // never let the test character die
      return { took: performance.now() - start, worstTick };
    };
    for (let r = 0; r < 20; r++) round(); // warm up the engine before measuring
    let total = 0;
    let worst = 0;
    let worstTick = 0;
    for (let r = 0; r < 300; r++) {
      const m = round();
      total += m.took;
      worst = Math.max(worst, m.took);
      worstTick = Math.max(worstTick, m.worstTick);
    }
    expect(player.dead).toBe(false);
    expect(total / 300).toBeLessThan(5);
    expect(worst).toBeLessThan(50);
    expect(worstTick).toBeLessThan(16);
  });
});
