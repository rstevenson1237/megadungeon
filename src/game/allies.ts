// Allies (Spec 04, Addendum A; task 3.8): creatures on the player's side. A raised creature (Raise), the
// Beastmaster's companion (Companion) and the Illusionist's phantom (Decoy). They live in the level's creature list
// with `kind: 'ally'`, so they take turns in the round order like any creature; how they act is in ai.ts.

import type { LogMessage } from '../core/log.ts';
import { bearingFromNorth, distanceSq } from '../rules/world/geometry.ts';
import type { Point } from '../rules/world/level.ts';
import { hasMajor } from './abilities.ts';
import { Name } from './combat.ts';
import type { Game } from './game.ts';
import { isOpen } from './map-state.ts';
import { ALLY_COLOUR, COMPANION_GLYPH, type Monster, PHANTOM_GLYPH, creature } from './monsters.ts';

/** A raised ally stands for 20 rounds, a phantom for 5 (Spec 03, Addendum A). */
export const RAISED_ROUNDS = 20;
export const PHANTOM_ROUNDS = 5;
/** Raise reaches a creature that fell within 8 cells; Decoy a cell within 5. */
export const RAISE_REACH = 8;
export const DECOY_REACH = 5;
/** The character levels at which the companion gains a die, from 1 die at the start (Spec 03, Addendum A). */
export const COMPANION_LEVELS: readonly number[] = [4, 7, 10];

/** The companion's dice at a character level: 1, and one more at each of levels 4, 7 and 10. */
export const companionDice = (level: number): number => 1 + COMPANION_LEVELS.filter((l) => level >= l).length;

/** The ally of a kind standing on this level, if any. */
export const allyOf = (game: Game, kind: Monster['ally']): Monster | undefined => game.state.monsters.find((m) => m.ally === kind);

/** A new creature id on this level. */
const nextId = (game: Game): number => game.state.monsters.reduce((n, m) => Math.max(n, m.id), -1) + 1;

/** An ally with every field at rest: always alert, never fleeing, in no pack, carrying nothing. */
function makeAlly(game: Game, kind: NonNullable<Monster['ally']>, base: Pick<Monster, 'name' | 'glyph' | 'x' | 'y' | 'dice' | 'modifier'> & Partial<Monster>): Monster {
  return creature({ id: nextId(game), colour: ALLY_COLOUR, kind: 'ally', ally: kind, behaviour: 'ally', awareness: 'alert', fearless: true, group: -1, ...base });
}

/** A cell an ally can stand on: open floor, no creature, not the player's cell. */
function freeCell(game: Game, x: number, y: number): boolean {
  const { map } = game.state;
  return isOpen(map, x, y) && !game.monsterAt(x, y) && !(map.player.x === x && map.player.y === y);
}

/**
 * Where the companion arrives: the nearest free cell beside the player, the orthogonal ones first and then clockwise
 * from north; with none free, the nearest free cell of the level.
 */
function companionCell(game: Game): Point | undefined {
  const { map } = game.state;
  const { width, height } = map.level;
  const from = map.player;
  const cells: Point[] = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (freeCell(game, x, y)) cells.push({ x, y });
  cells.sort((a, b) => distanceSq(from, a) - distanceSq(from, b) || bearingFromNorth(from, a) - bearingFromNorth(from, b));
  return cells[0];
}

/**
 * The companion arrives with the player (Spec 04, Addendum A), or is moved beside them after a fall: a Beastmaster's
 * animal ally with the character level's dice less those it has lost. A dead one waits for the next village rest.
 */
export function placeCompanion(game: Game): void {
  const { player, monsters } = game.state;
  const here = allyOf(game, 'companion');
  if (here) monsters.splice(monsters.indexOf(here), 1);
  if (!hasMajor(player, 'companion') || player.companion.dead) return;
  const at = companionCell(game);
  if (!at) return;
  const max = companionDice(player.level);
  monsters.push(makeAlly(game, 'companion', { name: 'your companion', glyph: COMPANION_GLYPH, ...at, dice: Math.max(1, max - player.companion.hurt), modifier: 0, maxDice: max }));
}

/**
 * Raise's creature (Spec 03, Addendum A): the most recent to die within 8 cells and in sight in the last 3 rounds,
 * not a boss. Undefined when there is none.
 */
export function raiseCandidate(game: Game): { creature: Monster; round: number } | undefined {
  const { map, fallen, round } = game.state;
  const { width } = map.level;
  for (let i = fallen.length - 1; i >= 0; i--) {
    const f = fallen[i]!;
    const c = f.creature;
    if (f.round <= round - 3 || c.role === 'boss') continue;
    if (distanceSq(map.player, c) > RAISE_REACH * RAISE_REACH || map.visible[c.y * width + c.x] !== 1) continue;
    return f;
  }
  return undefined;
}

/** Why Raise cannot be used now, or undefined. */
export function raiseProblem(game: Game): string | undefined {
  const f = raiseCandidate(game);
  if (!f) return 'Nothing has fallen near enough to raise.';
  if (game.monsterAt(f.creature.x, f.creature.y)) return 'Something stands where it fell.';
  return undefined;
}

/** Raise the creature: it stands on its cell with its starting dice and modifier for 20 rounds. One raised ally at a time. */
export function raise(game: Game, messages: LogMessage[]): void {
  const f = raiseCandidate(game)!;
  const { fallen, monsters } = game.state;
  fallen.splice(fallen.indexOf(f), 1);
  const old = allyOf(game, 'raised');
  if (old) {
    monsters.splice(monsters.indexOf(old), 1);
    messages.push({ kind: 'system', text: `${Name(old)} crumbles to dust.` });
  }
  const c = f.creature;
  const ally = makeAlly(game, 'raised', {
    name: `the raised ${c.name}`,
    glyph: c.glyph,
    x: c.x,
    y: c.y,
    dice: c.maxDice,
    modifier: c.modifier,
    speed: c.speed,
    undead: c.undead,
    expires: RAISED_ROUNDS,
  });
  monsters.push(ally);
  messages.push({ kind: 'discovery', text: `${Name(ally)} rises to fight beside you.` });
}

/** A cell the phantom can stand on, as for Blink: visible, within 5, open floor, no creature, not the player's cell. */
export function canDecoyAt(game: Game, at: Point): boolean {
  const { map } = game.state;
  const { width, height } = map.level;
  if (at.x < 0 || at.y < 0 || at.x >= width || at.y >= height || map.visible[at.y * width + at.x] !== 1) return false;
  return freeCell(game, at.x, at.y) && distanceSq(map.player, at) <= DECOY_REACH * DECOY_REACH;
}

/** Every cell the phantom can stand on, for the cursor's preview. */
export function decoyCells(game: Game): Point[] {
  const { player } = game.state.map;
  const cells: Point[] = [];
  for (let y = player.y - DECOY_REACH; y <= player.y + DECOY_REACH; y++) for (let x = player.x - DECOY_REACH; x <= player.x + DECOY_REACH; x++) if (canDecoyAt(game, { x, y })) cells.push({ x, y });
  return cells;
}

/** Decoy: a phantom stands on the cell for 5 rounds. One at a time: a new one takes the place of the old. */
export function decoy(game: Game, at: Point, messages: LogMessage[]): void {
  const { monsters } = game.state;
  const old = allyOf(game, 'phantom');
  if (old) monsters.splice(monsters.indexOf(old), 1);
  monsters.push(makeAlly(game, 'phantom', { name: 'the phantom', glyph: PHANTOM_GLYPH, x: at.x, y: at.y, dice: 1, modifier: 0, expires: PHANTOM_ROUNDS }));
  messages.push({ kind: 'discovery', text: 'A phantom of you shimmers into being.' });
}

/** The end of a round: a raised ally loses a round and crumbles at the end of its 20, a phantom vanishes after its 5. */
export function allyRoundEnds(game: Game, messages: LogMessage[]): void {
  const { monsters } = game.state;
  for (const m of monsters.slice()) {
    if (m.expires === undefined || --m.expires > 0) continue;
    monsters.splice(monsters.indexOf(m), 1);
    messages.push({ kind: 'system', text: m.ally === 'phantom' ? 'The phantom fades away.' : `${Name(m)} crumbles to dust.` });
  }
}
