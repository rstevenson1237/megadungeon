import { afterEach, describe, expect, it, vi } from 'vitest';
import { type Game, TICKS_PER_ROUND } from '../src/game/game.ts';
import { Schedule, cooldownTicks } from '../src/game/schedule.ts';
import { applyStatus } from '../src/rules/magic/status.ts';
import { gameOn, monsterAt, room, townRun } from './helpers.ts';

// Task 5.4, the player's cooldowns (Spec 04 and Spec 01, Addendum B): an action happens at once and starts a cooldown
// by speed, one command is held during it, a held movement key repeats, and refused or free actions spend nothing.
// The fake clock is `advance`.

/** A real-time game in an empty 30 x 5 room, the player on the stair at (2, 3). */
const realGame = (setup: Parameters<typeof gameOn>[1] = {}): Game => gameOn(room(30, 5, 2, 3), setup, { time: 'real' });

const east = (game: Game) => () => game.act({ type: 'move', dx: 1, dy: 0 });
const south = (game: Game) => () => game.act({ type: 'move', dx: 0, dy: 1 });

afterEach(() => vi.restoreAllMocks());

describe('Spec 04, Addendum B: the player cooldown (task 5.4)', () => {
  it('an action happens at once and starts a cooldown of 10 ticks, 5 Hasted, 20 Slowed and 10 with both', () => {
    const cases: [string[], number][] = [[[], 10], [['hasted'], 5], [['slowed'], 20], [['hasted', 'slowed'], 10]];
    for (const [statuses, ticks] of cases) {
      const game = realGame();
      for (const id of statuses) applyStatus(game.state.player.statuses, id as 'hasted' | 'slowed', 50);
      expect(cooldownTicks(game.state.player.statuses)).toBe(ticks);
      const result = game.command(east(game))!;
      expect(result.spent).toBe(true);
      expect(game.state.map.player.x).toBe(3); // at once, no tick needed
      expect(game.readyAt).toBe(ticks);
      expect(game.ready).toBe(false);
      game.advance(ticks - 1);
      expect(game.ready).toBe(false);
      game.advance(1);
      expect(game.ready).toBe(true);
    }
  });

  it('the cooldown starts from the tick the action happens on', () => {
    const game = realGame();
    game.advance(37);
    game.command(east(game));
    expect(game.readyAt).toBe(47);
  });

  it('a command during a cooldown is held and carried out when it ends, before the creatures of that tick', () => {
    const game = realGame();
    game.command(east(game));
    const held = game.command(south(game))!;
    expect(held).toMatchObject({ held: true, spent: false });
    expect(game.state.map.player).toEqual({ x: 3, y: 3 }); // not yet
    // Watch where the player stands as the creatures take each tick's turn.
    const seen: { tick: number; y: number }[] = [];
    const real = Schedule.prototype.tick;
    vi.spyOn(Schedule.prototype, 'tick').mockImplementation(function (this: Schedule, messages) {
      seen.push({ tick: game.tick, y: game.state.map.player.y });
      return real.call(this, messages);
    });
    game.advance(9);
    expect(game.state.map.player).toEqual({ x: 3, y: 3 });
    game.advance(1);
    expect(game.state.map.player).toEqual({ x: 3, y: 4 });
    expect(seen.at(-1)).toEqual({ tick: 10, y: 4 }); // the player moved before the creatures' turn in tick 10
    expect(game.readyAt).toBe(20); // and that action starts the next cooldown
    expect(game.held).toBeNull();
  });

  it('only one command is held: a newer one replaces it', () => {
    const game = realGame();
    game.command(east(game));
    game.command(south(game));
    game.command(east(game)); // replaces the step south
    game.advance(TICKS_PER_ROUND);
    expect(game.state.map.player).toEqual({ x: 4, y: 3 });
    game.advance(TICKS_PER_ROUND);
    expect(game.state.map.player).toEqual({ x: 4, y: 3 }); // nothing more was held
  });

  it('a refused action spends nothing: no cooldown and no acting round', () => {
    const game = realGame();
    const step = game.command(() => game.act({ type: 'move', dx: -1, dy: 0 })); // to (1, 3), beside the wall
    expect(step!.spent).toBe(true);
    game.advance(TICKS_PER_ROUND);
    game.actedThisRound = false;
    const bump = game.command(() => game.act({ type: 'move', dx: -1, dy: 0 }))!;
    expect(bump.spent).toBe(false);
    expect(game.readyAt).toBe(10);
    expect(game.ready).toBe(true);
    const nothing = game.command(() => game.act({ type: 'pickup' }))!;
    expect(nothing.spent).toBe(false);
    expect(game.ready).toBe(true);
    expect(game.actedThisRound).toBe(false);
  });

  it('a held command that is refused when the cooldown ends spends nothing, so the next one goes at once', () => {
    const game = realGame();
    game.command(() => game.act({ type: 'move', dx: -1, dy: 0 })); // to (1, 3), beside the wall
    game.command(() => game.act({ type: 'move', dx: -1, dy: 0 })); // held: into the wall
    game.advance(TICKS_PER_ROUND);
    expect(game.state.map.player.x).toBe(1);
    expect(game.ready).toBe(true);
    expect(game.command(east(game))!.spent).toBe(true);
  });

  it('the first command on a level starts the clock, which turn mode never does', () => {
    const real = realGame();
    expect(real.schedule).toBeNull();
    real.command(east(real));
    expect(real.schedule).not.toBeNull();
    const turn = gameOn(room(30, 5, 2, 3));
    turn.command(east(turn));
    expect(turn.schedule).toBeNull();
    expect(turn.tick).toBe(0);
  });
});

describe('Spec 01, Addendum B: a held movement key (task 5.4)', () => {
  it('walks one cell per cooldown while held, and stops when released', () => {
    const game = realGame();
    game.walk(1, 0);
    expect(game.state.map.player.x).toBe(3);
    game.advance(5 * TICKS_PER_ROUND);
    expect(game.state.map.player.x).toBe(8); // one more step at ticks 10, 20, 30, 40 and 50
    game.advance(3);
    game.halt();
    game.advance(3 * TICKS_PER_ROUND);
    expect(game.state.map.player.x).toBe(8);
  });

  it('a Hasted player walks two cells a round', () => {
    const game = realGame();
    applyStatus(game.state.player.statuses, 'hasted', 50);
    game.walk(1, 0);
    game.advance(2 * TICKS_PER_ROUND);
    expect(game.state.map.player.x).toBe(7);
  });

  it('a key pressed during a cooldown is held: the walk turns that way when the cooldown ends', () => {
    const game = realGame();
    game.walk(1, 0);
    game.halt();
    game.walk(0, 1); // during the cooldown: held
    expect(game.state.map.player).toEqual({ x: 3, y: 3 });
    game.advance(TICKS_PER_ROUND);
    expect(game.state.map.player).toEqual({ x: 3, y: 4 });
    game.advance(TICKS_PER_ROUND);
    expect(game.state.map.player).toEqual({ x: 3, y: 5 }); // and keeps walking that way while held
  });

  it('a step the held key cannot take stops the walk, so it is not tried every tick', () => {
    const game = realGame();
    game.walk(0, 1); // (2, 4), then (2, 5), then the wall
    game.advance(3 * TICKS_PER_ROUND);
    expect(game.state.map.player).toEqual({ x: 2, y: 5 });
    expect(game.walking).toBeNull();
    expect(game.ready).toBe(true);
  });

  it('a released key still takes a step already held', () => {
    const game = realGame();
    game.walk(1, 0);
    game.walk(1, 0); // pressed again during the cooldown
    game.halt();
    game.advance(3 * TICKS_PER_ROUND);
    expect(game.state.map.player.x).toBe(4);
  });

  it('in turn mode a movement key is one move and one round, as ever', () => {
    const game = gameOn(room(30, 5, 2, 3));
    const result = game.walk(1, 0)!;
    expect(result.spent).toBe(true);
    expect(game.state.round).toBe(2);
    expect(game.walking).toBeNull();
  });
});

describe('Spec 03, Addendum B: waiting with cooldowns (task 5.4)', () => {
  it('Space each cooldown counts as waiting, and recovers a Combat die in 10 rounds', () => {
    const game = realGame({ combatDice: 3, combatMax: 4 });
    for (let r = 0; r < 10; r++) {
      expect(game.command(() => game.act({ type: 'wait' }))!.spent).toBe(true);
      expect(game.actedThisRound).toBe(false);
      game.advance(TICKS_PER_ROUND);
    }
    expect(game.state.player.pools.combat.dice).toBe(4);
  });

  it('a move makes the round an acting one and resets the count', () => {
    const game = realGame({ combatDice: 3, combatMax: 4 });
    game.advance(5 * TICKS_PER_ROUND);
    expect(game.state.player.waited).toBe(5);
    game.command(east(game));
    expect(game.actedThisRound).toBe(true);
    game.advance(TICKS_PER_ROUND);
    expect(game.state.player.waited).toBe(0);
  });
});

describe('Spec 04, Addendum B: what a held command leaves for the shell (task 5.4)', () => {
  it('taking the stairs stops time at once, and the shell is handed the level change', () => {
    const game = realGame();
    game.command(() => game.act({ type: 'search' }));
    game.command(() => game.act({ type: 'interact' })); // on the up stair: held
    const roundBefore = game.state.round;
    const m = monsterAt(20, 3, { alert: true });
    game.state.monsters.push(m);
    game.advance(3 * TICKS_PER_ROUND);
    expect(game.tick).toBe(10);
    expect(game.state.round).toBe(roundBefore); // the round never ended
    expect(game.carried()).toMatchObject({ stairs: 'up', messages: [] });
    expect(game.carried()).toBeNull(); // handed over once
  });

  it('commands carried out at once leave nothing to carry', () => {
    const game = realGame();
    game.command(east(game));
    game.advance(TICKS_PER_ROUND);
    expect(game.carried()).toBeNull();
  });

  it('a run in real time plays its levels in real time', () => {
    const run = townRun(12345, {}, 0, { time: 'real' });
    expect(run.time).toBe('real');
    run.travel('down');
    expect(run.game!.time).toBe('real');
    const turn = townRun(12345);
    turn.travel('down');
    expect(turn.game!.time).toBe('turn');
  });
});
