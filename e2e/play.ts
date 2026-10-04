import { expect, type Page } from '@playwright/test';

// What the browser tests share: reading the screen and pressing keys on the built page.

/** The text of the screen as last drawn, through the read-only hook in src/main.ts (the canvas holds no text). */
export const screen = (page: Page): Promise<string> =>
  page.evaluate(() => (window as unknown as { megadungeon: { screen: () => string } }).megadungeon.screen());

export const press = async (page: Page, ...keys: string[]): Promise<void> => {
  for (const key of keys) await page.keyboard.press(key);
};

/** Move the cursor of the open list down to the row and choose it. */
export async function choose(page: Page, label: string): Promise<boolean> {
  for (let i = 0; i < 30; i++) {
    if ((await screen(page)).includes(`> ${label}`)) {
      await press(page, 'Enter');
      return true;
    }
    await press(page, 's');
  }
  return false;
}

/** Open the page and wait for the title screen to show `item` (New game, or Continue). */
export async function openTitle(page: Page, item = 'New game'): Promise<void> {
  await page.goto('./');
  await page.waitForFunction(
    (text) => 'megadungeon' in window && (window as unknown as { megadungeon: { screen: () => string } }).megadungeon.screen().includes(text),
    item,
  );
}

/** From the title screen, create a character of `className` called `name`, and wait for the surface village. */
export async function newCharacter(page: Page, className: string, name: string): Promise<void> {
  await press(page, 'Enter');
  if (!(await choose(page, className))) throw new Error(`No ${className} on the creation screen`);
  for (const ch of name) await press(page, ch);
  await press(page, 'Enter');
  await expect.poll(() => screen(page)).toContain('Surface Village');
}

/** From a village, go down (through any village on the way) until a dungeon level is reached. */
export async function descend(page: Page): Promise<void> {
  while ((await screen(page)).includes('Go down')) {
    if (!(await choose(page, 'Go down'))) throw new Error('No Go down in the village menu');
  }
}
