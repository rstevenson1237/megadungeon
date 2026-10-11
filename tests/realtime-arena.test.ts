import { describe, expect, it } from 'vitest';
import { Game, TICKS_PER_ROUND } from '../src/game/game.ts';
import { creature, type Monster } from '../src/game/monsters.ts';
import type { Command } from '../src/game/commands.ts';
import { applyStatus } from '../src/rules/magic/status.ts';
import { distanceSq } from '../src/rules/world/geometry.ts';
import type { Level } from '../src/rules/world/level.ts';
import { gameOn, levelFrom, monsterAt, room, testPlayer } from './helpers.ts';

// Task 5.7, real-time tests (Spec 04, Addendum B): the scripted arena fights of Spec 04 played again in real time, on a
// fake clock. Time passes only through `advance`, and the player acts as a player at the keyboard would: a command the
// moment the cooldown ends. The rules are the turn-mode rules; only when things act differs, so every behaviour must
// stay recognisable, and the speeds and cooldowns must show in how the fights go.

/** Let `n` rounds of game time pass with the player idle. */
const rounds = (game: Game, n = 1): string[] => game.advance(n * TICKS_PER_ROUND).map((m) => m.text);

/** The player's command, given the moment the cooldown ends: the clock runs on to it first if need be. */
function act(game: Game, command: Command): string[] {
  const said: string[] = [];
  while (!game.ready) said.push(...game.advance(1).map((m) => m.text));
  said.push(...(game.command(() => game.act(command))?.messages ?? []).map((m) => m.text));
  return said;
}

/** A real-time game on `level`, the player sturdy unless told otherwise. */
const realOn = (level: Level, setup: Parameters<typeof gameOn>[1] = sturdy): Game => gameOn(level, setup, { time: 'real' });
const realSeeded = (seed: number, level: Level): Game => new Game(seed, level, testPlayer(sturdy), { time: 'real' });

const dist = (game: Game, m: Monster): number => Math.sqrt(distanceSq(m, game.state.map.player));
const sturdy = { combatDice: 6, combatMax: 6 };
/** A creature that can never win a roll and has plenty of dice, so a fight never kills the test. */
const harmless = { modifier: -6, dice: 30, maxDice: 30 };

describe('Spec 04, Addendum B: awareness in real time (arena)', () => {
  /**
   * Share of fresh real-time games in which a monster is alert after the first round's notice roll, over many seeds.
   * Real time makes a round's once-a-round checks as it begins (Clarification, task 5.3): the first tick begins round 1.
   */
  function alertShare(awareness: 'asleep' | 'unaware', x: number, trials = 1500): number {
    let alert = 0;
    for (let seed = 0; seed < trials; seed++) {
      const game = realSeeded(seed, room(20, 5, 1, 3));
      const m = monsterAt(x, 3, { awareness });
      game.state.monsters.push(m);
      game.advance(1);
      if (m.awareness === 'alert') alert++;
    }
    return alert / trials;
  }

  it('the notice odds are the turn-mode odds, rolled once a round: a sleeper 1 in 6, the unaware 1 in 2, nothing beyond 8 cells', () => {
    expect(alertShare('asleep', 6)).toBeCloseTo(1 / 6, 1);
    expect(alertShare('unaware', 6)).toBeCloseTo(1 / 2, 1);
    expect(alertShare('unaware', 10, 400)).toBe(0); // 9 cells away
  });

  it('the player\'s attack wakes sleepers within 3 cells and alerts the unaware within 6 at the tick it happens', () => {
    const rows = Array.from({ length: 9 }, (_, y) => (y === 0 || y === 8 ? '#'.repeat(30) : `#${'.'.repeat(15)}#${'.'.repeat(12)}#`));
    rows[4] = '#' + '.'.repeat(11) + '<' + '.'.repeat(3) + '#' + '.'.repeat(12) + '#'; // player at (12,4)
    const game = realOn(levelFrom(rows));
    const target = monsterAt(13, 4, { awareness: 'alert', ...harmless });
    const near3 = monsterAt(13, 1, { awareness: 'asleep', ...harmless });
    const unaware6 = monsterAt(19, 4, { awareness: 'unaware', ...harmless });
    const unaware7 = monsterAt(20, 4, { awareness: 'unaware', ...harmless });
    game.state.monsters.push(target, near3, unaware6, unaware7);
    game.advance(4); // mid-round: no boundary between the attack and the check below
    act(game, { type: 'move', dx: 1, dy: 0 });
    expect(game.tick).toBe(4);
    expect([near3.awareness, unaware6.awareness, unaware7.awareness]).toEqual(['alert', 'alert', 'unaware']);
  });

  it('an alert creature loses track after 20 rounds out of sight, counted as each round begins', () => {
    const game = realOn(levelFrom(['###########', '#<..#.....#', '###########']));
    const m = monsterAt(7, 1, { alert: true });
    game.state.monsters.push(m);
    game.advance(19 * TICKS_PER_ROUND - 9); // tick 181: rounds 1 to 19 have begun
    expect(m.awareness).toBe('alert');
    game.advance(9); // tick 190: round 20 begins
    expect(m.awareness).toBe('unaware');
  });
});

describe('Spec 04, Addendum B: behaviours, each recognisable in a real-time arena fight', () => {
  it('brute: charges straight in and fights to the end', () => {
    const game = realOn(room(20, 3, 1, 2));
    const m = monsterAt(10, 2, { alert: true, dice: 3, maxDice: 3, behaviour: 'brute', modifier: -6, fearless: true });
    game.state.monsters.push(m);
    rounds(game, 9);
    expect(m.x).toBe(2); // 8 steps, one a round, to the cell beside the player
    rounds(game);
    expect(game.state.monsters).toContain(m); // it keeps attacking
    rounds(game, 5);
    expect(game.state.monsters).not.toContain(m); // and fought until it died: -6 loses every exchange
  });

  it('skirmisher: shoots from 3 to 6 cells, then closes in once its 6 shots are gone', () => {
    const game = realOn(room(28, 5, 1, 3));
    const m = monsterAt(14, 3, { alert: true, behaviour: 'skirmisher', ...harmless });
    game.state.monsters.push(m);
    const shooting: number[] = [];
    for (let t = 0; t < 400 && !(m.shots === 0 && dist(game, m) <= 1.01); t++) {
      const before = m.shots;
      game.advance(1);
      if (m.shots < before) shooting.push(dist(game, m));
    }
    expect(shooting).toHaveLength(6);
    for (const d of shooting) {
      expect(d).toBeGreaterThanOrEqual(3);
      expect(d).toBeLessThanOrEqual(6);
    }
    expect(dist(game, m)).toBeLessThanOrEqual(1.01);
  });

  it('skirmisher: backs away from a player who closes in', () => {
    const game = realOn(room(28, 5, 1, 3));
    const m = monsterAt(8, 3, { alert: true, behaviour: 'skirmisher', ...harmless });
    game.state.monsters.push(m);
    for (let i = 0; i < 6; i++) act(game, { type: 'move', dx: 1, dy: 0 });
    rounds(game); // its answer to the last step
    expect(dist(game, m)).toBeGreaterThanOrEqual(3);
    expect(m.x).toBeGreaterThan(8);
  });

  it('caster: steps away from an adjacent player, then casts round after round with no ammunition', () => {
    const game = realOn(room(28, 5, 1, 3));
    const m = monsterAt(3, 3, { alert: true, behaviour: 'caster', ...harmless });
    game.state.monsters.push(m);
    rounds(game, 3);
    expect(dist(game, m)).toBeGreaterThanOrEqual(3);
    const said = rounds(game, 20);
    expect(said.filter((t) => /casts at you/.test(t)).length).toBeGreaterThan(10);
    expect(m.shots).toBe(6);
    expect(dist(game, m)).toBeLessThanOrEqual(6);
  });

  it('ambusher: holds its ground unaware, and only its first attack has advantage', () => {
    const game = realOn(room(10, 3, 1, 2));
    const m = monsterAt(10, 2, { behaviour: 'ambusher', ambush: true, awareness: 'unaware', ...harmless });
    game.state.monsters.push(m);
    rounds(game, 30);
    expect(m).toMatchObject({ x: 10, y: 2 });
    m.awareness = 'alert';
    rounds(game, 8);
    expect(m.ambush).toBe(true);
    rounds(game, 4);
    expect(m.ambush).toBe(false);
  });

  it('pack: the whole group wakes together and closes in on all four sides of the player', () => {
    for (let seed = 1; seed <= 6; seed++) {
      const game = realSeeded(seed, room(15, 9, 7, 5));
      const wolves = [[2, 2], [12, 2], [2, 8], [12, 8]].map(([x, y], i) =>
        monsterAt(x!, y!, { id: 100 + i, behaviour: 'pack', group: 7, awareness: 'unaware', ...harmless }),
      );
      game.state.monsters.push(...wolves);
      for (let r = 0; r < 40 && wolves.every((w) => w.awareness !== 'alert'); r++) rounds(game);
      expect(wolves.map((w) => w.awareness)).toEqual(['alert', 'alert', 'alert', 'alert']);
      rounds(game, 14);
      const p = game.state.map.player;
      expect(new Set(wolves.map((w) => `${w.x - p.x},${w.y - p.y}`))).toEqual(new Set(['-1,0', '0,-1', '0,1', '1,0']));
    }
  });

  it('coward: keeps away from a near player and never fights in the open', () => {
    const game = realOn(room(30, 5, 1, 3));
    const m = monsterAt(4, 3, { alert: true, behaviour: 'coward', ...harmless });
    game.state.monsters.push(m);
    rounds(game, 8);
    expect(dist(game, m)).toBeGreaterThan(4);
    expect(m.dice).toBe(30);
  });

  it('morale: a creature at one die flees about 1 round in 3, rolled as the round begins', () => {
    let fleeing = 0;
    const trials = 1500;
    for (let seed = 0; seed < trials; seed++) {
      const game = realSeeded(seed, room(20, 5, 1, 3));
      const m = monsterAt(12, 3, { alert: true, dice: 1, maxDice: 3 });
      game.state.monsters.push(m);
      game.advance(1);
      if (m.fleeing) fleeing++;
    }
    expect(fleeing / trials).toBeCloseTo(1 / 3, 1);
  });

  it('bandit: steals twice, then flees', () => {
    const game = realOn(room(12, 3, 1, 2), { ...sturdy, coins: 100 });
    const b = monsterAt(2, 2, { kind: 'bandit', name: 'Bram', alert: true, modifier: 6, dice: 3, maxDice: 3 });
    game.state.monsters.push(b);
    const said = rounds(game, 2);
    expect(b.thefts).toBe(2);
    expect(game.state.player.coins).toBe(81);
    expect(said).toContain('Bram turns to flee.');
    rounds(game, 4);
    expect(dist(game, b)).toBeGreaterThanOrEqual(5);
  });

  it('rival: heads for the down stair, ignoring the player, and waits beside it', () => {
    const wall = '#'.repeat(26);
    const mid = (first: string, last: string) => `#${first}${'.'.repeat(22)}${last}#`;
    const game = realOn(levelFrom([wall, mid('<', '>'), mid('.', '.'), mid('.', '.'), wall]));
    const r = creature({ id: 50, name: 'Corvin', glyph: 'R', colour: 1, x: 3, y: 3, dice: 5, maxDice: 5, modifier: 0, kind: 'rival', behaviour: 'skirmisher', hostile: false });
    game.state.monsters.push(r);
    rounds(game, 60);
    expect(Math.abs(r.x - 24) + Math.abs(r.y - 1)).toBeLessThanOrEqual(1);
    expect(game.state.player.pools.combat.dice).toBe(6);
    expect(r.hostile).toBe(false);
  });
});

describe('Spec 04, Addendum B: speed decides real-time fights (arena)', () => {
  /**
   * A brute chasing the player down a long hall from 5 cells behind, the player walking away the moment each cooldown
   * ends. The gap is measured as each step is taken; the brute has caught the player once there has been an exchange.
   */
  function chase(speed: Monster['speed'], player: 'normal' | 'hasted' | 'slowed', ticks = 200): { gap: number[]; caught: boolean } {
    const game = realOn(room(90, 3, 6, 2));
    if (player !== 'normal') applyStatus(game.state.player.statuses, player, 50);
    const m = monsterAt(1, 2, { alert: true, behaviour: 'brute', speed, ...harmless });
    game.state.monsters.push(m);
    const gap: number[] = [];
    while (game.tick < ticks) {
      act(game, { type: 'move', dx: 1, dy: 0 });
      gap.push(game.state.map.player.x - m.x);
    }
    return { gap, caught: m.dice < 30 };
  }

  it('a normal brute keeps pace with a walking player and never closes', () => {
    const { gap, caught } = chase('normal', 'normal');
    expect(Math.min(...gap)).toBeGreaterThanOrEqual(1);
    expect(gap.at(-1)).toBe(gap[0]);
    expect(caught).toBe(false);
  });

  it('a fast brute runs a walking player down and fights them', () => {
    expect(chase('fast', 'normal').caught).toBe(true);
  });

  it('a Hasted player outruns a fast brute, gaining nothing and losing nothing; a slow one falls further behind each round', () => {
    const hasted = chase('fast', 'hasted');
    expect(hasted.caught).toBe(false);
    expect(Math.max(...hasted.gap) - Math.min(...hasted.gap)).toBeLessThanOrEqual(1);
    const slow = chase('slow', 'normal').gap;
    expect(slow.at(-1)! - slow[0]!).toBeGreaterThanOrEqual(8); // 20 rounds of walking: it took 10 steps to the player's 20
  });

  it('a Slowed player is caught by a normal brute', () => {
    expect(chase('normal', 'slowed').caught).toBe(true);
  });

  it('the player and a monster each strike once a round: two exchanges, as in turn mode', () => {
    const game = realOn(room(10, 3, 1, 2));
    const m = monsterAt(2, 2, { alert: true, behaviour: 'brute', fearless: true, ...harmless });
    game.state.monsters.push(m);
    const said: string[] = [];
    for (let r = 0; r < 10; r++) said.push(...act(game, { type: 'move', dx: 1, dy: 0 }));
    said.push(...game.advance(TICKS_PER_ROUND - (game.tick % TICKS_PER_ROUND)).map((m) => m.text)); // to the end of the tenth round
    // Each exchange the player wins or ties says so once: 10 rounds of an attack each way are 20 exchanges.
    expect(said.filter((t) => t === 'You hit the goblin.')).toHaveLength(20);
  });

  it('a Hasted player strikes twice a round, so a fight lasts half as many rounds', () => {
    const fight = (hasted: boolean): number => {
      const game = realOn(room(10, 3, 1, 2));
      if (hasted) applyStatus(game.state.player.statuses, 'hasted', 500);
      const m = monsterAt(2, 2, { alert: true, behaviour: 'brute', fearless: true, modifier: -6, dice: 20, maxDice: 20 });
      game.state.monsters.push(m);
      while (game.state.monsters.includes(m)) act(game, { type: 'move', dx: 1, dy: 0 });
      return game.state.round;
    };
    const normal = fight(false);
    const hasted = fight(true);
    expect(hasted).toBeLessThan(normal);
    expect(Math.abs((normal - 1) / (hasted - 1) - 1.5)).toBeLessThan(0.35); // 2 exchanges a round against 3
  });
});
