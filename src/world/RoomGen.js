import { Monster } from '../entities/Monster.js';
import { Item } from '../entities/Item.js';
import { TRAPS } from '../data/traps.js';
import { PUZZLES } from '../data/puzzles.js';
import { MonsterGroups } from './MonsterGroups.js';
import { LORE } from '../data/lore.js';

/**
 * Populates a room with content based on level depth, theme, and room type.
 * Uses a weighted random system to determine content category, then
 * instantiates specific content within the room boundaries.
 * 
 * ROOM CONTENT CATEGORIES (one chosen per room):
 *   'empty'        — Purely atmospheric, maybe dressing
 *   'monsters'     — Monster group + possible treasure
 *   'treasure'     — Guarded or unguarded loot cache
 *   'trap'         — One or more traps, possibly treasure bait
 *   'puzzle'       — An environmental puzzle
 *   'lore'         — Inscription, library, shrine with story content
 *   'shop'         — Rare wandering merchant room (deep levels)
 *   'shrine'       — Altar: boon or curse
 *   'hazard'       — Environmental danger (lava, gas, collapsing floor)
 */
export class RoomGen {
  constructor(levelNumber, rng, theme, eventBus) {
    this.level = levelNumber;
    this.rng   = rng;
    this.theme = theme;
    this.bus = eventBus;
    this.difficulty = this._computeDifficulty(levelNumber);
  }

  populate(map, room) {
    const category = this._rollCategory(room);
    room.content = category;
    switch (category) {
      case 'empty':    this._dressRoom(map, room); break;
      case 'monsters': this._placeMonsterGroup(map, room); break;
      case 'treasure': this._placeTreasure(map, room); break;
      case 'trap':     this._placeTrap(map, room); break;
      case 'puzzle':   this._placePuzzle(map, room); break;
      case 'lore':     this._placeLore(map, room); break;
      case 'shrine':   this._placeShrine(map, room); break;
      case 'hazard':   this._placeHazard(map, room); break;
    }
  }

  _rollCategory(room) {
    // Weights shift with depth: more traps/hazards deeper, more lore/puzzles mid-range
    const weights = [
      { value: 'empty',    weight: 20 },
      { value: 'monsters', weight: 35 },
      { value: 'treasure', weight: 15 },
      { value: 'trap',     weight: 10 + this.difficulty * 2 },
      { value: 'puzzle',   weight: 8 },
      { value: 'lore',     weight: 7 },
      { value: 'shrine',   weight: 3 },
      { value: 'hazard',   weight: 2 + this.difficulty },
    ];
    return this.rng.weightedPick(weights);
  }

    _computeDifficulty(levelNumber) {
        return Math.floor(levelNumber / 5);
    }

    _randomFloorInRoom(map, room) {
        const floorTiles = [];
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                if (map.inBounds(x, y) && !map.get(x, y).solid) {
                    floorTiles.push({ x, y });
                }
            }
        }
        return this.rng.pick(floorTiles);
    }

  _placeMonsterGroup(map, room) {
    const groupTemplate = MonsterGroups.roll(this.level, this.theme, this.rng);
    for (const entry of groupTemplate.members) {
      const pos = this._randomFloorInRoom(map, room);
      if (!pos) {
        // Room has no floor tiles yet — skip (shouldn't happen after Phase A)
        continue;
      }
      // Don't place monster on top of another entity
      const occupied = map.getEntitiesAt(pos.x, pos.y).length > 0;
      if (!occupied) {
        const monster = Monster.create(entry.type, pos.x, pos.y, this.level, this.rng);
        map.addEntity(monster);
      }
    }
    if (this.rng.chance(groupTemplate.treasureChance)) {
      this._placeTreasure(map, room, 'small');
    }
  }

  _placeTreasure(map, room, size = 'medium') {
    // Determine what to place based on size tier
    const itemKey = this._rollTreasureItemKey(size);
    const isGold  = itemKey === null; // null means gold only, no item
    const goldAmount = isGold
      ? this._rollGoldAmount(size)
      : this.rng.int(1, 6) * this.level; // bonus gold alongside an item

    // Roll the placement mode
    const mode = this.rng.weightedPick([
      { value: 'open',             weight: 15 },
      { value: 'hidden_dressing',  weight: 40 },
      { value: 'trap_guarded',     weight: 30 },
      { value: 'concealed_wall',   weight: 15 },
    ]);

    const pos = this._randomFloorInRoom(map, room);
    if (!pos) return;

    switch (mode) {
      case 'open': {
        // Just drop it. Visible to anyone who walks past.
        this._spawnTreasureAt(map, pos.x, pos.y, itemKey, goldAmount);
        break;
      }

      case 'hidden_dressing': {
        // Find an existing dressing tile in the room, or create one.
        // The treasure is stored inside the dressing object, only found on Interact.
        let dressingTile = this._findDressingTileInRoom(map, room);
        if (!dressingTile) {
          // No existing dressing — place new barrel or bone_pile to hide it in
          const dressingType = this.rng.pick(['barrel', 'bone_pile']);
          const DRESSING_GLYPHS = {
            barrel:    { glyph: 0x6F, fg: '#885533' },
            bone_pile: { glyph: 0x2C, fg: '#ccccaa' },
          };
          const def = DRESSING_GLYPHS[dressingType];
          const tile = map.get(pos.x, pos.y);
          tile.glyph = def.glyph;
          tile.fg    = def.fg;
          tile.features.dressing = { type: dressingType, searched: false };
          dressingTile = { tile, x: pos.x, y: pos.y };
        }
        // Store the loot payload inside the dressing
        dressingTile.tile.features.dressing.hiddenGold = goldAmount;
        dressingTile.tile.features.dressing.hiddenItem = itemKey;
        break;
      }

      case 'trap_guarded': {
        // Place the treasure visibly, but put a trap on an adjacent floor tile.
        // The player can see the prize but risks the trap to grab it.
        this._spawnTreasureAt(map, pos.x, pos.y, itemKey, goldAmount);

        // Find an adjacent floor tile for the trap
        const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
        for (const [dx, dy] of dirs) {
          const trapTile = map.get(pos.x + dx, pos.y + dy);
          if (trapTile && !trapTile.solid && trapTile.type === 'floor' && !trapTile.features.trap) {
            const keys = Object.keys(TRAPS);
            if (keys.length > 0) {
              const trapKey = this.rng.pick(keys);
              trapTile.features.trap = { ...TRAPS[trapKey], triggered: false };
            }
            break;
          }
        }
        break;
      }

      case 'concealed_wall': {
        // Store treasure in a wall-adjacent tile's features as concealed loot.
        // Only revealed when player examines (X) an adjacent tile.
        // The tile looks like normal floor — no visual difference until examined.
        const tile = map.get(pos.x, pos.y);
        tile.features.concealedLoot = {
          gold: goldAmount,
          itemKey: itemKey,
          found: false,
        };
        break;
      }
    }
  }

  // Helper: Roll what treasure item to place based on room size tier
  _rollTreasureItemKey(size) {
    // 40% of the time: pure gold (no item, just gold amount)
    if (this.rng.chance(0.40)) return null;

    const bySize = {
      small: ['crude_trinket', 'vermin_trophy', 'war_token', 'tattered_satchel'],
      medium: ['silver_candlestick', 'ancient_coin_cache', 'bone_holy_symbol',
               'merchant_seal', 'crude_trinket', 'warrior_signet'],
      large: ['jeweled_brooch', 'golden_idol', 'funeral_mask', 'ancient_coin_cache',
              'enchanted_gem', 'cursed_idol', 'ancient_relic'],
    };
    const pool = bySize[size] ?? bySize.medium;
    return this.rng.pick(pool);
  }

  // Helper: Roll gold amount for a given size tier
  _rollGoldAmount(size) {
    const lv = this.level;
    switch (size) {
      case 'small':  return this.rng.int(1, 10) * Math.ceil(lv / 2);
      case 'medium': return this.rng.int(2, 20) * lv;
      case 'large':  return this.rng.int(5, 40) * lv;
      default:       return this.rng.int(2, 12) * lv;
    }
  }

  // Helper: Spawn a treasure item (and optional gold) as a map entity
  _spawnTreasureAt(map, x, y, itemKey, goldAmount) {
    if (itemKey) {
      try {
        const item = Item.create(itemKey);
        item.x = x;
        item.y = y;
        map.addEntity(item);
      } catch (e) { /* item key not implemented yet — skip */ }
    } else if (goldAmount > 0) {
      // Gold-only: use a gold_pile item entity with a custom goldAmount
      try {
        const gold = Item.create('gold_pile');
        gold.x = x;
        gold.y = y;
        gold.goldAmount = goldAmount; // overrides value field in pickup handler
        map.addEntity(gold);
      } catch (e) { /* skip */ }
    }
  }

  // Helper: Find a tile in the room that already has dressing on it
  _findDressingTileInRoom(map, room) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        const tile = map.get(x, y);
        if (tile?.features?.dressing && !tile.features.dressing.hiddenItem) {
          return { tile, x, y };
        }
      }
    }
    return null;
  }

  _placeTrap(map, room) {
      const pos = this._randomFloorInRoom(map, room);
      if (pos) {
          const trapKey = this.rng.pick(Object.keys(TRAPS));
          const trap = { ...TRAPS[trapKey] };
          map.get(pos.x, pos.y).features.trap = trap;
          this.bus.emit('log:message', { text: `You sense danger.` });
      }
  }

  _placePuzzle(map, room) {
      const pos = this._randomFloorInRoom(map, room);
      if (pos) {
          const puzzleKey = this.rng.pick(Object.keys(PUZZLES));
          const puzzle = { def: PUZZLES[puzzleKey], state: { ...PUZZLES[puzzleKey].initialState }, solved: false, location: { x: pos.x, y: pos.y, z: this.level } };
          map.get(pos.x, pos.y).features.puzzle = puzzle;
          this.bus.emit('log:message', { text: `You see something interesting.` });
      }
  }

  _placeLore(map, room) {
    const pos = this._randomFloorInRoom(map, room);
    if (pos) {
      const pool = LORE[this.theme.key] ?? LORE.generic;
      const entry = this.rng.pick(pool) ?? { glyph: 0x22, color: '#aaaaff', message: 'Strange markings cover the wall.' };
      map.get(pos.x, pos.y).features.lore = {
        glyph: entry.glyph,
        color: entry.color,
        message: entry.message,
      };
      this.bus.emit('log:message', { text: entry.message });
    }
  }

    _placeShrine(map, room) {
        const pos = this._randomFloorInRoom(map, room);
        if (pos) {
            map.get(pos.x, pos.y).features.shrine = {
                glyph: 0x5E, // '^'
                color: '#ffffff',
                message: 'You see a holy shrine.'
            };
            this.bus.emit('log:message', { text: 'You see a holy shrine.' });
        }
    }

    _placeHazard(map, room) {
        const pos = this._randomFloorInRoom(map, room);
        if (pos) {
            map.get(pos.x, pos.y).type = 'water';
            this.bus.emit('log:message', { text: 'You see a pool of water.' });
        }
    }

    _dressRoom(map, room) {
        this.bus.emit('log:message', { text: 'The room is empty.' });
    }
    
    populateBossRoom(map, room){
        const pos = this._randomFloorInRoom(map, room);
        if (pos) {
            const monster = Monster.create('dragon_young_red', pos.x, pos.y, this.level, this.rng);
            map.addEntity(monster);
        }
    }
}
