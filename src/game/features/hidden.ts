// Searching, noticing and traps (Spec 06, "Searching and hidden things" and "Traps", with the clarifications
// of task 2.10): what is hidden, how a search and a passive notice find it, debris finds, and what a floor or
// container trap does when it springs, is avoided or is disarmed.

import type { LogMessage } from '../../core/log.ts';
import { eligibleEntries, pickWeighted } from '../../core/roller.ts';
import type { Trap } from '../../core/schemas.ts';
import { addCoins, addToPack } from '../../rules/items/inventory.ts';
import { makeAmmo, makeLockpicks, makeMagicItem } from '../../rules/items/magic.ts';
import { makeGear } from '../../rules/items/gear.ts';
import type { Item } from '../../rules/items/types.ts';
import { applyStatus } from '../../rules/magic/status.ts';
import type { Point } from '../../rules/world/level.ts';
import { createRng } from '../../core/rng.ts';
import { alert } from '../combat.ts';
import type { Game } from '../game.ts';
import { addToDrops, derivedFor } from '../items.ts';
import { around, cellOf, check, depthOf, featureIndexAt, hasContainerTrap, seeded, stateOf, trapAt } from './common.ts';
import { hurt, summon, teleportPlayer, wanderer } from './spawn.ts';

/** A hidden thing the player can find (Spec 06). */
export type Hidden =
  | { kind: 'floor_trap'; cell: number }
  | { kind: 'container_trap'; cell: number; index: number }
  | { kind: 'secret_door'; cell: number }
  | { kind: 'debris'; cell: number };

/** Hidden things in the 8 cells around a point. `debris` leaves out debris, which a passive notice never finds. */
export function hiddenNear(game: Game, at: Point, debris = true): Hidden[] {
  const { map, revealed, used } = game.state;
  const { level } = map;
  const found: Hidden[] = [];
  for (const p of around(game, at)) {
    const cell = cellOf(game, p);
    if (!revealed.includes(cell)) {
      if (trapAt(game, p.x, p.y)) found.push({ kind: 'floor_trap', cell });
      if (level.doors.some((d) => d.x === p.x && d.y === p.y && d.kind === 'secret')) found.push({ kind: 'secret_door', cell });
      const index = featureIndexAt(game, p.x, p.y);
      if (index >= 0 && hasContainerTrap(game, index)) found.push({ kind: 'container_trap', cell, index });
    }
    if (debris && !used.searched.includes(cell) && (used.collapsed.includes(cell) || level.features.some((f) => f.type === 'debris' && f.x === p.x && f.y === p.y))) {
      found.push({ kind: 'debris', cell });
    }
  }
  return found;
}

const LABEL: Record<Hidden['kind'], string> = {
  floor_trap: 'a trap',
  container_trap: 'a trap on a container',
  secret_door: 'a secret door',
  debris: 'something in the debris',
};

/** Reveal a hidden thing: found for good (Spec 06). Debris gives its find. */
export function reveal(game: Game, h: Hidden, messages: LogMessage[]): void {
  if (h.kind === 'debris') {
    game.state.used.searched.push(h.cell);
    debrisFind(game, h.cell, messages);
    return;
  }
  game.state.revealed.push(h.cell);
  messages.push({ kind: 'discovery', text: `You find ${LABEL[h.kind]}.` });
}

/**
 * Search (X): one Skill check for each hidden thing in the 8 cells around, 4 or more finds it (Spec 06). Rings
 * and cloaks of searching give advantage, Blessed and Cursed apply, and a 1 on any check is one Search negative
 * effect for the whole search.
 */
export function search(game: Game, messages: LogMessage[]): void {
  const mode = derivedFor(game.state.player).search;
  const things = hiddenNear(game, game.state.map.player);
  if (things.length === 0) {
    messages.push({ kind: 'system', text: 'You search and find nothing.' });
    return;
  }
  let unlucky = false;
  let found = 0;
  for (const h of things) {
    const roll = check(game, 'skill', mode);
    if (roll.success) {
      reveal(game, h, messages);
      found++;
    } else if (roll.negative) unlucky = true;
  }
  if (found === 0) messages.push({ kind: 'system', text: 'You search and find nothing.' });
  if (unlucky) negative(game, 'search', messages);
}

/**
 * The free check when a step ends beside a hidden floor trap, container trap or secret door that has not had one:
 * a Skill check with disadvantage, once per thing, and never a negative effect (Spec 06, task 2.10).
 */
export function passiveNotice(game: Game, messages: LogMessage[]): void {
  const { used } = game.state;
  for (const h of hiddenNear(game, game.state.map.player, false)) {
    if (used.noticed.includes(h.cell)) continue;
    used.noticed.push(h.cell);
    if (check(game, 'skill', 'disadvantage').success) reveal(game, h, messages);
  }
}

// --- Debris finds ---

/** An item for a find or a reward, by table id (an equipment base or a magic item), made from a seeded roll. */
export function makeFindItem(game: Game, id: string, count: number | undefined, ...seedParts: (string | number)[]): Item | undefined {
  const uid = seeded(game, 'find', ...seedParts);
  const { bases, magic } = game.items;
  const base = bases.get(id);
  if (base) {
    if (base.type === 'ammo') return makeAmmo(base, uid, count ?? base.per!);
    if (base.type === 'tool') return makeLockpicks(base, uid, count ?? 1);
    return makeGear(base, uid);
  }
  const row = magic.get(id);
  return row ? makeMagicItem(row, uid, createRng(uid), game.items) : undefined;
}

/** Put an item in the pack, or on the floor where the player stands when it does not fit. */
export function giveItem(game: Game, item: Item, messages: LogMessage[], name: string): void {
  const { player, map } = game.state;
  const want = 'count' in item ? item.count : 1;
  const got = addToPack(player, player.packSlots, item);
  if (got > 0) messages.push({ kind: 'loot', text: `You take ${name}.` });
  if (got < want) {
    addToDrops(game, map.player, [{ kind: 'item', item: got > 0 && 'count' in item ? ({ ...item, count: want - got } as Item) : item }]);
    messages.push({ kind: 'warning', text: 'Your pack is full: the rest lies at your feet.' });
  }
}

/** Searching debris turns up one thing from the table (Spec 06): a few coins, scaled by depth, or a small item. */
function debrisFind(game: Game, cell: number, messages: LogMessage[]): void {
  const row = pickWeighted(eligibleEntries(game.content.debris, { depth: depthOf(game) }), game.rng);
  if (!row) {
    messages.push({ kind: 'system', text: 'You sift the debris and find nothing of use.' });
    return;
  }
  if (row.find === 'coins') {
    const [lo, hi] = row.amount!;
    const amount = game.rng.int(lo, hi) * Math.max(1, depthOf(game));
    const { player, map } = game.state;
    const got = addCoins(player, player.packSlots, amount);
    messages.push({ kind: 'loot', text: `In the debris you find ${row.name}: ${amount} gp.` });
    if (got < amount) addToDrops(game, map.player, [{ kind: 'coins', amount: amount - got }]);
    return;
  }
  const item = makeFindItem(game, row.item!, row.count, 'debris', cell);
  if (!item) {
    messages.push({ kind: 'system', text: 'You sift the debris and find nothing of use.' });
    return;
  }
  messages.push({ kind: 'loot', text: `In the debris you find ${row.name}.` });
  giveItem(game, item, messages, row.name);
}

// --- Traps ---

/** The number of Combat dice a trap takes: two for the heavy ones below level 50 (Spec 06). */
export const trapDice = (trap: Trap, depth: number): number => (trap.dice ?? 1) * (trap.heavy && depth > 50 ? 2 : 1);

function loseDice(game: Game, trap: Trap, messages: LogMessage[]): void {
  for (let n = trapDice(trap, depthOf(game)); n > 0 && !game.state.player.dead; n--) hurt(game, messages, `The ${trap.name} hurts you`);
}

/** A trap springs (Spec 06): its effect on the player and the level. `at` is where it was. */
export function triggerTrap(game: Game, trap: Trap, at: Point, messages: LogMessage[]): void {
  const { player } = game.state;
  messages.push({ kind: 'warning', text: `You set off a ${trap.name}!` });
  switch (trap.effect) {
    case 'lose_dice':
      loseDice(game, trap, messages);
      break;
    case 'status':
      applyStatus(player.statuses, trap.status!, trap.rounds ?? null);
      messages.push({ kind: 'warning', text: `You are ${trap.status!}.` });
      break;
    case 'alarm':
      for (const m of game.state.monsters) if (m.kind !== 'rival') alert(game, m);
      messages.push({ kind: 'warning', text: 'A shrill alarm sounds, and everything on the level is roused.' });
      break;
    case 'teleport':
      teleportPlayer(game, messages);
      break;
    case 'collapse':
      loseDice(game, trap, messages);
      if (game.state.used.collapsed.indexOf(cellOf(game, at)) < 0) game.state.used.collapsed.push(cellOf(game, at));
      messages.push({ kind: 'warning', text: 'The floor gives way, and rubble settles.' });
      break;
    case 'deep_pit':
      loseDice(game, trap, messages);
      if (!player.dead) {
        game.pending.fall = true;
        messages.push({ kind: 'warning', text: 'You plunge down the shaft!' });
      }
      break;
    case 'summon':
      summon(game, at, messages);
      break;
  }
}

const rowOf = (game: Game, id: string): Trap =>
  game.content.traps.get(id) ?? { id, name: 'trap', kind: 'floor', effect: 'lose_dice', dice: 1 };

/** The player steps onto a floor trap that is not yet found: a Skill check to avoid it (Spec 06). */
export function stepOnTrap(game: Game, at: Point, messages: LogMessage[]): void {
  const trap = trapAt(game, at.x, at.y);
  if (!trap) return;
  const roll = check(game, 'skill');
  if (roll.success) {
    game.state.revealed.push(cellOf(game, at));
    messages.push({ kind: 'discovery', text: 'You spot a trap at the last moment and jump clear!' });
    return;
  }
  game.state.used.disarmed.push(cellOf(game, at)); // a sprung trap is spent
  triggerTrap(game, rowOf(game, trap.id), at, messages);
}

/** Disarm a found trap (E): a Skill check. 4 or more removes it, 2 to 3 fails safely, 1 springs it (Spec 06). */
export function disarm(game: Game, target: { kind: 'floor'; at: Point } | { kind: 'container'; index: number }, messages: LogMessage[]): void {
  const { map } = game.state;
  const roll = check(game, 'skill');
  const trapId = target.kind === 'floor' ? trapAt(game, target.at.x, target.at.y)!.id : (map.level.features[target.index] as { trap: string }).trap;
  const row = rowOf(game, trapId);
  const at = target.kind === 'floor' ? target.at : (map.level.features[target.index] as Point);
  if (roll.success) {
    if (target.kind === 'floor') game.state.used.disarmed.push(cellOf(game, at));
    else stateOf(game, target.index).trapGone = true;
    messages.push({ kind: 'discovery', text: `You disarm the ${row.name}.` });
    return;
  }
  if (!roll.negative) {
    messages.push({ kind: 'system', text: `You fail to disarm the ${row.name}, but nothing happens.` });
    return;
  }
  if (target.kind === 'floor') game.state.used.disarmed.push(cellOf(game, at));
  else stateOf(game, target.index).trapGone = true;
  messages.push({ kind: 'warning', text: 'Your hand slips!' });
  triggerTrap(game, row, at, messages);
}

/** The player's step ends: hidden traps underfoot are met, and what lies beside is noticed (Spec 06). */
export function onStep(game: Game, messages: LogMessage[]): void {
  stepOnTrap(game, game.state.map.player, messages);
  if (!game.state.player.dead && !game.pending.fall) passiveNotice(game, messages);
}

// --- Negative effects ---

/** The checks that can roll a 1 (Spec 06, "Negative effects on a rolled 1"). */
export type CheckKind = 'search' | 'pick_lock' | 'force_lock' | 'trap' | 'spellbook' | 'altar' | 'sarcophagus' | 'rune' | 'other';

/**
 * The cost of a rolled 1, by what the player was doing (Spec 06). Those that need the thing being worked on
 * (a lock, a trap, a book) are applied where that thing is; the rest are here.
 */
export function negative(game: Game, kind: CheckKind, messages: LogMessage[]): void {
  switch (kind) {
    case 'search':
    case 'other':
      wanderer(game, messages);
      break;
    case 'force_lock':
      hurt(game, messages, 'The strain tears something in you');
      break;
    case 'altar':
      applyStatus(game.state.player.statuses, 'cursed', null);
      messages.push({ kind: 'warning', text: 'The altar turns on you: you are cursed!' });
      break;
    case 'sarcophagus':
      hurt(game, messages, 'The lid crashes down on your hands');
      break;
    case 'rune':
      if (game.rng.oneIn(2)) hurt(game, messages, 'The rune flares and burns you');
      else teleportPlayer(game, messages);
      break;
    case 'pick_lock':
    case 'trap':
    case 'spellbook':
      break;
  }
}
