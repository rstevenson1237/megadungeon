import './ui/fonts/font.css';
import bundle from './generated/content-bundle.json';
import { type ContentBundle, contentVersionOf } from './core/schemas.ts';
import { Leaderboard } from './game/leaderboard.ts';
import { creationContentOf } from './game/lifecycle.ts';
import { SaveSlot, idbStore } from './game/store.ts';
import { runOptionsFor } from './game/world.ts';
import { App, type AppDeps } from './ui/app.ts';
import { FrameLoop } from './ui/frame-loop.ts';
import { Grid } from './ui/grid.ts';
import { claimsKey, keyToCommand } from './ui/input.ts';
import { mountScreen } from './ui/screen.ts';
import { timeParam } from './ui/title.ts';

// The game in a page: the title screen, character creation, then a run from the surface village down through
// generated levels. `src/main.ts` mounts it; the browser checks' harness mounts it too, with its own options.

/** Give the player a file: the browser's download (Spec 09, export). */
function download(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Ask the player for a file and read its text (Spec 09, import); undefined if they close the picker. */
function upload(): Promise<string | undefined> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => void (input.files?.[0]?.text() ?? Promise.resolve(undefined)).then(resolve);
    input.oncancel = () => resolve(undefined);
    input.click();
  });
}

/**
 * Put the game in `root`, with the browser's keys, focus and animation frames wired to it, and return the app.
 * `options` adds to the app's deps.
 */
export function mountGame(root: HTMLElement, options: Partial<AppDeps> = {}): App {
  let redraw = (): void => undefined;
  const app = new App({
    // The one save slot of this browser, the leaderboard and the one-time warning live in the browser (Spec 09).
    saves: new SaveSlot(idbStore(), contentVersionOf(bundle as ContentBundle)),
    board: new Leaderboard(localStorage),
    flags: localStorage,
    contentVersion: contentVersionOf(bundle as ContentBundle),
    download,
    upload,
    onChange: () => redraw(),
    runOptions: (seed) => runOptionsFor(bundle as ContentBundle, seed),
    creation: creationContentOf(bundle as ContentBundle),
    ...(timeParam(location.search) ? { time: timeParam(location.search) } : {}),
    ...options,
  });
  const grid = new Grid();
  void mountScreen(root, 'Px437 IBM VGA 9x16').then((renderer) => {
    redraw = (): void => {
      app.draw(grid);
      renderer.render(grid);
    };
    // The text of the screen as last drawn, and the clock of a level, read-only, for the browser checks (plan, tasks
    // 3.11 and 5.5): the canvas has no text of its own.
    const clock = () => {
      const game = app.clock?.game;
      return game ? { tick: game.tick, round: game.state.round, ticking: app.clock!.ticking } : null;
    };
    Object.assign(window, { megadungeon: { screen: (): string => grid.lines().join('\n'), clock } });
    window.addEventListener('keydown', (e) => {
      // Real time ignores the browser's own key repeat: a held movement key steps once per cooldown (Spec 01, Addendum B).
      if (e.repeat && app.realTime) {
        if (keyToCommand(e) || claimsKey(e)) e.preventDefault();
        return;
      }
      if (app.handleKey(e)) {
        e.preventDefault();
        redraw();
      } else if (claimsKey(e)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => app.handleKeyUp(e));
    // A hidden tab or a window without focus pauses real time (Spec 01, Addendum B).
    const lost = (): void => {
      app.loseFocus();
      redraw();
    };
    document.addEventListener('visibilitychange', () => document.hidden && lost());
    window.addEventListener('blur', lost);
    // Real time's frame loop: each frame turns elapsed time into ticks. In turn mode, a village or any other screen it
    // runs no tick and draws nothing, so the screen still redraws only after an action.
    const loop = new FrameLoop(() => app.clock, redraw);
    const frame = (now: number): void => {
      loop.frame(now);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
    redraw();
  });
  return app;
}
