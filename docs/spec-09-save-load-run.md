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
