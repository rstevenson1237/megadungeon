import { expect, test, type Page } from '@playwright/test';
import { descend, newCharacter, press, screen } from './play.ts';

// The browser check of task 5.5 (Spec 01, Addendum B): in real time the frame loop runs ticks, and P, every overlay, a
// hidden tab and lost focus stop them, while targeting and look do not; a target that goes leaves its message. The
// page is the whole game from the check harness, with new runs preset to real time as `?time=real` presets them.

const REALTIME = 'http://localhost:5174/megadungeon/e2e/harness/realtime.html';

interface Clock {
  tick: number;
  round: number;
  ticking: boolean;
}
interface Hooks {
  megadungeon: { screen: () => string; clock: () => Clock | null };
  harness: { calm: () => void; placeTarget: () => boolean; removeTarget: () => void };
}

const clock = async (page: Page): Promise<Clock> => {
  const c = await page.evaluate(() => (window as unknown as Hooks).megadungeon.clock());
  if (!c) throw new Error('No level on screen');
  return c;
};

/** The clock runs: ticks go by. */
async function running(page: Page, what: string): Promise<void> {
  const start = (await clock(page)).tick;
  await expect.poll(async () => (await clock(page)).tick, what).toBeGreaterThan(start + 2);
}

/** The clock is stopped: no tick goes by in a third of a second, which is 6 ticks of play. */
async function stopped(page: Page, what: string): Promise<void> {
  const start = await clock(page);
  expect(start.ticking, what).toBe(false);
  await page.waitForTimeout(350);
  expect((await clock(page)).tick, what).toBe(start.tick);
}

test.describe('Spec 01, Addendum B: real time in the browser (task 5.5)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(REALTIME);
    await page.waitForFunction(() => 'megadungeon' in window && (window as unknown as Hooks).megadungeon.screen().includes('New game'));
    await newCharacter(page, 'Ranger', 'Clock');
    await descend(page);
    await expect.poll(() => screen(page)).toMatch(/You descend to level \d+\./);
    await page.evaluate(() => (window as unknown as Hooks).harness.calm());
  });

  test('the frame loop runs ticks, and P pauses and resumes them with "Paused" in the header', async ({ page }) => {
    await running(page, 'on arrival');
    await press(page, 'p');
    await stopped(page, 'after P');
    expect((await screen(page)).split('\n')[0]).toContain('- Paused');
    await press(page, 'p');
    await running(page, 'after P again');
    expect((await screen(page)).split('\n')[0]).not.toContain('Paused');
  });

  test('every overlay stops the ticks until it closes', async ({ page }) => {
    for (const [key, title] of [['?', 'Help'], ['m', 'Message History'], ['i', 'Inventory'], ['j', 'Journal'], ['Escape', 'Game Menu']] as const) {
      await press(page, key);
      await expect.poll(() => screen(page), title).toContain(title);
      await stopped(page, title);
      await press(page, 'Escape');
      await running(page, `${title} closed`);
    }
  });

  test('lost focus and a hidden tab stop the ticks, and only P or a movement key resumes them', async ({ page }) => {
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await stopped(page, 'lost focus');
    expect((await screen(page)).split('\n')[0]).toContain('- Paused');
    await press(page, 'm', 'Escape'); // other keys act, but do not resume
    await stopped(page, 'after other keys');
    await press(page, 'p');
    await running(page, 'resumed by P');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await stopped(page, 'hidden tab');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await stopped(page, 'tab shown again, before a key');
    await press(page, 'w');
    await running(page, 'resumed by a movement key');
  });

  test('look and targeting do not stop the ticks, and a target that goes ends targeting with its message', async ({ page }) => {
    await press(page, 'l');
    await running(page, 'looking');
    await press(page, 'Escape');
    expect(await page.evaluate(() => (window as unknown as Hooks).harness.placeTarget())).toBe(true);
    await press(page, 'f');
    await expect.poll(() => screen(page)).toContain('goblin');
    await running(page, 'targeting');
    await page.evaluate(() => (window as unknown as Hooks).harness.removeTarget());
    await expect.poll(() => screen(page)).toContain('Your target is gone.');
    await running(page, 'after targeting');
  });
});
