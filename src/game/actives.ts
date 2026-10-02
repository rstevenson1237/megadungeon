// The active major abilities (Spec 03, Addendum A; task 3.7): Rage, Volley, Fascinate, Wild Shape, Mark and Spirit
// Totem. Each is a skill use of one round; Volley's skill use is its ranged roll. What they need, who they can be aimed
// at and what they do on the level are here; the hits they change are in combat.ts and items.ts.

import type { LogMessage } from '../core/log.ts';
import { rollPool } from '../rules/character/dice.ts';
import { applyStatus, hasStatus } from '../rules/magic/status.ts';
import { distanceSq, bearingFromNorth } from '../rules/world/geometry.ts';
import { TILE, type Point } from '../rules/world/level.ts';
import { RAGE_ROUNDS, WILD_SHAPE_ROUNDS, startTimed } from './abilities.ts';
import { nameOf } from './combat.ts';
import type { Game } from './game.ts';
import { derived, fireVolley, rangedOption } from './items.ts';
import { TERRAIN_LIQUID, TERRAIN_OPEN } from './map-state.ts';
import { type Monster, isAlly } from './monsters.ts';
import { canDecoyAt, decoy, raise, raiseProblem } from './allies.ts';
import { validTargets } from './targeting.ts';

/** Waiting beside a Spirit Totem restores a Combat die every 5 rounds (Spec 03, Addendum A). */
export const TOTEM_WAIT_ROUNDS = 5;
/** Fascinate holds its target for d6 rounds. */
export const FASCINATE_DIE = 6;

/** What an active major ability is aimed at: a creature (Fascinate, Mark), one or two (Volley), a cell (Decoy), or nothing. */
export type MajorAim = Monster | readonly Monster[] | Point | undefined;

const isCell = (aim: MajorAim): aim is Point => aim !== undefined && !Array.isArray(aim) && !('dice' in aim);

/** Creatures in sight, nearest first then clockwise from north: no range limit and no line of fire needed. */
export function inSight(game: Game, allow: (m: Monster) => boolean = () => true): Monster[] {
  const { map } = game.state;
  const from = map.player;
  return game.state.monsters
    .filter((m) => !isAlly(m) && map.visible[m.y * map.level.width + m.x] === 1 && allow(m))
    .sort((a, b) => distanceSq(from, a) - distanceSq(from, b) || bearingFromNorth(from, a) - bearingFromNorth(from, b));
}

/** An asleep or unaware creature (Spec 04, "Unaware targets"): what Mark needs. */
export const unawareOrAsleep = (m: Monster): boolean => m.awareness !== 'alert' || hasStatus(m.statuses, 'asleep');

/** Fascinate's targets: any creature in sight. */
export const fascinateTargets = (game: Game): Monster[] => inSight(game);

/** Mark's targets: an asleep or unaware creature in sight. */
export const markTargets = (game: Game): Monster[] => inSight(game, unawareOrAsleep);

/** Volley's targets: those of the readied weapon's shot, in range with a clear line. */
export const volleyTargets = (game: Game): Monster[] => {
  const option = rangedOption(game);
  return option && !option.thrown ? validTargets(game, option.range) : [];
};

/** Why Volley cannot be loosed now, or undefined: it needs a readied ranged weapon that can fire, not a thrown dagger. */
export function volleyProblem(game: Game): string | undefined {
  const option = rangedOption(game);
  if (!option || option.thrown) return 'Volley needs a readied ranged weapon.';
  return option.problem;
}

/** The eight cells around a point, clockwise from north. */
const AROUND: readonly (readonly [number, number])[] = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

/** A free cell for a totem: open floor, not a stair, with no creature on it. */
function freeForTotem(game: Game, x: number, y: number): boolean {
  const { map } = game.state;
  const { width, height, tiles } = map.level;
  if (x < 0 || y < 0 || x >= width || y >= height || map.terrain[y * width + x] !== TERRAIN_OPEN) return false;
  const tile = tiles[y]![x];
  return tile !== TILE.stairsUp && tile !== TILE.stairsDown && !game.monsterAt(x, y);
}

/** Where a Spirit Totem goes: the cell the player faces if it is free, else the first free cell clockwise from north. */
export function totemCell(game: Game): Point | undefined {
  const { map, player } = game.state;
  const faced = { x: map.player.x + player.facing.dx, y: map.player.y + player.facing.dy };
  if (freeForTotem(game, faced.x, faced.y)) return faced;
  for (const [dx, dy] of AROUND) if (freeForTotem(game, map.player.x + dx, map.player.y + dy)) return { x: map.player.x + dx, y: map.player.y + dy };
  return undefined;
}

/** True when the player stands on one of the 8 cells around the totem. */
export function besideTotem(game: Game): boolean {
  const { totem, player } = game.state.map;
  return !!totem && Math.max(Math.abs(totem.x - player.x), Math.abs(totem.y - player.y)) === 1;
}

/** Rounds of waiting that restore a Combat die now: beside the totem 5, unless another wait effect is shorter. */
export const waitRoundsNow = (game: Game): number => {
  const rounds = derived(game).waitRounds;
  return besideTotem(game) ? Math.min(rounds, TOTEM_WAIT_ROUNDS) : rounds;
};

/** Why an active major ability cannot be used now with this aim, with no round spent; undefined when it can. */
export function activeProblem(game: Game, id: string, aim: MajorAim): string | undefined {
  const one = (list: Monster[], what: string): string | undefined => {
    if (list.length === 0) return `There is no ${what} in sight.`;
    if (!aim || Array.isArray(aim)) return 'Choose a target.';
    return list.includes(aim as Monster) ? undefined : 'That is not a valid target.';
  };
  switch (id) {
    case 'volley': {
      const problem = volleyProblem(game);
      if (problem) return problem;
      const targets = volleyTargets(game);
      const chosen = aim === undefined ? [] : Array.isArray(aim) ? aim : [aim as Monster];
      if (targets.length === 0) return 'There is no valid target.';
      if (chosen.length === 0 || chosen.length > 2) return 'Choose a target.';
      if (chosen.length === 2 && chosen[0] === chosen[1]) return 'Choose two different targets.';
      return chosen.every((m) => targets.includes(m)) ? undefined : 'That is not a valid target.';
    }
    case 'fascinate':
      return one(fascinateTargets(game), 'creature');
    case 'mark':
      return one(markTargets(game), 'unaware creature');
    case 'spirit_totem':
      return totemCell(game) ? undefined : 'There is no room beside you for a totem.';
    case 'raise':
      return raiseProblem(game);
    case 'decoy':
      return isCell(aim) && canDecoyAt(game, aim) ? undefined : 'You cannot place the phantom there.';
    default:
      return undefined;
  }
}

/**
 * Use an active major ability (Spec 03, Addendum A), which `activeProblem` has cleared: one Skill die as a skill use
 * (4 or more works; 2 to 3 works and the die is lost; 1 fails and the die is lost; an empty pool rolls with
 * disadvantage and loses nothing more). Volley's skill use is its one ranged roll.
 */
export function useActiveMajor(game: Game, id: string, name: string, aim: MajorAim, messages: LogMessage[]): void {
  const { player } = game.state;
  if (id === 'volley') {
    const chosen = Array.isArray(aim) ? aim : [aim as Monster];
    // One shot per target: with one shot left, the volley is a single shot at the first.
    const shots = rangedOption(game)!.ammo;
    fireVolley(game, chosen.slice(0, Math.max(1, Math.min(chosen.length, shots))), messages);
    return;
  }
  const roll = rollPool(game.rng, player.pools.skill, 'skill');
  if (!roll.success) {
    messages.push({ kind: 'warning', text: `You try ${name}, but it fails.` });
    if (roll.dieLost) messages.push({ kind: 'warning', text: 'You lose a Skill die.' });
    return;
  }
  switch (id) {
    case 'rage':
      startTimed(player, id, name, RAGE_ROUNDS);
      messages.push({ kind: 'system', text: `You fly into a rage for ${RAGE_ROUNDS} rounds.` });
      break;
    case 'wild_shape':
      startTimed(player, id, name, WILD_SHAPE_ROUNDS);
      messages.push({ kind: 'system', text: `You take a wild shape for ${WILD_SHAPE_ROUNDS} rounds.` });
      break;
    case 'fascinate': {
      // Quiet: it makes no noise and alerts no one, and it is not an exchange.
      const target = aim as Monster;
      const rounds = game.rng.int(1, FASCINATE_DIE);
      applyStatus(target.statuses, 'held', rounds);
      messages.push({ kind: 'combat', text: `${nameOf(target).replace(/^./, (c) => c.toUpperCase())} is fascinated and stands still.` });
      break;
    }
    case 'mark': {
      const target = aim as Monster;
      game.state.mark = target.id;
      messages.push({ kind: 'combat', text: `You mark ${nameOf(target)}.` });
      break;
    }
    case 'spirit_totem':
      placeTotem(game, totemCell(game)!);
      messages.push({ kind: 'system', text: 'You raise a spirit totem beside you.' });
      break;
    case 'raise':
      raise(game, messages);
      break;
    case 'decoy':
      decoy(game, aim as Point, messages);
      break;
    default:
      break;
  }
  if (roll.dieLost) messages.push({ kind: 'warning', text: 'You lose a Skill die.' });
}

/** Raise the totem on a cell, taking down the one before (one at a time): it blocks movement, never sight. */
function placeTotem(game: Game, at: Point): void {
  const { map } = game.state;
  const { width } = map.level;
  // The old totem stood on open floor, which it leaves open again.
  if (map.totem) map.terrain[map.totem.y * width + map.totem.x] = TERRAIN_OPEN;
  map.totem = { ...at };
  map.terrain[at.y * width + at.x] = TERRAIN_LIQUID;
}
