import { expect, test, type Page } from '@playwright/test';
import { descend, newCharacter, press, screen } from './play.ts';

// The isometric smoke test of task 6.10 (Spec 01b, Tests: "the isometric display ... shows the targeting cursor"), in
// Chromium, Firefox and WebKit and in both time modes. The page is the whole game from the check harness, reading
// `?display=` and `?time=` as the built page does, so a goblin can be put in the Ranger's sight to aim at. The rest of
// the smoke test (a non-empty picture, the overlay over it, switching with text) runs on the built page in
// display.spec.ts, with the pack loaded from the Pages sub-path.

const GAME = 'http://localhost:5174/megadungeon/e2e/harness/game.html';
/** The targeting colour (Spec 01, Targeting; src/ui/palette.ts UI.target), which the cursor's diamond is drawn in. */
const TARGET = [0xe8, 0xc0, 0x40] as const;

interface Hooks {
  megadungeon: { screen: () => string; display: () => string; clock: () => { tick: number } | null };
  harness: { calm: () => void; placeTarget: () => boolean };
}

/** Lit pixels in the picture's view area, and those in the targeting colour. */
const probe = (page: Page): Promise<{ lit: number; target: number }> =>
  page.evaluate((target) => {
    const c = document.getElementById('picture') as HTMLCanvasElement;
    const data = c.getContext('2d')!.getImageData(9, 16, 630, 448).data;
    let lit = 0;
    let hits = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3]! > 0 && data[i]! + data[i + 1]! + data[i + 2]! > 30) lit++;
      if (data[i] === target[0] && data[i + 1] === target[1] && data[i + 2] === target[2]) hits++;
    }
    return { lit, target: hits };
  }, TARGET);

for (const time of ['turn', 'real'] as const) {
  test(`the isometric display shows the targeting cursor, ${time === 'turn' ? 'turn-based' : 'in real time'}`, async ({ page }) => {
    await page.goto(`${GAME}?display=iso&time=${time}`);
    await page.waitForFunction(() => 'megadungeon' in window && (window as unknown as Hooks).megadungeon.screen().includes('New game'));
    await newCharacter(page, 'Ranger', 'Aim');
    await descend(page);
    await expect.poll(() => screen(page)).toMatch(/You descend to level \d+\./);
    await page.evaluate(() => (window as unknown as Hooks).harness.calm());
    // The art arrives and the picture is drawn.
    await expect.poll(() => page.evaluate(() => (window as unknown as Hooks).megadungeon.display())).toBe('iso');
    await expect.poll(async () => (await probe(page)).lit).toBeGreaterThan(2000);
    if (time === 'real') {
      // The frame loop is running: ticks go by.
      const start = (await page.evaluate(() => (window as unknown as Hooks).megadungeon.clock()))!.tick;
      await expect.poll(async () => (await page.evaluate(() => (window as unknown as Hooks).megadungeon.clock()))!.tick).toBeGreaterThan(start + 2);
    }

    expect(await page.evaluate(() => (window as unknown as Hooks).harness.placeTarget())).toBe(true);
    const before = (await probe(page)).target;
    await press(page, 'f');
    await expect.poll(() => screen(page)).toContain('goblin');
    // The selected cell's diamond outline and the creature's frame, in the targeting colour.
    await expect.poll(async () => (await probe(page)).target).toBeGreaterThan(before + 40);
    await press(page, 'Escape');
    await expect.poll(async () => (await probe(page)).target).toBeLessThan(before + 20);
  });
}
