import { expect, it } from 'vitest';
import { crowdedGame, timeRounds } from './turn-budget.ts';

// The plan's risk "Off-screen simulation cost": a per-turn time budget test. Spec 04 (clarification of task 3.2, approved) sets
// the budget: on a large level crowded with 80 alert creatures, a round takes under 5 ms on average and never over 50 ms.
// Measured on the build machine: about 0.1 ms on average and 4 ms at worst, so the budget leaves room for slow CI.
it('a round on a crowded large level stays within the time budget', () => {
  const game = crowdedGame(80);
  expect(game.state.monsters.length).toBe(80);
  timeRounds(game, 20); // warm up the engine before measuring
  const { mean, worst } = timeRounds(game, 300);
  expect(game.state.player.dead).toBe(false);
  expect(mean).toBeLessThan(5);
  expect(worst).toBeLessThan(50);
});
