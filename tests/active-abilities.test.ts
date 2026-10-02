// Task 3.7: the active major abilities, Rage, Volley, Fascinate, Wild Shape, Mark and Spirit Totem (Spec 03,
// Addendum A; Spec 04). Each is a skill use of one round, and each has its scripted arena test.

import { describe, expect, it } from 'vitest';
import type { LogMessage } from '../src/core/log.ts';
import { RAGE_ROUNDS, WILD_SHAPE_ROUNDS, combatStep, timedLeft } from '../src/game/abilities.ts';
import { TOTEM_WAIT_ROUNDS, besideTotem, useActiveMajor, waitRoundsNow } from '../src/game/actives.ts';
import { monsterAttacks, playerAttacks } from '../src/game/combat.ts';
import type { Game } from '../src/game/game.ts';
import { poolFor } from '../src/game/features/common.ts';
import { isOpen } from '../src/game/map-state.ts';
import { ammoCount } from '../src/rules/items/inventory.ts';
import { hasStatus } from '../src/rules/magic/status.ts';
import type { Level } from '../src/rules/world/level.ts';
import { ammo, gameAt, gear, monsterAt, press, rig, room, shellOn } from './helpers.ts';

const said = (r: { messages: { text: string }[] } | LogMessage[]): string => ('messages' in r ? r.messages : r).map((m) => m.text).join(' | ');
const arena = (): Level => room(12, 7, 1, 1);
/** A player at (4,3) with the given major ability and four Combat dice, bare-handed unless given gear. */
const hero = (ability: string, extra: Parameters<typeof gameAt>[3] = {}): Game =>
  gameAt(arena(), 4, 3, { pack: [], equipment: {}, combatDice: 4, combatMax: 4, skill: { step: 6, dice: 2, max: 2 }, magic: { step: 6, dice: 2, max: 2 }, abilities: [ability], ...extra });
const add = (game: Game, x: number, y: number, extra: Parameters<typeof monsterAt>[2] = {}) => {
  const m = monsterAt(x, y, { alert: true, dice: 3, ...extra });
  game.state.monsters.push(m);
  return m;
};
/** Record the sides of every die rolled from now on. */
const sidesRolled = (game: Game): number[] => {
  const sides: number[] = [];
  const int = game.rng.int.bind(game.rng);
  game.rng.int = (min: number, max: number) => (sides.push(max), int(min, max));
  return sides;
};

describe('Spec 03, Addendum A: active major abilities are skill uses', () => {
  it('Q no longer says any of the six is not yet available', () => {
    for (const id of ['rage', 'volley', 'fascinate', 'wild_shape', 'mark', 'spirit_totem']) {
      const shell = shellOn(arena(), [], { abilities: [id] });
      press(shell, 'q');
      expect(shell.log.lines(shell.turn).map((l) => l.text).join(' '), id).not.toMatch(/not yet available/);
    }
  });

  it('a Skill die: 4 or more works; 2 to 3 works and the die is lost; 1 fails and the die is lost; one round either way', () => {
    for (const [face, works, skill] of [[4, true, 2], [2, true, 1], [1, false, 1]] as const) {
      const game = hero('rage');
      const round = game.state.round;
      rig(game, face);
      expect(game.useMajor()).toMatchObject({ spent: true });
      expect(game.state.round, `face ${face}`).toBe(round + 1);
      expect(timedLeft(game.state.player, 'rage') > 0, `face ${face}`).toBe(works);
      expect(game.state.player.pools.skill.dice, `face ${face}`).toBe(skill);
    }
    // An empty pool rolls with disadvantage and loses nothing more.
    const empty = hero('wild_shape', { skill: { step: 6, dice: 0, max: 2 } });
    rig(empty, 5, 6);
    empty.useMajor();
    expect(timedLeft(empty.state.player, 'wild_shape')).toBeGreaterThan(0);
    expect(empty.state.player.pools.skill.dice).toBe(0);
  });
});

describe('Spec 03, Addendum A: Rage', () => {
  it('for 10 rounds (counting the one it is used in), a melee tie hits only the monster, attacking or defending', () => {
    const game = hero('rage');
    rig(game, 5);
    game.useMajor();
    expect(timedLeft(game.state.player, 'rage')).toBe(RAGE_ROUNDS - 1);
    const m = add(game, 5, 3);
    rig(game, 4, 3); // bare hands -1: 3 against 3, a tie
    playerAttacks(game, m, []);
    expect([m.dice, game.state.player.pools.combat.dice]).toEqual([2, 4]);
    rig(game, 3, 3); // its 3 against the player's 3
    monsterAttacks(game, m, []);
    expect([m.dice, game.state.player.pools.combat.dice]).toEqual([1, 4]);
    // A win still hits only the winner, and a loss still hurts.
    rig(game, 6, 1);
    monsterAttacks(game, m, []);
    expect(game.state.player.pools.combat.dice).toBe(3);
    // It ends: the Status block shows it while it runs.
    game.state.monsters.length = 0;
    const shellish = said(game.act({ type: 'wait' })!);
    expect(shellish).not.toContain('Rage ends');
    for (let i = 0; i < RAGE_ROUNDS - 3; i++) game.act({ type: 'wait' });
    expect(said(game.act({ type: 'wait' })!)).toContain('Rage ends.');
    game.state.monsters.push(m);
    rig(game, 4, 3);
    playerAttacks(game, m, []);
    expect(game.state.player.pools.combat.dice).toBeLessThan(game.state.player.pools.combat.max); // a tie hits both again
  });

  it('without Rage a tie hits both', () => {
    const game = hero('cleave');
    const m = add(game, 5, 3);
    rig(game, 4, 3);
    playerAttacks(game, m, []);
    expect([m.dice, game.state.player.pools.combat.dice]).toEqual([2, 3]);
  });

  it('shows in the Status block with its rounds left', () => {
    const shell = shellOn(arena(), [], { abilities: ['rage'], skill: { step: 6, dice: 1, max: 1 } });
    rig(shell.game!, 5);
    press(shell, 'q');
    expect(shell.character.status).toContain(`Rage ${RAGE_ROUNDS - 1}`);
  });
});

describe('Spec 03, Addendum A: Wild Shape', () => {
  it('+1 Combat step for 20 rounds: melee, defence and Combat checks roll the stepped-up die, never past d12', () => {
    const game = hero('wild_shape');
    rig(game, 5);
    game.useMajor();
    expect(timedLeft(game.state.player, 'wild_shape')).toBe(WILD_SHAPE_ROUNDS - 1);
    expect(game.state.player.pools.combat.step).toBe(6); // the pool itself does not change
    expect(combatStep(game.state.player)).toBe(8);
    expect(poolFor(game, 'combat').step).toBe(8);
    const m = add(game, 5, 3);
    const sides = sidesRolled(game);
    playerAttacks(game, m, []);
    monsterAttacks(game, m, []);
    expect(sides.filter((s) => s === 8)).toHaveLength(2); // the player's die, attacking and defending
    // It ends after its rounds.
    game.state.monsters.length = 0;
    for (let i = 0; i < WILD_SHAPE_ROUNDS - 1; i++) game.act({ type: 'wait' });
    expect(combatStep(game.state.player)).toBe(6);
    // At d12 it stays d12.
    const big = hero('wild_shape', { combatStep: 12 });
    rig(big, 5);
    big.useMajor();
    expect(combatStep(big.state.player)).toBe(12);
  });
});

describe('Spec 03, Addendum A: Fascinate', () => {
  it('any creature in sight, past another creature and with no range limit, is Held for d6 rounds, quietly', () => {
    const game = hero('fascinate');
    add(game, 6, 3); // stands in the line
    const far = add(game, 11, 3, { alert: false, awareness: 'asleep', id: 2 });
    const unaware = add(game, 10, 5, { alert: false, awareness: 'unaware', id: 3 });
    // The ability itself, before any creature takes its turn (and its own notice roll).
    rig(game, 5, 4); // the skill use, then the d6
    const messages: LogMessage[] = [];
    useActiveMajor(game, 'fascinate', 'Fascinate', far, messages);
    expect(far.statuses).toEqual([expect.objectContaining({ id: 'held', rounds: 4 })]);
    // It makes no noise and alerts no one, and no fight begins.
    expect([far.awareness, unaware.awareness]).toEqual(['asleep', 'unaware']);
    expect(game.state.player.fight).toBeNull();
    expect(said(messages)).toContain('The goblin is fascinated');
    // Through Q, it is one round.
    const round = game.state.round;
    rig(game, 5, 2);
    expect(game.useMajor(unaware)).toMatchObject({ spent: true });
    expect(game.state.round).toBe(round + 1);
  });

  it('a Held creature cannot act: an alert one beside the player does not attack while it lasts', () => {
    const game = hero('fascinate');
    const m = add(game, 5, 3, { modifier: 10 }); // it would win every exchange
    rig(game, 5, 3); // Held for 3 rounds, counting this one
    game.useMajor(m);
    game.act({ type: 'wait' });
    game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBe(4);
    expect(hasStatus(m.statuses, 'held')).toBe(false);
    game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBeLessThan(4);
  });

  it('Q enters targeting over every creature in sight, and Enter fascinates the one chosen', () => {
    const shell = shellOn(arena(), [monsterAt(9, 3, { alert: true, dice: 2 }), monsterAt(12, 3, { alert: true, dice: 2, id: 2 })], { abilities: ['fascinate'], skill: { step: 6, dice: 1, max: 1 } });
    shell.game!.state.map.player = { x: 6, y: 3 };
    shell.game!.refreshSight();
    press(shell, 'q');
    expect(shell.targeting!.targets).toHaveLength(2); // the far one too, behind the near one
    press(shell, 'Tab');
    rig(shell.game!, 5, 6);
    press(shell, 'Enter');
    expect(hasStatus(shell.game!.state.monsters[1]!.statuses, 'held')).toBe(true);
    expect(shell.targeting).toBeNull();
  });

  it('with no creature in sight, Q says so and spends no round', () => {
    const shell = shellOn(arena(), [], { abilities: ['fascinate'] });
    const turn = shell.turn;
    press(shell, 'q');
    expect(shell.turn).toBe(turn);
    expect(shell.log.lines(shell.turn).at(-1)!.text).toBe('There is no creature in sight.');
  });
});

describe('Spec 03, Addendum A: Mark', () => {
  it('marks an asleep or unaware creature in sight, quietly; each of the player\'s hits on it removes one extra die', () => {
    const game = hero('mark');
    const m = add(game, 5, 3, { alert: false, awareness: 'unaware', dice: 5 });
    rig(game, 5);
    game.useMajor(m);
    expect(game.state.mark).toBe(m.id);
    expect(m.awareness).toBe('unaware');
    rig(game, 6, 1, 1); // a melee hit (the unaware creature rolls with disadvantage)
    playerAttacks(game, m, []);
    expect(m.dice).toBe(3);
  });

  it('Mark with a crossbow removes 3 dice; it ends when the creature dies', () => {
    const game = hero('mark', { equipment: { ranged: gear('crossbow') }, pack: [ammo('bolts', 5)] });
    const m = add(game, 9, 3, { alert: false, awareness: 'asleep', dice: 4 });
    rig(game, 5);
    game.useMajor(m);
    rig(game, 5);
    game.fire(m);
    expect(m.dice).toBe(1);
    game.act({ type: 'wait' });
    game.act({ type: 'wait' }); // loaded again
    rig(game, 5);
    game.fire(m);
    expect(game.state.monsters).not.toContain(m);
    expect(game.state.mark).toBeNull();
  });

  it('one mark at a time: marking another moves it', () => {
    const game = hero('mark');
    const a = add(game, 5, 3, { alert: false, awareness: 'unaware' });
    const b = add(game, 4, 5, { alert: false, awareness: 'unaware', id: 2 });
    rig(game, 5);
    game.useMajor(a);
    rig(game, 5);
    game.useMajor(b);
    expect(game.state.mark).toBe(b.id);
    a.awareness = 'alert';
    rig(game, 6, 1);
    playerAttacks(game, a, []);
    expect(a.dice).toBe(2); // no extra die on the old mark
  });

  it('it needs an asleep or unaware target: an alert creature cannot be marked, and Q says so with no round spent', () => {
    const game = hero('mark');
    const m = add(game, 5, 3);
    expect(game.useMajor(m)).toMatchObject({ spent: false, messages: [{ text: 'There is no unaware creature in sight.' }] });
    add(game, 6, 3, { alert: false, awareness: 'unaware', id: 2 });
    expect(game.useMajor(m)).toMatchObject({ spent: false, messages: [{ text: 'That is not a valid target.' }] });
    const shell = shellOn(arena(), [monsterAt(5, 1, { alert: true, dice: 3 })], { abilities: ['mark'] });
    const turn = shell.turn;
    press(shell, 'q');
    expect(shell.turn).toBe(turn);
    expect(shell.log.lines(shell.turn).at(-1)!.text).toBe('There is no unaware creature in sight.');
  });

  it('the mark belongs to the level visit: a new visit starts unmarked', () => {
    const shell = shellOn(arena(), [monsterAt(5, 1, { dice: 3 })], { abilities: ['mark'] });
    press(shell, 'q');
    rig(shell.game!, 5);
    press(shell, 'Enter');
    expect(shell.game!.state.mark).not.toBeNull();
    expect(Object.keys(shell.game!.captureDelta())).not.toContain('mark');
  });
});

describe('Spec 03, Addendum A: Spirit Totem', () => {
  it('stands on a free adjacent cell (the one faced first), blocks movement but not sight', () => {
    const game = hero('spirit_totem');
    rig(game, 5);
    game.useMajor();
    expect(game.state.map.totem).toEqual({ x: 4, y: 4 }); // facing south
    expect(isOpen(game.state.map, 4, 4)).toBe(false);
    const before = { ...game.state.map.player };
    expect(game.act({ type: 'move', dx: 0, dy: 1 })).toMatchObject({ spent: false });
    expect(game.state.map.player).toEqual(before);
    // A creature beyond it is still seen.
    const m = add(game, 4, 6, { alert: false });
    game.refreshSight();
    expect(game.state.map.visible[m.y * game.state.map.level.width + m.x]).toBe(1);
  });

  it('waiting beside it restores a Combat die every 5 rounds; with Hardy too the shortest wins', () => {
    const game = hero('spirit_totem', { combatDice: 2 });
    rig(game, 5);
    game.useMajor();
    expect(besideTotem(game)).toBe(true);
    expect(waitRoundsNow(game)).toBe(TOTEM_WAIT_ROUNDS);
    for (let i = 0; i < TOTEM_WAIT_ROUNDS - 1; i++) game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBe(2);
    game.act({ type: 'wait' });
    expect(game.state.player.pools.combat.dice).toBe(3);
    // Away from it, the usual 10.
    game.act({ type: 'move', dx: 0, dy: -1 });
    game.act({ type: 'move', dx: 0, dy: -1 });
    expect(besideTotem(game)).toBe(false);
    expect(waitRoundsNow(game)).toBe(10);
    const hardy = hero('spirit_totem', { minorAbilities: ['hardy'] });
    expect(waitRoundsNow(hardy)).toBe(8);
    rig(hardy, 5);
    hardy.useMajor();
    expect(waitRoundsNow(hardy)).toBe(TOTEM_WAIT_ROUNDS);
  });

  it('one at a time: a new totem takes the old one down; the pane counts toward 5 beside it', () => {
    const shell = shellOn(arena(), [], { abilities: ['spirit_totem'], skill: { step: 6, dice: 2, max: 2 } });
    const game = shell.game!;
    rig(game, 5);
    press(shell, 'q');
    const first = { ...game.state.map.totem! };
    expect(shell.character.wait.needed).toBe(TOTEM_WAIT_ROUNDS);
    press(shell, 'd'); // step east, facing east
    rig(game, 5);
    press(shell, 'q');
    expect(game.state.map.totem).not.toEqual(first);
    expect(isOpen(game.state.map, first.x, first.y)).toBe(true);
  });

  it('with no free cell beside the player, Q says so and spends no round', () => {
    const game = gameAt(room(1, 1, 1, 1), 1, 1, { abilities: ['spirit_totem'] });
    expect(game.useMajor()).toMatchObject({ spent: false, messages: [{ text: 'There is no room beside you for a totem.' }] });
  });
});

describe('Spec 03, Addendum A: Volley', () => {
  const ranger = (weapon = 'shortbow', type = 'arrows', count = 10) => hero('volley', { equipment: { ranged: gear(weapon) }, pack: [ammo(type, count)] });
  const shots = (game: Game) => ammoCount(game.state.player.pack, 'arrow');

  it('one Skill roll as a ranged attack resolves a shot at each of two targets, one shot each, in one round', () => {
    const game = ranger();
    const a = add(game, 8, 3);
    const b = add(game, 8, 5, { id: 2 });
    const round = game.state.round;
    rig(game, 5);
    const result = game.useMajor([a, b]);
    expect(result.spent).toBe(true);
    expect(game.state.round).toBe(round + 1);
    expect([a.dice, b.dice]).toEqual([2, 2]);
    expect(shots(game)).toBe(8);
    expect(game.state.player.pools.skill.dice).toBe(2);
    // A miss misses both, still spends both shots, and a 1 loses the die.
    rig(game, 1);
    game.useMajor([a, b]);
    expect([a.dice, b.dice]).toEqual([2, 2]);
    expect(shots(game)).toBe(6);
    expect(game.state.player.pools.skill.dice).toBe(1);
  });

  it('a crossbow volley removes 2 dice from each, and either target adjacent gives the roll disadvantage', () => {
    const game = ranger('crossbow', 'bolts');
    const a = add(game, 8, 3);
    const b = add(game, 8, 5, { id: 2 });
    rig(game, 5);
    game.useMajor([a, b]);
    expect([a.dice, b.dice]).toEqual([1, 1]);
    const close = ranger();
    const near = add(close, 5, 3);
    const far = add(close, 8, 5, { id: 2 });
    rig(close, 5, 1); // disadvantage: the lower, 1
    expect(said(close.useMajor([near, far]))).toContain('Your shot misses the goblin. | Your shot misses the goblin.');
    expect([far.dice, close.state.player.pools.skill.dice]).toEqual([3, 1]);
  });

  it('needs a readied ranged weapon that can fire, not a thrown dagger; and two different targets', () => {
    const dagger = hero('volley', { pack: [gear('dagger')] });
    const m = add(dagger, 8, 3);
    expect(dagger.useMajor([m])).toMatchObject({ spent: false, messages: [{ text: 'Volley needs a readied ranged weapon.' }] });
    const empty = ranger('shortbow', 'sling_stones', 5);
    add(empty, 8, 3);
    expect(said(empty.useMajor([empty.state.monsters[0]!]))).toContain('out of ammunition');
    const game = ranger();
    const a = add(game, 8, 3);
    expect(game.useMajor([a, a])).toMatchObject({ spent: false, messages: [{ text: 'Choose two different targets.' }] });
  });

  it('with one shot left, the volley is a single shot at the first target', () => {
    const game = ranger('shortbow', 'arrows', 1);
    const a = add(game, 8, 3);
    const b = add(game, 8, 5, { id: 2 });
    rig(game, 5);
    game.useMajor([a, b]);
    expect([a.dice, b.dice]).toEqual([2, 3]);
    expect(shots(game)).toBe(0);
  });

  it('Q enters targeting: Enter picks a first and then a second, different target', () => {
    const shell = shellOn(arena(), [monsterAt(5, 5, { alert: true, dice: 3 }), monsterAt(8, 1, { alert: true, dice: 3, id: 2 })], {
      abilities: ['volley'],
      equipment: { ranged: gear('shortbow') },
      pack: [ammo('arrows', 10)],
      skill: { step: 6, dice: 2, max: 2 },
    });
    press(shell, 'q');
    expect(shell.targeting!.targets).toHaveLength(2);
    const first = shell.targeting!.selected;
    press(shell, 'Enter');
    expect(shell.log.lines(shell.turn).at(-1)!.text).toBe('Choose a second target.');
    expect(shell.targeting!.targets).toHaveLength(1);
    expect(shell.targeting!.targets).not.toContain(first);
    rig(shell.game!, 5);
    press(shell, 'Enter');
    expect(shell.targeting).toBeNull();
    expect(shell.game!.state.monsters.map((m) => m.dice)).toEqual([2, 2]);
  });

  it('with one valid target, Enter fires at that one', () => {
    const shell = shellOn(arena(), [monsterAt(5, 5, { alert: true, dice: 3 })], { abilities: ['volley'], equipment: { ranged: gear('shortbow') }, pack: [ammo('arrows', 10)], skill: { step: 6, dice: 2, max: 2 } });
    press(shell, 'q');
    rig(shell.game!, 5);
    press(shell, 'Enter');
    expect(shell.targeting).toBeNull();
    expect(shell.game!.state.monsters[0]!.dice).toBe(2);
    expect(ammoCount(shell.game!.state.player.pack, 'arrow')).toBe(9);
  });
});
