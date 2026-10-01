// The talk screens of the people in the dungeon (Spec 01, "NPC talk"; Spec 07), and the level-up screen (Spec 01, Spec 03).
// A trader sells, a hermit offers four services, a captive can be freed; traders and hermits are paid from carried coins.

import type { LogMessage } from '../core/log.ts';
import { type PoolName } from '../rules/character/dice.ts';
import { poolsWithRoom } from '../rules/character/progression.ts';
import type { Game } from '../game/game.ts';
import { buyFromTrader, hermitOffers, traderOffer, unknownItems, useHermit } from '../game/features/index.ts';
import type { Run } from '../game/run.ts';
import { ctxOf } from '../game/items.ts';
import { itemLine } from './inventory.ts';
import { ListMenu, type ListRow } from './overlay.ts';

/** What the talk screens ask of the shell. */
export interface PeopleHost {
  log(messages: readonly LogMessage[]): void;
  /** Coins or the pack changed: bring the pane in line. */
  changed(): void;
  /** Free the captive: one round passes. */
  free(index: number): void;
}

const gp = (n: number): string => `${n.toLocaleString('en-US')} gp`;
const ROLE = { trader: 'trader', hermit: 'hermit', captive: 'captive' } as const;

/** The screen for whoever stands at `index` of the level's people. */
export function talkMenu(game: Game, index: number, host: PeopleHost): ListMenu | undefined {
  const npc = game.state.map.level.npcs[index];
  if (!npc || !(npc.kind in ROLE)) return undefined;
  const title = `${npc.name}, ${ROLE[npc.kind as keyof typeof ROLE]}`;
  const coins = (): string => `You carry ${gp(game.state.player.coins)}`;
  if (npc.kind === 'trader') {
    return new ListMenu(
      title,
      () => traderOffer(game, index).map(({ which, item, price }): ListRow => ({ label: itemLine(ctxOf(game), item), detail: gp(price), choose: () => (host.log(buyFromTrader(game, index, which)), host.changed(), {}) })),
      () => `${coins()}. Traders sell and never buy.`,
      'The trader has nothing left to sell.',
    );
  }
  if (npc.kind === 'hermit') {
    return new ListMenu(
      title,
      () =>
        hermitOffers(game, index).map((o): ListRow => ({
          label: o.spent ? `${o.label} (done)` : o.label,
          detail: gp(o.price),
          dim: o.spent,
          choose: () => {
            if (o.service === 'identify' && !o.spent) return { open: identifyMenu(game, index, host) };
            host.log(useHermit(game, index, o.service));
            host.changed();
            return {};
          },
        })),
      () => `${coins()}. Each service once per visit.`,
      '',
      true,
    );
  }
  return new ListMenu(
    title,
    () => [
      { label: `Cut ${npc.name} free. They will follow you to a village.`, choose: () => (host.free(index), { close: true }) },
      { label: 'Leave', choose: () => ({ close: true }) },
    ],
    () => 'Captives charge nothing.',
    '',
    true,
  );
}

function identifyMenu(game: Game, index: number, host: PeopleHost): ListMenu {
  return new ListMenu(
    'Identify',
    () => unknownItems(game).map((item): ListRow => ({ label: itemLine(ctxOf(game), item), choose: () => (host.log(useHermit(game, index, 'identify', item)), host.changed(), { close: true }) })),
    () => `You carry ${gp(game.state.player.coins)}`,
    'You carry nothing unidentified.',
  );
}

// --- Level up ---

const POOL_LABEL: Record<PoolName, string> = { combat: 'Combat', skill: 'Skill', magic: 'Magic' };

/** What the level-up screen asks of the shell. */
export interface LevelUpHost {
  log(messages: readonly LogMessage[]): void;
  /** The level was applied: bring the pane in line. */
  changed(): void;
}

/** The level-up screen (Spec 03): the player picks the pool that gains the new die, which arrives full. */
export class LevelUpMenu extends ListMenu {}

export function levelUpMenu(run: Run, host: LevelUpHost): LevelUpMenu {
  const c = run.character;
  return new LevelUpMenu(
    `You reach level ${c.level + 1}`,
    () =>
      poolsWithRoom(c).map((pool): ListRow => ({
        label: `${POOL_LABEL[pool]}: d${c.pools[pool].step}, ${c.pools[pool].max} ${c.pools[pool].max === 1 ? 'die' : 'dice'} now`,
        detail: `${c.pools[pool].max + 1} dice`,
        choose: () => {
          const result = run.levelUp(pool);
          if (result) host.log(result.messages);
          host.changed();
          // Crossing several thresholds at once runs one screen per level, in order (Spec 03).
          return run.levelsOwed > 0 && poolsWithRoom(c).length > 0 ? { close: true, open: levelUpMenu(run, host) } : { close: true };
        },
      })),
    () => 'Choose the pool that gains a die, which arrives full. A minor ability is drawn at random.',
    'Every pool is full.',
    true,
  );
}

