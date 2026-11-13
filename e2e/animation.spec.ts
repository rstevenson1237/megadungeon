import { expect, test, type Page } from '@playwright/test';
import { descend, newCharacter, screen } from './play.ts';

// The browser check of task 6.8 (Spec 01b, Animation and effects): on the built page in the isometric display, a step
// slides (the picture changes again after the key press with no other key), and in turn mode keys pressed faster than
// the animation each act at once: input never waits.

/** A fingerprint of the picture canvas's view area. */
async function picture(page: Page): Promise<string> {
  return page.evaluate(() => {
    const canvas = document.querySelectorAll('canvas')[0] as HTMLCanvasElement;
    const data = canvas.getContext('2d')!.getImageData(9, 16, 630, 448).data;
    let h = 0;
    for (let i = 0; i < data.length; i += 4) h = (Math.imul(h, 31) + data[i]! + data[i + 1]! * 7 + data[i + 2]! * 13) | 0;
    return String(h);
  });
}

/** The level's round, which goes up with each action that spends one. */
const round = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { megadungeon: { clock: () => { round: number } } }).megadungeon.clock().round);

test('a step slides on screen after the key press, and keys never wait for it', async ({ page }) => {
  await page.goto('./?display=iso');
  await page.waitForFunction(() => 'megadungeon' in window && (window as unknown as { megadungeon: { screen: () => string } }).megadungeon.screen().includes('New game'));
  await newCharacter(page, 'Warrior', 'Slide');
  await descend(page);
  await expect.poll(() => screen(page)).toMatch(/You descend to level \d+\./);
  await page.waitForTimeout(800);
  // Find a direction the player can step in: the turn counter goes up.
  const turn = (): Promise<number> => round(page);
  let moved = false;
  for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) {
    const before = await turn();
    await page.keyboard.press(key);
    const during = await picture(page);
    await page.waitForTimeout(400);
    if ((await turn()) === before) continue;
    // The slide went on drawing with no key pressed: the picture after it is not the one drawn as the key went down.
    expect(await picture(page)).not.toBe(during);
    moved = true;
    break;
  }
  expect(moved).toBe(true);
  // Two keys inside one step's 100 ms: both act.
  const start = await turn();
  await page.keyboard.press(' ');
  await page.keyboard.press(' ');
  expect((await turn()) - start).toBe(2);
});
