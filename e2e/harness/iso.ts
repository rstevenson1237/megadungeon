import '../../src/ui/fonts/font.css';
import bundle from '../../src/generated/content-bundle.json';
import type { ContentBundle } from '../../src/core/schemas.ts';
import { gameContentOf } from '../../src/game/content.ts';
import { Game, createPlayer } from '../../src/game/game.ts';
import { creature } from '../../src/game/monsters.ts';
import { runOptionsFor } from '../../src/game/world.ts';
import { itemDataFrom } from '../../src/rules/items/magic.ts';
import { applyStatus } from '../../src/rules/magic/status.ts';
import { spellsFrom } from '../../src/rules/magic/spells.ts';
import { generateLevel } from '../../src/rules/world/generate.ts';
import { CanvasAtlas, fontMaskSource } from '../../src/ui/atlas.ts';
import { CELL_H, NATIVE_H, NATIVE_W } from '../../src/ui/grid.ts';
import { paintIso } from '../../src/ui/iso-paint.ts';
import { buildIsoDraws } from '../../src/ui/iso-view.ts';
import { mapLook } from '../../src/ui/palette.ts';
import { fitScale } from '../../src/ui/viewport.ts';

// The isometric check page of task 6.3: a generated level drawn by the isometric renderer with no art (the glyph
// fallback alone), on its own, without the shell (the game itself has it behind the display flag since task 6.4). `?seed=` and `?depth=` choose the level; W A S D
// walk; `harness.frame()` times one build and paint. The Vite dev server serves it; it is not part of the build.

const BUNDLE = bundle as ContentBundle;
const FONT = 'Px437 IBM VGA 9x16';
const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? 1);
const depth = Number(params.get('depth') ?? 3);

const options = runOptionsFor(BUNDLE, seed);
const level = generateLevel(seed, depth, options.sizeFor!(depth), options.styleFor!(depth), options.contentsFor!(depth));
const content = gameContentOf(BUNDLE);
const game = new Game(seed, level, createPlayer({ combatStep: 12, combatDice: 6, combatMax: 6 }), { spells: spellsFrom(BUNDLE), items: itemDataFrom(BUNDLE), content });
const look = mapLook(options.themeFor?.(depth));

await document.fonts.load(`${CELL_H}px "${FONT}"`);
const atlas = new CanvasAtlas((w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h }), fontMaskSource(`"${FONT}"`));
const canvas = Object.assign(document.createElement('canvas'), { width: NATIVE_W, height: NATIVE_H });
canvas.style.position = 'absolute';
canvas.style.imageRendering = 'pixelated';
document.getElementById('app')!.append(canvas);
const fit = (): void => {
  const f = fitScale(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
  Object.assign(canvas.style, { width: `${f.width}px`, height: `${f.height}px`, left: `${f.left}px`, top: `${f.top}px` });
};
fit();
window.addEventListener('resize', fit);
const ctx = canvas.getContext('2d')!;

function draw(): void {
  paintIso(ctx, buildIsoDraws(game.state, { look }), atlas);
}

/** Put a few marked things next to the player, so the page shows a ring, a boss card and the phantom. */
function people(): void {
  const { x, y } = game.state.map.player;
  const ally = creature({ id: 900_001, name: 'skeleton', glyph: 'z', colour: 0xe0c050, x: x + 1, y, dice: 2, modifier: 0, kind: 'ally', ally: 'raised' });
  const phantom = creature({ id: 900_002, name: 'phantom', glyph: '@', colour: 0xffffff, x, y: y + 1, dice: 1, modifier: 0, kind: 'ally', ally: 'phantom' });
  applyStatus(game.state.player.statuses, 'blessed', 5);
  game.state.monsters.push(ally, phantom);
  game.refreshSight();
  draw();
}

/** Mean and slowest milliseconds to build and paint one frame, over `n` frames. */
function frame(n = 60): { mean: number; worst: number } {
  let worst = 0;
  const start = performance.now();
  for (let i = 0; i < n; i++) {
    const t = performance.now();
    draw();
    worst = Math.max(worst, performance.now() - t);
  }
  return { mean: (performance.now() - start) / n, worst };
}

const DIRS: Record<string, [number, number]> = { w: [0, -1], a: [-1, 0], s: [0, 1], d: [1, 0] };
window.addEventListener('keydown', (e) => {
  const dir = DIRS[e.key.toLowerCase()];
  if (!dir) return;
  game.act({ type: 'move', dx: dir[0], dy: dir[1] });
  draw();
});

draw();
Object.assign(window, { harness: { ready: true, frame, people, walk: (keys: string) => { for (const k of keys) { const d = DIRS[k]!; game.act({ type: 'move', dx: d[0], dy: d[1] }); } draw(); } } });
