import { expect, it, vi } from 'vitest';
import { CONTENT_ERRORS, sweepEveryLevel } from './placement-checks.ts';

// Spec 02 acceptance (Addendum A): every level 1 to 100 of 100 seeds, alongside the 10,000-seed sweep of one
// level each. Split in four files so the test runner can run them side by side.
vi.setConfig({ testTimeout: 900_000 });

it('passes every placement and reachability rule on every level of seeds 76 to 100', () => {
  expect(CONTENT_ERRORS).toEqual([]);
  const stats = sweepEveryLevel(76, 101);
  expect(stats.failures.slice(0, 5)).toEqual([]);
  expect(stats.levels).toBeGreaterThan(2350);
  // Fewer than 1% of levels may need the plain-rooms fallback (Spec 02, Acceptance criteria).
  expect(stats.fallbacks / stats.levels).toBeLessThan(0.01);
});
