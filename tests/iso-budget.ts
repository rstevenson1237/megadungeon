// The isometric display's frame budget (Spec 01b, Loading and performance: "on a large level with 80 creatures in
// view, a frame takes under 8 ms on average and never over 16 ms"; task 6.10). A generated large level, its whole
// picture lit, with 80 creatures of the monster table standing on the floor cells nearest the player: the most a frame
// has to draw. The browser check (`e2e/harness/harness.ts`) paints it with the real art pack; the unit test checks
// that the crowd is really in view.

import type { ContentBundle, Spell } from '../src/core/schemas.ts';
import type { GameContent } from '../src/game/content.ts';
import { type Game } from '../src/game/game.ts';
import { MONSTER_COLOURS, DEFAULT_MONSTER_COLOUR, creature } from '../src/game/monsters.ts';
import type { ItemData } from '../src/rules/items/magic.ts';
import { isoArea, isoOnScreen } from '../src/ui/iso-view.ts';
import { crowdedGame } from './turn-budget.ts';

/** How many creatures the budget asks for in view. */
export const IN_VIEW = 80;

/** What the crowded view is built from: the bundled tables, as for the turn budget. */
export interface ViewContent {
  levels: ContentBundle;
  spells: Spell[];
  items: ItemData;
  content: GameContent;
}

/**
 * A large level whose every cell within the picture is explored and visible, with `IN_VIEW` creatures on the on-screen
 * floor cells nearest the player, each a row of the monster table in turn (so each family's sprite and colour), and
 * every creature the level held taken off. Sight is not refreshed afterwards, so the whole picture stays lit.
 */
export function crowdedView(from: ViewContent): Game {
  const game = crowdedGame(from, 0);
  const { level, player, exploration, visible } = game.state.map;
  const area = isoArea(player);
  const floor: { x: number; y: number; d: number }[] = [];
  for (let y = Math.max(0, area.y); y < Math.min(level.height, area.y + area.h); y++) {
    for (let x = Math.max(0, area.x); x < Math.min(level.width, area.x + area.w); x++) {
      const i = y * level.width + x;
      exploration.explored[i] = 1;
      visible[i] = 1;
      if (level.tiles[y]![x] === '.' && (x !== player.x || y !== player.y) && isoOnScreen({ x, y }, player)) {
        floor.push({ x, y, d: Math.abs(x - player.x) + Math.abs(y - player.y) });
      }
    }
  }
  floor.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
  const rows = from.content.monsters;
  game.state.monsters = floor.slice(0, IN_VIEW).map((at, i) => {
    const row = rows[i % rows.length]!;
    return creature({
      id: 80_000 + i, name: row.name, glyph: row.glyph, colour: MONSTER_COLOURS[row.colour] ?? DEFAULT_MONSTER_COLOUR,
      x: at.x, y: at.y, dice: 3, modifier: 1, awareness: 'alert',
    });
  });
  return game;
}

/** Milliseconds per frame over `frames` frames, each drawn by `frame` at a clock 50 ms on from the last: the mean and the slowest. */
export function timeFrames(frames: number, frame: (clock: number) => void, start = 0): { mean: number; worst: number } {
  let worst = 0;
  let total = 0;
  for (let i = 0; i < frames; i++) {
    const t = performance.now();
    frame(start + i * 50);
    const took = performance.now() - t;
    total += took;
    worst = Math.max(worst, took);
  }
  return { mean: total / frames, worst };
}
