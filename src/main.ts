import './ui/fonts/font.css';
import type { CharacterPaneData } from './ui/character-pane.ts';
import { App } from './ui/app.ts';
import { Grid } from './ui/grid.ts';
import { mountScreen } from './ui/screen.ts';

// The title screen, then a run from the surface village down through generated levels.
// The character is test data until character creation exists.
const testCharacter: CharacterPaneData = {
  name: 'Mara',
  className: 'Thief',
  level: 3,
  xp: 5210,
  xpNext: 8000,
  bank: 1340,
  carried: 620,
  stats: [
    { name: 'Combat', step: 6, current: 1, max: 2 },
    { name: 'Skill', step: 8, current: 2, max: 2 },
    { name: 'Magic', step: 4, current: 1, max: 1 },
  ],
  equipment: [
    { name: 'Short sword', quality: 'Fine' },
    { name: 'Sling', quality: 'Normal' },
    { name: 'Leather', quality: 'Crude' },
    { name: 'Ring', quality: 'Unknown' },
  ],
  abilities: ['Backstab', 'Keen Eye', 'Light Step'],
  status: [],
  wait: { rounds: 3, needed: 10 },
  inventory: { used: 7, total: 12 },
  target: { name: 'Goblin', rating: 'd6', distance: 6, index: 1, count: 3 },
};

const root = document.getElementById('app');
if (root) {
  const app = new App({ newCharacter: () => structuredClone(testCharacter) });
  const grid = new Grid();
  void mountScreen(root, 'Px437 IBM VGA 9x16').then((renderer) => {
    const redraw = (): void => {
      app.draw(grid);
      renderer.render(grid);
    };
    window.addEventListener('keydown', (e) => {
      if (app.handleKey(e)) {
        e.preventDefault();
        redraw();
      }
    });
    redraw();
  });
}
