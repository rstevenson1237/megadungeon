# Megadungeon Spec 08: Content Tables and Data Format

Sep 30, 2026 · @Robert Stevenson

This spec defines how all game content is stored, rolled and checked, and how big each table must be at launch. Approved September 30, 2026.

## Scope

This spec covers the "large content tables" from the intake: how they are written, stored, rolled and checked. The rules that read them are Specs 02 to 07.

- **In scope:** file format, the shared table shape, weighted rolling, the table catalog with launch sizes, text templates, validation, and how content gets authored.
- **Out of scope:** the content itself (written during Phase 3), and the game rules that consume each table.
- **Traces to intake:** Vision (procedural generation plus large content tables), Level themes, and every "lives in the content tables" note in Specs 02 to 07.

## Principles

Content is data, never code, so tables can grow without touching game logic.

- **Authored in YAML, shipped as JSON:** YAML is easier to write by hand; a build step checks it and compiles it into one JSON bundle the game loads at start. The bundle is fixed: players cannot load their own content packs.
- **One file per table**, under a content folder grouped by area (world, creatures, items, magic, lore, people).
- **Stable ids:** every entry has a lowercase id (e.g. `goblin_archer`) that other tables and saves refer to. Ids never change once released, so old saves keep working.
- **Behaviour by reference:** entries name effects and behaviours defined in code (e.g. `effect: restore_die`, `behaviour: skirmisher`); tables never contain scripts.
- **Seeded rolls only:** every roll on a table uses the run's seeded generators (Spec 02).
- **English only at launch**, with all player-facing text in the content files so translation stays possible later.

## Table format and rolling

Every table shares the same five filter fields, so one roller serves all of them; each table adds its own fields on top.

| Field | Meaning | Default |
| --- | --- | --- |
| `id` | Stable unique name | Required |
| `weight` | Relative chance when rolled | 10 |
| `depth` | Level range where the entry can appear, e.g. `[20, 60]` | All levels |
| `themes` | Themes that favour it, with an optional weight multiplier | All themes, x1 |
| `tags` | Free labels other rules can filter on (`undead`, `ranged`, `cursed`) | None |

**Rolling:** filter the table by depth, theme and any tags the caller asks for; multiply each weight by its theme multiplier; pick one entry with the seeded generator. An entry can point to another table (`roll: gem_tier_3`) to nest rolls.

```yaml
# creatures/monsters.yaml
- id: goblin_archer
  name: goblin archer
  glyph: g
  colour: moss
  rating: 1d6+0
  behaviour: skirmisher
  weight: 12
  depth: [3, 25]
  themes: { goblin_warrens: 3, old_mine: 1.5 }
  tags: [goblinoid, ranged]
  loot: { roll: pocket_change }
```

**Clarifications (approved October 1, 2026, task 2.1):**

- **Themes favour, they do not restrict.** A theme listed in `themes` multiplies the entry's weight; every unlisted theme keeps x1, so the entry can still roll there. An entry with no `themes` field is x1 everywhere.
- **Tags filter by "all of".** An entry matches when it carries every tag the caller asks for.
- **`roll:` names a table.** The value is the name of another table in the bundle (its file name without extension). A nested roll uses the caller's depth and theme; the caller's tags apply only to the first table. An entry whose nested table has no eligible entry is itself not eligible. Tables may not roll each other in a cycle.
- **Each table's own fields come from its owning task.** The build has a strict schema only for tables whose fields the specs define. A YAML file with no schema fails the build; the task that implements a system adds the schema for the tables it reads. The coverage report still lists every catalog table against its launch minimum.
- **Single-line width.** Spec 01 sets no per-field widths, so a single-line name field may be at most as wide as the text area of the narrowest pane that shows names, the character pane (25 cells).

## Table catalog

These are the tables the game needs, with proposed launch minimums sized so a player rarely sees repeats in one run.

| Area | Table | Launch minimum | Read by |
| --- | --- | --- | --- |
| World | Level themes (palette, tiles, layout, feature weights) | 13 | Spec 02 |
| World | Village names | 40 | Spec 07 |
| Creatures | Monsters, at least 5 per rating from 1 to 20 | 150 | Specs 02, 04 |
| Creatures | Bosses | 40 | Specs 02, 04 |
| Creatures | NPC names (rivals, bandits, traders, hermits, captives) | 300 | Specs 04, 07 |
| Creatures | Named rivals for the rival arc | 30 | Spec 02 |
| People | Character names | 150 | Spec 03 |
| Classes | Classes | 20 | Spec 03 |
| Classes | Minor abilities (12 per class, shared entries allowed) | 240 slots | Spec 03 |
| Items | Weapon, armour and shield bases | 16 | Spec 05 |
| Items | Magic items (potions, rings, wands, rods, staves, clothing, weapons, armour) | 130 | Spec 05 |
| Items | Artifacts | 40 | Specs 02, 05 |
| Items | Disguise names (potion looks, ring metals, wand and staff woods) | 100 | Spec 05 |
| Items | Gems and jewelry, tiered by depth | 50 | Spec 05 |
| Magic | Spells | 15 (target 30) | Spec 04 |
| Features | Fountain effects | 12 | Spec 06 |
| Features | Altar gods, each with blessing and shrine buff | 8 | Specs 02, 06 |
| Features | Rune effects and rune-word letters | 10 | Specs 02, 06 |
| Features | Traps | 12 | Spec 06 |
| Features | Debris finds | 20 | Spec 06 |
| Lore | Books | 200 | Spec 06 |
| Lore | Graffiti | 300 | Spec 06 |
| Lore | Signs | 120 | Spec 06 |
| Lore | Lore chains (4 to 6 entries each) | 25 | Specs 02, 06 |
| Lore | Rumour templates | 60 | Spec 07 |
| Lore | Quest templates (10 per quest type) and named quest items | 40 and 60 | Specs 02, 07 |
| Lore | Vault and shrine names | 30 | Spec 02 |

## Text templates

Rumours, quests, hints and some lore are templates filled from the run layout, which is what keeps them true (Specs 06 and 07).

- **Placeholders** in braces are filled when the text is generated: `{level}`, `{village}`, `{monster}`, `{boss}`, `{artifact}`, `{rival}`, `{item}`, `{god}`, `{direction}`.
- **Facts first:** a template is only chosen when the run layout has a matching fact (e.g. a vault on a level the rumour's village covers); placeholders are never filled with invented values.
- **Grammar helpers:** `{a:monster}` adds "a" or "an", `{Monster}` capitalises, `{monsters}` pluralises.
- **Variety:** each template has several phrasings, and the roller avoids repeating one the player has already seen this run.

```yaml
# lore/rumours.yaml
- id: rumour_vault
  needs: vault
  text:
    - "They say a sealed vault waits on level {level}, and only its own key will open it."
    - "A drunk miner swore he saw a vault door on level {level}."
```

## Validation and coverage

The build refuses bad content before it can reach a player, and a coverage report shows where tables are thin.

- **Schema check:** every file is checked against a schema for its table (written in TypeScript with a schema library, so game code and content share one definition). Missing fields, wrong types and unknown fields fail the build.
- **Reference check:** every id a table points at (`roll:`, `loot:`, `effect:`, `behaviour:`) must exist.
- **Uniqueness:** ids are unique across the whole bundle.
- **Coverage:** for every depth and theme, each table that Spec 02 rolls must have at least one eligible entry; monsters need at least 5 per rating; every quest type and rumour kind needs a template.
- **Text check:** every placeholder in a template is a known one, and no single-line field (names, pane labels) is wider than the space it is shown in (Spec 01); longer text wraps.
- **Coverage report:** a generated page listing each table's size against its launch minimum and any depth or theme gaps.
- **Style mix:** the coverage report shows each text table's share of baseline versus other styles, flagging any table above 20% other styles.

## Authoring workflow

Content is written in Phase 3 in reviewed batches, starting from a short style guide so thousands of entries share one voice.

1. **Style guide:** a one-page guide to tone, naming and length, with 10 sample entries for each kind of text, approved by you before bulk writing starts. The baseline voice is terse and classic; up to 20% of entries in each text table use other styles (such as grim, dry humour or archaic) for variety, and each entry is tagged with its style.
2. **Stub content in Phases 1 and 2:** each table gets a few placeholder entries so every system can be built and tested.
3. **Batches by area:** Claude drafts one area at a time (e.g. all monsters for depths 1 to 20) straight into the YAML files.
4. **Review:** you review each batch; changes go back into the files before the next batch.
5. **Coverage-led:** the coverage report sets which gaps to fill next.
6. **Tuning:** balance changes during playtests are made through weights, depths and numbers in the tables, not code.

## Addendum A (approved October 2, 2026)

From Intake Addendum A (findings A1, A3, A9, A10).

**One effect vocabulary**

- **One list in code:** minor abilities, artifacts, shrine buffs and the worn powers of magic items all name their effect from one list of effects defined in code. Content may only name effects on that list; a new effect is code first, added by a task and listed in the build's catalog, then content may use it.
- **Kinds of effect:** advantage on a roll type (search, notice, lockpick, disarm, avoid a trap, spell rolls, spell rolls of a shape, checks against a tag); a modifier (+n to melee, +n to defence, -n to monsters' melee against the player); a rate (wait rounds, pack slots, sell bonus, rest cost); a trigger (on a kill, on a hit that leaves one die, once per level visit, once per fight); and an active (a named code effect used as a skill use from Q).
- **Fields:** an entry names `effect` and the fields that effect needs (`amount`, `roll`, `tag`, `shape`, `rounds`). The schema checks each effect's fields.
- **Required:** from task 3.5 the `minor_abilities` and `artifacts` tables require `effect`. A stub row may name an effect already on the list.

**New and changed tables**

- **`character_names`** (People, launch minimum 150): `id`, `name` (1 to 16 characters: letters, space, apostrophe, hyphen), and the shared filter fields. Stub entries are written in task 3.4.
- **`level_themes`** gains `palette` (24-bit colours for the tokens wall, floor, door, stairs, shallow water, deep water, lava and accent) and `tiles` (the wall glyph: 35, 219 or 178; and the floor glyph). Both are optional until task 4.2; a theme without them uses the default set.
- **Clarification (task 3.3, proposed and approved October 2, 2026):** colours are written `#rrggbb`, and a palette, when given, names all eight tokens. A remembered cell draws its token's colour at half brightness, as the default set's remembered colours roughly are. The `accent` token colours the specials (teleporters and levers). Features, items and creatures keep their own colours.
- **`bosses`:** rows tagged `final` are the pool for level 100's final boss (Spec 02, Addendum A).
- **`traps`:** the tag `magic` marks a magic trap (Hex Breaker; Void Halls' bias).
- **`minor_abilities`:** the example Blessed is renamed Hallowed, with id `hallowed` (Spec 03, Addendum A). It has not been released, so Stable ids is not broken.

**Acceptance criteria added**

- [ ] A minor ability, artifact or shrine buff naming an effect not on the list, or missing that effect's fields, fails the build.

## Acceptance criteria

- [ ] The build compiles every YAML table into one JSON bundle and fails on any schema, reference, uniqueness or placeholder error.
- [ ] One shared roller filters by depth, theme and tags, applies theme multipliers, follows nested rolls, and gives identical results for the same seed.
- [ ] Templates are only chosen when the run layout holds a matching fact, and every filled rumour is true for that run.
- [ ] The coverage report lists every table against its launch minimum and flags depth or theme gaps.
- [ ] At launch, every table meets its minimum and the coverage report shows no gaps.

## Open questions

- [x] **Format:** YAML authoring, JSON bundle, TypeScript schemas.
- [x] **Launch sizes:** approved as listed.
- [x] **Tone:** terse and classic baseline, up to 20% in other styles.
- [x] **Modding:** the bundle is fixed.
