import rawBundle from './generated/content-bundle.json';
import type { ContentBundle } from './core/schemas.ts';
import { GLYPH } from './ui/cp437.ts';
import { COLS, Grid } from './ui/grid.ts';
import { mountScreen } from './ui/screen.ts';

const bundle: ContentBundle = rawBundle;

// Task 1.3 demo: the renderer showing the core glyph table and the content
// bundle counts. The real panes arrive in task 1.4.
const app = document.getElementById('app');
if (app) {
  const grid = new Grid();
  const white = 0xaaaaaa;
  grid.text(2, 1, 'MEGADUNGEON', 0xffff55, 0);
  let row = 3;
  for (const [name, rows] of Object.entries(bundle.tables)) grid.text(2, row++, `${name}: ${rows.length}`, white, 0);
  row++;
  let x = 2;
  for (const [name, code] of Object.entries(GLYPH)) {
    const label = `${name}`;
    if (x + label.length + 3 > COLS - 2) {
      x = 2;
      row++;
    }
    grid.set(x, row, code, 0x55ffff, 0);
    grid.text(x + 2, row, label, white, 0);
    x += label.length + 4;
  }
  row += 2;
  const box = '┌──────────┐│          │└──────────┘';
  for (let r = 0; r < 3; r++) grid.text(2, row + r, [...box].slice(r * 12, r * 12 + 12).join(''), white, 0);
  grid.text(15, row + 1, 'Ω ≈ ░▒▓█ ☺', 0x55ff55, 0);

  app.replaceChildren();
  const family = '"Px437 IBM VGA 9x16", "DejaVu Sans Mono", monospace';
  mountScreen(app, family).render(grid);
}
