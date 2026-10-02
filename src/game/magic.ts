// What casting a spell does to the level (Spec 04, "Spells", "Starting spell list" and the clarifications of
// task 2.8). The roll and the table are rules (rules/magic); this layer applies each effect to creatures,
// the player and the map. Effects are named by the spell table and defined here.

import type { LogMessage } from '../core/log.ts';
import type { Spell } from '../core/schemas.ts';
import { spellMode } from '../rules/items/gear.ts';
import { derivedFor } from './items.ts';
import { castRoll, reachOf, resolvesAtOnce } from '../rules/magic/spells.ts';
import { type StatusId, STATUS_NAMES, applyStatus } from '../rules/magic/status.ts';
import { distanceSq, squareFootprint } from '../rules/world/geometry.ts';
import type { Point } from '../rules/world/level.ts';
import { Name, combatAt, hurtPlayer, nameOf, provoke, removeDie, seen } from './combat.ts';
import type { Game } from './game.ts';
import { TERRAIN_BLOCKED, isOpen } from './map-state.ts';
import type { Monster } from './monsters.ts';
import { type TargetSpec, validTargets } from './targeting.ts';

/** What a spell is aimed at: a creature, or for Blink a cell. */
export type Aim = Monster | Point;

const isMonster = (aim: Aim | undefined): aim is Monster => aim !== undefined && 'dice' in aim;

/** The targeting a spell needs: its reach, and the footprint of an area aimed at a creature (Spec 01). */
export const targetSpecOf = (spell: Spell): TargetSpec => ({
  range: reachOf(spell),
  shape: spell.shape === 'area' && spell.size ? { kind: 'area', size: spell.size } : { kind: 'single' },
});

/** A creature Sleep cannot touch: one that is naturally asleep, as the spell needs an unaware or alert one. */
const asleepAlready = (spell: Spell, m: Monster): boolean => spell.status === 'asleep' && m.awareness === 'asleep';

/** The creatures a targeted spell can be aimed at: visible, in reach, with a clear line (Spec 01, Targeting). */
export const spellTargets = (game: Game, spell: Spell): Monster[] => validTargets(game, reachOf(spell), (m) => !asleepAlready(spell, m));

/** The cells Blink can go to: visible, within reach, open floor and free of creatures. */
export function blinkCells(game: Game, spell: Spell): Point[] {
  const { map } = game.state;
  const { width } = map.level;
  const reach = reachOf(spell);
  const cells: Point[] = [];
  for (let y = map.player.y - reach; y <= map.player.y + reach; y++) {
    for (let x = map.player.x - reach; x <= map.player.x + reach; x++) {
      if (canBlinkTo(game, spell, { x, y }) && map.visible[y * width + x] === 1) cells.push({ x, y });
    }
  }
  return cells;
}

/** True when the cell is a place Blink can land: visible, within reach, open and empty, and not where the caster stands. */
export function canBlinkTo(game: Game, spell: Spell, at: Point): boolean {
  const { map } = game.state;
  const { width, height } = map.level;
  if (at.x < 0 || at.y < 0 || at.x >= width || at.y >= height) return false;
  if (map.visible[at.y * width + at.x] !== 1 || !isOpen(map, at.x, at.y)) return false;
  if (game.monsterAt(at.x, at.y) || (at.x === map.player.x && at.y === map.player.y)) return false;
  return distanceSq(map.player, at) <= reachOf(spell) ** 2;
}

/** Why a spell cannot be cast at this aim, or undefined when it can. */
export function spellAimError(game: Game, spell: Spell, aim: Aim | undefined): string | undefined {
  if (spell.effect === 'blink') return aim && !isMonster(aim) && canBlinkTo(game, spell, aim) ? undefined : 'You cannot blink there.';
  if (resolvesAtOnce(spell)) return undefined;
  return isMonster(aim) && spellTargets(game, spell).includes(aim) ? undefined : 'That is not a valid target.';
}

/** How a spell is cast when it is not the player's own: from a wand, rod or staff, with no roll and no failure (Spec 05). */
export interface CastOptions {
  free?: boolean;
  /** What the spell comes from, for the log ("the ash wand"). */
  source?: string;
}

/**
 * Cast: the spell roll, then the effect on a success. The caller has checked the aim and ends the round. A free
 * cast (from a charge) skips the roll. Plate armour gives spell rolls disadvantage and a staff of the spell's
 * shape advantage (Spec 05).
 */
export function castSpell(game: Game, spell: Spell, aim: Aim | undefined, messages: LogMessage[], options: CastOptions = {}): void {
  const { player } = game.state;
  const at = isMonster(aim) ? ` at ${nameOf(aim)}` : '';
  if (options.free) {
    messages.push({ kind: 'combat', text: `You use ${options.source ?? 'it'}${at}: ${spell.name}.` });
    apply(game, spell, aim, messages);
    return;
  }
  // The Mage's major ability: Arcane Bolt loses no die on a 2 to 3 (Spec 03).
  const lossFree = spell.id === 'arcane_bolt' && player.abilities.includes('arcane_bolt');
  const roll = castRoll(game.rng, player.pools.magic, lossFree, spellMode(derivedFor(player), spell.shape));
  messages.push({ kind: 'combat', text: `You cast ${spell.name}${at}.` });
  if (roll.success) apply(game, spell, aim, messages);
  else messages.push({ kind: 'warning', text: 'The spell fizzles.' });
  if (roll.dieLost) messages.push({ kind: 'warning', text: 'You lose a Magic die.' });
}

function apply(game: Game, spell: Spell, aim: Aim | undefined, messages: LogMessage[]): void {
  switch (spell.effect) {
    case 'restore_die':
      return void heal(game, messages, 'You feel your strength return.');
    case 'shield':
      game.state.player.shield = rounds(game, spell) ?? 1;
      return void messages.push({ kind: 'system', text: 'A shimmering ward surrounds you.' });
    case 'light':
      return light(game, spell, messages);
    case 'detect':
      return detect(game, spell, messages);
    case 'blink': {
      const to = aim as Point;
      game.state.map.player = { x: to.x, y: to.y };
      game.refreshSight();
      return void messages.push({ kind: 'discovery', text: 'You blink across the room.' });
    }
    case 'status':
      return spell.shape === 'self' ? selfStatus(game, spell, messages) : statusOnVictims(game, spell, aim, messages);
    case 'remove_die':
      return removeDice(game, spell, aim, messages);
    case 'drain':
      return drain(game, spell, aim as Monster, messages);
    case 'push':
      return push(game, spell, messages);
  }
}

/** A spell's duration: its number, or one d6 rolled for the whole spell; null for none. */
const rounds = (game: Game, spell: Spell): number | null => (spell.rounds === 'd6' ? game.rng.int(1, 6) : spell.rounds ?? null);

/** Restore one Combat die to the player, up to the pool's maximum. Says something only when one came back. */
function heal(game: Game, messages: LogMessage[], text: string): boolean {
  const { player } = game.state;
  if (player.pools.combat.dice >= player.pools.combat.max) return false;
  player.pools.combat.dice++;
  messages.push({ kind: 'system', text });
  return true;
}

// --- Who a spell reaches ---

/** The creatures in a spell's area, or the one it is aimed at. */
function victimsOf(game: Game, spell: Spell, aim: Aim | undefined): Monster[] {
  const { monsters, map } = game.state;
  if (spell.shape === 'target') return isMonster(aim) ? [aim] : [];
  if (spell.centred) {
    const reach = reachOf(spell);
    // Adjacent means the eight cells around the caster; a longer reach is a circle (Spec 04, task 2.8).
    const within = (m: Monster): boolean => (reach <= 1 ? Math.max(Math.abs(m.x - map.player.x), Math.abs(m.y - map.player.y)) <= 1 : distanceSq(m, map.player) <= reach * reach);
    return monsters.filter((m) => within(m) && affects(spell, m));
  }
  const cells = footprint(spell, aim);
  return monsters.filter((m) => cells.some((c) => c.x === m.x && c.y === m.y));
}

const affects = (spell: Spell, m: Monster): boolean => !spell.affects || spell.affects.every((tag) => tag === 'undead' && m.undead);

/** The cells of a targeted area spell's footprint. */
const footprint = (spell: Spell, aim: Aim | undefined): Point[] => (spell.size && aim ? squareFootprint(aim, spell.size) : []);

/** Whether the player stands in a targeted area's footprint: the caster is hit like anyone else (Spec 04). */
const casterCaught = (game: Game, spell: Spell, aim: Aim | undefined): boolean =>
  spell.shape === 'area' && !spell.centred && footprint(spell, aim).some((c) => c.x === game.state.map.player.x && c.y === game.state.map.player.y);

/** Every offensive spell but Sleep alerts what it hits and counts as combat for noise (Spec 04, task 2.8). */
function provokeAll(game: Game, spell: Spell, victims: Monster[], aim: Aim | undefined): void {
  if (spell.status === 'asleep') return;
  for (const v of victims) provoke(game, v);
  combatAt(game, spell.centred || !aim ? game.state.map.player : aim, victims);
}

// --- Effects ---

function selfStatus(game: Game, spell: Spell, messages: LogMessage[]): void {
  const id = spell.status!;
  applyStatus(game.state.player.statuses, id, rounds(game, spell));
  messages.push({ kind: 'system', text: id === 'hasted' ? 'You move with sudden speed.' : `You are ${STATUS_NAMES[id].toLowerCase()}.` });
}

/** What a status does to a creature, in the third person and to the player (second person). */
const VERB: Partial<Record<StatusId, [string, string]>> = {
  asleep: ['falls asleep', 'fall asleep'],
  held: ['is held fast', 'are held fast'],
  frightened: ['flees in terror', 'flee in terror'],
  slowed: ['is slowed', 'are slowed'],
};
const verb = (id: StatusId, you: boolean): string => VERB[id]?.[you ? 1 : 0] ?? `${you ? 'are' : 'is'} ${STATUS_NAMES[id].toLowerCase()}`;

function statusOnVictims(game: Game, spell: Spell, aim: Aim | undefined, messages: LogMessage[]): void {
  const id = spell.status!;
  const victims = victimsOf(game, spell, aim);
  const length = rounds(game, spell);
  const source = { ...game.state.map.player };
  provokeAll(game, spell, victims, aim);
  for (const v of victims) {
    // Fear does not move what never flees; Turn Undead names the undead and so does (Spec 04, task 2.8).
    if (id === 'frightened' && v.fearless && !spell.affects) {
      if (seen(game, v)) messages.push({ kind: 'combat', text: `${Name(v)} is unmoved.` });
      continue;
    }
    applyStatus(v.statuses, id, length, id === 'frightened' ? source : undefined);
    if (seen(game, v)) messages.push({ kind: 'combat', text: `${Name(v)} ${verb(id, false)}.` });
  }
  if (victims.length === 0 && !casterCaught(game, spell, aim)) messages.push({ kind: 'system', text: 'Nothing is affected.' });
  if (casterCaught(game, spell, aim)) {
    applyStatus(game.state.player.statuses, id, length, id === 'frightened' ? source : undefined);
    messages.push({ kind: 'warning', text: `You are caught in it and ${verb(id, true)}.` });
  }
}

function removeDice(game: Game, spell: Spell, aim: Aim | undefined, messages: LogMessage[]): void {
  const victims = victimsOf(game, spell, aim);
  provokeAll(game, spell, victims, aim);
  for (const v of victims) {
    const say = { hit: `Your ${spell.name} hits ${nameOf(v)}.`, kill: `Your ${spell.name} kills ${nameOf(v)}.` };
    removeDie(game, v, messages, say, seen(game, v) || v === aim);
  }
  if (casterCaught(game, spell, aim)) hurtPlayer(game, messages, { hit: `Your ${spell.name} hits you.`, kill: `Your ${spell.name} kills you.` });
}

function drain(game: Game, spell: Spell, target: Monster, messages: LogMessage[]): void {
  provokeAll(game, spell, [target], target);
  removeDie(game, target, messages, { hit: `Your ${spell.name} saps ${nameOf(target)}.`, kill: `Your ${spell.name} kills ${nameOf(target)}.` }, true);
  heal(game, messages, 'Its life flows into you.');
}

const sign = (n: number): number => Math.sign(n);

/** Push every adjacent creature straight away from the caster; one that meets a wall, door, liquid or creature stops (Spec 04, task 2.8). */
function push(game: Game, spell: Spell, messages: LogMessage[]): void {
  const { map } = game.state;
  const victims = victimsOf(game, spell, undefined).sort((a, b) => a.id - b.id);
  provokeAll(game, spell, victims, undefined);
  for (const v of victims) {
    const dx = sign(v.x - map.player.x);
    const dy = sign(v.y - map.player.y);
    for (let i = 0; i < (spell.distance ?? 0); i++) {
      const x = v.x + dx;
      const y = v.y + dy;
      if (!isOpen(map, x, y) || game.monsterAt(x, y) || (map.player.x === x && map.player.y === y)) break;
      v.x = x;
      v.y = y;
    }
    if (seen(game, v)) messages.push({ kind: 'combat', text: `${Name(v)} is thrown back.` });
  }
  if (victims.length === 0) messages.push({ kind: 'system', text: 'Nothing is close enough to be hit.' });
}

/** Light: the room the caster stands in, else everything open and connected within reach, is revealed (marked explored). */
function light(game: Game, spell: Spell, messages: LogMessage[]): void {
  const { map } = game.state;
  const { level, exploration } = map;
  const { width, height } = level;
  let fresh = 0;
  const mark = (x: number, y: number): void => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = y * width + x;
    if (exploration.explored[i]) return;
    exploration.explored[i] = 1;
    fresh++;
  };
  const room = level.rooms.find((r) => map.player.x >= r.x && map.player.x < r.x + r.w && map.player.y >= r.y && map.player.y < r.y + r.h);
  if (room) {
    // The room and the ring of walls and doors around it.
    for (let y = room.y - 1; y <= room.y + room.h; y++) for (let x = room.x - 1; x <= room.x + room.w; x++) mark(x, y);
  } else {
    const reach = reachOf(spell);
    const seenCell = new Uint8Array(width * height);
    const queue: Point[] = [{ ...map.player }];
    seenCell[map.player.y * width + map.player.x] = 1;
    for (let head = 0; head < queue.length; head++) {
      const c = queue[head]!;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) mark(c.x + dx, c.y + dy);
      for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]] as const) {
        const x = c.x + dx;
        const y = c.y + dy;
        if (x < 0 || y < 0 || x >= width || y >= height || seenCell[y * width + x]) continue;
        if (map.terrain[y * width + x] === TERRAIN_BLOCKED || distanceSq(map.player, { x, y }) > reach * reach) continue;
        seenCell[y * width + x] = 1;
        queue.push({ x, y });
      }
    }
  }
  messages.push({ kind: 'discovery', text: fresh > 0 ? (room ? 'Light fills the room.' : 'Light spills along the passage.') : 'Nothing new is revealed.' });
}

/** Detect: every floor trap, container trap and secret door within reach is revealed, with no roll (Spec 06). */
function detect(game: Game, spell: Spell, messages: LogMessage[]): void {
  const { map, revealed } = game.state;
  const { level } = map;
  const reach = reachOf(spell);
  let found = 0;
  const note = (p: Point): void => {
    const i = p.y * level.width + p.x;
    if (distanceSq(map.player, p) > reach * reach || revealed.includes(i)) return;
    revealed.push(i);
    found++;
  };
  for (const t of level.traps) note(t);
  for (const f of level.features) if (f.type === 'container' && f.trap) note(f);
  for (const d of level.doors) if (d.kind === 'secret') note(d);
  messages.push({ kind: 'discovery', text: found > 0 ? `You sense ${found} hidden ${found === 1 ? 'thing' : 'things'} nearby.` : 'You sense nothing hidden nearby.' });
}
