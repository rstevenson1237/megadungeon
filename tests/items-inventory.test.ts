import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng.ts';
import { classesFrom } from '../src/rules/character/classes.ts';
import { BREAK_PERCENT, QUALITY_VALUE, breaks, derive } from '../src/rules/items/gear.ts';
import {
  PACK_BASE, PER_SLOT, addCoins, addToPack, equip, freeSlots, packCapacity, slotsUsed, unequip,
} from '../src/rules/items/inventory.ts';
import { startingKit } from '../src/rules/items/kit.ts';
import type { Equipment, Item } from '../src/rules/items/types.ts';
import { ITEMS, ammo, content, gear, gameOn, magic, room } from './helpers.ts';

const base = (id: string) => ITEMS.bases.get(id)!;
const key = (n = 1): Item => ({ kind: 'key', uid: 1, id: 'key', name: 'key', value: 0, count: n });
const potion = (count = 1, id = 'potion_healing'): Item => ({ ...(magic(id) as Extract<Item, { kind: 'potion' }>), count });
const gem = (n = 1): Item[] => Array.from({ length: n }, (_, i) => ({ kind: 'gem', uid: i, id: 'gem_stub_quartz', name: 'quartz', value: 25 }));
const jewel = (n = 1): Item[] => Array.from({ length: n }, (_, i) => ({ kind: 'jewelry', uid: i, id: 'jewelry_stub_brooch', name: 'brooch', value: 150 }));

describe('Spec 05: the equipment bases are the tables of the spec', () => {
  const melee: [string, number, number, string[], number][] = [
    ['dagger', 1, 0, ['light', 'throwable'], 5], ['short_sword', 1, 0, ['light'], 15], ['mace', 1, 1, ['stun'], 30],
    ['long_sword', 1, 1, [], 40], ['quarterstaff', 2, 0, ['defence'], 10], ['spear', 2, 1, ['reach'], 20], ['great_axe', 2, 2, [], 60],
  ];
  it('lists the seven melee weapons with their hands, modifier, traits and price', () => {
    for (const [id, hands, mod, traits, price] of melee) {
      expect(base(id), id).toMatchObject({ type: 'melee', hands, modifier: mod, price });
      expect(base(id).traits ?? [], id).toEqual(traits);
    }
  });

  it('lists the four ranged weapons with range, ammunition and price, and the crossbow traits', () => {
    expect(['sling', 'shortbow', 'longbow', 'crossbow'].map((id) => [base(id).range, base(id).ammo, base(id).price])).toEqual([
      [6, 'stone', 5], [8, 'arrow', 30], [10, 'arrow', 75], [8, 'bolt', 60],
    ]);
    expect(base('crossbow').traits).toEqual(['reload', 'heavy']);
  });

  it('lists the armour and shields, and the ammunition prices per 20', () => {
    expect(['leather', 'chain', 'plate', 'round_shield', 'tower_shield'].map((id) => [base(id).modifier, base(id).price])).toEqual([[1, 20], [2, 80], [3, 250], [1, 10], [2, 40]]);
    expect(base('chain').traits).toEqual(['no_stealth_buff']);
    expect(base('plate').traits).toEqual(['notice_advantage', 'spell_penalty']);
    expect(base('tower_shield').traits).toEqual(['ranged_penalty']);
    expect(['sling_stones', 'arrows', 'bolts'].map((id) => [base(id).per, base(id).price])).toEqual([[20, 1], [20, 5], [20, 8]]);
  });

  it('has the 16 bases the catalog asks for', () => {
    expect([...ITEMS.bases.values()].filter((b) => b.type !== 'ammo' && b.type !== 'tool')).toHaveLength(16);
  });
});

describe('Spec 05: slots', () => {
  const used = (coins: number, pack: Item[]) => slotsUsed({ coins, pack });

  it('coins and gems fill a slot per 100', () => {
    for (const [coins, slots] of [[0, 0], [1, 1], [100, 1], [101, 2], [250, 3]] as const) expect(used(coins, []), `${coins} gp`).toBe(slots);
    for (const [n, slots] of [[1, 1], [100, 1], [101, 2]] as const) expect(used(0, gem(n)), `${n} gems`).toBe(slots);
    expect(PER_SLOT).toMatchObject({ coins: 100, gems: 100, ammo: 20, keys: 10, potions: 5 });
  });

  it('ammunition fills a slot per 20 of one type; different types do not share', () => {
    expect(used(0, [ammo('arrows', 20)])).toBe(1);
    expect(used(0, [ammo('arrows', 21)])).toBe(2);
    expect(used(0, [ammo('arrows', 5), ammo('bolts', 5)])).toBe(2);
  });

  it('keys fill a slot per 10, potions of one kind per 5, jewelry and most other things one each', () => {
    expect(used(0, [key(10)])).toBe(1);
    expect(used(0, [key(11)])).toBe(2);
    expect(used(0, [potion(5)])).toBe(1);
    expect(used(0, [potion(6)])).toBe(2);
    expect(used(0, [potion(1, 'potion_healing'), potion(1, 'potion_cure')])).toBe(2);
    expect(used(0, jewel(3))).toBe(3);
    expect(used(0, [gear('mace'), gear('dagger'), magic('ring_might')])).toBe(3);
  });

  it('two-handed weapons and plate take two slots when carried, and nothing when equipped', () => {
    expect(used(0, [gear('great_axe')])).toBe(2);
    expect(used(0, [gear('spear')])).toBe(2);
    expect(used(0, [gear('plate')])).toBe(2);
    expect(used(0, [gear('long_sword')])).toBe(1);
    const game = gameOn(room(5, 5, 2, 2), { equipment: { main: gear('great_axe'), body: gear('plate') }, pack: [] });
    expect(slotsUsed(game.state.player)).toBe(0);
  });

  it('the pack has 12 slots, and each Pack Mule draw adds 2', () => {
    expect(PACK_BASE).toBe(12);
    expect(packCapacity([])).toBe(12);
    expect(packCapacity(['pack_mule', 'hardy', 'pack_mule'])).toBe(16);
  });

  it('a full pack refuses a new item; a stack takes what fits', () => {
    const c = { coins: 0, pack: Array.from({ length: 12 }, () => gear('dagger')) };
    expect(freeSlots(c, 12)).toBe(0);
    expect(addToPack(c, 12, gear('mace'))).toBe(0);
    expect(c.pack).toHaveLength(12);

    const stacks = { coins: 0, pack: [...Array.from({ length: 11 }, () => gear('dagger')), ammo('arrows', 20)] };
    expect(addToPack(stacks, 12, ammo('arrows', 15))).toBe(0); // the stack is full and so is the pack
    const room1 = { coins: 0, pack: [...Array.from({ length: 10 }, () => gear('dagger')), ammo('arrows', 20)] };
    expect(addToPack(room1, 12, ammo('arrows', 50))).toBe(20); // one more slot of 20
    expect(room1.pack.filter((p) => p.kind === 'ammo').length).toBe(1);
    expect(slotsUsed(room1)).toBe(12);
  });

  it('coins fill the last slot and no more', () => {
    const c = { coins: 50, pack: Array.from({ length: 11 }, () => gear('dagger')) };
    expect(addCoins(c, 12, 30)).toBe(30); // still one slot of coins
    expect(addCoins(c, 12, 500)).toBe(20); // up to 100
    expect(c.coins).toBe(100);
  });

  it('identical stacks merge: the same potion, ammunition, keys', () => {
    const c = { coins: 0, pack: [] as Item[] };
    addToPack(c, 12, potion(2));
    addToPack(c, 12, potion(3));
    addToPack(c, 12, key(2));
    addToPack(c, 12, key(1));
    addToPack(c, 12, ammo('arrows', 5));
    addToPack(c, 12, ammo('arrows', 5));
    expect(c.pack.map((p) => [p.kind, 'count' in p ? p.count : 1])).toEqual([['potion', 5], ['key', 3], ['ammo', 10]]);
  });
});

describe('Spec 05: equipping', () => {
  const carrier = (pack: Item[], equipment: Equipment = {}) => ({ coins: 0, pack, equipment });

  it('equipped items use no pack slots', () => {
    const sword = gear('long_sword');
    const c = carrier([sword, gear('leather')]);
    expect(slotsUsed(c)).toBe(2);
    expect(equip(c, 12, sword)).toMatchObject({ ok: true, slot: 'main' });
    expect(slotsUsed(c)).toBe(1);
  });

  it('puts each kind in its slot: weapon, ranged, body, off hand, cloak, boots, gloves, rings', () => {
    const items: [Item, string][] = [
      [gear('mace'), 'main'], [gear('sling'), 'ranged'], [gear('chain'), 'body'], [gear('round_shield'), 'off'],
      [magic('cloak_shadows'), 'cloak'], [magic('boots_speed'), 'boots'], [magic('gloves_finesse'), 'gloves'],
      [magic('ring_might'), 'ring1'], [magic('ring_rest'), 'ring2'],
    ];
    const c = carrier(items.map(([i]) => i));
    for (const [item, slot] of items) expect(equip(c, 12, item), item.name).toMatchObject({ ok: true, slot });
    expect(c.pack).toHaveLength(0);
  });

  it('a third ring is refused, and so is anything that cannot be worn', () => {
    const c = carrier([magic('ring_might'), magic('ring_rest'), magic('ring_stealth'), potion(), gem(1)[0]!]);
    equip(c, 12, c.pack[0]!);
    equip(c, 12, c.pack[0]!);
    const third = equip(c, 12, c.pack[0]!);
    expect(third).toMatchObject({ ok: false, reason: 'Both ring slots are full.' });
    expect(equip(c, 12, c.pack.find((p) => p.kind === 'potion')!)).toMatchObject({ ok: false });
  });

  it('a two-handed weapon and a shield displace each other into the pack', () => {
    const shield = gear('round_shield');
    const axe = gear('great_axe');
    const c = carrier([axe, shield]);
    equip(c, 12, shield);
    expect(c.equipment.off).toBe(shield);
    expect(equip(c, 12, axe)).toMatchObject({ ok: true, displaced: [shield] });
    expect(c.equipment).toEqual({ main: axe });
    expect(c.pack).toEqual([shield]);
    expect(equip(c, 12, shield)).toMatchObject({ ok: true });
    expect(c.equipment).toEqual({ off: shield });
    expect(c.pack).toEqual([axe]);
  });

  it('a displaced item needs room in the pack, or the equip is refused and nothing changes', () => {
    // Taking up the shield sends the great axe (2 slots when carried) to the pack, which has only the shield's slot to spare.
    const shield = gear('round_shield');
    const axe = gear('great_axe');
    const tight = carrier([shield, ...Array.from({ length: 11 }, () => gear('dagger'))], { main: axe });
    const snapshot = JSON.stringify(tight);
    expect(equip(tight, 12, shield)).toMatchObject({ ok: false, reason: 'Your pack is full.' });
    expect(JSON.stringify(tight)).toBe(snapshot);
    // With one slot more it goes through.
    expect(equip(tight, 13, shield)).toMatchObject({ ok: true, slot: 'off', displaced: [axe] });
    expect(tight.equipment).toEqual({ off: shield });
    expect(tight.pack).toContain(axe);
  });

  it('unequip returns an item to the pack, refused when the pack is full', () => {
    const sword = gear('long_sword');
    const c = carrier([], { main: sword });
    expect(unequip(c, 12, 'main')).toMatchObject({ ok: true });
    expect(c.pack).toEqual([sword]);
    const full = carrier(Array.from({ length: 12 }, () => gear('dagger')), { main: gear('mace') });
    expect(unequip(full, 12, 'main')).toMatchObject({ ok: false, reason: 'Your pack is full.' });
  });

  it('a cursed item cannot be removed or displaced until the curse is lifted', () => {
    const cursed = gear('long_sword', 'normal', { cursed: true });
    const other = gear('mace');
    const c = carrier([other], { main: cursed });
    expect(equip(c, 12, other)).toMatchObject({ ok: false });
    expect(unequip(c, 12, 'main')).toMatchObject({ ok: false });
    expect(c.equipment.main).toBe(cursed);
    cursed.cursed = false;
    expect(unequip(c, 12, 'main')).toMatchObject({ ok: true });
  });
});

describe('Spec 05: starting gear', () => {
  const cls = (id: string) => classesFrom(content().bundle).find((c) => c.id === id)!;
  const kit = (id: string) => startingKit(cls(id).gear!, ITEMS);
  const names = (items: Item[]) => items.map((i) => i.name);

  it('Warrior: long sword, shield, leather', () => {
    const k = kit('warrior');
    expect([k.equipment.main?.name, k.equipment.off?.name, k.equipment.body?.name]).toEqual(['Long sword', 'Shield', 'Leather']);
    expect(k.pack).toEqual([]);
  });

  it('Mage: quarterstaff and one potion of Clarity', () => {
    const k = kit('mage');
    expect(k.equipment.main?.name).toBe('Quarterstaff');
    expect(names(k.pack)).toEqual(['Potion of Clarity']);
  });

  it('Thief: short sword, dagger, sling with 20 stones, leather', () => {
    const k = kit('thief');
    expect([k.equipment.main?.name, k.equipment.ranged?.name, k.equipment.body?.name]).toEqual(['Short sword', 'Sling', 'Leather']);
    expect(names(k.pack)).toEqual(['Dagger', 'Sling stones']);
    expect(k.pack.find((i) => i.kind === 'ammo')).toMatchObject({ count: 20 });
  });

  it('Priest: mace, shield, leather, one potion of Healing', () => {
    const k = kit('priest');
    expect([k.equipment.main?.name, k.equipment.off?.name, k.equipment.body?.name]).toEqual(['Mace', 'Shield', 'Leather']);
    expect(names(k.pack)).toEqual(['Potion of Healing']);
  });

  it('starting gear is normal quality and sound', () => {
    for (const id of ['warrior', 'mage', 'thief', 'priest']) {
      for (const item of [...Object.values(kit(id).equipment), ...kit(id).pack]) {
        if (item.kind === 'weapon' || item.kind === 'armour' || item.kind === 'shield' || item.kind === 'ranged') {
          expect(item).toMatchObject({ quality: 'normal', broken: false, cursed: false });
        }
      }
    }
  });
});

describe('Spec 05: quality, breaking and repair', () => {
  it('has the break chances and values of the quality table', () => {
    expect(BREAK_PERCENT).toEqual({ crude: 15, normal: 3, fine: 1, artifact: 0 });
    expect(QUALITY_VALUE).toEqual({ crude: 0.5, normal: 1, fine: 3 });
  });

  it('breaks at the listed chance over 100,000 simulated rolls', () => {
    for (const [quality, percent] of [['crude', 15], ['normal', 3], ['fine', 1]] as const) {
      const rng = createRng(quality.length * 7919);
      let n = 0;
      for (let i = 0; i < 100_000; i++) if (breaks(rng, quality)) n++;
      expect(n / 100_000 * 100, quality).toBeCloseTo(percent, 0);
      expect(Math.abs(n / 100_000 - percent / 100), quality).toBeLessThan(0.004);
    }
  });

  it('an artifact never breaks, and does not even roll', () => {
    const rng = { int: () => { throw new Error('rolled'); } } as never;
    expect(breaks(rng, 'artifact')).toBe(false);
  });

  it('broken gear gives no bonus, trait or enchantment until it is repaired', () => {
    const sword = gear('long_sword');
    const blade = gear('long_sword', 'normal', { enchant: { id: 'blade_flame', name: 'Flame Blade', bonus: 0, trait: 'flame' } });
    const mace = gear('mace');
    const leather = gear('leather');
    const shield = gear('tower_shield');
    const plate = gear('plate');
    const equipment: Equipment = { main: mace, off: shield, body: plate };
    expect(derive({ main: sword }).melee).toBe(1);
    expect(derive({ main: blade }).weaponTraits).toEqual(['flame']);
    expect(derive(equipment)).toMatchObject({ melee: 1, defence: 5, weaponTraits: ['stun'], rangedMode: 'disadvantage', spellPenalty: true });
    for (const g of [sword, blade, mace, shield, plate, leather]) g.broken = true;
    expect(derive({ main: sword }).melee).toBe(-1); // bare hands
    expect(derive({ main: blade }).weaponTraits).toEqual([]);
    expect(derive(equipment)).toMatchObject({ melee: -1, defence: 0, weaponTraits: [], armourTraits: [], rangedMode: 'normal', spellPenalty: false });
    for (const g of [sword, blade, mace, shield, plate]) g.broken = false; // repaired
    expect(derive(equipment)).toMatchObject({ melee: 1, defence: 5 });
  });

  it('bare hands are -1 and a staff in the main hand fights as bare hands', () => {
    expect(derive({}).melee).toBe(-1);
    expect(derive({ main: magic('staff_magus') }).melee).toBe(-1);
  });
});
