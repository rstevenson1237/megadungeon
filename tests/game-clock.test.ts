import { describe, expect, it } from 'vitest';
import type { LogMessage } from '../src/core/log.ts';
import { type Game, TICKS_PER_ROUND } from '../src/game/game.ts';
import { applyStatus, hasStatus } from '../src/rules/magic/status.ts';
import { gameOn, monsterAt, room } from './helpers.ts';

// Task 5.2, the game clock (Spec 04, Addendum B): ticks, `advance`, and one end of round for both modes.

/** Two games on the same empty room, one to play turn by turn and one in real time, made the same way. */
function pair(setup: (game: Game) => void, combatDice = 4): [Game, Game] {
  const make = (): Game => {
    const game = gameOn(room(12, 5, 2, 3), { combatDice, combatMax: 4 });
    setup(game);
    return game;
  };
  return [make(), make()];
}

/** Every timed thing the end of a round counts down, applied to the player. */
function timedEverything(game: Game): void {
  const { player } = game.state;
  applyStatus(player.statuses, 'poisoned', null);
  applyStatus(player.statuses, 'blessed', 5);
  applyStatus(player.statuses, 'cursed', 12);
  applyStatus(player.statuses, 'frightened', 3, { x: 10, y: 1 });
  player.shield = 4;
  player.invisible = 6;
  player.reload = 2;
  player.timed = [{ id: 'rage', name: 'Rage', rounds: 7 }];
  player.fight = { last: 1, used: [] };
}

describe('Spec 04, Addendum B: the game clock (task 5.2)', () => {
  it('a round is 10 ticks: nine ticks end no round, the tenth does', () => {
    const game = gameOn(room(12, 5, 2, 3));
    expect(TICKS_PER_ROUND).toBe(10);
    expect(game.tick).toBe(0);
    game.advance(9);
    expect(game.state.round).toBe(1);
    game.advance(1);
    expect(game.tick).toBe(10);
    expect(game.state.round).toBe(2);
    game.advance(25);
    expect(game.tick).toBe(35);
    expect(game.state.round).toBe(4);
    game.advance(0);
    expect(game.state.round).toBe(4);
  });

  it('advancing in steps of any size reaches the same state as one advance', () => {
    const [whole, steps] = pair(timedEverything);
    whole.advance(137);
    for (const n of [1, 4, 4, 4, 13, 50, 61]) steps.advance(n);
    expect(steps.tick).toBe(137);
    expect(JSON.stringify(steps.state)).toBe(JSON.stringify(whole.state));
  });

  it('a round in real time runs the same end-of-round work as a waited round in turn mode', () => {
    const [turn, real] = pair(timedEverything);
    for (let r = 0; r < 30; r++) {
      const said: LogMessage[] = turn.act({ type: 'wait' })!.messages;
      const heard = real.advance(TICKS_PER_ROUND);
      expect(heard).toEqual(said);
      expect(JSON.stringify(real.state)).toBe(JSON.stringify(turn.state));
    }
    // The clocks really ran: everything timed has ended, and the poison has bitten once.
    const { player } = real.state;
    expect(real.state.round).toBe(31);
    expect(player.statuses.map((e) => e.id)).toEqual(['poisoned']);
    expect([player.shield, player.invisible, player.reload, player.timed.length]).toEqual([0, 0, 0, 0]);
    expect(player.fight).toBeNull();
    expect(player.pools.combat.dice).toBe(3);
  });

  it('every status effect, timed ability and the poison clock end after the same number of rounds in both modes', () => {
    const [turn, real] = pair(timedEverything);
    const ends = (game: Game, step: () => void): Record<string, number> => {
      const seen: Record<string, number> = {};
      for (let r = 1; r <= 40; r++) {
        step();
        const { player } = game.state;
        const live: Record<string, boolean> = {
          blessed: hasStatus(player.statuses, 'blessed'),
          cursed: hasStatus(player.statuses, 'cursed'),
          frightened: hasStatus(player.statuses, 'frightened'),
          shield: player.shield > 0,
          invisible: player.invisible > 0,
          reload: player.reload > 0,
          rage: player.timed.length > 0,
          poisonBite: player.pools.combat.dice === 4,
        };
        for (const [key, on] of Object.entries(live)) if (!on && seen[key] === undefined) seen[key] = r;
      }
      return seen;
    };
    const turnEnds = ends(turn, () => turn.act({ type: 'wait' }));
    const realEnds = ends(real, () => real.advance(TICKS_PER_ROUND));
    expect(realEnds).toEqual(turnEnds);
    expect(turnEnds).toEqual({ blessed: 5, cursed: 12, frightened: 3, shield: 4, invisible: 6, reload: 2, rage: 7, poisonBite: 20 });
  });

  it('a round with no player action is a waiting round: standing idle for 10 rounds restores a Combat die', () => {
    const game = gameOn(room(12, 5, 2, 3), { combatDice: 2, combatMax: 4 });
    const said = game.advance(9 * TICKS_PER_ROUND);
    expect(game.state.player.pools.combat.dice).toBe(2);
    expect(said).toEqual([]);
    expect(game.advance(TICKS_PER_ROUND)).toEqual([{ kind: 'system', text: 'You feel your strength return.' }]);
    expect(game.state.player.pools.combat.dice).toBe(3);
  });

  it('a round in which the player acted is not a waiting round, and resets the count', () => {
    const game = gameOn(room(12, 5, 2, 3), { combatDice: 2, combatMax: 4 });
    game.advance(5 * TICKS_PER_ROUND);
    expect(game.state.player.waited).toBe(5);
    game.actedThisRound = true;
    game.advance(TICKS_PER_ROUND);
    expect(game.state.player.waited).toBe(0);
    expect(game.actedThisRound).toBe(false); // the flag belongs to the round that ended
    game.advance(TICKS_PER_ROUND);
    expect(game.state.player.waited).toBe(1);
  });

  it('poison bites a monster at the round boundary, as in turn mode', () => {
    const [turn, real] = pair((game) => {
      const m = monsterAt(10, 1, { awareness: 'asleep', dice: 2, maxDice: 2 });
      applyStatus(m.statuses, 'poisoned', null);
      game.state.monsters.push(m);
    });
    // Turn mode's creatures act too; an asleep one with no notice roll in reach does nothing, so the end of round decides.
    for (let r = 0; r < 20; r++) {
      turn.act({ type: 'wait' });
      real.advance(TICKS_PER_ROUND);
    }
    expect(real.state.monsters[0]!.dice).toBe(1);
    expect(turn.state.monsters[0]!.dice).toBe(1);
  });

  it('time stops when the player dies', () => {
    const game = gameOn(room(12, 5, 2, 3), { combatDice: 0, combatMax: 4 });
    applyStatus(game.state.player.statuses, 'poisoned', null);
    const said = game.advance(100 * TICKS_PER_ROUND);
    expect(game.state.player.dead).toBe(true);
    expect(said).toContainEqual({ kind: 'combat', text: 'The poison kills you.' });
    expect(game.state.round).toBe(21);
    expect(game.tick).toBe(20 * TICKS_PER_ROUND);
  });

  it('counts whole ticks only', () => {
    const game = gameOn(room(12, 5, 2, 3));
    expect(() => game.advance(1.5)).toThrow(RangeError);
    expect(() => game.advance(-1)).toThrow(RangeError);
    expect(game.tick).toBe(0);
  });

  it('turn mode never moves the tick, and the tick is not part of the saved game state', () => {
    const game = gameOn(room(12, 5, 2, 3));
    for (let r = 0; r < 5; r++) game.act({ type: 'wait' });
    expect(game.state.round).toBe(6);
    expect(game.tick).toBe(0);
    game.advance(3);
    expect(JSON.stringify(game.state)).not.toContain('tick');
  });
});
