import { expect, test, type Page } from '@playwright/test';

// The browser smoke test (plan, task 3.11): on the built page, create a non-Thief character (a Priest), take a step in
// the dungeon, cast a starting spell (Heal), rest in the village, reload, and check that the character pane shows the
// Priest's real state, before and after the reload.

const screen = (page: Page): Promise<string> => page.evaluate(() => (window as unknown as { megadungeon: { screen: () => string } }).megadungeon.screen());
const press = async (page: Page, ...keys: string[]): Promise<void> => {
  for (const key of keys) await page.keyboard.press(key);
};
/** Move the cursor of the open list down to the row and choose it. */
async function choose(page: Page, label: string): Promise<boolean> {
  for (let i = 0; i < 30; i++) {
    if ((await screen(page)).includes(`> ${label}`)) {
      await press(page, 'Enter');
      return true;
    }
    await press(page, 's');
  }
  return false;
}
/** The row of the screen the player's @ is on, and its column: the map is the only place an @ is drawn. */
const at = async (page: Page): Promise<string> => {
  const rows = (await screen(page)).split('\n');
  const y = rows.findIndex((r) => r.slice(0, 72).includes('@'));
  return `${rows[y]!.slice(0, 72).indexOf('@')},${y}`;
};
/** What the character pane shows of a level 1 Priest called Smoke: the class's real dice and ability. */
async function expectPriestPane(page: Page): Promise<void> {
  const pane = (await screen(page)).split('\n').map((r) => r.slice(72)).join('\n');
  expect(pane).toContain('Smoke');
  expect(pane).toContain('Priest, Level 1');
  expect(pane).toMatch(/Combat d6 \S+\s+1\/1/);
  expect(pane).toMatch(/Skill +d6 \S+\s+1\/1/);
  expect(pane).toMatch(/Magic +d6 \S+\s+1\/1/);
  expect(pane).toContain('Mace');
  expect(pane).toContain('Heal');
  expect(pane).not.toContain('Thief');
  expect(pane).not.toContain('Backstab');
}

test('create a Priest, step, cast Heal, rest, reload', async ({ page }) => {
  await page.goto('./');
  await page.waitForFunction(() => 'megadungeon' in window && (window as unknown as { megadungeon: { screen: () => string } }).megadungeon.screen().includes('New game'));

  // Title, then the creation screen: the Priest, named Smoke.
  await press(page, 'Enter');
  expect(await choose(page, 'Priest')).toBe(true);
  for (const ch of 'Smoke') await press(page, ch);
  await press(page, 'Enter');
  await expect.poll(() => screen(page)).toContain('Surface Village');
  await expectPriestPane(page);

  // Down into the dungeon (through any village on level 1), and one step.
  while ((await screen(page)).includes('Go down')) expect(await choose(page, 'Go down')).toBe(true);
  await expect.poll(() => screen(page)).toMatch(/You descend to level \d+\./);
  const start = await at(page);
  let back = '';
  for (const [key, undo] of [['d', 'a'], ['a', 'd'], ['s', 'w'], ['w', 's']] as const) {
    await press(page, key);
    if ((await at(page)) !== start) {
      back = undo;
      break;
    }
  }
  expect(back).not.toBe('');

  // Cast Heal, a starting spell, from the spell list.
  await press(page, 'c');
  expect(await choose(page, 'Heal')).toBe(true);
  await expect.poll(() => screen(page)).toContain('You cast Heal.');

  // Back onto the up stair and up to the village; rest at the lodging, which saves.
  await press(page, back);
  expect(await at(page)).toBe(start);
  await press(page, 'e');
  await expect.poll(() => screen(page)).toContain('Lodging');
  expect(await choose(page, 'Lodging')).toBe(true);
  expect(await choose(page, 'Rest for the night')).toBe(true);
  await expect.poll(() => screen(page)).toMatch(/sleep|bed/);
  await expectPriestPane(page);

  // Reload: Continue resumes at the village of the last rest, with the same Priest.
  await page.waitForTimeout(500); // the save is written to IndexedDB after the rest
  await page.reload();
  await page.waitForFunction(() => 'megadungeon' in window && (window as unknown as { megadungeon: { screen: () => string } }).megadungeon.screen().includes('Continue'));
  expect(await choose(page, 'Continue')).toBe(true);
  await expect.poll(() => screen(page)).toContain('Lodging');
  await expectPriestPane(page);
});
