// What happens in the game when attacks land (Spec 04): dice lost, deaths and drops, theft, and who
// a fight wakes. The rolls themselves are rules (rules/combat); this layer applies their results.

import type { LogMessage } from '../core/log.ts';
import { alertedByCombat } from '../rules/combat/awareness.ts';
import { hasStatus, removeStatus } from '../rules/magic/status.ts';
import { THEFTS_BEFORE_FLEEING, monsterMelee, playerMelee, playerRanged, theftAmount } from '../rules/combat/attacks.ts';
import { distanceSq } from '../rules/world/geometry.ts';
import type { Loot } from '../rules/world/level.ts';
import type { Game } from './game.ts';
import type { Monster } from './monsters.ts';

/** How a creature is named in the log: "the goblin", but "Corvin the Bold" for a named one. */
export const nameOf = (m: Monster): string => (m.kind === 'monster' ? `the ${m.name}` : m.name);
export const Name = (m: Monster): string => nameOf(m).replace(/^./, (c) => c.toUpperCase());

/** True when the player can see the creature, so its doings are worth a log line. */
export const seen = (game: Game, m: Monster): boolean => game.state.map.visible[m.y * game.state.map.level.width + m.x] === 1;

/** Gold in a pile of loot, and a short description of the rest. */
function describe(loot: readonly Loot[]): string {
  const coins = loot.reduce((n, l) => n + (l.kind === 'coins' ? l.amount : 0), 0);
  const others = loot.filter((l) => l.kind !== 'coins').length;
  const parts = [coins > 0 ? `${coins} gp` : '', others > 0 ? `${others} other ${others === 1 ? 'item' : 'items'}` : ''].filter(Boolean);
  return parts.join(' and ');
}

/** Add loot to a carried list, merging coins into one entry. */
export function addLoot(into: Loot[], more: readonly Loot[]): void {
  for (const l of more) {
    const coins = l.kind === 'coins' ? into.find((x) => x.kind === 'coins') : undefined;
    if (coins && coins.kind === 'coins' && l.kind === 'coins') coins.amount += l.amount;
    else into.push(structuredClone(l));
  }
}

/** A creature was attacked: it is alert (a rival turns hostile) and so is its pack (Spec 04, Awareness and Rivals). */
export function provoke(game: Game, m: Monster): void {
  if (m.kind === 'rival') m.hostile = true;
  alert(game, m);
}

/** Make a creature alert, and its whole group if it is a pack. */
export function alert(game: Game, m: Monster): void {
  if (m.awareness !== 'alert') {
    m.awareness = 'alert';
    m.lost = 0;
  }
  if (m.behaviour !== 'pack') return;
  for (const other of game.state.monsters) {
    if (other !== m && other.group === m.group && other.behaviour === 'pack' && other.awareness !== 'alert') {
      other.awareness = 'alert';
      other.lost = 0;
    }
  }
}

/** Combat happened at `at`: every other creature close enough is alerted (Spec 04, Awareness). Rivals ignore noise. */
export function combatAt(game: Game, at: { x: number; y: number }, except: readonly Monster[] = []): void {
  for (const m of game.state.monsters) {
    if (m.kind === 'rival' || except.includes(m)) continue;
    if (alertedByCombat(m.awareness, distanceSq(m, at))) alert(game, m);
  }
}

/** What the log says when a creature loses a die and when that kills it. */
export interface DieText {
  hit: string;
  kill: string;
}

/**
 * A creature lost a die: it ends Asleep (a hit wakes it), and at zero it dies and drops what it carries
 * where it stood. `shown` says whether the player is told.
 */
export function removeDie(game: Game, m: Monster, messages: LogMessage[], say: DieText, shown: boolean, wakes = true): void {
  m.dice--;
  if (wakes) removeStatus(m.statuses, 'asleep');
  if (m.dice > 0) {
    if (shown) messages.push({ kind: 'combat', text: say.hit });
    return;
  }
  if (shown) messages.push({ kind: 'combat', text: say.kill });
  const { monsters, drops } = game.state;
  monsters.splice(monsters.indexOf(m), 1);
  if (m.carried.length > 0) {
    drops.push({ x: m.x, y: m.y, contents: m.carried });
    if (shown) messages.push({ kind: 'loot', text: `${Name(m)} drops ${describe(m.carried)}.` });
  }
}

/** A melee hit or ranged hit on a creature, by the player or by another creature. */
export function damage(game: Game, m: Monster, messages: LogMessage[], by: Monster | 'player'): void {
  const you = by === 'player';
  const who = you ? 'You' : Name(by);
  removeDie(game, m, messages, { hit: `${who} ${you ? 'hit' : 'hits'} ${nameOf(m)}.`, kill: `${who} ${you ? 'kill' : 'kills'} ${nameOf(m)}.` }, you || seen(game, m));
}

/**
 * The player is hit: a Shield absorbs it, otherwise one Combat die goes, and a hit with none left is fatal
 * (Spec 03). Taking a hit ends Asleep. True when a die was lost.
 */
export function hurtPlayer(game: Game, messages: LogMessage[], say: DieText): boolean {
  const { player } = game.state;
  if (player.shield > 0) {
    player.shield = 0;
    messages.push({ kind: 'combat', text: 'Your shield absorbs the blow.' });
    return false;
  }
  removeStatus(player.statuses, 'asleep');
  if (player.combatDice <= 0) {
    player.dead = true;
    messages.push({ kind: 'combat', text: say.kill });
    return false;
  }
  player.combatDice--;
  messages.push({ kind: 'combat', text: say.hit });
  return true;
}

/** A creature's hit on the player removes one Combat die; a hit with none left is fatal (Spec 03). */
export const hitPlayer = (game: Game, m: Monster, messages: LogMessage[], verb = 'hits'): boolean =>
  hurtPlayer(game, messages, { hit: `${Name(m)} ${verb} you.`, kill: `${Name(m)} kills you.` });

/** A bandit's hit also steals 10% of the carried gold; the second theft sends it running (Spec 04, task 2.7). */
function steal(game: Game, bandit: Monster, messages: LogMessage[]): void {
  const { player } = game.state;
  const amount = theftAmount(player.coins);
  if (amount === 0) return;
  player.coins -= amount;
  addLoot(bandit.carried, [{ kind: 'coins', amount }]);
  bandit.thefts++;
  messages.push({ kind: 'loot', text: `${Name(bandit)} steals ${amount} gp.` });
  if (bandit.thefts >= THEFTS_BEFORE_FLEEING) {
    bandit.fleeing = true;
    bandit.fleeLost = 0;
    messages.push({ kind: 'combat', text: `${Name(bandit)} turns to flee.` });
  }
}

/** The player's melee attack on a creature: one exchange (Spec 04, Attacks). */
export function playerAttacks(game: Game, m: Monster, messages: LogMessage[]): void {
  const { player } = game.state;
  const exchange = playerMelee(game.rng, { step: player.combatStep, dice: player.combatDice }, { modifier: m.modifier, unaware: m.awareness !== 'alert', asleep: hasStatus(m.statuses, 'asleep') });
  provoke(game, m);
  combatAt(game, m, [m]);
  if (exchange.defenderHit) damage(game, m, messages, 'player');
  if (exchange.attackerHit) hitPlayer(game, m, messages);
}

/** A creature's melee attack on the player: one exchange. An ambusher's first has advantage. */
export function monsterAttacks(game: Game, m: Monster, messages: LogMessage[]): void {
  const { player } = game.state;
  const exchange = monsterMelee(game.rng, m, { step: player.combatStep, dice: player.combatDice }, hasStatus(player.statuses, 'asleep'));
  m.ambush = false;
  combatAt(game, game.state.map.player, [m]);
  if (exchange.defenderHit && hitPlayer(game, m, messages) && m.kind === 'bandit') steal(game, m, messages);
  if (exchange.attackerHit) damage(game, m, messages, 'player');
}

/** The player's ranged attack: one Skill die as a skill use, then one shot of ammunition (Spec 04). */
export function playerFires(game: Game, m: Monster, messages: LogMessage[]): void {
  const { player, map } = game.state;
  const adjacent = Math.max(Math.abs(m.x - map.player.x), Math.abs(m.y - map.player.y)) <= 1;
  const result = playerRanged(game.rng, player.skill, adjacent);
  provoke(game, m);
  combatAt(game, m, [m]);
  if (result.success) damage(game, m, messages, 'player');
  else messages.push({ kind: 'combat', text: `Your shot misses ${nameOf(m)}.` });
  if (result.dieLost) messages.push({ kind: 'combat', text: 'You lose a Skill die.' });
}
