import { describe, expect, it } from 'vitest';
import type { Item, PotionItem, ChargedItem } from '../src/rules/items/types.ts';
import { ammo, gear, magic, monsterAt, press, room, screenText, shellOn } from './helpers.ts';
import { rig } from './helpers.ts';

const shown = (shell: ReturnType<typeof shellOn>, s: string): boolean => screenText(shell).some((l) => l.includes(s));
const logText = (shell: ReturnType<typeof shellOn>): string[] => shell.log.lines(shell.turn).map((l) => l.text);
const harmless = { modifier: -6, dice: 30, maxDice: 30, fearless: true };

/** A shell with the player carrying exactly this. */
const carrying = (pack: Item[], equipment = {}, extra: Parameters<typeof shellOn>[2] = {}) => shellOn(room(20, 5, 2, 3), [], { pack, equipment, combatDice: 2, combatMax: 3, ...extra });

describe('Spec 01 and 05: the inventory screen', () => {
  it('I opens it with slots used and total, coins, every equipment slot, and the pack', () => {
    const shell = carrying([gear('mace', 'normal'), ammo('arrows', 25)], { body: gear('leather', 'fine') }, { coins: 130 });
    press(shell, 'i');
    expect(shell.overlays).toHaveLength(1);
    expect(shown(shell, 'Inventory')).toBe(true);
    expect(shown(shell, 'Slots 5/12')).toBe(true); // a mace, 25 arrows in two slots, 130 gp in two; the worn leather is free
    expect(shown(shell, '130 gp')).toBe(true);
    expect(shown(shell, 'Mace (Normal)')).toBe(true);
    expect(shown(shell, 'Arrows (25)')).toBe(true);
    expect(shown(shell, 'Leather (Fine)')).toBe(true);
  });

  it('lists the ten equipment slots by name and what is in them', () => {
    const shell = carrying([], { main: gear('long_sword', 'normal'), off: gear('round_shield', 'crude'), body: gear('plate', 'fine') });
    press(shell, 'i');
    for (const label of ['Main hand', 'Off hand', 'Ranged', 'Body', 'Cloak', 'Boots', 'Gloves', 'Hat', 'Ring 1', 'Ring 2']) expect(shown(shell, label), label).toBe(true);
    expect(screenText(shell).some((l) => l.includes('Main hand') && l.includes('Long sword (Normal)'))).toBe(true);
    expect(screenText(shell).some((l) => l.includes('Off hand') && l.includes('Shield (Crude)'))).toBe(true);
    expect(screenText(shell).some((l) => l.includes('Body') && l.includes('Plate (Fine)'))).toBe(true);
    expect(screenText(shell).some((l) => l.includes('Cloak') && l.includes('-'))).toBe(true);
  });

  it('shows disguised names for what is not identified, and the quality of gear; Esc closes it for free', () => {
    const shell = carrying([magic('potion_cure'), magic('wand_sleep'), gear('dagger', 'fine')]);
    press(shell, 'i');
    const potion = shell.game!.disguises.get('potion_cure')!;
    expect(shown(shell, `${potion} potion`)).toBe(true);
    expect(shown(shell, 'Potion of Cure')).toBe(false);
    expect(shown(shell, 'Dagger (Fine)')).toBe(true);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
    expect(shell.game!.state.round).toBe(1);
  });

  it('Enter on a pack item offers Equip, Drop and Inspect; equipping costs a round and moves it into its slot', () => {
    const sword = gear('long_sword', 'normal');
    const shell = carrying([sword]);
    press(shell, 'i');
    for (let i = 0; i < 10; i++) press(shell, 's'); // past the ten equipment rows to the first pack row
    press(shell, 'Enter');
    expect(shown(shell, 'Equip')).toBe(true);
    expect(shown(shell, 'Drop')).toBe(true);
    expect(shown(shell, 'Inspect')).toBe(true);
    expect(shown(shell, 'Unequip')).toBe(false);
    press(shell, 'Enter'); // Equip
    expect(shell.game!.state.player.equipment.main).toBe(sword);
    expect(shell.game!.state.player.pack).toEqual([]);
    expect(shell.game!.state.round).toBe(2);
    expect(shell.character.equipment).toEqual([{ name: 'Long sword', quality: 'Normal' }]);
    expect(shell.overlays).toHaveLength(1); // the inventory stays open
    expect(logText(shell)).toContain('You wield Long sword.');
  });

  it('Enter on a worn item offers Unequip, and a cursed one refuses with the log saying why', () => {
    const cursed = gear('mace', 'normal', { cursed: true });
    const shell = carrying([], { main: cursed });
    press(shell, 'i');
    press(shell, 'Enter');
    expect(shown(shell, 'Unequip')).toBe(true);
    press(shell, 'Enter');
    expect(shell.game!.state.player.equipment.main).toBe(cursed);
    expect(logText(shell)).toContain('You cannot remove your Mace: it is cursed.');
    expect(shell.game!.state.round).toBe(1);
  });

  it('Drop puts the item on the floor for a round; Inspect shows its details and spends nothing', () => {
    const mace = gear('mace', 'normal');
    const shell = carrying([mace]);
    press(shell, 'i');
    for (let i = 0; i < 10; i++) press(shell, 's');
    press(shell, 'Enter');
    press(shell, 's');
    press(shell, 's');
    press(shell, 'Enter'); // Inspect
    expect(shown(shell, 'normal')).toBe(true);
    expect(shown(shell, 'Melee +1')).toBe(true);
    expect(shown(shell, 'Traits: stun')).toBe(true);
    expect(shell.game!.state.round).toBe(1);
    press(shell, 'Escape'); // the inspect window
    press(shell, 'Enter');
    press(shell, 's');
    press(shell, 'Enter'); // Drop
    expect(shell.game!.state.player.pack).toEqual([]);
    expect(shell.game!.state.drops[0]!.contents).toEqual([{ kind: 'item', item: mace }]);
    expect(shell.game!.state.round).toBe(2);
  });

  it('Use on a potion drinks it, reveals the kind and updates the pane', () => {
    const potion = magic('potion_healing');
    const shell = carrying([potion]);
    press(shell, 'i');
    for (let i = 0; i < 10; i++) press(shell, 's');
    press(shell, 'Enter');
    press(shell, 's'); // Equip is absent for a potion: the first entry is Use
    press(shell, 'w');
    press(shell, 'Enter');
    expect(shell.game!.state.player.pools.combat.dice).toBe(3);
    expect(shell.character.stats[0]).toMatchObject({ current: 3, max: 3 });
    expect(logText(shell)).toContain('It was a Potion of Healing.');
    expect(shell.character.inventory.used).toBe(0);
  });

  it('Use on a wand asks for a target, then spends a charge on Enter', () => {
    const wand = { ...(magic('wand_arcane_bolt') as ChargedItem), charges: 3 };
    const m = monsterAt(6, 3, { alert: true, ...harmless });
    const shell = shellOn(room(20, 5, 2, 3), [m], { pack: [wand], equipment: {} });
    press(shell, 'i');
    for (let i = 0; i < 10; i++) press(shell, 's');
    press(shell, 'Enter');
    press(shell, 'Enter'); // Use
    expect(shell.overlays).toHaveLength(0);
    expect(shell.targeting!.selected).toBe(m);
    press(shell, 'Enter');
    expect(m.dice).toBe(29);
    expect(wand.charges).toBe(2);
    expect(shell.targeting).toBeNull();
    expect(shell.game!.state.round).toBe(2);
  });

  it('a wand cancelled at the target costs nothing', () => {
    const wand = magic('wand_arcane_bolt') as ChargedItem;
    const charges = wand.charges;
    const shell = shellOn(room(20, 5, 2, 3), [monsterAt(6, 3, { alert: true, ...harmless })], { pack: [wand], equipment: {} });
    press(shell, 'i');
    for (let i = 0; i < 10; i++) press(shell, 's');
    press(shell, 'Enter');
    press(shell, 'Enter');
    press(shell, 'Escape');
    expect(shell.targeting).toBeNull();
    expect(wand.charges).toBe(charges);
    expect(shell.game!.state.round).toBe(1);
    expect(shell.usingItem).toBeNull();
  });
});

describe('Spec 01: the Equipment block and the slot count follow the player', () => {
  it('shows each worn thing with Broken, its quality, or Unknown for an unidentified ring; the slots; the carried estimate', () => {
    const broken = gear('long_sword', 'crude', { broken: true });
    const shell = carrying([ammo('arrows', 25)], { main: broken, body: gear('leather', 'fine'), ring1: magic('ring_might', false) }, { coins: 130 });
    expect(shell.character.equipment).toEqual([
      { name: 'Long sword', quality: 'Broken' },
      { name: 'Leather', quality: 'Fine' },
      { name: `${shell.game!.disguises.get('ring_might')} ring`, quality: 'Unknown' },
    ]);
    expect(shell.character.inventory).toEqual({ used: 4, total: 12 });
    expect(shell.character.carried).toBe(130);
    expect(shown(shell, 'Slots 4/12')).toBe(true);
  });

  it('the pane shows the Skill and Magic pools of the player too', () => {
    const shell = carrying([], {}, { skill: { step: 8, dice: 1, max: 2 }, magic: { step: 6, dice: 2, max: 3 } });
    shell.character.stats.push({ name: 'Skill', step: 8, current: 2, max: 2 }, { name: 'Magic', step: 6, current: 3, max: 3 });
    press(shell, ' ');
    expect(shell.character.stats.map((s) => [s.name, s.current, s.max])).toEqual([['Combat', 2, 3], ['Skill', 1, 2], ['Magic', 2, 3]]);
  });
});

describe('Spec 05: pick up (G)', () => {
  const withPile = (loot: object[], extra: Parameters<typeof shellOn>[2] = {}) => {
    const level = { ...room(10, 3, 1, 2), piles: [{ x: 1, y: 2, contents: loot }] } as ReturnType<typeof room>;
    return shellOn(level, [], { pack: [], equipment: {}, ...extra });
  };

  it('picks up what is underfoot for a round, logs each thing and updates the slots and the estimate', () => {
    const shell = withPile([{ kind: 'coins', amount: 120 }, { kind: 'gem', id: 'gem_stub_ruby', name: 'ruby', value: 500 }]);
    press(shell, 'g');
    expect(logText(shell)).toEqual(expect.arrayContaining(['You pick up 120 gp.', 'You pick up ruby.']));
    expect(shell.game!.state.round).toBe(2);
    expect(shell.character.inventory.used).toBe(3);
    expect(shell.character.carried).toBe(620);
  });

  it('says so, with no round, when there is nothing here', () => {
    const shell = shellOn(room(10, 3, 1, 2), [], { pack: [], equipment: {} });
    press(shell, 'g');
    expect(logText(shell)).toContain('There is nothing here to pick up.');
    expect(shell.game!.state.round).toBe(1);
  });

  it('says the pack is full, and keeps what did not fit', () => {
    const full = Array.from({ length: 12 }, () => gear('dagger'));
    const shell = withPile([{ kind: 'gem', id: 'gem_stub_ruby', name: 'ruby', value: 500 }], { pack: full });
    press(shell, 'g');
    expect(logText(shell)).toContain('Your pack is full.');
    expect(shell.game!.state.round).toBe(1);
    expect(shell.game!.state.drops).toHaveLength(1);
  });
});

describe('Spec 05: the thrown dagger and the readied weapon through F', () => {
  it('F with only a dagger throws it at the nearest target in 4 cells', () => {
    const near = monsterAt(5, 3, { awareness: 'unaware', ...harmless });
    const shell = shellOn(room(20, 5, 2, 3), [near], { pack: [gear('dagger')], equipment: {} });
    press(shell, 'f');
    expect(shell.targeting!.selected).toBe(near);
    rig(shell.game!, 5);
    press(shell, 'Enter');
    expect(near.dice).toBe(29);
    expect(shell.game!.state.player.pack).toEqual([]);
  });

  it('F with a broken sling or no ammunition says so and spends nothing', () => {
    const shell = shellOn(room(20, 5, 2, 3), [monsterAt(5, 3, { awareness: 'unaware', ...harmless })], { pack: [], equipment: { ranged: gear('sling') } });
    press(shell, 'f');
    expect(logText(shell)).toContain('Your sling is out of ammunition.');
    expect(shell.targeting).toBeNull();
    expect(shell.game!.state.round).toBe(1);
  });
});

describe('Spec 01: the inventory in a village has no level to act in', () => {
  it('equips for free and refuses drops and uses that need a level', () => {
    const sword = gear('long_sword', 'normal');
    const potion = magic('potion_healing') as PotionItem;
    const shell = carrying([sword, potion]);
    shell.run!.travel('up'); // to the surface village
    shell.setRun(shell.run!);
    expect(shell.game).toBeNull();
    press(shell, 'i');
    for (let i = 0; i < 10; i++) press(shell, 's');
    press(shell, 'Enter');
    press(shell, 'Enter'); // Equip the sword
    expect(shell.run!.player.equipment.main).toBe(sword);
    expect(logText(shell)).toContain('You wield Long sword.');
    expect(shell.character.equipment).toEqual([{ name: 'Long sword', quality: 'Normal' }]);
  });
});
