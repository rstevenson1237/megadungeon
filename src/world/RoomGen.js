import { Monster } from '../entities/Monster.js';
import { Item } from '../entities/Item.js';
import { TRAPS } from '../data/traps.js';
import { PUZZLES } from '../data/puzzles.js';
import { MonsterGroups } from './MonsterGroups.js';
import { LORE } from '../data/lore.js';
import { getBand } from '../data/difficultyBands.js';

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
    this.band = getBand(levelNumber);
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
    const weights = [
      { value: 'empty',    weight: 20 },
      { value: 'monsters', weight: 35 },
      { value: 'treasure', weight: 15 },
      { value: 'trap',     weight: 10 + this.band.trapWeight },
      { value: 'puzzle',   weight: this.band.puzzleWeight },
      { value: 'lore',     weight: 7 },
      { value: 'shrine',   weight: 3 },
      { value: 'hazard',   weight: 2 + Math.floor(this.band.trapWeight / 2) },
    ];
    if (this.band.specialRooms.includes('cursed_room')) {
      weights.push({ value: 'cursed', weight: 5 });
    }
    if (this.band.specialRooms.includes('void_zone')) {
      weights.push({ value: 'void_zone', weight: 4 });
    }
    return this.rng.weightedPick(weights);
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
    const pos = this._randomFloorInRoom(map, room);
    if (!pos) return;
    try {
      const item = Item.create('gold_pile');
      const base = size === 'small' ? 10 : size === 'medium' ? 50 : 200;
      item.quantity = this.rng.int(base, base * 2);
      item.x = pos.x;
      item.y = pos.y;
      map.addEntity(item);
    } catch (e) {
      // Silently skip if item creation fails during stub period
    }
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
        const features = this.theme.dressingFeatures ?? ['rubble', 'stain'];
        const count = this.rng.int(1, Math.min(3, Math.floor(room.w * room.h / 6) + 1));
        const placed = new Set();

        for (let i = 0; i < count; i++) {
            const pos = this._randomFloorInRoom(map, room);
            if (!pos) continue;
            const key = `${pos.x},${pos.y}`;
            if (placed.has(key)) continue;
            placed.add(key);

            const featureKey = this.rng.pick(features);
            const tile = map.get(pos.x, pos.y);
            if (tile.features.dungeon || tile.features.puzzle || tile.features.lore) continue;

            const DRESSING = {
                torch:   { glyph: 0x0F, fg: '#ffaa22', label: 'wall torch',  passable: true  },
                barrel:  { glyph: 0xB2, fg: '#885533', label: 'old barrel',  passable: false },
                rubble:  { glyph: 0xB0, fg: '#666666', label: 'rubble',      passable: true  },
                stain:   { glyph: 0xFA, fg: '#663333', label: 'dark stain',  passable: true  },
                crack:   { glyph: 0x2F, fg: '#555555', label: 'floor crack', passable: true  },
                pillar:  { glyph: 0x4F, fg: '#888888', label: 'stone pillar',passable: false },
                bones:   { glyph: 0x2B, fg: '#ccbbaa', label: 'scattered bones', passable: true },
                web:     { glyph: 0x2A, fg: '#888888', label: 'cobwebs',     passable: true  },
                mushroom:{ glyph: 0x2A, fg: '#88dd88', label: 'mushroom',    passable: true  },
                pool:    { glyph: 0x7E, fg: '#446688', label: 'shallow pool',passable: true  },
                altar:   { glyph: 0x54, fg: '#aaaaff', label: 'old altar',   passable: false },
                statue:  { glyph: 0x01, fg: '#999999', label: 'stone statue',passable: false },
            };

            const def = DRESSING[featureKey];
            if (!def) continue;

            tile.features.dungeon = {
                key: featureKey,
                name: def.label,
                tier: 'dressing',
                glyph: def.glyph,
                fg: def.fg,
            };

            if (!def.passable) {
                tile.solid = true;
                tile.opaque = featureKey === 'pillar' || featureKey === 'statue';
            }
        }

        // Occasionally emit an ambient message from the theme
        const ambient = this.theme.ambientMessages;
        if (ambient?.length && this.rng.chance(0.3)) {
            this.bus.emit('log:message', { text: this.rng.pick(ambient), category: 'lore' });
        }
    }
    
    populateBossRoom(map, room){
        const pos = this._randomFloorInRoom(map, room);
        if (pos) {
            const monster = Monster.create('dragon_young_red', pos.x, pos.y, this.level, this.rng);
            map.addEntity(monster);
        }
    }
}
