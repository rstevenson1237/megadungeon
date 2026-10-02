// What the player's things do in the game (Spec 05, and the clarifications of task 2.9): picking things up,
// wielding and wearing, dropping, using potions, wands and boots, throwing a dagger, and what the equipment
// does to rolls. The rules (slots, prices, magic, gear numbers) are in rules/items; this layer applies them.

import type { LogMessage } from '../core/log.ts';
import { createRng, hash32, type Rng } from '../core/rng.ts';
import { pickWeighted } from '../core/roller.ts';
import type { Spell } from '../core/schemas.ts';
import { playerRanged } from '../rules/combat/attacks.ts';
import { breaks, makeGear, rollQuality, type Derived } from '../rules/items/gear.ts';
import { addCoins, addToPack, ammoCount, equip as equipRule, equipped, spendAmmo, takeFromPack, unequip as unequipRule } from '../rules/items/inventory.ts';
import {
  type Knowledge,
  describeItem,
  displayName,
  isIdentified,
  liftAllCurses,
  makeArtifact,
  makeMagicItem,
  revealByUse,
} from '../rules/items/magic.ts';
import type { EquipSlot, GearItem, Item } from '../rules/items/types.ts';
import { applyStatus, removeStatus } from '../rules/magic/status.ts';
import type { Loot, Point } from '../rules/world/level.ts';
import { combatAt, damage, extraDice, markExtra, nameOf, provoke, removeDie } from './combat.ts';
import type { Game, PlayerState } from './game.ts';
import { type MinorEffects, bindWielded, derivedFor, hasMajor, joinFight, knownIds, packSizeOf } from './abilities.ts';
import { mapLevel } from './features/fixtures.ts';
import { type Aim, castSpell, spellAimError } from './magic.ts';
import { TERRAIN_OPEN } from './map-state.ts';
import type { Monster } from './monsters.ts';

export { derivedFor };

/** What the player's equipment, abilities and lasting buffs give now (Spec 05; Spec 08, Addendum A). */
export const derived = (game: Game): Derived => derivedFor(game.state.player, game.content.minors);

/** What the player knows of their items: kinds found out by use, and this run's disguises. */
export function knowledge(game: Game): Knowledge {
  return { known: knownIds(game.state.player, game.items.magic.values()), disguises: game.disguises };
}

/**
 * What the item actions need that does not depend on a level: the player, what they know, and the spells (a
 * wand names one). A village has no level, so equipping and inspecting work from this alone.
 */
export interface ItemCtx {
  player: PlayerState;
  knowledge: Knowledge;
  spells: ReadonlyMap<string, Spell>;
  /** Each minor ability's effect, for the pack's size, Mana Well and Weapon Master (Spec 08, Addendum A). */
  minors: MinorEffects;
}

export const ctxOf = (game: Game): ItemCtx => ({ player: game.state.player, knowledge: knowledge(game), spells: game.spells, minors: game.content.minors });

export const itemName = (ctx: ItemCtx, item: Item): string => displayName(item, ctx.knowledge);

// --- Ranged attacks ---

/** What F would fire: the readied ranged weapon, or a dagger to throw. */
export interface RangedOption {
  name: string;
  range: number;
  /** Shots left; for a thrown dagger, the daggers carried. */
  ammo: number;
  thrown: boolean;
  /** Why it cannot fire right now, if it cannot. */
  problem?: string;
}

const THROW_RANGE = 4;

/** A dagger the player can throw: a spare in the pack first, else the one wielded (Spec 05, task 2.9). */
export function throwableDagger(game: Game): { item: GearItem; from: 'pack' | EquipSlot } | undefined {
  const { pack, equipment } = game.state.player;
  const spare = pack.find((i): i is GearItem => i.kind === 'weapon' && i.traits.includes('throwable'));
  if (spare) return { item: spare, from: 'pack' };
  const wielded = equipment.main;
  if (wielded?.kind === 'weapon' && wielded.traits.includes('throwable') && !wielded.cursed) return { item: wielded, from: 'main' };
  return undefined;
}

/** The readied ranged weapon, if there is one. */
const readied = (game: Game): GearItem | undefined => {
  const weapon = game.state.player.equipment.ranged;
  return weapon?.kind === 'ranged' ? weapon : undefined;
};

export function rangedOption(game: Game): RangedOption | undefined {
  const { player } = game.state;
  const weapon = readied(game);
  if (weapon) {
    const shots = ammoCount(player.pack, weapon.ammo!);
    const problem = weapon.broken
      ? `Your ${weapon.name.toLowerCase()} is broken.`
      : shots <= 0
        ? `Your ${weapon.name.toLowerCase()} is out of ammunition.`
        : weapon.traits.includes('reload') && player.reload > 0
          ? `Your ${weapon.name.toLowerCase()} is not yet loaded.`
          : undefined;
    return { name: weapon.name, range: weapon.range!, ammo: shots, thrown: false, ...(problem ? { problem } : {}) };
  }
  const dagger = throwableDagger(game);
  if (!dagger) return undefined;
  return { name: dagger.item.name, range: THROW_RANGE, ammo: player.pack.filter((i) => i.kind === 'weapon' && i.traits.includes('throwable')).length + (dagger.from === 'main' ? 1 : 0), thrown: true };
}

/** The player fires the readied ranged weapon, or throws a dagger, at a creature (Spec 04, Spec 05). Costs ammunition, not a round. */
export function fireRanged(game: Game, target: Monster, messages: LogMessage[]): void {
  const { player } = game.state;
  const option = rangedOption(game)!;
  const result = playerRanged(game.rng, player.pools.skill, adjacentToPlayer(game, target), derived(game).rangedMode === 'disadvantage');
  shotTaken(game, [target]);
  const weapon = readied(game);
  if (option.thrown) {
    const dagger = throwableDagger(game)!;
    if (dagger.from === 'pack') player.pack.splice(player.pack.indexOf(dagger.item), 1);
    else delete player.equipment.main;
    if (result.success) {
      damage(game, target, messages, 'player');
      extraDice(game, target, messages, [...hexBreaker(game, target), ...markExtra(game, target)]);
    } else messages.push({ kind: 'combat', text: `Your throw misses ${nameOf(target)}.` });
    land(game, dagger.item, target, messages);
  } else {
    spendAmmo(player.pack, weapon!.ammo!);
    if (weapon!.traits.includes('reload')) player.reload = 2; // loaded again after the next round
    if (result.success) shotHits(game, weapon!, target, messages);
    else messages.push({ kind: 'combat', text: `Your shot misses ${nameOf(target)}.` });
  }
  if (result.dieLost) messages.push({ kind: 'combat', text: 'You lose a Skill die.' });
}

/**
 * Volley (Spec 03, Addendum A): one Skill roll as a ranged attack resolves a shot at each target, one shot of
 * ammunition each. The roll has disadvantage when either target is adjacent. A hit on each is a hit as `fireRanged`
 * makes it. Needs a readied ranged weapon that can fire (not a thrown dagger), which the caller has checked.
 */
export function fireVolley(game: Game, targets: readonly Monster[], messages: LogMessage[]): void {
  const { player } = game.state;
  const weapon = readied(game)!;
  const adjacent = targets.some((t) => adjacentToPlayer(game, t));
  const result = playerRanged(game.rng, player.pools.skill, adjacent, derived(game).rangedMode === 'disadvantage');
  shotTaken(game, targets);
  for (const _ of targets) spendAmmo(player.pack, weapon.ammo!);
  if (weapon.traits.includes('reload')) player.reload = 2;
  messages.push({ kind: 'combat', text: `You loose a volley at ${targets.map(nameOf).join(' and ')}.` });
  for (const target of targets) {
    if (!result.success) messages.push({ kind: 'combat', text: `Your shot misses ${nameOf(target)}.` });
    else if (game.state.monsters.includes(target)) shotHits(game, weapon, target, messages);
  }
  if (result.dieLost) messages.push({ kind: 'combat', text: 'You lose a Skill die.' });
}

const adjacentToPlayer = (game: Game, target: Monster): boolean => {
  const at = game.state.map.player;
  return Math.max(Math.abs(target.x - at.x), Math.abs(target.y - at.y)) <= 1;
};

/** A shot is an exchange involving the player (Spec 03, Addendum A): each target is provoked, and the fight is heard. */
function shotTaken(game: Game, targets: readonly Monster[]): void {
  joinFight(game.state.player, game.state.round);
  for (const t of targets) provoke(game, t);
  for (const t of targets) combatAt(game, t, targets);
}

/** A shot from the readied weapon hits: a die, a second for a crossbow bolt (Spec 05), the extras that add, and the weapon's break roll. */
function shotHits(game: Game, weapon: GearItem, target: Monster, messages: LogMessage[]): void {
  damage(game, target, messages, 'player');
  if (weapon.traits.includes('heavy') && game.state.monsters.includes(target)) removeDie(game, target, messages, { hit: `The bolt tears into ${nameOf(target)}.`, kill: `The bolt kills ${nameOf(target)}.` }, true);
  extraDice(game, target, messages, [...hexBreaker(game, target), ...markExtra(game, target)]);
  weaponHit(game, weapon, messages);
}

/** Hex Breaker (Spec 03, Addendum A): a ranged hit on a creature with the caster behaviour removes one more die. */
const hexBreaker = (game: Game, target: Monster): string[] => (hasMajor(game.state.player, 'hex_breaker') && target.behaviour === 'caster' ? ['Hex Breaker'] : []);

/** A thrown dagger lands on the target's cell or a free cell beside it, where it can be picked up. */
function land(game: Game, dagger: GearItem, target: Monster, messages: LogMessage[]): void {
  const { map } = game.state;
  const spots: Point[] = [{ x: target.x, y: target.y }];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = target.x + dx;
      const y = target.y + dy;
      if ((dx || dy) && x >= 0 && y >= 0 && x < map.level.width && y < map.level.height && map.terrain[y * map.level.width + x] === TERRAIN_OPEN) spots.push({ x, y });
    }
  }
  const rng = createRng(hash32('land', game.runSeed >>> 0, map.level.depth, dagger.uid, game.state.round));
  const at = rng.pick(spots);
  addToDrops(game, at, [{ kind: 'item', item: dagger }]);
  messages.push({ kind: 'system', text: `Your ${dagger.name.toLowerCase()} lands nearby.` });
}

/** Weapons roll to break when they hit (Spec 05, task 2.9). */
export function weaponHit(game: Game, weapon: GearItem, messages: LogMessage[]): void {
  if (weapon.broken || !breaks(game.rng, weapon.quality)) return;
  weapon.broken = true;
  messages.push({ kind: 'warning', text: `Your ${weapon.name.toLowerCase()} breaks!` });
}

/** Armour and shields roll to break when the wearer is hit (Spec 05, task 2.9). */
export function wearerHit(game: Game, messages: LogMessage[]): void {
  const { body, off } = game.state.player.equipment;
  for (const piece of [body, off]) {
    if (!piece || (piece.kind !== 'armour' && piece.kind !== 'shield') || piece.broken || !breaks(game.rng, piece.quality)) continue;
    piece.broken = true;
    messages.push({ kind: 'warning', text: `Your ${piece.name.toLowerCase()} breaks!` });
  }
}

// --- Piles and pickup ---

/** Put loot on the floor at a cell, joining a pile already there. */
export function addToDrops(game: Game, at: Point, contents: Loot[]): void {
  const { drops } = game.state;
  const pile = drops.find((p) => p.x === at.x && p.y === at.y);
  if (pile) pile.contents.push(...contents);
  else drops.push({ x: at.x, y: at.y, contents });
}

/** Turn a piece of loot into the item it becomes when picked up, or undefined for coins (and for a row the tables no longer hold). */
function itemFromLoot(game: Game, loot: Loot, uid: number, rng: Rng): Item | undefined {
  const data = game.items;
  switch (loot.kind) {
    case 'gem':
    case 'jewelry':
      return { kind: loot.kind, uid, id: loot.id, name: loot.name, value: loot.value };
    case 'magic': {
      const row = data.magic.get(loot.id);
      return row ? makeMagicItem(row, uid, rng, data) : undefined;
    }
    case 'book':
      return { kind: 'book', uid, id: loot.id, name: 'book', value: 0 };
    case 'weapon': {
      const bases = [...data.bases.values()].filter((b) => b.type === 'melee' || b.type === 'ranged');
      const base = pickWeighted(bases, rng);
      return base ? makeGear(base, uid, rollQuality(rng)) : undefined;
    }
    case 'key':
      return { kind: 'key', uid, id: 'key', name: 'key', value: 0, count: 1 };
    case 'vault_key':
      return { kind: 'vault_key', uid, id: 'vault_key', name: 'vault key', value: 0, link: loot.link };
    case 'map_fragment':
      return { kind: 'map_fragment', uid, id: 'map_fragment', name: 'map fragment', value: 0, link: loot.link, mappedLevel: loot.mappedLevel };
    case 'quest_item':
      return { kind: 'quest_item', uid, id: loot.id, name: loot.name, value: 0, quest: loot.quest };
    case 'artifact': {
      const row = data.artifacts.get(loot.id);
      return row ? makeArtifact(row, uid) : undefined;
    }
    case 'item':
      return loot.item;
    case 'coins':
    case 'lift_token':
      return undefined;
  }
}

/** The item a piece of loot becomes, with the seed that makes it: fixed by the run, the level, where it lay and its place in the heap. */
function itemAt(game: Game, loot: Loot, index: number, at: Point): Item | undefined {
  const uid = hash32('loot', game.runSeed >>> 0, game.state.map.level.depth, at.x, at.y, index, loot.kind);
  return itemFromLoot(game, loot, uid, createRng(uid));
}

/** What the pick-up list shows for a piece of loot: coins as gold, anything else as it would be named in the pack. */
export function lootLine(game: Game, loot: Loot, index: number, at: Point): string {
  if (loot.kind === 'coins') return `${loot.amount} gp`;
  if (loot.kind === 'lift_token') return "lift keeper's token";
  const item = itemAt(game, loot, index, at);
  return item ? describeItem(item, knowledge(game)) : loot.kind;
}

/**
 * Take one piece of loot into the pack. Returns what is left of it: nothing when it was all taken, the rest of a stack
 * that did not fit, or the whole piece when the pack is full (`full`).
 */
export function takeLoot(game: Game, loot: Loot, index: number, at: Point, messages: LogMessage[]): { left?: Loot; full: boolean } {
  const { player } = game.state;
  const capacity = packSizeOf(player, game.content.minors);
  if (loot.kind === 'lift_token') {
    player.town.liftToken = true;
    messages.push({ kind: 'loot', text: "You take the lift keeper's token. Lift fares are halved from now on." });
    return { full: false };
  }
  if (loot.kind === 'coins') {
    const got = addCoins(player, capacity, loot.amount);
    if (got > 0) messages.push({ kind: 'loot', text: `You pick up ${got} gp.` });
    return got < loot.amount ? { left: { kind: 'coins', amount: loot.amount - got }, full: true } : { full: false };
  }
  const item = itemAt(game, loot, index, at);
  if (!item) return { left: loot, full: false }; // nothing the tables can make of it
  const want = 'count' in item ? item.count : 1;
  const got = addToPack(player, capacity, item);
  if (got > 0) messages.push({ kind: 'loot', text: `You pick up ${describeItem(got === want ? item : ({ ...item, count: got } as Item), knowledge(game))}.` });
  if (got >= want) return { full: false };
  return { left: got === 0 ? loot : { kind: 'item', item: { ...item, count: want - got } as Item }, full: true };
}

/**
 * Pick up what lies on the player's cell (Spec 05; costs a round when anything is taken). Generated piles move
 * into the level's loose piles first, so what is left behind is kept. What does not fit stays on the floor.
 */
export function pickUp(game: Game, messages: LogMessage[]): 'none' | 'full' | 'taken' {
  const { drops, looted, map } = game.state;
  const here = map.player;
  map.level.piles.forEach((p, i) => {
    if (p.x !== here.x || p.y !== here.y || looted.piles.includes(i) || p.contents.length === 0) return;
    looted.piles.push(i);
    addToDrops(game, here, structuredClone(p.contents));
  });
  const pile = drops.find((p) => p.x === here.x && p.y === here.y && p.contents.length > 0);
  if (!pile) {
    messages.push({ kind: 'system', text: 'There is nothing here to pick up.' });
    return 'none';
  }
  const left: Loot[] = [];
  let taken = 0;
  let refused = false;
  pile.contents.forEach((loot, index) => {
    const before = messages.length;
    const result = takeLoot(game, loot, index, here, messages);
    if (messages.length > before) taken++;
    if (result.full) refused = true;
    if (result.left) left.push(result.left);
  });
  pile.contents = left;
  if (left.length === 0) drops.splice(drops.indexOf(pile), 1);
  if (refused) messages.push({ kind: 'warning', text: 'Your pack is full.' });
  return taken > 0 ? 'taken' : refused ? 'full' : 'none';
}

// --- Equipping, dropping and using ---

const VERB: Partial<Record<Item['kind'], string>> = { weapon: 'wield', staff: 'wield', ranged: 'ready', shield: 'carry' };

/** Wield or wear an item from the pack. A cursed item sticks and curses the wearer at once (Spec 05). */
export function equipItem(ctx: ItemCtx, item: Item, messages: LogMessage[]): boolean {
  const { player } = ctx;
  const result = equipRule(player, packSizeOf(player, ctx.minors), item);
  if (!result.ok) {
    messages.push({ kind: 'system', text: result.reason });
    return false;
  }
  messages.push({ kind: 'system', text: `You ${VERB[item.kind] ?? 'put on'} ${itemName(ctx, item)}.` });
  bindWielded(player, item); // a Weapon Master drawn bare-handed takes the first weapon wielded (Spec 03, Addendum A)
  for (const d of result.displaced) messages.push({ kind: 'system', text: `You put away ${itemName(ctx, d)}.` });
  if ('cursed' in item && item.cursed) {
    applyStatus(player.statuses, 'cursed', null);
    messages.push({ kind: 'warning', text: 'A chill runs through you: it is cursed!' });
  }
  return true;
}

/** Take off what is in a slot. */
export function unequipSlot(ctx: ItemCtx, slot: EquipSlot, messages: LogMessage[]): boolean {
  const { player } = ctx;
  const item = player.equipment[slot];
  const result = unequipRule(player, packSizeOf(player, ctx.minors), slot);
  if (!result.ok) {
    messages.push({ kind: 'system', text: result.reason });
    return false;
  }
  messages.push({ kind: 'system', text: `You take off ${itemName(ctx, item!)}.` });
  return true;
}

/** Drop an item from the pack or from a slot, where the player stands. A cursed item that is worn cannot be dropped. */
export function dropItem(game: Game, item: Item, messages: LogMessage[]): boolean {
  const { player, map } = game.state;
  const slot = equipped(player.equipment).find((e) => e.item === item)?.slot;
  if (slot) {
    if ('cursed' in item && item.cursed) {
      messages.push({ kind: 'system', text: `You cannot remove your ${item.name}: it is cursed.` });
      return false;
    }
    delete player.equipment[slot];
  } else if (!takeFromPack(player.pack, item, 'count' in item ? item.count : 1)) {
    messages.push({ kind: 'system', text: 'You are not carrying that.' });
    return false;
  }
  addToDrops(game, map.player, [{ kind: 'item', item }]);
  messages.push({ kind: 'system', text: `You drop ${itemName(ctxOf(game), item)}.` });
  return true;
}

/** Restore dice to a pool of the player's, up to its maximum. */
export function restore(player: PlayerState, pool: 'combat' | 'skill' | 'magic', dice: number): number {
  const p = player.pools[pool];
  const gained = Math.max(0, Math.min(dice, p.max - p.dice));
  p.dice += gained;
  return gained;
}

/** Drink one potion from a stack: its effect, and the kind becomes known for the run (Spec 05). Works anywhere. */
export function drinkPotion(ctx: ItemCtx, item: Extract<Item, { kind: 'potion' }>, messages: LogMessage[]): void {
  const { player } = ctx;
  const say = (text: string, kind: LogMessage['kind'] = 'system'): void => void messages.push({ kind, text });
  const before = itemName(ctx, item);
  const shown = isIdentified(item, ctx.knowledge.known); // an Alchemist sees what it is already (Brew)
  takeFromPack(player.pack, item, 1);
  switch (item.effect) {
    case 'restore_dice':
      // Mana Well: a potion that restores Magic dice restores more (Spec 03, Addendum A).
      say(restore(player, item.pool!, item.dice! + (item.pool === 'magic' ? derivedFor(player, ctx.minors).potionMagic : 0)) > 0 ? `You drink the ${before}. You feel better.` : `You drink the ${before}. Nothing seems to happen.`);
      break;
    case 'grant_status':
      applyStatus(player.statuses, item.status!, item.rounds!);
      say(`You drink the ${before}. You feel ${item.status === 'hasted' ? 'quick' : item.status!}.`);
      break;
    case 'cure_poison':
      say(removeStatus(player.statuses, 'poisoned') ? `You drink the ${before}. The poison leaves you.` : `You drink the ${before}. You were not poisoned.`);
      break;
    case 'invisibility':
      player.invisible = Math.max(player.invisible, item.rounds!);
      say(`You drink the ${before}. You fade from sight.`);
      break;
    case 'remove_curse': {
      const lifted = liftAllCurses(player.equipment, player.pack);
      removeStatus(player.statuses, 'cursed');
      say(lifted > 0 ? `You drink the ${before}. The curse is lifted.` : `You drink the ${before}. Nothing seems to happen.`);
      break;
    }
  }
  if (revealByUse(item, player.known) && !shown) say(`It was a ${item.name}.`, 'discovery');
}

/**
 * Use an item: drink a potion, spend a charge of a wand, rod or wielded staff, or work a worn power. Using a
 * potion, wand, rod or staff reveals its kind for the run (Spec 05). Returns false, with nothing spent, when it
 * cannot be used.
 */
export function useItem(game: Game, item: Item, aim: Aim | undefined, messages: LogMessage[]): boolean {
  const { player, map } = game.state;
  const say = (text: string, kind: LogMessage['kind'] = 'system'): void => void messages.push({ kind, text });
  switch (item.kind) {
    case 'potion':
      drinkPotion(ctxOf(game), item, messages);
      return true;
    case 'wand':
    case 'rod':
    case 'staff': {
      if (item.kind === 'staff' && player.equipment.main !== item) {
        say('You must wield the staff to use it.');
        return false;
      }
      const spell: Spell | undefined = game.spells.get(item.spell);
      if (!spell) {
        say('Nothing happens.');
        return false;
      }
      const problem = spellAimError(game, spell, aim);
      if (problem) {
        say(problem);
        return false;
      }
      if (item.charges <= 0) {
        say('It has no charges left.');
        return false;
      }
      const was = itemName(ctxOf(game), item);
      castSpell(game, spell, aim, messages, { free: true, source: was });
      item.charges--;
      if (revealByUse(item, player.known)) say(`It was a ${item.name}.`, 'discovery');
      if (item.charges <= 0 && item.kind !== 'staff') {
        takeFromPack(player.pack, item);
        say(`The ${item.kind} crumbles to dust.`, 'warning');
      }
      return true;
    }
    case 'clothing': {
      if (!item.power) {
        say('It works on its own while worn.');
        return false;
      }
      if (!equipped(player.equipment).some((e) => e.item === item)) {
        say('You must wear it to use it.');
        return false;
      }
      if (item.power.oncePerLevel && item.usedDepth === map.level.depth) {
        say('Its power is spent until you reach another level.');
        return false;
      }
      applyStatus(player.statuses, item.power.status, item.power.rounds);
      item.usedDepth = map.level.depth;
      say(`You feel the power of your ${itemName(ctxOf(game), item)}.`);
      return true;
    }
    case 'map_fragment': {
      takeFromPack(player.pack, item, 1);
      if (!player.mapped.includes(item.mappedLevel)) player.mapped.push(item.mappedLevel);
      if (item.mappedLevel === map.level.depth) mapLevel(game);
      say(`The torn map shows the layout of level ${item.mappedLevel}.`, 'discovery');
      return true;
    }
    case 'spellbook':
      return false; // read through Game.readBook
    default:
      say('There is nothing to use that for.');
      return false;
  }
}

/** The lines the inspect action shows (free): what it is as far as the player knows, and what it does. */
export function inspectItem(ctx: ItemCtx, item: Item): string[] {
  const k = ctx.knowledge;
  const known = isIdentified(item, k.known);
  const lines = [describeItem(item, k)];
  switch (item.kind) {
    case 'weapon':
    case 'ranged':
    case 'armour':
    case 'shield': {
      lines.push(`${item.quality}${item.broken ? ', broken' : ''}`);
      if (item.kind === 'weapon') lines.push(`Melee ${item.mod >= 0 ? '+' : ''}${item.mod}${item.hands === 2 ? ', two-handed' : ''}`);
      if (item.kind === 'armour' || item.kind === 'shield') lines.push(`Defence ${item.mod >= 0 ? '+' : ''}${item.mod}`);
      if (item.kind === 'ranged') lines.push(`Range ${item.range} cells, ${item.ammo}s`);
      if (item.traits.length > 0) lines.push(`Traits: ${item.traits.join(', ').replace(/_/g, ' ')}`);
      if (known && item.enchant) lines.push(`Enchanted: ${item.cursed ? '-1' : `+${item.enchant.bonus}`}${item.enchant.trait ? `, ${item.enchant.trait}` : ''}`);
      break;
    }
    case 'wand':
    case 'rod':
    case 'staff':
      if (known) lines.push(`Casts ${ctx.spells.get(item.spell)?.name ?? item.spell}, ${item.charges} charges left`);
      break;
    case 'gem':
    case 'jewelry':
      lines.push(item.appraised !== undefined ? `Appraised at ${item.appraised} gp` : `Unappraised, about ${item.value} gp`);
      break;
    default:
      break;
  }
  if (known && 'cursed' in item && item.cursed) lines.push('It is cursed.');
  return lines;
}
