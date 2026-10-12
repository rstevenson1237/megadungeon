import { expect, test, type Page } from '@playwright/test';
import { choose, descend, newCharacter, press, screen } from './play.ts';

// The browser check of task 6.4 (Spec 01, Addendum B; Spec 01b): on the built page, `?display=iso` draws the level as
// the isometric picture beneath the text, an overlay dims it, look's cursor draws on it, and the game menu's display
// row switches back to text and again to isometric, remembered by the browser.

/** What the picture canvas holds in the view area: lit pixels, pure white ones, and the mean brightness. */
interface Probe {
  lit: number;
  white: number;
  mean: number;
}

const probe = (page: Page): Promise<Probe> =>
  page.evaluate(() => {
    const c = document.getElementById('picture') as HTMLCanvasElement;
    const data = c.getContext('2d')!.getImageData(9, 16, 630, 448).data;
    let lit = 0;
    let white = 0;
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i]! + data[i + 1]! + data[i + 2]!;
      if (data[i + 3]! > 0 && v > 30) lit++;
      if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) white++;
      sum += v;
    }
    return { lit, white, mean: sum / (data.length / 4) };
  });

const display = (page: Page): Promise<string> =>
  page.evaluate(() => (window as unknown as { megadungeon: { display: () => string } }).megadungeon.display());

async function open(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForFunction(() => 'megadungeon' in window && (window as unknown as { megadungeon: { screen: () => string } }).megadungeon.screen().includes('New game'));
}

/** The game menu's display row, chosen: Enter switches it and the menu stays open. */
async function switchDisplay(page: Page, from: string): Promise<void> {
  await press(page, 'Escape');
  expect(await choose(page, `Display: ${from}`)).toBe(true);
  await press(page, 'Escape');
}

test('the isometric display draws the level, dims under an overlay, shows look, and switches with text', async ({ page }) => {
  await open(page, './?display=iso');
  await newCharacter(page, 'Warrior', 'Iso');
  // In the village the menu is text and nothing is drawn beneath it.
  expect((await probe(page)).lit).toBe(0);
  await descend(page);
  await expect.poll(() => screen(page)).toMatch(/You descend to level \d+\./);
  expect(await display(page)).toBe('iso');

  // The picture is drawn, and the text leaves the view area clear: no map glyphs in it.
  await expect.poll(async () => (await probe(page)).lit).toBeGreaterThan(2000);
  // The art pack (task 6.5) loaded: the display did not fall back to text.
  expect(await screen(page)).not.toContain('could not be loaded');
  expect(await display(page)).toBe('iso');
  const shown = await probe(page);
  const viewText = (await screen(page)).split('\n').slice(1, 29).map((r) => r.slice(1, 71)).join('');
  expect(viewText.replace(/[\s\0]/g, '')).toBe('');

  // The game menu over the dimmed picture.
  await press(page, 'Escape');
  expect(await screen(page)).toContain('Game Menu');
  const dimmed = await probe(page);
  expect(dimmed.mean).toBeLessThan(shown.mean * 0.5);
  expect(dimmed.lit).toBeGreaterThan(0);
  await press(page, 'Escape');
  expect((await probe(page)).mean).toBeCloseTo(shown.mean, 0);

  // Look's cursor: a white diamond on the picture, the description on the bottom row.
  await press(page, 'l');
  expect((await probe(page)).white).toBeGreaterThan(shown.white + 20);
  await press(page, 'Escape');

  // Switch to text: the map is text again and the picture is cleared; then back, and the browser remembers it.
  await switchDisplay(page, 'Isometric');
  expect(await display(page)).toBe('text');
  expect((await probe(page)).lit).toBe(0);
  expect((await screen(page)).split('\n').slice(1, 29).join('')).toContain('@');
  await switchDisplay(page, 'Text');
  expect(await display(page)).toBe('iso');
  await expect.poll(async () => (await probe(page)).lit).toBeGreaterThan(2000);
  await open(page, './');
  expect(await display(page)).toBe('iso');
});
