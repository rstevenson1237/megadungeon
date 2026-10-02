// The people who stand in the dungeon and do not fight (Spec 04, Spec 07; task 2.11): captives to free, traders who
// sell, and hermits who offer four services. Traders and hermits are paid from carried coins, since the bank cannot be
// reached here, and are priced with the multiplier of the nearest village above (Spec 07).

import type { LogMessage } from '../../core/log.ts';
import { createRng, hash32 } from '../../core/rng.ts';
import { chooseTemplate, type Fact } from '../../core/templates.ts';
import { type Knowledge, describeItem, identify, isIdentified, liftAllCurses } from '../../rules/items/magic.ts';
import { addToPack, packSize } from '../../rules/items/inventory.ts';
import { traderPrice } from '../../rules/items/prices.ts';
import { type Item, EQUIP_SLOTS } from '../../rules/items/types.ts';
import { type HermitService, hermitPrice } from '../../rules/villages/economy.ts';
import { villageMultiplier } from '../../rules/items/prices.ts';
import { traderStock } from '../../rules/villages/stock.ts';
import { removeStatus } from '../../rules/magic/status.ts';
import type { Npc } from '../../rules/world/level.ts';
import type { Game } from '../game.ts';
import { addJournal } from './lore.ts';
import { depthOf, facingFirst } from './common.ts';

const say = (text: string, kind: LogMessage['kind'] = 'system'): LogMessage => ({ kind, text });

/** What a trader or hermit's prices rest on: the villages below the surface above this level, and the facts a hermit's rumour may state. */
export interface TownContext {
  villagesAbove: number;
  facts: () => Fact[];
}

/** The number in `level.npcs` of the person standing on a cell who can still be dealt with, or -1. Bandits and rivals are creatures. */
export function npcIndexAt(game: Game, x: number, y: number): number {
  const { npcs } = game.state.map.level;
  return npcs.findIndex((n, i) => n.x === x && n.y === y && (n.kind === 'trader' || n.kind === 'hermit' || n.kind === 'captive') && !game.state.used.npcs[i]?.freed);
}

const npcState = (game: Game, index: number) => (game.state.used.npcs[index] ??= {});

/** Free a captive, who then follows the player (Spec 04). */
export function freeCaptive(game: Game, index: number, messages: LogMessage[]): void {
  const npc = game.state.map.level.npcs[index]!;
  npcState(game, index).freed = true;
  const escort = { name: npc.name, dice: 2, ...(npc.quest ? { quest: npc.quest } : {}), ...(npc.service ? { service: npc.service as 'smith' | 'appraiser' | 'trader' } : {}) };
  game.state.player.town.escorts.push(escort);
  messages.push(say(`You cut ${npc.name} free. They will follow you to safety.`, 'discovery'));
}

/**
 * E beside a person (Spec 01, "NPC talk"): the shell opens their menu, which costs nothing: buy from a trader, a
 * hermit's services, or free a captive (which costs a round, see `freeCaptive`). Returns false, or undefined when no
 * one stands next to the player.
 */
export function useNpc(game: Game, messages: LogMessage[]): boolean | undefined {
  for (const p of facingFirst(game)) {
    const index = npcIndexAt(game, p.x, p.y);
    if (index < 0) continue;
    game.pending.npc = index;
    return false;
  }
  return undefined;
}

// --- Traders ---

/** What a trader still has to sell: their rolled stock less what the player has bought (kept in the level delta). */
export function traderItems(game: Game, index: number): Item[] {
  const npc = game.state.map.level.npcs[index]!;
  const bought = npcState(game, index).bought ?? [];
  return traderStock(game.items, game.runSeed, depthOf(game), npc.x, npc.y).filter((_, i) => !bought.includes(i));
}

/** A trader's price: 150% of value (Spec 05) with the multiplier of the nearest village above (Spec 07). */
export const traderPriceOf = (game: Game, item: Item): number => Math.ceil(traderPrice(item) * villageMultiplier(game.above.villagesAbove));

/** Buy one thing from a trader with carried coins. Traders never buy (Spec 07). */
export function buyFromTrader(game: Game, index: number, which: number): LogMessage[] {
  const { player } = game.state;
  const npc = game.state.map.level.npcs[index]!;
  const full = traderStock(game.items, game.runSeed, depthOf(game), npc.x, npc.y);
  const bought = npcState(game, index).bought ?? [];
  const item = full[which];
  if (!item || bought.includes(which)) return [say('The trader does not have that.')];
  const price = traderPriceOf(game, item);
  if (player.coins < price) return [say(`${price} gp is more than the ${player.coins} gp you carry.`)];
  const trial = { coins: player.coins - price, pack: structuredClone(player.pack) };
  const want = 'count' in item ? item.count : 1;
  if (addToPack(trial, packSize(player), structuredClone(item)) < want) return [say('Your pack is full.')];
  player.coins -= price;
  addToPack(player, packSize(player), item);
  (npcState(game, index).bought ??= []).push(which);
  const k: Knowledge = { known: player.known, disguises: game.disguises };
  return [say(`You buy ${describeItem(item, k)} for ${price} gp.`, 'loot')];
}

/** The numbers of a trader's stock still for sale, with the stock itself, in order. */
export function traderOffer(game: Game, index: number): { which: number; item: Item; price: number }[] {
  const npc = game.state.map.level.npcs[index]!;
  const bought = npcState(game, index).bought ?? [];
  return traderStock(game.items, game.runSeed, depthOf(game), npc.x, npc.y)
    .map((item, which) => ({ which, item, price: traderPriceOf(game, item) }))
    .filter((o) => !bought.includes(o.which));
}

// --- Hermits ---

/** Each service once per visit to the level (Spec 07): the hermit's own record, kept while the level is played. */
const used = new WeakMap<Game, Map<number, Set<HermitService>>>();
function usedBy(game: Game, index: number): Set<HermitService> {
  let all = used.get(game);
  if (!all) used.set(game, (all = new Map()));
  let set = all.get(index);
  if (!set) all.set(index, (set = new Set()));
  return set;
}

export interface HermitOffer {
  service: HermitService;
  label: string;
  price: number;
  /** Used already this visit. */
  spent: boolean;
}

const LABELS: Record<HermitService, string> = { identify: 'Identify one item', restore: 'Restore one Combat die', curse: 'Lift a curse', rumour: 'Hear a rumour of nearby levels' };

export function hermitOffers(game: Game, index: number): HermitOffer[] {
  const done = usedBy(game, index);
  return (Object.keys(LABELS) as HermitService[]).map((service) => ({ service, label: LABELS[service], price: hermitPrice(service, game.above.villagesAbove), spent: done.has(service) }));
}

/** Everything the player carries or wears that is not yet known for what it is. */
export function unknownItems(game: Game): Item[] {
  const { player } = game.state;
  return [...player.pack, ...EQUIP_SLOTS.map((s) => player.equipment[s])].filter((i): i is Item => i !== undefined && !isIdentified(i, player.known));
}

/** Use one of a hermit's services, paid from carried coins. `item` is what to identify. */
export function useHermit(game: Game, index: number, service: HermitService, item?: Item): LogMessage[] {
  const { player } = game.state;
  const offer = hermitOffers(game, index).find((o) => o.service === service)!;
  if (offer.spent) return [say('The hermit has done that for you once already.')];
  if (player.coins < offer.price) return [say(`${offer.price} gp is more than the ${player.coins} gp you carry.`)];
  const messages: LogMessage[] = [];
  const k: Knowledge = { known: player.known, disguises: game.disguises };
  switch (service) {
    case 'identify':
      if (!item || !unknownItems(game).includes(item)) return [say('There is nothing to identify.')];
      identify(item, player.known);
      messages.push(say(`The hermit squints at it. "${describeItem(item, k)}."${'cursed' in item && item.cursed ? ' It is cursed.' : ''}`, 'discovery'));
      break;
    case 'restore':
      if (player.pools.combat.dice >= player.pools.combat.max) return [say('You are unhurt.')];
      player.pools.combat.dice++;
      messages.push(say('The hermit binds your wounds. One Combat die returns.', 'discovery'));
      break;
    case 'curse': {
      const lifted = liftAllCurses(player.equipment, player.pack);
      const had = player.statuses.some((s) => s.id === 'cursed');
      if (lifted === 0 && !had) return [say('The hermit finds no curse on you.')];
      removeStatus(player.statuses, 'cursed');
      messages.push(say('The hermit mutters, and the curse lifts.', 'discovery'));
      break;
    }
    case 'rumour': {
      const rng = createRng(hash32('hermit-rumour', game.runSeed >>> 0, depthOf(game), index));
      const choice = chooseTemplate(game.content.rumours, game.above.facts(), rng);
      if (!choice) return [say('The hermit has nothing to tell you.')];
      const level = choice.fact?.values.level;
      addJournal(player, { depth: typeof level === 'number' ? level : depthOf(game), kind: 'rumour', id: `${choice.key}@hermit${depthOf(game)}.${index}`, text: choice.text });
      messages.push(say(`"${choice.text}"`, 'discovery'));
      break;
    }
  }
  player.coins -= offer.price;
  usedBy(game, index).add(service);
  messages.unshift(say(`You pay ${offer.price} gp.`));
  return messages;
}
