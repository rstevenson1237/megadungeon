// The UI shell: owns the log, the overlay stack and the screen. Turns key
// presses into commands, gives them to the top overlay, or else to the game.

import { COMMAND_NAMES, type Command } from '../game/commands.ts';
import { MessageLog } from '../game/log.ts';
import { drawCharacterPane, type CharacterPaneData } from './character-pane.ts';
import type { Grid } from './grid.ts';
import { type KeyInput, keyToCommand } from './input.ts';
import { drawLog } from './log-pane.ts';
import type { Overlay, OverlayResult } from './overlay.ts';
import { HelpOverlay, HistoryOverlay, gameMenu } from './overlays.ts';
import { MAIN_PANE, drawPanes, inner } from './panes.ts';
import { UI } from './palette.ts';
import { drawMap } from './map-view.ts';
import type { Game } from '../game/game.ts';
import { type Targeting, startTargeting } from '../game/targeting.ts';
import { ratingText } from '../game/monsters.ts';

export class Shell {
  readonly log = new MessageLog();
  readonly overlays: Overlay[] = [];
  /** The round, from the game once a level is loaded; messages from this round draw bright. */
  turn = 1;
  /** The running game; null until a level is loaded (tasks 1.9 and 1.10 manage levels and runs). */
  game: Game | null = null;
  /** Set while the player is choosing a target (a free action: no round passes). */
  targeting: Targeting | null = null;

  constructor(
    public title: string,
    public character: CharacterPaneData,
  ) {}

  /** Handle a key press. Returns true if the key is in the key map, so the caller can stop the browser acting on it. */
  handleKey(e: KeyInput): boolean {
    const command = keyToCommand(e);
    if (!command) return false;
    const top = this.overlays[this.overlays.length - 1];
    if (top) this.apply(top.handle(command), top);
    else this.play(command);
    return true;
  }

  private apply(result: OverlayResult, from: Overlay): void {
    if (result.message) this.log.add(result.message, this.turn);
    if (result.close) this.overlays.splice(this.overlays.indexOf(from), 1);
    if (result.open) this.overlays.push(result.open);
  }

  // Commands with no open overlay. Those whose systems are not built yet say so in the log.
  private play(command: Command): void {
    if (this.targeting) {
      this.target(command);
      return;
    }
    switch (command.type) {
      case 'cancel':
        this.overlays.push(gameMenu());
        return;
      case 'history':
        this.overlays.push(new HistoryOverlay(this.log, this.turn));
        return;
      case 'help':
        this.overlays.push(new HelpOverlay());
        return;
      case 'ranged':
        if (this.game) {
          this.startTargeting();
          return;
        }
        break;
      default: {
        const result = this.game?.act(command);
        if (result) {
          for (const m of result.messages) this.log.add(m, this.game!.state.round);
          this.afterAction();
          return;
        }
      }
    }
    this.log.add({ kind: 'system', text: `${COMMAND_NAMES[command.type]} is not yet available.` }, this.turn);
  }

  /** Bring the round counter and the character pane's Combat pool in line with the game. */
  private afterAction(): void {
    const game = this.game!;
    this.turn = game.state.round;
    const combat = this.character.stats.find((s) => s.name === 'Combat');
    if (combat) {
      combat.current = game.state.player.combatDice;
      combat.max = game.state.player.combatMax;
    }
  }

  private startTargeting(): void {
    const game = this.game!;
    const weapon = game.state.player.ranged;
    if (!weapon) {
      this.log.add({ kind: 'system', text: 'You have no ranged weapon readied.' }, this.turn);
      return;
    }
    const targeting = startTargeting(game, { range: weapon.range, shape: { kind: 'single' } });
    if (!targeting) {
      this.log.add({ kind: 'system', text: 'There is no valid target.' }, this.turn);
      return;
    }
    this.targeting = targeting;
    this.showTarget();
  }

  private showTarget(): void {
    const t = this.targeting;
    this.character.target = t ? t.paneTarget(ratingText(t.selected)) : undefined;
  }

  // Keys while choosing a target: Tab cycles, Enter confirms, Esc cancels. Nothing else acts.
  private target(command: Command): void {
    const t = this.targeting!;
    switch (command.type) {
      case 'nextTarget':
        t.next();
        break;
      case 'prevTarget':
        t.prev();
        break;
      case 'confirm':
        // The shot itself needs weapons and ammunition (task 2.9); no turn is spent.
        this.log.add({ kind: 'system', text: `You aim at the ${t.selected.name}. Ranged attacks are not yet available.` }, this.turn);
        this.targeting = null;
        break;
      case 'cancel':
        this.targeting = null;
        break;
      default:
        return;
    }
    this.showTarget();
  }

  /** Draw the whole screen: panes, character, log, then any overlay on top. */
  draw(grid: Grid): void {
    drawPanes(grid, this.title);
    if (this.game) drawMap(grid, this.game.state, this.targeting);
    else grid.text(inner(MAIN_PANE).x + 2, inner(MAIN_PANE).y + 1, 'No level loaded.', UI.label, UI.background);
    drawCharacterPane(grid, this.character);
    drawLog(grid, this.log, this.turn);
    for (const overlay of this.overlays) overlay.draw(grid, this.turn);
  }
}
