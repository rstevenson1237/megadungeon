import rawBundle from './generated/content-bundle.json';
import type { ContentBundle } from './core/schemas.ts';

const bundle: ContentBundle = rawBundle;

// Task 1.1 placeholder page: proves the build, the content bundle and the
// Pages deploy work end to end. The real renderer arrives in task 1.3.
const counts = Object.entries(bundle.tables)
  .map(([name, rows]) => `  ${name}: ${rows.length}`)
  .join('\n');

const app = document.getElementById('app');
if (app) {
  app.textContent = `MEGADUNGEON\n\nContent bundle loaded:\n${counts}\n`;
}
