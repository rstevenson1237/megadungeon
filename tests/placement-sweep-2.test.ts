import { expect, it, vi } from 'vitest';
import { CONTENT_ERRORS, sweep } from './placement-checks.ts';

// Spec 02 acceptance: placement and reachability rules over 10,000 seeds, one level each, the depth
// cycling over 1 to 99. The sweep is split in four files so the test runner can run them side by side.
vi.setConfig({ testTimeout: 900_000 });

it('passes every placement and reachability rule on seeds 2501 to 5000', () => {
  expect(CONTENT_ERRORS).toEqual([]);
  const stats = sweep(2501, 5001);
  expect(stats.failures.slice(0, 5)).toEqual([]);
  expect(stats.levels).toBe(2500);
  // Fewer than 1% of levels may need the plain-rooms fallback (Spec 02, Acceptance criteria).
  expect(stats.fallbacks / stats.levels).toBeLessThan(0.01);
});
