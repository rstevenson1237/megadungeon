// The application: the title screen, then a run in the three-pane shell, and back to the title when the player quits.
// It also owns what outlives a run (task 2.13, Spec 09): the one save slot, written only when the character rests and
// when a new run begins; the leaderboard; and the three ways on from a death.

import { formatSeed } from '../core/rng.ts';
import { type PlayerState, createPlayer } from '../game/game.ts';
import { Leaderboard, type TextStorage } from '../game/leaderboard.ts';
import { boardEntry, nextBank, recoverableItems } from '../game/lifecycle.ts';
import { SaveError, restoreRun, toSave } from '../game/save.ts';
import type { SaveSlot } from '../game/store.ts';
import type { Step } from '../rules/character/dice.ts';
import type { Character, ClassDef } from '../rules/character/character.ts';
import { describeItem } from '../rules/items/magic.ts';
import type { Kit } from '../rules/items/kit.ts';
import type { Item } from '../rules/items/types.ts';
import { Run, type RunOptions } from '../game/run.ts';
import type { CharacterPaneData } from './character-pane.ts';
import { type DeathChoice, DeathScreen } from './death.ts';
import type { Grid } from './grid.ts';
import { type KeyInput, keyToCommand } from './input.ts';
import { FULL_GRID, LeaderboardOverlay } from './leaderboard.ts';
import { Shell } from './shell.ts';
import { type RunChoice, TitleScreen, type TitleDeps } from './title.ts';

export interface AppDeps extends TitleDeps {
  /** A fresh character for a new run (test data until creation exists). */
  newCharacter: () => CharacterPaneData;
  /** Run options for a seed: the run layout and level sizes from the content (task 2.2). */
  runOptions?: (seed: number) => RunOptions;
  /** The spells a new character knows, and the major abilities with a rule in code (test data until creation exists). */
  startingSpells?: (seed: number) => string[];
  abilities?: readonly string[];
  /** What the new character carries and wields (test data until creation exists). */
  kit?: () => Kit;
  /** The character's rules state and class, so banking treasure can level it up (Spec 03; test data until creation exists). */
  rules?: () => { character: Character; classDef: ClassDef };
  /** The class of a saved character, to carry on playing it. */
  classOf?: (classId: string) => ClassDef | undefined;
  /** The one save slot of this browser (Spec 09); without it nothing is saved. */
  saves?: SaveSlot;
  /** The leaderboard in local storage (Spec 09). */
  board?: Leaderboard;
  /** Local storage for the one-time warning about clearing browser data. */
  flags?: TextStorage;
  /** The content bundle's version, which a save records (Spec 09). */
  contentVersion?: string;
  /** Give the player a file to keep, and ask them for one (the browser's download and file picker). */
  download?: (filename: string, text: string) => void;
  upload?: () => Promise<string | undefined>;
  /** A promise settled and something on screen changed: draw again. */
  onChange?: () => void;
  /** A new id for each character, for the leaderboard. */
  characterId?: (seed: number) => string;
}

/** What a new character on the seed brings from the one who died (Spec 09). */
interface Inheritance {
  bank: number;
  item?: Item | undefined;
}

const WARNED = 'megadungeon.warned';
const WARNING = 'Your save lives in this browser only: clearing site data deletes it. Export it from the game menu.';

export class App {
  title: TitleScreen | null = null;
  shell: Shell | null = null;
  death: DeathScreen | null = null;
  /** The full-grid leaderboard opened from the title screen. */
  leaderboard: LeaderboardOverlay | null = null;

  constructor(private readonly deps: AppDeps) {
    this.openTitle();
  }

  private get today(): string {
    return (this.deps.now?.() ?? new Date()).toISOString().slice(0, 10);
  }

  /** Show the title screen with a freshly drawn random seed. */
  openTitle(): void {
    this.shell = null;
    this.death = null;
    this.leaderboard = null;
    const warned = this.deps.flags?.getItem(WARNED) === '1';
    this.title = new TitleScreen((choice) => this.startRun(choice), {
      ...this.deps,
      onContinue: () => void this.continueGame(),
      ...(this.deps.board ? { onLeaderboard: () => (this.leaderboard = new LeaderboardOverlay(this.deps.board!, this.today, FULL_GRID)) } : {}),
      ...(this.deps.saves && !warned ? { warning: WARNING } : {}),
    });
    const title = this.title;
    void this.deps.saves?.exists().then(
      (has) => {
        title.hasSave = has;
        this.deps.onChange?.();
      },
      () => undefined,
    );
  }

  /** Start a run in the surface village, and save it at once so Continue always has something to load (Spec 09). */
  startRun(choice: RunChoice, inherit?: Inheritance): void {
    const character = this.deps.newCharacter();
    const kit = this.deps.kit?.();
    const rules = this.deps.rules?.();
    const combat = character.stats.find((s) => s.name === 'Combat')!;
    const pool = (name: 'Skill' | 'Magic') => {
      const stat = character.stats.find((s) => s.name === name);
      return stat ? { step: stat.step as Step, dice: stat.current, max: stat.max } : undefined;
    };
    // The rules character is the player's own record (Spec 03, Addendum A); without one, the pane's pools stand in.
    const start = rules
      ? { character: rules.character }
      : {
          combatStep: combat.step,
          combatDice: combat.current,
          combatMax: combat.max,
          ...(pool('Skill') ? { skill: pool('Skill')! } : {}),
          ...(pool('Magic') ? { magic: pool('Magic')! } : {}),
        };
    const player = createPlayer({
      ...start,
      spells: this.deps.startingSpells?.(choice.seed) ?? [],
      abilities: [...(this.deps.abilities ?? [])],
      ...(kit ? { pack: kit.pack, equipment: kit.equipment } : {}),
    });
    if (inherit) {
      player.town.bank = inherit.bank;
      if (inherit.item) player.pack.push(inherit.item);
    }
    const characterId = this.deps.characterId?.(choice.seed) ?? `${choice.seed >>> 0}-${Date.now().toString(36)}`;
    const run = new Run(choice.seed, player, {
      ...this.deps.runOptions?.(choice.seed),
      ...(rules ? { classDef: rules.classDef } : {}),
      characterId,
      ...(choice.daily ? { daily: choice.daily } : {}),
    }); // starts in the surface village
    const which = choice.daily ? `seed of the day ${choice.daily}` : 'random seed';
    this.enter(character, run, { kind: 'system', text: `New run, ${which}: ${formatSeed(choice.seed)}.` });
    this.save(false);
  }

  /** Continue: the saved run, standing in the village of its last rest (Spec 09). */
  async continueGame(): Promise<void> {
    const title = this.title;
    try {
      const save = await this.deps.saves?.read();
      if (!save) {
        if (title) title.notice = 'There is no saved game yet.';
        return;
      }
      const base = this.deps.runOptions?.(save.seed);
      const classDef = this.deps.classOf?.(save.player.classId) ?? this.deps.rules?.().classDef;
      const run = restoreRun(save, base ?? {}, classDef);
      const pane = this.deps.newCharacter();
      pane.name = save.player.name || pane.name;
      this.enter(pane, run, { kind: 'system', text: `Continuing at the village of your last rest. Seed ${formatSeed(save.seed)}.` });
    } catch (error) {
      if (title) title.notice = error instanceof SaveError ? error.message : `The save could not be read: ${String(error)}`;
    }
    this.deps.onChange?.();
  }

  /** Put a run on screen. */
  private enter(character: CharacterPaneData, run: Run, welcome: { kind: 'system'; text: string }): void {
    const shell = new Shell('', character);
    shell.onQuit = () => this.openTitle();
    shell.onMilestone = (kind) => this.milestone(shell, kind);
    shell.menuHost = {
      ...(this.deps.board ? { leaderboard: () => new LeaderboardOverlay(this.deps.board!, this.today) } : {}),
      ...(this.deps.saves && this.deps.download ? { exportSave: () => void this.exportSave(shell) } : {}),
      ...(this.deps.saves && this.deps.upload ? { importSave: () => void this.importSave(shell) } : {}),
    };
    run.onRest = () => this.save(true);
    shell.setRun(run);
    shell.log.add(welcome, 1);
    this.deps.flags?.setItem(WARNED, '1');
    this.title = null;
    this.death = null;
    this.shell = shell;
  }

  /** Write the save: only on a village rest, and when a new run begins (Spec 09). Never throws; says if it failed. */
  private save(announce: boolean): void {
    const shell = this.shell;
    const run = shell?.run;
    const { saves } = this.deps;
    if (!shell || !run || !saves) return;
    const data = toSave({ run, contentVersion: this.deps.contentVersion ?? 'unversioned', now: this.deps.now?.() ?? new Date() });
    void saves.write(data).then(
      () => {
        if (announce) shell.log.add({ kind: 'system', text: 'The game is saved.' }, run.round);
        this.deps.onChange?.();
      },
      (error: unknown) => {
        shell.log.add({ kind: 'warning', text: `The game could not be saved: ${String(error)}` }, run.round);
        this.deps.onChange?.();
      },
    );
  }

  private async exportSave(shell: Shell): Promise<void> {
    const text = await this.deps.saves?.exportText();
    const run = shell.run;
    if (text === undefined || !run) {
      shell.log.add({ kind: 'system', text: 'There is no save to export yet: rest at a village lodging first.' }, shell.turn);
    } else {
      this.deps.download?.(`megadungeon-${formatSeed(run.runSeed)}.save.json`, text);
      shell.log.add({ kind: 'system', text: 'The save is downloaded as a file.' }, shell.turn);
    }
    this.deps.onChange?.();
  }

  private async importSave(shell: Shell): Promise<void> {
    try {
      const text = await this.deps.upload?.();
      if (text === undefined) return;
      const save = await this.deps.saves!.importText(text);
      shell.log.add({ kind: 'system', text: `The save of ${save.player.name || 'a character'} is loaded into this browser. Quit to the title screen and choose Continue to play it.` }, shell.turn);
    } catch (error) {
      shell.log.add({ kind: 'warning', text: error instanceof SaveError ? error.message : `The file could not be read: ${String(error)}` }, shell.turn);
    }
    this.deps.onChange?.();
  }

  /** Death, reaching level 100 and defeating the final boss go on the leaderboard (Spec 09); a death then opens the death screen. */
  private milestone(shell: Shell, kind: 'death' | 'win' | 'final_boss'): void {
    const run = shell.run;
    if (!run) return;
    this.deps.board?.record(boardEntry(run, kind === 'death' ? 'died' : kind === 'win' ? 'reached_100' : 'final_boss', this.deps.now?.() ?? new Date()));
    if (kind !== 'death') return;
    const knowledge = run.ctx().knowledge;
    const { player, character } = run;
    this.death = new DeathScreen(
      {
        name: character.name || 'Nameless',
        className: run.classDef?.name ?? character.classId,
        level: character.level,
        depth: run.depth,
        cause: player.deathCause ?? 'Died',
        bank: player.town.bank,
        items: recoverableItems(player).map((item) => ({ item, label: describeItem(item, knowledge) })),
      },
      (choice) => void this.afterDeath(run, choice),
    );
  }

  /** The three ways on from a death (Spec 09). */
  private async afterDeath(dead: Run, choice: DeathChoice): Promise<void> {
    switch (choice.kind) {
      case 'new_seed':
        this.openTitle();
        break;
      case 'same_seed':
        this.startRun({ seed: dead.runSeed, ...(dead.daily ? { daily: dead.daily } : {}) }, { bank: nextBank(dead.player.town.bank), item: choice.item });
        break;
      case 'save':
        this.title = null;
        await this.continueGame();
        // No save to go back to (it is always offered, but the slot may be unreadable): fall back to the title.
        if (!this.shell || this.shell.run === dead) this.openTitle();
        break;
    }
    this.deps.onChange?.();
  }

  /** Handle a key press. Returns true if the key is in the key map, so the caller can stop the browser acting on it. */
  handleKey(e: KeyInput): boolean {
    const command = keyToCommand(e);
    if (this.leaderboard) {
      if (!command) return false;
      if (this.leaderboard.handle(command).close) this.leaderboard = null;
      return true;
    }
    if (this.death) {
      if (!command) return false;
      this.death.handle(command);
      return true;
    }
    if (this.shell) return this.shell.handleKey(e);
    if (!command) return false;
    this.title?.handle(command);
    return true;
  }

  draw(grid: Grid): void {
    if (this.leaderboard) this.leaderboard.draw(grid);
    else if (this.death) this.death.draw(grid);
    else if (this.shell) this.shell.draw(grid);
    else this.title?.draw(grid);
  }
}

export type { PlayerState };
