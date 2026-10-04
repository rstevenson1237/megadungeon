// A crowded large level for the per-turn time budget (plan, Risks: "a per-turn time budget test"): a generated
// large level with every creature it holds plus extra ones, all alert and hunting, so well over the 50 a round
// that Spec 04 simulates. The player is too tough to die, so every round is a full round of creature turns.

import type { ContentBundle, Spell } from '../src/core/schemas.ts';
import type { GameContent } from '../src/game/content.ts';
import { Game, createPlayer } from '../src/game/game.ts';
import { creature } from '../src/game/monsters.ts';
import { runOptionsFor } from '../src/game/world.ts';
import { generateLevel } from '../src/rules/world/generate.ts';
import type { ItemData } from '../src/rules/items/magic.ts';

const BEHAVIOURS = ['brute', 'skirmisher', 'caster', 'pack', 'coward', 'ambusher'] as const;

/** What the crowded game is built from: the tables the level is rolled from, and the game's own content. */
export interface CrowdContent {
  levels: ContentBundle;
  spells: Spell[];
  items: ItemData;
  content: GameContent;
}

/**
 * A large level, crowded with `total` alert creatures of every behaviour. The content is passed in so the browser
 * checks (task 4.12, `e2e/harness.ts`) can build the same game from the bundled tables.
 */
export function crowdedGame(from: CrowdContent, total = 80): Game {
  let seed = 1;
  let depth = 61;
  let options = runOptionsFor(from.levels, seed);
  while (options.sizeFor!(depth) !== 'large' || options.layout!.villages.some((v) => v.level === depth)) {
    depth++;
    if (depth > 99) [seed, depth, options] = [seed + 1, 61, runOptionsFor(from.levels, seed + 1)];
  }
  const level = generateLevel(seed, depth, 'large', options.styleFor!(depth), options.contentsFor!(depth));
  const player = createPlayer({ combatStep: 12, combatDice: 6, combatMax: 6 });
  const game = new Game(seed, level, player, { spells: from.spells, items: from.items, content: from.content });
  const taken = new Set(game.state.monsters.map((m) => `${m.x},${m.y}`));
  taken.add(`${game.state.map.player.x},${game.state.map.player.y}`);
  let id = 90_000;
  for (let y = 1; y < level.height - 1 && game.state.monsters.length < total; y += 3) {
    for (let x = 1; x < level.width - 1 && game.state.monsters.length < total; x += 5) {
      if (level.tiles[y]![x] !== '.' || taken.has(`${x},${y}`)) continue;
      taken.add(`${x},${y}`);
      game.state.monsters.push(creature({ id: id++, name: 'test', glyph: 't', colour: 0, x, y, dice: 3, modifier: 1, behaviour: BEHAVIOURS[id % BEHAVIOURS.length]! }));
    }
  }
  for (const m of game.state.monsters) m.awareness = 'alert';
  return game;
}

/** Milliseconds per round over `rounds` waits: the mean and the slowest. */
export function timeRounds(game: Game, rounds: number): { mean: number; worst: number } {
  let worst = 0;
  const start = performance.now();
  for (let i = 0; i < rounds; i++) {
    const t = performance.now();
    game.act({ type: 'wait' });
    game.state.player.pools.combat.dice = game.state.player.pools.combat.max; // never let the test character die
    worst = Math.max(worst, performance.now() - t);
  }
  return { mean: (performance.now() - start) / rounds, worst };
}
