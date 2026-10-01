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
import type { MapState } from '../game/map-state.ts';
import { stepPlayer } from '../game/map-state.ts';

export class Shell {
  readonly log = new MessageLog();
  readonly overlays: Overlay[] = [];
  /** Turns taken so far. Task 1.8 makes actions advance it. */
  turn = 1;
  /** The current level's map; null until a level is loaded (tasks 1.8 to 1.10 manage it). */
  map: MapState | null = null;

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
    switch (command.type) {
      case 'move':
        if (this.map) {
          stepPlayer(this.map, command.dx, command.dy);
          return;
        }
        break;
      case 'cancel':
        this.overlays.push(gameMenu());
        return;
      case 'history':
        this.overlays.push(new HistoryOverlay(this.log, this.turn));
        return;
      case 'help':
        this.overlays.push(new HelpOverlay());
        return;
      default:
        break;
    }
    this.log.add({ kind: 'system', text: `${COMMAND_NAMES[command.type]} is not yet available.` }, this.turn);
  }

  /** Draw the whole screen: panes, character, log, then any overlay on top. */
  draw(grid: Grid): void {
    drawPanes(grid, this.title);
    if (this.map) drawMap(grid, this.map);
    else grid.text(inner(MAIN_PANE).x + 2, inner(MAIN_PANE).y + 1, 'No level loaded.', UI.label, UI.background);
    drawCharacterPane(grid, this.character);
    drawLog(grid, this.log, this.turn);
    for (const overlay of this.overlays) overlay.draw(grid, this.turn);
  }
}
