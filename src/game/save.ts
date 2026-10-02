// What a save holds and how it is read back (Spec 09, "What a save holds"; "Versioning and migration"). A save stores
// only what the seed cannot rebuild: the character, what they own, the player's changes to each level, and what they
// have learned. The run layout, the level geometry and the disguise names are rebuilt from the seed. A plain JSON text.
//
// Two things are packed to keep a full run's save well under 1 MB: the explored cells of a level become runs, and a
// living monster keeps only the fields that differ from a fresh one.

import type { Character, ClassDef } from '../rules/character/character.ts';
import { SUPPORTED_GENERATORS } from '../rules/world/level.ts';
import { type LevelDelta, type PlayerState } from './game.ts';
import { type Monster, creature } from './monsters.ts';
import { Run, type RunOptions } from './run.ts';

/** The save format. Bump it with every change to what is stored, and add a migration from the format before. */
export const SAVE_FORMAT = 1;
/** The generator versions this build can still build levels with; a save keeps the one it started with (Spec 02, Spec 09). */
export { SUPPORTED_GENERATORS };

/**
 * Until the Content complete gate, a save made with other content is refused (Spec 09, Addendum A): the tables shape
 * what a level holds, so its deltas would land on a different level. The policy for after release is chosen at that gate.
 */
export const REFUSE_OTHER_CONTENT = true;

/** A monster as saved: what a fresh monster of its name and place already has is left out. */
type PackedMonster = Partial<Monster> & Pick<Monster, 'id' | 'name' | 'glyph' | 'colour' | 'x' | 'y' | 'dice' | 'modifier'>;
type PackedDelta = Omit<LevelDelta, 'explored' | 'monsters'> & { explored: number[]; monsters: PackedMonster[] };

export interface SaveData {
  /** The three versions (Spec 09): the save format, the generator the levels were built with, the content bundle. */
  format: number;
  generator: number;
  content: string;
  seed: number;
  /** The date, when the seed was the seed of the day. */
  daily?: string;
  /** Who this is on the leaderboard. */
  characterId: string;
  savedAt: string;
  /** The village of the last rest, the only place a save is made. */
  depth: number;
  round: number;
  character: Character;
  player: PlayerState;
  deltas: Record<number, PackedDelta>;
}

export class SaveError extends Error {
  constructor(
    readonly reason: 'newer' | 'unsupported' | 'invalid' | 'content',
    message: string,
  ) {
    super(message);
    this.name = 'SaveError';
  }
}

// --- Packing ---

/**
 * The explored cells of a level, one 0 or 1 per cell, as the lengths of its alternating runs of 0s and 1s, beginning
 * with the 0s (which may be none): a level is mostly a few big blobs, so this is small.
 */
export function packRuns(bits: readonly number[]): number[] {
  const runs: number[] = [];
  let current = 0;
  let length = 0;
  for (const bit of bits) {
    if ((bit ? 1 : 0) === current) length++;
    else {
      runs.push(length);
      current = 1 - current;
      length = 1;
    }
  }
  runs.push(length);
  return runs;
}

export function unpackRuns(runs: readonly number[]): number[] {
  const bits: number[] = [];
  runs.forEach((length, i) => {
    for (let n = 0; n < length; n++) bits.push(i % 2);
  });
  return bits;
}

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

export function packMonster(m: Monster): PackedMonster {
  const fresh = creature({ id: m.id, name: m.name, glyph: m.glyph, colour: m.colour, x: m.x, y: m.y, dice: m.dice, modifier: m.modifier });
  const packed: Record<string, unknown> = {};
  for (const key of Object.keys(m) as (keyof Monster)[]) {
    if (key in fresh && same(fresh[key], m[key])) continue;
    packed[key] = m[key];
  }
  for (const key of ['id', 'name', 'glyph', 'colour', 'x', 'y', 'dice', 'modifier'] as const) packed[key] = m[key];
  return packed as PackedMonster;
}

export const unpackMonster = (p: PackedMonster): Monster => creature(p);

function packDelta(delta: LevelDelta): PackedDelta {
  return { ...delta, explored: packRuns(delta.explored), monsters: delta.monsters.map(packMonster) };
}

function unpackDelta(packed: PackedDelta): LevelDelta {
  return { ...packed, explored: unpackRuns(packed.explored), monsters: packed.monsters.map(unpackMonster) };
}

// --- Writing ---

export interface SaveSource {
  run: Run;
  contentVersion: string;
  now?: Date;
}

/** The save of a run standing in a village: a rest is the only time one is made (Spec 09). */
export function toSave({ run, contentVersion, now = new Date() }: SaveSource): SaveData {
  if (!run.inVillage) throw new RangeError('a game is saved only in a village');
  return structuredClone({
    format: SAVE_FORMAT,
    generator: run.generator,
    content: contentVersion,
    seed: run.runSeed,
    ...(run.daily ? { daily: run.daily } : {}),
    characterId: run.characterId,
    savedAt: now.toISOString(),
    depth: run.depth,
    round: run.round,
    character: run.character,
    player: run.player,
    deltas: Object.fromEntries(Object.entries(run.deltas).map(([depth, delta]) => [depth, packDelta(delta)])),
  });
}

export const serialise = (save: SaveData): string => JSON.stringify(save);

// --- Reading ---

/** A step from one save format to the next. */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;
/** `migrations[n]` upgrades a format-n save to format n + 1. None is needed yet: format 1 is the first. */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

/**
 * Read a save from its text: upgrade an older format step by step, and refuse, with a clear message and nothing
 * touched, a save from a newer game, one built by a generator this build no longer has, or one that is not a save.
 */
export function parseSave(
  text: string,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  current = SAVE_FORMAT,
  content?: string,
): SaveData {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new SaveError('invalid', 'This is not a Megadungeon save file.');
  }
  if (typeof data !== 'object' || data === null || typeof data.format !== 'number') throw new SaveError('invalid', 'This is not a Megadungeon save file.');
  if (data.format > current) {
    throw new SaveError('newer', `This save was made by a newer version of the game (save format ${data.format}; this game reads up to ${current}). It has not been touched.`);
  }
  for (let format = data.format; format < current; format++) {
    const step = migrations[format];
    if (!step) throw new SaveError('invalid', `No way to upgrade a format ${format} save.`);
    data = { ...step(data), format: format + 1 };
  }
  const save = data as unknown as SaveData;
  if (!SUPPORTED_GENERATORS.includes(save.generator)) {
    throw new SaveError('unsupported', `This save's levels were built with generator ${save.generator}, which this version of the game no longer has.`);
  }
  for (const key of ['seed', 'depth', 'round', 'character', 'player', 'deltas', 'characterId'] as const) {
    if (save[key] === undefined) throw new SaveError('invalid', `The save is damaged: it has no ${key}.`);
  }
  if (REFUSE_OTHER_CONTENT && content !== undefined && save.content !== content) {
    throw new SaveError('content', 'This save was made with different game content and cannot be loaded by this version.');
  }
  return save;
}

/** The run a save holds, standing in the village of the last rest. `base` carries the tables and the layout for the seed. */
export function restoreRun(save: SaveData, base: RunOptions, classDef?: ClassDef): Run {
  return new Run(save.seed, save.player, {
    ...base,
    startDepth: save.depth,
    round: save.round,
    deltas: Object.fromEntries(Object.entries(save.deltas).map(([depth, delta]) => [Number(depth), unpackDelta(delta)])),
    character: save.character,
    ...(classDef ? { classDef } : {}),
    characterId: save.characterId,
    generator: save.generator,
    ...(save.daily ? { daily: save.daily } : {}),
  });
}
