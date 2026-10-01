import './ui/fonts/font.css';
import type { CharacterPaneData } from './ui/character-pane.ts';
import { createPlayer } from './game/game.ts';
import { Run } from './game/run.ts';
import { seedOfTheDay } from './core/rng.ts';
import { Grid } from './ui/grid.ts';
import { mountScreen } from './ui/screen.ts';
import { Shell } from './ui/shell.ts';

// Task 1.9 demo: a run from the surface village down through generated levels and back up.
// The character is test data; the title screen and seed choice arrive in task 1.10.
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
  const shell = new Shell('', testCharacter);
  const runSeed = seedOfTheDay(new Date());
  const combat = testCharacter.stats.find((s) => s.name === 'Combat')!;
  const player = createPlayer({
    combatStep: combat.step,
    combatDice: combat.current,
    combatMax: combat.max,
    ranged: { name: 'Sling', range: 6 }, // the test character's sling (Spec 05: 6 cells)
  });
  shell.setRun(new Run(runSeed, player)); // starts in the surface village
  shell.log.add({ kind: 'system', text: 'Go down from the village, then E on a stair to change level. ? for help.' }, 1);
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
