import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateLevel, MAX_ATTEMPTS } from '../src/rules/world/generate.ts';
import { LEVEL_SIZES } from '../src/rules/world/level.ts';
import { findProblems } from '../src/rules/world/validate.ts';
import { checkLevel } from './helpers.ts';

// Retries and the plain-rooms fallback (Spec 02, step 12): a cave layout that fails on demand.
const control = vi.hoisted(() => ({ failures: 0, calls: 0 }));
vi.mock('../src/rules/world/layouts/index.ts', async (importOriginal) => {
  const real = await importOriginal<typeof import('../src/rules/world/layouts/index.ts')>();
  return {
    ...real,
    carveLayout: (...args: Parameters<typeof real.carveLayout>) => {
      if (args[0] === 'cellular_caves') {
        control.calls++;
        if (control.failures > 0) {
          control.failures--;
          return null;
        }
      }
      return real.carveLayout(...args);
    },
  };
});

const caves = { layout: 'cellular_caves', stamp: 'lake' } as const;

describe('retries and fallback (Spec 02, step 12)', () => {
  beforeEach(() => {
    control.failures = 0;
    control.calls = 0;
  });

  it('moves to the next sub-seed when a try fails, and stays deterministic', () => {
    control.failures = 3;
    const level = generateLevel(77, 20, 'large', caves);
    expect(level.attempts).toBe(4);
    expect(level.fallback).toBe(false);
    expect(level.layout).toBe('cellular_caves');
    expect(checkLevel(level)).toBeNull();
    control.failures = 3;
    expect(JSON.stringify(generateLevel(77, 20, 'large', caves))).toBe(JSON.stringify(level));
  });

  it('falls back to rooms and corridors after 20 failed tries, and the fallback is valid', () => {
    control.failures = Infinity;
    const level = generateLevel(77, 20, 'large', caves);
    expect(control.calls).toBe(MAX_ATTEMPTS);
    expect(level.attempts).toBe(MAX_ATTEMPTS);
    expect(level.fallback).toBe(true);
    expect(level.layout).toBe('rooms_and_corridors');
    expect([level.width, level.height]).toEqual([LEVEL_SIZES.large.width, LEVEL_SIZES.large.height]);
    expect(level.rooms.length).toBeGreaterThan(2); // rooms and corridors, not the two fixed rooms
    expect(checkLevel(level)).toBeNull();
    expect(findProblems(level)).toEqual([]);
    control.failures = Infinity;
    expect(JSON.stringify(generateLevel(77, 20, 'large', caves))).toBe(JSON.stringify(level));
  });

  it('falls back at every size and on level 100', () => {
    for (const size of ['small', 'medium', 'large'] as const) {
      for (const depth of [1, 100]) {
        control.failures = Infinity;
        const level = generateLevel(5, depth, size, caves);
        expect(level.fallback).toBe(true);
        expect(checkLevel(level)).toBeNull();
        expect(level.downStair === null).toBe(depth === 100);
      }
    }
  });
});
