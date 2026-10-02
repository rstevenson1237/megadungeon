import { packCapacity } from '../src/rules/items/inventory.ts';
import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game.ts';
import { carriedEstimate, appraise, bankable, depositValue, theftTake, APPRAISAL_HIGH, APPRAISAL_LOW } from '../src/rules/items/treasure.ts';
import {
  SELL_RATE, TRADER_RATE, buyPrice, identifyPrice, itemValue, repairPrice, sellPrice, traderPrice, villageMultiplier,
} from '../src/rules/items/prices.ts';
import type { TreasureItem, WornItem } from '../src/rules/items/types.ts';
import { ITEMS, ammo, gameOn, gear, magic, monsterAt, room, testPlayer } from './helpers.ts';

const gem = (value: number, uid = value, extra: Partial<TreasureItem> = {}): TreasureItem => ({ kind: 'gem', uid, id: 'gem_stub_quartz', name: 'quartz', value, ...extra });
const jewel = (value: number, uid = value, extra: Partial<TreasureItem> = {}): TreasureItem => ({ kind: 'jewelry', uid, id: 'jewelry_stub_brooch', name: 'brooch', value, ...extra });

describe('Spec 05: prices follow the depth multiplier and the sell rate', () => {
  it('list prices rise 20% for each village below the surface: the fifth below charges 200%', () => {
    [1, 1.2, 1.4, 1.6, 1.8, 2].forEach((m, n) => expect(villageMultiplier(n)).toBeCloseTo(m, 10));
  });

  it('a village charges value times its multiplier for every kind of item', () => {
    const sword = gear('long_sword', 'normal');
    expect(buyPrice(sword, 0)).toBe(40);
    expect(buyPrice(sword, 1)).toBe(48);
    expect(buyPrice(sword, 5)).toBe(80);
    expect(buyPrice(gear('plate', 'normal'), 3)).toBe(Math.ceil(250 * 1.6));
    expect(buyPrice(ammo('arrows', 20), 0)).toBe(5);
    expect(buyPrice(ammo('bolts', 40), 5)).toBe(32);
    expect(buyPrice(magic('potion_healing'), 2)).toBe(70);
  });

  it('quality scales the value: crude half, normal one, fine three times; an artifact has none', () => {
    expect([itemValue(gear('long_sword', 'crude')), itemValue(gear('long_sword', 'normal')), itemValue(gear('long_sword', 'fine')), itemValue(gear('long_sword', 'artifact'))]).toEqual([20, 40, 120, 0]);
  });

  it('shops pay half the value, with no depth multiplier, and the Fence adds 20% of that', () => {
    expect(SELL_RATE).toBe(0.5);
    const sword = gear('long_sword', 'normal');
    expect(sellPrice(sword)).toBe(20);
    expect(sellPrice(sword, 20)).toBe(24);
    expect(sellPrice(gear('long_sword', 'crude'))).toBe(10); // half of what a normal one fetches
    expect(sellPrice(gear('long_sword', 'fine'))).toBe(60);
    // Buying in a deep village and selling elsewhere is never a profit.
    for (let village = 0; village <= 6; village++) expect(sellPrice(sword)).toBeLessThan(buyPrice(sword, village) || 1);
  });

  it('an artifact is priceless: it cannot be sold', () => {
    expect(sellPrice(gear('long_sword', 'artifact'))).toBe(0);
    expect(sellPrice({ ...(magic('ring_might') as WornItem), value: 0 })).toBe(0);
  });

  it('traders in the dungeon sell at 150% of value', () => {
    expect(TRADER_RATE).toBe(1.5);
    expect(traderPrice(magic('ring_might'))).toBe(450);
  });

  it('the potion prices of the spec: Healing 50, Clarity 60, Cure 40', () => {
    expect([ 'potion_healing', 'potion_clarity', 'potion_cure'].map((id) => buyPrice(magic(id), 0))).toEqual([50, 60, 40]);
  });

  it('identification costs 100 gp at the surface and more deeper; repair is 30% of value', () => {
    expect([0, 1, 5].map(identifyPrice)).toEqual([100, 120, 200]);
    const sword = gear('long_sword', 'normal');
    expect(repairPrice(sword, 0)).toBe(12);
    expect(repairPrice(sword, 5)).toBe(24);
    expect(repairPrice(gear('long_sword', 'fine'), 0)).toBe(36);
  });

  it('every base has the price of the spec, and ammunition prices count per 20', () => {
    for (const [id, price] of [['dagger', 5], ['short_sword', 15], ['mace', 30], ['long_sword', 40], ['quarterstaff', 10], ['spear', 20], ['great_axe', 60],
      ['sling', 5], ['shortbow', 30], ['longbow', 75], ['crossbow', 60], ['leather', 20], ['chain', 80], ['plate', 250], ['round_shield', 10], ['tower_shield', 40]] as const) {
      expect(itemValue(gear(id, 'normal')), id).toBe(price);
    }
    expect(itemValue(ammo('sling_stones', 20))).toBe(1);
    expect(itemValue(ammo('arrows', 20))).toBe(5);
    expect(itemValue(ammo('bolts', 20))).toBe(8);
    expect(ITEMS.bases.size).toBe(20); // 16 gear bases, 3 ammunition types and the lockpicks
  });
});

describe('Spec 05: appraisal and banking', () => {
  it('values a piece at 60% to 120% of base, rolled once and fixed after', () => {
    const values: number[] = [];
    for (let uid = 0; uid < 800; uid++) {
      const piece = gem(1000, uid);
      const v = appraise(1, piece);
      values.push(v);
      expect(v).toBeGreaterThanOrEqual(1000 * APPRAISAL_LOW);
      expect(v).toBeLessThanOrEqual(1000 * APPRAISAL_HIGH);
      expect(piece.appraised).toBe(v);
      expect(appraise(999, piece)).toBe(v); // another seed or another visit changes nothing
    }
    expect(Math.min(...values)).toBeLessThan(640);
    expect(Math.max(...values)).toBeGreaterThan(1160);
    expect(values.reduce((a, b) => a + b, 0) / values.length).toBeGreaterThan(850);
    expect(values.reduce((a, b) => a + b, 0) / values.length).toBeLessThan(950);
  });

  it('depends on the run seed and the piece, so the same piece is the same in the same run', () => {
    expect(appraise(5, gem(500, 3))).toBe(appraise(5, gem(500, 3)));
    const seeds = new Set<number>();
    for (let seed = 0; seed < 50; seed++) seeds.add(appraise(seed, gem(500, 3)));
    expect(seeds.size).toBeGreaterThan(20);
  });

  it('unappraised gems and jewelry cannot be banked; coins and appraised pieces can', () => {
    const raw = gem(100);
    const done = jewel(600, 1, { appraised: 700 });
    expect(bankable(raw)).toBe(false);
    expect(bankable(done)).toBe(true);
    expect(bankable(gear('mace'))).toBe(true);
    expect(depositValue([raw, done])).toBe(700);
    appraise(1, raw);
    expect(bankable(raw)).toBe(true);
    expect(depositValue([raw, done])).toBe(700 + raw.appraised!);
  });

  it('the carried estimate counts coins at face value and gems and jewelry at base value until appraised', () => {
    expect(carriedEstimate(250, [gem(100), jewel(600), gear('mace')])).toBe(950);
    expect(carriedEstimate(0, [jewel(600, 1, { appraised: 700 })])).toBe(700);
  });
});

describe('Spec 05 and 04: bandits steal 10% of the carried treasure', () => {
  it('takes coins first: 10% of the total, rounded up, at least 1 gp', () => {
    expect(theftTake(100, [])).toEqual({ coins: 10, pieces: [] });
    expect(theftTake(95, [])).toEqual({ coins: 10, pieces: [] });
    expect(theftTake(3, [])).toEqual({ coins: 1, pieces: [] });
    expect(theftTake(0, [])).toEqual({ coins: 0, pieces: [] });
    expect(theftTake(100, [gem(100)])).toEqual({ coins: 20, pieces: [] }); // 10% of 200
  });

  it('when coins do not cover it, takes the cheapest pieces until it does', () => {
    const cheap = gem(50);
    const dear = jewel(600);
    const mid = gem(200);
    const take = theftTake(5, [dear, mid, cheap]);
    expect(take.coins).toBe(5); // 10% of 855 = 86: coins first
    expect(take.pieces).toEqual([cheap, mid]);
    expect(theftTake(0, [dear]).pieces).toEqual([dear]);
  });

  it('in play, the bandit takes the coins and then the piece that covers the rest', () => {
    const game = gameOn(room(8, 3, 1, 2), { combatDice: 6, combatMax: 6, coins: 2, pack: [gem(50)], equipment: {} });
    const bandit = monsterAt(2, 2, { alert: true, kind: 'bandit', modifier: 30, dice: 3, maxDice: 3 });
    game.state.monsters.push(bandit);
    const said = game.act({ type: 'wait' })!.messages.map((m) => m.text);
    expect(game.state.player.coins).toBe(0);
    expect(game.state.player.pack).toEqual([]);
    expect(said).toContain('Goblin steals 2 gp.');
    expect(said).toContain('Goblin steals your quartz.');
    expect(bandit.carried).toEqual([{ kind: 'coins', amount: 2 }, { kind: 'item', item: expect.objectContaining({ kind: 'gem', value: 50 }) }]);
    expect(bandit.thefts).toBe(1);
  });

  it('in play, coins that cover 10% are all it takes', () => {
    const game = gameOn(room(8, 3, 1, 2), { combatDice: 6, combatMax: 6, coins: 10, pack: [gem(50)], equipment: {} });
    const bandit = monsterAt(2, 2, { alert: true, kind: 'bandit', modifier: 30, dice: 3, maxDice: 3 });
    game.state.monsters.push(bandit);
    game.act({ type: 'wait' });
    expect(game.state.player.coins).toBe(4); // 10% of 60 is 6
    expect(game.state.player.pack).toHaveLength(1);
  });

  it('a theft that finds no treasure takes nothing and does not count', () => {
    const game = gameOn(room(8, 3, 1, 2), { combatDice: 6, combatMax: 6, coins: 0, pack: [], equipment: {} });
    const bandit = monsterAt(2, 2, { alert: true, kind: 'bandit', modifier: 30, dice: 3, maxDice: 3 });
    game.state.monsters.push(bandit);
    game.act({ type: 'wait' });
    expect(bandit.thefts).toBe(0);
  });

  it('a killed bandit drops what it stole, gems included, where it falls', () => {
    const stolen = gem(50);
    const game = gameOn(room(8, 3, 1, 2), { combatDice: 6, combatMax: 6, pack: [], equipment: { main: gear('great_axe') } });
    const bandit = monsterAt(2, 2, { alert: true, kind: 'bandit', modifier: -6, dice: 1, maxDice: 1, carried: [{ kind: 'coins', amount: 7 }, { kind: 'item', item: stolen }] });
    game.state.monsters.push(bandit);
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(game.state.drops[0]!.contents).toEqual([{ kind: 'coins', amount: 7 }, { kind: 'item', item: stolen }]);
    game.state.map.player = { x: 2, y: 2 };
    game.act({ type: 'pickup' });
    expect(game.state.player.pack).toContain(stolen);
    expect(game.state.player.coins).toBe(7);
  });
});

describe('Spec 05: a new run carries 12 slots', () => {
  it('a new player has an empty pack of 12 slots and no known items', () => {
    const p = new Game(1, room(5, 5, 2, 2), testPlayer({ pack: [], equipment: {} }), { items: ITEMS }).state.player;
    expect([packCapacity(), p.minorAbilities, p.known, p.invisible, p.reload]).toEqual([12, [], [], 0, 0]);
  });
});
