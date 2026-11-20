import '../../src/ui/fonts/font.css';
import bundle from '../../src/generated/content-bundle.json';
import type { ContentBundle } from '../../src/core/schemas.ts';
import { gameContentOf } from '../../src/game/content.ts';
import { runOptionsFor } from '../../src/game/world.ts';
import { itemDataFrom } from '../../src/rules/items/magic.ts';
import { spellsFrom } from '../../src/rules/magic/spells.ts';
import { generateLevel } from '../../src/rules/world/generate.ts';
import { isVillageLevel } from '../../src/rules/world/run-layout.ts';
import { CanvasAtlas, fontMaskSource } from '../../src/ui/atlas.ts';
import { CELL_H, CELL_W, NATIVE_H, NATIVE_W } from '../../src/ui/grid.ts';
import { FROZEN } from '../../tests/frozen.ts';
import { applyStatus } from '../../src/rules/magic/status.ts';
import { crowdedGame, fightCrowd, surround, timeRounds, timeTicks } from '../../tests/turn-budget.ts';
import { crowdedView, timeFrames } from '../../tests/iso-budget.ts';
import { loadIsoArt } from '../../src/ui/art/iso-art.ts';
import { buildIsoDraws } from '../../src/ui/iso-view.ts';
import { FloorLayer, paintPicture } from '../../src/ui/iso-paint.ts';
import { mapLook } from '../../src/ui/palette.ts';

// The browser checks of task 4.12 that need the game's own modules rather than the built page: the glyph atlas as the
// renderer bakes it, and the timing criteria (Spec 02, a large level in under 50 ms; Spec 04, the turn budget, and in
// real time the tick budget of task 5.7; Spec 01b, the isometric frame budget of task 6.10).
// The Vite dev server serves this page to Playwright (playwright.config.ts); it is not part of the build.

const BUNDLE = bundle as ContentBundle;
const FONT = 'Px437 IBM VGA 9x16';

/**
 * Every glyph of the atlas as the screen draws it, white on black: 256 strings of 16 rows of 9 bits, '#' for a lit
 * pixel and '.' for an unlit one. The atlas is the real one the renderer uses, baked from the bundled font.
 */
async function glyphMasks(): Promise<string[]> {
  await document.fonts.load(`${CELL_H}px "${FONT}"`);
  const atlas = new CanvasAtlas((w, h) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }, fontMaskSource(`"${FONT}"`));
  const screen = document.createElement('canvas');
  screen.width = CELL_W;
  screen.height = CELL_H;
  const ctx = screen.getContext('2d', { willReadFrequently: true })!;
  const masks: string[] = [];
  for (let code = 0; code < 256; code++) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CELL_W, CELL_H);
    atlas.draw(ctx, code, 0xffffff, 0, 0);
    const data = ctx.getImageData(0, 0, CELL_W, CELL_H).data;
    let rows = '';
    for (let y = 0; y < CELL_H; y++) {
      for (let x = 0; x < CELL_W; x++) rows += data[(y * CELL_W + x) * 4]! >= 128 ? '#' : '.';
      if (y < CELL_H - 1) rows += '/';
    }
    masks.push(rows);
  }
  return masks;
}

/** Spec 02: the mean time to generate 40 large levels with all their contents, as `tests/placement.test.ts` measures. */
function largeLevelMs(): number {
  const times: number[] = [];
  for (let seed = 1; times.length < 40 && seed < 400; seed++) {
    const options = runOptionsFor(BUNDLE, seed);
    for (let depth = 21; depth <= 99 && times.length < 40; depth += 9) {
      if (options.sizeFor!(depth) !== 'large' || isVillageLevel(options.layout!, depth)) continue;
      const contents = options.contentsFor!(depth)!;
      const start = performance.now();
      generateLevel(seed, depth, 'large', options.styleFor!(depth), contents);
      times.push(performance.now() - start);
    }
  }
  return times.reduce((a, b) => a + b, 0) / times.length;
}

/** Spec 04, the turn budget: rounds on a large level crowded with 80 alert creatures, as `tests/turn-budget.test.ts` runs them. */
function turnBudget(): { creatures: number; dead: boolean; mean: number; worst: number } {
  const game = crowdedGame({ levels: FROZEN, spells: spellsFrom(BUNDLE), items: itemDataFrom(BUNDLE), content: gameContentOf(BUNDLE) }, 80);
  timeRounds(game, 20); // warm up the engine before measuring
  const { mean, worst } = timeRounds(game, 300);
  return { creatures: game.state.monsters.length, dead: game.state.player.dead, mean, worst };
}

/**
 * Spec 04, Addendum B, the tick budget: real-time rounds on the same crowded level, a tick at a time as the frame loop
 * runs them, as `tests/creature-schedules.test.ts` (the player idle) and `tests/turn-budget.test.ts` (the player
 * fighting 40 of the crowd, Hasted) run them.
 */
function tickBudget(fighting: boolean): { creatures: number; dead: boolean; mean: number; worst: number; worstTick: number } {
  const game = crowdedGame({ levels: FROZEN, spells: spellsFrom(BUNDLE), items: itemDataFrom(BUNDLE), content: gameContentOf(BUNDLE) }, 80, 'real');
  const creatures = game.state.monsters.length;
  let player: Parameters<typeof timeTicks>[2];
  if (fighting) {
    applyStatus(game.state.player.statuses, 'hasted', 10_000);
    surround(game, 40);
    player = (g) => {
      g.state.player.pools.combat.dice = g.state.player.pools.combat.max; // never let the test character die
      fightCrowd(g);
    };
  }
  timeTicks(game, 20, player); // warm up the engine before measuring
  return { creatures, dead: game.state.player.dead, ...timeTicks(game, 300, player) };
}

/**
 * Spec 01b, the isometric frame budget (task 6.10): frames of a large level with 80 creatures in view, each built and
 * painted as the page does it (the draw list, then the picture with the real art pack, the cached floor layer and the
 * compass), one to an animation frame, with the animation clock running 50 ms a frame so the idle and liquid loops
 * turn over. The first frame, which cuts and recolours every frame it draws for the first time, is timed on its own;
 * then 30 frames warm the engine up and 300 are measured.
 */
async function frameBudget(): Promise<{ creatures: number; first: number; mean: number; worst: number; p99: number; over16: number }> {
  await document.fonts.load(`${CELL_H}px "${FONT}"`);
  const atlas = new CanvasAtlas((w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h }), fontMaskSource(`"${FONT}"`));
  const art = await loadIsoArt(`${import.meta.env.BASE_URL}art/main/pack.json`);
  const game = crowdedView({ levels: BUNDLE, spells: spellsFrom(BUNDLE), items: itemDataFrom(BUNDLE), content: gameContentOf(BUNDLE) });
  const depth = game.state.map.level.depth;
  const look = mapLook(runOptionsFor(BUNDLE, game.runSeed).themeFor?.(depth));
  art.look = look;
  const canvas = Object.assign(document.createElement('canvas'), { width: NATIVE_W, height: NATIVE_H });
  document.body.append(canvas);
  const ctx = canvas.getContext('2d')!;
  const floor = new FloorLayer(() => {
    const layer = Object.assign(document.createElement('canvas'), { width: NATIVE_W, height: NATIVE_H });
    return { image: layer, ctx: layer.getContext('2d')! };
  });
  const frame = (clock: number): void => {
    const motion = { clock, actors: new Map(), effects: [], ghosts: [], facings: new Map() };
    ctx.clearRect(0, 0, NATIVE_W, NATIVE_H);
    paintPicture(ctx, { draws: buildIsoDraws(game.state, { look, pack: art.ids, motion }), dimmed: false }, atlas, art, floor);
  };
  // Each frame is drawn in an animation frame of its own, as the game's loop draws them (src/mount.ts).
  const next = (): Promise<number> => new Promise((resolve) => requestAnimationFrame(resolve));
  const first = (await timeFrames(1, frame, 0, next)).worst;
  await timeFrames(30, frame, 50, next);
  return { creatures: game.state.monsters.length, first, ...(await timeFrames(300, frame, 1600, next)) };
}

Object.assign(window, { harness: { glyphMasks, largeLevelMs, turnBudget, tickBudget, frameBudget } });
