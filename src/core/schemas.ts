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
} as const;

export type TableName = keyof typeof tableSchemas;

/** The compiled JSON bundle the game loads at start. */
export interface ContentBundle {
  tables: Record<string, unknown[]>;
}
