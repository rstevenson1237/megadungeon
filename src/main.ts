import './ui/fonts/font.css';
import type { CharacterPaneData } from './ui/character-pane.ts';
import bundle from './generated/content-bundle.json';
import { type ContentBundle, contentVersionOf } from './core/schemas.ts';
import { Leaderboard } from './game/leaderboard.ts';
import { SaveSlot, idbStore } from './game/store.ts';
import { runOptionsFor } from './game/world.ts';
import { classById, classesFrom } from './rules/character/classes.ts';
import { createCharacter } from './rules/character/character.ts';
import { itemDataFrom } from './rules/items/magic.ts';
import { startingKit } from './rules/items/kit.ts';
import { spellsFrom } from './rules/magic/spells.ts';
import { App } from './ui/app.ts';
import { Grid } from './ui/grid.ts';
import { mountScreen } from './ui/screen.ts';

// The title screen, then a run from the surface village down through generated levels.
// The character is test data until character creation exists.
const thief = classById(bundle as ContentBundle, 'thief');
const testCharacter: CharacterPaneData = {
  name: 'Mara',
  className: 'Thief',
  level: 1,
  xp: 0,
  xpNext: 2000,
  bank: 20,
  carried: 0,
  stats: [
    { name: 'Combat', step: thief.start.combat, current: 1, max: 1 },
    { name: 'Skill', step: thief.start.skill, current: 1, max: 1 },
    { name: 'Magic', step: thief.start.magic, current: 1, max: 1 },
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
    saves: new SaveSlot(idbStore()),
    board: new Leaderboard(localStorage),
    flags: localStorage,
    contentVersion: contentVersionOf(bundle as ContentBundle),
    download,
    upload,
    onChange: () => redraw(),
    classOf: (id) => classesFrom(bundle as ContentBundle).find((c) => c.id === id),
    newCharacter: () => structuredClone(testCharacter),
    // The thief's rules state, so deposits level it up (Spec 03).
    rules: () => ({ character: createCharacter('Mara', thief), classDef: thief }),
    runOptions: (seed) => runOptionsFor(bundle as ContentBundle, seed),
    // Test data until character creation exists: the test character knows every spell, so each can be tried.
    startingSpells: () => spellsFrom(bundle as ContentBundle).map((s) => s.id),
    // The Thief's starting gear from the class table (Spec 05).
    kit: () => startingKit(classById(bundle as ContentBundle, 'thief').gear ?? [], itemDataFrom(bundle as ContentBundle)),
  });
  const grid = new Grid();
  void mountScreen(root, 'Px437 IBM VGA 9x16').then((renderer) => {
    redraw = (): void => {
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
