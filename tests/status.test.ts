import { describe, expect, it } from 'vitest';
import type { Rng } from '../src/core/rng.ts';
import { actionsInRound } from '../src/game/ai.ts';
import { takeRest } from '../src/game/game.ts';
import { playerMelee } from '../src/rules/combat/attacks.ts';
import { STATUS_IDS, STATUS_NAMES, applyStatus, cannotAct, checkMode, describeStatus, effectiveSpeed, hasStatus, removeStatus, statusOf, tickStatuses, type StatusEffect } from '../src/rules/magic/status.ts';
import { castingGame, gameOn, monsterAt, rig, room, spell } from './helpers.ts';

const harmless = { modifier: -6, dice: 30, maxDice: 30 };
const wait = (game: ReturnType<typeof gameOn>, n = 1): void => {
  for (let i = 0; i < n; i++) game.act({ type: 'wait' });
};
const dealer = (...faces: number[]): Rng => ({ int: () => faces.shift()! }) as unknown as Rng;

describe('Spec 04: the eight status effects', () => {
  it('are poisoned, slowed, hasted, asleep, held, frightened, blessed and cursed', () => {
    expect(STATUS_IDS).toEqual(['poisoned', 'slowed', 'hasted', 'asleep', 'held', 'frightened', 'blessed', 'cursed']);
    expect(Object.values(STATUS_NAMES)).toEqual(['Poisoned', 'Slowed', 'Hasted', 'Asleep', 'Held', 'Frightened', 'Blessed', 'Cursed']);
  });

  it('never stack: a new application keeps one copy with the longer duration, and no duration is the longest', () => {
    const list: StatusEffect[] = [];
    expect(applyStatus(list, 'held', 3)).toBe('added');
    expect(applyStatus(list, 'held', 2)).toBe('kept');
    expect(applyStatus(list, 'held', 5)).toBe('extended');
    expect(list).toHaveLength(1);
    expect(list[0]!.rounds).toBe(5);
    expect(applyStatus(list, 'held', null)).toBe('extended');
    expect(applyStatus(list, 'held', 9)).toBe('kept');
    expect(list).toEqual([{ id: 'held', rounds: null, clock: 0 }]);
  });

  it('a timed effect ends after its rounds, counting the round it began in', () => {
    const list: StatusEffect[] = [];
    applyStatus(list, 'slowed', 3);
    expect(tickStatuses(list).ended).toEqual([]);
    expect(tickStatuses(list).ended).toEqual([]);
    expect(tickStatuses(list).ended).toEqual(['slowed']);
    expect(list).toEqual([]);
  });

  it('describes each for the Status block, with its rounds left', () => {
    expect(describeStatus({ id: 'hasted', rounds: 3, clock: 0 })).toBe('Hasted 3');
    expect(describeStatus({ id: 'poisoned', rounds: null, clock: 0 })).toBe('Poisoned');
  });
});

describe('Spec 04: speed', () => {
  it('Hasted is fast, Slowed is slow, both together cancel to the creature\'s own speed', () => {
    const hasted: StatusEffect[] = [];
    const slowed: StatusEffect[] = [];
    const both: StatusEffect[] = [];
    applyStatus(hasted, 'hasted', 3);
    applyStatus(slowed, 'slowed', 3);
    applyStatus(both, 'hasted', 3);
    applyStatus(both, 'slowed', 3);
    expect(effectiveSpeed('normal', [])).toBe('normal');
    expect(effectiveSpeed('normal', hasted)).toBe('fast');
    expect(effectiveSpeed('slow', hasted)).toBe('fast');
    expect(effectiveSpeed('normal', slowed)).toBe('slow');
    expect(effectiveSpeed('fast', slowed)).toBe('slow');
    expect(effectiveSpeed('fast', both)).toBe('fast');
    expect(effectiveSpeed('slow', both)).toBe('slow');
  });

  it('a hasted creature acts 200 times and a slowed one 50 over 100 rounds', () => {
    const count = (list: StatusEffect[]) => {
      let n = 0;
      for (let round = 1; round <= 100; round++) n += actionsInRound(effectiveSpeed('normal', list), round);
      return n;
    };
    const hasted: StatusEffect[] = [];
    const slowed: StatusEffect[] = [];
    applyStatus(hasted, 'hasted', null);
    applyStatus(slowed, 'slowed', null);
    expect([count([]), count(hasted), count(slowed)]).toEqual([100, 200, 50]);
  });

  it('a slowed monster really acts every other round', () => {
    const game = gameOn(room(40, 3, 1, 2));
    const m = monsterAt(38, 2, { alert: true, ...harmless });
    applyStatus(m.statuses, 'slowed', null);
    game.state.monsters.push(m);
    wait(game, 10);
    expect(38 - m.x).toBe(5);
  });

  it('a hasted monster moves two cells a round', () => {
    const game = gameOn(room(40, 3, 1, 2));
    const m = monsterAt(38, 2, { alert: true, ...harmless });
    applyStatus(m.statuses, 'hasted', null);
    game.state.monsters.push(m);
    wait(game, 10);
    expect(38 - m.x).toBe(20);
  });

  it('a slowed player takes two rounds to act, so a monster gets two turns for each', () => {
    const game = gameOn(room(40, 3, 1, 2));
    const m = monsterAt(38, 2, { alert: true, ...harmless });
    game.state.monsters.push(m);
    applyStatus(game.state.player.statuses, 'slowed', null);
    wait(game, 5);
    expect(38 - m.x).toBe(10);
    expect(game.state.round).toBe(11);
  });

  it('a hasted player acts twice before the monsters move once', () => {
    const game = gameOn(room(40, 3, 1, 2));
    const m = monsterAt(38, 2, { alert: true, ...harmless });
    game.state.monsters.push(m);
    applyStatus(game.state.player.statuses, 'hasted', null);
    wait(game, 10);
    expect(38 - m.x).toBe(5);
    expect(game.state.round).toBe(6);
  });

  it('Hasted and Slowed together leave the player at normal speed', () => {
    const game = gameOn(room(40, 3, 1, 2));
    applyStatus(game.state.player.statuses, 'hasted', null);
    applyStatus(game.state.player.statuses, 'slowed', null);
    wait(game, 4);
    expect(game.state.round).toBe(5);
  });
});

describe('Spec 04: poisoned', () => {
  it('costs a Combat die every 20 rounds, and has no duration of its own', () => {
    const game = gameOn(room(10, 3, 1, 2), { combatDice: 4, combatMax: 4 });
    applyStatus(game.state.player.statuses, 'poisoned', null);
    wait(game, 19);
    expect(game.state.player.combatDice).toBe(4);
    wait(game);
    expect(game.state.player.combatDice).toBe(3);
    wait(game, 40);
    expect(game.state.player.combatDice).toBe(1);
    expect(hasStatus(game.state.player.statuses, 'poisoned')).toBe(true);
  });

  it('waiting does not recover dice while poisoned', () => {
    const game = gameOn(room(10, 3, 1, 2), { combatDice: 1, combatMax: 4 });
    applyStatus(game.state.player.statuses, 'poisoned', null);
    // The 20th round takes the die; the player has none left to recover with.
    wait(game, 19);
    expect(game.state.player.combatDice).toBe(1);
    const healthy = gameOn(room(10, 3, 1, 2), { combatDice: 1, combatMax: 4 });
    wait(healthy, 10);
    expect(healthy.state.player.combatDice).toBe(2); // the same ten rounds restore one die when not poisoned
  });

  it('a poison tick with no Combat dice left is fatal, as any hit is', () => {
    const game = gameOn(room(10, 3, 1, 2), { combatDice: 0, combatMax: 4 });
    applyStatus(game.state.player.statuses, 'poisoned', null);
    wait(game, 20);
    expect(game.state.player.dead).toBe(true);
  });

  it('a poisoned monster loses a die every 20 rounds and dies at zero', () => {
    const game = gameOn(room(10, 3, 1, 2));
    const m = monsterAt(9, 2, { awareness: 'unaware', dice: 2, maxDice: 2, modifier: -6 });
    applyStatus(m.statuses, 'poisoned', null);
    game.state.monsters.push(m);
    const stay = () => (m.awareness = 'unaware'); // keep it from joining the fight
    for (let i = 0; i < 20; i++) {
      stay();
      wait(game);
    }
    expect(m.dice).toBe(1);
    for (let i = 0; i < 20; i++) {
      stay();
      wait(game);
    }
    expect(game.state.monsters).not.toContain(m);
  });

  it('a village rest ends it and restores every pool', () => {
    const game = gameOn(room(10, 3, 1, 2), { combatDice: 1, combatMax: 3, magic: { step: 6, dice: 0, max: 2 }, skill: { step: 6, dice: 0, max: 2 } });
    applyStatus(game.state.player.statuses, 'poisoned', null);
    applyStatus(game.state.player.statuses, 'cursed', null);
    takeRest(game.state.player);
    const p = game.state.player;
    expect([p.combatDice, p.magic.dice, p.skill.dice, p.rests]).toEqual([3, 2, 2, 1]);
    expect(hasStatus(p.statuses, 'poisoned')).toBe(false);
    expect(hasStatus(p.statuses, 'cursed')).toBe(true); // a rest does not lift a curse
  });
});

describe('Spec 04: asleep and held', () => {
  it('an Asleep monster cannot act, and melee against it has advantage', () => {
    const asleep: StatusEffect[] = [];
    applyStatus(asleep, 'asleep', 5);
    expect(cannotAct(asleep)).toBe(true);
    // Advantage keeps the higher of two dice.
    const shares = (sleeping: boolean) => {
      const monster = { modifier: 0, unaware: false, asleep: sleeping };
      let hits = 0;
      let n = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) for (let d = 1; d <= 6; d++) {
        const r = playerMelee(dealer(...(sleeping ? [a, b, d] : [a, d])), { step: 6, dice: 3 }, monster);
        if (r.defenderHit) hits++;
        n++;
      }
      return hits / n;
    };
    expect(shares(true)).toBeGreaterThan(shares(false));
  });

  it('a creature put to sleep stays where it is for its rounds, then goes back to hunting', () => {
    const game = castingGame(room(30, 3, 1, 2));
    const m = monsterAt(6, 2, { alert: true, ...harmless });
    game.state.monsters.push(m);
    rig(game, 6, 3);
    game.cast(spell('sleep'), m);
    wait(game);
    expect(m.x).toBe(6); // asleep in rounds 1 and 2
    expect(statusOf(m.statuses, 'asleep')!.rounds).toBe(1);
    wait(game);
    expect(m.x).toBe(6); // and in round 3, when it ends
    expect(hasStatus(m.statuses, 'asleep')).toBe(false);
    wait(game);
    expect(m.x).toBe(5); // hunting again
  });

  it('a hit on a sleeper wakes it', () => {
    const game = castingGame(room(10, 3, 1, 2));
    const m = monsterAt(2, 2, { alert: true, dice: 3, maxDice: 3, modifier: -6 });
    applyStatus(m.statuses, 'asleep', 9);
    game.state.monsters.push(m);
    rig(game, 6, 6, 1); // advantage on the player's die, then the monster's d6
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(hasStatus(m.statuses, 'asleep')).toBe(false);
    expect(m.dice).toBeLessThan(3); // hit, and then it fought back and lost again
  });

  it('a Held monster cannot act, but is not woken by being hit', () => {
    const game = gameOn(room(10, 3, 1, 2));
    const m = monsterAt(2, 2, { alert: true, dice: 3, maxDice: 3, modifier: 30 });
    applyStatus(m.statuses, 'held', 9);
    game.state.monsters.push(m);
    wait(game, 3);
    expect(game.state.player.combatDice).toBe(2); // it never struck
    expect(hasStatus(m.statuses, 'held')).toBe(true);
  });

  it('an Asleep or Held player loses their actions while the monsters carry on, and a hit wakes the sleeper', () => {
    const game = gameOn(room(10, 3, 1, 2), { combatDice: 4, combatMax: 4 });
    const m = monsterAt(5, 2, { alert: true, ...harmless });
    game.state.monsters.push(m);
    applyStatus(game.state.player.statuses, 'held', 2);
    const result = game.act({ type: 'move', dx: 1, dy: 0 })!;
    expect(result.spent).toBe(true);
    expect(game.state.map.player).toEqual({ x: 1, y: 2 }); // it did not move
    expect(result.messages.map((x) => x.text)).toContain('You are held fast.');
    expect(m.x).toBe(4); // the monster did
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(game.state.map.player).toEqual({ x: 1, y: 2 });
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(game.state.map.player).toEqual({ x: 2, y: 2 }); // free again

    const sleeper = gameOn(room(10, 3, 1, 2), { combatDice: 4, combatMax: 4 });
    const hitter = monsterAt(2, 2, { alert: true, modifier: 30, dice: 5, maxDice: 5, fearless: true });
    sleeper.state.monsters.push(hitter);
    applyStatus(sleeper.state.player.statuses, 'asleep', 20);
    wait(sleeper);
    expect(sleeper.state.player.combatDice).toBe(3);
    expect(hasStatus(sleeper.state.player.statuses, 'asleep')).toBe(false);
  });
});

describe('Spec 04: frightened', () => {
  it('a frightened player may not step nearer the source, but may step away or fight', () => {
    const game = gameOn(room(10, 3, 3, 2));
    const source = { x: 6, y: 2 };
    applyStatus(game.state.player.statuses, 'frightened', 5, source);
    expect(game.act({ type: 'move', dx: 1, dy: 0 })).toMatchObject({ spent: false });
    expect(game.state.map.player).toEqual({ x: 3, y: 2 });
    expect(game.act({ type: 'move', dx: -1, dy: 0 })).toMatchObject({ spent: true });
    expect(game.state.map.player).toEqual({ x: 2, y: 2 });
    // Sideways is no nearer here (distance grows or stays), and a creature in the way is fought.
    const fighter = monsterAt(3, 2, { alert: true, ...harmless });
    game.state.monsters.push(fighter);
    const before = fighter.dice;
    game.act({ type: 'move', dx: 1, dy: 0 });
    expect(game.state.map.player).toEqual({ x: 2, y: 2 });
    expect(fighter.dice).toBeLessThan(before); // it attacked: moving into a creature is allowed
  });
});

describe('Spec 04: blessed and cursed', () => {
  it('give advantage and disadvantage on checks, and cancel each other', () => {
    const blessed: StatusEffect[] = [];
    const cursed: StatusEffect[] = [];
    applyStatus(blessed, 'blessed', 20);
    applyStatus(cursed, 'cursed', null);
    expect(checkMode([])).toBe('normal');
    expect(checkMode(blessed)).toBe('advantage');
    expect(checkMode(cursed)).toBe('disadvantage');
    expect(checkMode([...blessed, ...cursed])).toBe('normal');
  });

  it('a curse stays until it is lifted', () => {
    const game = gameOn(room(10, 3, 1, 2));
    applyStatus(game.state.player.statuses, 'cursed', null);
    wait(game, 60);
    expect(hasStatus(game.state.player.statuses, 'cursed')).toBe(true);
    expect(removeStatus(game.state.player.statuses, 'cursed')).toBe(true);
    expect(statusOf(game.state.player.statuses, 'cursed')).toBeUndefined();
  });
});

describe('Spec 04: effects never stack, whatever applies them', () => {
  it('Hold twice leaves one Held with the longer duration', () => {
    const game = castingGame(room(20, 5, 2, 3));
    const m = monsterAt(6, 3, { alert: true, ...harmless });
    game.state.monsters.push(m);
    rig(game, 6);
    game.cast(spell('hold'), m);
    applyStatus(m.statuses, 'held', 8);
    rig(game, 6);
    game.cast(spell('hold'), m);
    expect(m.statuses.filter((s) => s.id === 'held')).toHaveLength(1);
    expect(statusOf(m.statuses, 'held')!.rounds).toBe(7); // 8, less the round of the second cast
  });

  it('a spell cast on a monster already slowed does not add a second Slowed', () => {
    const game = castingGame(room(20, 9, 2, 5));
    const m = monsterAt(6, 5, { alert: true, ...harmless, speed: 'slow' });
    applyStatus(m.statuses, 'slowed', 2);
    game.state.monsters.push(m);
    rig(game, 6);
    game.cast(spell('blizzard'), m);
    expect(m.statuses.filter((s) => s.id === 'slowed')).toHaveLength(1);
    expect(statusOf(m.statuses, 'slowed')!.rounds).toBe(4);
  });
});
