import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { familyId } from '../src/ui/art-ids.ts';
import { buildContent } from './content-build.ts';

/**
 * The isometric display's asset list (Spec 01b, Art pipeline, "Briefs"): reads the content tables and writes
 * `art/briefs.yaml`, one artgen brief per terrain piece, class, monster family, NPC role, feature, floor item kind,
 * effect, status icon and boss, so the asset list follows the content. Run with `npm run art:briefs`; `--check`
 * fails if the committed file is out of date. Heights are the art direction's size table (task 6.1), in metres.
 */

/** One brief, in artgen's `briefs.yaml` shape (artgen-core `BriefEntry`). */
export interface ArtBrief {
  id: string;
  kind: 'character' | 'creature' | 'prop' | 'tile' | 'effect' | 'ui-icon';
  /** Spec 01b batch (1 terrain, 2 player and creatures, 3 features, items and effects, 4 bosses). */
  batch: 1 | 2 | 3 | 4;
  priority: number;
  importance: 'hero' | 'standard' | 'filler';
  notes: string;
  height?: number;
  size?: string | [number, number];
  object?: string;
  variants?: number;
  directions?: 1 | 4;
  states?: string[];
  anims?: Record<string, { frames: number; loop?: boolean }>;
}

/** artgen's id rule (artgen-core `briefs.ts`). */
export const BRIEF_ID = /^[a-z][a-z0-9_-]*$/;

/** The player's height, the yardstick of the size table. */
export const PLAYER_HEIGHT = 1.8;

/** Heights above this outgrow the character frame (32 px at the direction's 16 px a metre) and use the large one. */
export const LARGE_ABOVE = 1.9;

/** The monster family of a glyph letter, named as the isometric display looks it up (src/ui/art-ids.ts). */
export { familyId };

/** Size table by glyph family: drawn height in metres, judged against the player (1.8 m) in the roster lineup. */
export const FAMILY_HEIGHTS: Record<string, number> = {
  a: 0.3, b: 0.4, c: 0.3, e: 0.8, f: 1.4, g: 1.1, h: 1.8, j: 2.4, k: 1.0, l: 1.0, n: 2.2, o: 1.9, q: 1.0, r: 0.25,
  s: 1.8, w: 0.6, z: 1.7,
  A: 2.2, C: 3.0, D: 4.0, E: 2.4, F: 2.0, G: 4.5, H: 3.0, I: 1.2, K: 2.0, L: 1.9, M: 1.8, O: 3.6, P: 3.2, S: 1.0,
  T: 3.0, V: 1.8, W: 2.0, Y: 1.6,
};

/** What a family is, in a few words, for its brief; the member names follow. */
const FAMILY_NOTES: Record<string, string> = {
  a: 'giant insects and scorpions', b: 'cave bats', c: 'giant centipedes and crayfish', e: 'eels and deep things of the water',
  f: 'fungus horrors and spore beasts', g: 'goblins with slings, bows and war-chants', h: 'men and dwarves: acolytes, priests, mages, crossbowmen',
  j: 'gelatinous cubes', k: 'kobolds', l: 'lizards, frogs and lizardmen', n: 'bone nagas', o: 'orcs', q: 'wolves, boars and hounds',
  r: 'rats', s: 'skeletons', w: 'worms, leeches and crawlers', z: 'ghouls and zombies',
  A: 'aberrations: eye tyrants and mind horrors', C: 'golems and constructs', D: 'drakes and dragons', E: 'elementals', F: 'stalkers',
  G: 'giants and titans', H: 'many-headed beasts', I: 'insect swarms', K: 'death knights and dread lords', L: 'liches', M: 'mummies',
  O: 'ogres', P: 'fiends and demon lords', S: 'snakes, serpents and spiders', T: 'trolls', V: 'vampires', W: 'wraiths and shades', Y: 'bears',
};

/** A door's states (Spec 01b, Walls and doors), each also drawn cut to a cap. */
export const DOOR_STATES = ['closed', 'open', 'locked', 'sealed', 'broken'] as const;

/** The NPC roles of Spec 01 ("@ coloured by role"). */
export const NPC_ROLES = ['rival', 'trader', 'bandit', 'hermit', 'captive'] as const;

/** Floor items by glyph class (Spec 01, core glyph table; Spec 01b, asset list batch 3). */
export const ITEM_CLASSES: Array<[string, string, number]> = [
  ['coins', 'a spill of coins', 0.1], ['gems', 'a few cut gems', 0.1], ['jewelry', 'a necklace and a ring', 0.1],
  ['potion', 'a stoppered glass potion bottle', 0.25], ['ring', 'a single ring', 0.05], ['rod', 'a rod, staff or wand lying on the floor', 0.2],
  ['weapon', 'a sword lying on the floor', 0.2], ['armour', 'a folded mail shirt', 0.25], ['clothing', 'a folded cloak', 0.15],
  ['book', 'a heavy closed book', 0.15], ['key', 'an iron key', 0.05], ['ammunition', 'a bundle of arrows', 0.1],
  ['quest-item', 'a wrapped relic tied with cord', 0.3],
];

/** The eight status effects of Spec 04, in the Status block's order, then Shield. */
export const STATUS_ICONS: Array<[string, string]> = [
  ['poisoned', 'a dripping fang'], ['slowed', 'a snail shell'], ['hasted', 'a winged boot'], ['asleep', 'a closed eye'],
  ['held', 'a shackle'], ['frightened', 'a skull'], ['blessed', 'a sunburst'], ['cursed', 'a broken circle'], ['shield', 'a kite shield'],
];

/** Effects of Spec 01b ("Animation and effects"), each naming the thing drawn. */
export const EFFECTS: Array<[string, string, string]> = [
  ['hit', 'a star of sparks', 'a hit'], ['miss', 'a puff of dust', 'a miss'], ['arrow', 'an arrow in flight', 'a shot or thrown missile'],
  ['bolt', 'an arcane dart', 'a bolt spell'], ['burst', 'a ring of fire', "an area spell's footprint"], ['frost', 'shards of ice', 'a cold spell'],
  ['push', 'a curved shock wave', 'a push or knockback'], ['aura', 'a ring of rising motes', 'a self spell'],
  ['die-lost', 'a small six-sided die', 'a die lost'], ['alert', 'an exclamation mark', 'a creature becoming alert'],
];

/** Fixtures and containers of Spec 06, with the states the look description names (Spec 01, Addendum A). */
export const FEATURES: Array<[string, string, number, string[]]> = [
  ['chest', 'an iron-bound chest', 0.7, ['closed', 'open', 'looted']],
  ['sack', 'a tied sack of coarse cloth', 0.6, ['closed', 'looted']],
  ['pottery', 'a clay urn', 0.6, ['whole', 'smashed']],
  ['weapon-rack', 'a wooden weapon rack', 1.6, ['full', 'looted']],
  ['fountain', 'a stone basin fountain', 1.4, ['flowing', 'dry']],
  ['altar', 'a stone altar to a nameless god', 1.1, ['idle', 'offered']],
  ['sarcophagus', 'a carved stone sarcophagus', 0.9, ['closed', 'open', 'looted']],
  ['rune', 'a carved floor rune', 0.05, ['dormant', 'spent']],
  ['sign', 'a wall-mounted sign or scrawled graffiti', 1.6, ['idle']],
  ['lever', 'an iron wall lever', 1.0, ['up', 'pulled']],
  ['spirit-totem', 'a carved spirit totem pole', 1.8, ['idle']],
  ['trap', 'a found floor trap: a pressure plate and its mechanism', 0.1, ['armed', 'disarmed']],
];

const walker = { idle: { frames: 2, loop: true }, walk: { frames: 4, loop: true } };
const fighter = { ...walker, attack: { frames: 4 } };
const sample = (names: string[], n = 8): string => names.slice(0, n).join(', ') + (names.length > n ? ', …' : '');

/** Build every brief from the content bundle's tables. */
export function buildBriefs(tables: Record<string, unknown[]>): ArtBrief[] {
  const briefs: ArtBrief[] = [];
  const add = (b: ArtBrief) => briefs.push(b);
  type Row = { id: string; name: string; glyph?: string; tags?: string[] };
  const rows = (t: string) => (tables[t] ?? []) as Row[];
  const themes = rows('level_themes');

  // Batch 1: terrain, one shape set recoloured per theme from its eight palette tokens (decision D9). Each piece keeps
  // to the direction ramps named in its notes, since the game recolours a ramp to its theme token (task 6.5).
  const recolour = `Recoloured for each of the ${themes.length} themes from its eight palette tokens.`;
  const terrain: Array<Omit<ArtBrief, 'batch' | 'priority' | 'importance' | 'kind'> & { kind?: ArtBrief['kind'] }> = [
    { id: 'floor', variants: 4, notes: 'flagstone floor diamond, low in contrast so creatures stand out; variants vary the worn stones. Dirt ramp only (the floor token)' },
    { id: 'wall', size: [32, 40], states: ['full', 'cap'], notes: 'stone block one cell wide on a floor diamond at the frame bottom, 24 px above the floor; the cap is the cut-away near wall, 4 px high. Stone ramp only (the wall token)' },
    {
      id: 'door', size: [32, 40], states: [...DOOR_STATES, ...DOOR_STATES.map((s) => `${s}-cap`)],
      notes: 'plank door in its wall cell, a stone block as the wall, 24 px high; the -cap states are the cut-away door, 4 px high, its state shown on top. Locked shows an iron lock plate, sealed a wax-and-chain seal, open the doorway with the door swung back, broken split planks. Stone ramp for the wall (the wall token), wood for the door (the door token), metal and accent for iron and wax',
    },
    { id: 'stairs-up', size: [32, 32], notes: 'stone stair rising toward map north from a floor diamond at the frame bottom. Stone ramp (the stairs token), dirt for the floor round it (the floor token)' },
    { id: 'stairs-down', notes: 'stone stair sinking into a dark opening. Stone ramp (the stairs token), dirt for the floor round it (the floor token)' },
    { id: 'water-shallow', anims: { idle: { frames: 4, loop: true } }, notes: 'shallow water over visible stones, slow ripple loop. Grass ramp for the water (the shallow water token), dirt for the stones under it (the floor token)' },
    { id: 'water-deep', anims: { idle: { frames: 4, loop: true } }, notes: 'deep dark water, slow ripple loop. Grass ramp only (the deep water token)' },
    { id: 'lava', anims: { idle: { frames: 4, loop: true } }, notes: 'molten rock with a cooling crust, slow glow loop. Accent and glow ramps only (the lava token)' },
    { id: 'teleporter', kind: 'prop', height: 0.1, anims: { idle: { frames: 4, loop: true } }, notes: 'a ring of carved stones set in the floor, faint glow loop. Stone ramp for the stones (the wall token), glow for the light (the accent token)' },
    { id: 'debris', kind: 'prop', height: 0.3, variants: 3, notes: 'low heap of broken masonry and rubbish, walkable. Stone ramp for masonry (the wall token), dirt for rubbish (the floor token)' },
  ];
  terrain.forEach((t, i) =>
    add({ kind: 'tile', ...t, id: `terrain-${t.id}`, batch: 1, priority: 100 + i, importance: 'standard', notes: `${t.notes}. ${recolour}` }),
  );

  // Batch 2: the player by class, the monster families, the NPC roles.
  rows('classes').forEach((c, i) =>
    add({
      id: `class-${c.id.replace(/_/g, '-')}`, kind: 'character', batch: 2, priority: 200 + i, importance: 'hero', height: PLAYER_HEIGHT,
      directions: 4, states: ['idle', 'walk', 'attack', 'hurt'], anims: { ...fighter, hurt: { frames: 2 } },
      notes: `the player as a ${c.name}, on the shared player body so every class has the same proportions`,
    }),
  );
  const families = new Map<string, string[]>();
  for (const r of [...rows('monsters'), ...rows('bosses')]) families.set(r.glyph!, [...(families.get(r.glyph!) ?? []), r.name]);
  [...families.keys()].sort().forEach((g, i) =>
    add({
      id: familyId(g), kind: 'creature', batch: 2, priority: 240 + i, importance: 'standard', height: FAMILY_HEIGHTS[g],
      ...(FAMILY_HEIGHTS[g]! > LARGE_ABOVE ? { size: 'large' } : {}),
      directions: 4, states: ['idle', 'walk', 'attack'], anims: fighter,
      notes: `glyph ${g}: ${FAMILY_NOTES[g] ?? 'monsters'} (${sample(families.get(g)!)}). Recoloured per row by its colour token, which stays the dominant hue`,
    }),
  );
  NPC_ROLES.forEach((role, i) =>
    add({
      id: `npc-${role}`, kind: 'character', batch: 2, priority: 280 + i, importance: 'standard', height: PLAYER_HEIGHT,
      directions: 4, states: ['idle', 'walk'], anims: walker, notes: `a ${role}, a person of the dungeon; stands on a ring in its role colour`,
    }),
  );

  // Batch 3: features, floor items, effects and status icons.
  FEATURES.forEach(([id, notes, height, states], i) =>
    add({ id: `feature-${id}`, kind: 'prop', batch: 3, priority: 300 + i, importance: 'standard', height, states, notes }),
  );
  ITEM_CLASSES.forEach(([id, notes, height], i) =>
    add({ id: `family-${id}`, kind: 'prop', batch: 3, priority: 320 + i, importance: 'filler', height, notes: `${notes}, the top item of a cell` }),
  );
  EFFECTS.forEach(([id, object, use], i) =>
    add({ id: `fx-${id}`, kind: 'effect', batch: 3, priority: 340 + i, importance: 'filler', object, anims: { play: { frames: 4 } }, notes: `shows ${use}; at most 300 ms` }),
  );
  STATUS_ICONS.forEach(([id, object], i) =>
    add({ id: `icon-${id}`, kind: 'ui-icon', batch: 3, priority: 360 + i, importance: 'filler', notes: `status icon above the head: ${object}` }),
  );

  // Batch 4: unique bosses at the large size, and the level 100 set piece.
  rows('bosses').forEach((b, i) =>
    add({
      id: `boss-${b.id.replace(/_/g, '-')}`, kind: 'creature', batch: 4, priority: 400 + i, importance: 'hero', size: 'large',
      height: FAMILY_HEIGHTS[b.glyph!], directions: 4, states: ['idle', 'walk', 'attack'], anims: fighter,
      notes: `${b.name}, a unique boss of the ${familyId(b.glyph!)} family, drawn at the large size`,
    }),
  );
  add({
    id: 'setpiece-abyssal-throne', kind: 'prop', batch: 4, priority: 499, importance: 'hero', size: 'large', height: 4,
    notes: 'the Abyssal Throne of level 100: a vast black throne on a stepped dais',
  });
  return briefs;
}

const HEADER =
  '# The isometric display\'s asset briefs (Spec 01b), generated from the content tables by `npm run art:briefs`.\n' +
  '# Do not edit by hand: change tools/art-briefs.ts and run it again. `batch` is the Spec 01b art batch.\n';

/** The YAML text of the briefs file. */
export const briefsText = (briefs: ArtBrief[]): string =>
  HEADER + stringify(briefs.map(({ id, kind, ...rest }) => ({ id, kind, ...rest })), { lineWidth: 120, aliasDuplicateObjects: false });

/** The TypeScript text of `src/ui/art/ramps.ts`: the direction's ramps, which the game recolours terrain by (task 6.5). */
export const rampsText = (direction: { palette: { ramps: Record<string, string[]> } }): string =>
  '// The art direction\'s colour ramps (art/direction.json, palette.ramps), lightest first, which the isometric display\n' +
  '// recolours terrain by (src/ui/art/terrain-recolour.ts). Generated by `npm run art:briefs`; do not edit by hand.\n\n' +
  `export const DIRECTION_RAMPS = {\n${Object.entries(direction.palette.ramps)
    .map(([name, ramp]) => `  ${name}: [${ramp.map((c) => `'${c}'`).join(', ')}],`)
    .join('\n')}\n} as const;\n`;

function main(): void {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const { bundle, errors } = buildContent(join(root, 'content'));
  if (errors.length) throw new Error(`content errors:\n${errors.join('\n')}`);
  const outputs: Array<[string, string]> = [
    [join(root, 'art', 'briefs.yaml'), briefsText(buildBriefs(bundle.tables as Record<string, unknown[]>))],
    [join(root, 'src', 'ui', 'art', 'ramps.ts'), rampsText(JSON.parse(readFileSync(join(root, 'art', 'direction.json'), 'utf8')))],
  ];
  if (process.argv.includes('--check')) {
    for (const [out, text] of outputs) {
      let old = '';
      try { old = readFileSync(out, 'utf8'); } catch { /* missing */ }
      if (old !== text) {
        console.error(`${out.slice(root.length + 1)} is out of date: run "npm run art:briefs"`);
        process.exit(1);
      }
    }
    console.log('art/briefs.yaml and src/ui/art/ramps.ts are up to date.');
    return;
  }
  for (const [out, text] of outputs) writeFileSync(out, text);
  console.log(`Wrote ${outputs[0]![1].split('\n- id:').length - 1} briefs to art/briefs.yaml, and src/ui/art/ramps.ts.`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
