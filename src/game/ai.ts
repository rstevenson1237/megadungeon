// Creature turns (Spec 04, "Turns and timing", "Awareness and stealth" and "Monster and hostile NPC
// behaviour"): after the player acts, every creature on the level acts in order of distance to the
// player, nearest first, at most 50 a round. Rolls come from rules/combat; effects from game/combat.

import type { LogMessage } from '../core/log.ts';
import { LOSE_TRACK_ROUNDS, NOTICE_RANGE, noticeRoll } from '../rules/combat/awareness.ts';
import { creatureMelee, failsMorale, monsterRanged } from '../rules/combat/attacks.ts';
import { derived } from './items.ts';
import { joinFight } from './abilities.ts';
import { weakMode } from './connective.ts';
import { cannotAct, effectiveSpeed, hasStatus } from '../rules/magic/status.ts';
import { distanceSq, lineCells } from '../rules/world/geometry.ts';
import { distancesFrom } from '../rules/world/grid.ts';
import { TILE, type Point } from '../rules/world/level.ts';
import { Name, addLoot, alert, combatAt, damage, hitPlayer, isHostile, monsterAttacks, provoke, seen } from './combat.ts';
import { contentsOf, stateOf, trapAt } from './features/index.ts';
import type { Game } from './game.ts';
import { TERRAIN_BLOCKED, TERRAIN_OPEN, isClear, refreshSight } from './map-state.ts';
import { type Monster, isAlly } from './monsters.ts';

/** At most this many creatures act per round, nearest first (Spec 04). */
export const MAX_SIMULATED = 50;

/** How a creature with a ranged attack keeps its distance, and how far it shoots (Spec 04, task 2.7). */
const KEEP_AWAY_SQ = 3 * 3;
const SHOOT_RANGE_SQ = 6 * 6;
/** A coward flees when the player is within 4 cells and closes in beyond 6. */
const COWARD_NEAR_SQ = 4 * 4;
const COWARD_FAR_SQ = 6 * 6;
/** Alert hostile creatures this close to a phantom take it for the player (Spec 04, Addendum A). */
const PHANTOM_LURE_SQ = 8 * 8;
/** An ally with nothing to fight keeps within this many cells of the player. */
const ALLY_LEASH = 3;
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
  /** Walking distances to other cells (a phantom, an ally's foe), by cell index. */
  private toCell = new Map<number, Int32Array>();
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

  /** Walking distance from a cell to every cell, on the same terrain as `fromPlayer`. */
  from(at: Point): Int32Array {
    const { map } = this.game.state;
    const key = at.y * map.level.width + at.x;
    let dist = this.toCell.get(key);
    if (!dist) this.toCell.set(key, (dist = distancesFrom(this.withoutTraps(map.terrain), map.level.width, map.level.height, at, (t) => t === TERRAIN_OPEN)));
    return dist;
  }

  /**
   * What a hunting creature goes for: the player, or a phantom within 8 cells of an alert hostile creature, which it
   * takes for the player for moving and attacking (Spec 04, Addendum A).
   */
  goalOf(m: Monster): Goal {
    const { map, monsters } = this.game.state;
    const phantom = monsters.find((a) => a.ally === 'phantom');
    if (phantom && m.awareness === 'alert' && isHostile(m) && distanceSq(m, phantom) <= PHANTOM_LURE_SQ) return { at: phantom, phantom, dist: () => this.from(phantom) };
    return { at: map.player, phantom: null, dist: () => this.fromPlayer() };
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

/** Where a hunting creature heads and what it attacks: the player, or a phantom it takes for the player. */
interface Goal {
  at: Point;
  phantom: Monster | null;
  /** Walking distance to the goal from every cell. */
  dist: () => Int32Array;
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
function stepAway(game: Game, m: Monster, dist: Int32Array, width: number, from: Point = game.state.map.player): boolean {
  const here = dist[m.y * width + m.x]!;
  if (here < 0) return false;
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

/** True when a ranged attack can reach the goal: in sight, in reach and a clear line with no creature between. */
function clearShot(game: Game, m: Monster, at: Point = game.state.map.player): boolean {
  const { map } = game.state;
  if (!sees(game, m) || distanceSq(m, at) > SHOOT_RANGE_SQ) return false;
  return lineCells(m, at)
    .slice(0, -1)
    .every((c) => isClear(map, c.x, c.y) && !game.monsterAt(c.x, c.y));
}

const caster = (m: Monster): boolean => m.behaviour === 'caster';

/** A ranged attack or spell: the creature rolls d6 plus modifier against an unspent Skill or Magic die of the player. */
function shoot(game: Game, m: Monster, messages: LogMessage[]): void {
  const { player } = game.state;
  if (!caster(m)) m.shots--;
  const defence = caster(m) ? player.pools.magic : player.pools.skill;
  const result = monsterRanged(game.rng, m.modifier, defence, weakMode(game, m));
  m.ambush = false;
  joinFight(player, game.state.round); // an exchange involving the player (Spec 03, Addendum A)
  combatAt(game, game.state.map.player, [m]);
  if (result.hit) hitPlayer(game, m, messages, caster(m) ? 'blasts' : 'shoots');
  else messages.push({ kind: 'combat', text: `${Name(m)} ${caster(m) ? 'casts at' : 'shoots at'} you and misses.` });
}

/** Step toward the goal along the shortest path; false when there is none or it is blocked. */
const approach = (round: Round, m: Monster, goal: Goal): boolean => stepDownhill(round.game, m, goal.dist(), round.width);

/** Attack the goal in melee: the player, or a phantom, whose attacks pass harmlessly with no exchange (Spec 04, Addendum A). */
function strike(round: Round, m: Monster, goal: Goal): void {
  const { game, messages } = round;
  if (!goal.phantom) return monsterAttacks(game, m, messages);
  m.ambush = false;
  if (seen(game, m)) messages.push({ kind: 'combat', text: `${Name(m)} attacks the phantom, and the blow passes through it.` });
}

/** A ranged attack or spell at the goal; one at a phantom passes harmlessly. */
function fireAt(round: Round, m: Monster, goal: Goal): void {
  const { game, messages } = round;
  if (!goal.phantom) return shoot(game, m, messages);
  if (!caster(m)) m.shots--;
  m.ambush = false;
  if (seen(game, m)) messages.push({ kind: 'combat', text: `${Name(m)} ${caster(m) ? 'casts at' : 'shoots at'} the phantom, to no effect.` });
}

// --- Awareness, tracking and morale: once a round, before the creature acts ---

function checkRound(round: Round, m: Monster): void {
  const { game } = round;
  const { map, player } = game.state;
  const visible = sees(game, m);

  if (m.kind === 'ally') return; // allies notice nothing and never flee
  if (m.kind === 'rival') {
    if (m.hostile && m.fleeing) trackFleeing(m, visible);
    return;
  }
  if (m.awareness !== 'alert') {
    if (m.role === 'boss' && inSameRoom(game, m)) alert(game, m);
    else if (m.kind === 'bandit' && visible) alert(game, m);
    else if (visible && distanceSq(m, map.player) <= NOTICE_RANGE * NOTICE_RANGE && player.invisible <= 0 && noticeRoll(game.rng, m.awareness, derived(game).notice)) alert(game, m);
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

/** Charge: attack when next to the goal, else close the distance. */
function charge(round: Round, m: Monster, goal: Goal): void {
  if (orthAdjacent(m, goal.at)) strike(round, m, goal);
  else approach(round, m, goal);
}

/** Pack: head for a different free cell beside the goal, so the group surrounds. */
function surround(round: Round, m: Monster, goal: Goal): void {
  const { game } = round;
  const { map } = game.state;
  if (orthAdjacent(m, goal.at)) return strike(round, m, goal);
  const { width, height } = map.level;
  const goals = NESW.map(([dx, dy]) => ({ x: goal.at.x + dx, y: goal.at.y + dy })).filter((p) => free(game, p.x, p.y));
  if (goals.length === 0) return void approach(round, m, goal);
  goals.sort((a, b) => Math.abs(a.x - m.x) + Math.abs(a.y - m.y) - (Math.abs(b.x - m.x) + Math.abs(b.y - m.y)));
  // Other creatures and the player are walls to the route, so a pack member blocked by its own pack goes around.
  const terrain = map.terrain.slice();
  for (const o of game.state.monsters) if (o !== m) terrain[o.y * width + o.x] = TERRAIN_BLOCKED;
  terrain[map.player.y * width + map.player.x] = TERRAIN_BLOCKED;
  terrain[goals[0]!.y * width + goals[0]!.x] = TERRAIN_OPEN;
  const toGoal = distancesFrom(terrain, width, height, goals[0]!, (t) => t === TERRAIN_OPEN);
  if (!stepDownhill(game, m, toGoal, width)) approach(round, m, goal);
}

/** Skirmisher and caster: keep 3 to 5 cells away and attack at range; close in when out of shots or cornered. */
function keepDistance(round: Round, m: Monster, goal: Goal): void {
  const { game } = round;
  const d2 = distanceSq(m, goal.at);
  if (!caster(m) && m.shots <= 0) return charge(round, m, goal);
  if (d2 < KEEP_AWAY_SQ) {
    if (stepAway(game, m, goal.dist(), round.width, goal.at)) return;
    // Cornered: fight in melee if next to the goal, else shoot if there is a line.
    if (orthAdjacent(m, goal.at)) return strike(round, m, goal);
    if (clearShot(game, m, goal.at)) fireAt(round, m, goal);
    return;
  }
  if (clearShot(game, m, goal.at)) fireAt(round, m, goal);
  else approach(round, m, goal);
}

/** Coward: keeps away from a near player, fights only when cornered, closes in from afar. */
function skulk(round: Round, m: Monster, goal: Goal): void {
  const { game } = round;
  const d2 = distanceSq(m, goal.at);
  if (d2 <= COWARD_NEAR_SQ) {
    if (stepAway(game, m, goal.dist(), round.width, goal.at)) return;
    if (orthAdjacent(m, goal.at)) strike(round, m, goal);
  } else if (d2 > COWARD_FAR_SQ) {
    approach(round, m, goal);
  }
}

/** A fleeing creature runs from the player; cornered next to the player, it fights. */
function flee(round: Round, m: Monster): void {
  const { game, messages } = round;
  if (stepAway(game, m, round.fromPlayer(), round.width)) return;
  if (orthAdjacent(m, game.state.map.player)) monsterAttacks(game, m, messages);
}

function hunt(round: Round, m: Monster): void {
  const goal = round.goalOf(m);
  // A hostile creature attacks an adjacent ally only when the player (or what it takes for the player) is not adjacent to it.
  if (!orthAdjacent(m, goal.at)) {
    const ally = besideAlly(round.game, m);
    if (ally) return fightAlly(round, m, ally);
  }
  switch (m.behaviour) {
    case 'skirmisher':
    case 'caster':
      return keepDistance(round, m, goal);
    case 'pack':
      return surround(round, m, goal);
    case 'coward':
      return skulk(round, m, goal);
    default: // brute, ambusher and the stub rows
      return charge(round, m, goal);
  }
}

// --- Allies (Spec 04, Addendum A) ---

/** An ally in one of the four cells beside a creature, the first from north clockwise: never the phantom, which no one can strike. */
function besideAlly(game: Game, m: Monster): Monster | undefined {
  for (const [dx, dy] of NESW) {
    const a = game.monsterAt(m.x + dx, m.y + dy);
    if (a && isAlly(a) && a.ally !== 'phantom') return a;
  }
  return undefined;
}

/**
 * One exchange between an ally and a creature, `attacker` first: ordinary melee in which both roll d6 plus modifier,
 * as rivals fight. It is combat for awareness and noise, and the creature an ally attacks is provoked.
 */
function allyExchange(round: Round, attacker: Monster, defender: Monster): void {
  const { game, messages } = round;
  const exchange = creatureMelee(game.rng, { modifier: attacker.modifier, unaware: attacker.awareness !== 'alert' }, { modifier: defender.modifier, unaware: defender.awareness !== 'alert', asleep: hasStatus(defender.statuses, 'asleep') });
  attacker.ambush = false;
  if (!isAlly(defender)) provoke(game, defender);
  combatAt(game, defender, [attacker, defender]);
  if (exchange.defenderHit) damage(game, defender, messages, attacker);
  if (exchange.attackerHit && game.state.monsters.includes(defender) && game.state.monsters.includes(attacker)) damage(game, attacker, messages, defender);
}

const fightAlly = (round: Round, m: Monster, ally: Monster): void => allyExchange(round, m, ally);

/**
 * An ally's turn (Spec 04, Addendum A): attack an adjacent hostile creature, fewest dice first; else move toward the
 * nearest hostile creature in sight; else keep within 3 cells of the player. The phantom does not act. Peaceful
 * rivals, traders, hermits and captives are never attacked.
 */
function allyTurn(round: Round, a: Monster): void {
  if (a.ally === 'phantom') return;
  const { game } = round;
  const { map, monsters } = game.state;
  let target: Monster | undefined;
  for (const [dx, dy] of NESW) {
    const o = game.monsterAt(a.x + dx, a.y + dy);
    if (o && isHostile(o) && (!target || o.dice < target.dice)) target = o;
  }
  if (target) return allyExchange(round, a, target);
  const foe = monsters
    .filter((o) => isHostile(o) && map.visible[o.y * round.width + o.x] === 1)
    .sort((p, q) => distanceSq(a, p) - distanceSq(a, q) || p.id - q.id)[0];
  if (foe) {
    stepDownhill(game, a, round.from(foe), round.width);
    return;
  }
  if (Math.max(Math.abs(a.x - map.player.x), Math.abs(a.y - map.player.y)) > ALLY_LEASH) stepDownhill(game, a, round.fromPlayer(), round.width);
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
  const next = game.state.monsters.find((o) => o !== rival && o.kind !== 'rival' && !isAlly(o) && orthAdjacent(o, rival));
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
      if (isAlly(m)) allyTurn(round, m);
      else if (m.kind === 'rival' && !m.hostile) rivalTurn(round, m);
      else if (m.awareness === 'asleep') break;
      else if (m.awareness === 'unaware') wander(game, m);
      else if (m.fleeing || hasStatus(m.statuses, 'frightened')) flee(round, m);
      else hunt(round, m);
    }
  }
}
