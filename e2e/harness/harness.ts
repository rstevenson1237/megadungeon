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
import { CELL_H, CELL_W } from '../../src/ui/grid.ts';
import { FROZEN } from '../../tests/frozen.ts';
import { crowdedGame, timeRounds } from '../../tests/turn-budget.ts';

// The browser checks of task 4.12 that need the game's own modules rather than the built page: the glyph atlas as the
// renderer bakes it, and the two timing criteria (Spec 02, a large level in under 50 ms; Spec 04, the turn budget).
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

Object.assign(window, { harness: { glyphMasks, largeLevelMs, turnBudget } });
