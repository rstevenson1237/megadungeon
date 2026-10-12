# Megadungeon Spec 01b: Isometric Display

Oct 11, 2026 · @Robert Stevenson

This spec adds a second way to draw the main view: an isometric pixel-art picture of the level, made with artgen from `rstevenson1237/image_tools`. It sits beside Spec 01, which still governs the screen, panes, keys and targeting. Proposed and approved October 11, 2026, with Intake Addendum B.

## Scope

This spec covers how the isometric display draws the running game and how its art is made.

- **In scope:** the display flag's effect on the screen, projection, camera, draw order, walls, visibility, sprites, animation and effects, targeting and look cursors, loading, the art pipeline, the asset list, tests.
- **Out of scope:** any game rule (the display reads the game, never changes it), the text display (Spec 01), the village menus, title, creation, death and leaderboard screens (text in both displays), mouse input (decision D10).
- **Traces to intake:** Intake Addendum B, requirements R3 and R4, findings F6 to F9, decisions D6 to D9.

## Layout

Only the inside of the main view changes; the 100 x 40 shell around it stays text.

- **The view area** is the inside of the main view's border: 70 x 28 cells, 630 x 448 px at native size, at (9, 16) on the 900 x 640 screen. The border, the header line ("Goblin Warrens, Level 7"), the character pane and the log are drawn as text, as now.
- **Two canvases:** the isometric picture is drawn on its own canvas under the text canvas, at the same native size and with the same scaling and letterboxing (Spec 01, Rendering). In the isometric display the text grid leaves the view area's cells transparent.
- **Overlays** (inventory, spells, level up, NPC talk, history, help, journal, game menu) draw as boxed text over the picture, as now; while one is open the picture stays and is dimmed to 40%.
- **The look row:** while looking (L), the bottom 16 px row of the view area is a text row with the description (Spec 01, Addendum A).
- **Compass:** a small arrow marked N in the top right corner of the view area points to map north (screen up and to the right).

## Projection and camera

The view is a fixed 2:1 isometric projection with no rotation, in whole pixels.

- **Tiles:** a floor cell is a 32 x 16 px diamond. Art is drawn at one art pixel per native pixel and scales with the screen, pixelated.
- **Projection:** cell (x, y) has its centre at screen ((x - y) x 16, (x + y) x 8), relative to the camera. Map north (y - 1) is screen up and right, east is down and right, south down and left, west up and left. W A S D keep their map directions (decision D8); the help screen says so.
- **Camera:** the player's drawn position sits at (315, 260) in the view area, a little below the middle so standing sprites have room above. The camera is not clamped at level edges; outside the level is background. Every cell within the player's sight (8 cells, Spec 02) is on screen in every direction.
- **Whole pixels:** every drawn position is rounded to a whole native pixel after projection, so art stays crisp while the camera moves.

## Draw order

The picture is drawn back to front so nearer things cover farther ones.

- **Depth:** cells are drawn in order of x + y (farthest first), then by x. Within a cell, in order: floor or liquid, floor marks (debris, a found trap, a floor rune), wall or door, feature, the top item, creature, effects above it. Tall objects use artgen's `depthKey` so they sort with the cell they stand on.
- **Only what is in view** is drawn: the cells whose diamond or sprite box touches the view area.

## Walls and doors

Walls are blocks; the ones on the viewer's side are cut low so they never hide the room.

- **Full walls:** a wall is a block one cell wide, of the height the art direction sets (proposed 24 px above the floor).
- **Cutaway:** a wall draws as a low cap, a few pixels high, when the cell directly north of it or directly west of it is open and known (visible or remembered). Otherwise it draws at full height. So the far walls of a room stand and the near walls are cut, wherever the player stands.
- **Doors** sit in their wall cell and follow its height rule. They show closed, open, locked, sealed and broken, as the text display distinguishes them. A secret door draws as wall until found.

## Visibility

The three states of Spec 01 carry over.

- **Unseen** cells are not drawn.
- **Remembered** cells draw their terrain and feature at half brightness, as the text display's remembered colours are (Spec 08, Addendum A), with no creatures or loose items.
- **Visible** cells draw in full colour with everything on them.
- **No dynamic lighting** at first: the art direction's fixed light shades every sprite. Light sources can come later through the spec.

## Sprites

Every thing on the map is drawn by the sprite its content row resolves to (Spec 08, Addendum B): its own sprite, else its glyph family's sprite recoloured with its colour token, else the glyph on a card.

- **The glyph card** is the CP437 glyph from the existing atlas, at 1x in its colour, on a small dark upright card standing on the cell. With no art at all, the isometric display is still complete and playable.
- **Creatures** stand on their cell's centre (the sprite's feet anchor) and face the direction of their last step. The four map directions are the four screen diagonals; the art draws two facings (toward the viewer and away) and mirrors them for the other two. Bosses use the art direction's large size.
- **The player** is the sprite of their class.
- **Markers:** an ally stands on a ring in the ally colour (#E0C050); a trader, hermit, captive, rival or bandit stands on a ring in its role colour; the phantom is the player's sprite drawn half transparent. Status effects and Shield show as small icons above the head, at most three, in the Status block's order.
- **Terrain:** each theme draws the shared terrain set recoloured from its palette, unless its row names its own (Spec 08, Addendum B). Water and lava may animate.
- **Features** show their states (open, looted, smashed, dry, offered, spent, pulled) as the look description names them (Spec 01, Addendum A).
- **Items on the floor:** the top item of a cell is drawn, as in the text display, by its kind's sprite.

## Animation and effects

Animation shows what happened; it never changes or delays the game.

- **Display events:** each action's result gains a list of display events (a step, a melee or ranged exchange and its outcome, a spell with its cells, a die lost, a status gained, a death, a creature becoming alert, a door opening, a fall or teleport). The Game layer fills it; rules are unchanged; nothing in it is saved, and the text display ignores it.
- **Turn mode:** a step slides over 100 ms, an attack lunges over 120 ms, effects last at most 300 ms. A key press first finishes every running animation at once, then acts, so input never waits for animation.
- **Real time:** a step slides over the mover's interval (5, 10 or 20 ticks), so movement is continuous; the camera follows the player's drawn position.
- **Effects:** a spark for a hit, a puff for a miss, a projectile along the line of fire, a burst over an area spell's footprint, an aura for a self spell, a small die that drops away for a die lost, and "!" over a creature that becomes alert.

## Targeting and look

The keys and rules of Spec 01 stay; only how the choice is shown changes.

- **Targeting:** the selected cell has a diamond outline in the targeting colour, the line of fire draws as small dim diamonds (both ends left out), an area footprint draws as tinted diamonds, and creatures inside it are outlined. The Target block fills in as now.
- **Look:** a diamond cursor in the look colour, with the description in the look row.

## Loading and performance

- **Packs** are artgen atlas packs under `public/art/`, loaded through Vite's base path so they work on the GitHub Pages sub-path. They load the first time the isometric display is chosen; until then, and if loading fails, the text display stays and the log says why.
- **Redraw:** in turn mode, after a change and while animations run; in real time, every frame while not paused.
- **Budget:** on a large level with 80 creatures in view, a frame takes under 8 ms on average and never over 16 ms on the build machine.

## Art pipeline

The art is made in this repository with artgen (decision D7), and only the owner approves it.

- **Install:** artgen's committed install (`npx -y github:rstevenson1237/image_tools#artgen-dist init`, pinned to a release tag) adds `tools/artgen/`, its Claude Code skills and agents under `.claude/`, `.mcp.json`, a managed section of `CLAUDE.md`, and `art/`. Sessions then need no network.
- **Runtime:** `artgen export --runtime` vendors the runtime core and only the Canvas 2D adapter into `src/ui/art/runtime/`, and writes the typed asset ids to `src/ui/art/assets.ts`. They are part of the UI layer; nothing below the UI imports them. There is no npm runtime dependency.
- **Direction (task 6.1):** `/artgen-direction` proposes three art directions from the game's pitch and the content style guide (`docs/12-content-style-guide.md`: grim, dry, archaic) with the camera fixed to iso, 32 x 16 tiles and 4 facings; the owner picks one or a mix, and it is locked as `art/direction.json`. Two rules are fixed: floors stay low in contrast so creatures stand out, and a creature's colour token stays its dominant hue, so recoloured family sprites read like the text display's colours.
- **Briefs** come from the content: a tool reads the tables and writes `art/briefs.yaml` (one entry per family, theme set, class, feature, item kind, effect and, later, boss), so the asset list follows the content.
- **Review before approval:** artgen's make and review loop runs on its own. Before a batch goes to the owner, each asset gets a blind score from a reviewer that has not seen its history, and the batch is shown as a roster lineup at 1x on one baseline beside the player, judged against a size table by real-world size (a rat below the knee, an ogre twice the player's height), because artgen's calibration found self-scores run high and every asset tends to fill its frame.
- **Approval:** only the owner approves, by batch, with `/artgen-approve` in Claude Code or in the image tools' Asset Review. Unapproved drafts never ship.
- **Changing the direction** later re-renders every asset from the new direction (`/artgen-restyle`), then goes back through approval.

## Asset list

About 160 assets, in four batches (decision D9).

| Batch | Group | Assets | States and animation |
| --- | --- | --- | --- |
| 1 | Terrain | Floor (4 variants), wall (full and cap), door, stairs up and down, shallow and deep water, lava, teleporter, debris: about 10, recoloured for the 13 themes | Door: closed, open, locked, sealed, broken; liquids may loop |
| 2 | Player | One per class, 20, on shared bodies so proportions match | Idle, walk, attack, hurt; 2 facings mirrored |
| 2 | Monster families | One per glyph letter, 35, recoloured per row | Idle, walk, attack |
| 2 | People | Rival, trader, bandit, hermit, captive | Idle, walk |
| 3 | Features | Chest, sack, pottery, weapon rack, fountain, altar, sarcophagus, rune, sign and graffiti, lever, Spirit Totem, found traps: about 15 | Their states |
| 3 | Floor items | One per glyph class (coins, gems, jewelry, potion, ring, rod or staff or wand, weapon, armour, clothing, book, key, ammunition, quest item): about 13 |  |
| 3 | Effects and icons | Hit, miss, projectiles, bolt, burst, frost, push, aura, die lost, alert, and the 8 status icons and Shield: about 20 | One-shot or loop |
| 4 | Bosses | Unique sprites for the 43 bosses, large size, and the level 100 set piece | Idle, walk, attack |

## Tests

- **Draw list:** the renderer first builds a list of draws (asset, frame, screen position, layer, tint), then paints it. Unit tests check the list without pixels: projection, depth order, the cutaway rule, the three visibility states, markers, and the fallback chain.
- **Scene model:** both displays read one per-cell scene description; its tests run once and serve both.
- **Text display unchanged:** the glyph golden (`e2e/glyph-masks.json`) and every existing UI test pass.
- **Browser smoke:** in Chromium, Firefox and WebKit, the isometric display draws a non-empty view, switches back and forth with the text display, shows an overlay over it, and shows the targeting cursor.
- **Art checks:** artgen's conformance checks and the content check of sprite ids (Spec 08, Addendum B) run in CI.

## Clarification (task 6.1, proposed October 12, 2026, awaiting approval)

The asset list leaves four points of naming and size open. Proposed as built in `tools/art-briefs.ts`, which writes `art/briefs.yaml` from the tables:

- **Family ids keep upper and lower case apart:** artgen ids are lower case, and both `h` (men and dwarves) and `H` (many-headed beasts) are families, so a lower case letter's family is `family-h` and an upper case letter's is `family-h-cap`. Floor items use their glyph class: `family-potion`, `family-coins`, `family-quest-item` (Spec 08, Addendum B, fallback step 2).
- **Other ids by group:** `terrain-<piece>`, `class-<class id>`, `npc-<role>`, `feature-<fixture>`, `fx-<effect>`, `icon-<status>`, `boss-<boss id>` and `setpiece-abyssal-throne`, with content ids' underscores written as hyphens.
- **The size table** gives each brief a real-world height against the player's 1.8 m: a rat 0.25 m, a goblin 1.1 m, an ogre 3.6 m (twice the player), a giant 4.5 m, a dragon 4 m. A boss keeps its family's height and is drawn at the large frame size.
- **Effects carry no height:** they are sized by what they show (a cell, an area), not by a real-world height.

## Acceptance criteria

- [ ] With no art loaded, every cell and thing the text display shows is drawn, by the glyph fallback where nothing better exists.
- [ ] Cells project as set out above, and the player's sight is on screen in every direction.
- [ ] Nearer things cover farther ones, and the near walls of a room draw as low caps wherever the player stands.
- [ ] Unseen, remembered and visible cells draw in their three styles; remembered cells show no creatures or loose items.
- [ ] Creatures face their last step, allies and NPCs show their rings, and statuses show as icons.
- [ ] Every overlay opens over the dimmed picture; targeting, area footprints and the look cursor draw as diamonds; both work with the same keys as the text display.
- [ ] In turn mode no key press waits for an animation; in real time movement is continuous.
- [ ] Switching display mid-run changes nothing in the game state.
- [ ] The frame budget holds on a large crowded level.
- [ ] Every shipped asset is approved by the owner, and the content check passes.
- [ ] The browser smoke test passes in current Chrome, Firefox and Safari on desktop.

## Open questions

- [x] **Spec approved** (October 11, 2026), with decisions D6 to D10 of Intake Addendum B as recommended.
- [x] **Wall height and lighting** are left to the art direction (task 6.1): 24 px walls and no dynamic light at first, approved as recommended.
