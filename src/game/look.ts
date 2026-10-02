// L, look (Spec 01, Addendum A; task 3.9): what the player knows of one cell. A visible cell lists its creature, its
// items, its feature with its state and its terrain; a remembered cell its feature and terrain; an unseen one nothing.

import { distanceSq, bearingFromNorth } from '../rules/world/geometry.ts';
import { TILE, type Point } from '../rules/world/level.ts';
import { describeStatus } from '../rules/magic/status.ts';
import { Name } from './combat.ts';
import { doorAt, stateOf } from './features/index.ts';
import type { Game } from './game.ts';
import { lootLine } from './items.ts';
import { type Monster, ratingText } from './monsters.ts';

const TERRAIN_NAMES: Readonly<Record<string, string>> = {
  [TILE.wall]: 'wall',
  [TILE.floor]: 'floor',
  [TILE.stairsUp]: 'stairs up',
  [TILE.stairsDown]: 'stairs down',
  [TILE.door]: 'door',
  [TILE.shallowWater]: 'shallow water',
  [TILE.deepWater]: 'deep water',
  [TILE.lava]: 'lava',
};

const ROLES: Readonly<Record<string, string>> = { trader: 'trader', hermit: 'hermit', captive: 'captive' };

/** "Asleep", "Unaware" or "Alert", for a creature. */
function awarenessOf(m: Monster): string {
  if (m.kind === 'ally') return 'ally';
  if (m.kind === 'rival' && !m.hostile) return 'peaceful';
  return m.awareness === 'asleep' ? 'asleep' : m.awareness === 'unaware' ? 'unaware' : 'alert';
}

/** A creature as look reads it: name, rating, awareness and statuses. */
function creatureText(m: Monster): string {
  const statuses = m.statuses.map(describeStatus);
  return [`${Name(m)} ${ratingText(m)}`, awarenessOf(m), ...statuses].join(', ');
}

/** The cell's terrain, with a door's state. */
function terrainText(game: Game, at: Point): string {
  const { map, revealed } = game.state;
  const { level } = map;
  const i = at.y * level.width + at.x;
  const door = doorAt(game, at.x, at.y);
  // A secret door counts as a door once found, and as wall until then.
  if (door && (door.kind !== 'secret' || revealed.includes(i))) {
    if (map.openDoors.includes(i)) return 'open door';
    if (door.kind === 'locked') return 'locked door';
    if (door.kind === 'sealed') return 'sealed door';
    return 'closed door';
  }
  return TERRAIN_NAMES[level.tiles[at.y]![at.x]!] ?? 'floor';
}

/** What stands on the cell besides terrain, with its state: a container, fixture, debris, wall mark, special, found trap or totem. */
function featureText(game: Game, at: Point): string[] {
  const { map, looted, used, revealed } = game.state;
  const { level } = map;
  const i = at.y * level.width + at.x;
  const out: string[] = [];
  const index = level.features.findIndex((f) => f.x === at.x && f.y === at.y);
  const f = level.features[index];
  if (f?.type === 'debris' || used.collapsed.includes(i)) out.push(used.searched.includes(i) ? 'debris (searched)' : 'debris');
  else if (f?.type === 'container') {
    const state = stateOf(game, index);
    const words = [f.kind === 'rack' ? 'weapon rack' : f.kind === 'pottery' ? 'pot' : f.kind];
    if (map.cleared.includes(i)) words.push('(smashed)');
    else if (looted.features.includes(index) || (state.left !== undefined && state.left.length === 0)) words.push('(looted)');
    else if (state.left !== undefined) words.push('(open)');
    if (f.trap && revealed.includes(i) && !state.trapGone) words.push('(trapped)');
    out.push(words.join(' '));
  } else if (f?.type === 'fixture') {
    const state = stateOf(game, index);
    if (f.kind === 'fountain') out.push(state.limit !== undefined && (state.drinks ?? 0) >= state.limit ? 'fountain (dry)' : 'fountain');
    else if (f.kind === 'altar') out.push(`altar${f.god ? ` of ${f.god.name}` : ''}${state.done ? ' (offered)' : ''}`);
    else if (f.kind === 'sarcophagus') out.push(state.done ? 'sarcophagus (open)' : 'sarcophagus');
    else out.push(state.done ? 'rune (spent)' : 'rune');
  }
  const mark = level.lore.find((m) => m.x === at.x && m.y === at.y);
  if (mark) out.push(mark.kind === 'rune' && used.marks.includes(level.lore.indexOf(mark)) ? 'rune (spent)' : mark.kind);
  for (const s of level.specials) {
    if (s.x !== at.x || s.y !== at.y) continue;
    if (s.kind === 'teleporter') out.push('teleporter');
    else if (s.kind === 'lever') out.push(used.lever ? 'lever (pulled)' : 'lever');
  }
  // A found floor trap names its kind (Spec 06); one disarmed or sprung is gone.
  const trap = level.traps.find((t) => t.x === at.x && t.y === at.y);
  if (trap && revealed.includes(i) && !used.disarmed.includes(i)) out.push(`${game.content.traps.get(trap.id)?.name ?? 'trap'} (trap)`);
  if (map.totem && map.totem.x === at.x && map.totem.y === at.y) out.push('spirit totem');
  return out;
}

/** The items lying on the cell: a level pile not yet taken and anything dropped there. */
function itemsText(game: Game, at: Point): string[] {
  const { map, looted, drops } = game.state;
  const out: string[] = [];
  map.level.piles.forEach((p, i) => {
    if (p.x === at.x && p.y === at.y && !looted.piles.includes(i)) p.contents.forEach((l, n) => out.push(lootLine(game, l, n, at)));
  });
  for (const p of drops) if (p.x === at.x && p.y === at.y) p.contents.forEach((l, n) => out.push(lootLine(game, l, n, at)));
  return out;
}

/** The line look shows for a cell (Spec 01, Addendum A). */
export function describeCell(game: Game, at: Point): string {
  const { map, used } = game.state;
  const { level } = map;
  if (at.x < 0 || at.y < 0 || at.x >= level.width || at.y >= level.height) return 'You have not seen there.';
  const i = at.y * level.width + at.x;
  const terrain = terrainText(game, at);
  const feature = featureText(game, at);
  if (map.visible[i] !== 1) {
    if (!map.exploration.explored[i]) return 'You have not seen there.';
    return `${[...feature, terrain].join('; ')} (remembered)`;
  }
  const parts: string[] = [];
  if (map.player.x === at.x && map.player.y === at.y) parts.push('You');
  const m = game.monsterAt(at.x, at.y);
  if (m) parts.push(creatureText(m));
  const npcIndex = level.npcs.findIndex((n) => n.x === at.x && n.y === at.y && ROLES[n.kind] && !used.npcs[level.npcs.indexOf(n)]?.freed);
  if (npcIndex >= 0) parts.push(`${level.npcs[npcIndex]!.name}, ${ROLES[level.npcs[npcIndex]!.kind]}`);
  const items = itemsText(game, at);
  if (items.length > 0) parts.push(items.join(', '));
  parts.push(...feature, terrain);
  return parts.join('; ');
}

/** The visible creatures look's Tab jumps between: nearest the player first, ties clockwise from north. */
export function lookCreatures(game: Game): Monster[] {
  const { map } = game.state;
  return game.state.monsters
    .filter((m) => map.visible[m.y * map.level.width + m.x] === 1)
    .sort((a, b) => distanceSq(map.player, a) - distanceSq(map.player, b) || bearingFromNorth(map.player, a) - bearingFromNorth(map.player, b));
}
