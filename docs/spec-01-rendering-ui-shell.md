# Megadungeon Spec 01: Rendering and UI Shell

Sep 30, 2026 · @Robert Stevenson

This spec defines the screen, renderer, panes and controls that every other system draws into. Approved September 30, 2026, together with the UI mockup.

## Scope

This spec covers everything the player sees and presses; game rules live in later specs.

- **In scope:** screen grid, renderer, CP437 font and colour, the three panes, camera, key map, targeting mode, overlay screens.
- **Out of scope:** level generation, combat math, item data, village logic. These specs only feed the UI through defined data.
- **Traces to intake:** Platform and interface, Controls and display, Magic shapes, and the Phase 1 slice in Build phases.

## Screen grid and panes

The screen is a fixed 100 x 40 cell grid: the main view and log share the left 72 columns, and the character pane takes the right 28.

Screen layout (diagram as text), 100 x 40 cells at 9 x 16 px = 900 x 640 px native, scaled to fit the viewport:

```
cols 0-71                                   cols 72-99
+------------------------------------------+----------------+
| Main view: 72 x 30 cells                 | Character pane |
| (70 x 28 map inside border)              | 28 x 40 cells  |
| rows 0-29; camera follows player;        | (26 x 38       |
| overlays open here                       |  usable)       |
+------------------------------------------+ Identity       |
| Message log: 72 x 10 cells               | Experience     |
| (8 visible lines), rows 30-39            | Wealth, Stats  |
+------------------------------------------+ ... Target     |
                                           +----------------+
```

Panes are outlined with CP437 single-line box characters, which is why each usable area is two cells smaller than its pane.

## Rendering

The game draws a fixed grid of CP437 glyphs onto one HTML canvas, redrawing only cells that changed.

- **Stack:** TypeScript, Vite build, HTML canvas 2D. No UI framework and no runtime dependencies.
- **Font:** a 9x16 CP437 bitmap font (proposed: Px437 IBM VGA from the Ultimate Oldschool PC Font Pack, CC BY-SA licence to verify) baked into a glyph atlas.
- **Cell model:** each cell holds a glyph code (0 to 255), a 24-bit foreground and a 24-bit background colour.
- **Redraw:** turn-based. A frame is drawn only when game state changes, diffing cells so only changed ones repaint.
- **Colour:** each level theme supplies palette tokens (wall, floor, water, accent and so on). The UI panes use one fixed palette.
- **Scaling:** the grid renders at native size, then scales to fit the browser viewport with its aspect ratio kept, letterboxed, using pixelated scaling.

**Core glyph table** (monsters use letters, coloured by type)

| Thing | Glyph | CP437 code |
| --- | --- | --- |
| Player | @ | 64 |
| Floor | · | 250 |
| Wall | # (theme may use █ 219 or ▓ 178) | 35 |
| Door, closed / open | + / ' | 43 / 39 |
| Locked door | + in the locked colour | 43 |
| Secret door | Drawn as wall until found |  |
| Stairs up / down | < / > | 60 / 62 |
| Teleporter | Ω | 234 |
| Water or lava | ≈ (colour by theme) | 247 |
| Debris | ░ | 176 |
| Chest | ■ | 254 |
| Sack | δ | 235 |
| Pottery | ° | 248 |
| Weapon rack | ╫ | 215 |
| Fountain | Θ | 233 |
| Altar | ╥ | 210 |
| Sarcophagus | ∩ | 239 |
| Magical rune | ☼ | 15 |
| Found trap | ^ | 94 |
| Book / sign or graffiti | ? / ¶ | 63 / 20 |
| Key | ⌐ | 169 |
| Coins / gems / jewelry | $ / ♦ / " | 36 / 4 / 34 |
| Potion / ring | ! / = | 33 / 61 |
| Rod, staff, wand | / | 47 |
| Weapon / armour / clothing | ) / \[ / ( | 41 / 91 / 40 |
| NPC (rival, trader, bandit, hermit, captive) | @ coloured by role | 64 |

## Main view and camera

The main view shows a 70 x 28 cell window onto the current level, following the player.

- **Camera:** centred on the player, clamped at level edges so no empty space shows past a wall. A level smaller than the window is centred in it.
- **Visibility states:** unseen cells are blank; remembered cells draw in dimmed colours with no monsters or loose items; visible cells draw in full colour. How visibility is computed belongs to the dungeon spec.
- **Draw order per cell:** terrain, then feature, then item, then monster or player, then targeting overlay.
- **Header line:** the top border carries the level name and depth (e.g. "Goblin Warrens, Level 7").

**In villages** there is no map: the main view shows the village menu instead (see Overlays and screens).

## Character pane

The right pane (26 x 38 usable cells) shows the character from top to bottom in this order, with the push-your-luck numbers near the top.

| Block | Shows | Example |
| --- | --- | --- |
| Identity | Name, class, level | Mara, Thief, Level 3 |
| Experience | Banked XP and next threshold | XP 5,210 / 8,000 |
| Wealth | Bank balance and unbanked treasure carried | Bank 1,340 gp; Carried \~620 gp |
| Stats | Each stat's step and current / maximum dice, with pips | Combat d8 ■■□ 2/3 |
| Equipment | Weapon, armour, clothing, rings, with quality | Short sword (Fine) |
| Abilities | Major ability, then minor abilities and buffs | Backstab; Keen Eye |
| Status | Active effects and the wait recovery counter | Rested 6/10 |
| Inventory | Slots used / total | Slots 7/12 |
| Target | While targeting: target name, rating, distance | Hobgoblin 2d6+1, 4 away |

Carried treasure shows as an estimate because gems and jewelry are only valued on appraisal.

## Message log

The bottom pane shows the 8 newest messages, newest at the bottom, and keeps a 200-line history.

- **Colour by type:** combat (red), loot and treasure (gold), discovery and lore (cyan), rumours and quests (green), warnings (yellow), system (grey).
- **Repeats collapse:** the same message on consecutive turns shows once with a count, e.g. "You wait. (x6)".
- **Long lines wrap** within the pane's 70-cell width.
- **History:** a full-screen overlay scrolls the 200 lines (key in Input and controls).
- **Turn marker:** messages from the current turn draw bright; older ones dim.

## Input and controls

Keyboard only. WASD and the arrow keys both move, in four directions only (no diagonals); no other action uses W, A, S or D, so movement never collides with a command.

| Key | Action |
| --- | --- |
| W A S D / arrows | Move; moving into a monster attacks, into a door opens it |
| Space | Wait one round |
| Z | Wait until a Combat die returns (10 rounds) or something interrupts |
| E | Interact: stairs, teleporter, container, fountain, altar, sign, NPC, village service or lift |
| X | Search the surrounding cells (a check) |
| G | Pick up |
| F | Ranged attack (enters targeting) |
| C | Cast a spell (choose, then targeting if needed) |
| Q | Use class ability |
| Tab / Shift+Tab | Next / previous target |
| Enter | Confirm target or menu choice |
| Esc | Cancel; with nothing to cancel, opens the game menu (help, leaderboard, quit without saving) |
| I | Inventory |
| L | Look: move a cursor to read any visible cell |
| M | Message history |
| ? | Help and key list |
| J | Journal: lore, rumours and quests seen, grouped by level (Spec 06) |

In menus, arrows or W/S move the selection and Enter confirms, so a player never needs to leave the movement keys.

## Targeting

Targeting always starts on the closest valid target, so a quick ranged attack is two key presses: F, then Enter.

1. The player presses F (ranged), or C and picks a targeted spell.
2. Valid targets are those visible and in range, with a clear line of fire, sorted by distance, ties broken clockwise from north.
   - **Distance and range** are straight-line, as for sight (Spec 02): a cell is in range when dx squared plus dy squared is at most range squared. The Target block shows the distance rounded to the nearest whole cell.
   - **Range** comes from the readied ranged weapon (Spec 05) or the spell's reach (Spec 04).
   - **Line of fire** is a Bresenham line from the player to the target; it is clear when no wall, closed door or other creature lies on it between the two ends.
   - **Path preview:** the cells of that line, both ends left out, draw as dim dots.
3. The closest target is selected: its cell is highlighted, the path draws, and the Target block fills in the character pane.
4. Tab and Shift+Tab cycle through the sorted list, wrapping at the end.
5. Enter confirms; Esc cancels with no turn spent.

**No valid target:** the log says so and no turn is spent.

**Area spells:** the highlight shows the whole footprint around the selected cell; every cell it touches is tinted, and monsters inside it are marked. One roll resolves the whole area.

**Self spells:** skip targeting and resolve on confirm.

## Overlays and screens

Menus draw as boxed overlays over the main view, so the character pane and log stay visible; only the title, creation and death screens take the full grid.

| Screen | Covers | Contents |
| --- | --- | --- |
| Title | Full grid | New game (random seed or seed of the day), continue, leaderboard |
| Character creation | Full grid | Name, class list with starting dice and major ability |
| Inventory | Main view | Slots used / total, items by slot, actions: use, equip, drop, inspect |
| Spell list | Main view | Known spells, shape (self, target, area), Magic dice available |
| Village service | Main view | No village map: a menu of the services present (bank, lodging, lift, shop, appraisal, identify, repair, rumours, quests); choosing one opens it in place. Go up and Go down leave the village (the surface village has Go down only) |
| Lift | Main view | Visited villages with depth and fare; unvisited ones hidden |
| NPC talk | Main view | Name and role, then that role's options: buy (traders); identify, heal or rumours (hermits); free (captives). Rivals and bandits do not talk |
| Level up | Main view | Gains this level, choose the stat for the new die |
| Message history | Main view | Last 200 log lines, scrollable |
| Help | Main view | Key map |
| Death | Full grid | Cause and depth, then: return to last save, new character on the same seed keeping 10% of bank and one item, or new seed |
| Leaderboard | Full grid | From local storage: seed, name, class, level, deepest level, monsters killed |

## Acceptance criteria

The shell is done when all of these pass in current Chrome, Firefox and Safari on desktop.

- [ ] The 100 x 40 grid fills the viewport with its aspect kept, and glyphs stay crisp at any window size.
- [ ] Every glyph in the core table renders with the correct CP437 code.
- [ ] The three panes draw at the sizes in Screen grid and panes, with box-drawing borders.
- [ ] WASD and arrows move the player; every key in the key map does its action or logs "not yet available".
- [ ] The camera follows the player and clamps at level edges on a level larger than the view.
- [ ] Unseen, remembered and visible cells draw in their three distinct styles.
- [ ] The character pane shows every block in order from test data.
- [ ] The log colours by type, collapses repeats, wraps, and the history overlay scrolls 200 lines.
- [ ] Targeting selects the closest target, cycles both ways, cancels with no turn spent, and previews an area footprint.
- [ ] Each overlay opens, takes keyboard input, and closes with Esc.
- [ ] A redraw after one move repaints only the changed cells.

## Open questions

- [x] **Diagonal movement:** orthogonal only. Requirement for the dungeon spec: every generated level must be fully reachable using four-direction movement (no corridors or doorways joined only at a corner).
- [x] **Grid size:** 100 x 40 approved from the mockup.
- [x] **Font:** IBM VGA 9x16 style approved.
- [x] **Game menu:** Esc offers quit without saving; progress since the last rest is lost.
- [x] **Villages:** menu based, no village map.
