// The content tables the game layer reads at play time (Spec 06 and Spec 02): monsters for wanderers and
// summons, traps, debris finds, fountain effects, altar gods and books. Built once from the bundle and
// passed in with the spells and items, so a level never reads a global.

import type { TemplateEntry } from '../core/templates.ts';
import type { ClassEntry, ContentBundle, AltarGod, DebrisFind, FountainEffectRow, GemJewelry, MinorAbilityEntry, Monster, Trap } from '../core/schemas.ts';
import { effectOf } from '../rules/items/magic.ts';
import type { MinorEffects } from './abilities.ts';

export interface GameContent {
  monsters: readonly Monster[];
  traps: ReadonlyMap<string, Trap>;
  debris: readonly DebrisFind[];
  fountains: readonly FountainEffectRow[];
  gods: ReadonlyMap<string, AltarGod>;
  /** Lore books by id, with their text (Spec 06). */
  books: ReadonlyMap<string, { id: string; text: string }>;
  gems: readonly GemJewelry[];
  /** The tavern's templates (Spec 07, Spec 08): rumours by the fact they need, and quest texts by quest type. */
  rumours: readonly TemplateEntry[];
  questTexts: readonly TemplateEntry[];
  /** Each minor ability's effect from the vocabulary, and its name, by id (Spec 08, Addendum A). */
  minors: MinorEffects;
  minorNames: ReadonlyMap<string, string>;
  /** Each class's major ability name, by the ability's id (Spec 03). */
  majorNames: ReadonlyMap<string, string>;
}

const rows = <T extends { id: string }>(bundle: ContentBundle, name: string): T[] => (bundle.tables[name] ?? []) as T[];

export function gameContentOf(bundle: ContentBundle): GameContent {
  return {
    monsters: rows<Monster>(bundle, 'monsters'),
    traps: new Map(rows<Trap>(bundle, 'traps').map((t) => [t.id, t])),
    debris: rows<DebrisFind>(bundle, 'debris_finds'),
    fountains: rows<FountainEffectRow>(bundle, 'fountain_effects'),
    gods: new Map(rows<AltarGod>(bundle, 'altar_gods').map((g) => [g.id, g])),
    books: new Map(rows<{ id: string; text: string }>(bundle, 'books').map((b) => [b.id, b])),
    gems: rows<GemJewelry>(bundle, 'gems_jewelry'),
    rumours: rows<TemplateEntry & { id: string }>(bundle, 'rumours'),
    questTexts: rows<TemplateEntry & { id: string }>(bundle, 'quest_templates'),
    minors: new Map(rows<MinorAbilityEntry>(bundle, 'minor_abilities').map((m) => [m.id, effectOf(m)])),
    minorNames: new Map(rows<MinorAbilityEntry>(bundle, 'minor_abilities').map((m) => [m.id, m.name])),
    majorNames: new Map(rows<ClassEntry>(bundle, 'classes').map((c) => [c.ability.id, c.ability.name])),
  };
}

/** No tables at all: a level plays, but nothing is rolled from a table. */
export const noContent = (): GameContent => gameContentOf({ tables: {} });
