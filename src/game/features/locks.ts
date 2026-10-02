// Doors and locks (Spec 06, "Doors and locks" and the clarifications of task 2.10): a locked door or chest opens with
// a key, with lockpicks or by force, and a sealed vault door only to its own vault key.

import type { LogMessage } from '../../core/log.ts';
import { takeFromPack } from '../../rules/items/inventory.ts';
import type { Item, KeyItem, LockpickItem, VaultKeyItem } from '../../rules/items/types.ts';
import type { Door, Point } from '../../rules/world/level.ts';
import type { Game } from '../game.ts';
import { derived } from '../items.ts';
import { TERRAIN_OPEN, refreshSight } from '../map-state.ts';
import { cellOf, check, seeded, stateOf } from './common.ts';
import { negative } from './hidden.ts';
import { noiseAt } from './spawn.ts';

/** Forcing a lock alerts unaware creatures within this many cells (Spec 06). */
export const FORCE_NOISE = 6;

/** 1 in 4 plain chests is locked (Spec 06, clarifications of task 2.10), fixed by the run seed and the chest. */
export const LOCKED_CHEST_ONE_IN = 4;

const pack = (game: Game): Item[] => game.state.player.pack;
const plainKey = (game: Game): KeyItem | undefined => pack(game).find((i): i is KeyItem => i.kind === 'key');
const picks = (game: Game): LockpickItem | undefined => pack(game).find((i): i is LockpickItem => i.kind === 'lockpicks');

/** The door record at a cell, if there is one. */
export const doorAt = (game: Game, x: number, y: number): Door | undefined => game.state.map.level.doors.find((d) => d.x === x && d.y === y);

/** A door still shut that needs a key, picks or force (locked or sealed). */
export function lockedDoorAt(game: Game, x: number, y: number): Door | undefined {
  const d = doorAt(game, x, y);
  return d && (d.kind === 'locked' || d.kind === 'sealed') && !game.state.map.openDoors.includes(cellOf(game, d)) ? d : undefined;
}

/** The vault a sealed door belongs to: the one whose room it stands beside (Spec 02, "Sealed vaults"). */
function vaultOf(game: Game, door: Point): string | undefined {
  for (const s of game.state.map.level.specials) {
    if (s.kind !== 'vault') continue;
    const r = s.room;
    if (door.x >= r.x - 1 && door.x <= r.x + r.w && door.y >= r.y - 1 && door.y <= r.y + r.h) return s.link;
  }
  return undefined;
}

const vaultKey = (game: Game, link: string | undefined): VaultKeyItem | undefined =>
  link === undefined ? undefined : pack(game).find((i): i is VaultKeyItem => i.kind === 'vault_key' && i.link === link);

/** A door opens: it stays open (Spec 06); a forced one can no longer be closed. */
function openDoor(game: Game, door: Point, forced: boolean): void {
  const { map, used } = game.state;
  const cell = cellOf(game, door);
  if (!map.openDoors.includes(cell)) map.openDoors.push(cell);
  map.terrain[cell] = TERRAIN_OPEN;
  if (forced && !used.broken.includes(cell)) used.broken.push(cell);
  refreshSight(map);
}

// --- The three ways ---

/** Pick the lock: a Skill check; 4 or more opens, 2 to 3 fails, 1 breaks a pick (Spec 06). */
function pick(game: Game, messages: LogMessage[]): boolean {
  const roll = check(game, 'skill', derived(game).lockpick);
  if (roll.success) {
    messages.push({ kind: 'discovery', text: 'The lock clicks open.' });
    return true;
  }
  const set = picks(game)!;
  if (roll.negative) {
    takeFromPack(pack(game), set, 1);
    messages.push({ kind: 'warning', text: 'A lockpick snaps in the lock.' });
    negative(game, 'pick_lock', messages);
  } else messages.push({ kind: 'system', text: 'The lock holds.' });
  return false;
}

/** Force it: a Combat check with the Combat die; every attempt makes noise (Spec 06). */
function force(game: Game, at: Point, messages: LogMessage[]): boolean {
  const roll = check(game, 'combat');
  noiseAt(game, game.state.map.player, FORCE_NOISE);
  if (roll.success) {
    messages.push({ kind: 'discovery', text: 'With a crack, it gives way.' });
    return true;
  }
  messages.push({ kind: 'system', text: 'You heave, and it holds.' });
  if (roll.negative) negative(game, 'force_lock', messages);
  return false;
}

/** A plain key is used up in the lock (Spec 02, "Keys"). */
function useKey(game: Game, messages: LogMessage[]): void {
  takeFromPack(pack(game), plainKey(game)!, 1);
  messages.push({ kind: 'discovery', text: 'Your key turns, and breaks in the lock.' });
}

/**
 * Moving into a locked door (Spec 06): a key opens it and is used up; without one the door is locked and no round is spent. A
 * sealed door needs its own vault key. Returns true when the door opened (the caller ends the round).
 */
export function walkIntoLocked(game: Game, door: Door, messages: LogMessage[]): boolean {
  if (door.kind === 'sealed') {
    const key = vaultKey(game, vaultOf(game, door));
    if (!key) {
      messages.push({ kind: 'system', text: 'The door is sealed. Only its own key will open it.' });
      return false;
    }
    takeFromPack(pack(game), key, 1);
    messages.push({ kind: 'discovery', text: 'The vault key turns, and the seal breaks.' });
    openDoor(game, door, false);
    return true;
  }
  if (!plainKey(game)) {
    messages.push({ kind: 'system', text: 'The door is locked.' });
    return false;
  }
  useKey(game, messages);
  openDoor(game, door, false);
  return true;
}

/**
 * E at a locked door (Spec 06, task 2.10): lockpicks if carried, else a key, else force. A sealed door says so.
 * Returns whether a round was spent.
 */
export function interactLockedDoor(game: Game, door: Door, messages: LogMessage[]): boolean {
  if (door.kind === 'sealed') {
    if (vaultKey(game, vaultOf(game, door))) return walkIntoLocked(game, door, messages);
    messages.push({ kind: 'system', text: 'The door is sealed: it cannot be picked or forced, and only its own key opens it.' });
    return false;
  }
  if (picks(game)) {
    if (pick(game, messages)) openDoor(game, door, false);
    return true;
  }
  if (plainKey(game)) {
    useKey(game, messages);
    openDoor(game, door, false);
    return true;
  }
  if (force(game, door, messages)) openDoor(game, door, true);
  return true;
}

/** Whether a chest is locked: 1 in 4 plain chests, not the vault, cache or stash ones (Spec 06, task 2.10). */
export function chestLocked(game: Game, index: number): boolean {
  const f = game.state.map.level.features[index];
  if (f?.type !== 'container' || f.kind !== 'chest' || f.link !== undefined) return false;
  return !stateOf(game, index).unlocked && seeded(game, 'lock', index) % LOCKED_CHEST_ONE_IN === 0;
}

/** E at a locked chest: picks, else a key, else force, as for a door. Returns whether it opened, and that a round was spent. */
export function interactLockedChest(game: Game, index: number, messages: LogMessage[]): boolean {
  const f = game.state.map.level.features[index]!;
  let opened: boolean;
  if (picks(game)) opened = pick(game, messages);
  else if (plainKey(game)) {
    useKey(game, messages);
    opened = true;
  } else opened = force(game, f, messages);
  if (opened) stateOf(game, index).unlocked = true;
  return opened;
}
