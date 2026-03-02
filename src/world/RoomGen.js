import { Monster } from '../entities/Monster.js';
import { Item } from '../entities/Item.js';
import { TRAPS } from '../data/traps.js';
import { PUZZLES } from '../data/puzzles.js';
import { bus } from '../engine/EventBus.js';

// Stub for MonsterGroups
const MonsterGroups = {
    roll: (level, theme, rng) => {
        return {
            members: [{ type: 'goblin' }],
            treasureChance: 0.5
        };
    }
};

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
  constructor(levelNumber, rng, theme) {
    this.level = levelNumber;
    this.rng   = rng;
    this.theme = theme;
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
      if (pos) {
        const monster = Monster.create(entry.type, pos.x, pos.y, this.level);
        map.addEntity(monster);
      }
    }
    // Roll for incidental treasure
    if (this.rng.chance(groupTemplate.treasureChance)) {
      this._placeTreasure(map, room, 'small');
    }
  }

  _placeTreasure(map, room, size = 'medium') {
      const pos = this._randomFloorInRoom(map, room);
      if (pos) {
          const item = Item.create('gold_pile', { amount: this.rng.int(1, 10) });
          map.addEntity(item);
          bus.emit('log:message', { text: `You see a pile of gold.` });
      }
  }

  _placeTrap(map, room) {
      const pos = this._randomFloorInRoom(map, room);
      if (pos) {
          const trapKey = this.rng.pick(Object.keys(TRAPS));
          const trap = { ...TRAPS[trapKey] };
          map.get(pos.x, pos.y).features.trap = trap;
          bus.emit('log:message', { text: `You sense danger.` });
      }
  }

  _placePuzzle(map, room) {
      const pos = this._randomFloorInRoom(map, room);
      if (pos) {
          const puzzleKey = this.rng.pick(Object.keys(PUZZLES));
          const puzzle = { ...PUZZLES[puzzleKey] };
          map.get(pos.x, pos.y).features.puzzle = puzzle;
          bus.emit('log:message', { text: `You see something interesting.` });
      }
  }

  _placeLore(map, room) {
        const pos = this._randomFloorInRoom(map, room);
        if(pos) {
            map.get(pos.x, pos.y).features.lore = {
                glyph: 0x3F, // '?'
                color: '#ffff00',
                message: 'You see a strange inscription on the wall.'
            };
            bus.emit('log:message', { text: 'You see a strange inscription on the wall.' });
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
            bus.emit('log:message', { text: 'You see a holy shrine.' });
        }
    }

    _placeHazard(map, room) {
        const pos = this._randomFloorInRoom(map, room);
        if (pos) {
            map.get(pos.x, pos.y).type = 'water';
            bus.emit('log:message', { text: 'You see a pool of water.' });
        }
    }

    _dressRoom(map, room) {
        bus.emit('log:message', { text: 'The room is empty.' });
    }
    
    populateBossRoom(map, room){
        const pos = this._randomFloorInRoom(map, room);
        if (pos) {
            const monster = Monster.create('dragon_young_red', pos.x, pos.y, this.level);
            map.addEntity(monster);
        }
    }
}
