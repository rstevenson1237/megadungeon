import { describe, expect, it } from 'vitest';
import { STARTING_BANK } from '../src/game/town-state.ts';
import { lodgingPrice } from '../src/rules/villages/economy.ts';
import { treasureBudget } from '../src/rules/world/depth.ts';
import {
  PACE_TARGET,
  PARITY_DEPTHS,
  characterAt,
  foesFor,
  gauntlet,
  measureEconomy,
  measureParity,
  measurePace,
  parityContentOf,
  type PaceReport,
} from '../tools/balance.ts';
import { content } from './helpers.ts';

// Task 4.11, balance runs (plan, "Balance playtests"): the gate is character level 10 near depth 50 to 55 and no class
// far behind. These runs are smaller than the report's (`npm run balance`), and seeded, so they always give the same
// numbers on the same tables: a content change that moves the balance out of its band fails here.

const bundle = content().bundle;
const seeds = Array.from({ length: 12 }, (_, i) => i + 1);
let paced: PaceReport | undefined;
const pace = (): PaceReport => (paced ??= measurePace(bundle, seeds));

describe('Task 4.11: depth pace (Spec 02, Depth scaling)', () => {
  it('a thorough player reaches character level 10 near depth 50 to 55', () => {
    const [lo, hi] = PACE_TARGET;
    expect(pace().median).toBeGreaterThanOrEqual(lo);
    expect(pace().median).toBeLessThanOrEqual(hi);
    // Every seed lands within a few levels of the band.
    for (const d of pace().levelTen) {
      expect(d).toBeGreaterThanOrEqual(lo - 3);
      expect(d).toBeLessThanOrEqual(hi + 3);
    }
  }, 120_000);

  it('the levels hold the treasure the depth table budgets, quests on top', () => {
    for (const depth of [20, 55, 99]) {
      let nominal = 0;
      for (let d = 1; d <= depth; d++) nominal += treasureBudget(d);
      const measured = pace().meanCumulative[depth]!;
      expect(measured / nominal).toBeGreaterThan(0.85);
      expect(measured / nominal).toBeLessThan(1.25);
    }
  }, 120_000);

  it('the character level on arrival climbs with depth and is 10 by depth 60', () => {
    const levels = pace().levelOnArrival;
    for (let d = 2; d < levels.length; d++) expect(levels[d]!).toBeGreaterThanOrEqual(levels[d - 1]!);
    expect(levels[1]).toBe(1);
    expect(levels[60]).toBe(10);
  }, 120_000);
});

describe('Task 4.11: economy (Spec 07)', () => {
  it('the starting bank pays for a rest, and every subterranean village basket costs less than one level below it pays', () => {
    expect(STARTING_BANK).toBeGreaterThanOrEqual(lodgingPrice(0));
    const economy = measureEconomy(pace(), parityContentOf(bundle).items);
    for (const v of economy.slice(1)) expect(v.basket).toBeLessThan(v.levelIncome);
    // Prices only rise with depth.
    for (let i = 1; i < economy.length; i++) expect(economy[i]!.basket).toBeGreaterThan(economy[i - 1]!.basket);
  }, 120_000);
});

describe('Task 4.11: class parity (Spec 03)', () => {
  const pc = parityContentOf(bundle);

  it('every class reaches level 10 with 6 Combat dice and 12 dice in all', () => {
    for (const cls of pc.classes) {
      const p = characterAt(pc, cls, 10, 1);
      expect(p.level).toBe(10);
      expect(p.pools.combat.max).toBe(6);
      expect(p.pools.combat.max + p.pools.skill.max + p.pools.magic.max).toBe(12);
    }
  });

  it('a gauntlet is deterministic: the same seed wins the same fights', () => {
    const foes = foesFor(bundle, 20);
    const cls = pc.classes[0]!;
    expect(gauntlet(pc, cls, 5, 20, foes, 7)).toBe(gauntlet(pc, cls, 5, 20, foes, 7));
  });

  it('no class wins fewer than half the fights of the median class', () => {
    const report = measureParity(pc, pace().levelOnArrival, 6, PARITY_DEPTHS);
    expect(report.rows).toHaveLength(20);
    expect(report.farBehind).toEqual([]);
  }, 300_000);
});
