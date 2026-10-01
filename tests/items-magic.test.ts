import { describe, expect, it } from 'vitest';
import { createRng } from '../src/core/rng.ts';
import { DISGUISED_KINDS } from '../src/core/catalog.ts';
import { Game } from '../src/game/game.ts';
import { Run } from '../src/game/run.ts';
import { derive } from '../src/rules/items/gear.ts';
import {
  CURSE_ONE_IN, describeItem, disguisesFor, displayName, identify, isIdentified, liftAllCurses, liftCurse, makeArtifact, makeMagicItem,
  needsService,
} from '../src/rules/items/magic.ts';
import type { ChargedItem, Item, PotionItem, WornItem } from '../src/rules/items/types.ts';
import { applyStatus, hasStatus, statusOf } from '../src/rules/magic/status.ts';
import { ITEMS, SPELLS, gear, gameOn, magic, monsterAt, rig, room, testPlayer } from './helpers.ts';

const harmless = { modifier: -6, dice: 30, maxDice: 30, fearless: true };
const row = (id: string) => ITEMS.magic.get(id)!;
const make = (id: string, seed: number) => makeMagicItem(row(id), seed, createRng(seed), ITEMS);
const wait = (game: Game, n = 1): void => {
  for (let i = 0; i < n; i++) game.act({ type: 'wait' });
};
/** A game with the item in the pack (or worn), ready to use. */
const holding = (items: Item[], extra: Parameters<typeof gameOn>[1] = {}) => gameOn(room(12, 5, 2, 3), { combatDice: 2, combatMax: 4, pack: items, ...extra });

describe('Spec 05: making magic items from their rows', () => {
  it('copies the effect numbers a potion needs', () => {
    expect(make('potion_healing', 1)).toMatchObject({ kind: 'potion', count: 1, effect: 'restore_dice', pool: 'combat', dice: 1, value: 50 });
    expect(make('potion_haste', 1)).toMatchObject({ effect: 'grant_status', status: 'hasted', rounds: 5 });
    expect(make('potion_invisibility', 1)).toMatchObject({ effect: 'invisibility', rounds: 10 });
  });

  it('rolls charges in the listed range: wand 3 to 8, rod 2 to 5, staff 3 to 6, and reaches both ends', () => {
    for (const [id, lo, hi] of [['wand_sleep', 3, 8], ['rod_fireball', 2, 5], ['staff_magus', 3, 6]] as const) {
      const seen = new Set<number>();
      for (let seed = 0; seed < 600; seed++) seen.add((make(id, seed) as ChargedItem).charges);
      expect(Math.min(...seen), id).toBe(lo);
      expect(Math.max(...seen), id).toBe(hi);
    }
  });

  it('is fixed by the seed: the same roll gives the same item', () => {
    expect(make('wand_sleep', 7)).toEqual(make('wand_sleep', 7));
  });

  it('about 1 in 10 of what can be worn is cursed, and nothing else ever is', () => {
    const rate = (id: string) => {
      let n = 0;
      for (let seed = 0; seed < 4000; seed++) if ('cursed' in make(id, seed) && (make(id, seed) as WornItem).cursed) n++;
      return n / 4000;
    };
    expect(CURSE_ONE_IN).toBe(10);
    for (const id of ['ring_might', 'cloak_shadows', 'sword_keen', 'chain_elven', 'staff_magus']) expect(rate(id), id).toBeCloseTo(0.1, 1);
    for (const id of ['potion_healing', 'wand_sleep', 'rod_fireball']) expect(rate(id), id).toBe(0);
    for (let seed = 0; seed < 200; seed++) {
      expect(makeArtifact(ITEMS.artifacts.get('stub_artifact_01')!, seed).cursed).toBe(false);
    }
  });

  it('a magic weapon or armour is its base with an enchantment, and the base quality sets how it breaks', () => {
    const sword = make('sword_keen', 3);
    expect(sword).toMatchObject({ kind: 'weapon', id: 'short_sword', mod: 0, enchant: { bonus: 1, name: 'Keen Sword' }, value: 350 });
    expect(['crude', 'normal', 'fine']).toContain((sword as { quality: string }).quality);
    expect(make('shield_guardian', 3)).toMatchObject({ kind: 'shield', id: 'round_shield' });
    expect(make('chain_elven', 3)).toMatchObject({ kind: 'armour', enchant: { unburdened: true } });
  });

  it('an artifact never breaks and is always known', () => {
    const a = makeArtifact(ITEMS.artifacts.get('stub_artifact_02')!, 1);
    expect(a).toMatchObject({ kind: 'artifact', cursed: false, identified: true, slot: 'ring' });
    expect(isIdentified(a, [])).toBe(true);
  });
});

describe('Spec 05: disguises are shuffled per seed and stay consistent within a run', () => {
  const rows = [...ITEMS.magic.values()];
  const map = (seed: number) => disguisesFor(seed, rows, ITEMS.disguiseNames);

  it('every potion, ring, wand, rod and staff gets a name of its own kind, no two the same', () => {
    const m = map(5);
    for (const kind of DISGUISED_KINDS) {
      const items = rows.filter((r) => r.kind === kind);
      const names = items.map((r) => m.get(r.id)!);
      expect(new Set(names).size, kind).toBe(items.length);
      for (const n of names) expect(ITEMS.disguiseNames.some((d) => d.kind === kind && d.name === n), `${kind} ${n}`).toBe(true);
    }
    expect(m.has('cloak_shadows')).toBe(false); // clothing, weapons and armour have no disguise name
  });

  it('differs between seeds, so a "cloudy blue potion" means something else each run', () => {
    const potions = rows.filter((r) => r.kind === 'potion').map((r) => r.id);
    const looks = new Set<string>();
    for (let seed = 0; seed < 40; seed++) looks.add(potions.map((id) => map(seed).get(id)).join('|'));
    expect(looks.size).toBeGreaterThan(30);
    const blue = new Set<string>();
    for (let seed = 0; seed < 60; seed++) for (const id of potions) if (map(seed).get(id) === 'cloudy blue') blue.add(id);
    expect(blue.size).toBeGreaterThan(3);
  });

  it('is the same every time within a run, however it is asked', () => {
    expect(map(11)).toEqual(map(11));
    const game = gameOn(room(5, 5, 2, 2));
    const run = new Run(1, testPlayer(), { items: ITEMS, spells: SPELLS, startDepth: 1, levelFor: () => room(5, 5, 2, 2) });
    expect([...run.disguises]).toEqual([...new Game(1, room(5, 5, 2, 2), testPlayer(), { items: ITEMS }).disguises]);
    expect(game.disguises.get('potion_healing')).toBe(disguisesFor(1, rows, ITEMS.disguiseNames).get('potion_healing'));
  });

  it('every kind has a name for each of its items (the content check)', () => {
    for (const kind of DISGUISED_KINDS) {
      expect(ITEMS.disguiseNames.filter((d) => d.kind === kind).length).toBeGreaterThanOrEqual(rows.filter((r) => r.kind === kind).length);
    }
  });
});

describe('Spec 05: identification', () => {
  const k = (known: string[] = []) => ({ known, disguises: disguisesFor(3, ITEMS.magic.values(), ITEMS.disguiseNames) });

  it('an unidentified potion, wand, rod, staff or ring shows its disguise; clothing and gear show a plain name', () => {
    const d = k().disguises;
    expect(displayName(magic('potion_cure'), k())).toBe(`${d.get('potion_cure')} potion`);
    expect(displayName(magic('wand_sleep'), k())).toBe(`${d.get('wand_sleep')} wand`);
    expect(displayName(magic('rod_fireball'), k())).toBe(`${d.get('rod_fireball')} rod`);
    expect(displayName(magic('staff_magus'), k())).toBe(`${d.get('staff_magus')} staff`);
    expect(displayName(magic('ring_might'), k())).toBe(`${d.get('ring_might')} ring`);
    expect(displayName(magic('boots_speed'), k())).toBe('boots');
    expect(displayName(magic('blade_flame'), k())).toBe('Long sword');
    expect(displayName(magic('chain_elven'), k())).toBe('Chain');
  });

  it('using a potion, wand, rod or staff reveals that kind for the rest of the run; the kind, not just the one', () => {
    const potion = magic('potion_cure') as PotionItem;
    const another = { ...potion, count: 2 };
    const game = holding([potion]);
    expect(isIdentified(another, game.state.player.known)).toBe(false);
    const said = game.use(potion).messages.map((m) => m.text);
    expect(said).toContain('It was a Potion of Cure.');
    expect(game.state.player.known).toEqual(['potion_cure']);
    expect(displayName(another, { known: game.state.player.known, disguises: game.disguises })).toBe('Potion of Cure');
    // A second drink says nothing more.
    expect(game.use(another).messages.map((m) => m.text)).not.toContain('It was a Potion of Cure.');
  });

  it('wands, rods and staves reveal themselves on use too', () => {
    for (const [id, aim] of [['wand_arcane_bolt', true], ['rod_thunderclap', false]] as const) {
      const item = magic(id);
      const game = holding([item]);
      const m = monsterAt(5, 3, { alert: true, ...harmless });
      game.state.monsters.push(m);
      game.use(item, aim ? m : undefined);
      expect(game.state.player.known, id).toContain(id);
    }
    const staff = magic('staff_warding');
    const game = holding([], { equipment: { main: staff } });
    game.use(staff);
    expect(game.state.player.known).toContain('staff_warding');
  });

  it('rings, clothing, weapons and armour need the service: use does not reveal them, and it marks that one item', () => {
    const ring = magic('ring_might');
    const blade = magic('blade_flame');
    expect(needsService(ring)).toBe(true);
    expect(needsService(blade)).toBe(true);
    expect(needsService(magic('potion_cure'))).toBe(false);
    const known: string[] = [];
    expect(isIdentified(ring, known)).toBe(false);
    identify(ring, known);
    expect(isIdentified(ring, known)).toBe(true);
    expect(isIdentified(magic('ring_might'), known)).toBe(false); // another ring of the same kind is still unknown
    identify(blade, known);
    expect(displayName(blade, k(known))).toBe('Flame Blade');
  });

  it('identifying shows the true name and any curse; before that the curse is hidden', () => {
    const ring = magic('ring_might', true);
    expect(describeItem(ring, k())).not.toContain('cursed');
    identify(ring, []);
    expect(describeItem(ring, k())).toBe('Ring of Might (cursed)');
    const wand = magic('wand_sleep') as ChargedItem;
    expect(describeItem(wand, k())).not.toContain('[');
    expect(describeItem(wand, k([wand.id]))).toBe(`Wand of Sleep [${wand.charges}]`);
  });
});

describe('Spec 05: curses', () => {
  it('a cursed item cannot be unequipped, displaced or dropped, and gives the Cursed status the moment it is worn', () => {
    const ring = magic('ring_stealth', true) as WornItem;
    const game = holding([ring]);
    const worn = game.equip(ring);
    expect(worn.messages.map((m) => m.text)).toContain('A chill runs through you: it is cursed!');
    expect(statusOf(game.state.player.statuses, 'cursed')).toMatchObject({ rounds: null });
    expect(game.unequip('ring1').messages.map((m) => m.text)).toContain('You cannot remove your Ring of Stealth: it is cursed.');
    expect(game.state.player.equipment.ring1).toBe(ring);
    expect(game.drop(ring)).toMatchObject({ spent: false });
    expect(game.state.player.equipment.ring1).toBe(ring);
  });

  it('the Cursed status never wears off while a cursed item is worn', () => {
    const ring = magic('ring_stealth', true);
    const game = holding([ring]);
    game.equip(ring);
    wait(game, 60);
    expect(hasStatus(game.state.player.statuses, 'cursed')).toBe(true);
  });

  it('a Remove Curse potion lifts every curse, clears the status, and the item can then come off', () => {
    const ring = magic('ring_stealth', true);
    const potion = magic('potion_remove_curse');
    const game = holding([ring, potion]);
    game.equip(ring);
    expect(game.unequip('ring1').spent).toBe(false);
    const said = game.use(potion).messages.map((m) => m.text);
    expect(said.join(' ')).toContain('The curse is lifted.');
    expect(hasStatus(game.state.player.statuses, 'cursed')).toBe(false);
    expect(game.unequip('ring1')).toMatchObject({ spent: true });
    expect(game.state.player.pack).toContain(ring);
  });

  it('a hermit or Purify lifts one curse; lifting works on a pack item too', () => {
    const a = magic('ring_might', true);
    const b = magic('cloak_shadows', true);
    expect(liftCurse(a)).toBe(true);
    expect(liftCurse(a)).toBe(false);
    expect(liftAllCurses({ cloak: b }, [a])).toBe(1);
    expect((b as WornItem).cursed).toBe(false);
  });

  it('a cursed weapon or armour has -1 in place of its bonus, a cursed ring reverses its effect', () => {
    const keen = (cursed: boolean) => ({ ...(magic('sword_keen', cursed) as ReturnType<typeof gear>), quality: 'artifact' as const });
    expect(derive({ main: keen(false) }).melee).toBe(1); // +0 base, +1 enchant
    expect(derive({ main: keen(true) }).melee).toBe(-1);
    const chain = (cursed: boolean) => ({ ...(magic('chain_elven', cursed) as ReturnType<typeof gear>), quality: 'artifact' as const });
    expect(derive({ body: chain(false) })).toMatchObject({ defence: 3, armourTraits: [] });
    expect(derive({ body: chain(true) })).toMatchObject({ defence: 1, armourTraits: ['no_stealth_buff'] }); // chain's +2, less 1, with its drawback back
    expect(derive({ ring1: magic('ring_might', true) }).melee).toBe(-2); // bare hands -1, and -1 more
    expect(derive({ ring1: magic('ring_searching', true) }).search).toBe('disadvantage');
    expect(derive({ ring1: magic('ring_stealth', true) }).notice).toBe('advantage');
    expect(derive({ ring1: magic('ring_rest', true) }).waitRounds).toBe(15);
    expect(derive({ gloves: magic('gloves_finesse', true) }).lockpick).toBe('disadvantage');
  });

  it('lifting the curse lets the item work as its true self', () => {
    const ring = magic('ring_might', true) as WornItem;
    expect(derive({ ring1: ring }).melee).toBe(-2);
    liftCurse(ring);
    expect(derive({ ring1: ring }).melee).toBe(0); // bare hands -1, +1 from the ring
  });
});

describe('Spec 05: always-on effects of rings and clothing', () => {
  it('rings: advantage on search, stealth, +1 melee, faster wait recovery; cloak and gloves too', () => {
    expect(derive({ ring1: magic('ring_searching', false) }).search).toBe('advantage');
    expect(derive({ ring1: magic('ring_stealth', false) }).notice).toBe('disadvantage');
    expect(derive({ ring1: magic('ring_might', false) }).melee).toBe(0);
    expect(derive({ ring1: magic('ring_rest', false) }).waitRounds).toBe(7);
    expect(derive({ cloak: magic('cloak_shadows', false) }).notice).toBe('disadvantage');
    expect(derive({ gloves: magic('gloves_finesse', false) }).lockpick).toBe('advantage');
    expect(derive({}).waitRounds).toBe(10);
  });

  it('two rings of the same effect do not stack: advantage is advantage', () => {
    expect(derive({ ring1: magic('ring_searching', false), ring2: magic('ring_searching', false) }).search).toBe('advantage');
  });

  it('a Ring of Rest restores a Combat die in 7 rounds of waiting instead of 10', () => {
    const game = gameOn(room(10, 3, 1, 2), { combatDice: 1, combatMax: 3, equipment: { ring1: magic('ring_rest', false) }, pack: [] });
    wait(game, 6);
    expect(game.state.player.combatDice).toBe(1);
    wait(game);
    expect(game.state.player.combatDice).toBe(2);
  });

  it('a Ring of Might adds 1 to melee attacks', () => {
    const run = (ring: boolean) => {
      const game = gameOn(room(8, 3, 1, 2), { combatDice: 6, combatMax: 6, equipment: { main: gear('dagger'), ...(ring ? { ring1: magic('ring_might', false) } : {}) }, pack: [] });
      const m = monsterAt(2, 2, { alert: true, ...harmless, modifier: 0, speed: 'slow' });
      game.state.monsters.push(m);
      rig(game, 3, 4); // 3 against 4, or 3 + 1 tying it
      game.act({ type: 'move', dx: 1, dy: 0 });
      return m.dice;
    };
    expect(run(false)).toBe(30);
    expect(run(true)).toBeLessThan(30);
  });

  it('Elven Chain is +3 with no stealth drawback; ordinary chain is +2 with one', () => {
    const elven = { ...(magic('chain_elven', false) as ReturnType<typeof gear>) };
    expect(derive({ body: elven })).toMatchObject({ defence: 3, armourTraits: [] });
    expect(derive({ body: elven, cloak: magic('cloak_shadows', false) }).notice).toBe('disadvantage');
    expect(derive({ body: gear('chain'), cloak: magic('cloak_shadows', false) }).notice).toBe('normal');
  });
});

describe('Spec 05: potions', () => {
  const drink = (id: string, extra: Parameters<typeof gameOn>[1] = {}) => {
    const potion = magic(id);
    const game = holding([potion], { skill: { step: 6, dice: 0, max: 2 }, magic: { step: 6, dice: 0, max: 2 }, ...extra });
    const result = game.use(potion);
    return { game, result };
  };

  it('Healing restores a Combat die, Vigour two, Focus a Skill die, Clarity a Magic die; none past the maximum', () => {
    expect(drink('potion_healing').game.state.player.combatDice).toBe(3);
    expect(drink('potion_vigour').game.state.player.combatDice).toBe(4);
    expect(drink('potion_vigour', { combatDice: 3, combatMax: 4 }).game.state.player.combatDice).toBe(4);
    expect(drink('potion_focus').game.state.player.skill.dice).toBe(1);
    expect(drink('potion_clarity').game.state.player.magic.dice).toBe(1);
    expect(drink('potion_healing', { combatDice: 4, combatMax: 4 }).result.messages.map((m) => m.text).join(' ')).toContain('Nothing seems to happen');
  });

  it('Haste gives Hasted for 5 rounds; Cure ends Poisoned; each uses one action', () => {
    const haste = drink('potion_haste');
    expect(statusOf(haste.game.state.player.statuses, 'hasted')!.rounds).toBe(5);
    expect(haste.result.spent).toBe(true);
    const poisoned = holding([magic('potion_cure')]);
    applyStatus(poisoned.state.player.statuses, 'poisoned', null);
    poisoned.use(poisoned.state.player.pack[0]!);
    expect(hasStatus(poisoned.state.player.statuses, 'poisoned')).toBe(false);
  });

  it('Invisibility stops notice rolls against the player for 10 rounds', () => {
    const wakes = (invisible: boolean) => {
      let woke = 0;
      for (let seed = 0; seed < 300; seed++) {
        const game = new Game(seed, room(20, 5, 1, 3), testPlayer({ combatDice: 6, combatMax: 6, pack: [] }), { items: ITEMS });
        if (invisible) game.state.player.invisible = 10;
        const m = monsterAt(6, 3, { awareness: 'unaware', ...harmless });
        game.state.monsters.push(m);
        wait(game, 3);
        if (m.awareness === 'alert') woke++;
      }
      return woke;
    };
    expect(wakes(false)).toBeGreaterThan(200);
    expect(wakes(true)).toBe(0);
    const game = holding([magic('potion_invisibility')]);
    game.use(game.state.player.pack[0]!);
    expect(game.state.player.invisible).toBe(9);
    wait(game, 9);
    expect(game.state.player.invisible).toBe(0);
  });

  it('a stack is drunk one at a time, and the stack goes when it is empty', () => {
    const potion = { ...(magic('potion_healing') as PotionItem), count: 2 };
    const game = holding([potion]);
    game.use(potion);
    expect(game.state.player.pack).toEqual([{ ...potion, count: 1 }]);
    game.use(game.state.player.pack[0]!);
    expect(game.state.player.pack).toEqual([]);
  });
});

describe('Spec 05: wands, rods, staves and worn powers', () => {
  it('a wand casts its spell from a charge with no Magic die and no failure, and crumbles when spent', () => {
    const wand = { ...(magic('wand_arcane_bolt') as ChargedItem), charges: 2 };
    const game = holding([wand], { magic: { step: 6, dice: 0, max: 3 } });
    const m = monsterAt(5, 3, { alert: true, ...harmless });
    game.state.monsters.push(m);
    rig(game, 1); // a 1 would fizzle a spell roll
    expect(game.use(wand, m)).toMatchObject({ spent: true });
    expect(m.dice).toBe(29);
    expect(game.state.player.magic.dice).toBe(0); // nothing spent, and the empty pool did not matter
    expect(wand.charges).toBe(1);
    game.use(wand, m);
    expect(m.dice).toBe(28);
    expect(game.state.player.pack).toEqual([]);
  });

  it('a rod casts an area spell, and an empty staff keeps working as a staff', () => {
    const rod = { ...(magic('rod_thunderclap') as ChargedItem), charges: 1 };
    const game = holding([rod]);
    const m = monsterAt(3, 3, { alert: true, ...harmless, speed: 'slow' });
    game.state.monsters.push(m);
    game.use(rod);
    expect(m.x).toBe(5);
    expect(game.state.player.pack).toEqual([]); // spent: it crumbled
    const staff = { ...(magic('staff_magus', false) as ChargedItem), charges: 1 };
    const g2 = holding([], { equipment: { main: staff } });
    const target = monsterAt(5, 3, { alert: true, ...harmless });
    g2.state.monsters.push(target);
    g2.use(staff, target);
    expect(staff.charges).toBe(0);
    expect(g2.state.player.equipment.main).toBe(staff);
    expect(g2.use(staff, target)).toMatchObject({ spent: false });
  });

  it('a staff must be wielded to use its charges, and a bad aim costs nothing', () => {
    const staff = magic('staff_magus') as ChargedItem;
    const game = holding([staff]);
    const m = monsterAt(5, 3, { alert: true, ...harmless });
    game.state.monsters.push(m);
    expect(game.use(staff, m)).toMatchObject({ spent: false });
    const wand = magic('wand_arcane_bolt') as ChargedItem;
    const g2 = holding([wand]);
    expect(g2.use(wand)).toMatchObject({ spent: false }); // a target spell needs a target
    expect(wand.charges).toBeGreaterThan(0);
  });

  it('Boots of Speed give Haste once per level, by using them', () => {
    const boots = magic('boots_speed', false) as WornItem;
    const game = holding([boots]);
    expect(game.use(boots)).toMatchObject({ spent: false }); // not worn
    game.equip(boots);
    const first = game.use(boots);
    expect(first.spent).toBe(true);
    expect(statusOf(game.state.player.statuses, 'hasted')).toBeDefined();
    wait(game, 8);
    expect(game.use(boots)).toMatchObject({ spent: false });
    expect(game.use(boots).messages[0]!.text).toContain('spent');
  });
});

describe('Spec 05: loot becomes items when picked up', () => {
  /** The player carries nothing, so the pack holds only what is picked up. */
  const bare = () => ({ pack: [] as Item[], equipment: {} });
  const level = (loot: object[]) => ({ ...room(6, 3, 1, 2), piles: [{ x: 1, y: 2, contents: loot }] }) as ReturnType<typeof room>;

  it('picking up costs a round, turns each loot into its item, and clears the pile', () => {
    const game = gameOn(level([{ kind: 'coins', amount: 120 }, { kind: 'gem', id: 'gem_stub_quartz', name: 'quartz', value: 25 }, { kind: 'magic', id: 'potion_cure', name: 'Potion of Cure' }, { kind: 'key' }]), bare());
    const result = game.act({ type: 'pickup' })!;
    expect(result.spent).toBe(true);
    expect(game.state.player.coins).toBe(120);
    expect(game.state.player.pack.map((i) => i.kind)).toEqual(['gem', 'potion', 'key']);
    expect(game.state.drops).toEqual([]);
    expect(result.messages.map((m) => m.text)).toContain('You pick up 120 gp.');
    expect(game.act({ type: 'pickup' })).toMatchObject({ spent: false });
  });

  it('shows the disguise, not the true name, of a magic item picked up', () => {
    const game = gameOn(level([{ kind: 'magic', id: 'wand_sleep', name: 'Wand of Sleep' }]), bare());
    const said = game.act({ type: 'pickup' })!.messages.map((m) => m.text).join(' ');
    expect(said).not.toContain('Sleep');
    expect(said).toContain(`${game.disguises.get('wand_sleep')} wand`);
  });

  it('the same pickup always gives the same item: charges, quality and curse are fixed by the seed and the spot', () => {
    const run = () => {
      const game = gameOn(level([{ kind: 'magic', id: 'staff_magus', name: 'Staff of the Magus' }, { kind: 'weapon' }]), bare());
      game.act({ type: 'pickup' });
      return JSON.stringify(game.state.player.pack);
    };
    expect(run()).toBe(run());
  });

  it('a rack weapon is a base from the table, usually crude or normal and sometimes fine', () => {
    const qualities: Record<string, number> = { crude: 0, normal: 0, fine: 0 };
    for (let i = 0; i < 600; i++) {
      const game = new Game(i, level([{ kind: 'weapon' }]), testPlayer(bare()), { items: ITEMS });
      game.act({ type: 'pickup' });
      const w = game.state.player.pack[0]!;
      if (w.kind === 'weapon' || w.kind === 'ranged') qualities[w.quality]!++;
    }
    expect(qualities.normal!).toBeGreaterThan(qualities.crude!);
    expect(qualities.crude!).toBeGreaterThan(qualities.fine!);
    expect(qualities.fine!).toBeGreaterThan(30);
  });

  it('a full pack refuses a pickup and says so; what does not fit stays on the floor and is kept in the delta', () => {
    const full = Array.from({ length: 12 }, () => gear('dagger'));
    const game = gameOn(level([{ kind: 'gem', id: 'gem_stub_ruby', name: 'ruby', value: 500 }, { kind: 'coins', amount: 40 }]), { pack: full, coins: 0 });
    const result = game.act({ type: 'pickup' })!;
    expect(result.spent).toBe(false);
    expect(result.messages.map((m) => m.text)).toContain('Your pack is full.');
    expect(game.state.player.pack).toHaveLength(12);
    expect(game.state.drops).toHaveLength(1);
    expect(game.state.drops[0]!.contents).toHaveLength(2);
    // Drop something, and the gem fits.
    game.drop(full[0]!);
    const delta = game.captureDelta();
    const back = new Game(1, level([{ kind: 'gem', id: 'gem_stub_ruby', name: 'ruby', value: 500 }, { kind: 'coins', amount: 40 }]), game.state.player, { delta, items: ITEMS });
    expect(back.state.drops.find((p) => p.x === 1 && p.y === 2)!.contents.length).toBeGreaterThanOrEqual(2);
  });

  it('coins take what fits in the last slot and the rest stay', () => {
    const full = Array.from({ length: 11 }, () => gear('dagger'));
    const game = gameOn(level([{ kind: 'coins', amount: 250 }]), { pack: full, coins: 0 });
    game.act({ type: 'pickup' });
    expect(game.state.player.coins).toBe(100);
    expect(game.state.drops[0]!.contents).toEqual([{ kind: 'coins', amount: 150 }]);
  });

  it('a boss carries its artifact and drops it where it dies', () => {
    const game = gameOn(room(8, 3, 1, 2), { combatDice: 6, combatMax: 6, equipment: { main: gear('great_axe') }, pack: [] });
    const boss = monsterAt(2, 2, { alert: true, dice: 1, maxDice: 1, modifier: -6, carried: [{ kind: 'artifact', id: 'stub_artifact_03', name: 'Stub Relic 03' }] });
    game.state.monsters.push(boss);
    rig(game, 6, 1);
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(game.state.monsters).not.toContain(boss);
    expect(game.state.drops).toEqual([{ x: 2, y: 2, contents: [{ kind: 'artifact', id: 'stub_artifact_03', name: 'Stub Relic 03' }] }]);
    game.state.map.player = { x: 2, y: 2 };
    game.act({ type: 'pickup' });
    expect(game.state.player.pack[0]).toMatchObject({ kind: 'artifact', name: 'Stub Relic 03', cursed: false });
  });
});

describe('Spec 05: dropping', () => {
  it('drops a pack item or a worn one where the player stands, for a round, and it can be picked up again', () => {
    const sword = gear('long_sword');
    const mace = gear('mace');
    const game = holding([mace], { equipment: { main: sword } });
    expect(game.drop(mace)).toMatchObject({ spent: true });
    expect(game.drop(sword)).toMatchObject({ spent: true });
    expect(game.state.player.equipment.main).toBeUndefined();
    expect(game.state.drops[0]!.contents).toHaveLength(2);
    game.act({ type: 'pickup' });
    expect(game.state.player.pack).toHaveLength(2);
  });

  it('a stack is dropped whole, and an item not carried cannot be dropped', () => {
    const potions = { ...(magic('potion_healing') as PotionItem), count: 3 };
    const game = holding([potions]);
    game.drop(potions);
    expect(game.state.player.pack).toEqual([]);
    expect(game.drop(gear('mace'))).toMatchObject({ spent: false });
  });
});
