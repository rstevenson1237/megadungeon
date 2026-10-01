import { describe, expect, it } from 'vitest';
import { isIdentified } from '../src/rules/items/magic.ts';
import { itemValue, sellPrice } from '../src/rules/items/prices.ts';
import { shopStock, SPELLBOOK_ONE_IN } from '../src/rules/villages/stock.ts';
import type { Item, TreasureItem } from '../src/rules/items/types.ts';
import { ITEMS, SPELLS, gear, magic, townRun } from './helpers.ts';

const said = (r: { messages: { text: string }[] }): string => r.messages.map((m) => m.text).join(' | ');
const names = (items: readonly Item[]): string[] => items.map((i) => i.id);
let uid = 5000;
const gem = (value: number): TreasureItem => ({ kind: 'gem', uid: uid++, id: 'gem_stub_ruby', name: 'ruby', value });

describe('Spec 05 and 07: what a shop stocks', () => {
  it('the surface sells normal weapons, armour and shields, all ammunition, and Healing, Clarity and Cure only', () => {
    const stock = shopStock(ITEMS, SPELLS, 1, 0, 0, 0);
    for (const item of stock) {
      if (item.kind === 'weapon' || item.kind === 'ranged' || item.kind === 'armour' || item.kind === 'shield') expect(item.quality).toBe('normal');
    }
    expect(stock.filter((i) => i.kind === 'potion').map((i) => i.id).sort()).toEqual(['potion_clarity', 'potion_cure', 'potion_healing']);
    expect(names(stock.filter((i) => i.kind === 'ammo')).sort()).toEqual(['arrows', 'bolts', 'sling_stones']);
    expect(stock.some((i) => i.kind === 'lockpicks' || i.kind === 'spellbook')).toBe(false);
    expect(stock.some((i) => i.kind === 'weapon' && i.id === 'long_sword')).toBe(true);
    expect(stock.some((i) => i.kind === 'armour' && i.id === 'plate')).toBe(true);
    expect(stock.some((i) => i.kind === 'shield')).toBe(true);
  });

  it('deeper shops add fine items, more potion kinds and lockpicks, and sometimes a spellbook', () => {
    const shallow = shopStock(ITEMS, SPELLS, 1, 0, 0, 0);
    const deep = shopStock(ITEMS, SPELLS, 1, 70, 4, 0);
    expect(deep.some((i) => (i.kind === 'weapon' || i.kind === 'armour' || i.kind === 'shield' || i.kind === 'ranged') && i.quality === 'fine')).toBe(true);
    expect(deep.filter((i) => i.kind === 'potion').length).toBeGreaterThan(shallow.filter((i) => i.kind === 'potion').length);
    expect(deep.some((i) => i.kind === 'lockpicks')).toBe(true);
    let withBook = 0;
    const n = 90;
    for (let seed = 1; seed <= n; seed++) if (shopStock(ITEMS, SPELLS, seed, 40, 2, 0).some((i) => i.kind === 'spellbook')) withBook++;
    expect(withBook / n).toBeGreaterThan(0.15);
    expect(withBook / n).toBeLessThan(0.55);
    expect(SPELLBOOK_ONE_IN).toBe(3);
  });

  it('stock is seeded per village and rest count: same inputs, same shelves; another rest, other shelves', () => {
    const a = shopStock(ITEMS, SPELLS, 5, 40, 2, 0);
    expect(shopStock(ITEMS, SPELLS, 5, 40, 2, 0)).toEqual(a);
    expect(shopStock(ITEMS, SPELLS, 5, 40, 2, 1)).not.toEqual(a);
    expect(shopStock(ITEMS, SPELLS, 5, 41, 2, 0)).not.toEqual(a);
  });
});

describe('Spec 07: buying and selling', () => {
  it('buying pays from the bank at the village price, adds the item, and a bought potion is known', () => {
    const run = townRun(4);
    run.player.town.bank = 500;
    const potion = run.town.stock().find((i) => i.kind === 'potion')!;
    const price = run.town.price(potion);
    const result = run.town.buy(potion);
    expect(result.ok).toBe(true);
    expect(run.player.town.bank).toBe(500 - price);
    expect(run.player.pack.some((i) => i.id === potion.id)).toBe(true);
    expect(run.player.known).toContain(potion.id);
    expect(run.town.stock()).not.toContain(potion);
  });

  it('buying with too little in the bank, or with a full pack, is refused and costs nothing', () => {
    const run = townRun(4);
    const sword = run.town.stock().find((i) => i.id === 'long_sword')!;
    run.player.town.bank = 1;
    expect(run.town.buy(sword).ok).toBe(false);
    expect(run.player.town.bank).toBe(1);
    run.player.town.bank = 1000;
    run.player.pack = Array.from({ length: 12 }, () => gear('dagger', 'normal'));
    expect(said(run.town.buy(sword))).toContain('pack is full');
    expect(run.player.town.bank).toBe(1000);
    expect(run.town.stock()).toContain(sword);
  });

  it('a shop pays half the value with no village multiplier, so buying in one village and selling in another is never a profit', () => {
    const deep = townRun(4, { pack: [gear('long_sword', 'normal')] }, 3);
    const row = deep.town.sellable()[0]!;
    expect(row.price).toBe(sellPrice(row.item));
    expect(row.price).toBeLessThan(itemValue(row.item));
    const surface = townRun(4);
    const sword = surface.town.stock().find((i) => i.id === 'long_sword')!;
    expect(surface.town.price(sword)).toBeGreaterThan(row.price);
  });

  it('a crude item pays half of what a normal one does, and the Fence adds 20%', () => {
    const run = townRun(4, { pack: [gear('long_sword', 'crude'), gear('long_sword', 'normal')] });
    const [crude, normal] = run.town.sellable();
    expect(crude!.price * 2).toBe(normal!.price);
    run.character.minorAbilities.push('fence');
    expect(run.town.sellable()[1]!.price).toBe(Math.floor(itemValue(normal!.item) * 0.5 * 1.2));
  });

  it('an unidentified item sells as a plain item of its kind, so identifying first pays', () => {
    const ring = magic('ring_might', false);
    const run = townRun(4, { pack: [ring] });
    const unknown = run.town.sellable()[0]!.price;
    const cheapest = Math.min(...[...ITEMS.magic.values()].filter((m) => m.kind === 'ring').map((m) => m.value));
    expect(unknown).toBe(Math.floor(cheapest * 0.5));
    run.player.town.bank = 500;
    run.town.identify(ring);
    expect(isIdentified(ring, run.player.known)).toBe(true);
    expect(run.town.sellable()[0]!.price).toBe(Math.floor(ring.value * 0.5));
    expect(run.town.sellable()[0]!.price).toBeGreaterThanOrEqual(unknown);
  });

  it('a cursed item cannot be sold while worn, artifacts and quest items cannot be sold at all', () => {
    const cursed = magic('ring_might', true);
    const run = townRun(4, { pack: [], equipment: { ring1: cursed } });
    expect(run.town.sell(cursed).ok).toBe(false);
    expect(run.player.equipment.ring1).toBe(cursed);
    const quest: Item = { kind: 'quest_item', uid: 1, id: 'q', name: 'locket', value: 0, quest: 'x' };
    run.player.pack.push(quest);
    expect(run.town.sellable().map((r) => r.item)).not.toContain(quest);
    const mundane = gear('long_sword', 'normal');
    run.player.equipment.main = mundane;
    expect(run.town.sell(mundane).ok).toBe(true);
    expect(run.player.equipment.main).toBeUndefined();
  });
});

describe('Spec 07: the appraiser and the smith', () => {
  it('appraising values every gem and jewelry piece at once, for free, and the value is fixed', () => {
    const a = gem(500);
    const b = gem(100);
    const run = townRun(6, { pack: [a, b] });
    const bank = run.player.town.bank;
    const result = run.town.appraise();
    expect(result.ok).toBe(true);
    expect(run.player.town.bank).toBe(bank);
    for (const piece of [a, b]) {
      expect(piece.appraised).toBeGreaterThanOrEqual(Math.round(piece.value * 0.6) - 1);
      expect(piece.appraised).toBeLessThanOrEqual(Math.round(piece.value * 1.2) + 1);
    }
    const fixed = a.appraised;
    expect(run.town.appraise().ok).toBe(false);
    expect(a.appraised).toBe(fixed);
  });

  it('identify costs 100 gp times the multiplier, and shows the true name and any curse', () => {
    const ring = magic('ring_might', true);
    const run = townRun(6, { pack: [ring] }, 2);
    run.player.town.bank = 1000;
    const result = run.town.identify(ring);
    expect(result.ok).toBe(true);
    expect(run.player.town.bank).toBe(1000 - 140);
    expect(said(result)).toContain('Ring of Might');
    expect(said(result)).toContain('cursed');
    expect(run.town.identify(ring).ok).toBe(false);
  });

  it('the smith repairs a broken piece for 30% of its value times the multiplier', () => {
    const sword = gear('long_sword', 'normal', { broken: true });
    const run = townRun(6, { pack: [sword] }, 1);
    run.player.town.bank = 500;
    expect(run.town.broken()).toEqual([sword]);
    const price = Math.ceil(itemValue(sword) * 0.3 * 1.2);
    expect(run.town.repairPrice(sword)).toBe(price);
    expect(run.town.repair(sword).ok).toBe(true);
    expect(sword.broken).toBe(false);
    expect(run.player.town.bank).toBe(500 - price);
    expect(run.town.repair(sword).ok).toBe(false);
  });
});
