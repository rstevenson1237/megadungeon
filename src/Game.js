// src/Game.js — restructure to this shape:

import { InputManager }  from './engine/InputManager.js';
import { GameLoop }      from './engine/GameLoop.js';
import { EventBus, bus }      from './engine/EventBus.js';
import { RNG }           from './engine/RNG.js';
import { WorldMap }      from './world/WorldMap.js';
import { Pathfinder }    from './world/Pathfinder.js';
import { Player }        from './entities/Player.js';
import { Renderer, glyphToChar, buildCRTOverlay } from './ui/Renderer.js';
import { Minimap } from './ui/Minimap.js';
import { Menu }        from './ui/Menu.js';
import { Tooltip }     from './ui/Tooltip.js';
import { MessageLog }    from './ui/HUD.js';
import { CombatSystem }  from './systems/CombatSystem.js';
import { MagicSystem } from './systems/MagicSystem.js';
import { PuzzleSystem } from './systems/PuzzleSystem.js';
import { TrapSystem } from './systems/TrapSystem.js';
import { StatusSystem } from './systems/StatusSystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { SPELLS } from './data/spells.js';
import { TOWN_LOCATIONS } from './data/town.js';
import { rollDiceStr, statModifier } from './engine/rules.js';
import { CLASSES } from './data/classes.js';
import { FEATURES } from './data/features.js';
import { Item } from './entities/Item.js';
import { Monster } from './entities/Monster.js';
import { recordVictory, computeScore, getLeaderboard } from './data/leaderboard.js';
import { rollLootTable } from './data/lootTables.js';

const PLAYER_FOV_RADIUS = 8;

// Game states
const STATE = {
  TITLE:            'title',
  CHAR_CREATE:      'char_create',
  STAT_ROLL:        'stat_roll',
  NAME_ENTRY:       'name_entry',
  PLAYING:          'playing',
  DEAD:             'dead',
  PUZZLE:           'puzzle',
  TOWN:             'town',
  MENU:             'menu',
  LEVEL_UP:         'level_up',
  VICTORY:          'victory',
  TARGETING:        'targeting',
  CHARACTER_SHEET:  'character_sheet',
};

class Game {
  constructor() {
    window.game = this;
    this.canvasEl  = document.getElementById('main-canvas');
    this.input     = new InputManager();
    this.loop      = new GameLoop(this.update.bind(this), this.render.bind(this));
    this.bus       = bus;
    this.rng       = new RNG(Date.now());
    this.renderer  = new Renderer(this.canvasEl);
    this.log       = new MessageLog(200);
    this.combat    = new CombatSystem(this.bus);
    this.magic     = new MagicSystem(this.bus, this);
    this.puzzles   = new PuzzleSystem(this.bus, this);
this.traps = new TrapSystem(this.bus);

    this.state        = STATE.TITLE;
    this.player       = null;
    this.worldMap     = null;
    this.quests       = null;
    this.currentLevel = 1;
    this.camera       = { x: 0, y: 0 };
    this.activePuzzle = null;
    this.activeMenu = null;
    this._previousState = null;
    this.targeting = null; // { type: 'spell'|'ranged', data, cursor: {x,y} }

    this._setupEventListeners();
    this._handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.resize(w, h);
        
        // Resize CRT overlay to match
        // const crtCanvas = document.getElementById('crt-canvas');
        // if (crtCanvas) {
        //     crtCanvas.width = this.renderer.canvas.width;
        //     crtCanvas.height = this.renderer.canvas.height;
        //     const crtCtx = crtCanvas.getContext('2d');
        //     const crtOverlay = buildCRTOverlay(crtCanvas.width, crtCanvas.height);
        //     crtCtx.drawImage(crtOverlay, 0, 0);
        // }
        
        // Recalculate camera
        if (this.worldMap && this.player) {
            const map = this.worldMap.getLevel(this.currentLevel);
            this._updateCamera(map);
        }
    };
  }

  _setupEventListeners() {
    // Wire bus events to message log
    this.bus.on('log:message', ({ text, category }) => {
      this.log.add(text, category ?? 'system');
    });

    this.bus.on('player:death', ({ cause }) => {
      if (this.state === STATE.DEAD) return;
      this.log.add('You have died!', 'danger');
      if (this.player) this.player.causeOfDeath = cause ?? 'Unknown';
      this._deathCount = (this._deathCount ?? 0) + 1;
      this.state = STATE.DEAD;
    });

    this.bus.on('monster:death', ({ entity }) => {
      // Track consecutive kills of the same type to use plural in messages
      const killKey = entity.def?.key;
      if (killKey !== this._lastKillKey) { this._lastKillKey = killKey; this._killStreak = 0; }
      this._killStreak = (this._killStreak ?? 0) + 1;
      const useGroup = this._killStreak >= 3 && entity.def?.plural;
      this.log.add(
        useGroup ? `${entity.def.plural} fall!` : `${entity.name} is slain!`,
        'combat'
      );
      const map = this.worldMap.getLevel(this.currentLevel);
      map.removeEntity(entity);
      this._updateQuestProgress('clear', {});
      // Victory: last monster on level 100 cleared
      if (this.currentLevel === 100 && this.state === STATE.PLAYING) {
        let anyMonster = false;
        for (const list of map.entities.values()) {
          if (list.some(e => e.type === 'monster')) { anyMonster = true; break; }
        }
        if (!anyMonster) {
          this.bus.emit('game:victory', { player: this.player, runStats: this._buildRunStats() });
        }
      }
    });

    this.bus.on('game:victory', ({ player, runStats }) => {
      const score = computeScore(runStats);
      const entry = {
        name:           player.name,
        characterClass: player.classKey ?? player.class?.key ?? 'unknown',
        score,
        deepestDeath:   player.depth,
        runTimeMs:      Date.now() - (this._runStartTime ?? Date.now()),
        seed:           String(this.worldMap?.masterSeed ?? 0),
        date:           new Date().toISOString(),
      };
      recordVictory(entry);
      this._victoryScore = score;
      this.state = STATE.VICTORY;
    });

    this.bus.on('game:reset', () => {
      this.input.clearQueue();
      this.state          = STATE.TITLE;
      this.player         = null;
      this.worldMap       = null;
      this.log.messages   = [];
      this.activeMenu     = null;
      this._previousState = null;
      this._deathCount    = 0;
      this._runStartTime  = null;
      this._victoryScore  = null;
    });

    this._rawKeys = [];
    window.addEventListener('keydown', (e) => {
      if (this.state === STATE.NAME_ENTRY) {
        if (e.key === 'Backspace') {
          this.pendingName = this.pendingName.slice(0, -1);
        } else if (e.key === 'Enter') {
          const name = this.pendingName.trim() || 'Adventurer';
          this._startNewGame(this.pendingClassKey, this.pendingStats, name);
        } else if (e.key.length === 1 && this.pendingName.length < 20) {
          this.pendingName += e.key;
        }
        e.preventDefault();
      }
    });
  }

  async init() {
    // Start in TITLE state — the update loop handles transitions
    this.loop.start();
    window.addEventListener('resize', this._handleResize);
    this._handleResize(); // Initial sizing
  }

  // ---------------------------------------------------------------
  // STATE: TITLE
  // Show title screen. Press ENTER to start a new game.
  
  _startNewGame(classKey, stats = null, name = 'Adventurer') {
    this.input.clearQueue();
    const seed = Date.now();
    this.activeMenu     = null;
    this._previousState = null;
    this._deathCount    = 0;
    this._runStartTime  = Date.now();
    this._victoryScore  = null;
    this.rng.seed = seed;
    this.worldMap = new WorldMap(this.rng.seed);
    this.quests = new QuestSystem(this.worldMap, this.rng);
    
    // Create player with selected class
    const resolvedStats = stats ?? { str: 14, dex: 12, con: 13, int: 10, wis: 10, cha: 10 };
    this.player = new Player(classKey, name, resolvedStats);
    
    this._enterLevel(1);
    this.state = STATE.PLAYING;
    this.log.add(`${name} the ${CLASSES[classKey].name} descends into the dungeon...`, 'important');
    this._checkFavoredEnemy();
  }

  _rollStatArray() {
    // Classic 4d6 drop lowest, 6 times
    const stats = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const rolled = {};
    for (const stat of stats) {
      const dice = [1,2,3,4].map(() => this.rng.int(1,6));
      dice.sort((a,b) => a-b);
      rolled[stat] = dice[1] + dice[2] + dice[3]; // Drop lowest
    }
    return rolled;
  }

  _enterCharCreate() {
    const classItems = Object.values(CLASSES).map(c => ({
        label: c.name,
        color: c.color,
        data: c.key,
        description: c.description, // Pass description for the menu
    }));

    const menu = new Menu('Choose your class', classItems, {
        onSelect: (selected) => {
            this.pendingClassKey = selected.data;
            this.pendingStats = this._rollStatArray();
            this.rollRerolls = 3; // Player gets 3 rerolls
            menu.closed = true;
            this.state = STATE.STAT_ROLL;
        },
        onCancel: () => {
            this.state = STATE.TITLE; // Go back to title screen
            if (this.activeMenu) this.activeMenu.closed = true;
        },
        renderDescription: (ctx, item, x, y, w, h, tileH) => {
            if (!item) return;
            const cls = CLASSES[item.data];
            if (!cls) return;

            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, w, h);
            ctx.clip();

            ctx.font = `${tileH - 4}px monospace`;
            ctx.textBaseline = 'top';
            let dy = y + tileH;

            // Description blurb
            ctx.fillStyle = '#aaaaaa';
            const descLines = this.renderer.wrapText(cls.description, w - 20);
            descLines.forEach(line => { ctx.fillText(line, x + 10, dy); dy += tileH - 2; });
            dy += 4;

            // Hit die, prime stats
            ctx.fillStyle = '#ffcc44';
            ctx.fillText(`Hit Die: d${cls.hitDie}   Prime Stat: ${cls.primeStat.join(', ').toUpperCase()}`, x + 10, dy);
            dy += tileH;

            // Class features (up to 5), each wrapped
            ctx.fillStyle = '#88ffaa';
            cls.classFeatures.slice(0, 5).forEach(feat => {
                const fLines = this.renderer.wrapText(`• ${feat}`, w - 20);
                fLines.forEach(line => { ctx.fillText(line, x + 10, dy); dy += tileH - 2; });
            });
            dy += 4;

            // Abilities at levels, wrapped
            ctx.fillStyle = '#888888';
            const abilKeys = Object.entries(cls.abilitiesAtLevel ?? {})
                .map(([lvl, keys]) => `Lv${lvl}: ${keys.join(', ')}`)
                .join('  ');
            const abilLines = this.renderer.wrapText(abilKeys, w - 20);
            abilLines.forEach(line => { ctx.fillText(line, x + 10, dy); dy += tileH - 2; });

            ctx.restore();
        }
    });
    this.activeMenu = menu;
  }

  _enterLevel(levelNum, entryMethod = 'from_above') {
    if (this.currentLevel < levelNum) {
        this._updateQuestProgress('explore', { depth: levelNum });
    }
    this.currentLevel = levelNum;
    this.player.depth = Math.max(this.player.depth, levelNum);
    
    const map = this.worldMap.getLevel(levelNum);
    
    let entryPoint;
    if (entryMethod === 'from_below') {
        // Came from stairs up, should appear at stairs down
        entryPoint = map.metadata.stairDown;
    } else {
        // Came from stairs down, should appear at stairs up (entry)
        entryPoint = map.metadata.entry;
    }

    const entry = entryPoint ?? { x: 5, y: 5 }; // Fallback

    map.removeEntity(this.player); // In case re-entering
    this.player.x = entry.x;
    this.player.y = entry.y;
    map.addEntity(this.player);
    
    // Compute initial FOV
    map.computeFOV(this.player.x, this.player.y, this._effectiveFovRadius());
    this._updateCamera(map);
  }

  // ---------------------------------------------------------------
  // MAIN UPDATE — called every frame by GameLoop
  update(dt) {
    switch (this.state) {
      case STATE.TITLE:       this._updateTitle(); break;
      case STATE.CHAR_CREATE: this._updateCharCreate(); break;
      case STATE.STAT_ROLL:   this._updateStatRoll(); break;
      case STATE.NAME_ENTRY:  this._updateNameEntry(); break;
      case STATE.PLAYING:          this._updatePlaying(); break;
      case STATE.TOWN:             this._updateTown(); break;
      case STATE.MENU:             this._updateMenu(); break;
      case STATE.DEAD:             this._updateDead(); break;
      case STATE.PUZZLE:           this._updatePuzzle(); break;
      case STATE.LEVEL_UP:         this._updateLevelUp(); break;
      case STATE.VICTORY:          this._updateVictory(); break;
      case STATE.TARGETING:        this._updateTargeting(); break;
      case STATE.CHARACTER_SHEET:  this._updateCharacterSheet(); break;
    }
  }

  _updateTown() {
    if (this.player && this.player.hp <= 0) {
        this.state = STATE.DEAD;
        return;
    }
    if (!this.activeMenu) {
      this._openTownOverview();
    }
  }

  _updateTitle() {
    const action = this.input.consumeAction();
    if (action === 'confirm') {
        this._previousState = STATE.TITLE;
        this.state = STATE.CHAR_CREATE;
    }
  }

  _updateCharCreate() {
      if (!this.activeMenu) {
          this._enterCharCreate();
      }
      
      const action = this.input.consumeAction();
      if (!action) return;
      
      this.activeMenu.handleAction(action);
      
      if (this.activeMenu && this.activeMenu.closed) {
          this.activeMenu = null;
          // Safeguard: if state hasn't changed, go back to title
          if (this.state === STATE.CHAR_CREATE) {
              this.state = STATE.TITLE;
          }
      }
  }

  _updateStatRoll() {
    const action = this.input.consumeAction();
    if (action === 'confirm') {
      this.state = STATE.NAME_ENTRY;
      this.pendingName = '';
    }
    // Bind 'R' key temporarily for reroll via drop action (since we moved drop to R)
    if (action === 'drop') {
      if (this.rollRerolls > 0) {
        this.pendingStats = this._rollStatArray();
        this.rollRerolls--;
      }
    }
    if (action === 'cancel') {
        this.state = STATE.CHAR_CREATE;
    }
  }

  _updateNameEntry() {
      // Input is handled by raw window listener
  }

  _updateLevelUp() {
      const action = this.input.consumeAction();
      if (action === 'confirm') {
          this.state = STATE.PLAYING;
          this.pendingLevelUp = null;
      }
  }

  _updatePlaying() {
    if (this.player && this.player.hp <= 0) {
        this.state = STATE.DEAD;
        return;
    }
    const action = this.input.consumeAction();
    if (!action) return; // Turn-based: only advance on input

    const map = this.worldMap.getLevel(this.currentLevel);

    if (StatusSystem.has(this.player, 'sleep') || StatusSystem.has(this.player, 'paralysis')) {
      this.log.add('You cannot move!', 'danger');
      this._runMonsterAI(map); // Monsters still act
      return;
    }

    if(action === 'inventory') {
        this._openInventoryMenu();
        return;
    }

    if(action === 'examine') {
        this._handleExamine();
        return;
    }

    if (action === 'cast') {
        if (this.player.spellbook.length === 0) {
          this.log.add('You have no spells.', 'system');
        } else {
          this._openSpellMenu();
        }
        return;
    }

    if (action === 'spellbook') {
        if (this.player.spellbook.length === 0) {
          this.log.add('You have no spells.', 'system');
        } else {
          this._openSpellMenu(true);
        }
        return;
    }

    if (action === 'sheet') {
        this.state = STATE.CHARACTER_SHEET;
        return;
    }

    if (action === 'fire') {
        const weapon = this.player.equipped.weapon;
        if (weapon?.weapon?.range > 1) {
            this._enterTargeting('ranged', null);
        } else {
            this.log.add('You have no ranged weapon equipped.', 'system');
        }
        return;
    }

if (action === 'drop') {
    this._openDropMenu();
    return;
}

if (action === 'pickup') {
    this._handlePickup();
    return;
}

if (action === 'save') {
    this._quickSave();
    return;
}
if (action === 'load') {
    this._quickLoad();
    return;
}

if (action === 'use') {
    this._handleUseAbility();
    return;
}

if (action === 'interact') {
    this._handleFeatureInteract();
    return;
}

if (this._handleMovement(action, map)) {
      // Movement or attack consumed the turn — run monster AI
      this._runMonsterAI(map);
      map.computeFOV(this.player.x, this.player.y, this._effectiveFovRadius());
      this._updateCamera(map);
      this.bus.emit('turn:end', {});
      // Tick player statuses
      const expired = StatusSystem.tick(this.player);
      for (const key of expired) {
          const msg = key === 'light'      ? 'The magical light fades.'
                    : key === 'battle_cry' ? 'The battle cry fades.'
                    : key === 'blessed'    ? 'The blessing fades.'
                    : `${key} has worn off.`;
          this.log.add(msg, 'system');
      }
    }

    // Non-movement actions (no turn cost for MVP):
    if (action === 'map') this._toggleMinimap();
    if (action === 'stairs:down') this._tryDescend(map);
    if (action === 'stairs:up')   this._tryAscend(map);
  }

  _updateDead() {
    const action = this.input.consumeAction();
    if (action === 'confirm' || action === 'cancel') {
      this.input.clearQueue();
      // Reset to title
      this.state  = STATE.TITLE;
      this.player = null;
      this.worldMap = null;
      this.log.messages = [];
      this.activeMenu = null;
      this._previousState = null;
    }
  }

  _updatePuzzle() {
      // In a real UI, this would handle menu selections.
      // For now, we'll just exit on any key press.
      const action = this.input.consumeAction();
      if(action) {
          this.state = STATE.PLAYING;
          this.activePuzzle = null;
          this.log.add('You step back from the puzzle.', 'system');
      }
  }

  _updateMenu() {
    const action = this.input.consumeAction();
    if (!action) return;
    this.activeMenu.handleAction(action);
    if (this.activeMenu && this.activeMenu.closed) {
        this.activeMenu = null;
        if (this.state === STATE.MENU) {
            this.state = this._previousState ?? STATE.PLAYING;
        }
    }
}

  // Direction label lookup used by examine and interact
  static _DIR_LABEL(dx, dy) {
    if (dx ===  0 && dy ===  0) return '';
    if (dx ===  0 && dy === -1) return 'N';
    if (dx ===  0 && dy ===  1) return 'S';
    if (dx === -1 && dy ===  0) return 'W';
    if (dx ===  1 && dy ===  0) return 'E';
    if (dx === -1 && dy === -1) return 'NW';
    if (dx ===  1 && dy === -1) return 'NE';
    if (dx === -1 && dy ===  1) return 'SW';
    if (dx ===  1 && dy ===  1) return 'SE';
    return '';
  }

  // Returns all nearby tiles (current + 8 directions) that have an actionable feature.
  _findAllInteractableTiles(map) {
    const offsets = [[0,0],[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
    const results = [];
    for (const [dx, dy] of offsets) {
        const x = this.player.x + dx;
        const y = this.player.y + dy;
        const t = map.get(x, y);
        if (!t) continue;
        if (t.features.puzzle || t.features.lore || t.features.shrine || t.features.dungeon)
            results.push({ tile: t, x, y, dx, dy });
    }
    return results;
  }

  _handleExamine() {
    const map = this.worldMap.getLevel(this.currentLevel);
    const tile = map.get(this.player.x, this.player.y);
    const entities = map.getEntitiesAt(this.player.x, this.player.y);

    let found = false;

    // Check tile type
    if (tile.type === 'stair_down') {
        this.log.add('You see stairs descending into darkness.', 'system');
        found = true;
    } else if (tile.type === 'stair_up') {
        this.log.add('You see stairs leading upward.', 'system');
        found = true;
    }

    // Check monsters on tile — open stat tooltip for first visible monster
    const monsters = entities.filter(e => e.type === 'monster');
    if (monsters.length > 0) {
        const m = monsters[0];
        const hpPct = Math.round((m.hp / m.hpMax) * 100);
        this.log.add(`${m.name} — HP ${hpPct}%`, 'system');
        const menu = new Menu(m.name, [{ label: m.name, data: m }], {
            onSelect: () => { menu.closed = true; this.activeMenu = null; this.state = STATE.PLAYING; },
            onCancel: () => { menu.closed = true; this.activeMenu = null; this.state = STATE.PLAYING; },
            renderDescription: Tooltip.forMonster(),
        });
        this._openMenu(menu);
        found = true;
    }

    // Check items on ground
    const items = entities.filter(e => e.type === 'item');
    for (const item of items) {
        this.log.add(`You see: ${item.name} - ${item.description ?? 'nothing special.'}`, 'system');
        found = true;
    }

    // Check tile features — current tile + all 8 directions
    const offsets = [[0,0],[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1],[-1,1],[1,1]];
    for (const [dx, dy] of offsets) {
        const t = map.get(this.player.x + dx, this.player.y + dy);
        if (!t) continue;
        const dir = Game._DIR_LABEL(dx, dy);
        const prefix = dir ? `${dir}: ` : '';

        if (t.features.puzzle && !found) {
            const puzzleState = this.puzzles.examine(t.features.puzzle);
            this.log.add(`-- ${puzzleState.name} --`, 'important');
            this.log.add(`${prefix}${puzzleState.description} [press F to interact]`, 'puzzle');
            found = true;
        }
        if (t.features.trap) {
            this.log.add(`${prefix}${t.features.trap.hint ?? 'Something seems off about this area.'}`, 'trap');
            found = true;
        }
        if (t.features.lore) {
            this.log.add(`${prefix}${t.features.lore.message}`, 'lore');
            found = true;
        }
        if (t.features.shrine) {
            this.log.add(`${prefix}${t.features.shrine.message} [press F to pray]`, 'lore');
            found = true;
        }
        if (t.features.dungeon) {
            const def = FEATURES[t.features.dungeon.key];
            if (def?.description) {
                const hint = def.tier !== 'dressing' && !t.features.dungeon.used
                    ? ' [press F to interact]' : '';
                // For locked chest, hint about lockpicking
                const lockHint = def.onSearch?.requiresKey && !t.features.dungeon.data?.unlocked &&
                    this.player.inventory.some(i => i.itemKey === 'thieves_tools')
                    ? ' [F: attempt to pick lock]' : '';
                this.log.add(`${prefix}${def.description}${hint}${lockHint}`, 'system');
                found = true;
            }
        }
        if (t === tile && t.features.dressing) {
            const descriptions = {
                'barrel':    'An old wooden barrel. It is empty.',
                'rubble':    'A pile of rocks and debris from a past collapse.',
                'bone_pile': 'A scattering of old, gnawed bones.',
                'stain':     'A dark, sticky stain on the floor. Best not to think about it.',
            };
            const desc = descriptions[t.features.dressing];
            if (desc) { this.log.add(desc, 'system'); found = true; }
        }
    }

    if (!found) {
        this.log.add('There is nothing of interest here.', 'system');
    }
}

_handleFeatureInteract() {
    const map = this.worldMap.getLevel(this.currentLevel);
    const results = this._findAllInteractableTiles(map);
    if (results.length === 0) {
        this.log.add('There is nothing here to interact with.', 'system');
        return;
    }

    if (results.length === 1) {
        this._executeFeatureInteract(results[0].tile);
        return;
    }

    // Multiple features adjacent — show disambiguation menu
    const menuItems = results.map(r => {
        const dir = Game._DIR_LABEL(r.dx, r.dy);
        let label = dir ? `${dir}: ` : 'Here: ';
        if (r.tile.features.dungeon) {
            const def = FEATURES[r.tile.features.dungeon.key];
            label += def?.key?.replace(/_/g, ' ') ?? 'feature';
        } else if (r.tile.features.shrine) {
            label += 'shrine';
        } else if (r.tile.features.lore) {
            label += 'inscription';
        } else if (r.tile.features.puzzle) {
            label += 'puzzle';
        }
        return { label, data: r.tile };
    });

    const menu = new Menu('Interact with what?', menuItems, {
        onSelect: (selected) => {
            menu.closed = true;
            this.activeMenu = null;
            this.state = STATE.PLAYING;
            this._executeFeatureInteract(selected.data);
        },
        onCancel: () => {},
    });
    this._openMenu(menu);
}

_executeFeatureInteract(tile) {
    // Puzzle takes priority
    if (tile.features.puzzle) {
        this.activePuzzle = tile.features.puzzle;
        const puzzleState = this.puzzles.examine(tile.features.puzzle);
        this.log.add(`-- ${puzzleState.name} --`, 'important');
        this.log.add(puzzleState.description, 'puzzle');
        this.state = STATE.PUZZLE;
        return;
    }

    // Lore tile
    if (tile.features.lore) {
        this.log.add(tile.features.lore.message, 'lore');
        return;
    }

    // Shrine tile
    if (tile.features.shrine) {
        this._interactWithShrine(tile);
        return;
    }

    // Dungeon feature
    const feature = tile.features.dungeon;
    if (!feature) return;
    const def = FEATURES[feature.key];
    if (!def) return;

    if (feature.used && def.singleUse) {
        this.log.add('Nothing happens. It has already been used.', 'system');
        return;
    }
    if (def.tier === 'dressing') return;

    if (def.tier === 'searchable') {
        this._resolveSearch(tile, feature, def);
        return;
    }
    if (def.tier === 'interactive' && def.onInteract?.autoTrigger) {
        this._resolveAutoTrigger(tile, feature, def);
        return;
    }
    if (def.tier === 'interactive') {
        this._openFeatureMenu(tile, feature, def);
    }
}

_interactWithShrine(tile) {
    const shrine = tile.features.shrine;
    if (shrine.used) {
        this.log.add('The shrine has already been offered to.', 'system');
        return;
    }
    const alreadyBlessed = StatusSystem.has(this.player, 'blessed');
    const menu = new Menu('Pray at the Shrine?', [
        { label: 'Yes, pray', key: 'y', color: '#ffff88', data: 'pray' },
        { label: 'No, leave it', key: 'n', color: '#888888', data: 'cancel' },
    ], {
        onSelect: (selected) => {
            menu.closed = true;
            this.activeMenu = null;
            this.state = STATE.PLAYING;
            if (selected.data !== 'pray') return;
            shrine.used = true;
            if (alreadyBlessed) {
                const healed = Math.min(this.player.level * 2, this.player.hpMax - this.player.hp);
                this.player.hp = Math.min(this.player.hp + healed, this.player.hpMax);
                this.log.add(`The shrine glows warmly. Healed ${healed} HP.`, 'heal');
            } else {
                StatusSystem.apply(this.player, 'blessed', { attackMod: 1, duration: 20 });
                this.log.add('The shrine glows. You feel blessed! (+1 attack for 20 turns)', 'magic');
            }
        },
        onCancel: () => { menu.closed = true; this.activeMenu = null; this.state = STATE.PLAYING; },
    });
    this._openMenu(menu);
}

_resolveSearch(tile, feature, def) {
    const outcomes = def.onSearch?.outcomes;
    if (!outcomes?.length) return;

    if (def.onSearch?.requiresKey && !feature.data?.unlocked) {
        const keyItem = this.player.inventory.find(i => i.itemKey === 'iron_key' || i.itemKey === 'dimensional_key');
        const hasTools = this.player.inventory.some(i => i.itemKey === 'thieves_tools');
        const lockpick = this.player.skills?.lockpicking ?? 0;
        const canPick = hasTools && (lockpick >= 1 || (this.rng.int(1, 20) + lockpick) >= 18);
        if (keyItem) {
            this.player.removeFromInventory(keyItem);
            this.log.add('You use your key to unlock it.', 'system');
            feature.data = { ...(feature.data ?? {}), unlocked: true };
        } else if (canPick) {
            this.log.add('You pick the lock with your thieves\' tools.', 'system');
            feature.data = { ...(feature.data ?? {}), unlocked: true };
        } else {
            this.log.add('It is locked. You need a key or skilled hands.', 'system');
            return;
        }
    }

    const outcome  = this.rng.weightedPick(outcomes.map(o => ({ value: o, weight: o.weight })));
    const goldAmt  = this.rng.int(10, 50);
    const msg = outcome.message
        .replace('{lore_entry}', 'strange inscriptions line the page')
        .replace('{item}',       'a dusty scroll')
        .replace('{monster}',    'skeleton')
        .replace('{gold}',       String(goldAmt))
        .replace('{trap_effect}','a needle jabs your hand');

    this.log.add(msg, 'lore');

    switch (outcome.result) {
        case 'item':
        case 'treasure': {
            const tableName = this.currentLevel <= 15 ? 'humanoid'
                            : this.currentLevel <= 40 ? 'humanoid_warrior'
                            : this.currentLevel <= 65 ? 'undead_ancient'
                            : 'legendary';
            const key = rollLootTable(tableName, this.rng);
            if (key) {
                try {
                    const item = Item.create(key);
                    if (!this.player.addToInventory(item))
                        this.log.add('Your pack is full.', 'system');
                } catch (_) {}
            }
            break;
        }
        case 'gold':
            this.player.gold = (this.player.gold ?? 0) + goldAmt;
            break;
        case 'trap':
            this.player.hp = Math.max(1, this.player.hp - this.rng.int(1, 4));
            this.log.add('You take damage!', 'danger');
            break;
        case 'undead':
        case 'vermin': {
            const map2 = this.worldMap.getLevel(this.currentLevel);
            const pos  = this._findAdjacentFloor(map2);
            if (pos) {
                const mkey = outcome.result === 'undead' ? 'skeleton' : 'giant_rat';
                try {
                    const m = Monster.create(mkey, pos.x, pos.y, this.currentLevel, this.rng);
                    map2.addEntity(m);
                } catch (_) {}
            }
            break;
        }
        case 'curse':
            StatusSystem.apply(this.player, 'cursed', { duration: 20 });
            break;
        case 'lore':
        case 'empty':
        default:
            break;
    }

    feature.used = true;
}

_resolveAutoTrigger(tile, feature, def) {
    const dest = feature.data?.pairedDest;
    if (!dest) {
        this.log.add('The circle hums but has no destination.', 'system');
        return;
    }
    const map = this.worldMap.getLevel(this.currentLevel);
    map.moveEntity(this.player, dest.x, dest.y);
    map.computeFOV(this.player.x, this.player.y, this._effectiveFovRadius());
    this._updateCamera(map);
    this.log.add('The circle activates. In an instant you are elsewhere.', 'lore');
}

_openFeatureMenu(tile, feature, def) {
    const menuItems = (def.onInteract.options ?? [])
        .filter(o => o.action !== 'cancel')
        .map(o => ({ label: o.label, data: o }));

    const menu = new Menu(def.onInteract.prompt, menuItems, {
        onSelect: (sel) => {
            const opt = sel.data;

            if (opt.cost?.gold) {
                if ((this.player.gold ?? 0) < opt.cost.gold) {
                    this.log.add("You don't have enough gold.", 'system');
                    menu.closed = true;
                    return;
                }
                this.player.gold -= opt.cost.gold;
            }
            if (opt.cost?.hp) {
                this.player.hp = Math.max(1, this.player.hp - opt.cost.hp);
            }

            const table =
                def.onInteract.outcomes?.[opt.action] ??
                (opt.action === 'drink_fountain' ? def.onInteract.drinkOutcomes : null) ??
                [];

            if (table.length > 0) {
                const outcome = this.rng.weightedPick(table.map(o => ({ value: o, weight: o.weight })));
                this._applyFeatureEffect(outcome, tile, feature, def);
            } else if (opt.action === 'fill_flask') {
                this.log.add('You fill your flask with cool water.', 'system');
            }

            if (def.singleUse) feature.used = true;
            menu.closed = true;
        },
        onCancel: () => {},
    });
    this._openMenu(menu);
}

_applyFeatureEffect(outcome, tile, feature, def) {
    if (outcome.message) this.log.add(outcome.message, 'lore');

    switch (outcome.effect) {
        case 'heal': {
            const amt = typeof outcome.value === 'string'
                ? rollDiceStr(outcome.value) : (outcome.value ?? 4);
            this.player.hp = Math.min(this.player.hpMax, this.player.hp + amt);
            break;
        }
        case 'restore_mp': {
            if (this.player.mp !== undefined) {
                const amt = typeof outcome.value === 'string'
                    ? rollDiceStr(outcome.value) : (outcome.value ?? 2);
                this.player.mp = Math.min(this.player.mpMax ?? this.player.mp, this.player.mp + amt);
            }
            break;
        }
        case 'poison':
            StatusSystem.apply(this.player, 'poison',  { duration: 10, damage: 1 });
            break;
        case 'bless':
            StatusSystem.apply(this.player, 'blessed', { duration: outcome.value ?? 5 });
            break;
        case 'status':
            StatusSystem.apply(this.player, outcome.value ?? 'blessed', { duration: 10 });
            break;
        case 'curse':
            StatusSystem.apply(this.player, 'cursed',  { duration: 20 });
            break;
        case 'random_teleport': {
            const map = this.worldMap.getLevel(this.currentLevel);
            const floors = map.findTiles('floor');
            if (floors.length > 0) {
                const dest = this.rng.pick(floors);
                map.moveEntity(this.player, dest.x, dest.y);
                map.computeFOV(this.player.x, this.player.y, this._effectiveFovRadius());
                this._updateCamera(map);
            }
            break;
        }
        case 'item': {
            try {
                const item = Item.create('healing_potion');
                if (this.player.addToInventory(item))
                    this.log.add(`You find a ${item.name}.`, 'lore');
                else
                    this.log.add('Your pack is full — the item is lost.', 'system');
            } catch (_) {}
            break;
        }
        case 'spawn_guardian':
        case 'animate': {
            const map2 = this.worldMap.getLevel(this.currentLevel);
            const pos  = this._findAdjacentFloor(map2);
            if (pos) {
                const mkey = def.key === 'statue'       ? 'stone_golem'
                           : def.key === 'sarcophagus'  ? 'skeleton'
                           : 'wight';
                try {
                    const m = Monster.create(mkey, pos.x, pos.y, this.currentLevel, this.rng);
                    map2.addEntity(m);
                } catch (_) {}
            }
            break;
        }
        case 'boon':
            this.player.hp = Math.min(this.player.hpMax, this.player.hp + this.rng.int(4, 8));
            break;
        case 'lore':
        case 'nothing':
        default:
            break;
    }
}

_findAdjacentFloor(map) {
    const shuffled = this.rng.shuffle([[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]]);
    for (const [dx, dy] of shuffled) {
        const nx = this.player.x + dx, ny = this.player.y + dy;
        if (map.inBounds(nx, ny) && !map.get(nx, ny).solid && map.getEntitiesAt(nx, ny).length === 0)
            return { x: nx, y: ny };
    }
    return null;
}

_handlePickup() {
    const map = this.worldMap.getLevel(this.currentLevel);
    const entities = map.getEntitiesAt(this.player.x, this.player.y);
    const items = entities.filter(e => e.type === 'item');

    if (items.length === 0) {
      this.log.add('There is nothing here to pick up.', 'system');
      return;
    }

    // For now, just pick up the first item found
    const item = items[0];

    if (this.player.addToInventory(item)) {
      map.removeEntity(item);
      this.log.add(`You pick up the ${item.name}.`, 'system');
      this._updateQuestProgress('fetch', { itemKey: item.itemKey });
      this._updateQuestProgress('rescue_found', {});
    } else {
      this.log.add('Your inventory is full.', 'important');
    }
}

_openUseMenu() {
  const usable = this.player.inventory.filter(i => i.potion || i.scroll || i.food || i.wand);
  if (usable.length === 0) { this.log.add('Nothing usable.', 'system'); return; }
  const items = usable.map(item => ({ label: item.name, color: item.color, data: item }));
  const menu = new Menu('Use what?', items, {
    onSelect: (sel) => { this._useItem(sel.data); this.activeMenu.closed = true; },
    onCancel: () => {}
  });
  this._openMenu(menu);
}

  // ---------------------------------------------------------------
  // MOVEMENT & BUMP COMBAT

  _handleMovement(action, map) {
    const DIR = {
      'move:n':  [ 0, -1], 'move:s':  [ 0,  1],
      'move:e':  [ 1,  0], 'move:w':  [-1,  0],
      'move:ne': [ 1, -1], 'move:nw': [-1, -1],
      'move:se': [ 1,  1], 'move:sw': [-1,  1],
      'wait':    [ 0,  0],
    };

    const dir = DIR[action];
    if (!dir) return false;

    const [dx, dy] = dir;
    if (dx === 0 && dy === 0) {
      this.log.add('You wait.', 'system');
      return true; // Wait costs a turn
    }

    const nx = this.player.x + dx;
    const ny = this.player.y + dy;

    // Check for monster at target position — bump attack
    const entitiesAtTarget = map.getEntitiesAt(nx, ny);
    const monster = entitiesAtTarget.find(e => e.type === 'monster');
    if (monster) {
      this._playerAttacks(monster);
      return true;
    }

    // Check walkability
    if (!map.isWalkable(nx, ny)) {
      // Silent fail — wall bumps don't cost a turn in classic roguelikes
      return false;
    }

    // Move player
    map.moveEntity(this.player, nx, ny);
    
    const newTile = map.get(nx, ny);
    const trapResult = this.traps.checkTile(newTile, this.player);
    if (trapResult?.teleport) {
        // Teleport to random walkable tile
        const floors = map.findTiles('floor');
        if (floors.length > 0) {
            const dest = this.rng.pick(floors);
            map.moveEntity(this.player, dest.x, dest.y);
        }
    }
    return true;  }

  _playerAttacks(monster) {
    // Show description on first engagement
    if (!monster._described && monster.def.description) {
      monster._described = true;
      this.log.add(monster.def.description, 'lore');
    }
    const attackCount = 1 + (this.player._extraAttacks ?? 0);
    for (let i = 0; i < attackCount; i++) {
        const result = this.combat.resolveAttack(this.player, monster, this.player.equipped.weapon);
        this.log.add(result.message, result.hit ? 'combat' : 'system');

        if (result.hit) {
          if (monster.hp <= 0) {
            this.player.monstersKilled = (this.player.monstersKilled ?? 0) + 1;
            const xpResult = this.player.gainXP(monster.def.xpBase + monster.def.xpPerHD * monster.def.hd);
            this._updateQuestProgress('kill', { monsterType: monster.def?.key ?? monster.name });
            this._rollMonsterLoot(monster);
            if (xpResult.leveled) {
              this.pendingLevelUp = xpResult;
              this.state = STATE.LEVEL_UP;
              this._checkFavoredEnemy();
            }
            break; // Monster dead, stop extra attacks
          }
          // Morale check when monster first drops below 50% HP
          if (!monster.moraleChecked && monster.hp < monster.hpMax * 0.5) {
            monster.moraleChecked = true;
            if (!this.combat.checkMorale(monster)) {
              monster.aiState = 'fleeing';
              this.log.add(`${monster.name} turns to flee!`, 'combat');
            }
          }
        }
    }
  }

  _checkFavoredEnemy() {
    if (this.player.hasAbility('favored_enemy')) {
      const neededCount = this.player.level >= 10 ? 3 : (this.player.level >= 5 ? 2 : 1);
      if (this.player.favoredEnemies.length < neededCount) {
        this._openFavoredEnemyMenu();
      }
    }
  }

  _openFavoredEnemyMenu() {
    const options = [
      { label: 'Humanoid', data: 'humanoid' },
      { label: 'Undead',    data: 'undead' },
      { label: 'Beast',     data: 'beast' },
      { label: 'Dragon',    data: 'dragon' },
      { label: 'Aberration', data: 'aberration' },
    ].filter(opt => !this.player.favoredEnemies.includes(opt.data));

    const menu = new Menu('Choose Favored Enemy', options, {
      onSelect: (selected) => {
        this.player.favoredEnemies.push(selected.data);
        this.log.add(`You have chosen ${selected.data} as a favored enemy!`, 'important');
        menu.closed = true;
        this._checkFavoredEnemy(); // Check if more choices are needed
      },
      onCancel: () => {
        // Must choose if possible
        if (this.player.favoredEnemies.length === 0) {
          this.log.add('You must choose a favored enemy.', 'system');
          this._openFavoredEnemyMenu();
        } else {
           menu.closed = true;
        }
      }
    });
    this._openMenu(menu);
  }

  _currentMap() {
    return this.worldMap?.getLevel(this.currentLevel) ?? null;
  }

  _rollMonsterLoot(monster) {
    const loot = monster.def.loot;
    if (!loot) return;
    if (this.rng.float() > loot.chance) return;
    const itemKey = rollLootTable(loot.table, this.rng);
    if (!itemKey) return;
    try {
      const item = Item.create(itemKey);
      item.x = monster.x;
      item.y = monster.y;
      const map = this._currentMap();
      if (map) {
        map.addEntity(item);
        this.log.add(`${monster.name} drops ${item.name}.`, 'loot');
      }
    } catch (_) { /* unknown item key — silently skip */ }
  }

  _monsterAttacksPlayer(monster) {
    const attack = monster.getPrimaryAttack();
    const roll = this.rng.int(1, 20);
    const hit  = roll >= (20 - this.player.ac);

    // Henchman intercept: 30% chance to halve damage when active
    if (hit && this.player.henchman?.turnsRemaining > 0) {
      this.player.henchman.turnsRemaining--;
      if (this.rng.int(1, 100) <= 30) {
        const dmg = Math.max(1, Math.floor(monster.rollDamage(attack) / 2));
        this.player.hp = Math.max(0, this.player.hp - dmg);
        this.log.add(`Your henchman takes the blow! You take only ${dmg} damage.`, 'combat');
        if (this.player.hp <= 0) this.bus.emit('player:death', { cause: monster.name });
        return;
      }
    }

    if (hit) {
      const dmg = Math.max(1, monster.rollDamage(attack));
      this.player.hp = Math.max(0, this.player.hp - dmg);
      this.log.add(`${monster.name} hits you for ${dmg} damage.`, 'danger');
      if (attack.special) this._applyAttackSpecial(attack.special, monster);
      if (this.player.hp <= 0) {
        this.bus.emit('player:death', { cause: monster.name });
      }
    } else {
      this.log.add(`${monster.name} misses you.`, 'combat');
    }
  }

  _applyAttackSpecial(special, monster) {
    const [type, param] = special.split('_');
    const n = parseInt(param) || 0;
    const saveRoll = () => this.rng.int(1, 20) >= 15;

    switch (type) {
      case 'disease':
        if (this.rng.int(1, 100) <= (n || 10)) {
          StatusSystem.apply(this.player, { key: 'disease', duration: 20 });
          this.log.add('You have been infected with disease!', 'danger');
        }
        break;
      case 'poison':
        if (!saveRoll()) {
          StatusSystem.apply(this.player, { key: 'poison', duration: 6, dmgPerTurn: 1 });
          this.log.add('You are poisoned!', 'danger');
        }
        break;
      case 'paralysis':
        if (!saveRoll()) {
          StatusSystem.apply(this.player, { key: 'paralysis', duration: n || 4 });
          this.log.add(`You are paralyzed! (${n || 4} turns)`, 'danger');
        }
        break;
      case 'energy': // energy_drain_N
        if (special.startsWith('energy_drain')) {
          const immune = ['ring1', 'ring2', 'amulet'].some(s =>
            this.player.equipped[s]?.effects?.some(e => e.type === 'immune' && e.value === 'energy_drain')
          );
          if (immune) {
            this.log.add('The amulet flares — your life force is protected!', 'magic');
          } else {
            const drainN = n || 1;
            this.player.hpMax = Math.max(1, this.player.hpMax - drainN * 4);
            this.player.hp = Math.min(this.player.hp, this.player.hpMax);
            this.log.add(`${monster.name} drains your life force! Max HP reduced by ${drainN * 4}.`, 'danger');
          }
        }
        break;
      case 'knockback': {
        const dx = Math.sign(this.player.x - monster.x);
        const dy = Math.sign(this.player.y - monster.y);
        const nx = this.player.x + dx;
        const ny = this.player.y + dy;
        const map = this._currentMap();
        if (map && map.isWalkable?.(nx, ny)) {
          map.moveEntity(this.player, nx, ny);
          this.log.add('You are knocked back!', 'combat');
        }
        break;
      }
      case 'fear':
        if (!saveRoll()) {
          StatusSystem.apply(this.player, { key: 'fear', duration: n || 3 });
          this.log.add(`You are overcome with fear! (${n || 3} turns)`, 'danger');
        }
        break;
      case 'slow':
        StatusSystem.apply(this.player, { key: 'slow', duration: 4, acMod: -2 });
        this.log.add('You feel sluggish!', 'combat');
        break;
      case 'ignite':
        StatusSystem.apply(this.player, { key: 'burning', duration: 3, dmgPerTurn: 2 });
        this.log.add('You are set on fire!', 'danger');
        break;
    }
  }

  // ---------------------------------------------------------------
  // MONSTER AI (simple chase)

  _runMonsterAI(map) {
    const monsters = [];
    for (const entityList of map.entities.values()) {
      for (const e of entityList) {
        if (e.type === 'monster') monsters.push(e);
      }
    }

    for (const monster of monsters) {
      if (this.state === STATE.DEAD) break;

      // Speed: accumulate energy each turn; only act when >= 1.0
      monster.moveEnergy = (monster.moveEnergy ?? 0) + (monster.def.speed ?? 1);
      if (monster.moveEnergy >= 1.0) {
        monster.moveEnergy -= 1.0;
        this._monsterTurn(monster, map);
      }

      // Regeneration: heal N HP if specials contain 'regenerate_N'
      if (monster.hp > 0) {
        for (const s of monster.def.specials ?? []) {
          if (s.startsWith('regenerate_')) {
            const n = parseInt(s.split('_')[1]) || 1;
            monster.hp = Math.min(monster.hpMax, monster.hp + n);
            break;
          }
        }
      }
    }
  }

  _monsterTurn(monster, map) {
    const tile = map.get(monster.x, monster.y);
    
    // Only act if visible to player (in FOV) — prevents off-screen monster spam
    if (!tile?.visible) return;

    if (StatusSystem.has(monster, 'sleep') || StatusSystem.has(monster, 'paralysis')) {
      // Still tick duration — handled by end-of-turn StatusSystem.tick()
      return; // Cannot act
    }

    const dx = this.player.x - monster.x;
    const dy = this.player.y - monster.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    // Fleeing: move away from player
    if (monster.aiState === 'fleeing') {
      const fx = monster.x - Math.sign(dx);
      const fy = monster.y - Math.sign(dy);
      const occupied = map.getEntitiesAt(fx, fy).some(e => e.type !== 'item');
      if (!occupied && map.isWalkable?.(fx, fy)) map.moveEntity(monster, fx, fy);
      return;
    }

    // Simple AI: move toward player, attack if adjacent
    if (dist === 1 || (Math.abs(dx) === 1 && Math.abs(dy) === 1)) {
      this._monsterAttacksPlayer(monster);
      return;
    }

    const path = Pathfinder.findPath(map, monster.x, monster.y, this.player.x, this.player.y);
    if (path && path.length > 0) {
      const next = path[0];
      const occupied = map.getEntitiesAt(next.x, next.y).some(e => e.type !== "item");
      if (!occupied) map.moveEntity(monster, next.x, next.y);
    }
  }

  // ---------------------------------------------------------------
  // STAIRS

  _tryDescend(map) {
    const tile = map.get(this.player.x, this.player.y);
    if (tile?.type === 'stair_down') {
      this.log.add('You descend deeper into the dungeon.', 'important');
      map.removeEntity(this.player);
      this._enterLevel(this.currentLevel + 1);
    } else {
      this.log.add('There are no stairs going down here.', 'system');
    }
  }

  _tryAscend(map) {
    const tile = map.get(this.player.x, this.player.y);
    if (tile?.type === 'stair_up' && this.currentLevel > 1) {
      this.log.add('You ascend toward the surface.', 'important');
      map.removeEntity(this.player);
      this._enterLevel(this.currentLevel - 1, 'from_below');
    } else if (this.currentLevel === 1 && tile?.type === 'stair_up') {
      this.log.add('You emerge into the safety of town.', 'important');
      const map = this.worldMap.getLevel(this.currentLevel);
      map.removeEntity(this.player);
      this._updateQuestProgress('rescue_returned', {});
      this.state = STATE.TOWN;
      this.townLocation = null;
      this._openTownOverview();
    } else {
      this.log.add('There are no stairs going up here.', 'system');
    }
  }

  // ---------------------------------------------------------------
  // CAMERA

  _updateCamera(map) {
    const halfCols = Math.floor(this.renderer.VIEW_COLS / 2);
    const halfRows = Math.floor(this.renderer.VIEW_ROWS / 2);
    this.camera.x = Math.max(0, Math.min(this.player.x - halfCols, map.w - this.renderer.VIEW_COLS));
    this.camera.y = Math.max(0, Math.min(this.player.y - halfRows, map.h - this.renderer.VIEW_ROWS));
  }

  // ---------------------------------------------------------------
  // RENDER — called every frame

  render(dt) {
    switch (this.state) {
      case STATE.TITLE:            this._renderTitle(); break;
      case STATE.CHAR_CREATE:      this._renderMenu(); break;
      case STATE.MENU:             this._renderMenu(); break;
      case STATE.STAT_ROLL:        this._renderStatRoll(this.renderer.ctx); break;
      case STATE.NAME_ENTRY:       this._renderNameEntry(this.renderer.ctx); break;
      case STATE.PLAYING:          this._renderPlaying(); break;
      case STATE.TOWN:             this._renderTown(); break;
      case STATE.PUZZLE:           this._renderPlaying(); break;
      case STATE.DEAD:             this._renderDead(); break;
      case STATE.LEVEL_UP:         this._renderLevelUp(this.renderer.ctx); break;
      case STATE.VICTORY:          this._renderVictory(); break;
      case STATE.TARGETING:        this._renderTargeting(); break;
      case STATE.CHARACTER_SHEET:  this._renderCharacterSheet(); break;
    }
  }

  _buildRunStats() {
    return {
      level:          this.player?.level          ?? 1,
      gold:           this.player?.gold           ?? 0,
      monstersKilled: this.player?.monstersKilled ?? 0,
      deathCount:     this._deathCount            ?? 0,
    };
  }

  _updateVictory() {
    const action = this.input.consumeAction();
    if (action === 'confirm' || action === 'cancel') {
      this.bus.emit('game:reset');
    }
  }

  _renderVictory() {
    const ctx = this.renderer.ctx;
    const w   = this.canvasEl.width;
    const h   = this.canvasEl.height;
    const th  = this.renderer.TILE_H;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    const titleSize = Math.max(24, Math.floor(w / 18));
    ctx.fillStyle   = '#ffcc00';
    ctx.font        = `bold ${titleSize}px monospace`;
    ctx.textBaseline = 'top';
    const title  = 'VICTORY';
    ctx.fillText(title, (w - ctx.measureText(title).width) / 2, h * 0.08);

    const subSize = Math.max(13, Math.floor(titleSize * 0.45));
    ctx.font      = `${subSize}px monospace`;
    ctx.fillStyle = '#cccccc';
    const sub = 'You have conquered the Megadungeon.';
    ctx.fillText(sub, (w - ctx.measureText(sub).width) / 2, h * 0.08 + titleSize + 12);

    let y = h * 0.25;
    const p = this.player;
    const stats = [
      `Name:     ${p?.name ?? 'Unknown'}`,
      `Class:    ${p?.class?.name ?? 'Adventurer'}`,
      `Level:    ${p?.level ?? 1}`,
      `Depth:    ${p?.depth ?? 100}`,
      `Gold:     ${p?.gold ?? 0}`,
      `Kills:    ${p?.monstersKilled ?? 0}`,
      `Score:    ${this._victoryScore ?? 0}`,
    ];

    ctx.font      = `${subSize}px monospace`;
    for (const line of stats) {
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, w / 2 - subSize * 7, y);
      y += subSize * 1.5;
    }

    // Top 5 leaderboard
    const board = getLeaderboard().slice(0, 5);
    if (board.length > 0) {
      y += subSize;
      ctx.fillStyle = '#ffcc00';
      const hdr = '— Hall of Heroes —';
      ctx.fillText(hdr, (w - ctx.measureText(hdr).width) / 2, y);
      y += subSize * 1.8;
      board.forEach((e, i) => {
        ctx.fillStyle = i === 0 ? '#ffcc00' : '#888888';
        const row = `${String(i + 1).padStart(2)}. ${e.name.padEnd(16)} ${String(e.score).padStart(8)}`;
        ctx.fillText(row, (w - ctx.measureText(row).width) / 2, y);
        y += subSize * 1.4;
      });
    }

    ctx.fillStyle = '#888888';
    ctx.font      = `${Math.max(11, subSize - 2)}px monospace`;
    const prompt  = '[ENTER] Return to title';
    ctx.fillText(prompt, (w - ctx.measureText(prompt).width) / 2, h * 0.9);
  }

  _renderTitle() {
    const ctx = this.renderer.ctx;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
    const th = this.renderer.TILE_H;
    const tw = this.renderer.TILE_W;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    
    const titleSize = Math.max(24, Math.floor(w / 20));
    ctx.fillStyle = '#cc4444';
    ctx.font = `bold ${titleSize}px monospace`;
    ctx.textBaseline = 'top';
    const titleText = 'MEGADUNGEON';
    const titleW = ctx.measureText(titleText).width;
    ctx.fillText(titleText, (w - titleW) / 2, h * 0.25);
    
    const subSize = Math.max(12, Math.floor(titleSize * 0.42));
    ctx.fillStyle = '#888888';
    ctx.font = `${subSize}px monospace`;
    const subText = 'A descent into the mythic underworld';
    const subW = ctx.measureText(subText).width;
    ctx.fillText(subText, (w - subW) / 2, h * 0.25 + titleSize + 20);
    
    ctx.fillStyle = '#ffcc44';
    const startText = 'Press ENTER to begin';
    const startW = ctx.measureText(startText).width;
    ctx.fillText(startText, (w - startW) / 2, h * 0.5);
    
    ctx.fillStyle = '#555555';
    const helpSize = Math.max(10, Math.floor(subSize * 0.85));
    ctx.font = `${helpSize}px monospace`;
    const helpLines = [
        'WASD / Arrows / Numpad: Move   Q/E/Z: Diagonals   Bump: Attack',
        '>/<: Stairs   I: Inventory   G: Pick up   X: Examine   F: Interact',
        'Y: Cast Spell   K: Spellbook   V: Fire Ranged   U: Ability/Item   T: Character Sheet   M: Map',
    ];

    helpLines.forEach((line, i) => {
        ctx.fillText(line, (w - ctx.measureText(line).width) / 2, h * 0.6 + i * (helpSize + 8));
    });

    // Leaderboard — top 10
    const board = getLeaderboard().slice(0, 10);
    if (board.length > 0) {
      const lbSize = Math.max(10, Math.floor(helpSize * 0.85));
      ctx.font      = `${lbSize}px monospace`;
      let ly = h * 0.75;
      ctx.fillStyle = '#ffcc44';
      const hdr = '— Hall of Heroes —';
      ctx.fillText(hdr, (w - ctx.measureText(hdr).width) / 2, ly);
      ly += lbSize + 6;
      board.forEach((e, i) => {
        ctx.fillStyle = i === 0 ? '#ffcc44' : '#555555';
        const date = e.date ? e.date.slice(0, 10) : '';
        const row  = `${String(i + 1).padStart(2)}. ${(e.name ?? '?').padEnd(14)} ${String(e.score).padStart(8)}  ${date}`;
        ctx.fillText(row, (w - ctx.measureText(row).width) / 2, ly);
        ly += lbSize + 4;
      });
    }
}

  _renderPlaying() {
    if (!this.player || !this.worldMap) return;
    const map = this.worldMap.getLevel(this.currentLevel);
    this.renderer.render(map, this.player, this.log, this.camera.x, this.camera.y, map.metadata.theme);

    if (this._minimapVisible) {
      if (!this._minimap) {
        const mmCanvas = document.createElement('canvas');
        this._minimap = new Minimap(map, mmCanvas);
      } else {
        this._minimap.tileMap = map;
      }
      this._minimap.render(this.player.x, this.player.y);
      const ctx = this.renderer.ctx;
      const mmCanvas = this._minimap.canvas;
      const pad = 8;
      const mx = ctx.canvas.width - mmCanvas.width - pad;
      const my = pad;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(mx - 2, my - 2, mmCanvas.width + 4, mmCanvas.height + 4);
      ctx.drawImage(mmCanvas, mx, my);
      ctx.strokeStyle = '#555555';
      ctx.lineWidth = 1;
      ctx.strokeRect(mx - 2, my - 2, mmCanvas.width + 4, mmCanvas.height + 4);
    }
  }

  _renderStatRoll(ctx) {
    const cls = CLASSES[this.pendingClassKey];
    const stats = this.pendingStats;
    const statNames = { str:'Strength', dex:'Dexterity', con:'Constitution',
                         int:'Intelligence', wis:'Wisdom', cha:'Charisma' };
    const tw = this.renderer.TILE_W;
    const th = this.renderer.TILE_H;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    let y = th * 2;
    ctx.fillStyle = cls.color;
    ctx.font = `bold ${th + 4}px monospace`;
    ctx.fillText(`${cls.name} — Ability Scores`, tw, y); y += th * 2;

    ctx.font = `${th}px monospace`;
    for (const [key, label] of Object.entries(statNames)) {
      const val  = stats[key];
      const mod  = Math.floor((val - 10) / 2);
      const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
      const isPrime = cls.primeStat.includes(key);
      ctx.fillStyle = isPrime ? '#ffcc44' : '#cccccc';
      ctx.fillText(`${label.padEnd(14)} ${String(val).padStart(2)}  (${modStr})${isPrime ? ' ★' : ''}`, tw * 2, y);
      y += th * 1.4;
    }

    y += th;
    ctx.fillStyle = '#888888';
    ctx.fillText(`Rerolls remaining: ${this.rollRerolls}`, tw * 2, y); y += th * 1.5;

    ctx.fillStyle = '#ffffff';
    ctx.fillText('[R] Reroll   [ENTER] Accept & Name', tw * 2, y);
  }

  _renderNameEntry(ctx) {
    const th = this.renderer.TILE_H;
    const tw = this.renderer.TILE_W;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${th * 1.5}px monospace`;
    ctx.fillText('Name your adventurer:', tw * 2, ctx.canvas.height / 2 - th * 2);
    // Input box
    ctx.strokeStyle = '#ffcc44';
    ctx.strokeRect(tw * 2, ctx.canvas.height / 2 - th, ctx.canvas.width - tw * 4, th * 2);
    ctx.fillStyle = '#ffcc44';
    ctx.font = `bold ${th * 1.5}px monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillText((this.pendingName || '') + '_', tw * 3, ctx.canvas.height / 2);
    ctx.fillStyle = '#888';
    ctx.font = `${th}px monospace`;
    ctx.fillText('[ENTER] Confirm  (leave blank for "Adventurer")', tw * 2, ctx.canvas.height / 2 + th * 2.5);
  }

  _renderLevelUp(ctx) {
    this._renderPlaying(); // Background
    const tw = this.renderer.TILE_W;
    const th = this.renderer.TILE_H;
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(w/4, h/4, w/2, h/2);
    ctx.strokeStyle = '#ffcc44';
    ctx.strokeRect(w/4, h/4, w/2, h/2);

    let y = h/4 + th * 2;
    ctx.fillStyle = '#ffcc44';
    ctx.font = `bold ${th * 1.5}px monospace`;
    ctx.fillText('*** LEVEL UP! ***', w/2 - (th*6), y); y += th * 2;

    ctx.font = `${th}px monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`You are now level ${this.player.level}!`, w/4 + tw * 2, y); y += th * 1.5;
    ctx.fillText(`HP Gained: +${this.pendingLevelUp.hpGained}`, w/4 + tw * 2, y); y += th * 1.5;

    if (this.pendingLevelUp.newAbilities.length > 0) {
        ctx.fillStyle = '#88ffaa';
        ctx.fillText('New Abilities:', w/4 + tw * 2, y); y += th;
        for (const ability of this.pendingLevelUp.newAbilities) {
            ctx.fillText(`• ${ability.replace(/_/g, ' ')}`, w/4 + tw * 4, y);
            y += th;
        }
    }

    ctx.fillStyle = '#888';
    ctx.fillText('[ENTER] Continue', w/2 - (tw * 4), h/4 + h/2 - th * 2);
  }

  _renderDead() {
    const ctx = this.renderer.ctx;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    
    const titleSize = Math.max(24, Math.floor(w / 20));
    ctx.fillStyle = '#cc2222';
    ctx.font = `bold ${titleSize}px monospace`;
    ctx.textBaseline = 'top';
    const titleText = 'YOU HAVE DIED';
    const titleW = ctx.measureText(titleText).width;
    ctx.fillText(titleText, (w - titleW) / 2, h * 0.15);

    const subSize = Math.max(14, Math.floor(titleSize * 0.5));
    ctx.font = `${subSize}px monospace`;
    ctx.fillStyle = '#ffffff';

    let y = h * 0.3;
    const p = this.player;
    const lines = [
      `Name:   ${p?.name ?? 'Unknown'}`,
      `Class:  ${p?.class?.name ?? 'Adventurer'}`,
      `Level:  ${p?.level ?? 1}`,
      `Depth:  ${p?.depth ?? 0}`,
      `XP:     ${p?.xp ?? 0}`,
      `Cause:  ${p?.causeOfDeath ?? 'Unknown'}`,
    ];

    lines.forEach(line => {
      ctx.fillText(line, w/2 - (subSize * 8), y);
      y += subSize * 1.3;
    });
    
    ctx.fillStyle = '#ffcc44';
    const startText = 'Press ENTER or ESCAPE to return to title';
    const startW = ctx.measureText(startText).width;
    ctx.fillText(startText, (w - startW) / 2, h * 0.8);
  }

  _renderMenu() {
    // First render the underlying game state
    if (this._previousState === STATE.PLAYING) this._renderPlaying();
    else if (this._previousState === STATE.TOWN) this._renderTown();
    else if (this._previousState === STATE.TITLE) this._renderTitle();
    else {
        this.renderer._clear();
        if (this.state === STATE.CHAR_CREATE) this._renderTitle();
    }
    
    // Then overlay the menu
    if (this.activeMenu) {
        const r = this.renderer;
        const menuW = Math.min(r.canvas.width - 40, 500);
        const menuH = Math.min(r.canvas.height - 40, 600);
        const mx = (r.canvas.width - menuW) / 2;
        const my = (r.canvas.height - menuH) / 2;
        this.activeMenu.render(r.ctx, mx, my, menuW, menuH, r.TILE_H);
    }
  }

  _openMenu(menu) {
    if (this.state !== STATE.MENU) {
        this._previousState = this.state;
    }
    this.state = STATE.MENU;
    this.activeMenu = menu;
  }

  _openTownOverview() {
    // Import TOWN_LOCATIONS at the top of Game.js
    const locations = Object.values(TOWN_LOCATIONS).map(loc => ({
        label: `${glyphToChar(loc.glyph)} ${loc.name}`,
        color: loc.color,
        data: loc,
    }));
    
    locations.push({
        label: '> Descend into the dungeon',
        color: '#ff6666',
        data: { key: 'dungeon_entrance' },
    });
    
    const menu = new Menu('Town of Homestead', locations, {
        onSelect: (selected) => {
            if (selected.data.key === 'dungeon_entrance') {
                this._enterDungeonFromTown();
            } else {
                this._enterTownLocation(selected.data);
            }
        },
        onCancel: () => {
            // Can't cancel out of town — must choose a location or enter dungeon
            this._openTownOverview();
        }
    });
    
    this._previousState = STATE.TOWN;
    this.state = STATE.MENU;
    this.activeMenu = menu;
}

_enterDungeonFromTown() {
    this.log.add('You descend into the dungeon once more...', 'important');
    this._enterLevel(1);
    this.state = STATE.PLAYING;
    this.activeMenu = null;
    this._previousState = null;
}

_enterTownLocation(location) {
    this.townLocation = location;
    
    switch (location.key) {
        case 'inn':           this._openInnMenu(location); break;
        case 'general_store': this._openShopMenu(location); break;
        case 'weapon_smith':  this._openWeaponSmithMenu(location); break;
        case 'temple':        this._openTempleMenu(location); break;
        case 'arcane_shop':   this._openArcaneShopMenu(location); break;
        case 'guild_board':   this._openGuildBoardMenu(location); break;
        default:
            this.log.add(`You visit ${location.name}.`, 'system');
            this._openTownOverview();
    }
}

_openInnMenu(location) {
    const restCost = location.restCost(this.player.level);
    const henchCost = this.player.level * 100;
    const hasHenchman = this.player.henchman?.turnsRemaining > 0;
    const items = [
        { label: `Rest for the night (${restCost} gold)`, color: '#66ff66',
          enabled: this.player.gold >= restCost, data: 'rest' },
        { label: 'Listen for rumors', color: '#ccccaa', data: 'rumors' },
        { label: hasHenchman
            ? `Henchman (${this.player.henchman.turnsRemaining} turns remaining)`
            : `Hire a Henchman (${henchCost} gold)`,
          color: hasHenchman ? '#888888' : '#ffcc44',
          enabled: !hasHenchman && this.player.gold >= henchCost,
          data: 'henchman' },
        { label: 'Back to town', color: '#888888', data: 'back' },
    ];

    const menu = new Menu(location.name, items, {
        onSelect: (selected) => {
            switch (selected.data) {
                case 'rest':
                    this.player.gold -= restCost;
                    this.player.hp = this.player.hpMax;
                    this.player.mp = this.player.mpMax;
                    this.player.statuses = [];
                    this.log.add('You rest at the inn. HP and MP fully restored.', 'heal');
                    this._openInnMenu(location);
                    break;
                case 'rumors': {
                    const pool = location.rumors(this.worldMap.townState ?? {});
                    const rumor = pool[this.rng.int(0, pool.length - 1)];
                    this.log.add(`The barkeep leans in: "${rumor}"`, 'lore');
                    this._openInnMenu(location);
                    break;
                }
                case 'henchman':
                    this.player.gold -= henchCost;
                    this.player.henchman = { turnsRemaining: 50, bonus: 1 };
                    this.log.add('A sell-sword agrees to accompany you into the dungeon.', 'system');
                    this._openInnMenu(location);
                    break;
                case 'back':
                    this.activeMenu.closed = true;
                    this._openTownOverview();
                    break;
            }
        },
        onCancel: () => { this._openTownOverview(); }
    });
    this._previousState = STATE.TOWN;
    this.state = STATE.MENU;
    this.activeMenu = menu;
}

_openWeaponSmithMenu(location) {
  const items = [
    { label: 'Buy Weapons',   color: '#44ff44', data: 'buy' },
    { label: 'Sell Items',    color: '#ffcc44', data: 'sell' },
    { label: 'Repair Weapon', color: '#cc8844', data: 'repair' },
    { label: 'Enchant Item',  color: '#88aaff', data: 'enchant' },
    { label: 'Back to town',  color: '#888888', data: 'back' },
  ];
  const menu = new Menu(location.name, items, {
    onSelect: (selected) => {
      switch (selected.data) {
        case 'buy':     this._openBuyMenu(location); break;
        case 'sell':    this._openSellMenu(location); break;
        case 'repair':  this._openRepairMenu(location); break;
        case 'enchant': this._openEnchantMenu(location); break;
        case 'back':
          this.activeMenu.closed = true;
          this._openTownOverview(); break;
      }
    },
    onCancel: () => { this._openTownOverview(); }
  });
  this._previousState = STATE.TOWN;
  this.state = STATE.MENU;
  this.activeMenu = menu;
}

_openRepairMenu(location) {
  const repairable = this.player.inventory.filter(
    i => i.category === 'weapon' || i.category === 'armor'
  );
  if (repairable.length === 0) {
    this.log.add('You have no weapons or armor to repair.', 'system');
    this._openWeaponSmithMenu(location); return;
  }
  const items = repairable.map(item => {
    const cost = Math.floor(item.value * 0.2);
    return {
      label: `${item.name} — ${cost}g`,
      color: this.player.gold >= cost ? '#cc8844' : '#555555',
      enabled: this.player.gold >= cost,
      data: { item, cost },
    };
  });
  items.push({ label: 'Back', color: '#888888', data: null });
  const menu = new Menu(`Repair (${this.player.gold}g)`, items, {
    onSelect: (selected) => {
      if (!selected.data) { this._openWeaponSmithMenu(location); return; }
      this.player.gold -= selected.data.cost;
      this.log.add(`Gareth repairs your ${selected.data.item.name}. Good as new.`, 'system');
      this._openRepairMenu(location);
    },
    onCancel: () => { this._openWeaponSmithMenu(location); }
  });
  this._previousState = STATE.TOWN;
  this.state = STATE.MENU;
  this.activeMenu = menu;
}

_openEnchantMenu(location) {
  const enchantable = this.player.inventory.filter(
    i => (i.weapon || i.armor) && !i.cursed && (i._enchantLevel ?? 0) < 3
  );
  if (enchantable.length === 0) {
    this.log.add('Nothing to enchant, or all items are already at max enchantment (+3).', 'system');
    this._openWeaponSmithMenu(location); return;
  }
  const items = enchantable.map(item => {
    const nextLevel = (item._enchantLevel ?? 0) + 1;
    const cost = location.enchantCost(item, nextLevel);
    return {
      label: `${item.name} → +${nextLevel} — ${cost}g`,
      color: this.player.gold >= cost ? '#88aaff' : '#555555',
      enabled: this.player.gold >= cost,
      data: { item, cost, nextLevel },
    };
  });
  items.push({ label: 'Back', color: '#888888', data: null });
  const menu = new Menu(`Enchant Item (${this.player.gold}g)`, items, {
    onSelect: (selected) => {
      if (!selected.data) { this._openWeaponSmithMenu(location); return; }
      const { item, cost, nextLevel } = selected.data;
      this.player.gold -= cost;
      item._baseName = item._baseName ?? item.name.replace(/ \+\d$/, '');
      item._enchantLevel = nextLevel;
      item.name = `${item._baseName} +${nextLevel}`;
      if (item.weapon) {
        item.weapon.attackBonus = (item.weapon.attackBonus ?? 0) + 1;
        item.weapon.damageMod   = (item.weapon.damageMod   ?? 0) + 1;
      } else if (item.armor) {
        item.armor.acBonus = (item.armor.acBonus ?? 0) + 1;
        this.player.ac = this.player._computeAC();
      }
      this.log.add(`Gareth works the metal. ${item.name} hums with power.`, 'magic');
      this._openEnchantMenu(location);
    },
    onCancel: () => { this._openWeaponSmithMenu(location); }
  });
  this._previousState = STATE.TOWN;
  this.state = STATE.MENU;
  this.activeMenu = menu;
}

_openShopMenu(location) {
    const items = [
        { label: 'Buy', color: '#44ff44', data: 'buy' },
        { label: 'Sell', color: '#ffcc44', data: 'sell' },
        { label: 'Back to town', color: '#888888', data: 'back' },
    ];
    
    const menu = new Menu(location.name, items, {
        onSelect: (selected) => {
            switch (selected.data) {
                case 'buy':  this._openBuyMenu(location); break;
                case 'sell': this._openSellMenu(location); break;
                case 'back':
                    this.activeMenu.closed = true;
                    this._openTownOverview();
                    break;
            }
        },
        onCancel: () => { this._openTownOverview(); }
    });
    this._previousState = STATE.TOWN;
    this.state = STATE.MENU;
    this.activeMenu = menu;
}

_openBuyMenu(location) {
    const markup = location.buyMarkup ?? 1.5;
    const stock = (location.stock ?? []).map(key => {
        try {
            const item = Item.create(key);
            const price = Math.ceil(item.value * markup);
            return {
                label: `${item.name} — ${price}g`,
                color: this.player.gold >= price ? '#44ff44' : '#555555',
                enabled: this.player.gold >= price,
                data: { key, price },
            };
        } catch(e) { return null; }
    }).filter(Boolean);
    
    stock.push({ label: 'Back', color: '#888888', data: { key: 'back' } });
    
    const menu = new Menu(`Buy (${this.player.gold}g)`, stock, {
        onSelect: (selected) => {
            if (selected.data.key === 'back') {
                this._openShopMenu(location);
                return;
            }
            if (this.player.gold >= selected.data.price) {
                this.player.gold -= selected.data.price;
                const item = Item.create(selected.data.key);
                if (this.player.addToInventory(item)) {
                    this.log.add(`Bought ${item.name} for ${selected.data.price}g.`, 'system');
                } else {
                    this.player.gold += selected.data.price; // Refund
                    this.log.add('Inventory full!', 'important');
                }
            }
            this._openBuyMenu(location); // Refresh menu
        },
        onCancel: () => { this._openShopMenu(location); }
    });
    this._previousState = STATE.TOWN;
    this.state = STATE.MENU;
    this.activeMenu = menu;
}

_openSellMenu(location) {
    const markup = location.sellMarkup ?? 0.3;
    const items = this.player.inventory.map((item, i) => {
        const price = Math.floor(item.value * markup);
        const isEquipped = Object.values(this.player.equipped).includes(item);
        return {
            label: `${item.name}${isEquipped ? ' [equipped]' : ''} — ${price}g`,
            color: isEquipped ? '#555555' : '#ffcc44',
            enabled: !isEquipped,
            data: { item, price, index: i },
        };
    });
    
    items.push({ label: 'Back', color: '#888888', data: { item: null } });
    
    const menu = new Menu(`Sell (${this.player.gold}g)`, items, {
        onSelect: (selected) => {
            if (!selected.data.item) {
                this._openShopMenu(location);
                return;
            }
            this.player.gold += selected.data.price;
            this.player.removeFromInventory(selected.data.item);
            this.log.add(`Sold ${selected.data.item.name} for ${selected.data.price}g.`, 'system');
            this._openSellMenu(location); // Refresh
        },
        onCancel: () => { this._openShopMenu(location); }
    });
    this._previousState = STATE.TOWN;
    this.state = STATE.MENU;
    this.activeMenu = menu;
}

_openTempleMenu(location) {
    const costs = location.costs;
    const restoreCost = costs.raise_dead(this.player.level);
    const drainedHP = (this.player.hpMaxBase ?? this.player.hpMax) - this.player.hpMax;
    const items = [
        { label: `Cure Disease (${costs.cure_disease}g)`, color: '#66ff66',
          enabled: this.player.gold >= costs.cure_disease, data: 'cure_disease' },
        { label: `Remove Curse (${costs.remove_curse}g)`, color: '#66ff66',
          enabled: this.player.gold >= costs.remove_curse, data: 'remove_curse' },
        { label: `Restore Vitality (${restoreCost}g)${drainedHP > 0 ? ` — +${drainedHP} max HP` : ' — no drain'}`,
          color: drainedHP > 0 ? '#ff9966' : '#555555',
          enabled: drainedHP > 0 && this.player.gold >= restoreCost, data: 'raise_dead' },
        { label: `Atonement (${costs.atonement}g) — cleanse all afflictions`, color: '#ffffaa',
          enabled: this.player.gold >= costs.atonement, data: 'atonement' },
        { label: `Identify Item (${costs.identify}g)`, color: '#8888ff',
          enabled: this.player.gold >= costs.identify, data: 'identify' },
        { label: 'Back to town', color: '#888888', data: 'back' },
    ];

    const menu = new Menu(location.name, items, {
        onSelect: (selected) => {
            const cost = typeof costs[selected.data] === 'function'
                ? costs[selected.data](this.player.level)
                : costs[selected.data];
            switch (selected.data) {
                case 'cure_disease':
                    this.player.gold -= cost;
                    StatusSystem.remove(this.player, 'disease');
                    StatusSystem.remove(this.player, 'poison');
                    this.log.add('The priests cleanse your body of affliction.', 'heal');
                    this._openTempleMenu(location);
                    break;
                case 'remove_curse':
                    this.player.gold -= cost;
                    for (const [slot, item] of Object.entries(this.player.equipped)) {
                        if (item?.cursed) {
                            this.player.equipped[slot] = null;
                            this.log.add(`The ${item.name} falls away, its dark power broken.`, 'magic');
                        }
                    }
                    this._openTempleMenu(location);
                    break;
                case 'raise_dead': {
                    this.player.gold -= cost;
                    const base = this.player.hpMaxBase ?? this.player.hpMax;
                    const restored = base - this.player.hpMax;
                    if (restored > 0) {
                        this.player.hpMax = base;
                        this.player.hp = Math.min(this.player.hp + restored, this.player.hpMax);
                        this.log.add(`The priests restore your life force. Max HP recovered by ${restored}.`, 'heal');
                    } else {
                        this.log.add('The priests bless you, but your vitality is already whole.', 'heal');
                        this.player.gold += cost;
                    }
                    this._openTempleMenu(location);
                    break;
                }
                case 'atonement': {
                    this.player.gold -= cost;
                    const negatives = ['cursed', 'fear', 'disease', 'poison', 'burning', 'slow', 'paralysis'];
                    const before = (this.player.statuses ?? []).length;
                    this.player.statuses = (this.player.statuses ?? []).filter(s => !negatives.includes(s.key));
                    const cleared = before - this.player.statuses.length;
                    this.log.add(
                        cleared > 0
                            ? `The priests absolve you. ${cleared} affliction(s) cleansed.`
                            : 'The priests bless you. Your soul is already unburdened.',
                        'heal'
                    );
                    this._openTempleMenu(location);
                    break;
                }
                case 'identify':
                    this._openIdentifyMenu(
                      location, costs.identify,
                      item => !item.identified && item.genericName,
                      () => this._openTempleMenu(location)
                    );
                    break;
                case 'back':
                    this.activeMenu.closed = true;
                    this._openTownOverview();
                    break;
            }
        },
        onCancel: () => { this._openTownOverview(); }
    });
    this._previousState = STATE.TOWN;
    this.state = STATE.MENU;
    this.activeMenu = menu;
}

_openArcaneShopMenu(location) {
    const items = [
        { label: 'Buy Spells', color: '#88aaff', data: 'buy_spells' },
        { label: 'Sell Scrolls', color: '#ffcc44', data: 'sell_scrolls' },
        { label: `Identify Magic Item (${location.identifyCost}g)`, color: '#8888ff', data: 'identify_magic' },
        { label: 'Scribe Scroll', color: '#ffffff', data: 'scribe_scroll' },
        { label: 'Back to town', color: '#888888', data: 'back' },
    ];
    
    const menu = new Menu(location.name, items, {
        onSelect: (selected) => {
            switch (selected.data) {
                case 'buy_spells':
                    this._openBuySpellsMenu(location);
                    break;
                case 'sell_scrolls':
                    this._openSellScrollsMenu(location);
                    break;
                case 'identify_magic':
                    this._openIdentifyMenu(
                      location, location.identifyCost,
                      item => !item.identified && ['scroll','ring','wand','potion'].includes(item.category),
                      () => this._openArcaneShopMenu(location)
                    );
                    break;
                case 'scribe_scroll':
                    this._openScribeScrollMenu(location);
                    break;
                case 'back':
                    this.activeMenu.closed = true;
                    this._openTownOverview();
                    break;
            }
        },
        onCancel: () => { this._openTownOverview(); }
    });
    this._previousState = STATE.TOWN;
    this.state = STATE.MENU;
    this.activeMenu = menu;
}

_openIdentifyMenu(location, cost, itemFilter, onDone) {
  const candidates = this.player.inventory.filter(itemFilter);
  if (candidates.length === 0) {
    this.log.add('You have no items that need identification.', 'system');
    onDone(); return;
  }
  const items = candidates.map(item => ({
    label: `${item.genericName ?? item.name} — ${cost}g`,
    color: this.player.gold >= cost ? '#8888ff' : '#555555',
    enabled: this.player.gold >= cost,
    data: item,
  }));
  items.push({ label: 'Back', color: '#888888', data: null });
  const menu = new Menu(`Identify Item (${this.player.gold}g)`, items, {
    onSelect: (selected) => {
      if (!selected.data) { onDone(); return; }
      this.player.gold -= cost;
      selected.data.identified = true;
      const reveal = selected.data.name;
      this.log.add(`Identified: ${reveal}. ${selected.data.description ?? ''}`, 'magic');
      this._openIdentifyMenu(location, cost, itemFilter, onDone); // Refresh
    },
    onCancel: onDone,
  });
  this._previousState = STATE.TOWN;
  this.state = STATE.MENU;
  this.activeMenu = menu;
}

_openSellScrollsMenu(location) {
  const markup = 0.5; // Arcane shop pays 50% for scrolls
  const scrolls = this.player.inventory.filter(i => i.category === 'scroll');
  if (scrolls.length === 0) {
    this.log.add('You have no scrolls to sell.', 'system');
    this._openArcaneShopMenu(location); return;
  }
  const items = scrolls.map(item => {
    const price = Math.floor(item.value * markup);
    return { label: `${item.name} — ${price}g`, color: '#ffcc44', data: { item, price } };
  });
  items.push({ label: 'Back', color: '#888888', data: null });
  const menu = new Menu(`Sell Scrolls (${this.player.gold}g)`, items, {
    onSelect: (selected) => {
      if (!selected.data) { this._openArcaneShopMenu(location); return; }
      this.player.gold += selected.data.price;
      this.player.removeFromInventory(selected.data.item);
      this.log.add(`Sold ${selected.data.item.name} for ${selected.data.price}g.`, 'system');
      this._openSellScrollsMenu(location);
    },
    onCancel: () => { this._openArcaneShopMenu(location); }
  });
  this._previousState = STATE.TOWN;
  this.state = STATE.MENU;
  this.activeMenu = menu;
}

_openScribeScrollMenu(location) {
  const inkpot = this.player.inventory.find(i => i.itemKey === 'inkpot');
  if (!inkpot) {
    this.log.add('You need an inkpot to scribe scrolls. Buy one from Aldric\'s Provisions.', 'system');
    this._openArcaneShopMenu(location); return;
  }
  const known = this.player.spellbook
    .map(k => SPELLS[k])
    .filter(s => s?.type === 'arcane');
  if (known.length === 0) {
    this.log.add('You know no arcane spells to scribe.', 'system');
    this._openArcaneShopMenu(location); return;
  }
  const items = known.map(spell => {
    const cost = spell.level * 50;
    return {
      label: `${spell.name} (L${spell.level}) — ${cost}g`,
      color: this.player.gold >= cost ? '#ffffcc' : '#555555',
      enabled: this.player.gold >= cost,
      data: { spell, cost },
    };
  });
  items.push({ label: 'Back', color: '#888888', data: null });
  const menu = new Menu(`Scribe Scroll (have inkpot, ${this.player.gold}g)`, items, {
    onSelect: (selected) => {
      if (!selected.data) { this._openArcaneShopMenu(location); return; }
      const { spell, cost } = selected.data;
      this.player.gold -= cost;
      this.player.removeFromInventory(inkpot);
      const scroll = Item.create('scroll_template');
      scroll.name = `Scroll of ${spell.name}`;
      scroll.scroll = { spellKey: spell.key, casterLevel: this.player.level };
      if (this.player.addToInventory(scroll)) {
        this.log.add(`You carefully scribe a Scroll of ${spell.name}.`, 'magic');
      }
      this._openArcaneShopMenu(location);
    },
    onCancel: () => { this._openArcaneShopMenu(location); }
  });
  this._previousState = STATE.TOWN;
  this.state = STATE.MENU;
  this.activeMenu = menu;
}

_openBuySpellsMenu(location) {
    const spells = location.spellsAvailable(this.worldMap.townState, this.rng);
    
    const items = spells.map(spell => {
        const cost = (spell.level * 100) + 50; // Arbitrary cost
        const alreadyKnown = this.player.spellbook.includes(spell.key);
        return {
            label: `${spell.name} (L${spell.level}) - ${cost}g`,
            color: alreadyKnown ? '#555555' : (this.player.gold >= cost ? '#88aaff' : '#555555'),
            enabled: !alreadyKnown && this.player.gold >= cost,
            data: { spell, cost },
        };
    });

    items.push({ label: 'Back', color: '#888888', data: null });

    const menu = new Menu(`Buy Spells (${this.player.gold}g)`, items, {
        onSelect: (selected) => {
            if (!selected.data) {
                this._openArcaneShopMenu(location);
                return;
            }
            const { spell, cost } = selected.data;
            if (this.player.gold >= cost) {
                this.player.gold -= cost;
                this.player.spellbook.push(spell.key);
                this.log.add(`You have learned ${spell.name}!`, 'magic');
            }
            this._openBuySpellsMenu(location); // Refresh
        },
        onCancel: () => { this._openArcaneShopMenu(location); }
    });
    this._previousState = STATE.TOWN;
    this.state = STATE.MENU;
    this.activeMenu = menu;
}

_openGuildBoardMenu(location) {
  const items = [
    { label: 'View / Accept Quests', color: '#88aacc', data: 'view' },
    { label: `Turn In Quest (${this.quests.active.length} active)`, color: '#44ff44', data: 'turnin' },
    { label: `Abandon a Quest`, color: '#ff6666',
      enabled: this.quests.active.length > 0, data: 'abandon' },
    { label: 'Back to town', color: '#888888', data: null },
  ];
  const menu = new Menu("Adventurer's Guild Board", items, {
    onSelect: (selected) => {
      if (!selected.data) { this.activeMenu.closed = true; this._openTownOverview(); return; }
      if (selected.data === 'view')    this._openQuestViewMenu(location);
      if (selected.data === 'turnin')  this._openQuestTurnInMenu(location);
      if (selected.data === 'abandon') this._openAbandonQuestMenu(location);
    },
    onCancel: () => { this._openTownOverview(); }
  });
  this._previousState = STATE.TOWN;
  this.state = STATE.MENU;
  this.activeMenu = menu;
}

_openQuestViewMenu(location) {
    // Generate quests if the board is empty
    if (!this.worldMap.townState.guild_board_quests?.length) {
        this.quests.generateQuestBoard(this.player.level);
    }
    
    const quests = this.worldMap.townState.guild_board_quests ?? [];
    const activeIds = new Set(this.quests.active.map(q => q.title));
    
    const items = quests.map(q => ({
        label: `${activeIds.has(q.title) ? '[ACTIVE] ' : ''}${q.title} (${q.reward.xp} XP, ${q.reward.gold ?? 0}g)`,
        color: activeIds.has(q.title) ? '#ffcc44' : '#88aacc',
        enabled: !activeIds.has(q.title),
        data: q,
    }));
    
    items.push({ label: 'Back', color: '#888888', data: null });
    
    const menu = new Menu("Available Quests", items, {
        onSelect: (selected) => {
            if (!selected.data) {
                this._openGuildBoardMenu(location);
                return;
            }
            this.quests.active.push(selected.data);
            this.log.add(`Quest accepted: ${selected.data.title}`, 'important');
            this._openQuestViewMenu(location); // Refresh
        },
        onCancel: () => { this._openGuildBoardMenu(location); }
    });
    this._previousState = STATE.TOWN;
    this.state = STATE.MENU;
    this.activeMenu = menu;
}

_openQuestTurnInMenu(location) {
  const completable = this.quests.active.filter(q =>
    this.quests.checkCompletion(q, this.player, this.worldMap)
  );
  if (completable.length === 0) {
    this.log.add('You have no completed quests to turn in.', 'system');
    this._openGuildBoardMenu(location);
    return;
  }
  const items = completable.map(q => ({
    label: `${q.title} — ${q.reward.xp} XP, ${q.reward.gold ?? 0}g`,
    color: '#44ff44',
    data: q,
  }));
  items.push({ label: 'Back', color: '#888888', data: null });
  const menu = new Menu('Turn In Quests', items, {
    onSelect: (selected) => {
      if (!selected.data) { this._openGuildBoardMenu(location); return; }
      this.quests.completeQuest(selected.data, this.player);
      this.log.add(`Quest turned in: ${selected.data.title}. Rewards granted!`, 'important');
      this._openQuestTurnInMenu(location); // Refresh
    },
    onCancel: () => { this._openGuildBoardMenu(location); }
  });
  this._previousState = STATE.TOWN;
  this.state = STATE.MENU;
  this.activeMenu = menu;
}

_openAbandonQuestMenu(location) {
  if (this.quests.active.length === 0) {
    this.log.add('You have no active quests to abandon.', 'system');
    this._openGuildBoardMenu(location); return;
  }
  const items = this.quests.active.map(q => ({
    label: `${q.title}`,
    color: '#ff6666',
    data: q,
  }));
  items.push({ label: 'Back', color: '#888888', data: null });
  const menu = new Menu('Abandon Quest', items, {
    onSelect: (selected) => {
      if (!selected.data) { this._openGuildBoardMenu(location); return; }
      this.quests.abandonQuest(selected.data);
      this.log.add(`Abandoned: ${selected.data.title}.`, 'system');
      this._openGuildBoardMenu(location);
    },
    onCancel: () => { this._openGuildBoardMenu(location); }
  });
  this._previousState = STATE.TOWN;
  this.state = STATE.MENU;
  this.activeMenu = menu;
}

_openInventoryMenu() {
    const items = this.player.inventory.map((item, i) => {
        const qty = item.stackable && (item.quantity ?? 1) > 1 ? ` ×${item.quantity}` : '';
        return {
            label: `${item.name}${qty}${this._equippedTag(item)}`,
            color: item.cursed ? '#ff4444' : (item.color ?? '#cccccc'),
            enabled: true,
            data: item,
        };
    });
    
    if (items.length === 0) {
        this.log.add('Your inventory is empty.', 'system');
        return;
    }
    
    const menu = new Menu('Inventory', items, {
        onSelect: (selected) => {
            this._openItemActionMenu(selected.data);
        },
        onCancel: () => {},
        renderDescription: Tooltip.forItem(),
    });
    this._openMenu(menu);
}

_effectiveFovRadius() {
    const bonus = (this.player.statuses ?? [])
        .reduce((sum, s) => sum + (s.fovBonus ?? 0), 0);
    return PLAYER_FOV_RADIUS + bonus;
}

_equippedTag(item) {
    const slots = this.player.equipped;
    for (const [slot, equipped] of Object.entries(slots)) {
        if (equipped === item) return ` [${slot}]`;
    }
    return '';
}


_openItemActionMenu(item) {
    const actions = [];
    
    if (['weapon', 'armor', 'ring', 'amulet', 'wand'].includes(item.category)) {
        const isEquipped = Object.values(this.player.equipped).includes(item);
        if (isEquipped) {
            actions.push({ label: 'Unequip', key: 'unequip', color: '#ffcc44', data: 'unequip' });
        } else {
            actions.push({ label: 'Equip', key: 'equip', color: '#44ff44', data: 'equip' });
        }
    }
    if (item.category === 'wand') {
        actions.push({ label: 'Zap', key: 'use', color: '#aa44ff', data: 'use' });
    }
    if (item.category === 'potion') {
        actions.push({ label: 'Drink', key: 'use', color: '#44ff44', data: 'use' });
    }
    if (item.category === 'scroll') {
        actions.push({ label: 'Read', key: 'use', color: '#8844ff', data: 'use' });
    }
    if (item.category === 'food') {
        actions.push({ label: 'Eat', key: 'use', color: '#44ff44', data: 'use' });
    }
    actions.push({ label: 'Drop', key: 'drop', color: '#ff4444', data: 'drop' });
    actions.push({ label: 'Examine', key: 'examine', color: '#888888', data: 'examine' });
    
    const menu = new Menu(item.name, actions, {
        onSelect: (selected) => {
            this._executeItemAction(item, selected.data);
            this.activeMenu.closed = true;
        },
        onCancel: () => {
            this._openInventoryMenu(); // Return to inventory list
        }
    });
    this._openMenu(menu);
}

_handleUseAbility() {
    // Build a list of usable class abilities
    const usable = [];
    const activeAbilities = ['turn_undead', 'lay_on_hands', 'combat_surge', 'battle_cry'];

    for (const key of this.player.abilities) {
        if (activeAbilities.includes(key)) {
            usable.push({
                label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
                data: key,
                color: '#ffcc44',
                enabled: true,
            });
        }
    }

    if (usable.length === 0) {
      // If no class abilities, try standard item menu
      this._openUseMenu();
      return;
    }

    // Add option to use items as well
    usable.push({ label: '--- Items ---', color: '#888', enabled: false, data: null });
    const items = this.player.inventory.filter(i => i.potion || i.scroll || i.food || i.wand);
    usable.push(...items.map(item => ({ label: item.name, color: item.color, data: item })));

    const menu = new Menu('Use Ability or Item', usable, {
      onSelect: (selected) => {
        if (!selected.data) return;
        menu.closed = true;
        this.activeMenu = null;
        this.state = STATE.PLAYING;

        if (typeof selected.data === 'string') {
            this._activateAbility(selected.data);
        } else {
            this._useItem(selected.data);
        }
      },
      onCancel: () => { menu.closed = true; this.activeMenu = null; this.state = STATE.PLAYING; },
    });
    this._openMenu(menu);
  }

  _activateAbility(abilityKey) {
    switch (abilityKey) {
      case 'turn_undead': {
        const result = this.magic.cast(this.player, 'turn_undead', { x: this.player.x, y: this.player.y });
        this.log.add(result.success ? 'You invoke divine authority against the undead!' : result.message, 'magic');
        break;
      }
      case 'lay_on_hands': {
        const heal = this.player.level * 2;
        this.player.hp = Math.min(this.player.hp + heal, this.player.hpMax);
        this.log.add(`You lay on hands, restoring ${heal} HP.`, 'heal');
        break;
      }
      case 'combat_surge': {
        this.player._combatSurgeActive = true;
        this.log.add('You surge with combat fury! Next attack deals double damage.', 'combat');
        break;
      }
      case 'battle_cry': {
        StatusSystem.apply(this.player, 'battle_cry', { attackMod: 1, duration: 3 });
        this.log.add('You let out a battle cry! +1 attack for 3 turns.', 'combat');
        break;
      }
      default:
        this.log.add(`You use ${abilityKey.replace(/_/g, ' ')}.`, 'system');
    }
  }

_executeItemAction(item, action) {
    switch (action) {
        case 'equip': {
            if (!this._classCanEquip(item)) {
                this.log.add(`${this.player.class.name}s cannot use ${item.name}.`, 'system');
                return;
            }
            const slot = item.armor?.slot
                      ?? (item.category === 'weapon' ? 'weapon'
                        : item.category === 'wand'   ? 'weapon'
                        : item.category === 'ring'   ? (!this.player.equipped.ring1 ? 'ring1' : 'ring2')
                        : item.category === 'amulet' ? 'amulet'
                        : null);
            if (slot && this.player.equipped[slot]) {
                // Unequip current first
                const current = this.player.equipped[slot];
                if (current.cursed) {
                    this.log.add(`The ${current.name} is stuck to you! It seems to be cursed.`, 'danger');
                    return;
                }
                this.player.equipped[slot] = null;
            }
            if (slot) {
                this.player.equipped[slot] = item;
                this.player.ac = this.player._computeAC();
                this.log.add(`You equip the ${item.name}.`, 'system');
            }
            break;
        }
        case 'unequip': {
            if (item.cursed) {
                this.log.add(`You can't remove the ${item.name}! It's cursed!`, 'danger');
                return;
            }
            for (const [slot, equipped] of Object.entries(this.player.equipped)) {
                if (equipped === item) {
                    this.player.equipped[slot] = null;
                    this.player.ac = this.player._computeAC();
                    this.log.add(`You remove the ${item.name}.`, 'system');
                    break;
                }
            }
            break;
        }
        case 'use': {
            this._useItem(item);
            break;
        }
        case 'drop': {
            this.player.removeFromInventory(item);
            item.x = this.player.x;
            item.y = this.player.y;
            const map = this.worldMap.getLevel(this.currentLevel);
            map.addEntity(item);
            this.log.add(`You drop the ${item.name}.`, 'system');
            break;
        }
        case 'examine': {
            this.log.add(item.description ?? 'You see nothing special.', 'lore');
            break;
        }
    }
}

_useItem(item) {
    if (item.potion) {
        const effect = item.potion.effect;
        if (effect === 'heal') {
            const healed = rollDiceStr(item.potion.magnitude);
            this.player.hp = Math.min(this.player.hp + healed, this.player.hpMax);
            this.log.add(`You drink the ${item.name}. Healed ${healed} HP.`, 'heal');
        } else if (effect === 'haste') {
            StatusSystem.apply(this.player, 'haste', {
                duration: item.potion.duration ?? 20,
                speedMod: item.potion.magnitude ?? 1,
            });
            this.log.add(`You drink the ${item.name}. The world slows around you!`, 'magic');
        } else if (effect === 'str_boost') {
            StatusSystem.apply(this.player, 'str_boost', {
                duration: item.potion.duration ?? 15,
                strMod: item.potion.magnitude ?? 4,
            });
            this.log.add(`You drink the ${item.name}. Your muscles surge with power!`, 'magic');
        } else if (effect === 'invisible') {
            StatusSystem.apply(this.player, 'invisible', {
                duration: item.potion.duration ?? 10,
            });
            this.log.add(`You drink the ${item.name}. You fade from sight!`, 'magic');
        } else if (effect === 'cure_poison') {
            this.player.statuses = (this.player.statuses ?? []).filter(s => s.key !== 'poison');
            this.log.add(`You drink the ${item.name}. The poison clears from your blood.`, 'heal');
        } else if (effect === 'fire_resist') {
            StatusSystem.apply(this.player, 'fire_resist', {
                duration: item.potion.duration ?? 20,
            });
            this.log.add(`You drink the ${item.name}. Heat no longer bothers you.`, 'magic');
        } else if (effect === 'damage') {
            const dmg = rollDiceStr(item.potion.magnitude ?? '1d6');
            this.player.hp = Math.max(1, this.player.hp - dmg);
            this.log.add(`You drink the ${item.name}. It burns going down! ${dmg} damage.`, 'danger');
        } else {
            this.log.add(`You drink the ${item.name}.`, 'system');
        }
        this.player.removeFromInventory(item);
    } else if (item.scroll) {
        const spellKey = item.scroll.spellKey;
        const spell = SPELLS[spellKey];
        if (!spell) {
            this.log.add('The scroll crumbles unreadably.', 'system');
        } else {
            this.log.add(`You read the ${item.name}. The words vanish from the page.`, 'magic');
            let targetPos;
            if (spell.range === 'self' || spell.range === 'touch') {
                targetPos = { x: this.player.x, y: this.player.y };
            } else {
                targetPos = this._findNearestVisibleMonster();
                if (!targetPos) {
                    this.log.add('No valid target in sight.', 'system');
                    this.player.removeFromInventory(item);
                    return;
                }
            }
            const savedLevel = this.player.level;
            const savedMp = this.player.mp;
            this.player.level = item.scroll.casterLevel ?? savedLevel;
            this.player.mp = Math.max(this.player.mp, spell.mpCost ?? 0);
            const result = this.magic.cast(this.player, spellKey, targetPos);
            this.player.level = savedLevel;
            this.player.mp = savedMp;
            if (result.success) {
                result.results?.forEach(r => {
                    if (r.effect === 'damage') this.log.add(`Deals ${r.value} damage.`, 'magic');
                    if (r.effect === 'heal')   this.log.add(`Heals ${r.value} HP.`, 'heal');
                });
            }
        }
        this.player.removeFromInventory(item);
    } else if (item.wand) {
        if ((item.wand.charges ?? 0) <= 0) {
            this.log.add(`The ${item.name} is spent.`, 'system');
            return;
        }
        const spellKey = item.wand.spellKey;
        const spell = SPELLS[spellKey];
        if (spell) {
            let targetPos;
            if (spell.range === 'self' || spell.range === 'touch') {
                targetPos = { x: this.player.x, y: this.player.y };
            } else {
                targetPos = this._findNearestVisibleMonster();
                if (!targetPos) {
                    this.log.add('No valid target in sight.', 'system');
                    return;
                }
            }
            const savedLevel = this.player.level;
            const savedMp = this.player.mp;
            this.player.level = item.wand.casterLevel ?? 5;
            this.player.mp = Math.max(this.player.mp, spell.mpCost ?? 0);
            const result = this.magic.cast(this.player, spellKey, targetPos);
            this.player.level = savedLevel;
            this.player.mp = savedMp;
            if (result.success) {
                item.wand.charges--;
                this.log.add(`The wand has ${item.wand.charges} charge${item.wand.charges !== 1 ? 's' : ''} remaining.`, 'magic');
                result.results?.forEach(r => {
                    if (r.effect === 'damage') this.log.add(`Deals ${r.value} damage.`, 'magic');
                    if (r.effect === 'heal')   this.log.add(`Heals ${r.value} HP.`, 'heal');
                });
                if (item.wand.charges <= 0) {
                    this.log.add(`The ${item.name} crumbles to dust.`, 'system');
                    this.player.removeFromInventory(item);
                }
            }
        }
    } else if (item.food) {
        this.log.add(`You eat the ${item.name}. It sustains you.`, 'system');
        this.player.removeFromInventory(item);
    }
}

_openDropMenu() {
    if (this.player.inventory.length === 0) {
        this.log.add('You have nothing to drop.', 'system');
        return;
    }
    const items = this.player.inventory.map(item => ({
        label: item.name,
        color: item.color ?? '#cccccc',
        data: item,
    }));
    const menu = new Menu('Drop what?', items, {
        onSelect: (selected) => {
            const item = selected.data;
            if (Object.values(this.player.equipped).includes(item)) {
                this.log.add(`You must unequip the ${item.name} first.`, 'system');
                return;
            }
            this.player.removeFromInventory(item);
            item.x = this.player.x;
            item.y = this.player.y;
            const map = this.worldMap.getLevel(this.currentLevel);
            map.addEntity(item);
            this.log.add(`You drop the ${item.name}.`, 'system');
            this.activeMenu.closed = true;
        },
        onCancel: () => {}
    });
    this._openMenu(menu);
}

_openSpellMenu(readOnly = false) {
    const spellItems = this.player.spellbook.map(key => {
      const spell = SPELLS[key];
      return {
        label: `${spell?.name ?? key}  [${spell?.mpCost ?? 0} MP]`,
        color: '#aa66ff',
        data: key,
        enabled: readOnly ? true : (this.player.mp >= (spell?.mpCost ?? 0)),
        description: spell?.description ?? '',
      };
    });

    const menu = new Menu(readOnly ? 'Spellbook' : 'Cast Spell', spellItems, {
      onSelect: (selected) => {
        if (readOnly) return;
        menu.closed = true;
        this.activeMenu = null;
        this.state = STATE.PLAYING;

        const spell = SPELLS[selected.data];
        const spellMode = this._resolveModeForSpell(spell);
        if (spellMode === 'self') {
            const result = this.magic.cast(this.player, selected.data, { x: this.player.x, y: this.player.y });
            if (result.success) {
                this.log.add(`You cast ${spell.name}!`, 'magic');
                result.results?.forEach(r => {
                    if (r.effect === 'damage') this.log.add(`Deals ${r.value} damage.`, 'magic');
                    if (r.effect === 'heal')   this.log.add(`Heals ${r.value} HP.`, 'heal');
                });
            } else {
                this.log.add(result.message, 'system');
            }
        } else {
            this._enterTargeting('spell', selected.data, spellMode, 'magic');
        }
      },
      onCancel: () => {
        menu.closed = true;
        this.activeMenu = null;
        this.state = STATE.PLAYING;
      },
      renderDescription: Tooltip.forSpell(SPELLS),
    });
    this._openMenu(menu);
  }

_updateQuestProgress(type, data) {
    for (const quest of this.quests.active) {
      if (quest.type === 'kill' && type === 'kill') {
        if (quest.target === data.monsterType || quest.target === 'any') {
          quest.state.killed = (quest.state.killed ?? 0) + 1;
          const needed = quest.count;
          this.log.add(`Quest: ${quest.title} — ${quest.state.killed}/${needed} killed.`, 'system');
          if (this.quests.checkCompletion(quest, this.player, this.worldMap)) {
            this.log.add(`Quest complete: ${quest.title}! Return to the Guild Board.`, 'important');
          }
        }
      } else if (quest.type === 'explore' && type === 'explore') {
        if (!quest.state.reached && data.depth >= quest.targetDepth) {
          quest.state.reached = true;
          this.log.add(`Quest complete: ${quest.title}! Return to the Guild Board.`, 'important');
        }
      } else if (quest.type === 'fetch' && type === 'fetch') {
        if (!quest.state.recovered && data.itemKey === quest.target) {
          quest.state.recovered = true;
          this.log.add(`Quest complete: ${quest.title}! Return to the Guild Board.`, 'important');
        }
      } else if (quest.type === 'clear' && type === 'clear') {
        if (!quest.state.cleared && this.quests.checkCompletion(quest, this.player, this.worldMap)) {
          quest.state.cleared = true;
          this.log.add(`Quest complete: ${quest.title}! Return to the Guild Board.`, 'important');
        }
      } else if (quest.type === 'rescue' && type === 'rescue_found') {
        if (!quest.state.found && this.currentLevel === quest.targetDepth) {
          quest.state.found = true;
          this.log.add(`You find signs of the captive on level ${quest.targetDepth}. Get back to town!`, 'important');
        }
      } else if (quest.type === 'rescue' && type === 'rescue_returned') {
        if (quest.state.found && !quest.state.returned) {
          quest.state.returned = true;
          this.log.add(`Quest complete: ${quest.title}! Return to the Guild Board.`, 'important');
        }
      }
    }
  }

_findNearestVisibleMonster() {
    const map = this.worldMap.getLevel(this.currentLevel);
    let nearest = null;
    let nearestDist = Infinity;
    for (const entityList of map.entities.values()) {
        for (const e of entityList) {
            if (e.type !== 'monster') continue;
            const tile = map.get(e.x, e.y);
            if (!tile?.visible) continue;
            const dist = Math.abs(e.x - this.player.x) + Math.abs(e.y - this.player.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = { x: e.x, y: e.y };
            }
        }
    }
    return nearest;
}

// ---------------------------------------------------------------
// CLASS EQUIPMENT RESTRICTIONS

_classCanEquip(item) {
    const cls = this.player.class;
    const ARMOR_CATS = {
        leather_armor: 'leather', studded_leather: 'leather',
        chain_mail: 'chain', plate_mail: 'plate', half_plate: 'plate',
        shield: 'shield',
        iron_helm: 'helmet', great_helm: 'helmet',
    };
    const WEAPON_CATS = {
        dagger: ['dagger','simple','light_martial'],
        crude_dagger: ['dagger','simple','light_martial'],
        short_sword: ['simple','light_martial','martial'],
        long_sword: ['martial'],
        mace: ['blunt','simple'],
        staff: ['staff','simple','blunt'],
        short_bow: ['bow','martial'],
        hand_crossbow: ['crossbow','martial'],
        battle_axe: ['martial'],
        great_sword: ['martial'],
        war_axe: ['martial'],
        forge_hammer: ['blunt','martial'],
        phase_blade: ['martial'],
    };
    if (item.category === 'armor') {
        const allowed = cls.armorAllowed;
        if (!allowed || allowed.length === 0) return false;
        if (allowed.includes('all')) return true;
        const cat = ARMOR_CATS[item.itemKey];
        return !cat || allowed.includes(cat);
    }
    if (item.category === 'weapon') {
        const allowed = cls.weaponsAllowed;
        if (!allowed || allowed.includes('all')) return true;
        const cats = WEAPON_CATS[item.itemKey] ?? ['martial'];
        return cats.some(c => allowed.includes(c));
    }
    return true;
}

// ---------------------------------------------------------------
// TARGETING SYSTEM
//
// Five modes:
//   'ranged_cycle'  — Tab cycles through visible monsters closest→farthest
//   'cursor_view'   — Arrow keys move cursor; clamped to tiles in player FOV
//   'cursor_map'    — Arrow keys move cursor; no LoS restriction
//   'adjacent'      — Arrow keys select one of 8 adjacent tiles
//
// Theme controls overlay color: 'combat'=red, 'magic'=blue, 'skill'=yellow

_resolveModeForSpell(spell) {
    if (spell.range === 'self')  return 'self';
    if (spell.range === 'touch') return 'adjacent';
    if (spell.area?.startsWith('burst')) return 'cursor_view';
    return 'ranged_cycle';
}

_buildVisibleMonsterList() {
    const map = this.worldMap.getLevel(this.currentLevel);
    const list = [];
    for (const entityList of map.entities.values()) {
        for (const e of entityList) {
            if (e.type !== 'monster') continue;
            const tile = map.get(e.x, e.y);
            if (!tile?.visible) continue;
            list.push(e);
        }
    }
    list.sort((a, b) => {
        const da = Math.abs(a.x - this.player.x) + Math.abs(a.y - this.player.y);
        const db = Math.abs(b.x - this.player.x) + Math.abs(b.y - this.player.y);
        return da - db;
    });
    return list;
}

_enterTargeting(type, data, mode = null, theme = null) {
    const spell = type === 'spell' ? SPELLS[data] : null;

    // Resolve mode
    if (!mode) {
        if (type === 'ranged') mode = 'ranged_cycle';
        else if (spell)       mode = this._resolveModeForSpell(spell);
        else                  mode = 'cursor_view';
    }
    if (!theme) {
        theme = type === 'ranged' ? 'combat' : type === 'spell' ? 'magic' : 'skill';
    }

    // AOE radius from spell area (feet → tiles)
    const aoeRadius = spell?.area?.startsWith('burst:')
        ? Math.round(parseInt(spell.area.split(':')[1]) / 5)
        : 0;

    // Build target list for cycle mode
    const targets = (mode === 'ranged_cycle') ? this._buildVisibleMonsterList() : [];

    // Short-circuit: ranged_cycle with exactly 1 target
    if (mode === 'ranged_cycle' && targets.length === 1) {
        const t = targets[0];
        this.targeting = { type, mode, theme, data, aoeRadius,
            cursor: { x: t.x, y: t.y }, targets, targetIndex: 0 };
        this.state = STATE.TARGETING;
        this.log.add(`Target: ${t.name} — [Enter] to confirm, [Esc] to cancel.`, 'system');
        return;
    }
    if (mode === 'ranged_cycle' && targets.length === 0) {
        this.log.add('No targets in range.', 'system');
        return;
    }

    // Default cursor position
    let cursor;
    if (mode === 'ranged_cycle' && targets.length > 0) {
        cursor = { x: targets[0].x, y: targets[0].y };
    } else if (mode === 'adjacent') {
        cursor = { x: this.player.x, y: this.player.y - 1 }; // default north
    } else {
        const nearest = this._findNearestVisibleMonster();
        cursor = nearest ?? { x: this.player.x, y: this.player.y };
    }

    this.targeting = { type, mode, theme, data, aoeRadius,
        cursor, targets, targetIndex: 0 };
    this.state = STATE.TARGETING;
}

_updateTargeting() {
    const action = this.input.consumeAction();
    if (!action) return;

    if (action === 'cancel') {
        this.targeting = null;
        this.state = STATE.PLAYING;
        this.log.add('Cancelled.', 'system');
        return;
    }

    if (action === 'confirm') {
        this._fireTargeted();
        return;
    }

    const { mode, targets } = this.targeting;
    const map = this.worldMap.getLevel(this.currentLevel);

    const DIR = {
        'move:n': [0,-1], 'move:s': [0,1],
        'move:e': [1,0],  'move:w': [-1,0],
        'move:ne': [1,-1], 'move:nw': [-1,-1],
        'move:se': [1,1],  'move:sw': [-1,1],
    };

    if (mode === 'ranged_cycle') {
        if (action === 'target:next') {
            this.targeting.targetIndex = (this.targeting.targetIndex + 1) % targets.length;
            const t = targets[this.targeting.targetIndex];
            this.targeting.cursor = { x: t.x, y: t.y };
        } else if (action === 'target:prev') {
            this.targeting.targetIndex = (this.targeting.targetIndex - 1 + targets.length) % targets.length;
            const t = targets[this.targeting.targetIndex];
            this.targeting.cursor = { x: t.x, y: t.y };
        } else {
            // Fall through to free cursor if player presses a direction
            const dir = DIR[action];
            if (dir) {
                this.targeting.mode = 'cursor_view';
                this.targeting.cursor.x += dir[0];
                this.targeting.cursor.y += dir[1];
            }
        }
        return;
    }

    if (mode === 'adjacent') {
        const dir = DIR[action];
        if (dir) {
            this.targeting.cursor = {
                x: this.player.x + dir[0],
                y: this.player.y + dir[1],
            };
        }
        return;
    }

    // cursor_view and cursor_map
    const dir = DIR[action];
    if (dir) {
        const nx = this.targeting.cursor.x + dir[0];
        const ny = this.targeting.cursor.y + dir[1];
        if (mode === 'cursor_map') {
            // Clamp to map bounds
            const m = this.worldMap.getLevel(this.currentLevel);
            this.targeting.cursor.x = Math.max(0, Math.min(nx, m.w - 1));
            this.targeting.cursor.y = Math.max(0, Math.min(ny, m.h - 1));
        } else {
            // cursor_view: only move if destination tile is visible
            const tile = map.get(nx, ny);
            if (tile?.visible) {
                this.targeting.cursor.x = nx;
                this.targeting.cursor.y = ny;
            }
        }
    }
}

_fireTargeted() {
    const { type, data, cursor } = this.targeting;
    const map = this.worldMap.getLevel(this.currentLevel);
    this.targeting = null;
    this.state = STATE.PLAYING;

    if (type === 'spell') {
        const spell = SPELLS[data];
        const result = this.magic.cast(this.player, data, cursor);
        if (result.success) {
            this.log.add(`You cast ${spell.name}!`, 'magic');
            result.results?.forEach(r => {
                if (r.effect === 'damage') this.log.add(`Deals ${r.value} damage.`, 'magic');
                if (r.effect === 'heal')   this.log.add(`Heals ${r.value} HP.`, 'heal');
            });
        } else {
            this.log.add(result.message, 'system');
            return;
        }
    } else if (type === 'ranged') {
        const weapon = this.player.equipped.weapon;
        if (!weapon?.weapon?.range || weapon.weapon.range <= 1) {
            this.log.add('You have no ranged weapon equipped.', 'system');
            return;
        }
        const arrows = this.player.inventory.find(i => i.itemKey === 'arrows_20');
        if (!arrows) {
            this.log.add('You have no arrows.', 'system');
            return;
        }
        const entitiesAtCursor = map.getEntitiesAt(cursor.x, cursor.y);
        const target = entitiesAtCursor.find(e => e.type === 'monster');
        if (!target) {
            this.log.add('No target there.', 'system');
            return;
        }
        const result = this.combat.resolveRangedAttack(this.player, target, weapon);
        this.log.add(result.message, result.hit ? 'combat' : 'system');
        if (result.hit && target.hp <= 0) {
            this.player.monstersKilled = (this.player.monstersKilled ?? 0) + 1;
            const xpResult = this.player.gainXP(target.def.xpBase + target.def.xpPerHD * target.def.hd);
            this._updateQuestProgress('kill', { monsterType: target.def?.key ?? target.name });
            this._rollMonsterLoot(target);
            if (xpResult.leveled) {
                this.pendingLevelUp = xpResult;
                this.state = STATE.LEVEL_UP;
                this._checkFavoredEnemy();
                return;
            }
        }
        arrows.quantity = (arrows.quantity ?? 20) - 1;
        if (arrows.quantity <= 0) {
            this.player.removeFromInventory(arrows);
            this.log.add('Your quiver is empty.', 'system');
        }
    }

    // Consume a turn
    this._runMonsterAI(map);
    map.computeFOV(this.player.x, this.player.y, this._effectiveFovRadius());
    this._updateCamera(map);
    this.bus.emit('turn:end', {});
    const expired = StatusSystem.tick(this.player);
    for (const key of expired) {
        const msg = key === 'light'      ? 'The magical light fades.'
                  : key === 'battle_cry' ? 'The battle cry fades.'
                  : key === 'blessed'    ? 'The blessing fades.'
                  : `${key} has worn off.`;
        this.log.add(msg, 'system');
    }
}

_renderTargeting() {
    this._renderPlaying();
    if (this.targeting?.cursor) {
        const map = this.worldMap.getLevel(this.currentLevel);
        this.renderer.drawTargetingOverlay(
            this.renderer.ctx,
            this.targeting,
            this.player,
            this.camera.x,
            this.camera.y,
            map
        );
    }
}

// ---------------------------------------------------------------
// CHARACTER SHEET

_updateCharacterSheet() {
    const action = this.input.consumeAction();
    if (action === 'cancel' || action === 'sheet' || action === 'confirm') {
        this.state = STATE.PLAYING;
    }
}

_renderCharacterSheet() {
    if (!this.player) return;
    this.renderer.drawCharacterSheet(this.renderer.ctx, this.player);
}

_quickSave() {
    try {
        const saveData = {
            currentLevel: this.currentLevel,
            player: this.player.serialize(),
            worldMap: this.worldMap.serialize(),
            quests: this.quests.serialize(),
            log: this.log.messages.slice(-50), // Save last 50 messages
        };
        const serialized = JSON.stringify(saveData);
        localStorage.setItem('megadungeon_save', serialized);
        this.log.add('Game saved.', 'important');
    } catch (e) {
        this.log.add('Save failed!', 'danger');
        console.error('Save failed:', e);
    }
}

_quickLoad() {
    try {
        const raw = localStorage.getItem('megadungeon_save');
        if (!raw) {
            this.log.add('No save found.', 'system');
            return;
        }
        const data = JSON.parse(raw);
        this.worldMap = WorldMap.deserialize(data.worldMap);
        this.player = Player.deserialize(data.player);
        this.currentLevel = data.currentLevel;
        this.quests = QuestSystem.deserialize(data.quests, this.worldMap, this.rng);
        
        const map = this.worldMap.getLevel(this.currentLevel);
        map.addEntity(this.player);
        map.computeFOV(this.player.x, this.player.y, this._effectiveFovRadius());
        this._updateCamera(map);
        
        this.log.messages = data.log ?? [];
        this.log.add('Game loaded.', 'important');
        this.state = STATE.PLAYING;
        this.activeMenu = null;
        this._previousState = null;
    } catch (e) {
        this.log.add('Load failed!', 'danger');
        console.error('Load failed:', e);
    }
}
  
  _renderTown() {
    const ctx = this.renderer.ctx;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
    
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, w, h);
    
    // Draw a simple ASCII art town scene
    ctx.fillStyle = '#444444';
    const fontSize = Math.max(12, Math.floor(w / 60));
    ctx.font = `${fontSize}px monospace`;
    
    const townArt = [
        '          /\\       /\\          /\\      ',
        '         /  \\     /  \\        /  \\     ',
        '    ____/    \\___/    \\______/    \\___ ',
        '   |    |  []  |    |  []  |    |  [] |',
        '   |    | ____ |    | ____ |    | ____|',
        '   |____|/    \\|____|/    \\|____|/    |',
        '========================================',
        '     Town of Homestead                  ',
    ];
    
    const startY = h * 0.1;
    townArt.forEach((line, i) => {
        ctx.fillText(line, (w - ctx.measureText(line).width) / 2, startY + i * (fontSize + 4));
    });

    // Stat strip at bottom
    if (this.player) {
      const stripH = 36;
      ctx.fillStyle = '#111122';
      ctx.fillRect(0, h - stripH, w, stripH);
      ctx.strokeStyle = '#2E75B6';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, h - stripH, w, stripH);
      ctx.font = '14px monospace';
      ctx.fillStyle = '#66ff66';
      ctx.fillText(`HP: ${this.player.hp}/${this.player.hpMax}`, 12, h - stripH + 22);
      ctx.fillStyle = '#4488ff';
      ctx.fillText(`MP: ${this.player.mp}/${this.player.mpMax}`, 130, h - stripH + 22);
      ctx.fillStyle = '#ffcc44';
      ctx.fillText(`Gold: ${this.player.gold}`, 240, h - stripH + 22);
      ctx.fillStyle = '#cccccc';
      ctx.fillText(`${this.player.name}  Lv.${this.player.level}  ${this.player.class.name}`, 360, h - stripH + 22);
    }
}

  async _toggleMinimap() {
    this._minimapVisible = !this._minimapVisible;
    if (this._minimapVisible) {
      this.log.add('[M] Minimap — press M to close', 'system');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init().catch(console.error);
});
