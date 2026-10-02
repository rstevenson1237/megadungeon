// The villages in play (Spec 07, task 2.11): bank, lodging, lift, shop, appraiser, smith and tavern, and what happens
// when the player arrives in one (specialists join, quests are paid). Everything here runs on the run, which holds the
// player, the layout and the tables; the screens in the UI layer only call it. Every method returns what it did as log
// messages and never lets the bank go below zero: a service the balance cannot cover is refused with a message.

import type { LogMessage } from '../core/log.ts';
import { createRng, hash32 } from '../core/rng.ts';
import { eligibleEntries, pickWeighted } from '../core/roller.ts';
import { chooseTemplate, type Fact } from '../core/templates.ts';
import { bankTreasure } from '../rules/character/progression.ts';
import { type Knowledge, describeItem, identify, isIdentified, makeMagicItem } from '../rules/items/magic.ts';
import { addToPack } from '../rules/items/inventory.ts';
import { derivedFor, packSizeOf } from './abilities.ts';
import { buyPrice, identifyPrice, repairPrice, shopPays } from '../rules/items/prices.ts';
import { type Item, type EquipSlot, EQUIP_SLOTS, isCursed } from '../rules/items/types.ts';
import { BOARD_SIZE, LODGING_TURNS, QUEST_ITEM_ONE_IN, QUEST_LIMIT, appraiseAll, depositOf, lodgingPrice, rumourPrice } from '../rules/villages/economy.ts';
import { fareToPay } from '../rules/villages/lift.ts';
import { type Service, SPECIALIST_SERVICE, servicesOf } from '../rules/villages/services.ts';
import { shopStock } from '../rules/villages/stock.ts';
import { type Level } from '../rules/world/level.ts';
import { type Quest, factsServedBy, levelsServedBy } from '../rules/world/run-layout.ts';
import { takeRest } from './game.ts';
import { addJournal } from './features/lore.ts';
import type { Run } from './run.ts';
import { dropQuestEntry, failQuest } from './town-state.ts';

export interface Result {
  ok: boolean;
  messages: LogMessage[];
}

const say = (text: string, kind: LogMessage['kind'] = 'system'): LogMessage => ({ kind, text });
const done = (...messages: LogMessage[]): Result => ({ ok: true, messages });
const refused = (...messages: LogMessage[]): Result => ({ ok: false, messages });

/** A quest as the board shows it. */
export interface QuestOffer {
  quest: Quest;
  text: string;
}

/** A trip the lift offers. */
export interface LiftTrip {
  depth: number;
  name: string;
  fare: number;
}

export class Town {
  private readonly factsCache = new Map<number, Fact[]>();

  constructor(private readonly run: Run) {}

  private get state() {
    return this.run.player.town;
  }

  /** The village the player is in, or the depth asked about. */
  get depth(): number {
    return this.run.depth;
  }

  /** How many villages lie below the surface down to `depth` (0 on the surface): the price multiplier counts these (Spec 07). */
  number(depth = this.run.depth): number {
    return this.run.villages.filter((v) => v > 0 && v <= depth).length;
  }

  /** The name of a village for the lift and quest texts. */
  nameOf(depth: number): string {
    if (depth === 0) return 'the surface village';
    return this.run.layout?.villages.find((v) => v.level === depth)?.name ?? `the village on level ${depth}`;
  }

  services(depth = this.run.depth): Service[] {
    return servicesOf(this.run.runSeed, depth, this.state.joined);
  }

  private knowledge(): Knowledge {
    return { known: this.run.player.known, disguises: this.run.disguises };
  }

  /** Take a payment from the bank; false, with a message, when the balance is short (Spec 07). */
  private pay(price: number, what: string, messages: LogMessage[]): boolean {
    if (this.state.bank < price) {
      messages.push(say(`${what} costs ${price} gp, and the bank holds only ${this.state.bank} gp.`));
      return false;
    }
    this.state.bank -= price;
    return true;
  }

  // --- Bank ---

  /** Bank every carried coin and appraised piece; each gp earns 1 XP (Spec 03, Spec 07). */
  deposit(): Result {
    const { player } = this.run;
    const { gold, pieces, heldBack } = depositOf(player.coins, player.pack);
    const messages: LogMessage[] = [];
    if (gold === 0) {
      messages.push(say(heldBack.length > 0 ? 'Nothing here can be banked yet.' : 'You have nothing to deposit.'));
    } else {
      player.coins = 0;
      for (const piece of pieces) player.pack.splice(player.pack.indexOf(piece), 1);
      this.state.bank += gold;
      bankTreasure(this.run.character, gold);
      messages.push(say(`You deposit ${gold} gp and earn ${gold} XP.`, 'loot'));
    }
    if (heldBack.length > 0) messages.push(say(`${heldBack.length} unappraised ${heldBack.length === 1 ? 'piece is' : 'pieces are'} kept back: visit the appraiser.`));
    return { ok: gold > 0, messages };
  }

  // --- Lodging ---

  /** A bed's price here, less what a `rest_cost` effect takes off (Tithe makes it free; Spec 03, Addendum A). */
  get restPrice(): number {
    return Math.ceil((lodgingPrice(this.number()) * this.derived().restCost) / 100);
  }

  /** What the player's equipment, abilities and buffs give, read in the village. */
  private derived() {
    return derivedFor(this.run.player, this.run.gameContent.minors);
  }

  private packSize(): number {
    return packSizeOf(this.run.player, this.run.gameContent.minors);
  }

  /** Rest: every pool restored, timed effects cleared, 200 turns pass, shop stock refreshes, and the game is saved (Spec 07). */
  rest(): Result {
    const messages: LogMessage[] = [];
    if (!this.pay(this.restPrice, 'A bed', messages)) return refused(...messages);
    takeRest(this.run.player);
    this.run.round += LODGING_TURNS;
    messages.push(say(this.restPrice > 0 ? `You pay ${this.restPrice} gp and sleep. You wake rested.` : 'The bed is given freely. You sleep and wake rested.', 'discovery'));
    this.run.onRest?.();
    return done(...messages);
  }

  // --- Lift ---

  /** The villages the player has visited, other than this one, with the fare to each. Unvisited ones are hidden (Spec 01). */
  trips(): LiftTrip[] {
    return [...this.state.visited]
      .filter((d) => d !== this.run.depth && this.run.villages.includes(d))
      .sort((a, b) => a - b)
      .map((depth) => ({ depth, name: this.nameOf(depth), fare: fareToPay(this.run.runSeed, this.run.depth, depth, this.state.liftToken) }));
  }

  /** Ride to a visited village, paying from the bank. */
  ride(to: number): Result {
    const trip = this.trips().find((t) => t.depth === to);
    if (!trip) return refused(say('The lift does not go there.'));
    const messages: LogMessage[] = [];
    if (!this.pay(trip.fare, 'The ride', messages)) return refused(...messages);
    messages.push(say(`You pay ${trip.fare} gp.`), ...this.run.lift(to));
    messages.push(...this.run.takeArrivals());
    return done(...messages);
  }

  // --- Shop ---

  /** What the shop holds now: rolled for the current rest count, and kept until the next rest (Spec 05). */
  stock(): Item[] {
    const data = this.run.itemData;
    if (!data) return [];
    const { player } = this.run;
    let shop = this.state.shops[this.run.depth];
    if (!shop || shop.rest !== player.rests) {
      shop = { rest: player.rests, items: shopStock(data, this.run.spellList, this.run.runSeed, this.run.depth, this.number(), player.rests) };
      this.state.shops[this.run.depth] = shop;
    }
    return shop.items;
  }

  price(item: Item): number {
    return buyPrice(item, this.number());
  }

  /** Buy one thing from stock. A potion bought is known for what it is (the shop labels it). */
  buy(item: Item): Result {
    const stock = this.stock();
    const at = stock.indexOf(item);
    if (at < 0) return refused(say('The shop does not have that.'));
    const { player } = this.run;
    const trial = { coins: player.coins, pack: structuredClone(player.pack) };
    const want = 'count' in item ? item.count : 1;
    if (addToPack(trial, this.packSize(), structuredClone(item)) < want) return refused(say('Your pack is full.'));
    const messages: LogMessage[] = [];
    if (!this.pay(this.price(item), `The ${item.name.toLowerCase()}`, messages)) return refused(...messages);
    stock.splice(at, 1);
    addToPack(player, this.packSize(), item);
    if (item.kind === 'potion' && !player.known.includes(item.id)) player.known.push(item.id);
    return done(say(`You buy ${describeItem(item, this.knowledge())} for ${this.price(item)} gp.`, 'loot'));
  }

  /** What the player carries or wears that a shop could take, with what it pays. */
  sellable(): { item: Item; price: number; worn?: EquipSlot }[] {
    const { player } = this.run;
    const data = this.run.itemData;
    if (!data) return [];
    // Fence: a `sell_bonus` effect adds its percent (Spec 03, Addendum A).
    const bonus = this.derived().sellBonus;
    const rows: { item: Item; price: number; worn?: EquipSlot }[] = [];
    for (const item of player.pack) rows.push({ item, price: shopPays(item, data, player.known, bonus) });
    for (const slot of EQUIP_SLOTS) {
      const item = player.equipment[slot];
      if (item) rows.push({ item, price: shopPays(item, data, player.known, bonus), worn: slot });
    }
    return rows.filter((r) => r.price > 0);
  }

  /** Sell one thing: the gold goes straight to the bank and earns no XP (Spec 05, Spec 07). A cursed item cannot be sold while worn. */
  sell(item: Item): Result {
    const row = this.sellable().find((r) => r.item === item);
    if (!row) return refused(say('The shop will not buy that.'));
    const { player } = this.run;
    if (row.worn && isCursed(item)) return refused(say('You cannot part with something cursed while you wear it.'));
    if (row.worn) delete player.equipment[row.worn];
    else player.pack.splice(player.pack.indexOf(item), 1);
    this.state.bank += row.price;
    return done(say(`You sell ${describeItem(item, this.knowledge())} for ${row.price} gp, paid into the bank.`, 'loot'));
  }

  // --- Appraiser ---

  /** Value every gem and jewelry piece carried at once, free (Spec 07). */
  appraise(): Result {
    const valued = appraiseAll(this.run.runSeed, this.run.player.pack);
    if (valued.length === 0) return refused(say('You carry nothing that needs appraising.'));
    return done(...valued.map((p) => say(`The ${p.name} is worth ${p.appraised} gp.`, 'loot')));
  }

  /** Everything carried or worn that is not yet known for what it is. */
  unidentified(): Item[] {
    const { player } = this.run;
    return [...player.pack, ...EQUIP_SLOTS.map((s) => player.equipment[s])].filter((i): i is Item => i !== undefined && !isIdentified(i, player.known));
  }

  get identifyPrice(): number {
    return identifyPrice(this.number());
  }

  /** Reveal one item's true name and any curse (Spec 05, Spec 07). */
  identify(item: Item): Result {
    if (!this.unidentified().includes(item)) return refused(say('That is already known.'));
    const messages: LogMessage[] = [];
    if (!this.pay(this.identifyPrice, 'Identifying it', messages)) return refused(...messages);
    identify(item, this.run.player.known);
    const cursed = isCursed(item) ? ' It is cursed.' : '';
    return done(say(`It is ${describeItem(item, this.knowledge())}.${cursed}`, 'discovery'));
  }

  // --- Smith ---

  /** Broken gear carried or worn. */
  broken(): Item[] {
    const { player } = this.run;
    return [...player.pack, ...EQUIP_SLOTS.map((s) => player.equipment[s])].filter(
      (i): i is Item => i !== undefined && (i.kind === 'weapon' || i.kind === 'ranged' || i.kind === 'armour' || i.kind === 'shield') && i.broken,
    );
  }

  repairPrice(item: Item): number {
    return repairPrice(item, this.number());
  }

  /** Mend one broken piece (Spec 05, Spec 07). */
  repair(item: Item): Result {
    if (!this.broken().includes(item) || !('broken' in item)) return refused(say('That is not broken.'));
    const price = this.repairPrice(item);
    const messages: LogMessage[] = [];
    if (!this.pay(price, 'The repair', messages)) return refused(...messages);
    item.broken = false;
    return done(say(`The smith mends your ${item.name.toLowerCase()} for ${price} gp.`, 'discovery'));
  }

  // --- Tavern: rumours ---

  get rumourPrice(): number {
    return rumourPrice(this.number());
  }

  /**
   * The facts a village's rumours may state (Spec 07): those the run layout holds about the levels it serves, and what the
   * generated levels hold: the most trapped level, and each level with a fountain. All of them true.
   */
  rumourFacts(village = this.run.depth): Fact[] {
    const cached = this.factsCache.get(village);
    if (cached) return cached;
    const facts: Fact[] = this.run.layout ? factsServedBy(this.run.layout, village) : [];
    if (this.run.layout) {
      const [lo, hi] = levelsServedBy(this.run.layout, village);
      let worst: { level: number; traps: number } | undefined;
      for (let level = lo; level <= hi; level++) {
        if (this.run.villages.includes(level)) continue;
        const l = this.run.peek(level);
        if (l.features.some((f) => f.type === 'fixture' && f.kind === 'fountain')) facts.push({ kind: 'fountain', values: { level } });
        if (l.traps.length > 0 && (!worst || l.traps.length > worst.traps)) worst = { level, traps: l.traps.length };
      }
      if (worst) facts.push({ kind: 'trap_level', values: { level: worst.level } });
    }
    this.factsCache.set(village, facts);
    return facts;
  }

  /** Buy the village's rumour: one new one per rest, after which the barkeep repeats it for free (Spec 07). */
  rumour(): Result {
    const { player } = this.run;
    const depth = this.run.depth;
    const last = this.state.rumours[depth];
    if (last && last.rest === player.rests) return done(say(`The barkeep repeats: "${last.text}"`));
    const rng = createRng(hash32('rumour', this.run.runSeed >>> 0, depth, player.rests));
    const choice = chooseTemplate(this.run.gameContent.rumours, this.rumourFacts(depth), rng, { seen: this.state.seen });
    if (!choice) return refused(say('The barkeep has nothing to tell you.'));
    const messages: LogMessage[] = [];
    if (!this.pay(this.rumourPrice, 'The rumour', messages)) return refused(...messages);
    this.state.seen.push(choice.key);
    this.state.rumours[depth] = { rest: player.rests, text: choice.text };
    const level = choice.fact?.values.level;
    addJournal(player, { depth: typeof level === 'number' ? level : depth, kind: 'rumour', id: `${choice.key}@${depth}@${player.rests}`, text: choice.text });
    return done(say(`You pay ${this.rumourPrice} gp. "${choice.text}"`, 'discovery'));
  }

  // --- Tavern: quests ---

  /** Whether the quest's goal was placed on its level: a quest whose goal found no place is never offered. */
  private placed(quest: Quest): boolean {
    const level = this.run.peek(quest.level);
    switch (quest.type) {
      case 'captive':
        return level.npcs.some((n) => n.quest === quest.id);
      case 'opponent':
        return level.monsters.some((m) => m.quest === quest.id);
      default: {
        const has = (loot: readonly { kind: string; quest?: string }[]): boolean => loot.some((l) => l.kind === 'quest_item' && l.quest === quest.id);
        return level.features.some((f) => f.type === 'container' && has(f.contents)) || level.piles.some((p) => has(p.contents));
      }
    }
  }

  /** The text of a quest, filled from what its level actually holds so it is true (Spec 08). */
  questText(quest: Quest): string | undefined {
    const level: Level = this.run.peek(quest.level);
    const plan = this.run.planOf(quest.level)?.quests.find((g) => g.quest.id === quest.id);
    const values: Fact['values'] = { level: quest.level, village: this.nameOf(quest.village) };
    if (quest.type === 'captive') {
      const guard = level.monsters.find((m) => m.quest === quest.id);
      if (!guard) return undefined;
      values.monster = guard.name;
    } else if (quest.type === 'opponent') {
      const opp = level.monsters.find((m) => m.quest === quest.id);
      if (!opp) return undefined;
      values.monster = opp.name;
    } else {
      const name = plan?.item?.name;
      if (!name) return undefined;
      values.item = name;
    }
    const rng = createRng(hash32('quest-text', this.run.runSeed >>> 0, quest.id));
    return chooseTemplate(this.run.gameContent.questTexts, [{ kind: quest.type, values }], rng)?.text;
  }

  private questsOf(village: number): Quest[] {
    return this.run.layout?.quests.filter((q) => q.village === village) ?? [];
  }

  /** The open quests the board shows: up to 3 from the village's list, in order; taking one reveals the next (Spec 07). */
  board(village = this.run.depth): QuestOffer[] {
    const offers: QuestOffer[] = [];
    for (const quest of this.questsOf(village)) {
      if (this.state.quests[quest.id] !== undefined || !this.placed(quest)) continue;
      const text = this.questText(quest);
      if (text) offers.push({ quest, text });
      if (offers.length === BOARD_SIZE) break;
    }
    return offers;
  }

  /** Quests taken and not yet finished. */
  active(): QuestOffer[] {
    const layout = this.run.layout;
    return Object.entries(this.state.quests)
      .filter(([, status]) => status === 'active')
      .flatMap(([id]) => {
        const quest = layout?.quests.find((q) => q.id === id);
        const text = quest && this.questText(quest);
        return quest && text ? [{ quest, text }] : [];
      });
  }

  take(id: string): Result {
    const offer = this.board().find((o) => o.quest.id === id);
    if (!offer) return refused(say('That quest is not on the board.'));
    const active = Object.values(this.state.quests).filter((s) => s === 'active').length;
    if (active >= QUEST_LIMIT) return refused(say(`You already carry ${QUEST_LIMIT} quests. Abandon one first.`));
    this.state.quests[id] = 'active';
    addJournal(this.run.player, { depth: offer.quest.level, kind: 'quest', id, text: offer.text });
    return done(say(`You take the quest: ${offer.text}`, 'discovery'));
  }

  /** Give a quest up. It leaves the journal and the board for good. */
  abandon(id: string): Result {
    if (this.state.quests[id] !== 'active') return refused(say('You have not taken that quest.'));
    this.state.quests[id] = 'abandoned';
    dropQuestEntry(this.run.player.journal, id);
    return done(say('You abandon the quest.'));
  }

  /** The player's captive died: its quest fails (Spec 07). */
  failQuest(id: string): LogMessage[] {
    return failQuest(this.state, this.run.player.journal, id) ? [say('The quest has failed.', 'warning')] : [];
  }

  /** Pay a finished quest into the bank as treasure, so it earns XP, and sometimes an item too (Spec 07). */
  private payQuest(quest: Quest, messages: LogMessage[]): void {
    const { player } = this.run;
    this.state.quests[quest.id] = 'paid';
    this.state.bank += quest.reward;
    bankTreasure(this.run.character, quest.reward);
    messages.push(say(`The quest is done. ${quest.reward} gp is paid into the bank, and earns ${quest.reward} XP.`, 'loot'));
    const rng = createRng(hash32('quest-item', this.run.runSeed >>> 0, quest.id));
    const data = this.run.itemData;
    if (data && rng.oneIn(QUEST_ITEM_ONE_IN)) {
      const row = pickWeighted(eligibleEntries([...data.magic.values()], { depth: quest.level }), rng);
      if (row) {
        const item = makeMagicItem(row, hash32('quest-item', this.run.runSeed >>> 0, quest.id, 'item'), rng, data);
        if (addToPack(player, this.packSize(), item) > 0) messages.push(say(`You are given ${describeItem(item, this.knowledge())} as well.`, 'loot'));
        else messages.push(say('A gift is waiting for you, but your pack is full.'));
      }
    }
  }

  // --- Arriving in a village ---

  /**
   * The player stands in a village: it is visited, escorts are delivered (a specialist joins a village lacking the
   * service; a quest's captive finishes its quest), and finished quests are paid. Returns what it said.
   */
  onArrive(): LogMessage[] {
    const messages: LogMessage[] = [];
    const depth = this.run.depth;
    const { player } = this.run;
    if (!this.state.visited.includes(depth)) this.state.visited.push(depth);
    for (const escort of [...this.state.escorts]) {
      if (escort.service) {
        const service = SPECIALIST_SERVICE[escort.service];
        if (this.services(depth).includes(service)) continue; // already has one; stays with the player
        (this.state.joined[service] ??= []).push(depth);
        this.state.escorts.splice(this.state.escorts.indexOf(escort), 1);
        messages.push(say(`${escort.name} settles here and opens a ${service === 'shop' ? 'shop' : service}. It is open for the rest of the run.`, 'discovery'));
      } else if (escort.quest) {
        this.state.escorts.splice(this.state.escorts.indexOf(escort), 1);
        messages.push(say(`${escort.name} is safe, and thanks you.`, 'discovery'));
        const quest = this.run.layout?.quests.find((q) => q.id === escort.quest);
        if (quest && this.state.quests[quest.id] === 'active') this.payQuest(quest, messages);
      }
    }
    for (const [id, status] of Object.entries(this.state.quests)) {
      if (status !== 'active') continue;
      const quest = this.run.layout?.quests.find((q) => q.id === id);
      if (!quest) continue;
      if (quest.type === 'opponent' && this.state.goals.includes(id)) this.payQuest(quest, messages);
      else if ((quest.type === 'belonging' || quest.type === 'magic_item') && quest.village === depth) {
        const held = player.pack.find((i) => i.kind === 'quest_item' && i.quest === id);
        if (held) {
          player.pack.splice(player.pack.indexOf(held), 1);
          this.payQuest(quest, messages);
        }
      }
    }
    return messages;
  }
}
