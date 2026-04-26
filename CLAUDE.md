# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the Game

No build step. Pure ES6 modules loaded directly by the browser.

```
python3 -m http.server 8080   # then open http://localhost:8080
# or: npx http-server .
```

Open `index.html` in Chrome or Firefox. There are no tests, no linter config, and no package.json.

## Architecture Overview

### Turn Flow

The game is turn-based, input-driven. `GameLoop` runs `requestAnimationFrame` continuously but only for rendering; game state advances only when `InputManager` consumes an action from its queue.

```
KeyPress → InputManager queue → Game._updatePlaying()
  → player action → monster AI (_runMonsterAI) → StatusSystem.tick() → turn:end
```

Game states live in `src/Game.js` (`STATE` enum, ~line 34). `Game.update()` dispatches to a state-specific handler (`_updatePlaying`, `_updateTown`, `_updateMenu`, etc.).

### Entity System

All game objects extend `Entity` (`src/entities/Entity.js`): id, type, x/y, tags (Set), components.

- **Player** (`src/entities/Player.js`) — constructed from `classKey`; resolves `CLASSES` definition; owns `inventory[]`, `equipped{}`, `spellbook[]`, `abilities` (Set), `statuses[]`, and all `_abilityFlag` fields.
- **Monster** (`src/entities/Monster.js`) — constructed from `defKey` into `MONSTERS`; has `aiState` (`'idle'|'alert'|'pursuing'|'fleeing'`).
- **Item** (`src/entities/Item.js`) — use `Item.create(itemKey)`; copies all fields from `ITEMS` data.

Entities live on `TileMap` in a `Map<"x,y", Entity[]>` (`map.entities`).

### Class & Ability System

Class data is in `src/data/classes.js` (`CLASSES` object). Each class defines `abilitiesAtLevel: { levelNum: [abilityKey, …] }`.

**Grant flow** (on level-up via `Player._levelUp`):
```
abilitiesAtLevel[newLevel] → _grantAbility(key) → adds to abilities Set
  → runs passiveEffects[key] → sets permanent flags (_weaponSpecBonus, _fearImmune, etc.)
    or pushes spells into player.spellbook
```

**Activation flow** (player opens ability menu):
```
Game._handleUseAbility() filters player.abilities against activeAbilities allowlist (~line 2893)
  → selection → Game._activateAbility(key) switch statement
```

**Combat hooks** — ability flags consumed inside systems:
- `CombatSystem.resolveAttack()`: `_legendaryStrikeReady`, `_combatSurgeActive`, `_weaponSpecBonus`, `favoredEnemies`, `_quarryX/Y`, `options.backstab`, `_wildEmpathyActive`
- `CombatSystem._rollDamage()`: `_smiteEvilActive`, `holy_sword`, `wild_empathy` beast bonus
- `MagicSystem.cast()`: `_masteredSpells/_spellMasteryCharges` (Spell Mastery), `spell_echo`
- `MagicSystem._applyEffect()`: `_empowerNextSpell` (Metamagic Empower)
- `StatusSystem.apply()`: `_fearImmune`, `_divineHealthActive` immunity gates

**Once-per-day pattern**: flag named `_[ability]UsedToday` or `_[ability]Available`; reset inside the inn rest case in `Game._openInnMenu()`.

### Spell System

Spells are in `src/data/spells.js` (`SPELLS` object). Each spell has `classes: [...]`, `type: 'arcane'|'divine'`, `mpCost`, `range`, `area`, `save`, and `effect: { type, … }`.

`MagicSystem.cast(caster, spellKey, targetPos)` validates MP/range, resolves targets via `_resolveTargets()` (self, single, burst:Nft, all_visible, etc.), then routes each through `_applyEffect()`. Effect types: `damage`, `heal`, `sleep`, `turn`, `light`, `detect`, `buff`, `fear`, `teleport`, `protection`, `cure_status`, `dispel`, `remove_curse`, `debuff`, `paralysis`, `vampiric`.

### Status Effects

`StatusSystem` (`src/systems/StatusSystem.js`) is a static class.
- `apply(entity, key, options)` — creates status: `acMod`, `attackMod`, `damageMod`, `fovBonus`, `damagePerTurn`, `duration`. Checks `_fearImmune` / `_divineHealthActive` immunity gates.
- `tick(entity)` — called each turn; decrements durations, applies per-turn damage, removes expired.
- `has(entity, key)` / `remove(entity, key)` — query and remove.

Status modifiers are applied live: `CombatSystem._getAttackBonus()` sums `status.attackMod`; `_getAC()` sums `status.acMod`.

### World & Map

`WorldMap` (`src/world/WorldMap.js`) manages 100 lazily-generated dungeon levels plus town. Each level is a `TileMap` — 2D tile grid with an entities spatial map and `TileMap.computeFOV(x, y, radius)` for shadowcasting. Levels are built by `LevelGen.js` which picks a theme, layout algorithm (BSP, cave, labyrinth…), and populates monsters/loot.

### Event Bus

`EventBus` (`src/engine/EventBus.js`) is a singleton (`bus`). Standard events: `turn:end`, `player:death`, `monster:death`, `player:attack`, `spell:cast`, `log:message`, `entity:teleported`, `game:victory`. Systems emit; `Game.js` subscribes in its constructor.

### Key Files

| File | Purpose |
|---|---|
| `src/Game.js` | Game states, turn loop, ability activation, combat flow |
| `src/data/classes.js` | All class definitions (`abilitiesAtLevel`, stats, etc.) |
| `src/data/spells.js` | All spell definitions |
| `src/data/items.js` | Item data |
| `src/data/monsters.js` | Monster data |
| `src/entities/Player.js` | `_grantAbility()` passive flags |
| `src/Game.js _activateAbility()` | Active ability switch statement |
| `src/systems/CombatSystem.js` | `resolveAttack()`, `_rollDamage()`, `_getAttackBonus()` |
| `src/systems/MagicSystem.js` | `cast()`, `_applyEffect()` |
| `src/systems/StatusSystem.js` | `apply()`, `tick()`, `has()`, `remove()` |
| `src/engine/rules.js` | `rollSave()`, `rollDie()`, `statModifier()`, `rollDiceStr()` |
| `src/world/WorldMap.js` | World and level management |
| `src/world/LevelGen.js` | Procedural level generation |
| `src/ui/Renderer.js` | Rendering pipeline |
