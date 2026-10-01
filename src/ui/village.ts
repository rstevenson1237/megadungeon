// The village screen (Spec 01, "Overlays and screens"; Spec 07, "Village structure"): there is
// no village map, the main view shows a menu of the services present plus Go up and Go down.
// Task 1.9 is a stub: every service says it is not yet available; the services themselves are
// task 2.11.

import type { Command } from '../game/commands.ts';
import type { Grid } from './grid.ts';
import { Menu, type MenuItem, type OverlayResult } from './overlay.ts';

/** Services every village has (Spec 07). Others are rolled per village from the seed (task 2.2). */
const ALWAYS = ['Bank', 'Lodging', 'Lift'];
/** The surface has everything (Spec 07). */
const SURFACE_ALL = ['Bank', 'Lodging', 'Lift', 'Shop', 'Appraiser', 'Smith', 'Tavern'];

export class VillageScreen {
  private readonly menu: Menu;

  /**
   * @param depth 0 for the surface village, which has Go down only; any other village also has Go up.
   * @param go Called when the player picks Go up or Go down.
   * @param services Which services to list; the surface lists them all.
   */
  constructor(
    depth: number,
    go: (direction: 'up' | 'down') => void,
    services: readonly string[] = depth === 0 ? SURFACE_ALL : ALWAYS,
  ) {
    const items: MenuItem[] = services.map((name) => ({
      label: name,
      choose: (): OverlayResult => ({ message: { kind: 'system', text: `${name} is not yet available.` } }),
    }));
    if (depth > 0) items.push({ label: 'Go up', choose: () => (go('up'), {}) });
    items.push({ label: 'Go down', choose: () => (go('down'), {}) });
    this.menu = new Menu(depth === 0 ? 'Surface Village' : 'Village', items, 'Choose with W/S or the arrows, Enter or E to confirm.');
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
}
