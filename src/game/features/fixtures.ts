// Fixtures and specials (Spec 06, "Fixtures", and Spec 02, "Connective elements", with the clarifications of
// task 2.10): fountains, altars and their offerings, sarcophagi, floor runes, and the teleporter, the lever and
// the rune-word altar.

import type { LogMessage } from '../../core/log.ts';
import { eligibleEntries, pickWeighted } from '../../core/roller.ts';
import { addCoins, takeFromPack } from '../../rules/items/inventory.ts';
import { effectOf, identify, isIdentified, liftAllCurses } from '../../rules/items/magic.ts';
import { hasMajor, packSizeOf } from '../abilities.ts';
import type { Item } from '../../rules/items/types.ts';
import { applyBound, applyStatus, removeStatus } from '../../rules/magic/status.ts';
import { treasureBudget } from '../../rules/world/depth.ts';
import type { Loot, Special } from '../../rules/world/level.ts';
import type { Game } from '../game.ts';
import { addToDrops, restore } from '../items.ts';
import { check, depthOf, featureIndexAt, seeded, stateOf } from './common.ts';
import { negative } from './hidden.ts';
import { summon } from './spawn.ts';

/** The gold an altar asks: 10 gp times the level's depth (Spec 06). */
export const offeringCost = (game: Game): number => 10 * depthOf(game);

/** Reveal the whole layout of the level: every cell becomes explored. */
export function revealMap(game: Game): void {
  game.state.map.exploration.explored.fill(1);
}

/** A map fragment's map (Spec 02): the layout, with its secret doors and its vault, found. */
export function mapLevel(game: Game): void {
  revealMap(game);
  const { level } = game.state.map;
  for (const d of level.doors) {
    const cell = d.y * level.width + d.x;
    if (d.kind === 'secret' && !game.state.revealed.includes(cell)) game.state.revealed.push(cell);
  }
}

// --- Fountains ---

/** A fountain gives 1 to 3 drinks (Spec 06), fixed by the run, the level and the fountain. */
export const fountainDrinks = (game: Game, index: number): number => 1 + (seeded(game, 'fountain', index) % 3);

/** E at a fountain: drink, and roll the table (Spec 06). A dry one gives nothing and costs nothing. Returns whether a round was spent. */
export function drink(game: Game, index: number, messages: LogMessage[]): boolean {
  const state = stateOf(game, index);
  const limit = (state.limit ??= fountainDrinks(game, index));
  if ((state.drinks ?? 0) >= limit) {
    messages.push({ kind: 'system', text: 'The fountain is dry.' });
    return false;
  }
  state.drinks = (state.drinks ?? 0) + 1;
  const { player, map } = game.state;
  const row = pickWeighted(eligibleEntries(game.content.fountains, { depth: depthOf(game) }), game.rng);
  const f = map.level.features[index]!;
  const say = (text: string, kind: LogMessage['kind'] = 'system'): void => void messages.push({ kind, text });
  switch (row?.effect) {
    case 'restore_dice':
      say(restore(player, row.pool!, row.dice!) > 0 ? 'The water is cool and clean. You feel restored.' : 'The water is cool and clean.');
      break;
    case 'cure_poison':
      say(removeStatus(player.statuses, 'poisoned') ? 'The water washes the poison from your blood.' : 'The water is cool and clean.');
      break;
    case 'reveal_map':
      revealMap(game);
      say('Pictures swim in the water, and you see the shape of the whole level.', 'discovery');
      break;
    case 'coins': {
      const [lo, hi] = row.amount!;
      const amount = game.rng.int(lo, hi) * Math.max(1, depthOf(game));
      const got = addCoins(player, packSizeOf(player, game.content.minors), amount);
      say(`Coins glint in the basin: ${amount} gp.`, 'loot');
      if (got < amount) addToDrops(game, map.player, [{ kind: 'coins', amount: amount - got }]);
      break;
    }
    case 'poison':
      applyStatus(player.statuses, 'poisoned', null);
      say('The water is foul. You are poisoned!', 'warning');
      break;
    case 'water_creature':
      summon(game, f, messages, ['aquatic']);
      break;
    default:
      say('The water is still, and nothing happens.');
  }
  if (state.drinks >= limit) say('The fountain runs dry.');
  return true;
}

// --- Altars ---

/** An altar's blessing for a good offering (Spec 06): Blessed for the level, a curse lifted, or an item identified. */
function bless(game: Game, god: { id: string; name: string } | undefined, messages: LogMessage[]): void {
  const { player } = game.state;
  const row = god ? game.content.gods.get(god.id) : undefined;
  const say = (text: string, kind: LogMessage['kind'] = 'discovery'): void => void messages.push({ kind, text });
  switch (row?.blessing ?? 'bless') {
    case 'bless':
      applyBound(player.statuses, 'blessed');
      say(`${god?.name ?? 'The altar'} blesses you until you leave this level.`);
      break;
    case 'lift_curse': {
      const lifted = liftAllCurses(player.equipment, player.pack);
      removeStatus(player.statuses, 'cursed');
      say(lifted > 0 ? `${god?.name ?? 'The altar'} lifts the curse from you.` : `${god?.name ?? 'The altar'} finds no curse to lift.`);
      break;
    }
    case 'identify': {
      const unknown = [...Object.values(player.equipment), ...player.pack].filter((i): i is Item => i !== undefined && !isIdentified(i, player.known));
      if (unknown.length === 0) {
        say(`${god?.name ?? 'The altar'} has nothing of yours to reveal.`);
        break;
      }
      const item = game.rng.pick(unknown);
      identify(item, player.known);
      say(`${god?.name ?? 'The altar'} shows you what you carry: ${item.name}.`);
      break;
    }
  }
}

/** E at an altar (Spec 06): ask the shell for an offering. A rune altar speaks the word instead. Returns whether a round was spent. */
export function useAltar(game: Game, index: number, messages: LogMessage[]): boolean {
  const f = game.state.map.level.features[index]!;
  const rune = game.state.map.level.specials.find((s) => s.kind === 'rune_altar' && s.x === f.x && s.y === f.y);
  if (rune?.kind === 'rune_altar') return speakWord(game, index, rune, messages);
  if (stateOf(game, index).done) {
    messages.push({ kind: 'system', text: 'The altar is silent. It has had its offering.' });
    return false;
  }
  game.pending.offer = index;
  return false;
}

/**
 * Make the offering at an altar (Spec 06): gold (10 gp times the depth) or one item from the pack, then a Magic
 * check. 4 or more: the god's blessing; 2 to 3: nothing; 1: Cursed until lifted. One offering per altar, and a
 * shrine altar's success counts toward its set. Returns whether a round was spent.
 */
export function offer(game: Game, index: number, what: 'gold' | Item, messages: LogMessage[]): boolean {
  const { player, map } = game.state;
  const f = map.level.features[index];
  const state = stateOf(game, index);
  if (f?.type !== 'fixture' || f.kind !== 'altar' || state.done) return false;
  if (what === 'gold') {
    if (player.coins < offeringCost(game)) {
      messages.push({ kind: 'system', text: `The altar asks ${offeringCost(game)} gp, and you do not have it.` });
      return false;
    }
    player.coins -= offeringCost(game);
    messages.push({ kind: 'loot', text: `You lay ${offeringCost(game)} gp on the altar.` });
  } else {
    if (!takeFromPack(player.pack, what, 1)) {
      messages.push({ kind: 'system', text: 'You are not carrying that.' });
      return false;
    }
    messages.push({ kind: 'loot', text: `You lay ${what.name} on the altar.` });
  }
  state.done = true;
  const roll = check(game, 'magic');
  if (roll.success) {
    bless(game, f.god, messages);
    if (f.link !== undefined) shrineWon(game, f.link, f.god, messages);
  } else if (roll.negative) negative(game, 'altar', messages);
  else messages.push({ kind: 'system', text: 'The altar does not answer.' });
  return true;
}

/** Three altars of one god won grants its lasting buff (Spec 06). */
function shrineWon(game: Game, link: string, god: { id: string; name: string } | undefined, messages: LogMessage[]): void {
  const { player } = game.state;
  player.shrines[link] = (player.shrines[link] ?? 0) + 1;
  if (player.shrines[link] !== 3) return;
  const buff = god ? game.content.gods.get(god.id)?.buff : undefined;
  if (!buff) return;
  player.buffs.push(effectOf(buff)); // an effect from the vocabulary (Spec 08, Addendum A)
  messages.push({ kind: 'discovery', text: `The third altar answers, and ${god!.name} grants you a lasting gift.` });
}

// --- Sarcophagi ---

/** The treasure of a sarcophagus (Spec 06): jewelry three times in four, else a gem, from the tiered table by depth, and one time in five a magic item. */
function sarcophagusTreasure(game: Game): Loot[] {
  const depth = depthOf(game);
  const budget = Math.ceil(treasureBudget(depth) * 0.1);
  const kind = game.rng.int(1, 4) <= 3 ? 'jewelry' : 'gem';
  const rows = eligibleEntries(game.content.gems, { depth }).filter((g) => g.kind === kind);
  const loot: Loot[] = [];
  const fits = rows.filter((g) => g.value <= budget);
  const row = fits.length > 0 ? pickWeighted(fits, game.rng) : rows.slice().sort((a, b) => a.value - b.value)[0];
  if (row) loot.push({ kind: row.kind, id: row.id, name: row.name, value: row.value });
  else loot.push({ kind: 'coins', amount: budget });
  if (game.rng.oneIn(5)) {
    const item = pickWeighted(eligibleEntries([...game.items.magic.values()], { depth }), game.rng);
    if (item) loot.push({ kind: 'magic', id: item.id, name: item.name });
  }
  return loot;
}

/**
 * E at a sarcophagus (Spec 06): a Combat check to lift the lid. 4 or more opens it, and one time in three an
 * undead rises; 2 to 3 the lid holds; a 1 crushes it down on the player. Once open it stays open. Returns whether a round was spent.
 */
export function liftLid(game: Game, index: number, messages: LogMessage[]): boolean {
  const state = stateOf(game, index);
  if (state.done) {
    if (state.left && state.left.length > 0) game.pending.opened = index;
    else messages.push({ kind: 'system', text: 'The sarcophagus is open and empty.' });
    return false;
  }
  const roll = check(game, 'combat');
  if (roll.negative) {
    negative(game, 'sarcophagus', messages);
    return true;
  }
  if (!roll.success) {
    messages.push({ kind: 'system', text: 'The lid will not budge.' });
    return true;
  }
  state.done = true;
  state.left = sarcophagusTreasure(game);
  messages.push({ kind: 'discovery', text: 'With a grinding groan, the lid slides aside.' });
  if (game.rng.oneIn(3)) {
    summon(game, game.state.map.level.features[index]!, messages, ['undead']);
  }
  game.pending.opened = index;
  return true;
}

// --- Runes ---

/** A floor rune is read by stepping on it (Spec 06): a Magic check. 4 or more gives a ward, a 1 discharges; either spends it. */
export function stepOnRune(game: Game, messages: LogMessage[]): void {
  const { map, player } = game.state;
  const index = featureIndexAt(game, map.player.x, map.player.y);
  const f = index >= 0 ? map.level.features[index] : undefined;
  if (f?.type !== 'fixture' || f.kind !== 'rune') return;
  const state = stateOf(game, index);
  if (state.done) return;
  const roll = check(game, 'magic');
  if (roll.success) {
    state.done = true;
    player.shield = Math.max(player.shield, 20);
    messages.push({ kind: 'discovery', text: 'The rune flares, and a ward settles over you.' });
  } else if (roll.negative && !hasMajor(player, 'hex_breaker')) {
    state.done = true;
    negative(game, 'rune', messages);
  } else messages.push({ kind: 'system', text: 'The rune glows faintly, then dims.' }); // for a Hex Breaker a 1 simply fails (Spec 06, Addendum A)
}

// --- Specials: teleporter, lever, rune altar ---

type Lever = Extract<Special, { kind: 'lever' }>;
type RuneAltar = Extract<Special, { kind: 'rune_altar' }>;

/** E on a teleporter takes the player to the paired level (Spec 02): the run carries it out. */
export function useTeleporter(game: Game, to: number, messages: LogMessage[]): void {
  game.pending.teleport = to;
  messages.push({ kind: 'discovery', text: 'The teleporter hums, and the world folds.' });
}

/** E at the lever of a collapsed passage (Spec 02): pulled once, it opens the shortcut stair. Returns whether a round was spent. */
export function pullLever(game: Game, lever: Lever, messages: LogMessage[]): boolean {
  if (game.state.used.lever) {
    messages.push({ kind: 'system', text: 'The lever is already down.' });
    return false;
  }
  game.state.used.lever = true;
  messages.push({ kind: 'discovery', text: `The lever grinds down. Far off, a stair opens toward level ${lever.landingLevel}.` });
  return true;
}

/**
 * E at the altar of a rune word (Spec 02): once every letter is known the word is spoken, and the player is Blessed
 * until they leave the level. Returns whether a round was spent.
 */
function speakWord(game: Game, index: number, altar: RuneAltar, messages: LogMessage[]): boolean {
  const state = stateOf(game, index);
  const letters = game.state.player.letters[altar.link] ?? {};
  const known = Array.from(altar.word).every((c, i) => letters[i] === c);
  if (state.done) {
    messages.push({ kind: 'system', text: 'The altar is quiet: the word has been spoken.' });
    return false;
  }
  if (!known) {
    messages.push({ kind: 'system', text: 'Letters are cut into the altar, and you know too few of them to speak the word.' });
    return false;
  }
  state.done = true;
  applyBound(game.state.player.statuses, 'blessed');
  messages.push({ kind: 'discovery', text: `You speak "${altar.word}". The altar answers, and you are blessed until you leave this level.` });
  return true;
}
