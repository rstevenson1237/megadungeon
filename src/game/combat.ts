// What happens in the game when attacks land (Spec 04): dice lost, deaths and drops, theft, and who
// a fight wakes. The rolls themselves are rules (rules/combat); this layer applies their results.

import type { LogMessage } from '../core/log.ts';
import { alertedByCombat } from '../rules/combat/awareness.ts';
import { theftTake } from '../rules/items/treasure.ts';
import { hasStatus, removeStatus } from '../rules/magic/status.ts';
import { THEFTS_BEFORE_FLEEING, monsterMelee, playerMelee } from '../rules/combat/attacks.ts';
import { distanceSq } from '../rules/world/geometry.ts';
import { MAX_DEPTH, type Loot } from '../rules/world/level.ts';
import type { Game } from './game.ts';
import { derivedFor, wearerHit, weaponHit } from './items.ts';
import type { Monster } from './monsters.ts';
import { failQuest } from './town-state.ts';

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
  const { monsters, drops, player } = game.state;
  monsters.splice(monsters.indexOf(m), 1);
  if (m.kind === 'monster') player.stats.kills++;
  // The final boss on level 100 is the last achievement (Spec 09, task 2.13).
  if (m.role === 'boss' && game.state.map.level.depth === MAX_DEPTH) player.stats.finalBoss = true;
  // An opponent's death meets its quest's goal, to be paid on the next arrival in a village (Spec 07, task 2.11).
  if (m.quest && !player.town.goals.includes(m.quest)) player.town.goals.push(m.quest);
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
  if (player.pools.combat.dice <= 0) {
    player.dead = true;
    player.deathCause = say.kill;
    messages.push({ kind: 'combat', text: say.kill });
    return false;
  }
  player.pools.combat.dice--;
  messages.push({ kind: 'combat', text: say.hit });
  wearerHit(game, messages); // armour and shield roll to break when the wearer is hit (Spec 05)
  return true;
}

/**
 * With a freed captive following, one blow in three meant for the player falls on them instead (Spec 04 says only
 * that a captive follows; Spec 07 that one who dies fails its quest: clarifications of task 2.11). Two blows kill.
 */
function escortTakesHit(game: Game, m: Monster, messages: LogMessage[]): boolean {
  const { town, journal } = game.state.player;
  if (town.escorts.length === 0 || !game.rng.oneIn(3)) return false;
  const escort = town.escorts[0]!;
  escort.dice--;
  if (escort.dice > 0) {
    messages.push({ kind: 'combat', text: `${Name(m)} strikes ${escort.name} instead of you.` });
    return true;
  }
  town.escorts.splice(0, 1);
  messages.push({ kind: 'warning', text: `${Name(m)} kills ${escort.name}.` });
  if (escort.quest && failQuest(town, journal, escort.quest)) messages.push({ kind: 'warning', text: 'The quest has failed.' });
  return true;
}

/** A creature's hit on the player removes one Combat die; a hit with none left is fatal (Spec 03). */
export const hitPlayer = (game: Game, m: Monster, messages: LogMessage[], verb = 'hits'): boolean =>
  escortTakesHit(game, m, messages) ? false : hurtPlayer(game, messages, { hit: `${Name(m)} ${verb} you.`, kill: `${Name(m)} kills you.` });

/**
 * A bandit's hit also steals 10% of the carried treasure, coins first and then the cheapest pieces (Spec 04, Spec 05);
 * the second theft sends it running. A theft that finds no treasure takes nothing and does not count.
 */
function steal(game: Game, bandit: Monster, messages: LogMessage[]): void {
  const { player } = game.state;
  const take = theftTake(player.coins, player.pack);
  if (take.coins === 0 && take.pieces.length === 0) return;
  const loot: Loot[] = [];
  if (take.coins > 0) {
    player.coins -= take.coins;
    loot.push({ kind: 'coins', amount: take.coins });
    messages.push({ kind: 'loot', text: `${Name(bandit)} steals ${take.coins} gp.` });
  }
  for (const piece of take.pieces) {
    player.pack.splice(player.pack.indexOf(piece), 1);
    loot.push({ kind: 'item', item: piece });
    messages.push({ kind: 'loot', text: `${Name(bandit)} steals your ${piece.name}.` });
  }
  addLoot(bandit.carried, loot);
  bandit.thefts++;
  if (bandit.thefts >= THEFTS_BEFORE_FLEEING) {
    bandit.fleeing = true;
    bandit.fleeLost = 0;
    messages.push({ kind: 'combat', text: `${Name(bandit)} turns to flee.` });
  }
}

/** The player's melee attack on a creature: one exchange (Spec 04, Attacks), with the weapon's modifier (Spec 05). */
export function playerAttacks(game: Game, m: Monster, messages: LogMessage[], reach = false): void {
  const { player } = game.state;
  const d = derivedFor(player);
  const exchange = playerMelee(game.rng, { step: player.pools.combat.step, dice: player.pools.combat.dice }, { modifier: m.modifier, unaware: m.awareness !== 'alert', asleep: hasStatus(m.statuses, 'asleep') }, d.melee);
  provoke(game, m);
  combatAt(game, m, [m]);
  if (exchange.defenderHit) {
    damage(game, m, messages, 'player');
    const alive = game.state.monsters.includes(m);
    // A mace stuns when the hit wins by 3 or more (Spec 05).
    if (alive && d.weaponTraits.includes('stun') && exchange.attacker - exchange.defender >= 3) {
      m.stunned = true;
      messages.push({ kind: 'combat', text: `${Name(m)} is stunned.` });
    }
    // A flame blade burns the undead for a second die (Spec 05).
    if (alive && d.weaponTraits.includes('flame') && m.undead) {
      removeDie(game, m, messages, { hit: `The flame sears ${nameOf(m)}.`, kill: `The flame consumes ${nameOf(m)}.` }, true);
    }
    const weapon = player.equipment.main;
    if (weapon?.kind === 'weapon') weaponHit(game, weapon, messages);
  }
  // A spear's reach cannot be answered from 2 cells away (Spec 05, task 2.9).
  if (exchange.attackerHit && !reach) hitPlayer(game, m, messages);
}

/** A creature's melee attack on the player: one exchange. An ambusher's first has advantage. The player's armour adds to the defence die. */
export function monsterAttacks(game: Game, m: Monster, messages: LogMessage[]): void {
  const { player } = game.state;
  const defence = derivedFor(player).defence;
  const exchange = monsterMelee(game.rng, m, { step: player.pools.combat.step, dice: player.pools.combat.dice }, hasStatus(player.statuses, 'asleep'), defence);
  m.ambush = false;
  combatAt(game, game.state.map.player, [m]);
  if (exchange.defenderHit && hitPlayer(game, m, messages) && m.kind === 'bandit') steal(game, m, messages);
  if (exchange.attackerHit) damage(game, m, messages, 'player');
}
