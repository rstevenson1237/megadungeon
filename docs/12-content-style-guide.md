# Megadungeon Content Style Guide (task 4.1)

Oct 3, 2026 · @Robert Stevenson

This is the style guide that Spec 08 ("Authoring workflow", step 1) asks for. It sets tone, naming and length for the content tables, with 10 sample entries for each kind of text. Draft for approval: this is the inner checkpoint of task 4.1, and no bulk content (tasks 4.3 to 4.9) starts until the owner approves the voice.

It adds no rules to the game. Everything marked **checked** is already enforced by the build (`tools/content-checks.ts`, `src/core/schemas.ts`, `src/core/templates.ts`). Everything marked **guide** is a writing convention proposed here, enforced only by review.

## Voice

The baseline voice is terse and classic: short declarative sentences, concrete nouns, no jokes in the narrator's mouth. Dread comes from what is left out. The dungeon is old, indifferent and slightly wrong; it is never cute.

- **Say one thing.** One image or one fact per entry. Cut the second adjective.
- **Plain words.** Prefer "dark", "cold", "old" to "tenebrous". Archaic words belong to the `archaic` style, not the baseline.
- **True and useful.** Hints, rumours and signs never lie (Spec 06, "Hints are true"). Text may be stale or vague; it is never false.
- **No fourth wall.** No mention of dice, XP, levels as a game term for the player, or the interface. A rumour says "level 12" because the village does (Spec 07), and that is the only game number allowed in prose.
- **Present tense for signs and rumours, past tense for books and graffiti.** Signs state, rumours report, books remember.

### Other styles (up to 20% of each text table)

Spec 08 allows up to 20% of each text table in other styles, each entry tagged with `style:`. The coverage report flags a table above 20%. The tags this guide defines:

| `style` | Sounds like | Use for |
| --- | --- | --- |
| (none) | Baseline: terse, classic | At least 80% of every text table |
| `grim` | Blunt about death and loss, no comfort | Graffiti, books, rumours |
| `dry` | Understatement and deadpan humour, one wry turn per entry | Graffiti, signs, rumours, item names |
| `archaic` | Old forms ("hath", "ere", "doth"), formal cadence | Books, signs, vault names |

A new style tag is added here first, then used. Most names (monsters, bosses, villages, rivals) stay untagged, since a name is not prose; vault and item names may carry a tag when the name itself is the joke or the archaism.

## Naming

- **Ids** (checked): lowercase letters, digits and underscores, starting with a letter: `goblin_archer`. An id names what the entry is, not what it says. Ids never change once released. Launch tables use a short table prefix and a running number where the content has no natural name (`graffiti_017`, `book_042`). Stubs keep their `stub_` ids until replaced.
- **Case** (guide): monsters and common creatures are lowercase (`goblin archer`), because the log writes "You hit the goblin archer." Bosses, rivals, villages, vaults and magic items are capitalised as proper names. Vault and shrine names start with a lowercase "the" in the data (`the Sunken Strongroom`) so they read inside a sentence. Whether the UI capitalises one at the start of a line is for task 4.9 to settle.
- **No articles in names** (guide) except the "the" of vault and shrine names. The templates add "a" and "an" (`{a:monster}`).
- **Singular** (guide): a monster named `rat`, not `rats`; `{monsters}` pluralises.
- **No numbers or marks** (guide) in names: no digits, no parentheses, no trailing full stop.
- **Character names** (checked, Spec 03): 1 to 16 characters, letters, spaces, apostrophes and hyphens only.
- **Tags** (guide): lowercase single words (`undead`, `ranged`, `goblinoid`). A tag other rules read is code first; a free tag is a label only.

## Display width

The screen is a 100 x 40 grid of CP437 glyphs (Spec 01). Text is checked against the space it is shown in.

- **Single-line fields** (checked): the `name` of monsters, bosses, village names, level themes, artifacts, traps, altar gods, runes, rivals, NPC names, vault names, gems and jewelry, and magic items is at most **25 cells**, the text area of the character pane (Spec 08, "Single-line width"), and holds no line break. One character is one cell.
- **Wrapped text** (checked as templates only): books, graffiti, signs, rumours and quests wrap inside the message log (70 cells) or an overlay, so no width limit is enforced. The guide keeps them short enough to read in one glance; see the length rules below.
- **Characters** (guide): plain ASCII only. The font is CP437, so the typographic dash, curly quotes and the ellipsis character may not exist or may draw as another glyph. Use a straight quote `"` and apostrophe `'`, a hyphen `-`, and three full stops for an ellipsis. Content files today contain no non-ASCII character, and this guide keeps it so.
- **Quotation in YAML** (guide): text in double quotes, so apostrophes and colons need no escaping.

## Length

| Kind | Guide length | Notes |
| --- | --- | --- |
| Monster, boss, rival, village, vault, item names | At most 25 cells (checked); aim for 8 to 20 | Two or three words |
| Sign | 1 to 6 words, at most 40 cells | A place, a direction or a rule |
| Graffiti | 2 to 12 words, at most 70 cells | Fits one log line |
| Rumour phrasing | One sentence, at most 140 cells | Each template has two to four phrasings |
| Book | One to three sentences, at most 220 cells | Wraps in the reading window |

## Templates

Placeholders (checked) are the nine in `PLACEHOLDERS`: `{level}`, `{village}`, `{monster}`, `{boss}`, `{artifact}`, `{rival}`, `{item}`, `{god}`, `{direction}`. Helpers: `{a:monster}`, `{Monster}`, `{monsters}`.

- **Facts first** (checked by the roller): a template's `needs` names a fact the run layout must hold; the placeholders in a phrasing must all be supplied by that fact.
- **Start a sentence with a capitalised placeholder** (`{Boss} holds level {level}.`) and write the rest as ordinary prose.
- **Several phrasings** per template, in different words, not the same sentence reordered.
- **Never invent a place, person or number** a placeholder does not supply.

## Sample entries

Ten per kind. Samples marked with a `style:` field are the 20% other styles. They are written as they would sit in the YAML files; the table's own fields (colour, rating, depth) are left to the owning tasks, so only the text fields are shown.

### Monster names (`creatures/monsters.yaml`, `name`)

```yaml
- { id: goblin_archer, name: goblin archer }
- { id: cave_rat, name: cave rat }
- { id: tunnel_ghoul, name: tunnel ghoul }
- { id: bone_warden, name: bone warden }
- { id: ash_wraith, name: ash wraith }
- { id: rust_beetle, name: rust beetle }
- { id: pit_stalker, name: pit stalker }
- { id: gutter_slime, name: gutter slime }
- { id: lantern_spider, name: lantern spider }
- { id: deep_horror, name: deep horror }
```

### Boss names (`creatures/bosses.yaml`, `name`)

```yaml
- { id: grask_the_pale, name: Grask the Pale }
- { id: the_tallow_king, name: The Tallow King }
- { id: mother_cinder, name: Mother Cinder }
- { id: varn_ironmouth, name: Varn Ironmouth }
- { id: the_hollow_abbot, name: The Hollow Abbot }
- { id: sister_gloam, name: Sister Gloam }
- { id: ulgrim_deepwarden, name: Ulgrim Deepwarden }
- { id: the_drowned_duke, name: The Drowned Duke }
- { id: old_mawkin, name: Old Mawkin }
- { id: the_last_delver, name: The Last Delver }
```

### Village names (`world/village_names.yaml`, `name`)

```yaml
- { id: village_ashby, name: Ashby }
- { id: village_coldwater, name: Coldwater }
- { id: village_harrow_cross, name: Harrow Cross }
- { id: village_millbank, name: Millbank }
- { id: village_stonewick, name: Stonewick }
- { id: village_low_ferry, name: Low Ferry }
- { id: village_thornfield, name: Thornfield }
- { id: village_gallows_end, name: Gallows End }
- { id: village_dunmere, name: Dunmere }
- { id: village_wickham_under_hill, name: Wickham-under-Hill }
```

### Rival names (`creatures/rivals.yaml`, `name`)

```yaml
- { id: rival_corvin_the_bold, name: Corvin the Bold }
- { id: rival_sera_quickhand, name: Sera Quickhand }
- { id: rival_mordrin_vale, name: Mordrin Vale }
- { id: rival_tamsin_black, name: Tamsin Black }
- { id: rival_old_hob, name: Old Hob }
- { id: rival_edda_stonefist, name: Edda Stonefist }
- { id: rival_jorin_tallow, name: Jorin Tallow }
- { id: rival_marek_the_lame, name: Marek the Lame }
- { id: rival_ilsa_greycloak, name: Ilsa Greycloak }
- { id: rival_brother_wend, name: Brother Wend }
```

### Vault and shrine names (`lore/vault_names.yaml`, `name`)

```yaml
- { id: vault_name_sunken_strongroom, name: the Sunken Strongroom }
- { id: vault_name_misers_cell, name: the Miser's Cell }
- { id: vault_name_last_treasury, name: the Last Treasury }
- { id: vault_name_ember_reliquary, name: the Ember Reliquary }
- { id: vault_name_widows_hoard, name: the Widow's Hoard }
- { id: vault_name_grey_chapel, name: the Grey Chapel }
- { id: vault_name_kings_cellar, name: the King's Cellar }
- { id: vault_name_locked_ossuary, name: the Locked Ossuary }
- { id: vault_name_vault_of_ere, name: the Vault of Ere, style: archaic }
- { id: vault_name_tax_office, name: the Tax Office, style: dry }
```

### Magic item names (`items/magic_items.yaml`, `name`)

```yaml
- { id: potion_healing, name: Potion of Healing }
- { id: potion_clarity, name: Potion of Clarity }
- { id: ring_of_keen_sight, name: Ring of Keen Sight }
- { id: wand_of_sparks, name: Wand of Sparks }
- { id: staff_of_the_warden, name: Staff of the Warden }
- { id: cloak_of_quiet, name: Cloak of Quiet }
- { id: boots_of_the_long_road, name: Boots of the Long Road }
- { id: sword_of_edges, name: Sword of Edges }
- { id: shield_of_the_stubborn, name: Shield of the Stubborn }
- { id: ring_of_mild_luck, name: Ring of Mild Luck, style: dry }
```

### Signs (`lore/signs.yaml`, `text`)

```yaml
- { id: sign_001, text: "Stairs down. Mind the dark." }
- { id: sign_002, text: "Deep hall, this way." }
- { id: sign_003, text: "Authorised delvers only." }
- { id: sign_004, text: "Storeroom. Locked." }
- { id: sign_005, text: "Water is not safe past this point." }
- { id: sign_006, text: "Guard post. Abandoned." }
- { id: sign_007, text: "Vault, three doors on." }
- { id: sign_008, text: "No lamps beyond the gate." }
- { id: sign_009, text: "Hither the dead are borne.", style: archaic }
- { id: sign_010, text: "Please do not feed the thing.", style: dry }
```

### Graffiti (`lore/graffiti.yaml`, `text`)

```yaml
- { id: graffiti_001, text: "Turn back." }
- { id: graffiti_002, text: "Mind the floor." }
- { id: graffiti_003, text: "The wall remembers a door." }
- { id: graffiti_004, text: "Left at the broken lamp. Not right." }
- { id: graffiti_005, text: "Brom was first down this stair." }
- { id: graffiti_006, text: "Something breathes behind this wall." }
- { id: graffiti_007, text: "Rest here. It is safe. It was safe." }
- { id: graffiti_008, text: "I took the gold and I regret it." }
- { id: graffiti_009, text: "Dunn was here, and then he was not.", style: grim }
- { id: graffiti_010, text: "Was here. Still here. Send help.", style: dry }
```

### Books (`lore/books.yaml`, `text`)

```yaml
- { id: book_001, text: "A water-stained ledger of coal weights and the names of the men who carried them." }
- { id: book_002, text: "A prayer book. Every page ends with the same word, written smaller each time." }
- { id: book_003, text: "A delver's diary. The last entry says only that the stairs were farther than they looked." }
- { id: book_004, text: "A tally of lamp oil, bought and burned. The burned column grows long and the bought column stops." }
- { id: book_005, text: "A mason's book of measures, with a hall drawn in it that does not match the hall it was found in." }
- { id: book_006, text: "A child's primer. Someone has crossed out every word for light." }
- { id: book_007, text: "A rule of the old watch. The last rule is torn away, and the page beneath is blank." }
- { id: book_008, text: "A cookbook. Nothing in it is meant for people." }
- { id: book_009, text: "A funeral roll, long and unfinished. The last name written is in a different hand.", style: grim }
- { id: book_010, text: "Here be set down the names of such lords as held this deep, and how they fell.", style: archaic }
```

### Rumour templates (`lore/rumours.yaml`, `needs` and `text`)

Phrasings use only the nine placeholders, and each `needs` is a fact kind the stub table already names.

```yaml
- id: rumour_vault
  needs: vault
  text:
    - "They say a sealed vault waits on level {level}, and only its own key will open it."
    - "A drunk miner swore he saw a vault door on level {level}."
- id: rumour_boss
  needs: boss
  text:
    - "{Boss} holds level {level}."
    - "Something on level {level} guards {artifact}."
- id: rumour_teleporter
  needs: teleporter
  text:
    - "There is a teleporter on level {level}, if you can find the lever."
    - "A delver vanished from level {level} and was seen again on another."
- id: rumour_rival_stash
  needs: rival_stash
  text:
    - "{Rival} hid a stash on level {level}."
    - "{Rival} came back from level {level} with lighter pockets than they left with."
- id: rumour_trap_level
  needs: trap_level
  text:
    - "Level {level} is thick with traps."
    - "Walk slowly on level {level}. The floor is not honest."
- id: rumour_fountain
  needs: fountain
  text:
    - "There is a fountain on level {level}."
    - "Water runs on level {level}, and not everyone who drank it was glad."
- id: rumour_boss_lost
  needs: boss
  text:
    - "Nobody who went to meet {boss} on level {level} has come back."
- id: rumour_vault_dry
  needs: vault
  style: dry
  text:
    - "On level {level} there is a vault. The previous owner is not available to comment."
- id: rumour_rival_dry
  needs: rival_stash
  style: dry
  text:
    - "{Rival} says the stash on level {level} is safe. {Rival} says many things."
- id: rumour_boss_two
  needs: boss
  text:
    - "They say {boss} will not leave level {level}, and that {artifact} will not leave {boss}."
```

## Checklist for every entry

1. Id is lowercase with underscores and unique across the bundle.
2. Name is at most 25 cells, one line, plain ASCII, in the case this guide gives.
3. Text is true, in the baseline voice unless it carries a `style` tag, and within the length guide.
4. Placeholders are known and each is supplied by the template's `needs` fact.
5. No more than 20% of any text table carries a `style` tag, so the coverage report does not flag it.
