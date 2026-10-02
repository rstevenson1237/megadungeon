// Task 3.6: the passive and trade major abilities, Q and its list, fights, and extra dice adding up (Spec 03,
// Addendum A; Spec 06, Addendum A). Each ability has its scripted arena test.

import { describe, expect, it } from 'vitest';
import type { LogMessage } from '../src/core/log.ts';
import { FIGHT_QUIET_ROUNDS, shieldWallReady } from '../src/game/abilities.ts';
import { monsterAttacks, playerAttacks } from '../src/game/combat.ts';
import type { Game } from '../src/game/game.ts';
import { castSpell } from '../src/game/magic.ts';
import { describeItem } from '../src/rules/items/magic.ts';
import type { Item } from '../src/rules/items/types.ts';
import type { Feature, Level } from '../src/rules/world/level.ts';
import { ammo, cell, gameAt, gear, magic, monsterAt, press, rig, room, shellOn, spell, townRun, withThings } from './helpers.ts';

const said = (r: { messages: { text: string }[] } | LogMessage[]): string => ('messages' in r ? r.messages : r).map((m) => m.text).join(' | ');
const arena = (): Level => room(10, 7, 1, 1);
/** A player at (4,3) with the given major ability and four Combat dice, bare-handed unless given gear. */
const fighter = (ability: string, extra: Parameters<typeof gameAt>[3] = {}): Game =>
  gameAt(arena(), 4, 3, { pack: [], equipment: {}, combatDice: 4, combatMax: 4, skill: { step: 6, dice: 2, max: 2 }, magic: { step: 6, dice: 2, max: 2 }, abilities: [ability], ...extra });
/** Wait out a fight: the first wait closes the round the exchange happened in, then 10 quiet rounds end it. */
const waitOutFight = (game: Game): void => {
  for (let i = 0; i <= FIGHT_QUIET_ROUNDS; i++) game.act({ type: 'wait' });
};
const add = (game: Game, x: number, y: number, extra: Parameters<typeof monsterAt>[2] = {}) => {
  const m = monsterAt(x, y, { alert: true, dice: 3, ...extra });
  game.state.monsters.push(m);
  return m;
};

describe('Spec 03, Addendum A: a fight', () => {
  it('begins with the first exchange involving the player, and ends after 10 rounds in a row with none', () => {
    const game = fighter('cleave');
    const m = add(game, 5, 3);
    expect(game.state.player.fight).toBeNull();
    rig(game, 1, 1); // a tie: both hit
    playerAttacks(game, m, []);
    expect(game.state.player.fight).toEqual({ last: game.state.round, used: [] });
    game.state.monsters.length = 0;
    for (let i = 0; i < FIGHT_QUIET_ROUNDS; i++) game.act({ type: 'wait' }); // the first closes the round of the exchange
    expect(game.state.player.fight).not.toBeNull();
    game.act({ type: 'wait' });
    expect(game.state.player.fight).toBeNull();
  });

  it("a creature's melee or ranged attack on the player, the player's shot and a spell aimed at a creature each begin one", () => {
    const melee = fighter('cleave');
    monsterAttacks(melee, add(melee, 5, 3), []);
    expect(melee.state.player.fight).not.toBeNull();
    const shot = fighter('cleave', { equipment: { ranged: gear('sling') }, pack: [ammo('sling_stones', 5)] });
    shot.fire(add(shot, 7, 3));
    expect(shot.state.player.fight).not.toBeNull();
    const spellGame = fighter('cleave', { spells: ['arcane_bolt'] });
    rig(spellGame, 5);
    castSpell(spellGame, spell('arcane_bolt'), add(spellGame, 7, 3), []);
    expect(spellGame.state.player.fight).not.toBeNull();
    // A self spell is not aimed at a creature.
    const self = fighter('cleave', { spells: ['shield'] });
    rig(self, 5);
    castSpell(self, spell('shield'), undefined, []);
    expect(self.state.player.fight).toBeNull();
  });
});

describe('Spec 03, Addendum A: the passive major abilities', () => {
  it('Cleave: a melee hit that kills makes one more exchange against the next adjacent hostile creature clockwise from north, once', () => {
    const game = fighter('cleave');
    const east = add(game, 5, 3, { dice: 1 });
    const south = add(game, 4, 4, { dice: 1, id: 2 });
    const west = add(game, 3, 3, { dice: 1, id: 3 });
    const north = add(game, 4, 2, { kind: 'rival', hostile: false, id: 4 }); // a peaceful rival is passed over
    const round = game.state.round;
    rig(game, 6, 1, 6, 1, 6, 1); // kill east; the cleave kills south (east, then south, clockwise from north); nothing more
    const messages: LogMessage[] = [];
    playerAttacks(game, east, messages);
    expect(game.state.monsters).not.toContain(east);
    expect(game.state.monsters).not.toContain(south);
    expect(game.state.monsters).toContain(west); // it carries only once
    expect(north.dice).toBe(3);
    expect(said(messages)).toContain('You cleave on into the goblin.');
    expect(game.state.round).toBe(round); // no extra round
    // Without Cleave the kill ends there.
    const plain = fighter('backstab');
    const a = add(plain, 5, 3, { dice: 1 });
    const b = add(plain, 4, 4, { dice: 1, id: 2 });
    rig(plain, 6, 1);
    playerAttacks(plain, a, []);
    expect(plain.state.monsters).toEqual([b]);
  });

  it('Backstab: a Light weapon on an asleep or unaware creature hits with no exchange and removes 2 dice', () => {
    for (const awareness of ['unaware', 'asleep'] as const) {
      const game = fighter('backstab', { equipment: { main: gear('dagger') } });
      const m = add(game, 5, 3, { alert: false, awareness });
      rig(game, 1, 6); // were there an exchange, the creature's 6 would beat the player's 1
      playerAttacks(game, m, []);
      expect(m.dice, awareness).toBe(1);
      expect(game.state.player.pools.combat.dice).toBe(4);
    }
    const check = (main: Item | undefined, alert: boolean, ability = 'backstab') => {
      const game = fighter(ability, { equipment: main ? { main } : {} });
      const m = add(game, 5, 3, { alert });
      rig(game, 1, 6, 6); // the player's 1; the creature's 6 (twice, for an unaware one's disadvantage)
      playerAttacks(game, m, []);
      return [m.dice, game.state.player.pools.combat.dice];
    };
    expect(check(gear('dagger'), true)).toEqual([3, 3]); // alert: an ordinary exchange
    expect(check(undefined, false)).toEqual([3, 3]); // bare hands are not Light
    expect(check(gear('mace'), false)).toEqual([3, 3]); // nor is a mace
    expect(check(gear('dagger'), false, 'cleave')).toEqual([3, 3]); // only a Thief backstabs
  });

  it('Shield Wall: the first hit taken in each fight is ignored, armour does not roll to break, and the pane shows when it is ready', () => {
    const game = fighter('shield_wall', { equipment: { body: gear('leather', 'crude') } });
    const m = add(game, 5, 3);
    expect(shieldWallReady(game.state.player)).toBe(true);
    rig(game, 6, 1); // the creature wins; were armour to roll, the next number would be its break roll
    const messages: LogMessage[] = [];
    monsterAttacks(game, m, messages);
    expect(game.state.player.pools.combat.dice).toBe(4);
    expect(said(messages)).toContain('Your shield wall turns the blow.');
    expect(shieldWallReady(game.state.player)).toBe(false);
    rig(game, 6, 1, 100);
    monsterAttacks(game, m, []);
    expect(game.state.player.pools.combat.dice).toBe(3);
    // A new fight, after 10 quiet rounds: ready again.
    game.state.monsters.length = 0;
    waitOutFight(game);
    expect(shieldWallReady(game.state.player)).toBe(true);
    game.state.monsters.push(m);
    const before = game.state.player.pools.combat.dice; // waiting brought a die back
    rig(game, 6, 1);
    monsterAttacks(game, m, []);
    expect(game.state.player.pools.combat.dice).toBe(before);
  });

  it('Flurry: winning a melee exchange by 3 or more removes one extra die, attacking or defending', () => {
    const attack = (faces: number[], ability = 'flurry') => {
      const game = fighter(ability); // bare hands: -1
      const m = add(game, 5, 3);
      rig(game, ...faces);
      playerAttacks(game, m, []);
      return m.dice;
    };
    expect(attack([6, 2])).toBe(1); // 5 against 2: by 3
    expect(attack([5, 2])).toBe(2); // 4 against 2: by 2
    expect(attack([6, 2], 'cleave')).toBe(2);
    const game = fighter('flurry');
    const m = add(game, 5, 3);
    rig(game, 1, 6); // the creature's 1 against the player's 6
    monsterAttacks(game, m, []);
    expect(m.dice).toBe(1);
  });

  it('Overchannel: the first spell roll of 2 to 3 in each fight loses no die', () => {
    const game = fighter('overchannel', { spells: ['drain'], magic: { step: 6, dice: 3, max: 3 }, combatDice: 2 });
    const m = add(game, 7, 3, { dice: 6 });
    const cast = (face: number): number => {
      rig(game, face);
      castSpell(game, spell('drain'), m, []);
      return game.state.player.pools.magic.dice;
    };
    expect(cast(3)).toBe(3); // the first 2 to 3 of the fight: kept
    expect(cast(2)).toBe(2); // the second: lost
    // The fight ends after 10 quiet rounds; the next one has it again.
    game.state.monsters.length = 0;
    waitOutFight(game);
    game.state.monsters.push(m);
    expect(cast(2)).toBe(2);
    // Without it, a 2 to 3 loses the die.
    const plain = fighter('cleave', { spells: ['drain'], magic: { step: 6, dice: 3, max: 3 } });
    rig(plain, 3);
    castSpell(plain, spell('drain'), add(plain, 7, 3, { dice: 6 }), []);
    expect(plain.state.player.pools.magic.dice).toBe(2);
  });

  it('Hex Breaker: a floor rune never discharges (a 1 simply fails)', () => {
    const rune: Feature = { type: 'fixture', kind: 'rune', x: 5, y: 3 };
    const step = (ability: string) => {
      const game = gameAt(withThings(arena(), { features: [rune] }), 4, 3, { abilities: [ability], combatDice: 4, combatMax: 4, pack: [], equipment: {} });
      rig(game, 1, 1, 1, 1);
      const result = game.act({ type: 'move', dx: 1, dy: 0 })!;
      return { spent: game.state.used.features[0]?.done === true, text: said(result) };
    };
    expect(step('hex_breaker')).toEqual({ spent: false, text: 'The rune glows faintly, then dims.' });
    expect(step('cleave').spent).toBe(true); // it discharges
  });

  it('Hex Breaker: a wall rune read on a 1 simply fails, and is not spent', () => {
    const level = withThings(arena(), { lore: [{ x: 5, y: 2, kind: 'rune', id: 'rune_letter_k', text: 'K', link: 'rune_word_1', index: 0 }] });
    const game = gameAt(level, 5, 3, { abilities: ['hex_breaker'], combatDice: 4, combatMax: 4, pack: [], equipment: {} });
    game.state.player.facing = { dx: 0, dy: -1 };
    rig(game, 1);
    expect(said(game.act({ type: 'interact' })!)).toContain('The rune glows faintly, then dims.');
    expect(game.state.used.marks).toEqual([]);
  });

  it('Hex Breaker: a trap tagged magic does nothing when sprung, and is spent', () => {
    const level = withThings(arena(), { traps: [{ x: 5, y: 3, id: 'trap_teleport' }] });
    const spring = (ability: string) => {
      const game = gameAt(level, 4, 3, { abilities: [ability], combatDice: 4, combatMax: 4, skill: { step: 6, dice: 2, max: 2 }, pack: [], equipment: {} });
      rig(game, 2); // the avoid check fails
      const result = game.act({ type: 'move', dx: 1, dy: 0 })!;
      return { at: { ...game.state.map.player }, spent: game.state.used.disarmed.includes(cell(level, 5, 3)), text: said(result) };
    };
    expect(spring('hex_breaker')).toMatchObject({ at: { x: 5, y: 3 }, spent: true });
    expect(spring('hex_breaker').text).toContain('Its magic breaks against you');
    expect(spring('cleave').at).not.toEqual({ x: 5, y: 3 }); // teleported
  });

  it('Hex Breaker: a ranged hit on a creature with the caster behaviour removes one extra die', () => {
    const shoot = (ability: string, behaviour: string) => {
      const game = fighter(ability, { equipment: { ranged: gear('sling') }, pack: [ammo('sling_stones', 5)] });
      const m = add(game, 7, 3, { behaviour });
      rig(game, 5);
      game.fire(m);
      return m.dice;
    };
    expect(shoot('hex_breaker', 'caster')).toBe(1);
    expect(shoot('hex_breaker', 'brute')).toBe(2);
    expect(shoot('cleave', 'caster')).toBe(2);
  });

  it('Brew: every potion shows its true kind; each village rest brews one potion by depth, seeded by run seed and rest count', () => {
    const run = townRun(4242, { abilities: ['brew'], pack: [magic('potion_haste')] });
    run.player.town.bank = 500;
    expect(describeItem(run.player.pack[0]!, run.ctx().knowledge)).toBe('Potion of Haste');
    const plain = townRun(4242, { pack: [magic('potion_haste')] });
    expect(describeItem(plain.player.pack[0]!, plain.ctx().knowledge)).not.toBe('Potion of Haste');
    const rest = run.town.rest();
    expect(said(rest)).toMatch(/You brew a Potion of [A-Za-z]+ as you rest\./);
    expect(run.player.pack.filter((i) => i.kind === 'potion').length).toBeGreaterThanOrEqual(1);
    const brewed = said(rest).match(/brew a (.+?) as/)![1];
    // The same seed and rest count brew the same potion.
    const again = townRun(4242, { abilities: ['brew'], pack: [] });
    again.player.town.bank = 500;
    expect(said(again.town.rest())).toContain(`brew a ${brewed} as`);
    // With no room it is lost, and the log says so.
    const full = townRun(4242, { abilities: ['brew'], pack: Array.from({ length: 12 }, () => gear('dagger', 'normal')) });
    full.player.town.bank = 500;
    expect(said(full.town.rest())).toContain('your pack is full and it is lost');
    expect(full.player.pack).toHaveLength(12);
  });
});

describe('Spec 03, Addendum A: the trades', () => {
  it('Smite: Q readies it and Q cancels it, with no round; the next melee hit spends a Magic die with no roll and removes one extra die', () => {
    const game = fighter('smite');
    const round = game.state.round;
    expect(game.useMajor()).toMatchObject({ spent: false });
    expect(game.state.player.smite).toBe(true);
    expect(game.useMajor()).toMatchObject({ spent: false });
    expect(game.state.player.smite).toBe(false);
    game.useMajor();
    const m = add(game, 5, 3);
    rig(game, 1, 6); // a miss does not spend it
    playerAttacks(game, m, []);
    expect([game.state.player.smite, game.state.player.pools.magic.dice]).toEqual([true, 2]);
    rig(game, 5, 2); // a hit by 2: Smite only
    playerAttacks(game, m, []);
    expect([m.dice, game.state.player.smite, game.state.player.pools.magic.dice]).toEqual([1, false, 1]);
    expect(game.state.round).toBe(round);
    // It cannot be readied with no Magic die.
    const empty = fighter('smite', { magic: { step: 6, dice: 0, max: 2 } });
    expect(said(empty.useMajor())).toBe('You need a Magic die to ready Smite.');
    expect(empty.state.player.smite).toBe(false);
  });

  it('Pact: one round and no roll, one Combat die for one Magic die; it needs a die to give and one missing', () => {
    const game = fighter('pact', { magic: { step: 6, dice: 0, max: 1 } });
    const round = game.state.round;
    const result = game.useMajor();
    expect(result.spent).toBe(true);
    expect(game.state.round).toBe(round + 1);
    expect([game.state.player.pools.combat.dice, game.state.player.pools.magic.dice]).toEqual([3, 1]);
    expect(game.useMajor()).toMatchObject({ spent: false, messages: [{ text: 'Your Magic dice are full.' }] });
    const spent = fighter('pact', { combatDice: 0, magic: { step: 6, dice: 0, max: 1 } });
    expect(spent.useMajor()).toMatchObject({ spent: false, messages: [{ text: 'You have no Combat die to give.' }] });
  });

  it('extra dice add up: Backstab with a readied Smite removes 3', () => {
    const game = fighter('backstab', { equipment: { main: gear('dagger') } });
    game.state.player.smite = true; // as if readied (two majors never meet in play; the rule is that extras add)
    const m = add(game, 5, 3, { alert: false, dice: 4 });
    playerAttacks(game, m, []);
    expect(m.dice).toBe(1);
  });
});

describe('Spec 03, Addendum A: Q and its list', () => {
  it('Q on a passive ability says so and spends no round', () => {
    for (const id of ['cleave', 'backstab', 'shield_wall', 'flurry', 'overchannel', 'brew', 'hex_breaker']) {
      const shell = shellOn(arena(), [], { abilities: [id] });
      const turn = shell.turn;
      press(shell, 'q');
      expect(shell.turn, id).toBe(turn);
      expect(shell.log.lines(shell.turn).at(-1)!.text, id).toMatch(/works by itself/);
    }
  });

  it('Q casts Arcane Bolt as C would: it asks for a target, and Enter fires it', () => {
    const shell = shellOn(arena(), [monsterAt(5, 1, { alert: true, dice: 3 })], { abilities: ['arcane_bolt'], spells: ['arcane_bolt'], magic: { step: 6, dice: 2, max: 2 } });
    press(shell, 'q');
    expect(shell.targeting).not.toBeNull();
    rig(shell.game!, 6);
    press(shell, 'Enter');
    expect(shell.game!.state.monsters[0]!.dice).toBe(2);
  });

  it('Q casts Heal at once, as C would', () => {
    const shell = shellOn(arena(), [], { abilities: ['heal'], spells: ['heal'], combatDice: 1, combatMax: 3 });
    rig(shell.game!, 6);
    press(shell, 'q');
    expect(shell.game!.state.player.pools.combat.dice).toBe(2);
  });

  it('with an active minor ability drawn too, Q opens a short list, major first, and Enter chooses', () => {
    const shell = shellOn(arena(), [], { abilities: ['pact'], minorAbilities: ['sanctuary'], combatDice: 2, combatMax: 2, magic: { step: 6, dice: 0, max: 1 } });
    press(shell, 'q');
    expect(shell.overlays).toHaveLength(1);
    press(shell, 's'); // down to Sanctuary
    rig(shell.game!, 5);
    press(shell, 'Enter');
    expect(shell.game!.state.player.timed.map((t) => t.id)).toEqual(['sanctuary']);
    press(shell, 'q');
    press(shell, 'Enter'); // the major, first: Pact
    expect(shell.game!.state.player.pools.magic.dice).toBe(1);
  });

  it('the Status block shows a readied Smite and a ready Shield Wall', () => {
    const smite = shellOn(arena(), [], { abilities: ['smite'], magic: { step: 6, dice: 1, max: 1 } });
    press(smite, 'q');
    expect(smite.character.status).toContain('Smite ready');
    const wall = shellOn(arena(), [], { abilities: ['shield_wall'] });
    press(wall, ' ');
    expect(wall.character.status).toContain('Shield Wall ready');
  });
});
