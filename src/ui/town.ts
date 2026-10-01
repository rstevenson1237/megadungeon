// The village screen and the services it opens (Spec 01, "Overlays and screens"; Spec 07). There is no village map: the
// main view shows a menu of the services present plus Go up and Go down, and choosing a service opens its list in
// place. Every screen asks the run's town for what to show and calls it to act; the town does all the arithmetic.

import type { LogMessage } from '../core/log.ts';
import type { Command } from '../game/commands.ts';
import type { Run } from '../game/run.ts';
import { depositOf } from '../rules/villages/economy.ts';
import type { Service } from '../rules/villages/services.ts';
import type { Item } from '../rules/items/types.ts';
import type { Grid } from './grid.ts';
import { itemLine } from './inventory.ts';
import { ListMenu, type ListRow, type OverlayResult } from './overlay.ts';
import type { Result } from '../game/town.ts';

/** What the village screens ask of the shell. */
export interface TownHost {
  go(direction: 'up' | 'down'): void;
  log(messages: readonly LogMessage[]): void;
  /** Gold, XP or items changed: bring the pane in line and run any level ups owed. */
  changed(): void;
  /** The run changed place (the lift): the shell draws the new village. */
  moved(messages: readonly LogMessage[]): void;
}

const gp = (n: number): string => `${n.toLocaleString('en-US')} gp`;
const SERVICE_LABEL: Record<Service, string> = {
  bank: 'Bank',
  lodging: 'Lodging',
  lift: 'Lift',
  shop: 'Shop',
  appraiser: 'Appraiser',
  smith: 'Smith',
  tavern: 'Tavern',
};

/** The village menu. */
export class VillageScreen {
  private readonly menu: ListMenu;

  constructor(
    private readonly run: Run,
    private readonly host: TownHost,
  ) {
    this.menu = new ListMenu(
      run.title,
      () => this.rows(),
      () => `Bank ${gp(run.player.town.bank)}`,
      '',
      true,
    );
  }

  private open(menu: ListMenu): OverlayResult {
    return { open: menu };
  }

  /** What a service did: its messages in the log, then the pane and any level ups. */
  private did(result: Result): OverlayResult {
    this.host.log(result.messages);
    this.host.changed();
    return {};
  }

  private rows(): ListRow[] {
    const { town } = this.run;
    const rows: ListRow[] = town.services().map((service): ListRow => ({ label: SERVICE_LABEL[service], choose: () => this.open(this.screen(service)) }));
    if (this.run.depth > 0) rows.push({ label: 'Go up', choose: () => (this.host.go('up'), {}) });
    rows.push({ label: 'Go down', choose: () => (this.host.go('down'), {}) });
    return rows;
  }

  private screen(service: Service): ListMenu {
    switch (service) {
      case 'bank':
        return this.bank();
      case 'lodging':
        return this.lodging();
      case 'lift':
        return this.lift();
      case 'shop':
        return this.shop();
      case 'appraiser':
        return this.appraiser();
      case 'smith':
        return this.smith();
      case 'tavern':
        return this.tavern();
    }
  }

  get selected(): number {
    return this.menu.selected;
  }

  draw(grid: Grid): void {
    this.menu.draw(grid);
  }

  /** W/S or arrows move; Enter or E chooses. Esc is left to the shell, which opens the game menu. */
  handle(command: Command): OverlayResult {
    if (command.type === 'cancel') return {};
    return this.menu.handle(command.type === 'interact' ? { type: 'confirm' } : command);
  }

  // --- Bank ---

  private bank(): ListMenu {
    const { town, player } = this.run;
    const balance = (): string => `Balance ${gp(player.town.bank)}  XP ${this.run.character.xp.toLocaleString('en-US')}`;
    return new ListMenu(
      'Bank',
      () => {
        const { gold, heldBack } = depositOf(player.coins, player.pack);
        const held = heldBack.length > 0 ? `, ${heldBack.length} unappraised kept back` : '';
        return [
          { label: `Deposit all carried treasure${held}`, detail: gp(gold), choose: () => this.did(town.deposit()) },
          { label: 'Back', choose: () => ({ close: true }) },
        ];
      },
      balance,
      '',
      true,
    );
  }

  // --- Lodging ---

  private lodging(): ListMenu {
    const { town, player } = this.run;
    return new ListMenu(
      'Lodging',
      () => [
        { label: 'Rest for the night: all dice restored, timed effects ended, the game saved', detail: gp(town.restPrice), choose: () => this.did(town.rest()) },
        { label: 'Back', choose: () => ({ close: true }) },
      ],
      () => `Bank ${gp(player.town.bank)}`,
      '',
      true,
    );
  }

  // --- Lift ---

  private lift(): ListMenu {
    const { town, player } = this.run;
    return new ListMenu(
      'Lift',
      () =>
        town.trips().map((t): ListRow => ({
          label: `${t.name}, level ${t.depth}`,
          detail: t.fare === 0 ? 'free' : gp(t.fare),
          choose: () => {
            const result = town.ride(t.depth);
            if (!result.ok) return this.did(result);
            this.host.moved(result.messages);
            this.host.changed();
            return { close: true };
          },
        })),
      () => `Bank ${gp(player.town.bank)}${player.town.liftToken ? '  (lift token: half fares)' : ''}`,
      'No other village has been visited yet.',
    );
  }

  // --- Shop ---

  private shop(): ListMenu {
    const { town } = this.run;
    return new ListMenu(
      'Shop',
      () => [
        { label: 'Buy', choose: () => this.open(this.buy()) },
        { label: 'Sell', choose: () => this.open(this.sell()) },
        { label: 'Back', choose: () => ({ close: true }) },
      ],
      () => `Bank ${gp(this.run.player.town.bank)}  (${town.number() === 0 ? 'surface prices' : `prices x${(1 + 0.2 * town.number()).toFixed(1)}`})`,
      '',
      true,
    );
  }

  private buy(): ListMenu {
    const { town } = this.run;
    const ctx = this.run.ctx();
    return new ListMenu(
      'Shop: buy',
      () => town.stock().map((item): ListRow => ({ label: itemLine(ctx, item), detail: gp(town.price(item)), choose: () => this.did(town.buy(item)) })),
      () => `Bank ${gp(this.run.player.town.bank)}`,
      'The shelves are bare.',
    );
  }

  private sell(): ListMenu {
    const { town } = this.run;
    const ctx = this.run.ctx();
    return new ListMenu(
      'Shop: sell',
      () =>
        town.sellable().map(({ item, price, worn }): ListRow => ({
          label: `${itemLine(ctx, item)}${worn ? ' (worn)' : ''}`,
          detail: gp(price),
          choose: () => this.did(town.sell(item)),
        })),
      () => `Bank ${gp(this.run.player.town.bank)}  Sales go into the bank and earn no XP`,
      'You have nothing the shop will buy.',
    );
  }

  // --- Appraiser ---

  private appraiser(): ListMenu {
    const { town } = this.run;
    return new ListMenu(
      'Appraiser',
      () => [
        { label: 'Appraise every gem and piece of jewelry you carry', detail: 'free', choose: () => this.did(town.appraise()) },
        { label: 'Identify an item', detail: gp(town.identifyPrice), choose: () => this.open(this.identify()) },
        { label: 'Back', choose: () => ({ close: true }) },
      ],
      () => `Bank ${gp(this.run.player.town.bank)}`,
      '',
      true,
    );
  }

  private identify(): ListMenu {
    const { town } = this.run;
    const ctx = this.run.ctx();
    return new ListMenu(
      'Identify',
      () => town.unidentified().map((item): ListRow => ({ label: itemLine(ctx, item), detail: gp(town.identifyPrice), choose: () => this.did(town.identify(item)) })),
      () => `Bank ${gp(this.run.player.town.bank)}`,
      'You carry nothing unidentified.',
    );
  }

  // --- Smith ---

  private smith(): ListMenu {
    const { town } = this.run;
    const ctx = this.run.ctx();
    return new ListMenu(
      'Smith',
      () => town.broken().map((item): ListRow => ({ label: itemLine(ctx, item), detail: gp(town.repairPrice(item)), choose: () => this.did(town.repair(item)) })),
      () => `Bank ${gp(this.run.player.town.bank)}`,
      'Nothing you carry is broken.',
    );
  }

  // --- Tavern ---

  private tavern(): ListMenu {
    const { town } = this.run;
    return new ListMenu(
      'Tavern',
      () => [
        { label: 'Buy a rumour', detail: gp(town.rumourPrice), choose: () => this.did(town.rumour()) },
        { label: 'Quest board', choose: () => this.open(this.board()) },
        { label: 'Your quests', choose: () => this.open(this.quests()) },
        { label: 'Back', choose: () => ({ close: true }) },
      ],
      () => `Bank ${gp(this.run.player.town.bank)}`,
      '',
      true,
    );
  }

  private board(): ListMenu {
    const { town } = this.run;
    return new ListMenu(
      'Quest board',
      () => town.board().map((o): ListRow => ({ label: `${o.text} Reward ${gp(o.quest.reward)}.`, choose: () => this.did(town.take(o.quest.id)) })),
      () => 'Choose a quest to take it. You can carry 3.',
      'Nothing is posted.',
    );
  }

  private quests(): ListMenu {
    const { town } = this.run;
    return new ListMenu(
      'Your quests',
      () => town.active().map((o): ListRow => ({ label: o.text, detail: 'abandon', choose: () => this.did(town.abandon(o.quest.id)) })),
      () => 'Choose a quest to abandon it.',
      'You have taken no quests.',
    );
  }
}
