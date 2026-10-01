import { Game, type PlayerState } from '../src/game/game.ts';
import { GENERATOR_VERSION, type Level, type Point } from '../src/rules/world/level.ts';
import type { Monster } from '../src/game/monsters.ts';
import type { CharacterPaneData } from '../src/ui/character-pane.ts';
import { CP437_TO_UNICODE } from '../src/ui/cp437.ts';
import { COLS, Grid } from '../src/ui/grid.ts';
import { Shell } from '../src/ui/shell.ts';

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
    generatorVersion: GENERATOR_VERSION, runSeed: 0, depth: 1, size: 'small',
    width: rows[0]!.length, height: rows.length, tiles: rows, rooms: [],
    upStair: find('<')!, downStair: find('>'), attempts: 1, fallback: false,
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
export function gameOn(level: Level, player: Partial<Omit<PlayerState, 'dead' | 'facing'>> = {}): Game {
  return new Game(1, level, { combatStep: 6, combatDice: 2, combatMax: 2, ranged: { name: 'Sling', range: 6 }, ...player });
}

/** A monster with sensible defaults: one die, normal speed, not yet alert. */
export function monsterAt(x: number, y: number, extra: Partial<Monster> = {}): Monster {
  return { id: x * 1000 + y, name: 'goblin', glyph: 'g', colour: 0x7fc75a, x, y, dice: 1, maxDice: 1, modifier: 0, speed: 'normal', alert: false, ...extra };
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
export function shellOn(level: Level, monsters: Monster[] = []): Shell {
  const shell = new Shell('Test', testCharacter());
  shell.game = gameOn(level);
  shell.game.state.monsters.push(...monsters);
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
