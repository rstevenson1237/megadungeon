// The ends of a run (Spec 09, "Death and new characters"; "Leaderboard"): what goes on the leaderboard, and what a new
// character on the same seed starts with.

import { EQUIP_SLOTS, type Item } from '../rules/items/types.ts';
import { STARTING_BANK } from './town-state.ts';
import type { BoardEntry, Outcome } from './leaderboard.ts';
import type { Run } from './run.ts';
import type { PlayerState } from './game.ts';

/** The leaderboard entry for a character at one of its three moments: death, reaching level 100, the final boss (Spec 09). */
export function boardEntry(run: Run, outcome: Outcome, now: Date = new Date()): BoardEntry {
  const { player, character } = run;
  return {
    id: run.characterId,
    seed: run.runSeed >>> 0,
    ...(run.daily ? { daily: run.daily } : {}),
    name: character.name || 'Nameless',
    className: run.classDef?.name ?? character.classId,
    level: character.level,
    deepest: player.stats.deepest,
    kills: player.stats.kills,
    score: character.xp,
    outcome,
    ...(player.dead ? { cause: player.deathCause ?? 'Died', diedAtLevel: run.depth } : {}),
    date: now.toISOString(),
  };
}

/** What the dead character carried, worn or in the pack, any of which the next one may keep (Spec 09): artifacts included. */
export function recoverableItems(player: PlayerState): Item[] {
  return [...EQUIP_SLOTS.map((slot) => player.equipment[slot]).filter((i): i is Item => i !== undefined), ...player.pack];
}

/** A new character on the same seed starts with 10% of the old bank, rounded down, plus the starting 20 gp (Spec 09). */
export const nextBank = (oldBank: number): number => STARTING_BANK + Math.floor(oldBank * 0.1);
