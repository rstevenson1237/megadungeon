// Monsters in play (Spec 04). The placement pipeline decides which monsters a level holds and where
// (Spec 02, step 8, in rules/world/placement); the game brings them to life here. Real behaviour arrives
// with task 2.7; until then every monster follows the stub behaviour in game.ts.

import type { PlacedMonster } from '../rules/world/level.ts';
import type { Level } from '../rules/world/level.ts';

export type Speed = 'slow' | 'normal' | 'fast';

export interface Monster {
  id: number;
  name: string;
  glyph: string;
  colour: number;
  x: number;
  y: number;
  /** Dice left (health). The monster dies at zero. */
  dice: number;
  /** Dice it started with: its rating (Spec 02), shown as "3d6+1". */
  maxDice: number;
  modifier: number;
  speed: Speed;
  /** Stub awareness: false until the player sees it, then it hunts. Real rolls arrive in task 2.7. */
  alert: boolean;
}

/** Colour names used by the monster tables (Spec 08), as 24-bit colours; any other name draws light grey. */
export const MONSTER_COLOURS: Readonly<Record<string, number>> = { moss: 0x7fc75a };
export const DEFAULT_MONSTER_COLOUR = 0xc8c8c8;

/** "3d6+1", "d6", "2d6-1" (Spec 01 target block). */
export function ratingText(m: Pick<Monster, 'maxDice' | 'modifier'>): string {
  const dice = m.maxDice === 1 ? 'd6' : `${m.maxDice}d6`;
  return m.modifier === 0 ? dice : `${dice}${m.modifier > 0 ? '+' : ''}${m.modifier}`;
}

/** The monster a placed one becomes when the level is first entered: at full health and not yet alert. */
export const spawn = (p: PlacedMonster, id: number): Monster => ({
  id,
  name: p.name,
  glyph: p.glyph,
  colour: MONSTER_COLOURS[p.colour] ?? DEFAULT_MONSTER_COLOUR,
  x: p.x,
  y: p.y,
  dice: p.dice,
  maxDice: p.dice,
  modifier: p.modifier,
  speed: p.speed,
  alert: false,
});

/** Every monster the level was generated with, ready to play. */
export const spawnAll = (level: Level): Monster[] => level.monsters.map((m, i) => spawn(m, i));
