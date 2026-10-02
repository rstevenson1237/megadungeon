import { describe, expect, it } from 'vitest';
import { Game } from '../src/game/game.ts';
import { ammoCount } from '../src/rules/items/inventory.ts';
import type { Item } from '../src/rules/items/types.ts';
import { ITEMS, SPELLS, ammo, castingGame, gameOn, gear, levelFrom, magic, monsterAt, rig, room, slingKit, spell, stonesLeft, testPlayer } from './helpers.ts';

const sturdy = { combatDice: 6, combatMax: 6 };
/** The monster rolls d6 plus nothing, has plenty of dice, and cannot be killed or fled in a short test. */
const dummy = { dice: 30, maxDice: 30, modifier: 0, fearless: true };
/** The same, but slow: it only acts on even rounds, so it neither answers nor moves in round 1 and the rigged rolls are all that is rolled. */
const inert = { ...dummy, speed: 'slow' as const };
const step = (game: Game, dx: number, dy = 0) => game.act({ type: 'move', dx, dy })!;

describe('Spec 05: melee weapons add their modifier to the Combat die, and only to melee attacks', () => {
  /** The player (at x=1) strikes a creature at x=2: rig the player's die and the monster's d6. */
  const strike = (weapon: Item | undefined, die: number, monsterRoll: number) => {
    const game = gameOn(room(8, 3, 1, 2), { ...sturdy, equipment: weapon ? { main: weapon } : {}, pack: [] });
    const m = monsterAt(2, 2, { alert: true, ...inert });
    game.state.monsters.push(m);
    rig(game, die, monsterRoll);
    step(game, 1);
    return { game, m };
  };

  it('a long sword (+1) turns a 3 against a 4 into a tie, which hits both; bare hands (-1) lose it', () => {
    const sword = strike(gear('long_sword'), 3, 4);
    expect(sword.m.dice).toBeLessThan(30); // tied at 4, so it was hit
    const bare = strike(undefined, 3, 4); // 3 - 1 = 2 against 4
    expect(bare.m.dice).toBe(30);
  });

  it('every melee weapon adds exactly its listed modifier', () => {
    for (const [id, mod] of [['dagger', 0], ['short_sword', 0], ['mace', 1], ['long_sword', 1], ['quarterstaff', 0], ['spear', 1], ['great_axe', 2]] as const) {
      // The player's die plus the modifier ties the monster's roll of 4 exactly when the modifier is right.
      const tie = strike(gear(id), 4 - mod, 4);
      expect(tie.m.dice, `${id} ties at ${4 - mod}`).toBeLessThan(30);
      const short = strike(gear(id), 3 - mod, 4);
      expect(short.m.dice, `${id} loses at ${3 - mod}`).toBe(30);
    }
  });

  it('a weapon modifier does not touch the Skill roll of a ranged attack or the Magic roll of a spell', () => {
    const game = gameOn(room(10, 3, 1, 2), { ...sturdy, equipment: { main: gear('great_axe'), ranged: gear('sling') }, pack: [ammo('sling_stones', 5)] });
    const m = monsterAt(5, 2, { awareness: 'unaware', ...dummy });
    game.state.monsters.push(m);
    rig(game, 2); // a Skill die of 2 hits, with no modifier to change that
    game.fire(m);
    expect(m.dice).toBe(29);
  });
});

describe('Spec 05: armour and shields add to the defence die against melee only', () => {
  /** A monster rolling `attack` against the player's Combat die of `die`. */
  const defend = (equipment: Parameters<typeof gameOn>[1], die: number, attack: number) => {
    const game = gameOn(room(8, 3, 1, 2), { combatDice: 5, combatMax: 5, ...equipment });
    const m = monsterAt(2, 2, { alert: true, ...dummy });
    game.state.monsters.push(m);
    rig(game, attack, die);
    game.act({ type: 'wait' });
    return { game, m };
  };

  it('leather +1, chain +2, plate +3, shield +1 and tower shield +2 each shift the defence die by the listed amount', () => {
    const cases: [Parameters<typeof gameOn>[1], number][] = [
      [{}, 0], [{ equipment: { body: gear('leather') } }, 1], [{ equipment: { body: gear('chain') } }, 2],
      [{ equipment: { body: gear('plate') } }, 3], [{ equipment: { off: gear('round_shield') } }, 1],
      [{ equipment: { off: gear('tower_shield') } }, 2], [{ equipment: { body: gear('plate'), off: gear('tower_shield') } }, 5],
    ];
    for (const [equipment, mod] of cases) {
      // The monster rolls 5; the player's die plus the modifier ties it at exactly 5, which hits the monster too.
      const tie = defend({ ...equipment, pack: [] }, 5 - mod, 5);
      expect(tie.m.dice, `defence ${mod}: tie`).toBeLessThan(30);
      expect(tie.game.state.player.pools.combat.dice, `defence ${mod}: tie`).toBe(4);
      const win = defend({ ...equipment, pack: [] }, 6 - mod, 5);
      expect(win.game.state.player.pools.combat.dice, `defence ${mod}: win`).toBe(5); // the monster missed
      const lose = defend({ ...equipment, pack: [] }, 4 - mod, 5);
      expect(lose.game.state.player.pools.combat.dice, `defence ${mod}: lose`).toBe(4);
    }
  });

  it('a monster\'s ranged attack or spell is rolled against the Skill or Magic die with no armour bonus', () => {
    const game = gameOn(room(12, 3, 1, 2), { combatDice: 5, combatMax: 5, equipment: { body: gear('plate'), off: gear('tower_shield') }, pack: [] });
    const archer = monsterAt(6, 2, { alert: true, behaviour: 'skirmisher', ...dummy });
    game.state.monsters.push(archer);
    rig(game, 4, 3); // the archer rolls 4 against a Skill die of 3: only without a bonus does that hit
    game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBe(4);
  });

  it('a quarterstaff gives +1 on defence rolls', () => {
    const staff = defend({ equipment: { main: gear('quarterstaff') }, pack: [] }, 4, 5); // 4 + 1 ties 5
    expect(staff.game.state.player.pools.combat.dice).toBe(4);
    expect(staff.m.dice).toBeLessThan(30);
    const bare = defend({ equipment: { main: gear('dagger') }, pack: [] }, 4, 5);
    expect(bare.game.state.player.pools.combat.dice).toBe(4);
    expect(bare.m.dice).toBe(30); // no tie: only the player was hit
  });
});

describe('Spec 05: weapon traits', () => {
  it('Light weapons are marked for Backstab: the dagger and the short sword', () => {
    for (const id of ['dagger', 'short_sword']) expect(gear(id).traits).toContain('light');
    for (const id of ['mace', 'long_sword', 'spear', 'great_axe']) expect(gear(id).traits).not.toContain('light');
  });

  it('a mace stuns a monster when it wins by 3 or more, and the monster loses its next action', () => {
    const game = gameOn(room(8, 3, 1, 2), { ...sturdy, equipment: { main: gear('mace') }, pack: [] });
    const m = monsterAt(2, 2, { alert: true, ...dummy });
    game.state.monsters.push(m);
    rig(game, 5, 3); // 5 + 1 = 6 against 3: by 3
    const said = step(game, 1).messages.map((x) => x.text);
    expect(said).toContain('The goblin is stunned.');
    expect(m.stunned).toBe(false); // it spent the action it would have answered with
    expect(said.some((t) => /hits you/.test(t))).toBe(false);
    expect(m.dice).toBe(29); // and was not hit by a counterattack either
  });

  it('a mace hit won by only 2 does not stun, and the monster answers', () => {
    const game = gameOn(room(8, 3, 1, 2), { ...sturdy, equipment: { main: gear('mace') }, pack: [] });
    const m = monsterAt(2, 2, { alert: true, ...dummy });
    game.state.monsters.push(m);
    rig(game, 4, 3); // 5 against 3: by 2
    const said = step(game, 1).messages.map((x) => x.text);
    expect(said.join(' ')).not.toContain('stunned');
    expect(said.length).toBeGreaterThan(1); // the monster struck back
  });

  it('stun costs exactly one action', () => {
    const game = gameOn(room(8, 3, 1, 2), { ...sturdy, equipment: { main: gear('mace') }, pack: [] });
    const m = monsterAt(5, 2, { alert: true, ...dummy });
    game.state.monsters.push(m);
    m.stunned = true;
    const before = m.x;
    game.act({ type: 'wait' });
    expect(m.x).toBe(before);
    expect(m.stunned).toBe(false);
    game.act({ type: 'wait' });
    expect(m.x).toBe(before - 1);
  });

  it('a spear attacks a creature exactly 2 cells away in line instead of moving, and only the target can be hit', () => {
    const game = gameOn(room(8, 3, 1, 2), { ...sturdy, equipment: { main: gear('spear') }, pack: [] });
    const m = monsterAt(3, 2, { awareness: 'unaware', ...dummy });
    game.state.monsters.push(m);
    rig(game, 3, 4); // 3 + 1 = 4 ties 4: a tie would hit both from close up
    step(game, 1);
    expect(game.state.map.player).toEqual({ x: 1, y: 2 }); // it did not move
    expect(m.dice).toBeLessThan(30);
    expect(game.state.player.pools.combat.dice).toBe(6); // and the tie did not reach back along the spear
  });

  it('a spear does nothing special with a wall, or a closed door, in between; and a sword never reaches', () => {
    const rows = ['######', '#<.+.#', '######'];
    const door = gameOn(levelFrom(rows), { ...sturdy, equipment: { main: gear('spear') }, pack: [] });
    const behind = monsterAt(4, 1, { awareness: 'unaware', ...dummy });
    door.state.monsters.push(behind);
    step(door, 1);
    expect(door.state.map.player).toEqual({ x: 2, y: 1 }); // moved: the cell between was not free to attack across
    const sword = gameOn(room(8, 3, 1, 2), { ...sturdy, equipment: { main: gear('long_sword') }, pack: [] });
    const m = monsterAt(3, 2, { awareness: 'unaware', ...dummy });
    sword.state.monsters.push(m);
    step(sword, 1);
    expect(sword.state.map.player).toEqual({ x: 2, y: 2 });
    expect(m.dice).toBe(30);
  });

  it('a dagger thrown with no ranged weapon readied flies up to 4 cells, as a ranged attack, and lands where it can be picked up', () => {
    const spare = gear('dagger');
    const game = gameOn(room(10, 3, 1, 2), { ...sturdy, equipment: { main: gear('short_sword') }, pack: [spare] });
    const near = monsterAt(5, 2, { awareness: 'unaware', ...dummy });
    const far = monsterAt(7, 2, { awareness: 'unaware', ...dummy });
    game.state.monsters.push(near, far);
    expect(game.ranged()).toMatchObject({ name: 'Dagger', range: 4, thrown: true });
    const target = { x: near.x, y: near.y };
    rig(game, 4);
    expect(game.fire(near)).toMatchObject({ spent: true });
    expect(near.dice).toBe(29);
    expect(game.state.player.pack).toEqual([]);
    const pile = game.state.drops.find((p) => p.contents.some((c) => c.kind === 'item' && c.item === spare));
    expect(pile).toBeDefined();
    expect(Math.abs(pile!.x - target.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(pile!.y - target.y)).toBeLessThanOrEqual(1);
    // Walk onto it and pick it up again.
    const { x, y } = pile!;
    game.state.map.player = { x, y };
    expect(game.act({ type: 'pickup' })).toMatchObject({ spent: true });
    expect(game.state.player.pack).toEqual([spare]);
  });

  it('a thrown dagger that misses still lands; and with a ranged weapon readied F fires that instead', () => {
    const spare = gear('dagger');
    const game = gameOn(room(10, 3, 1, 2), { ...sturdy, ...slingKit(5), pack: [spare, ...slingKit(5).pack] });
    expect(game.ranged()).toMatchObject({ name: 'Sling', thrown: false });
    const bare = gameOn(room(10, 3, 1, 2), { ...sturdy, equipment: {}, pack: [spare] });
    const m = monsterAt(4, 2, { awareness: 'unaware', ...dummy });
    bare.state.monsters.push(m);
    rig(bare, 1); // a Skill die of 1 misses
    bare.fire(m);
    expect(m.dice).toBe(30);
    expect(bare.state.drops).toHaveLength(1);
  });

  it('with only the wielded dagger, the throw leaves the hand empty; a cursed one cannot be thrown', () => {
    const wielded = gear('dagger');
    const game = gameOn(room(10, 3, 1, 2), { ...sturdy, equipment: { main: wielded }, pack: [] });
    expect(game.ranged()).toMatchObject({ thrown: true });
    const m = monsterAt(4, 2, { awareness: 'unaware', ...dummy });
    game.state.monsters.push(m);
    game.fire(m);
    expect(game.state.player.equipment.main).toBeUndefined();
    const cursed = gameOn(room(10, 3, 1, 2), { ...sturdy, equipment: { main: gear('dagger', 'normal', { cursed: true }) }, pack: [] });
    expect(cursed.ranged()).toBeUndefined();
  });

  it('a thrown dagger cannot reach beyond 4 cells', () => {
    const game = gameOn(room(12, 3, 1, 2), { ...sturdy, equipment: {}, pack: [gear('dagger')] });
    game.state.monsters.push(monsterAt(6, 2, { awareness: 'unaware', ...dummy }));
    expect(game.ranged()!.range).toBe(4);
    // targeting uses that range: nothing at 5 cells is a valid target
    return import('../src/game/targeting.ts').then(({ validTargets }) => {
      expect(validTargets(game, 4)).toEqual([]);
      game.state.monsters.push(monsterAt(5, 2, { awareness: 'unaware', ...dummy }));
      expect(validTargets(game, 4)).toHaveLength(1);
    });
  });

  it('Flame Blade removes a second die from undead and one from the living', () => {
    const blade = gear('long_sword', 'artifact', { enchant: { id: 'blade_flame', name: 'Flame Blade', bonus: 0, trait: 'flame' } });
    for (const [undead, left] of [[true, 28], [false, 29]] as const) {
      const game = gameOn(room(8, 3, 1, 2), { ...sturdy, equipment: { main: blade }, pack: [] });
      const m = monsterAt(2, 2, { alert: true, undead, ...inert });
      game.state.monsters.push(m);
      rig(game, 6, 1);
      step(game, 1);
      expect(m.dice, undead ? 'undead' : 'living').toBe(left);
    }
  });
});

describe('Spec 05 and 04: ranged weapons and ammunition', () => {
  const shoot = (weapon: string, rounds = 1, count = 20, type = 'sling_stones') => {
    const game = gameOn(room(14, 3, 1, 2), { ...sturdy, equipment: { ranged: gear(weapon) }, pack: [ammo(type, count)] });
    const m = monsterAt(9, 2, { awareness: 'unaware', ...dummy });
    game.state.monsters.push(m);
    return { game, m };
  };

  it('range: a sling 6, a shortbow 8, a longbow 10, a crossbow 8', () => {
    for (const [weapon, type, range] of [['sling', 'sling_stones', 6], ['shortbow', 'arrows', 8], ['longbow', 'arrows', 10], ['crossbow', 'bolts', 8]] as const) {
      const game = gameOn(room(14, 3, 1, 2), { ...sturdy, equipment: { ranged: gear(weapon) }, pack: [ammo(type, 5)] });
      expect(game.ranged(), weapon).toMatchObject({ range, ammo: 5 });
    }
  });

  it('each shot spends one piece of the right type, and a bow does not use stones', () => {
    const { game, m } = shoot('shortbow', 1, 3, 'arrows');
    game.state.player.pack.push(ammo('sling_stones', 4));
    rig(game, 5);
    game.fire(m);
    expect(ammoCount(game.state.player.pack, 'arrow')).toBe(2);
    expect(stonesLeft(game)).toBe(4);
  });

  it('a weapon with the wrong or no ammunition cannot fire, and no round is spent', () => {
    const { game, m } = shoot('longbow', 1, 5, 'sling_stones');
    expect(game.ranged()!.problem).toContain('out of ammunition');
    const before = game.state.round;
    expect(game.fire(m)).toMatchObject({ spent: false });
    expect(game.state.round).toBe(before);
  });

  it('a crossbow fires every other round, and a hit removes 2 dice', () => {
    const { game, m } = shoot('crossbow', 1, 10, 'bolts');
    rig(game, 5);
    expect(game.fire(m)).toMatchObject({ spent: true });
    expect(m.dice).toBe(28);
    expect(game.ranged()!.problem).toContain('not yet loaded');
    const before = game.state.round;
    expect(game.fire(m)).toMatchObject({ spent: false });
    expect(game.state.round).toBe(before);
    game.act({ type: 'wait' }); // one round passes
    rig(game, 5);
    expect(game.fire(m)).toMatchObject({ spent: true });
    expect(m.dice).toBe(26);
    expect(ammoCount(game.state.player.pack, 'bolt')).toBe(8);
  });

  it('a sling or bow hit removes one die and is ready every round', () => {
    const { game, m } = shoot('sling');
    rig(game, 5);
    game.fire(m);
    expect(m.dice).toBe(29);
    expect(game.ranged()!.problem).toBeUndefined();
  });

  it('a tower shield gives the player\'s ranged attacks disadvantage, once, even against an adjacent target', () => {
    const run = (equipment: NonNullable<Parameters<typeof gameOn>[1]>['equipment'], x: number) => {
      const game = gameOn(room(10, 3, 1, 2), { ...sturdy, equipment: { ranged: gear('sling'), ...equipment }, pack: [ammo('sling_stones', 5)] });
      const m = monsterAt(x, 2, { alert: true, ...inert });
      game.state.monsters.push(m);
      rig(game, 5, 1); // advantage or none keeps 5; disadvantage keeps the 1
      game.fire(m);
      return m.dice;
    };
    expect(run({}, 6)).toBe(29); // a plain shot: one die, kept as rolled (5): a hit
    expect(run({ off: gear('tower_shield') }, 6)).toBe(30); // two dice, keep the lower: a miss
    expect(run({}, 2)).toBe(30); // adjacent: disadvantage
    expect(run({ off: gear('tower_shield') }, 2)).toBe(30); // both: still one disadvantage, not two
  });
});

describe('Spec 05: heavy armour and the rolls that notice and cast', () => {
  const noticed = (equipment: NonNullable<Parameters<typeof gameOn>[1]>['equipment'], trials = 1500) => {
    let alert = 0;
    for (let seed = 0; seed < trials; seed++) {
      const game = new Game(seed, room(20, 5, 1, 3), testPlayer({ ...sturdy, equipment, pack: [] }), { spells: SPELLS, items: ITEMS });
      const m = monsterAt(6, 3, { awareness: 'unaware', ...dummy });
      game.state.monsters.push(m);
      game.act({ type: 'wait' });
      if (m.awareness === 'alert') alert++;
    }
    return alert / trials;
  };

  it('plate: monsters notice with advantage, whatever stealth buffs say; chain: stealth buffs do not help', () => {
    // An unaware creature notices on 4 or more: 1/2 normally, 3/4 with advantage, 1/4 with disadvantage.
    expect(noticed({})).toBeCloseTo(0.5, 1);
    expect(noticed({ body: gear('plate') })).toBeCloseTo(0.75, 1);
    expect(noticed({ body: gear('plate'), cloak: magic('cloak_shadows', false) })).toBeCloseTo(0.75, 1);
    expect(noticed({ cloak: magic('cloak_shadows', false) })).toBeCloseTo(0.25, 1);
    expect(noticed({ body: gear('chain'), cloak: magic('cloak_shadows', false) })).toBeCloseTo(0.5, 1);
    expect(noticed({ body: gear('leather'), cloak: magic('cloak_shadows', false) })).toBeCloseTo(0.25, 1);
  });

  it('plate gives the player\'s spell rolls disadvantage', () => {
    const cast = (equipment: NonNullable<Parameters<typeof gameOn>[1]>['equipment']) => {
      const game = castingGame(room(10, 3, 1, 2), { equipment });
      rig(game, 6, 1); // keeps 6 with advantage or none; the 1 with disadvantage
      const result = game.cast(spell('heal'));
      return result.messages.map((m) => m.text).includes('The spell fizzles.');
    };
    expect(cast({})).toBe(false);
    expect(cast({ body: gear('plate') })).toBe(true);
    expect(cast({ body: gear('chain') })).toBe(false);
  });

  it('a staff gives advantage on spell rolls of its shape only, and a curse turns that to disadvantage', () => {
    const cast = (equipment: NonNullable<Parameters<typeof gameOn>[1]>['equipment'], id: string, aim?: Parameters<Game['cast']>[1]) => {
      const game = castingGame(room(10, 3, 1, 2), { equipment, combatDice: 1 });
      if (aim === undefined && id === 'arcane_bolt') aim = game.state.monsters[0];
      rig(game, 1, 6); // with advantage keeps the 6; without, the first die 1 stands
      return game.cast(spell(id), aim).messages.map((m) => m.text).includes('The spell fizzles.');
    };
    const staff = (cursed = false) => magic('staff_warding', cursed); // shape: self
    expect(cast({ main: staff() }, 'heal')).toBe(false); // self spell: advantage
    expect(cast({}, 'heal')).toBe(true);
    expect(cast({ main: staff(true) }, 'heal')).toBe(true); // cursed: disadvantage keeps the 1
    expect(cast({ main: staff(true) }, 'shield')).toBe(true);
    expect(cast({ main: staff() }, 'shield')).toBe(false);
    // A target spell is not of the staff's shape.
    const game = castingGame(room(10, 3, 1, 2), { equipment: { main: staff() } });
    game.state.monsters.push(monsterAt(4, 2, { alert: true, ...dummy }));
    rig(game, 1, 6);
    expect(game.cast(spell('arcane_bolt'), game.state.monsters[0]).messages.map((m) => m.text)).toContain('The spell fizzles.');
  });
});

describe('Spec 05: breaking in play', () => {
  it('a weapon rolls to break when it hits, and then fights as bare hands', () => {
    const sword = gear('long_sword', 'crude');
    const game = gameOn(room(8, 3, 1, 2), { ...sturdy, equipment: { main: sword }, pack: [] });
    const m = monsterAt(2, 2, { alert: true, ...inert });
    game.state.monsters.push(m);
    rig(game, 6, 1, 1); // a hit; then the break roll of 1 (at or under 15)
    const said = step(game, 1).messages.map((x) => x.text);
    expect(sword.broken).toBe(true);
    expect(said).toContain('Your long sword breaks!');
    // Broken, it adds nothing: a 4 + 1 would tie the monster's 5, but bare hands make it 3.
    const after = gameOn(room(8, 3, 1, 2), { ...sturdy, equipment: { main: sword }, pack: [] });
    const target = monsterAt(2, 2, { alert: true, ...inert });
    after.state.monsters.push(target);
    rig(after, 5, 5); // 5 - 1 = 4 against 5
    step(after, 1);
    expect(target.dice).toBe(30);
  });

  it('a weapon that misses does not roll', () => {
    const sword = gear('long_sword', 'crude');
    const game = gameOn(room(8, 3, 1, 2), { ...sturdy, equipment: { main: sword }, pack: [] });
    const m = monsterAt(2, 2, { alert: true, ...dummy, modifier: 20 });
    game.state.monsters.push(m);
    rig(game, 6, 1); // the monster's total is 21: no hit, and so no break roll to eat the queue
    step(game, 1);
    expect(sword.broken).toBe(false);
  });

  it('armour and a shield roll to break when the wearer is hit, each on its own', () => {
    const body = gear('leather', 'crude');
    const off = gear('round_shield', 'crude');
    const game = gameOn(room(8, 3, 1, 2), { combatDice: 5, combatMax: 5, equipment: { body, off }, pack: [] });
    game.state.monsters.push(monsterAt(2, 2, { alert: true, ...dummy, modifier: 30 }));
    rig(game, 6, 1, 1, 1); // the monster's roll, the player's die, then two break rolls
    game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBe(4);
    expect(body.broken).toBe(true);
    expect(off.broken).toBe(true);
  });

  it('a hit absorbed by a Shield spell does not roll armour', () => {
    const body = gear('leather', 'crude');
    const game = gameOn(room(8, 3, 1, 2), { combatDice: 5, combatMax: 5, equipment: { body }, pack: [], shield: 5 });
    game.state.monsters.push(monsterAt(2, 2, { alert: true, ...dummy, modifier: 30 }));
    rig(game, 6, 1, 1);
    game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBe(5);
    expect(body.broken).toBe(false);
  });

  it('an artifact-quality piece never breaks however often it is hit', () => {
    const body = gear('leather');
    const game = gameOn(room(8, 3, 1, 2), { combatDice: 6, combatMax: 6, equipment: { body }, pack: [] });
    game.state.monsters.push(monsterAt(2, 2, { alert: true, ...dummy, modifier: 30 }));
    for (let i = 0; i < 5; i++) game.act({ type: 'wait' });
    expect(body.broken).toBe(false);
  });
});
