import './ui/fonts/font.css';
import { MessageLog } from './game/log.ts';
import { drawCharacterPane, type CharacterPaneData } from './ui/character-pane.ts';
import { Grid } from './ui/grid.ts';
import { drawLog } from './ui/log-pane.ts';
import { MAIN_PANE, drawPanes, inner } from './ui/panes.ts';
import { UI } from './ui/palette.ts';
import { mountScreen } from './ui/screen.ts';

// Task 1.4 demo: the three panes, the character pane and the log, drawn from
// test data as in the approved mockup. The map arrives in tasks 1.6 and 1.7.
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

const log = new MessageLog();
log.add({ kind: 'discovery', text: 'You enter the Goblin Warrens.' }, 1);
log.add({ kind: 'discovery', text: 'Scrawled on the wall: "The deep lift is watched."' }, 2);
log.add({ kind: 'warning', text: 'A rival delver slips past you, heading east.' }, 3);
for (let turn = 4; turn <= 6; turn++) log.add({ kind: 'system', text: 'You search.' }, turn);
log.add({ kind: 'combat', text: 'You hit the kobold. It dies.' }, 7);
log.add({ kind: 'loot', text: 'You pick up 42 gp.' }, 8);
log.add({ kind: 'warning', text: 'A goblin sees you!' }, 9);
log.add({ kind: 'system', text: 'Target: goblin, 6 away. Tab to cycle, Enter to fire.' }, 9);

const app = document.getElementById('app');
if (app) {
  const grid = new Grid();
  drawPanes(grid, 'Goblin Warrens, Level 7');
  const view = inner(MAIN_PANE);
  grid.text(view.x + 2, view.y + 1, 'Map goes here (task 1.7).', UI.label, UI.background);
  drawCharacterPane(grid, testCharacter);
  drawLog(grid, log, 9);
  void mountScreen(app, 'Px437 IBM VGA 9x16').then((renderer) => renderer.render(grid));
}
