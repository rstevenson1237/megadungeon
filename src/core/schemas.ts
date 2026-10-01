import { z } from 'zod';
import {
  AMMO_TYPES,
  BASE_TYPES,
  CAVE_STAMPS,
  DISGUISED_KINDS,
  DOOR_WEIGHT_KEYS,
  FEATURE_KEYS,
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

// Level themes (Spec 02, "Run layout" and "Level sizes and layouts"). The unlock level is the first
// level of `depth`. Palette, tiles and feature weights are added by tasks 2.3, 2.4 and 3.2.
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

export const trapSchema = z.strictObject({ ...named, kind: z.enum(TRAP_KINDS) });
export const altarGodSchema = z.strictObject(named);
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
export type QuestItem = z.infer<typeof questItemSchema>;
export type LoreChain = z.infer<typeof loreChainSchema>;

/** Table name (the YAML file name without extension) to its entry schema. */
export const tableSchemas = {
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
} as const;

export type TableName = keyof typeof tableSchemas;

/** The compiled JSON bundle the game loads at start. */
export interface ContentBundle {
  tables: Record<string, unknown[]>;
}
