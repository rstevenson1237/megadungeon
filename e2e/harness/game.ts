import { mountGame } from '../../src/mount.ts';
import { installHooks } from './hooks.ts';

// The isometric smoke test's page (task 6.10): the whole game as the built page mounts it, reading `?display=` and
// `?time=` as the page does, with the helpers of hooks.ts so the check can put a target in sight. The Vite dev server
// serves this page to Playwright; it is not in the build.

installHooks(mountGame(document.getElementById('app')!));
