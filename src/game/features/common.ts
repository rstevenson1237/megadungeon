// Shared helpers for everything the player does to a level's features (Spec 06): which cell is which, the
// per-feature state in the level delta, and the rolls every check shares.

import { hash32 } from '../../core/rng.ts';
import { type Pool, type RollMode, type RollResult, combineModes, rollPool } from '../../rules/character/dice.ts';
import { checkMode } from '../../rules/magic/status.ts';
import type { Feature, FloorTrap, Point } from '../../rules/world/level.ts';
import type { FeatureState, Game } from '../game.ts';

export const ORTH: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export const cellOf = (game: Game, p: Point): number => p.y * game.state.map.level.width + p.x;
export const depthOf = (game: Game): number => game.state.map.level.depth;
export const inBounds = (game: Game, x: number, y: number): boolean => x >= 0 && y >= 0 && x < game.state.map.level.width && y < game.state.map.level.height;

/** The eight cells around a point. */
export function around(game: Game, p: Point): Point[] {
  const out: Point[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && inBounds(game, p.x + dx, p.y + dy)) out.push({ x: p.x + dx, y: p.y + dy });
  }
  return out;
}

/** The four cells next to the player, the one they face first (Spec 06, clarifications of task 2.10). */
export function facingFirst(game: Game): Point[] {
  const { map, player } = game.state;
  const first: [number, number] = [player.facing.dx, player.facing.dy];
  const order = [first, ...ORTH.filter(([dx, dy]) => dx !== first[0] || dy !== first[1])];
  return order.map(([dx, dy]) => ({ x: map.player.x + dx, y: map.player.y + dy })).filter((p) => inBounds(game, p.x, p.y));
}

type Container = Extract<Feature, { type: 'container' }>;

/** The number in `level.features` of the container or fixture on a cell, or -1 (debris is not one). */
export function featureIndexAt(game: Game, x: number, y: number): number {
  return game.state.map.level.features.findIndex((f) => f.x === x && f.y === y && f.type !== 'debris');
}

export const stateOf = (game: Game, index: number): FeatureState => (game.state.used.features[index] ??= {});

/** A floor trap on a cell that has not been disarmed or sprung. */
export function trapAt(game: Game, x: number, y: number): FloorTrap | undefined {
  const cell = y * game.state.map.level.width + x;
  return game.state.map.level.traps.find((t) => t.x === x && t.y === y && !game.state.used.disarmed.includes(cell));
}

/** Whether a container still holds a trap. */
export const hasContainerTrap = (game: Game, index: number): boolean => {
  const f = game.state.map.level.features[index];
  return f?.type === 'container' && f.trap !== undefined && !stateOf(game, index).trapGone;
};

export const isContainer = (f: Feature | undefined): f is Container => f?.type === 'container';

/** The player's Skill, Magic or Combat die as a pool, which a check rolls without spending. */
export function poolFor(game: Game, name: 'skill' | 'magic' | 'combat'): Pool {
  const { player } = game.state;
  return name === 'combat' ? { ...player.pools.combat } : player.pools[name];
}

/**
 * A check (Spec 03): one die of the pool, 4 or more succeeds, a 1 is a failure with a negative effect. Blessed and
 * Cursed apply, and `extra` adds the other sources of advantage or disadvantage, which combine and cancel.
 */
export function check(game: Game, name: 'skill' | 'magic' | 'combat', ...extra: RollMode[]): RollResult {
  const mode = combineModes(checkMode(game.state.player.statuses), ...extra);
  return rollPool(game.rng, poolFor(game, name), 'check', mode);
}

/** A number fixed by the run, the level and the thing, which does not draw from the level's runtime stream. */
export const seeded = (game: Game, ...parts: (string | number)[]): number => hash32('feature', game.runSeed >>> 0, depthOf(game), ...parts);
