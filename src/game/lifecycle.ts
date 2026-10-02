// The ends of a run (Spec 09, "Death and new characters"; "Leaderboard"): what goes on the leaderboard, and what a new
// character on the same seed starts with.

import { EQUIP_SLOTS, type Item } from '../rules/items/types.ts';
import { STARTING_BANK } from './town-state.ts';
import type { BoardEntry, Outcome } from './leaderboard.ts';
import type { Run } from './run.ts';
import { type PlayerState, createPlayer } from './game.ts';
import { createRng, hash32 } from '../core/rng.ts';
import { rollTable } from '../core/roller.ts';
import type { CharacterName, ContentBundle, Spell } from '../core/schemas.ts';
import { STEP_LEVELS, createCharacter, type ClassDef } from '../rules/character/character.ts';
import { classesFrom } from '../rules/character/classes.ts';
import { type PoolName, type Step, stepUp } from '../rules/character/dice.ts';
import { startingKit } from '../rules/items/kit.ts';
import { type ItemData, itemDataFrom } from '../rules/items/magic.ts';
import { spellsFrom, startingSpells } from '../rules/magic/spells.ts';

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

// --- Character creation (Spec 03, "Character creation"; Spec 01 and 09, Addendum A) ---

/** What creation needs from the content: the classes, the names it offers, and the tables the kit and spells come from. */
export interface CreationContent {
  classes: readonly ClassDef[];
  /** The `character_names` table (Spec 08, Addendum A). */
  names: readonly CharacterName[];
  items: ItemData;
  spells: readonly Spell[];
}

export function creationContentOf(bundle: ContentBundle): CreationContent {
  return {
    classes: classesFrom(bundle),
    names: (bundle.tables.character_names ?? []) as CharacterName[],
    items: itemDataFrom(bundle),
    spells: spellsFrom(bundle),
  };
}

/**
 * A random name from the `character_names` table (Spec 01, Addendum A): seeded by the run seed and how many names have
 * been asked for on this screen, so asking again gives the next one. Undefined when the table is empty.
 */
export function randomName(runSeed: number, asked: number, names: readonly CharacterName[]): string | undefined {
  return (rollTable(() => names, 'character_names', createRng(hash32('name', runSeed >>> 0, asked))) as CharacterName | undefined)?.name;
}

/** A class's dice at level 10: its starting steps with the three step changes at levels 4, 7 and 9 (Spec 03, Classes). */
export function levelTenSteps(cls: ClassDef): Record<PoolName, Step> {
  const steps = { ...cls.start };
  for (const level of STEP_LEVELS) steps[cls.steps[level]] = stepUp(steps[cls.steps[level]]);
  return steps;
}

/**
 * The player a finished creation starts the run with (Spec 03): level 1 at the class's starting dice, its starting gear
 * (Spec 05) worn and packed, its starting spells (Spec 04), and its major ability.
 */
export function startingPlayer(runSeed: number, name: string, cls: ClassDef, content: Pick<CreationContent, 'items' | 'spells'>): PlayerState {
  const character = createCharacter(name, cls);
  const kit = startingKit(cls.gear ?? [], content.items, runSeed);
  return createPlayer({
    character,
    pack: kit.pack,
    equipment: kit.equipment,
    // The character knows what it set out with: the creation screen names its potions (Spec 01, Addendum A).
    known: [...new Set(kit.pack.filter((i) => i.kind === 'potion').map((i) => i.id))],
    spells: startingSpells(runSeed, character, cls, content.spells),
    abilities: [cls.majorAbility.id],
  });
}
