import { expect, test, type Page } from '@playwright/test';
import { choose, descend, newCharacter, openTitle, press, screen } from './play.ts';

// The browser smoke test (plan, task 3.11): on the built page, create a non-Thief character (a Priest), take a step in
// the dungeon, cast a starting spell (Heal), rest in the village, reload, and check that the character pane shows the
// Priest's real state, before and after the reload.

/**
 * Where every @ on the map is, as "column,row" pairs. The player is an @, and so are the NPCs (traders, hermits and
 * captives), so the text alone cannot say which is the player; the set of positions is the same after a step and back.
 */
const at = async (page: Page): Promise<string> => {
  const found: string[] = [];
  (await screen(page)).split('\n').forEach((row, y) => {
    const map = row.slice(0, 72);
    for (let x = map.indexOf('@'); x >= 0; x = map.indexOf('@', x + 1)) found.push(`${x},${y}`);
  });
  return found.join(';');
};
/** The map as drawn. The camera follows the player, so a step in open ground leaves every @ where it was and moves the map. */
const mapText = async (page: Page): Promise<string> =>
  (await screen(page)).split('\n').slice(0, 30).map((r) => r.slice(0, 72)).join('\n');
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
  await openTitle(page);

  // Title, then the creation screen: the Priest, named Smoke.
  await newCharacter(page, 'Priest', 'Smoke');
  await expectPriestPane(page);

  // Down into the dungeon (through any village on level 1), and one step.
  await descend(page);
  await expect.poll(() => screen(page)).toMatch(/You descend to level \d+\./);
  const start = await at(page);
  const startMap = await mapText(page);
  let back = '';
  for (const [key, undo] of [['d', 'a'], ['a', 'd'], ['s', 'w'], ['w', 's']] as const) {
    await press(page, key);
    if ((await mapText(page)) !== startMap) {
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
  await openTitle(page, 'Continue');
  expect(await choose(page, 'Continue')).toBe(true);
  await expect.poll(() => screen(page)).toContain('Lodging');
  await expectPriestPane(page);
});
