import { mountGame } from './mount.ts';

// The page's entry: the game, turn-based unless a run says otherwise.
const root = document.getElementById('app');
if (root) mountGame(root);
