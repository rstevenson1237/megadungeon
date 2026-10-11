import { expect, it } from 'vitest';
import { applyStatus } from '../src/rules/magic/status.ts';
import { CONTENT, ITEMS, SPELLS } from './helpers.ts';
import { FROZEN } from './frozen.ts';
import { crowdedGame, fightCrowd, surround, timeRounds, timeTicks } from './turn-budget.ts';

// The plan's risk "Off-screen simulation cost": a per-turn time budget test. Spec 04 (clarification of task 3.2, approved) sets
// the budget: on a large level crowded with 80 alert creatures, a round takes under 5 ms on average and never over 50 ms.
// Measured on the build machine: about 0.1 ms on average and 4 ms at worst, so the budget leaves room for slow CI.
it('a round on a crowded large level stays within the time budget', () => {
  const game = crowdedGame({ levels: FROZEN, spells: SPELLS, items: ITEMS, content: CONTENT }, 80);
  expect(game.state.monsters.length).toBe(80);
  timeRounds(game, 20); // warm up the engine before measuring
  const { mean, worst } = timeRounds(game, 300);
  expect(game.state.player.dead).toBe(false);
  expect(mean).toBeLessThan(5);
  expect(worst).toBeLessThan(50);
});

// Task 5.7, the tick time budget (Spec 04, Addendum B): a round in real time on the same crowded level stays within the
// turn budget, and no single tick takes over 16 ms, one frame at 60 frames a second. Task 5.3 measures it with the
// player idle (creature-schedules.test.ts); here 40 of the crowd start around the player, who fights them Hasted, an
// action every 5 ticks, so every round also carries the player's attacks, the creatures' and the exchanges' noise.
it('a real-time round with the player fighting the crowd stays within the turn budget, and no tick takes over 16 ms', () => {
  const game = crowdedGame({ levels: FROZEN, spells: SPELLS, items: ITEMS, content: CONTENT }, 80, 'real');
  applyStatus(game.state.player.statuses, 'hasted', 10_000);
  surround(game, 40);
  const fighting = (g: typeof game): void => {
    game.state.player.pools.combat.dice = game.state.player.pools.combat.max; // never let the test character die
    fightCrowd(g);
  };
  const dice = (): number => game.state.monsters.reduce((n, m) => n + m.dice, 0);
  const before = dice();
  timeTicks(game, 20, fighting); // warm up the engine before measuring
  const { mean, worst, worstTick } = timeTicks(game, 300, fighting);
  expect(game.state.player.dead).toBe(false);
  expect(dice()).toBeLessThan(before - 60); // the fight was real: the creatures lost dice
  expect(mean).toBeLessThan(5);
  expect(worst).toBeLessThan(50);
  expect(worstTick).toBeLessThan(16);
});
