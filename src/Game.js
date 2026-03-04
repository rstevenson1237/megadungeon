// src/Game.js — restructure to this shape:

import { InputManager }  from './engine/InputManager.js';
import { GameLoop }      from './engine/GameLoop.js';
import { EventBus }      from './engine/EventBus.js';
import { RNG }           from './engine/RNG.js';
import { WorldMap }      from './world/WorldMap.js';
import { Player }        from './entities/Player.js';
import { Renderer, glyphToChar, buildCRTOverlay } from './ui/Renderer.js';
import { Menu }        from './ui/Menu.js';
import { MessageLog }    from './ui/HUD.js';
import { CombatSystem }  from './systems/CombatSystem.js';
import { MagicSystem } from './systems/MagicSystem.js';
import { PuzzleSystem } from './systems/PuzzleSystem.js';
import { TrapSystem } from './systems/TrapSystem.js';
import { StatusSystem } from './systems/StatusSystem.js';
import { QuestSystem } from './systems/QuestSystem.js';
import { SPELLS } from './data/spells.js';
import { TOWN_LOCATIONS } from './data/town.js';
import { rollDiceStr } from './engine/rules.js';

const PLAYER_FOV_RADIUS = 8;

// Game states
const STATE = {
  TITLE:       'title',
  CHAR_CREATE: 'char_create',
  PLAYING:     'playing',
  DEAD:        'dead',
  PUZZLE:      'puzzle',
  TOWN:        'town',
  MENU:        'menu',       // Generic menu overlay
};

class Game {
  constructor() {
    this.canvasEl  = document.getElementById('main-canvas');
    this.input     = new InputManager();
    this.loop      = new GameLoop(this.update.bind(this), this.render.bind(this));
    this.bus       = new EventBus();
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

    this._setupEventListeners();
    this._handleResize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        this.renderer.resize(w, h);
        
        // Resize CRT overlay to match
        const crtCanvas = document.getElementById('crt-canvas');
        if (crtCanvas) {
            crtCanvas.width = this.renderer.canvas.width;
            crtCanvas.height = this.renderer.canvas.height;
            const crtCtx = crtCanvas.getContext('2d');
            const crtOverlay = buildCRTOverlay(crtCanvas.width, crtCanvas.height);
            crtCtx.drawImage(crtOverlay, 0, 0);
        }
        
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

    this.bus.on('player:death', () => {
      this.log.add('You have died!', 'danger');
      this.state = STATE.DEAD;
    });

    this.bus.on('monster:death', ({ entity }) => {
      this.log.add(`${entity.name} is slain!`, 'combat');
      const map = this.worldMap.getLevel(this.currentLevel);
      map.removeEntity(entity);
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
  // For MVP, skip character creation and auto-create a Fighter.

  _startNewGame() {
    const seed = Date.now();
    this.rng.seed = seed;
    this.worldMap = new WorldMap(this.rng.seed);
    this.quests = new QuestSystem(this.worldMap, this.rng);
    
    // Auto-create a level 1 Fighter for MVP (bypassing char creation)
    const stats = { str: 16, dex: 12, con: 14, int: 9, wis: 11, cha: 10 };
    this.player = new Player('fighter', 'Adventurer', stats);
    
    this._enterLevel(1);
    this.state = STATE.PLAYING;
    this.log.add('You descend into the dungeon...', 'important');
  }

  _enterLevel(levelNum) {
    this.currentLevel = levelNum;
    this.player.depth = Math.max(this.player.depth, levelNum);
    
    const map = this.worldMap.getLevel(levelNum);
    
    // Place player at entry point
    const entry = map.metadata.entry ?? { x: 5, y: 5 };
    map.removeEntity(this.player); // In case re-entering
    this.player.x = entry.x;
    this.player.y = entry.y;
    map.addEntity(this.player);
    
    // Compute initial FOV
    map.computeFOV(this.player.x, this.player.y, PLAYER_FOV_RADIUS);
    this._updateCamera(map);
  }

  // ---------------------------------------------------------------
  // MAIN UPDATE — called every frame by GameLoop
  update(dt) {
    switch (this.state) {
      case STATE.TITLE:       this._updateTitle(); break;
      case STATE.PLAYING:     this._updatePlaying(); break;
      case STATE.MENU:        this._updateMenu(); break;
      case STATE.DEAD:        this._updateDead(); break;
      case STATE.PUZZLE:      this._updatePuzzle(); break;
    }
  }

  _updateTitle() {
    const action = this.input.consumeAction();
    if (action === 'confirm') this._startNewGame();
  }

  _updatePlaying() {
    const action = this.input.consumeAction();
    if (!action) return; // Turn-based: only advance on input

    const map = this.worldMap.getLevel(this.currentLevel);

    if(action === 'inventory') {
        this._openInventoryMenu();
        return;
    }

    if(action === 'examine') {
        this._handleExamine();
        return;
    }

    if (action === 'cast') {
    this._openCastMenu();
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

if (this._handleMovement(action, map)) {
      // Movement or attack consumed the turn — run monster AI
      this._runMonsterAI(map);
      map.computeFOV(this.player.x, this.player.y, PLAYER_FOV_RADIUS);
      this._updateCamera(map);
      this.bus.emit('turn:end', {});
      // Tick player statuses
      const expired = StatusSystem.tick(this.player);
      for (const key of expired) {
          this.log.add(`${key} has worn off.`, 'system');
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
      // Reset to title
      this.state  = STATE.TITLE;
      this.player = null;
      this.worldMap = null;
      this.log.messages = [];
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
    if (this.activeMenu.closed) {
        this.activeMenu = null;
        this.state = this._previousState ?? STATE.PLAYING;
    }
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
    
    // Check items on ground
    const items = entities.filter(e => e.type === 'item');
    for (const item of items) {
        this.log.add(`You see: ${item.name} - ${item.description ?? 'nothing special.'}`, 'system');
        found = true;
    }
    
    // Check tile features
    if (tile.features.puzzle) {
        this.activePuzzle = tile.features.puzzle;
        const puzzleState = this.puzzles.examine(tile.features.puzzle);
        this.log.add(`-- ${puzzleState.name} --`, 'important');
        this.log.add(puzzleState.description, 'puzzle');
        this.state = STATE.PUZZLE;
        found = true;
    }
    if (tile.features.trap) {
        // Only show if player has detected it (thief skill or high INT)
        this.log.add(`You notice: ${tile.features.trap.hint ?? 'Something seems off about this area.'}`, 'trap');
        found = true;
    }
    if (tile.features.lore) {
        this.log.add(tile.features.lore.message, 'lore');
        found = true;
    }
    if (tile.features.shrine) {
        this.log.add(tile.features.shrine.message, 'lore');
        found = true;
    }
    
    if (!found) {
        this.log.add('There is nothing of interest here.', 'system');
    }
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
    
    // After: map.moveEntity(this.player, nx, ny);
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
    const result = this.player.rollAttack(monster);
    if (result.hit) {
      monster.hp = Math.max(0, monster.hp - result.dmg);
      const msg = result.critical
        ? `CRITICAL HIT! You strike ${monster.name} for ${result.dmg} damage!`
        : `You hit ${monster.name} for ${result.dmg} damage.`;
      this.log.add(msg, 'combat');
      if (monster.hp <= 0) {
        const xpResult = this.player.gainXP(monster.def.xpBase + monster.def.xpPerHD * monster.def.hd);
        this.bus.emit('monster:death', { entity: monster });
        if (xpResult.leveled) {
          this.log.add(`You feel more powerful! Level ${this.player.level}!`, 'important');
        }
      }
    } else {
      this.log.add(`You miss ${monster.name}.`, 'combat');
    }
  }

  _monsterAttacksPlayer(monster) {
    const attack = monster.getPrimaryAttack();
    // Simple THAC0 roll: d20 vs player AC
    const roll = this.rng.int(1, 20);
    const hit  = roll >= (20 - this.player.ac);
    if (hit) {
      const dmg = Math.max(1, monster.rollDamage(attack));
      this.player.hp = Math.max(0, this.player.hp - dmg);
      this.log.add(`${monster.name} hits you for ${dmg} damage.`, 'danger');
      if (this.player.hp <= 0) {
        this.bus.emit('player:death', { cause: monster.name });
      }
    } else {
      this.log.add(`${monster.name} misses you.`, 'combat');
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
      this._monsterTurn(monster, map);
    }
  }

  _monsterTurn(monster, map) {
    const tile = map.get(monster.x, monster.y);
    
    // Only act if visible to player (in FOV) — prevents off-screen monster spam
    if (!tile?.visible) return;

    // Simple AI: move toward player, attack if adjacent
    const dx = this.player.x - monster.x;
    const dy = this.player.y - monster.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist === 1 || (Math.abs(dx) === 1 && Math.abs(dy) === 1)) {
      // Adjacent — attack
      this._monsterAttacksPlayer(monster);
      return;
    }

    // Move one step toward player (simple, non-pathfinding)
    // Normalize direction
    const stepX = dx === 0 ? 0 : (dx > 0 ? 1 : -1);
    const stepY = dy === 0 ? 0 : (dy > 0 ? 1 : -1);

    // Try primary direction, then fallbacks
    const candidates = [
      [stepX, stepY],
      [stepX, 0],
      [0, stepY],
    ];

    for (const [sx, sy] of candidates) {
      if(sx === 0 && sy === 0) continue;
      const nx = monster.x + sx;
      const ny = monster.y + sy;
      const occupied = map.getEntitiesAt(nx, ny).some(e => e.type !== 'item');
      if (map.isWalkable(nx, ny) && !occupied) {
        map.moveEntity(monster, nx, ny);
        break;
      }
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
      this._enterLevel(this.currentLevel - 1);
    } else if (this.currentLevel === 1 && tile?.type === 'stair_up') {
      this.log.add('You emerge into the safety of town.', 'important');
      const map = this.worldMap.getLevel(this.currentLevel);
      map.removeEntity(this.player);
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
      case STATE.TITLE:   this._renderTitle(); break;
      case STATE.PLAYING: this._renderPlaying(); break;
      case STATE.MENU:    this._renderMenu(); break;
      case STATE.TOWN:    this._renderTown(); break;
      case STATE.PUZZLE:  this._renderPlaying(); break; // For now, just show the game screen
      case STATE.DEAD:    this._renderDead(); break;
    }
  }

  _renderTitle() {
    const ctx = this.renderer.ctx;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
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
    const help1 = 'WASD / Arrow Keys to move   Bump enemies to attack';
    const help2 = '> descend   < ascend   I inventory   M map';
    ctx.fillText(help1, (w - ctx.measureText(help1).width) / 2, h * 0.6);
    ctx.fillText(help2, (w - ctx.measureText(help2).width) / 2, h * 0.6 + helpSize + 8);
}

  _renderPlaying() {
    if (!this.player || !this.worldMap) return;
    const map = this.worldMap.getLevel(this.currentLevel);
    this.renderer.render(map, this.player, this.log, this.camera.x, this.camera.y, map.metadata.theme);
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
    ctx.fillText(titleText, (w - titleW) / 2, h * 0.25);

    const subSize = Math.max(12, Math.floor(titleSize * 0.42));
    ctx.fillStyle = '#888888';
    ctx.font = `${subSize}px monospace`;
    const subText = `${this.player?.name ?? 'The adventurer'} reached depth ${this.player?.depth ?? 0}.`;
    const subW = ctx.measureText(subText).width;
    ctx.fillText(subText, (w - subW) / 2, h * 0.4);
    
    ctx.fillStyle = '#ffcc44';
    const startText = 'Press ENTER or ESCAPE to return to title';
    const startW = ctx.measureText(startText).width;
    ctx.fillText(startText, (w - startW) / 2, h * 0.55);
  }

  _renderMenu() {
    // First render the underlying game state
    if (this._previousState === STATE.PLAYING) this._renderPlaying();
    else if (this._previousState === STATE.TOWN) this._renderTown();
    
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
    this._previousState = this.state;
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
}

_enterTownLocation(location) {
    this.townLocation = location;
    
    switch (location.key) {
        case 'inn':           this._openInnMenu(location); break;
        case 'general_store': this._openShopMenu(location); break;
        case 'weapon_smith':  this._openShopMenu(location); break;
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
    const items = [
        { label: `Rest for the night (${restCost} gold)`, color: '#66ff66',
          enabled: this.player.gold >= restCost, data: 'rest' },
        { label: 'Listen for rumors', color: '#ccccaa', data: 'rumors' },
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
                case 'rumors':
                    this.log.add("The barkeep says: 'I heard there's treasure on level 5!'", 'lore');
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
    const items = [
        { label: `Cure Disease (${costs.cure_disease}g)`, color: '#66ff66',
          enabled: this.player.gold >= costs.cure_disease, data: 'cure_disease' },
        { label: `Remove Curse (${costs.remove_curse}g)`, color: '#66ff66',
          enabled: this.player.gold >= costs.remove_curse, data: 'remove_curse' },
        { label: `Identify Item (${costs.identify}g)`, color: '#8888ff',
          enabled: this.player.gold >= costs.identify, data: 'identify' },
        { label: 'Back to town', color: '#888888', data: 'back' },
    ];
    
    const menu = new Menu(location.name, items, {
        onSelect: (selected) => {
            const cost = costs[selected.data];
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
                    // Unequip all cursed items
                    for (const [slot, item] of Object.entries(this.player.equipped)) {
                        if (item?.cursed) {
                            this.player.equipped[slot] = null;
                            this.log.add(`The ${item.name} falls away, its dark power broken.`, 'magic');
                        }
                    }
                    this._openTempleMenu(location);
                    break;
                case 'identify':
                    this.log.add('The priest examines your belongings. (Not yet fully implemented)', 'system');
                    this._openTempleMenu(location);
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

_openGuildBoardMenu(location) {
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
    
    items.push({ label: 'Back to town', color: '#888888', data: null });
    
    const menu = new Menu("Adventurer's Guild Board", items, {
        onSelect: (selected) => {
            if (!selected.data) {
                this.activeMenu.closed = true;
                this._openTownOverview();
                return;
            }
            this.quests.active.push(selected.data);
            this.log.add(`Quest accepted: ${selected.data.title}`, 'important');
            this._openGuildBoardMenu(location); // Refresh
        },
        onCancel: () => { this._openTownOverview(); }
    });
    this._previousState = STATE.TOWN;
    this.state = STATE.MENU;
    this.activeMenu = menu;
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
}

  async _toggleMinimap() {
    let mc = document.getElementById('minimap-canvas');
    if (!mc) {
        mc = document.createElement('canvas');
        mc.id = 'minimap-canvas';
        mc.style.position = 'absolute';
        mc.style.top = '50%';
        mc.style.left = '50%';
        mc.style.transform = 'translate(-50%, -50%)';
        mc.style.border = '2px solid #555';
        mc.style.background = 'rgba(0,0,0,0.8)';
        document.getElementById('game-wrapper').appendChild(mc);
    }
    
    if (mc.style.display === 'none' || mc.style.display === '') {
      // Render and show minimap
      const { Minimap } = await import('./ui/Minimap.js'); // lazy import
      const map = this.worldMap.getLevel(this.currentLevel);
      const mm = new Minimap(map, mc);
      mm.render(this.player.x, this.player.y);
      mc.style.display = 'block';
    } else {
      mc.style.display = 'none';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init().catch(console.error);
});
