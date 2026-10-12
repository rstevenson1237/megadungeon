# Megadungeon Art Direction (task 6.1)

Oct 12, 2026 · @Robert Stevenson

This is the inner checkpoint of task 6.1 (Intake Addendum B, Phase 6; Spec 01b, Art pipeline). artgen is installed, the asset briefs are generated from the content, and three art directions are rendered as style tiles. Nothing is locked: the owner picks one, or a mix, and only then is it written to `art/direction.json`. No game code changed.

## What was done

- **artgen installed,** pinned to the release tag `artgen-dist-v0.9.0` of `rstevenson1237/image_tools`: `tools/artgen/` (the CLI and MCP server, no npm dependency), its skills, agents and commands under `.claude/`, `.mcp.json`, its managed section of `CLAUDE.md`, and the `art/` project. `tools/artgen` is left out of the TypeScript check, since it is vendored.
- **Export paths** in `art/artgen.config.json` follow Spec 01b: packs to `public/art/`, the runtime to `src/ui/art/runtime/`, the asset ids to `src/ui/art/assets.ts`. (artgen's managed `CLAUDE.md` section still names its default `src/art/`; the config wins.)
- **Briefs from the content:** `npm run art:briefs` (`tools/art-briefs.ts`) reads the tables and writes `art/briefs.yaml`, 158 briefs in the four Spec 01b batches. `tests/art-briefs.test.ts` checks that every monster and boss glyph has a family brief, that every class, NPC role and boss has its brief, the size table's yardsticks, and that the committed file is current. artgen's own `brief list` accepts all 158.
- **The interview** (`art/interview.json`) gives artgen the pitch: grim, dry and archaic (the content style guide), cold stone, a lone delver, a fixed 2:1 iso camera, 4 facings, one fixed light from the upper left, no dynamic light, floors low in contrast, and a creature's colour token as its dominant hue.
- **Three candidates** (`art/candidates/a.json`, `b.json`, `c.json`) from that interview, tailored for this game: dark, low-contrast floor ramps, 16 px a metre (the 1.8 m player stands about 29 px, under a 24 px wall), and a large frame of 64 x 80 for giants, dragons and bosses.
- **This game's probes** (`art/probes/`), each taken from artgen's template through one revision and a finishing pass: the delver (hood, long sword, round shield), a stone sarcophagus, a worn flagstone floor, and a hit.

| Batch (Spec 01b) | Briefs |
| --- | --- |
| 1 Terrain | 10: floor (4 variants), wall (full and cap), door (5 states), stairs up and down, shallow and deep water, lava, teleporter, debris |
| 2 Player and creatures | 60: 20 classes, 35 monster families, 5 NPC roles |
| 3 Features, items, effects | 44: 12 features with their states, 13 floor item kinds, 10 effects, 9 status icons (8 statuses and Shield) |
| 4 Bosses | 44: 43 bosses and the Abyssal Throne set piece |

## The three directions

The style tiles are `art/candidates/style-tile-r4.png` (A, B, C side by side) and `art/candidates/style-tile-r5.png` (the recommended mix beside A and C). Every column passes artgen's conformance gate.

| | A, faithful | B, bold | C, muted |
| --- | --- | --- | --- |
| Palette | Cold blue-grey stone, rust and ember accents; 32 colours | Saturated, hue-rotated, violet cloth; 42 colours | Dark, desaturated near-duotone, moss green; 32 colours |
| Outline | Dark outer line, selective inner lines | Coloured selective outline (selout) | Dark outer line, no inner lines |
| Shading | 3 bands, no dither | 4 bands, strong hue shift | 2 bands, ordered dither |
| Proportions | Head 0.4 of height | Head 0.42 (eased from 0.5 to avoid a cute look) | Slim, head 0.32 |
| Reads as | Old-school dungeon crawl, closest to the pitch | Bright, lively, nearer a modern indie look | Grimmest and darkest; the dither muddies small sprites |

## Recommendation

**Lock `mix1`: A's palette, line and shading with C's slim proportions** (`art/candidates/mix1.json`). A is the direction truest to "grim, dry, archaic" and its dark outline sits well inside the black CP437 frame. C's slimmer figures keep the delver from reading as cute, which the style guide forbids. B is too bright for the voice, and its 42 colours exceed the interview's 32. C's ordered dither fights the per-row recolouring of family sprites (Spec 08, Addendum B), since a dithered body has no single dominant ramp to swap.

## Class silhouettes (owner feedback, October 12, 2026)

The owner asked for more variety in the character shapes, with a reference sheet of eight classes (`art/refs/class-silhouettes-ref.jpg`). `art/probes/classes/` draws those eight on one shared body under `mix1`, and `art/candidates/class-lineup-mix1.png` shows them at 5x, 1x and 2x. Each class changes the outline first: what covers the body (plate, doublet, robe, pelt, cloak), what crowns the head (great helm, feathered hat, bare scalp, bear head, deep hood, mask and feathers, loose hair) and what the hands hold (mace and shield, rapier and lute, staff, crossbow, book and orb, totem and flame). Two changes to `mix1` follow from it:

- **The character frame grows from 24 x 32 to 32 x 40,** so hats, feathers, staffs and shields fit beside a figure that stays about 29 px (1.8 m) tall.
- **A new rule:** give every class its own silhouette by body covering, headgear and held item. Reviewers check it, and batch 2's roster review compares silhouettes.

The owner then asked for more human heads and less square, more organic shapes. `base.v2.js` of the class probe answers it: egg-shaped heads with a round cranium, a narrower jaw, ears, a nose shadow and a neck; every body, robe, cloak, helm, hood, mask and shield drawn as a smooth curve, with tapered legs and arms bent at the elbow. `mix1` gains the matching rules: human, egg-shaped heads and organic curved bodies (do), and no square or boxy bodies, heads or robes (don't). The owner's third note asked for v1's boxy armour on the paladin with v2's mace, a different head shape for each class, and highlights one step brighter. `base.v3.js` answers it: the paladin wears v1's plate, great helm and shield; heads take their own width, crown, jaw and chin (the bard a long face with a pointed chin and goatee, the monk a broad round skull, the druid a square bearded jaw, the sorcerer a narrow face with high cheekbones); and `mix1` lifts the lightest colour of every ramp except the floor's, so highlights are brighter while floors stay low in contrast. The lineup sheet shows v3 above v2 (v2 in the earlier palette).

## For the owner

- **Pick a direction:** `mix1` (recommended), A, B, C, or another mix (for example "A's palette, B's outlines"). On your answer it is locked as `art/direction.json` with its anchors and style sheet, and this checkpoint is closed.
- **Approve the clarification** in Spec 01b (task 6.1): asset ids (`family-h` and `family-h-cap` for the two cases of a letter, and the other id prefixes), and the size table (a rat 0.25 m, a goblin 1.1 m, an ogre 3.6 m, a giant 4.5 m, a dragon 4 m, against the player's 1.8 m).
