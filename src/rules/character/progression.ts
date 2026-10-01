// Experience and leveling (Spec 03, "Experience and leveling"). XP comes only from banking
// treasure, so every level up happens in a village; the caller runs one level-up screen per
// level owed, in order.

import type { LogMessage } from '../../core/log.ts';
import type { Character, ClassDef, StepLevel } from './character.ts';
import { STEP_LEVELS } from './character.ts';
import { MAX_POOL_DICE, type PoolName, stepUp } from './dice.ts';
import { drawMinor } from './minor.ts';

/** Total XP needed for levels 1 to 10 (Spec 03). */
export const LEVEL_XP: readonly number[] = [0, 2000, 4000, 8000, 16000, 32000, 64000, 128000, 256000, 512000];
export const MAX_LEVEL = LEVEL_XP.length;

/** The level a total of XP reaches, at most 10. */
export function levelForXp(xp: number): number {
  let level = 1;
  while (level < MAX_LEVEL && xp >= LEVEL_XP[level]!) level++;
  return level;
}

/** Bank treasure: 1 XP per 1 gp, coins at face value and gems at appraised value (Spec 03). Returns the XP gained. */
export function bankTreasure(character: Character, gp: number): number {
  const gained = Math.max(0, Math.floor(gp));
  character.xp += gained;
  return gained;
}

/** Level ups still to run: one level-up screen per level crossed (Spec 03). */
export const levelsOwed = (character: Character): number => levelForXp(character.xp) - character.level;

/** Pools that can take the new die (Spec 03: up to 6 dice per pool). */
export const poolsWithRoom = (character: Character): PoolName[] =>
  (Object.keys(character.pools) as PoolName[]).filter((p) => character.pools[p].max < MAX_POOL_DICE);

export interface LevelUp {
  level: number;
  pool: PoolName;
  /** The pool that stepped up at this level, if the class steps here. */
  stepped?: PoolName;
  /** The minor ability drawn, if this level draws one. */
  minor?: string;
  messages: LogMessage[];
}

/**
 * Apply the next level: one new die arriving full in the chosen pool, any class step change for
 * that level, and one minor ability drawn at random from the class pool. Returns null when no
 * level is owed or the chosen pool is already at 6 dice, leaving the character unchanged.
 */
export function levelUp(runSeed: number, character: Character, cls: ClassDef, pool: PoolName): LevelUp | null {
  if (levelsOwed(character) <= 0) return null;
  const target = character.pools[pool];
  if (target.max >= MAX_POOL_DICE) return null;

  const level = ++character.level;
  target.max++;
  target.dice++;
  const messages: LogMessage[] = [{ kind: 'system', text: `You reach level ${level}.` }];
  const result: LevelUp = { level, pool, messages };

  if ((STEP_LEVELS as readonly number[]).includes(level)) {
    const stepped = cls.steps[level as StepLevel];
    const before = character.pools[stepped].step;
    character.pools[stepped].step = stepUp(before);
    result.stepped = stepped;
    if (character.pools[stepped].step !== before) {
      messages.push({ kind: 'system', text: `Your ${stepped} dice become d${character.pools[stepped].step}.` });
    }
  }
  const minor = drawMinor(runSeed, character, cls, level);
  if (minor) {
    result.minor = minor.id;
    messages.push({ kind: 'system', text: `You gain the ability ${minor.name ?? minor.id}.` });
  }
  return result;
}
