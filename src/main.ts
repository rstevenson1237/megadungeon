import './ui/fonts/font.css';
import type { CharacterPaneData } from './ui/character-pane.ts';
import { Grid } from './ui/grid.ts';
import { mountScreen } from './ui/screen.ts';
import { Shell } from './ui/shell.ts';

// Task 1.5 demo: the shell with its key map, overlays and log. The character is
// test data; the map arrives in tasks 1.6 and 1.7.
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

const app = document.getElementById('app');
if (app) {
  const shell = new Shell('Goblin Warrens, Level 7', testCharacter);
  shell.log.add({ kind: 'discovery', text: 'You enter the Goblin Warrens.' }, 1);
  shell.log.add({ kind: 'discovery', text: 'Scrawled on the wall: "The deep lift is watched."' }, 1);
  shell.log.add({ kind: 'warning', text: 'A rival delver slips past you, heading east.' }, 1);
  shell.log.add({ kind: 'system', text: 'Press ? for help, Esc for the menu.' }, 1);
  const grid = new Grid();
  void mountScreen(app, 'Px437 IBM VGA 9x16').then((renderer) => {
    const redraw = (): void => {
      shell.draw(grid);
      renderer.render(grid);
    };
    window.addEventListener('keydown', (e) => {
      if (shell.handleKey(e)) {
        e.preventDefault();
        redraw();
      }
    });
    redraw();
  });
}
