# Megadungeon Spec 09: Save, Load and Run Structure

Sep 30, 2026 · @Robert Stevenson

This spec defines how a run starts, ends and survives a closed browser tab. It is the last spec before the phased implementation plan. Approved September 30, 2026.

## Scope

This spec covers the shape of a run and everything that must persist between browser sessions.

- **In scope:** the run lifecycle, save contents, storage, when saving happens, death options, winning, the leaderboard, and versioning.
- **Out of scope:** how levels regenerate from deltas (Spec 02), the death and leaderboard screens (Spec 01).
- **Traces to intake:** single save at rest, persistent levels per seed, win at level 100, death options, the local-storage leaderboard, and Spec 02's generator versioning.

## Run lifecycle

A run is one seed. The character loops between villages and the dungeon, saving only when resting, until they die or reach level 100.

Run lifecycle (diagram as text):

- Title screen (new or continue) -> Creation (seed, class, name) -> Village (rest saves the game).
- Title screen "continue" -> Village of the last rest.
- Village -> delve -> Dungeon (level 100 wins); Dungeon -> return, bank, rest -> Village.
- Dungeon -> death -> Death screen, choose one:
  - Return to last save -> Village
  - New character, same seed -> Creation
  - New seed -> Title screen

- **Winning:** arriving on level 100 records a win on the leaderboard (intake). Play continues afterwards as a sandbox; defeating the final boss is recorded as a further achievement.
- **Continue:** reopening the game offers Continue, which resumes at the village of the last rest.

## What a save holds

A save stores only what the seed cannot rebuild: the character, the player's changes to the world, and what the player has learned.

| Group | Contents |
| --- | --- |
| Versions | Game version, generator version, content bundle version |
| Run | Run seed, seed of the day flag and date, turn counter |
| Character | Name, class, level, XP, dice and steps per pool, current dice, minor abilities drawn, known spells, statuses, curses |
| Possessions | Equipment, pack contents with quality, charges and broken state, bank balance |
| Level deltas | Per visited level: explored cells, doors opened or broken, containers looted, items taken or dropped, dead monsters and the position and wounds of living ones, found or disarmed traps, used fixtures, NPC states, restocked monsters, turn last left |
| World progress | Villages visited, teleporters unlocked, quests taken and done, active quest state, rescued specialists, connective element progress, artifacts found |
| Knowledge | Identified item kinds, journal entries, rumours heard, spellbook retry flags |
| Location | The village of the last rest (the only place a save is made) |

The run layout, level geometry and disguise names are not stored; they are rebuilt from the seed and generator version (Spec 02). Expected size: well under 1 MB for a full run.

## Storage and saving

There is one save slot per browser, written only when the character rests.

- **Where:** the browser's IndexedDB, which holds far more than local storage and survives restarts. The leaderboard stays in local storage (intake).
- **When:** only on a village rest (intake). There is no autosave in the dungeon.
- **Safe writes:** a save is written as a new record and only then marked current, so a crash mid-write leaves the previous save intact.
- **Quitting:** quit without saving (Esc menu, Spec 01) and simply closing the tab both return the game to the last rest on the next Continue; everything since is lost.
- **Clearing browser data** deletes the save; the title screen warns about this once.
- **Export and import:** the game menu can download the save as a file and load one back, as a backup and to move between browsers.

## Death and new characters

Death always goes on the leaderboard first, then the player picks one of three ways on.

| Choice | What happens | World state |
| --- | --- | --- |
| Return to last save | Loads the last rest; the same character plays on | As at the last rest |
| New character, same seed | Creation opens with the seed fixed; the new character starts at the surface with 10% of the old bank (rounded down) plus the starting 20 gp, and one item chosen from what the dead character carried | Fresh: every level regenerates untouched |
| New seed | Back to the title screen for a new run | Fresh |

- **The recovered item** can be anything carried or equipped, including an artifact.
- **A new run saves at once** when creation finishes, so Continue always has something to load.
- **Return to last save** is always offered; the leaderboard still counts the death.

## Leaderboard

The leaderboard lives in local storage and records every character that dies or wins (intake).

| Field | Notes |
| --- | --- |
| Seed | With a seed-of-the-day marker and date |
| Character | Name, class, level reached |
| Deepest level | The lowest dungeon level reached on foot or by teleporter |
| Monsters killed | Total for the character |
| Score | Total XP, including XP past level 10 (Spec 03) |
| Outcome | Died (with cause and level), or reached level 100, or defeated the final boss |
| Date | When the entry was made |

- **Sorting:** by deepest level, then score.
- **Views:** all runs, or seed of the day only, filtered by date.
- **Size:** the best 100 entries are kept.
- **Entries are written** on death, on reaching level 100, and on defeating the final boss; a character who later dies after winning updates their entry rather than adding a second one.

## Versioning and migration

Updating the game must never break a run in progress.

- **Three versions travel with every save:** the game (save format), the generator (level shapes) and the content bundle (table entries).
- **Save format:** each format change ships a migration that upgrades older saves step by step on load.
- **Generator:** old generator versions stay in the code, and a save keeps using the one it started with (Spec 02), so levels never reshape mid-run.
- **Content:** ids are never removed or reused (Spec 08). A retired entry stays in the bundle marked retired, so saves that hold it still load, but it is never rolled again.
- **Unknown future versions:** a save from a newer game than the one running is refused with a clear message instead of being loaded and damaged.

## Clarifications (task 2.13, proposed October 1, 2026, approved October 2, 2026)

All figures are starting values for playtesting. Where the spec above is silent these fill the gap so the build can proceed; any the owner changes goes back here first.

**What a save is**

- **Format:** one JSON text, save format 1. It holds the three versions, the seed, the seed-of-the-day date, a character id, when it was saved, the village of the last rest, the run's round counter, the character, the player (carried and worn items, bank, quests, journal, identified kinds, spells, shop stock and the counts the leaderboard needs) and one delta per visited level. To stay far under 1 MB, a level's explored cells are stored as alternating run lengths and a living monster as only what differs from a fresh one. A full 100-level run with every level explored and every monster alive comes to about 0.3 MB.
- **Versions:** the game version is the save format number. The generator version is the one the levels were built with; a build that no longer has it refuses the save. The content version is a fingerprint of the content tables made by the content build; it is recorded but never blocks a load, because ids are never removed (Spec 08). Until release, Addendum A below replaces this: a save from other content is refused.
- **Refusals:** a file that is not a save, one with parts missing, one from a newer format and one from a retired generator are each refused with a plain message, and nothing is changed.

**Writing and storing**

- **Safe writes:** the save is written to a numbered record, the pointer `current` is then moved to it, and only then is the old record deleted. A crash at any step leaves a loadable save: the old one before the pointer moves, the new one after.
- **When:** a new run is saved the moment it starts (until creation exists the run start stands in for finishing creation; Addendum A moves the first save to the end of creation), and every village rest saves. Nothing else does.
- **Import** replaces the browser's save with the file's, after reading it; the player then quits to the title screen and chooses Continue. **Export** downloads the current save; with no save yet it says so.
- **The title screen warning** about clearing browser data shows until the first game is started or continued in this browser.

**Death and the leaderboard**

- **A new character on the same seed** is a fresh run of the same seed with the same test character and kit until character creation exists, 20 gp plus 10% of the old bank (rounded down) in the bank, and the one item the player picks from what the dead character carried or wore (worn items first). It is saved at once.
- **Return to last save** loads the current save; if it cannot be read the player is sent to the title screen.
- **Entries** hold seed (with the date for a seed of the day), name, class, level reached, deepest level, monsters killed, score (total XP), outcome, cause and level of death, and date. A character has one entry, identified by an id given at the start of the run; a later moment updates it. A character who dies after reaching level 100 or beating the final boss keeps that better outcome and gains the cause and level of death.
- **Deepest level** counts every dungeon level arrived on, by stairs, teleporter, lever or fall. **Monsters killed** counts every monster that dies on a level the player is on, whoever killed it.
- **Reaching level 100** is recorded on arrival. **The final boss** is the monster with the boss role on level 100; a stub final boss arrives with task 3.10 (Addendum A), and the real one with the level 100 set piece (task 4.10).
- **The leaderboard** shows all runs, or only the runs of the seed of the day of a date (today's when opened); Enter switches the view.

## Addendum A (approved October 2, 2026)

From Intake Addendum A (findings A1, C2).

- **Saves across content changes before release:** until the Content complete gate, a save whose content fingerprint differs from the running build's is refused: "This save was made with different game content and cannot be loaded by this version." Nothing is changed, and the player starts a new run. This replaces, until then, the rule that the content version never blocks a load.
- **After release:** the policy is chosen before the Content complete gate. Either the save stores each visited level's generated contents, so a revisit never depends on the tables, or the tables that placement rolls are frozen at release and later updates only add retired-safe rows.
- **Save format 2 (task 3.3):** with one record of the character (Spec 03, Addendum A), the character's level, XP, minor abilities, pools and wait count are stored inside the player, and the pack's size is no longer stored. A format 1 save migrates on load, taking the player's live pools.
- **First save:** a run is saved when character creation finishes (Spec 01, Addendum A), replacing the stand-in that saved at run start. A new character on the same seed goes through creation with the seed fixed.

**Acceptance criteria added**

- [ ] Before release, a save with a different content fingerprint is refused with the message above and changes nothing.

## Acceptance criteria

- [ ] Saving happens only on a village rest and on finishing creation, never anywhere else.
- [ ] Killing the browser mid-save leaves the previous save loadable.
- [ ] Continue after a quit or closed tab resumes at the last rest with nothing since kept.
- [ ] A saved and reloaded run is identical: every level delta, quest, identified kind and journal entry matches.
- [ ] Each death option works as its table row says, and the death is on the leaderboard before the choice.
- [ ] Reaching level 100 and defeating the final boss each record on the leaderboard, and play continues.
- [ ] A save from each earlier format version loads through its migrations; a newer-version save is refused cleanly.
- [ ] A full 100-level run's save stays under 1 MB.

## Open questions

- [x] **Winning:** reaching level 100 wins; play continues as a sandbox; the final boss is a further achievement.
- [x] **Same-seed restart:** the world resets to untouched.
- [x] **Recovered item:** anything carried or equipped, artifacts included.
- [x] **Export and import:** in the game menu.
- [x] **Leaderboard:** sorted by deepest level then score; best 100 kept.
