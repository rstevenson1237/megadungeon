// Interacting with a level (Spec 06, "E"): what underfoot and beside the player answers to E, and what a step
// onto a cell sets off. The pieces are in the files beside this one.

import type { LogMessage } from '../../core/log.ts';
import type { Game } from '../game.ts';
import { TERRAIN_BLOCKED, refreshSight } from '../map-state.ts';
import { cellOf, facingFirst, featureIndexAt, trapAt } from './common.ts';
import { interactContainer } from './containers.ts';
import { drink, liftLid, pullLever, stepOnRune, useAltar, useTeleporter } from './fixtures.ts';
import { disarm, onStep } from './hidden.ts';
import { interactLockedDoor, lockedDoorAt } from './locks.ts';
import { markAt, readMark } from './lore.ts';

export * from './common.ts';
export { contentsOf, isOpened, listLines, takeFromContainer } from './containers.ts';
export { drink, liftLid, offer, offeringCost, revealMap, useAltar } from './fixtures.ts';
export { hiddenNear, negative, onStep, passiveNotice, search, triggerTrap, trapDice, type CheckKind } from './hidden.ts';
export { chestLocked, doorAt, interactLockedDoor, lockedDoorAt, walkIntoLocked } from './locks.ts';
export { addJournal, journalByLevel, markAt, readLoreBook } from './lore.ts';
export { noiseAt, placeCreature, pickRow, summon, teleportPlayer, wanderer } from './spawn.ts';

/** Close an open door beside the player (Spec 06: closing is an interact action). A forced door stays open. Returns the spent flag, or undefined if there was none. */
function closeDoorAt(game: Game, x: number, y: number, messages: LogMessage[]): boolean | undefined {
  const { map, used } = game.state;
  const cell = y * map.level.width + x;
  if (!map.openDoors.includes(cell)) return undefined;
  if (used.broken.includes(cell)) {
    messages.push({ kind: 'system', text: 'The door is broken and will not close.' });
    return false;
  }
  if (game.monsterAt(x, y)) {
    messages.push({ kind: 'system', text: 'Something is in the doorway.' });
    return false;
  }
  map.openDoors.splice(map.openDoors.indexOf(cell), 1);
  map.terrain[cell] = TERRAIN_BLOCKED;
  refreshSight(map);
  return true;
}

/**
 * E (Spec 06, task 2.10): what is underfoot (a teleporter), then the four cells around, the facing one first: a locked
 * door, an open door to close, a container or fixture, a lever, a found trap to disarm, a wall mark to read. Returns
 * whether a round was spent, or undefined when nothing answers.
 */
export function interact(game: Game, messages: LogMessage[]): boolean | undefined {
  const { map } = game.state;
  const under = map.level.specials.find((s) => s.kind === 'teleporter' && s.x === map.player.x && s.y === map.player.y);
  if (under?.kind === 'teleporter') {
    useTeleporter(game, under.to, messages);
    return true;
  }
  for (const p of facingFirst(game)) {
    const door = lockedDoorAt(game, p.x, p.y);
    if (door) return interactLockedDoor(game, door, messages);
    const closed = closeDoorAt(game, p.x, p.y, messages);
    if (closed !== undefined) return closed;
    const index = featureIndexAt(game, p.x, p.y);
    if (index >= 0) {
      const f = map.level.features[index]!;
      if (f.type === 'container') return interactContainer(game, index, messages);
      if (f.type === 'fixture' && f.kind === 'fountain') return drink(game, index, messages);
      if (f.type === 'fixture' && f.kind === 'altar') return useAltar(game, index, messages);
      if (f.type === 'fixture' && f.kind === 'sarcophagus') return liftLid(game, index, messages);
    }
    const lever = map.level.specials.find((s) => s.kind === 'lever' && s.x === p.x && s.y === p.y);
    if (lever?.kind === 'lever') return pullLever(game, lever, messages);
    if (trapAt(game, p.x, p.y) && game.state.revealed.includes(cellOf(game, p))) {
      disarm(game, { kind: 'floor', at: p }, messages);
      return true;
    }
    const mark = markAt(game, p.x, p.y);
    if (mark >= 0) return readMark(game, mark, messages);
  }
  return undefined;
}

/** The player's step ends on a cell: a hidden trap is met, a rune is read, and what lies beside is noticed (Spec 06). */
export function stepEnds(game: Game, messages: LogMessage[]): void {
  onStep(game, messages);
  if (!game.state.player.dead && game.pending.fall !== true) stepOnRune(game, messages);
}
