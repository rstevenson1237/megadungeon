// Containers (Spec 06, "Containers" and the clarifications of task 2.10): opening a chest, sack or rack, the
// pick-up list, locks and traps on them, and smashing pottery.

import type { LogMessage } from '../../core/log.ts';
import type { Loot } from '../../rules/world/level.ts';
import type { Game } from '../game.ts';
import { lootLine, addToDrops, takeLoot } from '../items.ts';
import { refreshTerrain } from '../map-state.ts';
import { cellOf, check, hasContainerTrap, isContainer, stateOf } from './common.ts';
import { derived } from '../items.ts';
import { disarm, triggerTrap } from './hidden.ts';
import { chestLocked, interactLockedChest } from './locks.ts';
import { noiseAt, summon } from './spawn.ts';

/** Smashing pottery alerts unaware creatures within this many cells (Spec 06). */
export const POTTERY_NOISE = 4;
/** 1 time in 8 pottery releases vermin (Spec 06, task 2.10). */
export const POTTERY_VERMIN_ONE_IN = 8;

/** What a container holds now: what is left once it is opened, else what it was made with; nothing once looted. */
export function contentsOf(game: Game, index: number): Loot[] {
  const f = game.state.map.level.features[index];
  if (game.state.looted.features.includes(index)) return [];
  const left = stateOf(game, index).left;
  if (left) return left;
  return isContainer(f) ? f.contents : [];
}

/** Whether the pick-up list for a container or sarcophagus has been opened (so it holds a copy). */
export const isOpened = (game: Game, index: number): boolean => stateOf(game, index).left !== undefined;

/** Open the list: copy the contents so what is taken is kept, and ask the shell to show it. */
function showList(game: Game, index: number): void {
  const state = stateOf(game, index);
  if (!state.left) {
    const f = game.state.map.level.features[index];
    state.left = isContainer(f) ? structuredClone(f.contents) : [];
  }
  game.pending.opened = index;
}

/**
 * E at a chest, sack or weapon rack (Spec 06): a locked chest is picked, keyed or forced first; a found trap is
 * disarmed first; a hidden one springs. Returns whether a round was spent. A container already opened just shows
 * its list again, for free.
 */
export function interactContainer(game: Game, index: number, messages: LogMessage[]): boolean {
  const f = game.state.map.level.features[index]!;
  if (!isContainer(f)) return false;
  if (game.state.looted.features.includes(index) || (isOpened(game, index) && contentsOf(game, index).length === 0)) {
    messages.push({ kind: 'system', text: 'It is empty.' });
    return false;
  }
  if (isOpened(game, index)) {
    game.pending.opened = index;
    return false;
  }
  if (f.kind === 'pottery') {
    smash(game, index, messages);
    return true;
  }
  if (chestLocked(game, index) && !interactLockedChest(game, index, messages)) return true;
  if (hasContainerTrap(game, index)) {
    if (game.state.revealed.includes(cellOf(game, f))) {
      disarm(game, { kind: 'container', index }, messages);
      return true;
    }
    // Quick Hands: a Skill check, where only a 1 springs it; otherwise the trap is found, not sprung (Spec 03, Addendum A).
    if (derived(game).carefulOpening && !check(game, 'skill').negative) {
      game.state.revealed.push(cellOf(game, f));
      messages.push({ kind: 'discovery', text: `Your quick hands find a trap on the ${f.kind} before it springs.` });
      return true;
    }
    const row = game.content.traps.get(f.trap!);
    stateOf(game, index).trapGone = true;
    if (row) triggerTrap(game, row, f, messages);
    if (game.state.player.dead || game.pending.fall) return true;
  }
  messages.push({ kind: 'discovery', text: `You open the ${f.kind}.` });
  showList(game, index);
  return true;
}

/** Take from an opened container's list (free): one piece by its place, or everything that fits. Returns what was taken. */
export function takeFromContainer(game: Game, index: number, which: number | 'all', messages: LogMessage[]): boolean {
  const f = game.state.map.level.features[index]!;
  const state = stateOf(game, index);
  if (!state.left) return false;
  const left: Loot[] = [];
  let taken = false;
  let full = false;
  state.left.forEach((loot, i) => {
    if (which !== 'all' && which !== i) {
      left.push(loot);
      return;
    }
    const before = messages.length;
    const result = takeLoot(game, loot, i, f, messages);
    if (messages.length > before) taken = true;
    if (result.full) full = true;
    if (result.left) left.push(result.left);
  });
  state.left = left;
  if (left.length === 0 && !game.state.looted.features.includes(index)) game.state.looted.features.push(index);
  if (full) messages.push({ kind: 'warning', text: 'Your pack is full.' });
  return taken;
}

/** The lines of the pick-up list. */
export const listLines = (game: Game, index: number): string[] => {
  const f = game.state.map.level.features[index]!;
  return contentsOf(game, index).map((loot, i) => lootLine(game, loot, i, f));
};

/**
 * Smash a pot (Spec 06): its contents spill on its cell, the noise alerts unaware creatures within 4 cells, and
 * now and then something runs out. The cell can then be walked over.
 */
function smash(game: Game, index: number, messages: LogMessage[]): void {
  const { map, looted } = game.state;
  const f = game.state.map.level.features[index]!;
  const contents = contentsOf(game, index);
  messages.push({ kind: 'system', text: 'You smash the pot.' });
  if (contents.length > 0) {
    addToDrops(game, f, structuredClone(contents));
    messages.push({ kind: 'loot', text: 'Something spills out.' });
  } else messages.push({ kind: 'system', text: 'It is empty.' });
  stateOf(game, index).left = [];
  if (!looted.features.includes(index)) looted.features.push(index);
  map.cleared.push(cellOf(game, f));
  refreshTerrain(map);
  noiseAt(game, f, POTTERY_NOISE);
  if (game.rng.oneIn(POTTERY_VERMIN_ONE_IN)) summon(game, f, messages, ['vermin'], true);
}
