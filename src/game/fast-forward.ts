// Z in real time (Spec 01, Addendum B): the game runs at four times speed until a Combat die returns or one of
// Addendum A's interruptions happens. Turn mode's Z makes the same tests after each round it waits; here they are made
// after every tick, so Z stops at the tick the interruption comes.

import type { LogMessage } from '../core/log.ts';
import { nameOf } from './combat.ts';
import type { Game } from './game.ts';
import type { Monster } from './monsters.ts';

export class WaitWatch {
  private readonly seenAtStart: Set<Monster>;
  private dice: number;
  private statuses: Set<string>;

  private constructor(private readonly game: Game) {
    const { player } = game.state;
    this.seenAtStart = new Set(game.hostilesInView());
    this.dice = player.pools.combat.dice;
    this.statuses = new Set(player.statuses.map((e) => e.id));
  }

  /** Start watching, or say why Z cannot wait now (dead, at full strength, Poisoned), as in turn mode. */
  static start(game: Game): WaitWatch | string {
    return game.waitProblem() ?? new WaitWatch(game);
  }

  /**
   * After a tick and its messages: whether Z stops. It stops when a Combat die returns, when the player is hit or gains
   * a status, when a combat or warning message is logged, and when a creature not in view at the start comes into view,
   * which adds "You stop waiting" to `messages`.
   */
  stops(messages: LogMessage[]): boolean {
    const { player } = this.game.state;
    if (player.dead) return true;
    const dice = player.pools.combat.dice;
    if (dice !== this.dice) return true; // a die returned, or the player was hit
    if (player.statuses.some((e) => !this.statuses.has(e.id))) return true;
    if (messages.some((m) => m.kind === 'combat' || m.kind === 'warning')) return true;
    const newcomer = this.game.hostilesInView().find((m) => !this.seenAtStart.has(m));
    if (newcomer) {
      messages.push({ kind: 'warning', text: `You stop waiting: ${nameOf(newcomer)} comes into view.` });
      return true;
    }
    this.statuses = new Set(player.statuses.map((e) => e.id));
    return false;
  }
}
