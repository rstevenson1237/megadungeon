// A crowded large level for the per-turn time budget (plan, Risks: "a per-turn time budget test"): a generated
// large level with every creature it holds plus extra ones, all alert and hunting, so well over the 50 a round
// that Spec 04 simulates. The player is too tough to die, so every round is a full round of creature turns.

import type { ContentBundle, Spell } from '../src/core/schemas.ts';
import type { GameContent } from '../src/game/content.ts';
import { Game, TICKS_PER_ROUND, type TimeMode, createPlayer } from '../src/game/game.ts';
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
 * A large level, crowded with `total` alert creatures of every behaviour, played in `time` mode. The content is passed
 * in so the browser checks (task 4.12, `e2e/harness.ts`) can build the same game from the bundled tables.
 */
export function crowdedGame(from: CrowdContent, total = 80, time: TimeMode = 'turn'): Game {
  let seed = 1;
  let depth = 61;
  let options = runOptionsFor(from.levels, seed);
  while (options.sizeFor!(depth) !== 'large' || options.layout!.villages.some((v) => v.level === depth)) {
    depth++;
    if (depth > 99) [seed, depth, options] = [seed + 1, 61, runOptionsFor(from.levels, seed + 1)];
  }
  const level = generateLevel(seed, depth, 'large', options.styleFor!(depth), options.contentsFor!(depth));
  const player = createPlayer({ combatStep: 12, combatDice: 6, combatMax: 6 });
  const game = new Game(seed, level, player, { spells: from.spells, items: from.items, content: from.content, time });
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

/** Real time: milliseconds per round and per tick over `rounds` rounds of 10 ticks, one tick at a time as the frame loop runs them. */
export function timeTicks(game: Game, rounds: number, player: (game: Game) => void = () => undefined): { mean: number; worst: number; worstTick: number } {
  let total = 0;
  let worst = 0;
  let worstTick = 0;
  for (let r = 0; r < rounds; r++) {
    const start = performance.now();
    for (let t = 0; t < TICKS_PER_ROUND; t++) {
      const s = performance.now();
      player(game);
      game.advance(1);
      worstTick = Math.max(worstTick, performance.now() - s);
    }
    const took = performance.now() - start;
    total += took;
    worst = Math.max(worst, took);
    game.state.player.pools.combat.dice = game.state.player.pools.combat.max; // never let the test character die
  }
  return { mean: total / rounds, worst, worstTick };
}

/**
 * Bring `n` of the crowd to the player: the open floor cells nearest the player, by a walk over the floor, each take
 * one creature, so the fight starts at once and the rest of the crowd is still simulated far off.
 */
export function surround(game: Game, n: number): void {
  const { level, player } = game.state.map;
  const w = level.width;
  const seen = new Set([player.y * w + player.x]);
  const queue = [player.y * w + player.x];
  const cells: number[] = [];
  for (let i = 0; i < queue.length && cells.length < n; i++) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const x = (queue[i]! % w) + dx;
      const y = Math.floor(queue[i]! / w) + dy;
      if (level.tiles[y]?.[x] !== '.' || seen.has(y * w + x)) continue;
      seen.add(y * w + x);
      queue.push(y * w + x);
      if (!game.monsterAt(x, y)) cells.push(y * w + x);
    }
  }
  const far = [...game.state.monsters].sort((a, b) => Math.abs(b.x - player.x) + Math.abs(b.y - player.y) - Math.abs(a.x - player.x) - Math.abs(a.y - player.y));
  cells.slice(0, n).forEach((cell, i) => Object.assign(far[i]!, { x: cell % w, y: Math.floor(cell / w) }));
  game.refreshSight();
}

/**
 * Real time: the player fights the crowd, as fast as the cooldown allows: attacks a creature beside them, else steps
 * toward the nearest. Each command is given in the tick its cooldown ends, so it is carried out at once.
 */
export function fightCrowd(game: Game): void {
  if (!game.ready) return;
  const { player } = game.state.map;
  let near = game.state.monsters[0];
  for (const m of game.state.monsters) {
    if (Math.abs(m.x - player.x) + Math.abs(m.y - player.y) < Math.abs(near!.x - player.x) + Math.abs(near!.y - player.y)) near = m;
  }
  if (!near) return void game.command(() => game.act({ type: 'wait' }));
  const dx = Math.sign(near.x - player.x);
  const dy = dx === 0 ? Math.sign(near.y - player.y) : 0;
  const result = game.command(() => game.act({ type: 'move', dx, dy }));
  if (!result?.spent) game.command(() => game.act({ type: 'wait' }));
}
