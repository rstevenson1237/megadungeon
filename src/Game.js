// src/Game.js — restructure to this shape:

import { InputManager }  from './engine/InputManager.js';
import { GameLoop }      from './engine/GameLoop.js';
import { EventBus, bus }      from './engine/EventBus.js';
import { RNG }           from './engine/RNG.js';
import { WorldMap }      from './world/WorldMap.js';
import { Pathfinder }    from './world/Pathfinder.js';
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

  _enterLevel(levelNum, entryMethod = 'from_above') {
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
    map.computeFOV(this.player.x, this.player.y, PLAYER_FOV_RADIUS);
    this._updateCamera(map);
  }

  // ---------------------------------------------------------------
  // MAIN UPDATE — called every frame by GameLoop
  update(dt) {
    switch (this.state) {
      case STATE.TITLE:       this._updateTitle(); break;
      case STATE.PLAYING:     this._updatePlaying(); break;
      case STATE.TOWN:        this._updateTown(); break;
      case STATE.MENU:        this._updateMenu(); break;
      case STATE.DEAD:        this._updateDead(); break;
      case STATE.PUZZLE:      this._updatePuzzle(); break;
    }
  }

  _updateTown() {
    if (!this.activeMenu) {
      this._openTownOverview();
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

if (action === 'use') {
    this._openUseMenu();
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
    
    if (tile.features.dressing) {
        const descriptions = {
            'barrel': 'An old wooden barrel. It is empty.',
            'rubble': 'A pile of rocks and debris from a past collapse.',
            'bone_pile': 'A scattering of old, gnawed bones.',
            'stain': 'A dark, sticky stain on the floor. Best not to think about it.'
        };
        const desc = descriptions[tile.features.dressing];
        if (desc) {
            this.log.add(desc, 'system');
            found = true;
        }
    }
    
    if (!found) {
        this.log.add('There is nothing of interest here.', 'system');
    }
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

    if (StatusSystem.has(monster, 'sleep') || StatusSystem.has(monster, 'paralysis')) {
      // Still tick duration — handled by end-of-turn StatusSystem.tick()
      return; // Cannot act
    }

    // Simple AI: move toward player, attack if adjacent
    const dx = this.player.x - monster.x;
    const dy = this.player.y - monster.y;
    const dist = Math.abs(dx) + Math.abs(dy);

    if (dist === 1 || (Math.abs(dx) === 1 && Math.abs(dy) === 1)) {
      // Adjacent — attack
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
    const help2 = '  > descend   < ascend   I inventory   M map  ';
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
                     this.log.add('Selling scrolls is not yet implemented.', 'system');
                    this._openArcaneShopMenu(location); // Refresh
                    break;
                case 'identify_magic':
                    this.log.add('Identifying magic is not yet implemented.', 'system');
                    this._openArcaneShopMenu(location); // Refresh
                    break;
                case 'scribe_scroll':
                    this.log.add('Scribing scrolls is not yet implemented.', 'system');
                    this._openArcaneShopMenu(location); // Refresh
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

_openInventoryMenu() {
    const items = this.player.inventory.map((item, i) => ({
        label: `${item.name}${this._equippedTag(item)}`,
        color: item.cursed ? '#ff4444' : (item.color ?? '#cccccc'),
        enabled: true,
        data: item,
    }));
    
    if (items.length === 0) {
        this.log.add('Your inventory is empty.', 'system');
        return;
    }
    
    const menu = new Menu('Inventory', items, {
        onSelect: (selected) => {
            this._openItemActionMenu(selected.data);
        },
        onCancel: () => {}
    });
    this._openMenu(menu);
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
    
    if (item.category === 'weapon' || item.category === 'armor') {
        const isEquipped = Object.values(this.player.equipped).includes(item);
        if (isEquipped) {
            actions.push({ label: 'Unequip', key: 'unequip', color: '#ffcc44', data: 'unequip' });
        } else {
            actions.push({ label: 'Equip', key: 'equip', color: '#44ff44', data: 'equip' });
        }
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

_executeItemAction(item, action) {
    switch (action) {
        case 'equip': {
            const slot = item.armor?.slot ?? (item.category === 'weapon' ? 'weapon' : null);
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
            // Apply status — requires StatusSystem to be implemented
            this.log.add(`You drink the ${item.name}. You feel faster!`, 'magic');
        }
        this.player.removeFromInventory(item);
    } else if (item.scroll) {
        this.log.add(`You read the ${item.name}. The words vanish from the page.`, 'magic');
        // Cast the scroll's spell at the scroll's caster level
        // For MVP, auto-target nearest visible monster
        this.player.removeFromInventory(item);
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

_openCastMenu() {
    if (this.player.spellbook.length === 0) {
        this.log.add('You know no spells.', 'system');
        return;
    }
    const spells = this.player.spellbook.map(key => {
        const spell = SPELLS[key];
        const canCast = this.player.mp >= (spell?.mpCost ?? 999);
        return {
            label: `${spell?.name ?? key} (${spell?.mpCost ?? '?'} MP)`,
            color: canCast ? '#aa66ff' : '#555555',
            enabled: canCast,
            data: key,
        };
    });
    const menu = new Menu(`Spellbook (MP: ${this.player.mp}/${this.player.mpMax})`, spells, {
        onSelect: (selected) => {
            // For MVP: auto-target nearest visible monster, or self for heals
            const spell = SPELLS[selected.data];
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
            const result = this.magic.cast(this.player, selected.data, targetPos);
            if (result.success) {
                this.log.add(`You cast ${spell.name}!`, 'magic');
            } else {
                this.log.add(result.message, 'system');
            }
            this.activeMenu.closed = true;
        },
        onCancel: () => {}
    });
    this._openMenu(menu);
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
        map.computeFOV(this.player.x, this.player.y, PLAYER_FOV_RADIUS);
        this._updateCamera(map);
        
        this.log.messages = data.log ?? [];
        this.log.add('Game loaded.', 'important');
        this.state = STATE.PLAYING;
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
}

  async _toggleMinimap() {
    // Minimap is currently disabled to improve visibility.
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.init().catch(console.error);
});
