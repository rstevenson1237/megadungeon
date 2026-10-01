// Draws the character pane (Spec 01, "Character pane"): blocks from top to
// bottom in a fixed order, push-your-luck numbers near the top.

import { TRUNCATED } from './cp437.ts';
import type { Grid } from './grid.ts';
import { CHARACTER_PANE, inner } from './panes.ts';
import { UI } from './palette.ts';

export type StatName = 'Combat' | 'Skill' | 'Magic';

/** The data the pane draws; the game layer fills it from the real character. */
export interface CharacterPaneData {
  name: string;
  className: string;
  level: number;
  /** Banked XP and the next level's threshold (null at the top level). */
  xp: number;
  xpNext: number | null;
  bank: number;
  /** Estimated value of unbanked treasure (gems and jewelry are only valued on appraisal). */
  carried: number;
  stats: { name: StatName; step: number; current: number; max: number }[];
  equipment: { name: string; quality: string }[];
  /** The major ability first, then minor abilities and buffs. */
  abilities: string[];
  /** Active effects, and the wait recovery counter. */
  status: string[];
  wait: { rounds: number; needed: number };
  inventory: { used: number; total: number };
  /** Present only while targeting. */
  target?: { name: string; rating: string; distance: number; index: number; count: number };
}

const STAT_COLOURS: Record<StatName, { full: number; empty: number }> = {
  Combat: { full: UI.statCombat, empty: UI.statCombatEmpty },
  Skill: { full: UI.statSkill, empty: UI.statSkillEmpty },
  Magic: { full: UI.statMagic, empty: UI.statMagicEmpty },
};

const PIP = 254; // ■
const num = (n: number): string => n.toLocaleString('en-US');

export function drawCharacterPane(grid: Grid, d: CharacterPaneData): void {
  const area = inner(CHARACTER_PANE);
  const x = area.x + 1; // one cell of margin inside the border
  const width = area.w - 1;
  const lastRow = area.y + area.h - 1;
  let y = area.y + 1;

  for (let row = area.y; row <= lastRow; row++) grid.fill(area.x, row, area.w, 1, 32, UI.text, UI.background);

  // Anything that would run past the bottom of the pane is dropped, never drawn over the border.
  const text = (cx: number, s: string, fg: number): void => {
    if (y > lastRow) return;
    const room = x + width - cx;
    grid.text(cx, y, s.length > room ? `${s.slice(0, room - 1)}${TRUNCATED}` : s, fg, UI.background);
  };
  const header = (s: string, fg: number = UI.label): void => {
    text(x, s, fg);
    y++;
  };
  const labelled = (label: string, value: string, fg: number = UI.value): void => {
    text(x, label, UI.label);
    text(x + 9, value, fg);
    y++;
  };

  // Identity
  text(x, d.name, UI.bright);
  y++;
  text(x, `${d.className}, Level ${d.level}`, UI.value);
  y += 2;

  // Experience and wealth
  labelled('XP', d.xpNext === null ? `${num(d.xp)} (max)` : `${num(d.xp)} / ${num(d.xpNext)}`);
  labelled('Bank', `${num(d.bank)} gp`);
  labelled('Carried', `~${num(d.carried)} gp`, UI.gold);
  y++;

  // Stats: step, pips, current / maximum dice
  header('STATS');
  for (const s of d.stats) {
    const colours = STAT_COLOURS[s.name];
    text(x, `${s.name.padEnd(6)} d${s.step}`, UI.value);
    for (let i = 0; i < s.max && y <= lastRow; i++) grid.set(x + 10 + i, y, PIP, i < s.current ? colours.full : colours.empty, UI.background);
    text(x + 17, `${s.current}/${s.max}`, UI.label);
    y++;
  }
  y++;

  // Equipment
  header('EQUIPMENT');
  for (const e of d.equipment) {
    text(x, e.name.length > 12 ? `${e.name.slice(0, 11)}${TRUNCATED}` : e.name, UI.value);
    text(x + 13, e.quality, UI.label);
    y++;
  }
  y++;

  // Abilities: the major ability stands out
  header('ABILITIES');
  d.abilities.forEach((a, i) => {
    text(x, a, i === 0 ? UI.bright : UI.value);
    y++;
  });
  y++;

  // Status and the wait recovery counter
  header('STATUS');
  for (const s of d.status) {
    text(x, s, UI.value);
    y++;
  }
  text(x, `Rested ${d.wait.rounds}/${d.wait.needed}`, UI.value);
  y += 2;

  // Inventory
  text(x, `Slots ${d.inventory.used}/${d.inventory.total}`, UI.value);
  y += 2;

  // Target, only while targeting
  if (d.target) {
    header('TARGET', UI.target);
    text(x, d.target.name, UI.bright);
    text(x + 13, d.target.rating, UI.value);
    y++;
    text(x, `Distance ${d.target.distance}`, UI.value);
    y++;
    text(x, `Target ${d.target.index} of ${d.target.count}`, UI.value);
    y++;
  }
}
