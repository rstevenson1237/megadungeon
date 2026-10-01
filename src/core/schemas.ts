import { z } from 'zod';
import { LAYOUT_ALGORITHMS, QUEST_TYPES, RUMOUR_KINDS, SIZE_CLASSES } from './catalog.ts';

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
  loot: z.strictObject({ roll: z.string().min(1) }).optional(),
});

// Level themes (Spec 02, "Run layout" and "Level sizes and layouts"). The unlock level is the first
// level of `depth`. Palette, tiles and feature weights are added by tasks 2.3, 2.4 and 3.2.
export const levelThemeSchema = z.strictObject({
  ...baseFields,
  name: z.string().min(1),
  layout: z.enum(LAYOUT_ALGORITHMS),
  size: z.enum(SIZE_CLASSES),
});

// Artifacts (Spec 02, "Run layout"): just a name until task 2.9 gives them powers.
export const artifactSchema = z.strictObject({
  ...baseFields,
  name: z.string().min(1),
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

export type VillageName = z.infer<typeof villageNameSchema>;
export type Monster = z.infer<typeof monsterSchema>;
export type LevelTheme = z.infer<typeof levelThemeSchema>;
export type Artifact = z.infer<typeof artifactSchema>;
export type Rumour = z.infer<typeof rumourSchema>;
export type QuestTemplate = z.infer<typeof questTemplateSchema>;

/** Table name (the YAML file name without extension) to its entry schema. */
export const tableSchemas = {
  village_names: villageNameSchema,
  monsters: monsterSchema,
  level_themes: levelThemeSchema,
  artifacts: artifactSchema,
  rumours: rumourSchema,
  quest_templates: questTemplateSchema,
} as const;

export type TableName = keyof typeof tableSchemas;

/** The compiled JSON bundle the game loads at start. */
export interface ContentBundle {
  tables: Record<string, unknown[]>;
}
