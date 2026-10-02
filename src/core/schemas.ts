import { z } from 'zod';
import {
  AMMO_TYPES,
  BASE_TYPES,
  BLESSINGS,
  CAVE_STAMPS,
  DISGUISED_KINDS,
  DOOR_WEIGHT_KEYS,
  FEATURE_KEYS,
  FOUNTAIN_EFFECTS,
  GEAR_TRAITS,
  GEM_KINDS,
  ITEM_EFFECTS,
  LAYOUT_ALGORITHMS,
  LIQUIDS,
  MAGIC_ITEM_KINDS,
  PASSIVES,
  QUEST_TYPES,
  RUMOUR_KINDS,
  SIZE_CLASSES,
  SPELL_EFFECTS,
  SPELL_SHAPES,
  STATUS_IDS,
  TRAP_EFFECTS,
  TRAP_KINDS,
  WORN_SLOTS,
} from './catalog.ts';

// Shared filter fields every table has (Spec 08, "Table format and rolling").
// Unknown fields fail the build, so every table schema is strict.
const id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'ids are lowercase letters, digits and underscores');

const baseFields = {
  id,
  weight: z.number().positive().optional(),
  depth: z
    .tuple([z.number().int().min(1).max(100), z.number().int().min(1).max(100)])
    .refine(([lo, hi]) => lo <= hi, 'depth range must run low to high')
    .optional(),
  themes: z.record(z.string(), z.number().positive()).optional(),
  tags: z.array(z.string()).optional(),
  // Writing style of a text entry (Spec 08, "Authoring workflow"); no tag means baseline.
  style: z.string().min(1).optional(),
};

/** A character's name (Spec 01, Addendum A): 1 to 16 characters of letters, spaces, apostrophes and hyphens. */
export const CHARACTER_NAME = /^[A-Za-z' -]{1,16}$/;

// Character names (Spec 03, "Character creation"; Spec 08, Addendum A): the random names creation offers.
export const characterNameSchema = z.strictObject({
  ...baseFields,
  name: z.string().regex(CHARACTER_NAME, 'a name is 1 to 16 letters, spaces, apostrophes or hyphens').refine((n) => n.trim() === n && n.length > 0, 'a name has no spaces at its ends'),
});

export const villageNameSchema = z.strictObject({
  ...baseFields,
  name: z.string().min(1),
});

export const monsterSchema = z.strictObject({
  ...baseFields,
  name: z.string().min(1),
  glyph: z.string().length(1),
  colour: z.string().min(1),
  rating: z.string().regex(/^\d+d\d+[+-]\d+$/, 'rating looks like 1d6+0'),
  behaviour: z.string().min(1),
  // Speed (Spec 04): normal when omitted.
  speed: z.enum(['slow', 'normal', 'fast']).optional(),
  loot: z.strictObject({ roll: z.string().min(1) }).optional(),
});

// Bosses (Spec 02, step 11) have the same fields as monsters; the table is rolled by depth.
export const bossSchema = monsterSchema;

/** A 24-bit colour in content, written #rrggbb. */
const colourHex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'a colour is written #rrggbb');

/** The palette tokens a theme gives its map (Spec 08, Addendum A). */
export const PALETTE_TOKENS = ['wall', 'floor', 'door', 'stairs', 'shallow_water', 'deep_water', 'lava', 'accent'] as const;
export type PaletteToken = (typeof PALETTE_TOKENS)[number];

/** The wall glyphs a theme may use (Spec 01, core glyph table): #, or the solid and dark shade blocks. */
export const WALL_GLYPHS = [35, 219, 178] as const;

// Level themes (Spec 02, "Run layout" and "Level sizes and layouts"). The unlock level is the first
// level of `depth`. Feature weights came with task 2.4; palette and tiles with task 3.3 (Spec 08, Addendum A),
// both optional until task 4.2: a theme without them draws in the default set.
export const levelThemeSchema = z.strictObject({
  ...baseFields,
  name: z.string().min(1),
  layout: z.enum(LAYOUT_ALGORITHMS),
  size: z.enum(SIZE_CLASSES),
  // Layout variants (Spec 02, clarifications of task 2.3): what caves stamp in, what the liquid is, pillared halls.
  stamp: z.enum(CAVE_STAMPS).optional(),
  liquid: z.enum(LIQUIDS).optional(),
  pillared: z.boolean().optional(),
  // Placement variants (Spec 02, clarifications of task 2.4): door weights that replace the defaults,
  // and weight or count multipliers per feature kind (the intake's feature bias).
  doors: z.partialRecord(z.enum(DOOR_WEIGHT_KEYS), z.number().min(0)).optional(),
  features: z.partialRecord(z.enum(FEATURE_KEYS), z.number().positive()).optional(),
  palette: z.strictObject(Object.fromEntries(PALETTE_TOKENS.map((t) => [t, colourHex])) as Record<PaletteToken, typeof colourHex>).optional(),
  tiles: z
    .strictObject({
      wall: z.union(WALL_GLYPHS.map((g) => z.literal(g)) as unknown as [z.ZodLiteral<35>, z.ZodLiteral<219>, z.ZodLiteral<178>]),
      floor: z.number().int().min(0).max(255),
    })
    .optional(),
});

// Artifacts (Spec 02, "Run layout"): just a name until task 2.9 gives them powers.
export const artifactSchema = z.strictObject({
  ...baseFields,
  name: z.string().min(1),
  // Where it is worn (default ring) and an always-on effect (Spec 05, "Magic items"); Phase 3 gives the real ones.
  slot: z.enum(WORN_SLOTS).optional(),
  passive: z.enum(PASSIVES).optional(),
  amount: z.number().int().positive().optional(),
});

// Tables placement rolls from (Spec 02, steps 6 to 11). Only the fields placement reads are defined here;
// the tasks that give the things behaviour (2.8 to 2.11) add their own fields.
const named = { ...baseFields, name: z.string().min(1) };
const text = { ...baseFields, text: z.string().min(1) };

// Traps (Spec 06, "Traps"): where it springs (floor or container) and what it does. `heavy` traps cost two dice below level 50.
export const trapSchema = z
  .strictObject({
    ...named,
    kind: z.enum(TRAP_KINDS),
    effect: z.enum(TRAP_EFFECTS),
    dice: z.number().int().positive().optional(),
    heavy: z.boolean().optional(),
    status: z.enum(STATUS_IDS).optional(),
    rounds: z.number().int().positive().optional(),
  })
  .superRefine((trap, ctx) => {
    const bad = (message: string): void => void ctx.addIssue({ code: 'custom', message });
    if (trap.effect === 'lose_dice' && !trap.dice) bad('lose_dice needs `dice`');
    if (trap.effect === 'status' && !trap.status) bad('a status trap needs `status`');
    if ((trap.effect === 'collapse' || trap.effect === 'deep_pit') && !trap.dice) bad(`${trap.effect} needs \`dice\``);
  });

// Fountain effects (Spec 06, "Fixtures"): one is rolled on each drink.
export const fountainEffectSchema = z
  .strictObject({
    ...named,
    effect: z.enum(FOUNTAIN_EFFECTS),
    pool: z.enum(['combat', 'skill', 'magic']).optional(),
    dice: z.number().int().positive().optional(),
    amount: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
  })
  .superRefine((f, ctx) => {
    const bad = (message: string): void => void ctx.addIssue({ code: 'custom', message });
    if (f.effect === 'restore_dice' && (!f.pool || !f.dice)) bad('restore_dice needs `pool` and `dice`');
    if (f.effect === 'coins' && !f.amount) bad('coins needs an `amount` range');
  });

// Debris finds (Spec 06, "Searching and hidden things"): coins scaled by depth, or a small item by id.
export const debrisFindSchema = z
  .strictObject({
    ...named,
    find: z.enum(['coins', 'item']),
    amount: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
    item: id.optional(),
    count: z.number().int().positive().optional(),
  })
  .superRefine((d, ctx) => {
    const bad = (message: string): void => void ctx.addIssue({ code: 'custom', message });
    if (d.find === 'coins' && !d.amount) bad('coins needs an `amount` range');
    if (d.find === 'item' && !d.item) bad('an item find needs an `item` id');
  });

// Altar gods (Spec 06, "Fixtures"): what a good offering gives, and the lasting buff of a completed shrine set.
export const altarGodSchema = z.strictObject({
  ...named,
  blessing: z.enum(BLESSINGS),
  buff: z.strictObject({ passive: z.enum(PASSIVES), amount: z.number().int().positive().optional() }),
});
// A rune-word letter is one capital letter; a rune without one is an effect rune (Spec 06).
export const runeSchema = z.strictObject({ ...named, letter: z.string().regex(/^[A-Z]$/).optional() });
export const bookSchema = z.strictObject(text);
export const graffitiSchema = z.strictObject(text);
export const signSchema = z.strictObject(text);
export const rivalSchema = z.strictObject(named);
export const npcNameSchema = z.strictObject(named);
export const vaultNameSchema = z.strictObject(named);
// Base value in gp, before appraisal (Spec 05, "Treasure and appraisal").
export const gemJewelrySchema = z.strictObject({ ...named, kind: z.enum(GEM_KINDS), value: z.number().int().positive() });
// Equipment bases (Spec 05, "Weapons and ammunition", "Armour and shields"): the numbers a gear item copies when it
// is made. `modifier` is the melee modifier of a weapon or the defence modifier of armour; `price` is for normal
// quality at the surface, in gp; an ammunition row's `price` is for `per` pieces.
export const equipmentBaseSchema = z
  .strictObject({
    ...named,
    type: z.enum(BASE_TYPES),
    price: z.number().int().positive(),
    modifier: z.number().int().optional(),
    hands: z.union([z.literal(1), z.literal(2)]).optional(),
    traits: z.array(z.enum(GEAR_TRAITS)).optional(),
    range: z.number().int().positive().optional(),
    ammo: z.enum(AMMO_TYPES).optional(),
    per: z.number().int().positive().optional(),
    large: z.boolean().optional(),
  })
  .superRefine((base, ctx) => {
    const bad = (message: string): void => void ctx.addIssue({ code: 'custom', message });
    if (base.type === 'melee' && !base.hands) bad('a melee weapon needs `hands`');
    if (base.type === 'ranged' && (!base.range || !base.ammo)) bad('a ranged weapon needs `range` and `ammo`');
    if (base.type === 'ammo' && (!base.ammo || !base.per)) bad('ammunition needs `ammo` and `per`');
    if (base.type !== 'melee' && base.hands) bad('only a melee weapon has `hands`');
    if (base.type !== 'ranged' && base.range) bad('only a ranged weapon has `range`');
    if (base.type !== 'ranged' && base.type !== 'ammo' && base.ammo) bad('only a ranged weapon or ammunition has `ammo`');
    if (base.type === 'ammo' && (base.modifier || base.traits)) bad('ammunition has no modifier or traits');
    if (base.type === 'tool' && (base.modifier || base.traits || base.hands || base.range || base.ammo)) bad('a tool is just a name and a price');
  });

// Disguise names (Spec 05, "Magic items, identification and curses"): the unidentified look of a potion, ring,
// wand, rod or staff, shuffled per run seed. "cloudy blue" gives "a cloudy blue potion".
export const disguiseNameSchema = z.strictObject({ ...named, kind: z.enum(DISGUISED_KINDS) });

// Magic items (Spec 05): the fields each kind reads are listed with it. `value` is in gp.
const itemRounds = z.number().int().positive();
export const magicItemSchema = z
  .strictObject({
    ...named,
    kind: z.enum(MAGIC_ITEM_KINDS),
    value: z.number().int().positive(),
    // Potions and powers worn: an effect in code, with its numbers.
    effect: z.enum(ITEM_EFFECTS).optional(),
    pool: z.enum(['combat', 'skill', 'magic']).optional(),
    dice: z.number().int().positive().optional(),
    status: z.enum(STATUS_IDS).optional(),
    rounds: itemRounds.optional(),
    // Always-on effects of rings and clothing.
    passive: z.enum(PASSIVES).optional(),
    amount: z.number().int().positive().optional(),
    // Wands, rods and staves: the spell they cast and how many charges they start with; a staff's shape.
    spell: id.optional(),
    charges: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
    shape: z.enum(SPELL_SHAPES).optional(),
    // Clothing and artifacts: where it is worn; a worn power that works once per level.
    slot: z.enum(WORN_SLOTS).optional(),
    oncePerLevel: z.boolean().optional(),
    // Magic weapons and armour: the base they are made on, the enchantment and a trait.
    base: id.optional(),
    bonus: z.number().int().positive().optional(),
    trait: z.enum(GEAR_TRAITS).optional(),
    unburdened: z.boolean().optional(),
    off: z.boolean().optional(),
  })
  .superRefine((item, ctx) => {
    const bad = (message: string): void => void ctx.addIssue({ code: 'custom', message });
    switch (item.kind) {
      case 'potion':
        if (!item.effect) bad('a potion needs an `effect`');
        break;
      case 'ring':
        if (!item.passive) bad('a ring needs a `passive`');
        break;
      case 'wand':
      case 'rod':
      case 'staff':
        if (!item.spell || !item.charges) bad(`a ${item.kind} needs a \`spell\` and \`charges\``);
        else if (item.charges[0] > item.charges[1]) bad('charges run low to high');
        if (item.kind === 'staff' && !item.shape) bad('a staff needs a `shape`');
        break;
      case 'clothing':
        if (!item.slot || item.slot === 'ring') bad('clothing needs a `slot` of cloak, boots, gloves or hat');
        if (!item.passive && !item.effect) bad('clothing needs a `passive` or an `effect`');
        break;
      case 'weapon':
      case 'armour':
        if (!item.base) bad(`a magic ${item.kind} needs a \`base\``);
        if (!item.bonus && !item.trait && !item.unburdened) bad(`a magic ${item.kind} needs a \`bonus\`, a \`trait\` or \`unburdened\``);
        break;
    }
    if (item.effect === 'restore_dice' && (!item.pool || !item.dice)) bad('restore_dice needs `pool` and `dice`');
    if (item.effect === 'grant_status' && (!item.status || !item.rounds)) bad('grant_status needs `status` and `rounds`');
    if (item.effect === 'invisibility' && !item.rounds) bad('invisibility needs `rounds`');
    if ((item.passive === 'melee' || item.passive === 'wait') && !item.amount) bad(`${item.passive} needs an \`amount\``);
  });
// A named item for a "find a lost belonging" or "collect a magical item" quest (Spec 02, "Quest goals").
export const questItemSchema = z.strictObject({ ...named, needs: z.enum(['belonging', 'magic_item']) });
// A lore chain's entries, in the order the player finds them (Spec 02, "Connective elements").
export const loreChainSchema = z.strictObject({ ...baseFields, entries: z.array(z.string().min(1)).min(6) });

// Classes (Spec 03, "Classes"): starting steps, the pool stepped at levels 4, 7 and 9, and the major ability.
// Starting dice use one of the two allowed arrays: all d6, or one each of d4, d6 and d8.
const dieStep = z.union([z.literal(4), z.literal(6), z.literal(8), z.literal(10), z.literal(12)]);
const poolName = z.enum(['combat', 'skill', 'magic']);
export const classSchema = z.strictObject({
  ...baseFields,
  name: z.string().min(1),
  start: z
    .strictObject({ combat: dieStep, skill: dieStep, magic: dieStep })
    .refine(
      (s) => {
        const steps = [s.combat, s.skill, s.magic].sort((a, b) => a - b).join();
        return steps === '6,6,6' || steps === '4,6,8';
      },
      'starting dice are all d6, or one each of d4, d6 and d8',
    ),
  steps: z.tuple([poolName, poolName, poolName]),
  // Spells known at level 1 (Spec 04): how many, and the one every character of the class has.
  spells: z.strictObject({ count: z.number().int().min(1).max(3), always: id.optional() }).optional(),
  // Starting gear (Spec 05, "Prices, shops and starting gear"): equipment base or magic item ids, with a count for stacks.
  gear: z.array(z.strictObject({ id, count: z.number().int().positive().optional() })).optional(),
  ability: z.strictObject({ id, name: z.string().min(1), text: z.string().min(1) }),
});

// Minor abilities (Spec 03, "Minor abilities"): one entry may sit in several classes' pools (shared entries).
export const minorAbilitySchema = z.strictObject({
  ...baseFields,
  name: z.string().min(1),
  text: z.string().min(1),
  classes: z.array(id).min(1),
  // May be drawn more than once (such as Pack Mule).
  stackable: z.boolean().optional(),
});

// Spells (Spec 04, "Spells" and "Starting spell list"): the shape, the reach in cells and the effect, which
// is code. `status` and `rounds` belong to the `status` effect; `size` is the footprint of an area spell
// aimed at a creature and `centred` an area around the caster; `affects` limits an area to creatures with a tag.
const spellRounds = z.union([z.number().int().positive(), z.literal('d6')]);
export const spellSchema = z
  .strictObject({
    ...baseFields,
    name: z.string().min(1),
    shape: z.enum(SPELL_SHAPES),
    effect: z.enum(SPELL_EFFECTS),
    text: z.string().min(1),
    reach: z.number().int().positive().optional(),
    size: z.union([z.literal(3), z.literal(5)]).optional(),
    centred: z.boolean().optional(),
    status: z.enum(STATUS_IDS).optional(),
    rounds: spellRounds.optional(),
    distance: z.number().int().positive().optional(),
    affects: z.array(z.string()).min(1).optional(),
  })
  .superRefine((spell, ctx) => {
    const bad = (message: string): void => void ctx.addIssue({ code: 'custom', message });
    if (spell.effect === 'status' && (!spell.status || spell.rounds === undefined)) bad('a status spell needs `status` and `rounds`');
    if (spell.effect !== 'status' && (spell.status || spell.rounds !== undefined) && spell.effect !== 'shield') bad('only status and shield spells take `status` or `rounds`');
    if (spell.effect === 'shield' && spell.rounds === undefined) bad('a shield spell needs `rounds`');
    if (spell.effect === 'push' && spell.distance === undefined) bad('a push spell needs `distance`');
    if (spell.shape === 'area' && !spell.centred && !spell.size) bad('an area spell needs `size` or `centred`');
    if (spell.shape !== 'self' && !spell.reach) bad('a target or area spell needs a `reach`');
    if (spell.centred && spell.shape !== 'area') bad('only an area spell can be centred');
    if (spell.size && (spell.shape !== 'area' || spell.centred)) bad('`size` is for an area spell aimed at a creature');
  });

const templateText = z.array(z.string().min(1)).min(1, 'a template needs at least one phrasing');

// Rumour templates (Spec 08, "Text templates"): `needs` is the kind of fact the run layout must hold.
export const rumourSchema = z.strictObject({
  ...baseFields,
  needs: z.enum(RUMOUR_KINDS),
  text: templateText,
});

// Quest templates (Spec 08, catalog; Spec 02, "Quest goals"): `needs` is the quest type.
export const questTemplateSchema = z.strictObject({
  ...baseFields,
  needs: z.enum(QUEST_TYPES),
  text: templateText,
});

export type Spell = z.infer<typeof spellSchema>;
export type EquipmentBase = z.infer<typeof equipmentBaseSchema>;
export type DisguiseName = z.infer<typeof disguiseNameSchema>;
export type FountainEffectRow = z.infer<typeof fountainEffectSchema>;
export type DebrisFind = z.infer<typeof debrisFindSchema>;
export type AltarGod = z.infer<typeof altarGodSchema>;
export type ClassEntry = z.infer<typeof classSchema>;
export type MinorAbilityEntry = z.infer<typeof minorAbilitySchema>;
export type VillageName = z.infer<typeof villageNameSchema>;
export type Monster = z.infer<typeof monsterSchema>;
export type LevelTheme = z.infer<typeof levelThemeSchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type Rumour = z.infer<typeof rumourSchema>;
export type QuestTemplate = z.infer<typeof questTemplateSchema>;
export type Trap = z.infer<typeof trapSchema>;
export type GemJewelry = z.infer<typeof gemJewelrySchema>;
export type MagicItem = z.infer<typeof magicItemSchema>;
export type CharacterName = z.infer<typeof characterNameSchema>;
export type QuestItem = z.infer<typeof questItemSchema>;
export type LoreChain = z.infer<typeof loreChainSchema>;

/** Table name (the YAML file name without extension) to its entry schema. */
export const tableSchemas = {
  character_names: characterNameSchema,
  village_names: villageNameSchema,
  monsters: monsterSchema,
  level_themes: levelThemeSchema,
  artifacts: artifactSchema,
  rumours: rumourSchema,
  quest_templates: questTemplateSchema,
  bosses: bossSchema,
  traps: trapSchema,
  altar_gods: altarGodSchema,
  runes: runeSchema,
  books: bookSchema,
  graffiti: graffitiSchema,
  signs: signSchema,
  rivals: rivalSchema,
  npc_names: npcNameSchema,
  vault_names: vaultNameSchema,
  gems_jewelry: gemJewelrySchema,
  magic_items: magicItemSchema,
  quest_items: questItemSchema,
  lore_chains: loreChainSchema,
  classes: classSchema,
  minor_abilities: minorAbilitySchema,
  spells: spellSchema,
  equipment_bases: equipmentBaseSchema,
  disguise_names: disguiseNameSchema,
  fountain_effects: fountainEffectSchema,
  debris_finds: debrisFindSchema,
} as const;

export type TableName = keyof typeof tableSchemas;

/** The compiled JSON bundle the game loads at start. */
export interface ContentBundle {
  tables: Record<string, unknown[]>;
  /** A fingerprint of the tables, set by the content build: a save records the one it was made with (Spec 09). */
  version?: string;
}

/** The bundle's version for a save; a bundle built by hand has none. */
export const contentVersionOf = (bundle: ContentBundle): string => bundle.version ?? 'unversioned';
