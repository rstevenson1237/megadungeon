import { z } from 'zod';
import {
  CAVE_STAMPS,
  DOOR_WEIGHT_KEYS,
  FEATURE_KEYS,
  GEM_KINDS,
  LAYOUT_ALGORITHMS,
  LIQUIDS,
  MAGIC_ITEM_KINDS,
  QUEST_TYPES,
  RUMOUR_KINDS,
  SIZE_CLASSES,
  SPELL_EFFECTS,
  SPELL_SHAPES,
  STATUS_IDS,
  TRAP_KINDS,
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
export const magicItemSchema = z.strictObject({ ...named, kind: z.enum(MAGIC_ITEM_KINDS) });
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
} as const;

export type TableName = keyof typeof tableSchemas;

/** The compiled JSON bundle the game loads at start. */
export interface ContentBundle {
  tables: Record<string, unknown[]>;
}
