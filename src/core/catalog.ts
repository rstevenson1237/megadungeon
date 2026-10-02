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
export type MagicItemKind = (typeof MAGIC_ITEM_KINDS)[number];

/** The kinds that wear a disguise until identified (Spec 05): potion looks, ring metals, wand, rod and staff woods. */
export const DISGUISED_KINDS = ['potion', 'ring', 'wand', 'rod', 'staff'] as const;

/** What an equipment base is (Spec 05): the 16 weapon, armour and shield bases, plus ammunition and tools (lockpicks). */
export const BASE_TYPES = ['melee', 'ranged', 'armour', 'shield', 'ammo', 'tool'] as const;
export type BaseType = (typeof BASE_TYPES)[number];

/** Ammunition types, tracked per type (Spec 04, Spec 05). */
export const AMMO_TYPES = ['stone', 'arrow', 'bolt'] as const;
export type AmmoType = (typeof AMMO_TYPES)[number];

/** Gear traits defined in code (Spec 05); a table row names the ones it has. `flame` is a magic weapon's. */
export const GEAR_TRAITS = [
  'light',
  'throwable',
  'stun',
  'defence',
  'reach',
  'reload',
  'heavy',
  'no_stealth_buff',
  'notice_advantage',
  'spell_penalty',
  'ranged_penalty',
  'flame',
] as const;
export type GearTrait = (typeof GEAR_TRAITS)[number];

/** Always-on effects of rings and clothing (Spec 05, "Magic items"). Each is a word for an effect of the vocabulary (`PASSIVE_EFFECTS`). */
export const PASSIVES = ['search', 'stealth', 'melee', 'wait', 'lockpick'] as const;
export type Passive = (typeof PASSIVES)[number];

/** Where clothing and artifacts are worn (Spec 05, "Equipment slots"). */
export const WORN_SLOTS = ['cloak', 'boots', 'gloves', 'hat', 'ring'] as const;
export type WornSlot = (typeof WORN_SLOTS)[number];

/** Effects of potions and worn powers, defined in code (Spec 05). Spell effects are in `SPELL_EFFECTS`. */
export const ITEM_EFFECTS = ['restore_dice', 'grant_status', 'cure_poison', 'invisibility', 'remove_curse'] as const;
export type ItemEffect = (typeof ITEM_EFFECTS)[number];

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

/** The eight status effects (Spec 04, "Status effects"). */
export const STATUS_IDS = ['poisoned', 'slowed', 'hasted', 'asleep', 'held', 'frightened', 'blessed', 'cursed'] as const;
export type StatusId = (typeof STATUS_IDS)[number];

/** The three spell shapes (Spec 04, "Starting spell list"). */
export const SPELL_SHAPES = ['self', 'target', 'area'] as const;
export type SpellShape = (typeof SPELL_SHAPES)[number];

/** Spell effects defined in code (Spec 08: tables name effects, never scripts). Item effects arrive with task 2.9. */
export const SPELL_EFFECTS = [
  'restore_die',
  'shield',
  'status',
  'light',
  'detect',
  'blink',
  'remove_die',
  'drain',
  'push',
] as const;
export type SpellEffect = (typeof SPELL_EFFECTS)[number];

/** What a trap does when it springs (Spec 06, "Traps"); a table row names one and carries its numbers. */
export const TRAP_EFFECTS = ['lose_dice', 'status', 'alarm', 'teleport', 'collapse', 'deep_pit', 'summon'] as const;
export type TrapEffect = (typeof TRAP_EFFECTS)[number];

/** What a fountain can do to a drinker (Spec 06, "Fixtures"). `restore_dice` and `cure_poison` are shared with potions. */
export const FOUNTAIN_EFFECTS = ['restore_dice', 'cure_poison', 'reveal_map', 'coins', 'poison', 'water_creature', 'nothing'] as const;
export type FountainEffect = (typeof FOUNTAIN_EFFECTS)[number];

/** What an altar's god gives for a good offering (Spec 06, "Fixtures"). */
export const BLESSINGS = ['bless', 'lift_curse', 'identify'] as const;
export type Blessing = (typeof BLESSINGS)[number];

/** Effects defined in code. Tables name these (`effect: restore_dice`). */
export const EFFECTS: readonly string[] = [...new Set([...SPELL_EFFECTS, ...ITEM_EFFECTS, ...TRAP_EFFECTS, ...FOUNTAIN_EFFECTS])];

// --- The effect vocabulary (Spec 08, Addendum A; task 3.5) ---
//
// One list of effects in code, which minor abilities, artifacts and shrine buffs name (`effect: wait_rounds`), each
// with the fields that effect needs. A ring's or a piece of clothing's `passive` is a word for one of them
// (`PASSIVE_EFFECTS`), so every worn power, ability and buff is worked out by the same code (rules/items/gear.ts,
// `derive`). A new effect is code first: it is added here by a task, with its code and its test, and only then may
// content name it.

/** The roll types an `advantage` effect can name (Spec 08, Addendum A, "Kinds of effect"). */
export const ADVANTAGE_ROLLS = ['search', 'notice', 'lockpick', 'disarm', 'avoid_trap', 'spell'] as const;
export type AdvantageRoll = (typeof ADVANTAGE_ROLLS)[number];

/** Creature tags the game keeps on a creature in play, which an effect's `tag` may name. A new one is code first. */
export const CREATURE_TAGS = ['undead'] as const;
export type CreatureTag = (typeof CREATURE_TAGS)[number];

/** The kinds of effect (Spec 08, Addendum A). */
export type EffectKind = 'advantage' | 'modifier' | 'rate' | 'trigger' | 'active';

/** The fields an effect can carry (Spec 08, Addendum A, "Fields"). */
// `rolls`, not `roll`: on any row `roll:` names a table to nest a roll in (Spec 08, "Table format and rolling"), and
// an artifact row is rolled by the shared roller (clarification of task 3.5).
export const EFFECT_FIELDS = ['amount', 'rolls', 'tag', 'shape', 'rounds'] as const;
export type EffectField = (typeof EFFECT_FIELDS)[number];

/** Tables whose rows name an effect: a shrine buff is an altar god's `buff`. */
export type EffectTable = 'minor_abilities' | 'artifacts' | 'altar_gods';

export interface EffectDef {
  kind: EffectKind;
  /** The fields a row must give (`required`) or may give (`optional`); any other field fails the build. */
  fields: Partial<Record<EffectField, 'required' | 'optional'>>;
  /** The smallest and largest `amount` allowed; 1 and no limit unless given. */
  amount?: readonly [number, number];
  /** Tables that may name it; every table unless given. Actives and bound effects belong to minor abilities. */
  only?: readonly EffectTable[];
  /** What it does, for the content author. */
  text: string;
}

/** The vocabulary. Ids never change once released; `text` says what the code does. */
export const ABILITY_EFFECTS = {
  advantage: {
    kind: 'advantage',
    fields: { rolls: 'required', shape: 'optional' },
    text: 'Advantage on the rolls named in `rolls`: search checks, passive notice, lockpicking, disarming, the avoid check of a hidden floor trap, or spell rolls (of `shape` only, when given)',
  },
  spell_focus: { kind: 'advantage', fields: {}, text: 'Advantage on spell rolls while no hostile creature is adjacent' },
  against_tag: { kind: 'advantage', fields: { tag: 'required' }, text: 'Advantage on the Combat die in melee against a creature with `tag`, attacking and defending' },
  melee: { kind: 'modifier', fields: { amount: 'required' }, text: '+`amount` on melee rolls' },
  weapon_melee: {
    kind: 'modifier',
    fields: { amount: 'required' },
    only: ['minor_abilities'],
    text: '+`amount` on melee rolls with the weapon base wielded when it was drawn; drawn bare-handed, it binds to the next weapon wielded',
  },
  defence: { kind: 'modifier', fields: { amount: 'required' }, text: '+`amount` on the Combat die when defending against melee' },
  stealth: { kind: 'modifier', fields: {}, text: "Monsters' notice rolls against the player have disadvantage" },
  spell_widen: {
    kind: 'modifier',
    fields: { amount: 'required' },
    text: "An area spell's footprint grows by `amount` cells each way, and a spell centred on the caster reaches `amount` cells further",
  },
  wait_rounds: { kind: 'rate', fields: { amount: 'required' }, text: 'Waiting restores a Combat die every `amount` rounds; with several, the shortest wins' },
  pack_slots: { kind: 'rate', fields: { amount: 'required' }, text: '+`amount` pack slots; several add up' },
  sell_bonus: { kind: 'rate', fields: { amount: 'required' }, text: 'Selling pays `amount` percent more; several add up' },
  rest_cost: { kind: 'rate', fields: { amount: 'required' }, amount: [0, 100], text: 'A village rest costs `amount` percent of its price (0 is free); with several, the lowest wins' },
  potion_magic: { kind: 'rate', fields: { amount: 'required' }, text: 'A potion that restores Magic dice restores `amount` more' },
  book_lore: {
    kind: 'trigger',
    fields: {},
    text: "On reading: a spellbook shows its spell and a book its lore-chain place before reading, and a spellbook is learned on 2 to 3 as well as on 4 or more",
  },
  sure_footing: { kind: 'trigger', fields: {}, text: "On the avoid check of a hidden floor trap: 2 to 3 jumps clear like 4 or more, and a 1 springs it one time in two" },
  careful_opening: {
    kind: 'trigger',
    fields: {},
    text: 'On opening a container whose trap is not found: a Skill check, where only a 1 springs it; otherwise the trap is found, not sprung',
  },
  rally: { kind: 'trigger', fields: {}, text: 'Once per level visit: when a hit leaves the player with one Combat die, regain one' },
  sanctuary: {
    kind: 'active',
    fields: { amount: 'required', rounds: 'required' },
    only: ['minor_abilities'],
    text: "Used with Q as a skill use: for `rounds` rounds, monsters take -`amount` on melee rolls against the player",
  },
  purify: {
    kind: 'active',
    fields: {},
    only: ['minor_abilities'],
    text: 'Used with Q as a skill use: lifts the curse of one worn cursed item (and the Cursed status if no curse is left), or else ends Poisoned',
  },
} as const satisfies Record<string, EffectDef>;

export type AbilityEffect = keyof typeof ABILITY_EFFECTS;
export const ABILITY_EFFECT_IDS = Object.keys(ABILITY_EFFECTS) as AbilityEffect[];

/** What a row says about its effect: the effect's id and the fields it needs (Spec 08, Addendum A). */
export interface EffectSpec {
  effect: AbilityEffect;
  amount?: number | undefined;
  rolls?: AdvantageRoll | AdvantageRoll[] | undefined;
  tag?: CreatureTag | undefined;
  shape?: SpellShape | undefined;
  rounds?: number | undefined;
}

/** The effect each ring and clothing `passive` stands for (Spec 05, "Magic items"); `amount` comes from the row. */
export const PASSIVE_EFFECTS: Readonly<Record<Passive, Omit<EffectSpec, 'amount'>>> = {
  search: { effect: 'advantage', rolls: 'search' },
  lockpick: { effect: 'advantage', rolls: 'lockpick' },
  stealth: { effect: 'stealth' },
  melee: { effect: 'melee' },
  wait: { effect: 'wait_rounds' },
};

/**
 * Why a row's effect is not valid for `table`: an effect not on the list, a field it needs missing, a field it does
 * not take, or an amount out of range. Empty when it is valid.
 */
export function effectErrors(spec: Partial<Record<'effect' | EffectField, unknown>>, table: EffectTable): string[] {
  const id = spec.effect;
  if (typeof id !== 'string' || !(id in ABILITY_EFFECTS)) return [`"${String(id)}" is not an effect on the list (${ABILITY_EFFECT_IDS.join(', ')})`];
  const def: EffectDef = ABILITY_EFFECTS[id as AbilityEffect];
  const errors: string[] = [];
  if (def.only && !def.only.includes(table)) errors.push(`${id} is only for ${def.only.join(', ')}`);
  for (const field of EFFECT_FIELDS) {
    const need = def.fields[field];
    if (need === 'required' && spec[field] === undefined) errors.push(`${id} needs \`${field}\``);
    if (!need && spec[field] !== undefined) errors.push(`${id} takes no \`${field}\``);
  }
  const [lo, hi] = def.amount ?? [1, Infinity];
  if (typeof spec.amount === 'number' && (spec.amount < lo || spec.amount > hi)) errors.push(`${id} needs an \`amount\` from ${lo}${hi === Infinity ? ' up' : ` to ${hi}`}`);
  if (spec.shape !== undefined && id === 'advantage' && ![spec.rolls].flat().includes('spell')) errors.push('`shape` goes with the roll type `spell`');
  return errors;
}

/** Launch floors for tables that are checked by group (Spec 08, "Validation and coverage"). */
export const MONSTERS_PER_RATING = 5;
export const QUEST_TEMPLATES_PER_TYPE = 10;
export const MINOR_ABILITIES_PER_CLASS = 12;
export const RUMOURS_PER_KIND = 1;
export const RATINGS: readonly number[] = Array.from({ length: 20 }, (_, i) => i + 1);

/** Style mix: no text table may have more than this share of entries in a non-baseline style. */
export const MAX_OTHER_STYLE_SHARE = 0.2;
