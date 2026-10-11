// Each creature's schedule in real time (Spec 04, Addendum B): every creature has a next-act tick set by its speed,
// staggered on arrival so creatures do not step in lockstep. At each round boundary the 50 nearest the player are
// chosen and make their once-a-round checks; within a tick, the creatures due act nearest first. Turn mode never
// uses this. Nothing here is saved (Spec 09, Addendum B).

import type { LogMessage } from '../core/log.ts';
import { hash32, levelSeed } from '../core/rng.ts';
import { effectiveSpeed, type Speed, type StatusEffect } from '../rules/magic/status.ts';
import { distanceSq } from '../rules/world/geometry.ts';
import { creaturesActOnce, roundChecks, simulatedThisRound } from './ai.ts';
import type { Game } from './game.ts';
import type { Monster } from './monsters.ts';

/** Ticks between a creature's actions: 5 fast, 10 normal, 20 slow (Spec 04, Addendum B). */
export const TICKS_PER_ACTION: Readonly<Record<Speed, number>> = { fast: 5, normal: 10, slow: 20 };

/**
 * The player's cooldown after an action, in ticks (Spec 04, Addendum B): 10, 5 Hasted, 20 Slowed, and 10 with both,
 * the same as a creature's time between actions.
 */
export const cooldownTicks = (statuses: readonly StatusEffect[]): number => TICKS_PER_ACTION[effectiveSpeed('normal', statuses)];

/** A creature's first next-act tick comes 1 to this many ticks after it arrives. */
export const STAGGER_TICKS = 10;

/** How many ticks after its arrival a creature first acts: 1 to 10, from the level seed and its id, so the same arrival staggers the same way. */
export const staggerOf = (game: Game, m: Monster): number =>
  (hash32('stagger', levelSeed(game.runSeed, game.state.map.level.depth), m.id) % STAGGER_TICKS) + 1;

export class Schedule {
  /** Each creature's next-act tick, by creature: ids can be reused once a creature is gone, the object cannot. */
  private readonly next = new WeakMap<Monster, number>();
  /** The creatures simulated this round: the 50 nearest at the last boundary. */
  private simulated = new Set<Monster>();

  constructor(private readonly game: Game) {}

  /** The tick at which the creature next acts, or undefined before the schedule has seen it. */
  nextAct(m: Monster): number | undefined {
    return this.next.get(m);
  }

  /** Whether the creature is among those simulated this round. */
  isSimulated(m: Monster): boolean {
    return this.simulated.has(m);
  }

  /** Every creature new since the last tick (on arrival, all of them) first acts 1 to 10 ticks from now. */
  arrive(): void {
    for (const m of this.game.state.monsters) if (!this.next.has(m)) this.next.set(m, this.game.tick + staggerOf(this.game, m));
  }

  /** A round begins: the 50 nearest the player are simulated for it, and make their once-a-round checks. */
  beginRound(messages: LogMessage[]): void {
    const chosen = simulatedThisRound(this.game);
    this.simulated = new Set(chosen);
    roundChecks(this.game, chosen, messages);
  }

  /**
   * The creatures due at the game's tick take their turn, nearest the player first, ties by their order in the
   * level's list. Every one due moves its next-act tick on, whether or not it can act, so none stores up actions.
   * Returns the simulated creatures whose turn it was, in the order they took it.
   */
  tick(messages: LogMessage[]): Monster[] {
    const { game } = this;
    const { monsters, map } = game.state;
    const due: { m: Monster; index: number; d: number }[] = [];
    monsters.forEach((m, index) => {
      const at = this.next.get(m);
      if (at === undefined || at > game.tick) return;
      this.next.set(m, at + TICKS_PER_ACTION[effectiveSpeed(m.speed, m.statuses)]);
      if (this.simulated.has(m)) due.push({ m, index, d: distanceSq(m, map.player) });
    });
    if (due.length === 0) return [];
    const order = due.sort((a, b) => a.d - b.d || a.index - b.index).map((e) => e.m);
    creaturesActOnce(game, order, messages);
    return order;
  }
}
