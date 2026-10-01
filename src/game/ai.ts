// Creature turns (Spec 04, "Turns and timing", "Awareness and stealth" and "Monster and hostile NPC
// behaviour"): after the player acts, every creature on the level acts in order of distance to the
// player, nearest first, at most 50 a round. Rolls come from rules/combat; effects from game/combat.

import type { LogMessage } from '../core/log.ts';
import { LOSE_TRACK_ROUNDS, NOTICE_RANGE, noticeRoll } from '../rules/combat/awareness.ts';
import { creatureMelee, failsMorale, monsterRanged } from '../rules/combat/attacks.ts';
import { derive } from '../rules/items/gear.ts';
import { cannotAct, effectiveSpeed, hasStatus } from '../rules/magic/status.ts';
import { distanceSq, lineCells } from '../rules/world/geometry.ts';
import { distancesFrom } from '../rules/world/grid.ts';
import { TILE, type Point } from '../rules/world/level.ts';
import { Name, addLoot, alert, combatAt, damage, hitPlayer, monsterAttacks, provoke, seen } from './combat.ts';
import { contentsOf, stateOf, trapAt } from './features/index.ts';
import type { Game } from './game.ts';
import { TERRAIN_BLOCKED, TERRAIN_OPEN, isClear, refreshSight } from './map-state.ts';
import type { Monster } from './monsters.ts';

/** At most this many creatures act per round, nearest first (Spec 04). */
export const MAX_SIMULATED = 50;

/** How a creature with a ranged attack keeps its distance, and how far it shoots (Spec 04, task 2.7). */
const KEEP_AWAY_SQ = 3 * 3;
const SHOOT_RANGE_SQ = 6 * 6;
/** A coward flees when the player is within 4 cells and closes in beyond 6. */
const COWARD_NEAR_SQ = 4 * 4;
const COWARD_FAR_SQ = 6 * 6;
/** Unaware creatures wander within this many cells of where they were placed. */
const WANDER_RADIUS = 3;
/** A rival turns aside for loot this many steps away. */
const LOOT_DETOUR = 8;

const NESW: readonly (readonly [number, number])[] = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

/** Everything a round of creature turns needs, built once per round. */
class Round {
  private playerDist: Int32Array | null = null;
  private rivalTerrain: Uint8Array | null = null;
  private stairDist: Int32Array | null = null;

  constructor(
    readonly game: Game,
    readonly messages: LogMessage[],
  ) {}

  get width(): number {
    return this.game.state.map.level.width;
  }

  /** The terrain with floor traps shut: creatures never step on a trap, so they route around it (Spec 06, task 2.10). */
  private withoutTraps(terrain: Uint8Array): Uint8Array {
    const { map, used } = this.game.state;
    const t = terrain.slice();
    for (const trap of map.level.traps) {
      const i = trap.y * map.level.width + trap.x;
      if (!used.disarmed.includes(i)) t[i] = TERRAIN_BLOCKED;
    }
    return t;
  }

  /** Walking distance from the player to every cell; closed doors block (creatures other than rivals never open them). */
  fromPlayer(): Int32Array {
    const { map } = this.game.state;
    return (this.playerDist ??= distancesFrom(this.withoutTraps(map.terrain), map.level.width, map.level.height, map.player, (t) => t === TERRAIN_OPEN));
  }

  /** Terrain as a rival sees it: a closed normal door is passable, because a rival opens it. */
  terrainForRivals(): Uint8Array {
    if (this.rivalTerrain) return this.rivalTerrain;
    const { map } = this.game.state;
    const t = map.terrain.slice();
    for (const d of map.level.doors) {
      const i = d.y * map.level.width + d.x;
      if (d.kind === 'normal' && t[i] === TERRAIN_BLOCKED && map.level.tiles[d.y]![d.x] === TILE.door) t[i] = TERRAIN_OPEN;
    }
    return (this.rivalTerrain = this.withoutTraps(t));
  }

  fromStair(): Int32Array | null {
    const { map } = this.game.state;
    const stair = map.level.downStair;
    if (!stair) return null;
    return (this.stairDist ??= distancesFrom(this.terrainForRivals(), map.level.width, map.level.height, stair, (t) => t === TERRAIN_OPEN));
  }
}

/** The player's cell and whether the creature stands in sight of it (the player sees it and it sees the player). */
const sees = (game: Game, m: Monster): boolean => seen(game, m);

const free = (game: Game, x: number, y: number): boolean => {
  const { map } = game.state;
  return x >= 0 && y >= 0 && x < map.level.width && y < map.level.height &&
    map.terrain[y * map.level.width + x] === TERRAIN_OPEN && !game.monsterAt(x, y) && !(map.player.x === x && map.player.y === y) && !trapAt(game, x, y);
};

const orthAdjacent = (a: Point, b: Point): boolean => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

/** Step to the free neighbour with the lowest value of `dist` that is lower than here (toward a goal). */
function stepDownhill(game: Game, m: Monster, dist: Int32Array, width: number): boolean {
  const here = dist[m.y * width + m.x]!;
  if (here < 0) return false;
  let best: Point | null = null;
  let bestDist = here;
  for (const [dx, dy] of NESW) {
    const x = m.x + dx;
    const y = m.y + dy;
    const d = x < 0 || y < 0 || x >= width ? -1 : dist[y * width + x] ?? -1;
    if (d < 0 || d >= bestDist || !free(game, x, y)) continue;
    best = { x, y };
    bestDist = d;
  }
  if (!best) return false;
  m.x = best.x;
  m.y = best.y;
  return true;
}

/**
 * Step to the free neighbour that is strictly farther from the player by walking distance, the
 * one straight-line farthest when several tie, so a runner heads away rather than sideways.
 */
function stepAway(game: Game, m: Monster, dist: Int32Array, width: number): boolean {
  const here = dist[m.y * width + m.x]!;
  if (here < 0) return false;
  const from = game.state.map.player;
  let best: Point | null = null;
  let bestDist = here;
  let bestSq = -1;
  for (const [dx, dy] of NESW) {
    const x = m.x + dx;
    const y = m.y + dy;
    const d = x < 0 || y < 0 || x >= width ? -1 : dist[y * width + x] ?? -1;
    if (d <= here || !free(game, x, y)) continue;
    const sq = distanceSq({ x, y }, from);
    if (d > bestDist || (d === bestDist && sq > bestSq)) {
      best = { x, y };
      bestDist = d;
      bestSq = sq;
    }
  }
  if (!best) return false;
  m.x = best.x;
  m.y = best.y;
  return true;
}

/** True when a ranged attack can reach the player: in sight, in reach and a clear line with no creature between. */
function clearShot(game: Game, m: Monster): boolean {
  const { map } = game.state;
  if (!sees(game, m) || distanceSq(m, map.player) > SHOOT_RANGE_SQ) return false;
  return lineCells(m, map.player)
    .slice(0, -1)
    .every((c) => isClear(map, c.x, c.y) && !game.monsterAt(c.x, c.y));
}

const caster = (m: Monster): boolean => m.behaviour === 'caster';

/** A ranged attack or spell: the creature rolls d6 plus modifier against an unspent Skill or Magic die of the player. */
function shoot(game: Game, m: Monster, messages: LogMessage[]): void {
  const { player } = game.state;
  if (!caster(m)) m.shots--;
  const defence = caster(m) ? player.magic : player.skill;
  const result = monsterRanged(game.rng, m.modifier, defence);
  m.ambush = false;
  combatAt(game, game.state.map.player, [m]);
  if (result.hit) hitPlayer(game, m, messages, caster(m) ? 'blasts' : 'shoots');
  else messages.push({ kind: 'combat', text: `${Name(m)} ${caster(m) ? 'casts at' : 'shoots at'} you and misses.` });
}

/** Step toward the player along the shortest path; false when there is none or it is blocked. */
const approach = (round: Round, m: Monster): boolean => stepDownhill(round.game, m, round.fromPlayer(), round.width);

// --- Awareness, tracking and morale: once a round, before the creature acts ---

function checkRound(round: Round, m: Monster): void {
  const { game } = round;
  const { map, player } = game.state;
  const visible = sees(game, m);

  if (m.kind === 'rival') {
    if (m.hostile && m.fleeing) trackFleeing(m, visible);
    return;
  }
  if (m.awareness !== 'alert') {
    if (m.role === 'boss' && inSameRoom(game, m)) alert(game, m);
    else if (m.kind === 'bandit' && visible) alert(game, m);
    else if (visible && distanceSq(m, map.player) <= NOTICE_RANGE * NOTICE_RANGE && player.invisible <= 0 && noticeRoll(game.rng, m.awareness, derive(player.equipment, player.stealth).notice)) alert(game, m);
    return;
  }
  if (m.fleeing) return trackFleeing(m, visible);
  if (visible) m.lost = 0;
  else if (++m.lost >= LOSE_TRACK_ROUNDS) {
    m.awareness = 'unaware';
    m.lost = 0;
    return;
  }
  if (failsMorale(game.rng, m)) {
    m.fleeing = true;
    m.fleeLost = 0;
    if (visible) round.messages.push({ kind: 'combat', text: `${Name(m)} turns to flee.` });
  }
}

/** A fleeing creature that stays out of sight for 20 rounds calms down and is unaware again. */
function trackFleeing(m: Monster, visible: boolean): void {
  if (visible) m.fleeLost = 0;
  else if (++m.fleeLost >= LOSE_TRACK_ROUNDS) {
    m.fleeing = false;
    m.fleeLost = 0;
    m.lost = 0;
    m.awareness = 'unaware';
  }
}

function inSameRoom(game: Game, m: Monster): boolean {
  const { level, player } = game.state.map;
  const room = level.rooms.find((r) => m.x >= r.x && m.x < r.x + r.w && m.y >= r.y && m.y < r.y + r.h);
  return !!room && player.x >= room.x && player.x < room.x + room.w && player.y >= room.y && player.y < room.y + room.h;
}

// --- Actions ---

/** An unaware creature wanders: 1 in 2 to step within 3 cells of home. Bosses and ambushers hold their ground. */
function wander(game: Game, m: Monster): void {
  if (m.role === 'boss' || m.behaviour === 'ambusher' || !game.rng.oneIn(2)) return;
  const [dx, dy] = game.rng.pick(NESW);
  const x = m.x + dx;
  const y = m.y + dy;
  if (!free(game, x, y) || Math.max(Math.abs(x - m.home.x), Math.abs(y - m.home.y)) > WANDER_RADIUS) return;
  m.x = x;
  m.y = y;
}

/** Charge: attack when next to the player, else close the distance. */
function charge(round: Round, m: Monster): void {
  const { game, messages } = round;
  if (orthAdjacent(m, game.state.map.player)) monsterAttacks(game, m, messages);
  else approach(round, m);
}

/** Pack: head for a different free cell beside the player, so the group surrounds. */
function surround(round: Round, m: Monster): void {
  const { game, messages } = round;
  const { map } = game.state;
  if (orthAdjacent(m, map.player)) return monsterAttacks(game, m, messages);
  const { width, height } = map.level;
  const goals = NESW.map(([dx, dy]) => ({ x: map.player.x + dx, y: map.player.y + dy })).filter((p) => free(game, p.x, p.y));
  if (goals.length === 0) return void approach(round, m);
  goals.sort((a, b) => Math.abs(a.x - m.x) + Math.abs(a.y - m.y) - (Math.abs(b.x - m.x) + Math.abs(b.y - m.y)));
  // Other creatures and the player are walls to the route, so a pack member blocked by its own pack goes around.
  const terrain = map.terrain.slice();
  for (const o of game.state.monsters) if (o !== m) terrain[o.y * width + o.x] = TERRAIN_BLOCKED;
  terrain[map.player.y * width + map.player.x] = TERRAIN_BLOCKED;
  terrain[goals[0]!.y * width + goals[0]!.x] = TERRAIN_OPEN;
  const toGoal = distancesFrom(terrain, width, height, goals[0]!, (t) => t === TERRAIN_OPEN);
  if (!stepDownhill(game, m, toGoal, width)) approach(round, m);
}

/** Skirmisher and caster: keep 3 to 5 cells away and attack at range; close in when out of shots or cornered. */
function keepDistance(round: Round, m: Monster): void {
  const { game, messages } = round;
  const { map } = game.state;
  const d2 = distanceSq(m, map.player);
  if (!caster(m) && m.shots <= 0) return charge(round, m);
  if (d2 < KEEP_AWAY_SQ) {
    if (stepAway(game, m, round.fromPlayer(), round.width)) return;
    // Cornered: fight in melee if next to the player, else shoot if there is a line.
    if (orthAdjacent(m, map.player)) return monsterAttacks(game, m, messages);
    if (clearShot(game, m)) shoot(game, m, messages);
    return;
  }
  if (clearShot(game, m)) shoot(game, m, messages);
  else approach(round, m);
}

/** Coward: keeps away from a near player, fights only when cornered, closes in from afar. */
function skulk(round: Round, m: Monster): void {
  const { game, messages } = round;
  const { map } = game.state;
  const d2 = distanceSq(m, map.player);
  if (d2 <= COWARD_NEAR_SQ) {
    if (stepAway(game, m, round.fromPlayer(), round.width)) return;
    if (orthAdjacent(m, map.player)) monsterAttacks(game, m, messages);
  } else if (d2 > COWARD_FAR_SQ) {
    approach(round, m);
  }
}

/** A fleeing creature runs from the player; cornered next to the player, it fights. */
function flee(round: Round, m: Monster): void {
  const { game, messages } = round;
  if (stepAway(game, m, round.fromPlayer(), round.width)) return;
  if (orthAdjacent(m, game.state.map.player)) monsterAttacks(game, m, messages);
}

function hunt(round: Round, m: Monster): void {
  switch (m.behaviour) {
    case 'skirmisher':
    case 'caster':
      return keepDistance(round, m);
    case 'pack':
      return surround(round, m);
    case 'coward':
      return skulk(round, m);
    default: // brute, ambusher and the stub rows
      return charge(round, m);
  }
}

// --- Rivals: a peaceful rival travels to the down stair, fights monsters beside it and takes loot on the way ---

/** The rival's melee with a monster next to it: one exchange in which both roll d6 plus modifier. */
function rivalFights(round: Round, rival: Monster, target: Monster): void {
  const { game, messages } = round;
  const exchange = creatureMelee(game.rng, rival, { modifier: target.modifier, unaware: target.awareness !== 'alert', asleep: hasStatus(target.statuses, 'asleep') });
  provoke(game, target);
  combatAt(game, target, [target]);
  if (exchange.defenderHit) damage(game, target, messages, rival);
  if (exchange.attackerHit && game.state.monsters.includes(target)) damage(game, rival, messages, target);
}

/** Take the contents of any container or pile on or beside the rival's cell. Cross-level caches are left alone. */
function loot(game: Game, rival: Monster): void {
  const { level } = game.state.map;
  const { looted } = game.state;
  const near = (p: Point): boolean => Math.max(Math.abs(p.x - rival.x), Math.abs(p.y - rival.y)) <= 1;
  level.features.forEach((f, i) => {
    if (f.type !== 'container' || f.link || looted.features.includes(i) || !near(f)) return;
    const contents = contentsOf(game, i);
    if (contents.length === 0) return;
    looted.features.push(i);
    stateOf(game, i).left = [];
    addLoot(rival.carried, contents);
  });
  level.piles.forEach((p, i) => {
    if (looted.piles.includes(i) || p.contents.length === 0 || !near(p)) return;
    looted.piles.push(i);
    addLoot(rival.carried, p.contents);
  });
}

/** The nearest unlooted container or pile cell, and the steps to it, within the detour limit. */
function lootDetour(round: Round, rival: Monster): Int32Array | null {
  const { game } = round;
  const { map } = game.state;
  const { looted } = game.state;
  const { level } = map;
  const targets: Point[] = [];
  level.features.forEach((f, i) => {
    if (f.type === 'container' && !f.link && !looted.features.includes(i) && contentsOf(game, i).length > 0) targets.push(f);
  });
  level.piles.forEach((p, i) => {
    if (!looted.piles.includes(i) && p.contents.length > 0) targets.push(p);
  });
  if (targets.length === 0) return null;
  const terrain = round.terrainForRivals();
  const here = distancesFrom(terrain, level.width, level.height, rival, (t) => t === TERRAIN_OPEN);
  let best: Point | null = null;
  let bestSteps = LOOT_DETOUR + 1;
  for (const t of targets) {
    // The container's own cell may be blocked later; aim for the nearest reachable cell beside or on it.
    for (const [dx, dy] of [[0, 0], ...NESW] as const) {
      const d = here[(t.y + dy) * level.width + t.x + dx] ?? -1;
      if (d >= 0 && d < bestSteps) {
        bestSteps = d;
        best = { x: t.x + dx, y: t.y + dy };
      }
    }
  }
  return best ? distancesFrom(terrain, level.width, level.height, best, (t) => t === TERRAIN_OPEN) : null;
}

/** A rival's step onto a closed normal door opens it. */
function openDoorAt(game: Game, x: number, y: number): void {
  const { map } = game.state;
  const cell = y * map.level.width + x;
  if (map.terrain[cell] === TERRAIN_OPEN || map.level.tiles[y]![x] !== TILE.door) return;
  map.openDoors.push(cell);
  map.terrain[cell] = TERRAIN_OPEN;
  refreshSight(map);
}

function rivalWalks(round: Round, rival: Monster): void {
  const { game } = round;
  const { map } = game.state;
  const terrain = round.terrainForRivals();
  const walk = (dist: Int32Array): boolean => {
    const here = dist[rival.y * map.level.width + rival.x]!;
    if (here < 0) return false;
    for (const [dx, dy] of NESW) {
      const x = rival.x + dx;
      const y = rival.y + dy;
      if (x < 0 || y < 0 || x >= map.level.width || y >= map.level.height) continue;
      const d = dist[y * map.level.width + x]!;
      if (d < 0 || d >= here || terrain[y * map.level.width + x] !== TERRAIN_OPEN || game.monsterAt(x, y) || (map.player.x === x && map.player.y === y)) continue;
      openDoorAt(game, x, y);
      rival.x = x;
      rival.y = y;
      return true;
    }
    return false;
  };
  const detour = lootDetour(round, rival);
  if (detour && walk(detour)) return;
  const toStair = round.fromStair();
  // It waits beside the stair; no creature uses stairs.
  if (toStair && (toStair[rival.y * map.level.width + rival.x] ?? -1) > 1) walk(toStair);
}

function rivalTurn(round: Round, rival: Monster): void {
  const { game } = round;
  const next = game.state.monsters.find((o) => o !== rival && o.kind !== 'rival' && orthAdjacent(o, rival));
  if (next) rivalFights(round, rival, next);
  else rivalWalks(round, rival);
  loot(game, rival);
}

// --- The round ---

/** How many times a creature acts in the given round (Spec 04): fast twice, normal once, slow every other round. */
export function actionsInRound(speed: Monster['speed'], round: number): number {
  if (speed === 'fast') return 2;
  if (speed === 'normal') return 1;
  return round % 2 === 0 ? 1 : 0;
}

/** Every creature acts, nearest first, up to 50 (Spec 04). */
export function creaturesAct(game: Game, messages: LogMessage[]): void {
  const { map, monsters, round: number, player } = game.state;
  const round = new Round(game, messages);
  const order = monsters
    .slice()
    .sort((a, b) => distanceSq(a, map.player) - distanceSq(b, map.player) || a.id - b.id)
    .slice(0, MAX_SIMULATED);
  for (const m of order) {
    if (player.dead) return;
    if (!monsters.includes(m)) continue;
    checkRound(round, m);
    for (let n = actionsInRound(effectiveSpeed(m.speed, m.statuses), number); n > 0; n--) {
      if (player.dead || !monsters.includes(m)) break;
      if (cannotAct(m.statuses)) break; // Asleep or Held (Spec 04, Status effects)
      if (m.stunned) {
        m.stunned = false; // a mace's stun costs its next action (Spec 05)
        continue;
      }
      if (m.kind === 'rival' && !m.hostile) rivalTurn(round, m);
      else if (m.awareness === 'asleep') break;
      else if (m.awareness === 'unaware') wander(game, m);
      else if (m.fleeing || hasStatus(m.statuses, 'frightened')) flee(round, m);
      else hunt(round, m);
    }
  }
}
