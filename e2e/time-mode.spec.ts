import { expect, test, type Page } from '@playwright/test';
import { choose, descend, newCharacter, screen } from './play.ts';

// The browser check of task 5.6 (Spec 01 and Spec 09, Addendum B): on the built page, the title's time row and
// `?time=` choose the mode of a new game, the browser remembers the row, and Continue plays the save's own mode.

interface Clock {
  tick: number;
  round: number;
  ticking: boolean;
}

const clock = (page: Page): Promise<Clock | null> =>
  page.evaluate(() => (window as unknown as { megadungeon: { clock: () => Clock | null } }).megadungeon.clock());

/** Open the page at `path` and wait for the title screen to show `text`. */
async function open(page: Page, path: string, text = 'New game'): Promise<void> {
  await page.goto(path);
  await page.waitForFunction((t) => 'megadungeon' in window && (window as unknown as { megadungeon: { screen: () => string } }).megadungeon.screen().includes(t), text);
}

/** On a dungeon level, real time runs ticks; turn mode runs none. */
async function expectMode(page: Page, time: 'turn' | 'real'): Promise<void> {
  await descend(page);
  await expect.poll(() => screen(page)).toMatch(/You descend to level \d+\./);
  if (time === 'real') {
    await expect.poll(async () => (await clock(page))?.tick ?? 0, 'real time runs ticks').toBeGreaterThan(2);
  } else {
    await page.waitForTimeout(300);
    expect(await clock(page)).toMatchObject({ tick: 0, ticking: false });
  }
}

test('the title row starts on turn-based, and a new game is turn-based', async ({ page }) => {
  await open(page, './');
  expect(await screen(page)).toContain('Time: Turn-based');
  await newCharacter(page, 'Warrior', 'Turner');
  await expectMode(page, 'turn');
});

test('?time=real presets the row, the run is real time, and Continue keeps it on a plain page', async ({ page }) => {
  await open(page, './?time=real');
  expect(await screen(page)).toContain('Time: Real time');
  await newCharacter(page, 'Ranger', 'Quick');
  await expectMode(page, 'real');

  // The plain page's row is turn-based (a preset is not remembered), but Continue plays the save's mode.
  await open(page, './', 'Resume at your last rest');
  expect(await screen(page)).toContain('Time: Turn-based');
  expect(await choose(page, 'Continue')).toBe(true);
  await expect.poll(() => screen(page)).toContain('Surface Village');
  await expectMode(page, 'real');
});

test('Enter on the row switches it, and the browser remembers it on the next visit', async ({ page }) => {
  await open(page, './');
  expect(await choose(page, 'Time: Turn-based')).toBe(true);
  expect(await screen(page)).toContain('> Time: Real time');
  await open(page, './');
  expect(await screen(page)).toContain('Time: Real time');
  await newCharacter(page, 'Warrior', 'Later');
  await expectMode(page, 'real');
});
