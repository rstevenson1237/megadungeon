import { describe, expect, it } from 'vitest';
import { applyStatus, hasStatus } from '../src/rules/magic/status.ts';
import { levelsOwed } from '../src/rules/character/progression.ts';
import { itemValue, villageMultiplier } from '../src/rules/items/prices.ts';
import { fareFactor, fareToPay, liftFare } from '../src/rules/villages/lift.ts';
import { ALWAYS, SERVICE_ODDS, SERVICES, rollServices, servicesOf } from '../src/rules/villages/services.ts';
import type { TreasureItem } from '../src/rules/items/types.ts';
import { gear, magic, townRun } from './helpers.ts';

let uid = 1000;
const gem = (value = 500, appraised?: number): TreasureItem => ({ kind: 'gem', uid: uid++, id: 'gem_stub_ruby', name: 'ruby', value, ...(appraised !== undefined ? { appraised } : {}) });
const said = (r: { messages: { text: string }[] }): string => r.messages.map((m) => m.text).join(' | ');

describe('Spec 07: which services a village has', () => {
  it('the surface has every service', () => {
    expect(rollServices(1, 0)).toEqual([...SERVICES]);
  });

  it('every subterranean village has bank, lodging and lift, and its other services match its seeded rolls', () => {
    for (let seed = 1; seed <= 40; seed++) {
      for (const depth of [4, 23, 51, 77, 94]) {
        const rolled = rollServices(seed, depth);
        for (const always of ALWAYS) expect(rolled).toContain(always);
        expect(rollServices(seed, depth)).toEqual(rolled); // seeded: the same every time
      }
    }
  });

  it('the odds are 75% shop, 60% appraiser, 50% smith and 75% tavern over many villages', () => {
    const counts = { shop: 0, appraiser: 0, smith: 0, tavern: 0 };
    const n = 4000;
    for (let i = 1; i <= n; i++) {
      const found = rollServices(i, 1 + (i % 99));
      for (const k of Object.keys(counts) as (keyof typeof counts)[]) if (found.includes(k)) counts[k]++;
    }
    for (const k of Object.keys(counts) as (keyof typeof counts)[]) expect(counts[k] / n).toBeCloseTo(SERVICE_ODDS[k] / 100, 1);
  });

  it('a rescued specialist adds the missing service to the village it is delivered to, and only that one', () => {
    const seed = [...Array(200).keys()].map((i) => i + 1).find((s) => !rollServices(s, 40).includes('smith'))!;
    expect(servicesOf(seed, 40)).not.toContain('smith');
    expect(servicesOf(seed, 40, { smith: [40] })).toContain('smith');
    expect(servicesOf(seed, 41, { smith: [40] })).toEqual(rollServices(seed, 41));
  });

  it('the run reads its services from the run seed, and the surface lists them all', () => {
    const run = townRun(12345);
    expect(run.town.services()).toEqual([...SERVICES]);
    const below = townRun(12345, {}, 1);
    expect(below.depth).toBe(below.layout!.villages[0]!.level);
    expect(below.town.services()).toEqual(rollServices(12345, below.depth));
  });
});

describe('Spec 07: prices in a village', () => {
  it('every price is the surface price times 1 + 0.2 per village below the surface', () => {
    for (const at of [0, 1, 3, 5]) {
      const run = townRun(777, {}, at);
      if (!run.town.services().includes('shop')) continue;
      const mult = villageMultiplier(at);
      for (const item of run.town.stock()) expect(run.town.price(item)).toBe(Math.ceil(itemValue(item) * mult));
      expect(run.town.restPrice).toBe(Math.ceil(10 * mult));
      expect(run.town.identifyPrice).toBe(Math.ceil(100 * mult));
      expect(run.town.rumourPrice).toBe(Math.ceil(25 * mult));
    }
    expect(villageMultiplier(1)).toBeCloseTo(1.2);
    expect(villageMultiplier(5)).toBeCloseTo(2);
  });
});

describe('Spec 07: the bank', () => {
  it('a new character starts with 20 gp in the bank', () => {
    expect(townRun().player.town.bank).toBe(20);
  });

  it('a deposit banks coins and appraised pieces at 1 XP per gp, and holds unappraised ones back', () => {
    const run = townRun(1, { coins: 300, pack: [gem(500, 450), gem(200)] });
    const result = run.town.deposit();
    expect(result.ok).toBe(true);
    expect(run.player.town.bank).toBe(20 + 750);
    expect(run.character.xp).toBe(750);
    expect(run.player.coins).toBe(0);
    expect(run.player.pack).toHaveLength(1);
    expect(run.player.pack[0]).toMatchObject({ value: 200 });
    expect(said(result)).toContain('1 unappraised piece is kept back');
  });

  it('a deposit with nothing to bank says so and changes nothing', () => {
    const run = townRun(1, { coins: 0, pack: [gem(200)] });
    expect(run.town.deposit().ok).toBe(false);
    expect(run.character.xp).toBe(0);
    expect(run.player.town.bank).toBe(20);
  });

  it('crossing thresholds owes one level-up per level crossed, and none is owed under the first threshold', () => {
    const run = townRun(1, { coins: 1999 });
    run.town.deposit();
    expect(run.levelsOwed).toBe(0);
    const more = townRun(1, { coins: 4500 });
    more.town.deposit();
    expect(more.character.xp).toBe(4500);
    expect(levelsOwed(more.character)).toBe(2); // 2,000 and 4,000
    expect(more.levelsOwed).toBe(2);
    more.levelUp('combat');
    expect(more.levelsOwed).toBe(1);
  });

  it('a level up adds a die in the chosen pool to the character and to the player, arriving full', () => {
    const run = townRun(1, { coins: 2000 });
    const before = run.player.skill.max;
    run.town.deposit();
    const result = run.levelUp('skill');
    expect(result?.level).toBe(2);
    expect(run.player.skill.max).toBe(before + 1);
    expect(run.player.skill.dice).toBe(run.player.skill.max);
    expect(run.character.level).toBe(2);
  });

  it('selling adds gold to the bank and earns no XP; every service the balance cannot cover is refused and the bank never goes negative', () => {
    const run = townRun(1, { pack: [gear('long_sword', 'normal')] });
    const row = run.town.sellable()[0]!;
    run.town.sell(row.item);
    expect(run.player.town.bank).toBe(20 + row.price);
    expect(run.character.xp).toBe(0);
    run.player.town.bank = 3;
    for (const result of [run.town.rest(), run.town.rumour()]) expect(result.ok).toBe(false);
    expect(run.player.town.bank).toBe(3);
    run.player.pack.push(magic('ring_might', true));
    expect(run.town.identify(run.town.unidentified()[0]!).ok).toBe(false);
    expect(run.player.town.bank).toBe(3);
  });
});

describe('Spec 07: lodging', () => {
  it('a rest costs 10 gp times the multiplier, restores every pool, clears timed effects but not curses, and passes 200 turns', () => {
    const run = townRun(2, {}, 1);
    run.player.town.bank = 100;
    run.player.combatDice = 0;
    run.player.skill.dice = 0;
    run.player.magic.dice = 0;
    applyStatus(run.player.statuses, 'poisoned', 10);
    applyStatus(run.player.statuses, 'slowed', 10);
    applyStatus(run.player.statuses, 'blessed', null);
    applyStatus(run.player.statuses, 'cursed', null);
    const round = run.round;
    const result = run.town.rest();
    expect(result.ok).toBe(true);
    expect(run.player.town.bank).toBe(100 - 12);
    expect(run.player.combatDice).toBe(run.player.combatMax);
    expect(run.player.skill.dice).toBe(run.player.skill.max);
    expect(run.player.magic.dice).toBe(run.player.magic.max);
    for (const id of ['poisoned', 'slowed', 'blessed'] as const) expect(hasStatus(run.player.statuses, id)).toBe(false);
    expect(hasStatus(run.player.statuses, 'cursed')).toBe(true);
    expect(run.round).toBe(round + 200);
    expect(run.player.rests).toBe(1);
  });

  it('a rest saves the game: it calls the run\'s save hook, and a refused rest does not', () => {
    const run = townRun(2);
    let saves = 0;
    run.onRest = () => saves++;
    run.player.town.bank = 5;
    run.town.rest();
    expect(saves).toBe(0);
    run.player.town.bank = 50;
    run.town.rest();
    expect(saves).toBe(1);
  });

  it('shop stock is the same until the next rest, and is rolled afresh after it', () => {
    const run = townRun(3, {}, 1);
    if (!run.town.services().includes('shop')) return;
    run.player.town.bank = 500;
    const first = run.town.stock();
    expect(run.town.stock()).toBe(first);
    run.town.rest();
    expect(run.town.stock()).not.toBe(first);
  });
});

describe('Spec 07: the lift', () => {
  it('the fare follows the formula with a seeded factor of 0.8 to 1.2, the same both ways and fixed for the pair', () => {
    for (const [a, b, base] of [[0, 17, 114], [17, 33, 133], [0, 33, 274], [70, 90, 280], [0, 90, 1260]] as const) {
      const f = fareFactor(9, a, b);
      expect(f).toBeGreaterThanOrEqual(0.8);
      expect(f).toBeLessThanOrEqual(1.2);
      expect(liftFare(9, a, b)).toBe(liftFare(9, b, a));
      expect(liftFare(9, a, b)).toBeGreaterThanOrEqual(Math.floor(base * 0.8) - 2);
      expect(liftFare(9, a, b)).toBeLessThanOrEqual(Math.ceil(base * 1.2) + 2);
      expect(liftFare(9, a, b)).toBe(Math.round(10 * (b - a) * (0.5 + b / 100) * f));
    }
    expect(liftFare(9, 5, 5)).toBe(0);
  });

  it('at a factor of 1.0 the fares are those of the spec table', () => {
    const base = (from: number, to: number): number => Math.round(10 * (to - from) * (0.5 + to / 100));
    expect([base(0, 17), base(17, 33), base(0, 33), base(70, 90), base(0, 90)]).toEqual([114, 133, 274, 280, 1260]);
  });

  it('a different run seed gives a different factor, and the fare rises with distance', () => {
    const seeds = new Set([1, 2, 3, 4, 5, 6].map((s) => fareFactor(s, 0, 20)));
    expect(seeds.size).toBeGreaterThan(1);
    expect(liftFare(4, 0, 20)).toBeLessThan(liftFare(4, 0, 90));
  });

  it('lists only visited villages with their fares, and a ride is paid from the bank and arrives in the village', () => {
    const run = townRun(21);
    expect(run.town.trips()).toEqual([]);
    const second = run.layout!.villages[1]!.level;
    run.player.town.visited.push(second);
    run.player.town.bank = 5000;
    const [trip] = run.town.trips();
    expect(trip).toMatchObject({ depth: second, fare: liftFare(21, 0, second) });
    const result = run.town.ride(second);
    expect(result.ok).toBe(true);
    expect(run.depth).toBe(second);
    expect(run.inVillage).toBe(true);
    expect(run.player.town.bank).toBe(5000 - trip!.fare);
    // And back, for the same fare.
    expect(run.town.trips().find((t) => t.depth === 0)!.fare).toBe(trip!.fare);
  });

  it('a ride the balance cannot cover is refused and the player stays', () => {
    const run = townRun(21);
    const deep = run.layout!.villages[4]!.level;
    run.player.town.visited.push(deep);
    run.player.town.bank = 10;
    expect(run.town.ride(deep).ok).toBe(false);
    expect(run.depth).toBe(0);
    expect(run.player.town.bank).toBe(10);
    expect(run.town.ride(1).ok).toBe(false);
  });

  it('arriving in a village by the stairs marks it visited, so the lift lists it afterwards', () => {
    const run = townRun(21);
    const first = run.layout!.villages[0]!.level;
    expect(run.player.town.visited).toEqual([0]);
    run.depth = first;
    run.town.onArrive();
    expect(run.player.town.visited).toContain(first);
  });

  it('a lift token halves the fare, rounded up', () => {
    expect(fareToPay(5, 0, 40, true)).toBe(Math.ceil(liftFare(5, 0, 40) / 2));
    expect(fareToPay(5, 0, 40, false)).toBe(liftFare(5, 0, 40));
  });
});
