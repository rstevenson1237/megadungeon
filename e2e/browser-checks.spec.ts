import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { descend, newCharacter, openTitle, press, screen } from './play.ts';

// The browser checks of task 4.12 (plan: "Every spec's criteria pass in Chrome, Firefox and Safari"). Every rule is
// proved by the unit tests in Node; what can differ between browsers is the browser's own part, and these check it in
// each engine: the canvas fitting the window, the glyphs the font paints, the repaint, the keyboard, the overlays,
// and the two timing criteria (Spec 02, Spec 04). The smoke test (smoke.spec.ts) runs a whole loop in each engine too.

const HARNESS = 'http://localhost:5174/megadungeon/e2e/harness/';
const GOLDEN = new URL('./glyph-masks.json', import.meta.url);
const NATIVE_W = 900;
const NATIVE_H = 640;

/** Every engine records its measurements on the test, so the CI log shows them for each browser. */
const note = (type: string, description: string): void => {
  test.info().annotations.push({ type, description });
  console.log(`[${test.info().project.name}] ${type}: ${description}`);
};

async function openHarness(page: Page): Promise<void> {
  await page.goto(HARNESS);
  await page.waitForFunction(() => 'harness' in window);
}

test.describe('Spec 01: the grid fills the window, with its aspect kept and its glyphs crisp', () => {
  const sizes: [number, number][] = [[1280, 800], [1920, 1080], [1024, 768], [1366, 768], [800, 600], [2560, 1080]];
  for (const scale of [1, 2]) {
    test(`at device pixel ratio ${scale}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: scale });
      const page = await context.newPage();
      await openTitle(page);
      for (const [width, height] of sizes) {
        await page.setViewportSize({ width, height });
        // Wait for the resize to reach the page: the canvas then touches the window on one axis.
        await expect
          .poll(() => page.evaluate(({ w, h }) => {
            const r = document.querySelector('canvas')!.getBoundingClientRect();
            return r.right <= w + 0.01 && r.bottom <= h + 0.01 && Math.min(w - r.width, h - r.height) * devicePixelRatio <= 1.01;
          }, { w: width, h: height }))
          .toBe(true);
        const fit = await page.evaluate(() => {
          const c = document.querySelector('canvas')!;
          const r = c.getBoundingClientRect();
          return { w: r.width, h: r.height, x: r.left, y: r.top, rendering: getComputedStyle(c).imageRendering, cw: c.width, ch: c.height };
        });
        const size = `${width}x${height}@${scale}`;
        // The canvas stays at its native 900 x 640 and only its displayed size changes.
        expect([fit.cw, fit.ch], size).toEqual([NATIVE_W, NATIVE_H]);
        // Inside the window, centred, touching it on one axis (to the device pixel), with the aspect kept.
        expect(fit.x, size).toBeGreaterThanOrEqual(0);
        expect(fit.y, size).toBeGreaterThanOrEqual(0);
        expect(fit.x + fit.w, size).toBeLessThanOrEqual(width + 0.01);
        expect(fit.y + fit.h, size).toBeLessThanOrEqual(height + 0.01);
        expect(Math.min(width - fit.w, height - fit.h) * scale, size).toBeLessThanOrEqual(1.01);
        expect(Math.abs(fit.w / fit.h - NATIVE_W / NATIVE_H) * NATIVE_H, size).toBeLessThan(1.5);
        // Crisp: whole device pixels, placed on a device pixel, scaled without smoothing.
        for (const v of [fit.w, fit.h, fit.x, fit.y]) expect(Math.abs(v * scale - Math.round(v * scale)), size).toBeLessThan(0.01);
        expect(fit.rendering, size).toMatch(/pixelated|crisp-edges/);
      }
      await context.close();
    });
  }
});

test.describe('Spec 01: every glyph renders with its CP437 code', () => {
  test('the atlas the renderer bakes matches the font, glyph for glyph', async ({ page }) => {
    await openHarness(page);
    const masks = await page.evaluate(() => (window as unknown as { harness: { glyphMasks: () => Promise<string[]> } }).harness.glyphMasks());
    expect(masks).toHaveLength(256);
    const row = (code: number, y: number): string => masks[code]!.split('/')[y]!;
    // Blanks are blank; the full block fills the cell; box-drawing lines run the full cell, so borders join.
    for (const code of [0, 32, 255]) expect(masks[code]).not.toContain('#');
    expect(masks[219]).not.toContain('.');
    expect(masks[196]!.split('/').some((r) => r === '#########')).toBe(true); // ─
    expect(Array.from({ length: 16 }, (_, y) => row(179, y)).every((r) => r.includes('#'))).toBe(true); // │
    // Every other glyph paints something, and no two printable glyphs look the same.
    const printable = masks.filter((_, code) => code !== 0 && code !== 32 && code !== 255 && code !== 219);
    for (const m of printable) expect(m).toContain('#');
    // The same pixels in every engine: the masks were recorded once (UPDATE_GLYPHS=1) and each browser must match them.
    if (process.env.UPDATE_GLYPHS) writeFileSync(GOLDEN, `${JSON.stringify(masks, null, 1)}\n`);
    const golden = JSON.parse(readFileSync(GOLDEN, 'utf8')) as string[];
    const differ = masks.flatMap((m, code) => (m === golden[code] ? [] : [code]));
    expect(differ, `glyphs that differ from the recorded font: ${differ.join(', ')}`).toEqual([]);
  });
});

test.describe('Spec 01: the screen in play', () => {
  test.beforeEach(async ({ page }) => {
    // Count what the renderer paints on the screen canvas: one fillRect per repainted cell (src/ui/renderer.ts).
    await page.addInitScript(() => {
      const w = window as unknown as { painted: number };
      w.painted = 0;
      const fillRect = CanvasRenderingContext2D.prototype.fillRect;
      CanvasRenderingContext2D.prototype.fillRect = function (this: CanvasRenderingContext2D, ...args: Parameters<typeof fillRect>) {
        if (this.canvas.isConnected) w.painted++;
        return fillRect.apply(this, args);
      };
    });
    await openTitle(page);
    await newCharacter(page, 'Priest', 'Check');
  });

  const painted = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { painted: number }).painted);

  test('each overlay opens, takes keys, and closes with Esc', async ({ page }) => {
    await descend(page);
    await expect.poll(() => screen(page)).toMatch(/You descend to level \d+\./);
    const overlays: [string, string][] = [['?', 'Help'], ['m', 'Message History'], ['i', 'Inventory'], ['j', 'Journal'], ['c', 'Heal'], ['Escape', 'Game Menu']];
    for (const [key, title] of overlays) {
      const before = await screen(page);
      expect(before, title).not.toContain(`─ ${title} `);
      await press(page, key);
      await expect.poll(() => screen(page), title).toContain(title);
      await press(page, 's', 'w'); // keyboard input inside the overlay leaves it open
      expect(await screen(page), title).toContain(title);
      await press(page, 'Escape');
      expect(await screen(page), title).toBe(before);
    }
  });

  test('the help screen lists the whole key map', async ({ page }) => {
    await press(page, '?');
    const text = await screen(page);
    for (const key of ['W A S D / arrows', 'Space', 'Tab / Shift+Tab', 'Enter', 'Esc', 'Z', 'E', 'X', 'G', 'F', 'C', 'Q', 'I', 'L', 'M', '?', 'J']) {
      expect(text).toMatch(new RegExp(`│ ${key.replace(/[?/+]/g, '\\$&')} +\\S`));
    }
    expect(text).toContain('In menus, arrows or W/S move the selection and Enter confirms.');
  });

  test('a redraw after one round repaints only the changed cells', async ({ page }) => {
    await descend(page);
    await expect.poll(() => screen(page)).toMatch(/You descend to level \d+\./);
    const before = await painted(page);
    const text = await screen(page);
    await press(page, ' '); // wait one round: the log changes, the map does not move
    const after = await screen(page);
    const repainted = (await painted(page)) - before;
    const changed = [...after].filter((ch, i) => ch !== text[i]).length;
    note('cells repainted by one round', `${repainted} of 4000 (${changed} changed their glyph)`);
    expect(repainted).toBeGreaterThanOrEqual(changed);
    expect(repainted).toBeLessThan(1000);
  });

  test('keys the game does not use stay with the game, not the browser', async ({ page }) => {
    await descend(page);
    await page.evaluate(() => {
      const w = window as unknown as { kept: Record<string, boolean> };
      w.kept = {};
      window.addEventListener('keydown', (e) => (w.kept[e.key] = e.defaultPrevented));
    });
    await press(page, '/', "'", 'k', 'Control+f');
    const kept = await page.evaluate(() => (window as unknown as { kept: Record<string, boolean> }).kept);
    // Firefox's quick find opens on / and '; the page keeps them. Ctrl and the like stay the browser's.
    expect(kept['/']).toBe(true);
    expect(kept["'"]).toBe(true);
    expect(kept['k']).toBe(true);
    expect(kept['f']).toBe(false);
    // And the game still answers the keyboard: M opens the message history.
    await press(page, 'm');
    await expect.poll(() => screen(page)).toContain('Message History');
  });
});

test.describe('timing criteria', () => {
  test('Spec 02: a large level generates in under 50 ms', async ({ page }) => {
    await openHarness(page);
    const ms = await page.evaluate(() => (window as unknown as { harness: { largeLevelMs: () => number } }).harness.largeLevelMs());
    note('large level, mean of 40', `${ms.toFixed(1)} ms`);
    expect(ms).toBeLessThan(50);
  });

  test('Spec 04: a round on a crowded large level stays within the time budget', async ({ page }) => {
    await openHarness(page);
    const r = await page.evaluate(() =>
      (window as unknown as { harness: { turnBudget: () => { creatures: number; dead: boolean; mean: number; worst: number } } }).harness.turnBudget(),
    );
    note('round with 80 alert creatures', `mean ${r.mean.toFixed(2)} ms, worst ${r.worst.toFixed(1)} ms`);
    expect(r.creatures).toBe(80);
    expect(r.dead).toBe(false);
    expect(r.mean).toBeLessThan(5);
    expect(r.worst).toBeLessThan(50);
  });
});
