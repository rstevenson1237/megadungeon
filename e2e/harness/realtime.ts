import { mountGame } from '../../src/mount.ts';
import { installHooks } from './hooks.ts';

// The browser check of task 5.5: the whole game, as the page mounts it, with new runs in real time, as `?time=real` presets
// them on the page (task 5.6), and the helpers of hooks.ts. The Vite dev server serves this page to Playwright; it is not in the build.

installHooks(mountGame(document.getElementById('app')!, { time: 'real' }));
