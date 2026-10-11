import { mountGame } from './mount.ts';

// The page's entry: the game, with new runs turn-based unless the title's time row or `?time=` says real time.
const root = document.getElementById('app');
if (root) mountGame(root);
