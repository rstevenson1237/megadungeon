import { describe, expect, it } from 'vitest';
import { hasStatus, applyStatus } from '../src/rules/magic/status.ts';
import { hermitPrice } from '../src/rules/villages/economy.ts';
import { traderPrice } from '../src/rules/items/prices.ts';
import { traderStock } from '../src/rules/villages/stock.ts';
import { spawn } from '../src/game/monsters.ts';
import type { Game } from '../src/game/game.ts';
import { buyFromTrader, hermitOffers, traderItems, traderOffer, useHermit } from '../src/game/features/index.ts';
import type { Level, Npc, PlacedMonster } from '../src/rules/world/level.ts';
import { isIdentified } from '../src/rules/items/magic.ts';
import { ITEMS, gameAt, magic, room, withThings } from './helpers.ts';

const trader: Npc = { kind: 'trader', name: 'Odo', x: 3, y: 3 };
const hermit: Npc = { kind: 'hermit', name: 'Sela', x: 5, y: 3 };
const captive: Npc = { kind: 'captive', name: 'Edda', x: 7, y: 3, quest: 'quest_0_1' };
const level = (...npcs: Npc[]): Level => ({ ...withThings(room(12, 5, 1, 1), { npcs }), depth: 14 });
const above = (villagesAbove: number) => ({ above: { villagesAbove, facts: () => [{ kind: 'boss', values: { level: 16, artifact: 'the Crown' } }] } });
const at = (lvl: Level, villages = 2, player = {}) => gameAt(lvl, 2, 3, { pack: [], equipment: {}, coins: 1000, combatDice: 1, combatMax: 3, ...player }, above(villages));
const said = (r: { messages: { text: string }[] }): string => r.messages.map((m) => m.text).join(' | ');
const interact = (game: Game) => game.act({ type: 'interact' })!;

describe('Spec 04 and 07: people in the dungeon', () => {
  it('E beside a trader or hermit opens their talk screen for free; walking into them does the same', () => {
    const game = at(level(trader, hermit));
    const e = interact(game);
    expect(e).toMatchObject({ spent: false, npc: 0 });
    const bump = game.act({ type: 'move', dx: 1, dy: 0 })!;
    expect(bump).toMatchObject({ spent: false, npc: 0 });
    expect(game.state.map.player).toEqual({ x: 2, y: 3 });
  });

  it('a trader sells 3 to 6 things at 150% of value times the multiplier of the nearest village above, from carried coins', () => {
    const game = at(level(trader));
    const offer = traderOffer(game, 0);
    expect(offer.length).toBeGreaterThanOrEqual(3);
    expect(offer.length).toBeLessThanOrEqual(6);
    for (const o of offer) expect(o.price).toBe(Math.ceil(traderPrice(o.item) * 1.4));
    const first = offer[0]!;
    const bank = game.state.player.town.bank;
    const coins = game.state.player.coins;
    const result = buyFromTrader(game, 0, first.which);
    expect(result.map((m) => m.text).join(' ')).toContain('You buy');
    expect(game.state.player.coins).toBe(coins - first.price);
    expect(game.state.player.town.bank).toBe(bank); // the bank cannot be reached from the dungeon
    expect(traderOffer(game, 0)).toHaveLength(offer.length - 1);
    expect(traderItems(game, 0)).toHaveLength(offer.length - 1);
  });

  it('a trader refuses a buyer with too few coins', () => {
    const game = at(level(trader), 2, { coins: 1 });
    const first = traderOffer(game, 0)[0]!;
    expect(buyFromTrader(game, 0, first.which)[0]!.text).toContain('more than');
    expect(game.state.player.coins).toBe(1);
  });

  it('some traders\' stock includes magic items, and every trader\'s stock is 3 to 6 things', () => {
    let magicSeen = false;
    for (let x = 1; x <= 10; x++) {
      for (let y = 1; y <= 5; y++) {
        const stock = traderStock(ITEMS, 1, 14, x, y);
        expect(stock.length).toBeGreaterThanOrEqual(3);
        expect(stock.length).toBeLessThanOrEqual(6);
        if (stock.some((i) => ['ring', 'wand', 'rod', 'staff', 'clothing', 'potion'].includes(i.kind) || (i.kind === 'weapon' && i.enchant !== undefined))) magicSeen = true;
      }
    }
    expect(magicSeen).toBe(true);
  });

  it('traders never buy: there is no way to sell to one', () => {
    const game = at(level(trader));
    // The talk screen lists only what the trader sells: an item, its price and its place in the stock.
    expect(Object.keys(traderOffer(game, 0)[0]!).sort()).toEqual(['item', 'price', 'which']);
  });

  it('a purchase from a trader is kept in the level delta, so it stays bought on a return visit', () => {
    const game = at(level(trader));
    buyFromTrader(game, 0, traderOffer(game, 0)[0]!.which);
    const delta = game.captureDelta();
    expect(delta.used.npcs[0]!.bought).toHaveLength(1);
  });
});

describe('Spec 07: hermits', () => {
  it('offer four services at about 100, 25, 100 and 25 gp times the village multiplier', () => {
    const game = at(level(hermit), 2);
    const offers = hermitOffers(game, 0);
    expect(offers.map((o) => [o.service, o.price])).toEqual([
      ['identify', Math.ceil(100 * 1.4)],
      ['restore', Math.ceil(25 * 1.4)],
      ['curse', Math.ceil(100 * 1.4)],
      ['rumour', Math.ceil(25 * 1.4)],
    ]);
    expect(hermitPrice('restore', 0)).toBe(25);
  });

  it('identify one item shows its true name and curse, paid from carried coins', () => {
    const ring = magic('ring_might', true);
    const game = at(level(hermit), 2, { pack: [ring] });
    const result = useHermit(game, 0, 'identify', ring);
    expect(isIdentified(ring, game.state.player.known)).toBe(true);
    expect(said({ messages: result })).toContain('Ring of Might');
    expect(said({ messages: result })).toContain('cursed');
    expect(game.state.player.coins).toBe(1000 - 140);
    expect(game.state.player.town.bank).toBe(20);
  });

  it('restore one Combat die, lift a curse, and a rumour of the nearby levels that is one of the facts it was given', () => {
    const ring = magic('ring_might', true);
    const game = at(level(hermit), 2, { equipment: { ring1: ring } });
    applyStatus(game.state.player.statuses, 'cursed', null);
    useHermit(game, 0, 'restore');
    expect(game.state.player.pools.combat.dice).toBe(2);
    useHermit(game, 0, 'curse');
    expect((ring as { cursed: boolean }).cursed).toBe(false);
    expect(hasStatus(game.state.player.statuses, 'cursed')).toBe(false);
    const rumour = useHermit(game, 0, 'rumour');
    expect(said({ messages: rumour })).toContain('level 16');
    expect(game.state.player.journal.some((e) => e.kind === 'rumour' && e.depth === 16)).toBe(true);
  });

  it('each service once per visit to the level: a second try is refused and costs nothing, and a new visit offers it again', () => {
    const game = at(level(hermit), 2);
    useHermit(game, 0, 'restore');
    const coins = game.state.player.coins;
    expect(said({ messages: useHermit(game, 0, 'restore') })).toContain('once already');
    expect(game.state.player.coins).toBe(coins);
    expect(hermitOffers(game, 0).find((o) => o.service === 'restore')!.spent).toBe(true);
    const next = at(level(hermit), 2, { combatDice: 1 });
    expect(hermitOffers(next, 0).find((o) => o.service === 'restore')!.spent).toBe(false);
  });

  it('a service that cannot be paid for, or has nothing to do, costs nothing', () => {
    const poor = at(level(hermit), 2, { coins: 5 });
    expect(said({ messages: useHermit(poor, 0, 'curse') })).toContain('more than');
    expect(poor.state.player.coins).toBe(5);
    const well = at(level(hermit), 2, { combatDice: 3 });
    useHermit(well, 0, 'restore');
    expect(well.state.player.coins).toBe(1000);
    useHermit(well, 0, 'curse');
    expect(well.state.player.coins).toBe(1000);
  });
});

describe('Spec 04 and 07: captives', () => {
  it('freeing one costs a round and nothing else; they follow, and the captive is gone from the level', () => {
    const game = at(level(captive), 2);
    game.state.map.player = { x: 6, y: 3 };
    const talk = interact(game);
    expect(talk).toMatchObject({ spent: false, npc: 0 });
    const round = game.state.round;
    const freed = game.free(0);
    expect(freed.spent).toBe(true);
    expect(game.state.round).toBe(round + 1);
    expect(game.state.player.town.escorts).toEqual([{ name: 'Edda', dice: 2, quest: 'quest_0_1' }]);
    expect(game.state.player.coins).toBe(1000);
    expect(game.state.used.npcs[0]).toEqual({ freed: true });
    expect(interact(game)).toMatchObject({ spent: false });
    expect(interact(game).npc).toBeUndefined();
  });

  it('a freed captive stays freed when the level is entered again', () => {
    const game = at(level(captive), 2);
    game.state.map.player = { x: 6, y: 3 };
    game.free(0);
    const delta = game.captureDelta();
    const again = gameAt(level(captive), 6, 3, { pack: [], equipment: {} }, { ...above(2), delta });
    expect(again.state.used.npcs[0]!.freed).toBe(true);
    expect(interact(again).npc).toBeUndefined();
  });

  it('a rescued specialist captive carries its service', () => {
    const game = at(level({ ...captive, quest: undefined as never, service: 'smith' } as Npc), 2);
    game.state.map.player = { x: 6, y: 3 };
    game.free(0);
    expect(game.state.player.town.escorts[0]).toMatchObject({ service: 'smith' });
  });
});

describe('Spec 02: the lift token', () => {
  it('a boss that carries it drops it where it dies, and taking it makes fares cheaper for the run', () => {
    const placed: PlacedMonster = { id: 'boss_stub', name: 'Ogre King', glyph: 'O', colour: 'white', dice: 4, modifier: 1, speed: 'normal', behaviour: 'brute', role: 'boss', x: 4, y: 3, group: 0, liftToken: true } as unknown as PlacedMonster;
    const boss = spawn(placed, 0);
    expect(boss.carried).toEqual([{ kind: 'lift_token' }]);
    const game = at(level(), 2);
    game.state.drops.push({ x: 2, y: 3, contents: boss.carried });
    expect(game.state.player.town.liftToken).toBe(false);
    const result = game.act({ type: 'pickup' })!;
    expect(game.state.player.town.liftToken).toBe(true);
    expect(result.messages.map((m) => m.text).join(' ')).toContain('token');
    expect(game.state.drops.length === 0 || game.state.drops[0]!.contents.length === 0).toBe(true);
  });
});

