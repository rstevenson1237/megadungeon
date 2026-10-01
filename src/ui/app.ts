// The application: the title screen, then a run in the three-pane shell, and back to the
// title when the player quits. Task 1.10 builds the title and both seed options; character
// creation is not in the plan yet, so a run starts with the test character.

import { formatSeed } from '../core/rng.ts';
import { createPlayer } from '../game/game.ts';
import { Run, type RunOptions } from '../game/run.ts';
import type { CharacterPaneData } from './character-pane.ts';
import type { Grid } from './grid.ts';
import { type KeyInput, keyToCommand } from './input.ts';
import { Shell } from './shell.ts';
import { type RunChoice, TitleScreen, type TitleDeps } from './title.ts';

export interface AppDeps extends TitleDeps {
  /** A fresh character for a new run (test data until creation exists). */
  newCharacter: () => CharacterPaneData;
  /** Run options for a seed: the run layout and level sizes from the content (task 2.2). */
  runOptions?: (seed: number) => RunOptions;
}

export class App {
  title: TitleScreen | null = null;
  shell: Shell | null = null;

  constructor(private readonly deps: AppDeps) {
    this.openTitle();
  }

  /** Show the title screen with a freshly drawn random seed. */
  openTitle(): void {
    this.shell = null;
    this.title = new TitleScreen((choice) => this.startRun(choice), this.deps);
  }

  /** Start a run in the surface village. */
  startRun(choice: RunChoice): void {
    const character = this.deps.newCharacter();
    const combat = character.stats.find((s) => s.name === 'Combat')!;
    const player = createPlayer({
      combatStep: combat.step,
      combatDice: combat.current,
      combatMax: combat.max,
      ranged: { name: 'Sling', range: 6 }, // the test character's sling (Spec 05: 6 cells)
    });
    const shell = new Shell('', character);
    shell.onQuit = () => this.openTitle();
    shell.setRun(new Run(choice.seed, player, this.deps.runOptions?.(choice.seed))); // starts in the surface village
    const which = choice.daily ? `seed of the day ${choice.daily}` : 'random seed';
    shell.log.add({ kind: 'system', text: `New run, ${which}: ${formatSeed(choice.seed)}.` }, 1);
    this.title = null;
    this.shell = shell;
  }

  /** Handle a key press. Returns true if the key is in the key map, so the caller can stop the browser acting on it. */
  handleKey(e: KeyInput): boolean {
    if (this.shell) return this.shell.handleKey(e);
    const command = keyToCommand(e);
    if (!command) return false;
    this.title?.handle(command);
    return true;
  }

  draw(grid: Grid): void {
    if (this.shell) this.shell.draw(grid);
    else this.title?.draw(grid);
  }
}
