import { resolve } from 'node:path';
import type { Rng } from '../src/core/rng.ts';
import type { Spell } from '../src/core/schemas.ts';
import { Game, type ArrivalOptions, type PlayerState, createPlayer } from '../src/game/game.ts';
import { Run } from '../src/game/run.ts';
import { GENERATOR_VERSION, emptyPlacements, type Level, type Point } from '../src/rules/world/level.ts';
import { creature, type Monster } from '../src/game/monsters.ts';
import type { CharacterPaneData } from '../src/ui/character-pane.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { Shell } from '../src/ui/shell.ts';
import { buildContent } from '../tools/content-build.ts';
import { spellsFrom } from '../src/rules/magic/spells.ts';

/** Build a level from rows: '#' wall, '.' floor, '<' up stair (required), '>' down stair. */
export function levelFrom(rows: string[]): Level {
  const find = (c: string): Point | null => {
    for (let y = 0; y < rows.length; y++) {
      const x = rows[y]!.indexOf(c);
      if (x >= 0) return { x, y };
    }
    return null;
  };
  return {
    generatorVersion: GENERATOR_VERSION, runSeed: 0, depth: 1, size: 'small', layout: 'rooms_and_corridors',
    width: rows[0]!.length, height: rows.length, tiles: rows, rooms: [],
    upStair: find('<')!, downStair: find('>'), attempts: 1, fallback: false,
    ...emptyPlacements(),
  };
}
export const blank = (w: number, h: number): string[] => Array.from({ length: h }, () => '#'.repeat(w));
/** An open w x h room inside a wall border, with the up stair at (px, py). */
export function room(w: number, h: number, px: number, py: number): Level {
  const rows = blank(w + 2, h + 2).map((r, y) => (y === 0 || y === h + 1 ? r : '#' + '.'.repeat(w) + '#'));
  rows[py] = rows[py]!.slice(0, px) + '<' + rows[py]!.slice(px + 1);
  return levelFrom(rows);
}

/** A game on a hand-built level with no monsters, a Combat d6 pool of 2 and a sling. */
export const testPlayer = (extra: Partial<PlayerState> = {}): PlayerState =>
  ({ ...createPlayer({ combatStep: 6, combatDice: 2, combatMax: 2, ranged: { name: 'Sling', range: 6, ammo: 20 } }), ...extra });

export function gameOn(level: Level, player: Partial<PlayerState> = {}, arrival: ArrivalOptions = {}): Game {
  return new Game(1, level, testPlayer(player), arrival);
}

/** The real content, built once: the 15 spells and the classes are read from the tables, not rewritten in tests. */
let built: ReturnType<typeof buildContent> | undefined;
export const content = () => (built ??= buildContent(resolve(import.meta.dirname, '../content')));
export const SPELLS: Spell[] = spellsFrom(content().bundle);
export const spell = (id: string): Spell => SPELLS.find((s) => s.id === id)!;

/** A caster: three Magic d6 dice, and every spell known. */
export const caster = (extra: Partial<PlayerState> = {}): Partial<PlayerState> => ({
  magic: { step: 6, dice: 3, max: 3 },
  spells: SPELLS.map((s) => s.id),
  combatDice: 3,
  combatMax: 3,
  ...extra,
});

/** A game for casting: the spell table loaded, the player a caster. */
export const castingGame = (level: Level, extra: Partial<PlayerState> = {}): Game => gameOn(level, caster(extra), { spells: SPELLS });

/**
 * Deal the given faces to the next `int` calls of the game's generator, then carry on with the real stream.
 * Each call replaces what was still queued. A spell's own roll comes first, then any duration it rolls, then
 * whatever the creatures roll after it, so rig a trailing face for any creature that will roll that round.
 */
export function rig(game: Game, ...faces: number[]): void {
  const rng = game.rng as Rng & { queue?: number[] };
  if (!rng.queue) {
    rng.queue = [];
    const real = rng.int.bind(rng);
    rng.int = (min: number, max: number): number => (rng.queue!.length > 0 ? rng.queue!.shift()! : real(min, max));
  }
  rng.queue.length = 0;
  rng.queue.push(...faces);
}

/** A monster with sensible defaults: one die, normal speed, a brute, unaware unless `alert` is set. */
export function monsterAt(x: number, y: number, extra: Partial<Monster> & { alert?: boolean } = {}): Monster {
  const { alert, ...rest } = extra;
  return creature({ id: x * 1000 + y, name: 'goblin', glyph: 'g', colour: 0x7fc75a, x, y, dice: 1, modifier: 0, ...(alert ? { awareness: 'alert' as const } : {}), ...rest });
}

/** Move the player by repeated orthogonal steps, e.g. step(game, 'd', 5). */
export function walk(game: Game, keys: string): void {
  const dirs: Record<string, [number, number]> = { w: [0, -1], a: [-1, 0], s: [0, 1], d: [1, 0] };
  for (const k of keys) game.act({ type: 'move', dx: dirs[k]![0], dy: dirs[k]![1] });
}


export const testCharacter = (): CharacterPaneData => ({
  name: 'Mara', className: 'Thief', level: 3, xp: 0, xpNext: 100, bank: 0, carried: 0,
  stats: [{ name: 'Combat', step: 6, current: 2, max: 2 }], equipment: [], abilities: ['Backstab'],
  status: [], wait: { rounds: 0, needed: 10 }, inventory: { used: 0, total: 12 },
});

/** A shell with a game loaded on the given level. */
export function shellOn(level: Level, monsters: Monster[] = [], player: Partial<PlayerState> = {}): Shell {
  const shell = new Shell('Test', testCharacter());
  shell.setRun(new Run(1, testPlayer(player), { startDepth: 1, levelFor: () => level, spells: SPELLS }));
  shell.game!.state.monsters.push(...monsters);
  return shell;
}

export const press = (shell: Shell, key: string, shiftKey = false): boolean => shell.handleKey({ key, shiftKey });

/** The text of the whole screen, one string per row. */
export function screenText(shell: Shell): string[] {
  const g = new Grid();
  shell.draw(g);
  return Array.from({ length: 40 }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => CP437_TO_UNICODE[g.glyph[y * COLS + x]!]).join(''),
  );
}

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]] as const;

/** Deep water and lava count as walls for reachability (Spec 02, "Liquids"). */
export const isBlocking = (c: string): boolean => c === '#' || c === '=' || c === '%';

/**
 * An independent level checker, written separately from the generator's own: breadth-first search
 * over orthogonal steps only. Null when the level is sound, else the first rule it breaks.
 */
export function checkLevel(level: Level): string | null {
  const { width, height, tiles } = level;
  if (tiles.length !== height || tiles.some((r) => r.length !== width)) return 'bad dimensions';
  // A secret door is drawn as wall but is a doorway; it counts as walkable for connectivity (Spec 02).
  const secret = new Set(level.doors.filter((d) => d.kind === 'secret').map((d) => d.y * width + d.x));
  const at = (x: number, y: number): string => (secret.has(y * width + x) ? '+' : tiles[y]?.[x] ?? '#');
  for (let x = 0; x < width; x++) if (at(x, 0) !== '#' || at(x, height - 1) !== '#') return 'open edge';
  for (let y = 0; y < height; y++) if (at(0, y) !== '#' || at(width - 1, y) !== '#') return 'open edge';

  let ups = 0;
  let downs = 0;
  let walkable = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const c = at(x, y);
      if (c === '<') ups++;
      if (c === '>') downs++;
      if (!isBlocking(c)) walkable++;
    }
  }
  if (ups !== 1 || at(level.upStair.x, level.upStair.y) !== '<') return 'up stair';
  if (level.depth === 100 ? downs !== 0 || level.downStair !== null : downs !== 1) return 'down stair count';

  const dist = new Map<number, number>([[level.upStair.y * width + level.upStair.x, 0]]);
  const queue = [level.upStair.y * width + level.upStair.x];
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head]!;
    const x = i % width;
    const y = (i - x) / width;
    for (const [dx, dy] of DIRS) {
      const n = (y + dy) * width + (x + dx);
      if (isBlocking(at(x + dx, y + dy)) || dist.has(n)) continue;
      dist.set(n, dist.get(i)! + 1);
      queue.push(n);
    }
  }
  if (dist.size !== walkable) return `unreachable cells: ${walkable - dist.size}`;
  if (level.downStair) {
    const longest = Math.max(...dist.values());
    const d = dist.get(level.downStair.y * width + level.downStair.x)!;
    if (d < 0.6 * longest) return `down stair at ${d} of ${longest}`;
    if (at(level.downStair.x, level.downStair.y) !== '>') return 'down stair position';
  }
  return null;
}
