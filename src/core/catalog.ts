// The table catalog (Spec 08, "Table catalog"): every table the game needs, with its launch
// minimum. The coverage report lists all of these, whether or not a file exists yet.

export type Area = 'world' | 'creatures' | 'people' | 'classes' | 'items' | 'magic' | 'features' | 'lore';

export interface CatalogEntry {
  /** Table name: the YAML file name without extension. */
  table: string;
  area: Area;
  label: string;
  /** Launch minimum, in `unit`. */
  minimum: number;
  unit: 'entries' | 'slots';
  readBy: string;
  /**
   * Levels the table must cover. Set for the tables Spec 02 rolls by depth: monsters (step 8),
   * bosses (level 100 holds the final boss), magic items (step 9) and gems (tiered by depth).
   */
  depthCoverage?: readonly [number, number];
  /** A text table: the coverage report shows its style mix (Spec 08, "Style mix"). */
  text?: true;
}

export const CATALOG: readonly CatalogEntry[] = [
  { table: 'level_themes', area: 'world', label: 'Level themes', minimum: 13, unit: 'entries', readBy: 'Spec 02', depthCoverage: [1, 100] },
  { table: 'village_names', area: 'world', label: 'Village names', minimum: 40, unit: 'entries', readBy: 'Spec 07', text: true },
  { table: 'monsters', area: 'creatures', label: 'Monsters', minimum: 150, unit: 'entries', readBy: 'Specs 02, 04', depthCoverage: [1, 100] },
  { table: 'bosses', area: 'creatures', label: 'Bosses', minimum: 40, unit: 'entries', readBy: 'Specs 02, 04', depthCoverage: [1, 99] },
  { table: 'npc_names', area: 'creatures', label: 'NPC names', minimum: 300, unit: 'entries', readBy: 'Specs 04, 07', text: true },
  { table: 'rivals', area: 'creatures', label: 'Named rivals', minimum: 30, unit: 'entries', readBy: 'Spec 02' },
  { table: 'character_names', area: 'people', label: 'Character names', minimum: 150, unit: 'entries', readBy: 'Spec 03', text: true },
  { table: 'classes', area: 'classes', label: 'Classes', minimum: 20, unit: 'entries', readBy: 'Spec 03' },
  { table: 'minor_abilities', area: 'classes', label: 'Minor abilities', minimum: 240, unit: 'slots', readBy: 'Spec 03' },
  { table: 'equipment_bases', area: 'items', label: 'Weapon, armour and shield bases', minimum: 16, unit: 'entries', readBy: 'Spec 05' },
  { table: 'magic_items', area: 'items', label: 'Magic items', minimum: 130, unit: 'entries', readBy: 'Spec 05', depthCoverage: [1, 100] },
  { table: 'artifacts', area: 'items', label: 'Artifacts', minimum: 40, unit: 'entries', readBy: 'Specs 02, 05' },
  { table: 'disguise_names', area: 'items', label: 'Disguise names', minimum: 100, unit: 'entries', readBy: 'Spec 05' },
  { table: 'gems_jewelry', area: 'items', label: 'Gems and jewelry', minimum: 50, unit: 'entries', readBy: 'Spec 05', depthCoverage: [1, 100] },
  { table: 'spells', area: 'magic', label: 'Spells', minimum: 15, unit: 'entries', readBy: 'Spec 04' },
  { table: 'fountain_effects', area: 'features', label: 'Fountain effects', minimum: 12, unit: 'entries', readBy: 'Spec 06' },
  { table: 'altar_gods', area: 'features', label: 'Altar gods', minimum: 8, unit: 'entries', readBy: 'Specs 02, 06' },
  { table: 'runes', area: 'features', label: 'Rune effects and rune-word letters', minimum: 10, unit: 'entries', readBy: 'Specs 02, 06' },
  { table: 'traps', area: 'features', label: 'Traps', minimum: 12, unit: 'entries', readBy: 'Spec 06' },
  { table: 'debris_finds', area: 'features', label: 'Debris finds', minimum: 20, unit: 'entries', readBy: 'Spec 06' },
  { table: 'books', area: 'lore', label: 'Books', minimum: 200, unit: 'entries', readBy: 'Spec 06', text: true },
  { table: 'graffiti', area: 'lore', label: 'Graffiti', minimum: 300, unit: 'entries', readBy: 'Spec 06', text: true },
  { table: 'signs', area: 'lore', label: 'Signs', minimum: 120, unit: 'entries', readBy: 'Spec 06', text: true },
  { table: 'lore_chains', area: 'lore', label: 'Lore chains', minimum: 25, unit: 'entries', readBy: 'Specs 02, 06', text: true },
  { table: 'rumours', area: 'lore', label: 'Rumour templates', minimum: 60, unit: 'entries', readBy: 'Spec 07', text: true },
  { table: 'quest_templates', area: 'lore', label: 'Quest templates', minimum: 40, unit: 'entries', readBy: 'Specs 02, 07', text: true },
  { table: 'quest_items', area: 'lore', label: 'Named quest items', minimum: 60, unit: 'entries', readBy: 'Specs 02, 07', text: true },
  { table: 'vault_names', area: 'lore', label: 'Vault and shrine names', minimum: 30, unit: 'entries', readBy: 'Spec 02', text: true },
];

/** The eight layout algorithms and the level 100 set piece (Spec 02, "Level sizes and layouts"). */
export const LAYOUT_ALGORITHMS = [
  'rooms_and_corridors',
  'mirrored_halls',
  'warren_tunnels',
  'channel_grid',
  'cellular_caves',
  'maze_with_crypts',
  'freeform_chambers',
  'disjoint_rooms',
  'set_piece',
] as const;
export type LayoutAlgorithm = (typeof LAYOUT_ALGORITHMS)[number];

/** What a cellular-caves level stamps in, and what its rivers, lakes and channels hold (Spec 02, task 2.3). */
export const CAVE_STAMPS = ['shafts', 'river', 'lake'] as const;
export type CaveStamp = (typeof CAVE_STAMPS)[number];
export const LIQUIDS = ['water', 'lava'] as const;
export type Liquid = (typeof LIQUIDS)[number];

export const SIZE_CLASSES = ['small', 'medium', 'large'] as const;

/** Door kinds a theme may weight (Spec 02, clarifications of task 2.4); `none` is an entrance left open. */
export const DOOR_WEIGHT_KEYS = ['none', 'normal', 'locked', 'secret'] as const;
export type DoorWeightKey = (typeof DOOR_WEIGHT_KEYS)[number];

/** Containers and fixtures (Spec 06) and the clutter and lore a level places (Spec 02, step 6 and 10). */
export const CONTAINER_KINDS = ['chest', 'sack', 'pottery', 'rack'] as const;
export type ContainerKind = (typeof CONTAINER_KINDS)[number];
export const FIXTURE_KINDS = ['fountain', 'altar', 'sarcophagus', 'rune'] as const;
export type FixtureKind = (typeof FIXTURE_KINDS)[number];

/**
 * Keys of a theme's `features` field: a weight multiplier per kind, plus `containers` (a count
 * multiplier) and the lore kinds, whose counts it multiplies.
 */
export const FEATURE_KEYS = [...CONTAINER_KINDS, ...FIXTURE_KINDS, 'debris', 'containers', 'graffiti', 'sign', 'book'] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** Trap kinds: floor traps spring on the player's step, container traps on opening (Spec 06). */
export const TRAP_KINDS = ['floor', 'container'] as const;
export type TrapKind = (typeof TRAP_KINDS)[number];

/** Kinds of magic item (Spec 05, "Magic items"). */
export const MAGIC_ITEM_KINDS = ['potion', 'ring', 'wand', 'rod', 'staff', 'clothing', 'weapon', 'armour'] as const;
export const GEM_KINDS = ['gem', 'jewelry'] as const;
export const NPC_KINDS = ['rival', 'trader', 'bandit', 'hermit', 'captive'] as const;
export type NpcKind = (typeof NPC_KINDS)[number];

/** Rumour kinds (Spec 07, Tavern): what a rumour can say. A rumour template `needs` one. */
export const RUMOUR_KINDS = ['vault', 'boss', 'teleporter', 'rival_stash', 'trap_level', 'fountain'] as const;
export type RumourKind = (typeof RUMOUR_KINDS)[number];

/** Quest types (Spec 02, Quest goals). A quest template `needs` one. */
export const QUEST_TYPES = ['captive', 'belonging', 'magic_item', 'opponent'] as const;
export type QuestType = (typeof QUEST_TYPES)[number];

/** Monster behaviours defined in code (Spec 04). `stub` serves the Phase 1 stub monsters until task 2.7. */
export const BEHAVIOURS = ['brute', 'skirmisher', 'caster', 'ambusher', 'pack', 'coward', 'stub'] as const;

/** Effects defined in code. Tables name these (`effect: restore_die`); none exist until tasks 2.8 and 2.9. */
export const EFFECTS: readonly string[] = [];

/** Launch floors for tables that are checked by group (Spec 08, "Validation and coverage"). */
export const MONSTERS_PER_RATING = 5;
export const QUEST_TEMPLATES_PER_TYPE = 10;
export const RUMOURS_PER_KIND = 1;
export const RATINGS: readonly number[] = Array.from({ length: 20 }, (_, i) => i + 1);

/** Style mix: no text table may have more than this share of entries in a non-baseline style. */
export const MAX_OTHER_STYLE_SHARE = 0.2;
