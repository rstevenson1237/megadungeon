import './ui/fonts/font.css';
import bundle from './generated/content-bundle.json';
import { type ContentBundle, contentVersionOf } from './core/schemas.ts';
import { Leaderboard } from './game/leaderboard.ts';
import { creationContentOf } from './game/lifecycle.ts';
import { SaveSlot, idbStore } from './game/store.ts';
import { runOptionsFor } from './game/world.ts';
import { App } from './ui/app.ts';
import { Grid } from './ui/grid.ts';
import { mountScreen } from './ui/screen.ts';

// The title screen, character creation, then a run from the surface village down through generated levels.

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

const root = document.getElementById('app');
if (root) {
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
  });
  const grid = new Grid();
  void mountScreen(root, 'Px437 IBM VGA 9x16').then((renderer) => {
    redraw = (): void => {
      app.draw(grid);
      renderer.render(grid);
    };
    // The text of the screen as last drawn, read-only, for the browser smoke test (plan, task 3.11): the canvas has no text of its own.
    Object.assign(window, { megadungeon: { screen: (): string => grid.lines().join('\n') } });
    window.addEventListener('keydown', (e) => {
      if (app.handleKey(e)) {
        e.preventDefault();
        redraw();
      }
    });
    redraw();
  });
}
