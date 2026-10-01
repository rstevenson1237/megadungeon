import { describe, expect, it } from 'vitest';
import { Game, createPlayer } from '../src/game/game.ts';
import { Run } from '../src/game/run.ts';
import { distanceSq } from '../src/rules/world/geometry.ts';
import { eligibleEntries } from '../src/core/roller.ts';
import { RESTOCK_CAP, WANDER_ONE_IN, monsterBudget, restockCount, restockShare } from '../src/rules/world/restock.ts';
import { ratingCeiling } from '../src/rules/world/depth.ts';
import type { Level, PlacedMonster } from '../src/rules/world/level.ts';
import { placedFrom, withinCeiling } from '../src/rules/world/placement/contents.ts';
import { CONTENT, ITEMS, SPELLS, gameOn, levelFrom, testPlayer, withThings } from './helpers.ts';

describe('Spec 02: restocking numbers', () => {
  it('10% of the budget per whole 500 turns away, capped at 50%', () => {
    expect(restockShare(0)).toBe(0);
    expect(restockShare(499)).toBe(0);
    expect(restockShare(500)).toBeCloseTo(0.1);
    expect(restockShare(999)).toBeCloseTo(0.1);
    expect(restockShare(1000)).toBeCloseTo(0.2);
    expect(restockShare(2500)).toBeCloseTo(0.5);
    expect(restockShare(1_000_000)).toBe(RESTOCK_CAP);
    expect(restockShare(-5)).toBe(0);
  });

  it('the count is that share of the budget, rounded, and never fills a level past its budget', () => {
    expect(restockCount(10, 500, 0)).toBe(1);
    expect(restockCount(10, 1000, 0)).toBe(2);
    expect(restockCount(10, 5000, 0)).toBe(5);
    expect(restockCount(30, 2500, 0)).toBe(15);
    expect(restockCount(10, 5000, 8)).toBe(2); // only room for two more
    expect(restockCount(10, 5000, 10)).toBe(0);
    expect(restockCount(10, 5000, 14)).toBe(0);
    expect(restockCount(10, 499, 0)).toBe(0);
  });

  it('the budget is the ordinary monsters a level was generated with', () => {
    const base = { x: 0, y: 0, id: 'm', name: 'm', glyph: 'm', colour: 'white', dice: 1, modifier: 0, speed: 'normal' as const, behaviour: 'brute', group: 0 };
    const monsters: PlacedMonster[] = [{ ...base, role: 'normal' }, { ...base, role: 'normal' }, { ...base, role: 'boss' }, { ...base, role: 'opponent' }];
    expect(monsterBudget({ monsters })).toBe(2);
  });
});

/** Two rooms with a wall between them: the player arrives in the left one and cannot see the right one. */
const rows = [
  '#####################',
  '#<.......##.........#',
  '#.........#.........#',
  '#.........#.........#',
  '#.........#.........#',
  '#####################',
];
const depth = 1;
function levelWith(count: number): Level {
  const rows2 = withinCeiling(eligibleEntries(CONTENT.monsters, { depth }), ratingCeiling(depth));
  const base = levelFrom(rows);
  const monsters = Array.from({ length: count }, (_, i) => placedFrom(rows2[i % rows2.length]!, { x: 12 + (i % 8), y: 1 + Math.floor(i / 8) }, i));
  return { ...withThings(base, { features: [{ type: 'container', kind: 'chest', x: 4, y: 3, contents: [{ kind: 'coins', amount: 50 }] }] }), monsters, depth };
}
const runOn = (count: number): Run =>
  new Run(7, testPlayer({ coins: 0 }), { startDepth: depth, levelFor: () => levelWith(count), spells: SPELLS, items: ITEMS, content: CONTENT, villages: [0] });
const alive = (run: Run): number => run.game!.state.monsters.length;

describe('Spec 02: a scripted run of restocking', () => {
  it('after a level is cleared, the time away brings back 10% per 500 turns, out of sight of the arrival stair', () => {
    const run = runOn(10);
    expect(alive(run)).toBe(10);
    run.game!.state.monsters.length = 0; // the player cleared it
    run.travel('up');
    run.round += 1000; // five rests
    run.travel('down');
    const game = run.game!;
    expect(game.state.monsters).toHaveLength(2); // 20% of 10
    for (const m of game.state.monsters) {
      expect(game.state.map.visible[m.y * game.state.map.level.width + m.x]).toBe(0);
      expect(m.awareness === 'asleep' || m.awareness === 'unaware').toBe(true);
    }
  });

  it('under 500 turns away brings nothing back, and 2,500 or more brings half the budget', () => {
    const none = runOn(10);
    none.game!.state.monsters.length = 0;
    none.travel('up');
    none.round += 300;
    none.travel('down');
    expect(alive(none)).toBe(0);

    const half = runOn(10);
    half.game!.state.monsters.length = 0;
    half.travel('up');
    half.round += 60000;
    half.travel('down');
    expect(alive(half)).toBe(5);
  });

  it('time away counts from the round the player left, whatever happened in between', () => {
    const run = runOn(10);
    run.game!.state.monsters.length = 0;
    const left = run.game!.state.round;
    run.travel('up');
    expect(run.deltas[depth]!.turnLeft).toBe(left);
    run.round = left + 3000;
    run.travel('down');
    expect(alive(run)).toBe(5);
  });

  it('a level that is still full is not filled past its budget however long the player was away', () => {
    const run = runOn(10);
    run.travel('up');
    run.round += 50000;
    run.travel('down');
    expect(alive(run)).toBe(10);
    const partly = runOn(10);
    partly.game!.state.monsters.length = 7;
    partly.travel('up');
    partly.round += 50000;
    partly.travel('down');
    expect(alive(partly)).toBe(10);
  });

  it('what returns is drawn from the depth table as it stands', () => {
    const run = runOn(10);
    run.game!.state.monsters.length = 0;
    run.travel('up');
    run.round += 60000;
    run.travel('down');
    const allowed = new Set(withinCeiling(eligibleEntries(CONTENT.monsters, { depth }), ratingCeiling(depth)).map((m) => m.name));
    for (const m of run.game!.state.monsters) expect(allowed.has(m.name)).toBe(true);
  });

  it('treasure does not restock: a looted chest stays looted', () => {
    const run = runOn(10);
    run.game!.state.looted.features.push(0);
    run.game!.state.used.features[0] = { done: true, left: [] };
    run.travel('up');
    run.round += 60000;
    run.travel('down');
    expect(run.game!.state.looted.features).toEqual([0]);
    expect(run.game!.state.used.features[0]!.left).toEqual([]);
  });

  it('the same scripted run gives the same restock every time', () => {
    const go = (): string => {
      const run = runOn(10);
      run.game!.state.monsters.length = 0;
      run.travel('up');
      run.round += 5000;
      run.travel('down');
      return JSON.stringify(run.game!.state.monsters.map((m) => [m.name, m.x, m.y]));
    };
    expect(go()).toBe(go());
  });

  it('a village never restocks: there is no level to fill', () => {
    const run = new Run(7, testPlayer(), { startDepth: 0, levelFor: () => levelWith(10), villages: [0] });
    run.round += 60000;
    expect(run.game).toBeNull();
  });
});

describe('Spec 02: wandering monsters', () => {
  it('arrive with chance 1 in 200 each turn: about one in 200 over many turns', () => {
    expect(WANDER_ONE_IN).toBe(200);
    let arrivals = 0;
    let turns = 0;
    for (let round = 1; round <= 30; round++) {
      const game = new Game(3, levelWith(0), createPlayer({ combatStep: 6, combatDice: 50, combatMax: 50 }), { spells: SPELLS, items: ITEMS, content: CONTENT, round: round * 1000 });
      for (let t = 0; t < 1000; t++) {
        game.state.monsters.length = 0;
        const result = game.act({ type: 'wait' })!;
        turns++;
        if (result.messages.some((m) => m.text.includes('Something stirs'))) arrivals++;
      }
    }
    expect(arrivals / turns).toBeGreaterThan(0.003);
    expect(arrivals / turns).toBeLessThan(0.008);
  });

  it('enter out of sight and never adjacent to the player, hunting', () => {
    for (let round = 1; round <= 60; round++) {
      const game = new Game(3, levelWith(0), createPlayer({ combatStep: 6, combatDice: 50, combatMax: 50 }), { spells: SPELLS, items: ITEMS, content: CONTENT, round: round * 997 });
      for (let t = 0; t < 400; t++) {
        game.state.monsters.length = 0;
        const result = game.act({ type: 'wait' })!;
        const arrived = game.state.monsters[0];
        if (!arrived || !result.messages.some((m) => m.text.includes('Something stirs'))) continue;
        expect(distanceSq(arrived, game.state.map.player)).toBeGreaterThan(2);
        expect(arrived.awareness).toBe('alert');
        return;
      }
    }
    throw new Error('no wanderer arrived in 24,000 turns');
  });

  it('do not disturb the dice of a fight: the arrival check has a stream of its own', () => {
    const a = gameOn(levelWith(0));
    const b = gameOn(levelWith(0));
    const sequence = (g: Game): number[] => Array.from({ length: 5 }, () => g.rng.int(1, 6));
    for (let i = 0; i < 50; i++) a.act({ type: 'wait' });
    expect(sequence(a)).toEqual((() => { for (let i = 0; i < 50; i++) b.act({ type: 'wait' }); return sequence(b); })());
  });
});

