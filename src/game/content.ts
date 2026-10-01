// The content tables the game layer reads at play time (Spec 06 and Spec 02): monsters for wanderers and
// summons, traps, debris finds, fountain effects, altar gods and books. Built once from the bundle and
// passed in with the spells and items, so a level never reads a global.

import type { ContentBundle, AltarGod, DebrisFind, FountainEffectRow, GemJewelry, Monster, Trap } from '../core/schemas.ts';

export interface GameContent {
  monsters: readonly Monster[];
  traps: ReadonlyMap<string, Trap>;
  debris: readonly DebrisFind[];
  fountains: readonly FountainEffectRow[];
  gods: ReadonlyMap<string, AltarGod>;
  /** Lore books by id, with their text (Spec 06). */
  books: ReadonlyMap<string, { id: string; text: string }>;
  gems: readonly GemJewelry[];
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
  };
}

/** No tables at all: a level plays, but nothing is rolled from a table. */
export const noContent = (): GameContent => gameContentOf({ tables: {} });
