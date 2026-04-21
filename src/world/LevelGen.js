// megadungeon/src/world/LevelGen.js
import { TileMap } from './TileMap.js';
import { pickTheme } from '../data/themeRegistry.js';
import { pickLayout } from './layouts/index.js';
import { RoomGen } from './RoomGen.js';
import { bus } from '../engine/EventBus.js';
import { Item } from '../entities/Item.js';

// Constants for map dimensions
const MAP_W = 78;
const MAP_H = 38;

// --- LevelGen Implementation ---
export class LevelGen {
  static generate(levelNumber, rng) {
    const theme  = pickTheme(levelNumber, rng);       // themeRegistry
    const layout = pickLayout(theme.key, rng);        // layouts/index
    const map    = new TileMap(MAP_W, MAP_H);
    map.metadata.theme  = theme;
    map.metadata.layout = layout.key;

    const rooms = layout.generate(map, rng, theme, levelNumber);

    if (rooms.length > 1) {
      // Connection is the responsibility of each layout internally.
      // BspRooms connects during generate(); other layouts may differ.
    }

    this._placeStairs(map, rooms, rng, levelNumber);
    this._applyFeatures(map, rooms, rng, theme);      // replaces _applyThemeDressing
    this._populateRooms(map, rooms, rng, levelNumber, theme);
    return map;
  }

  static _placeStairs(map, rooms, rng, levelNumber) {
    if (rooms.length > 0) {
      const upRoom = rooms[0];
      const ux = upRoom.x + Math.floor(upRoom.w / 2);
      const uy = upRoom.y + Math.floor(upRoom.h / 2);
      if (map.inBounds(ux, uy)) {
        const t = map.get(ux, uy);
        t.type  = 'stair_up';
        t.glyph = 0x3C; // '<'
        t.fg    = '#ffaaaa';
        t.solid = false;
      }
    }

    if (rooms.length > 1) {
      const downRoom = rooms[rooms.length - 1];
      const dx = downRoom.x + Math.floor(downRoom.w / 2);
      const dy = downRoom.y + Math.floor(downRoom.h / 2);
      if (map.inBounds(dx, dy)) {
        const t = map.get(dx, dy);
        t.type  = 'stair_down';
        t.glyph = 0x3E; // '>'
        t.fg    = '#aaffaa';
        t.solid = false;
        map.metadata.stairDown = { x: dx, y: dy };
      }
    }

    if (rooms.length > 0) {
      const r = rooms[0];
      map.metadata.entry = {
        x: r.x + Math.floor(r.w / 2),
        y: r.y + Math.floor(r.h / 2)
      };
    }
  }

  static _applyFeatures(map, rooms, rng, theme) {
    const FEATURE_GLYPHS = {
      torch:    { glyph: 0x21, fg: '#ffaa00' },  // '!'
      barrel:   { glyph: 0x6F, fg: '#885533' },  // 'o'
      rubble:   { glyph: 0x2C, fg: '#666666' },  // ','
      bone_pile:{ glyph: 0x2C, fg: '#ccccaa' },  // '%' is now ','
      stain:    { glyph: 0x7E, fg: '#882222' },  // '~'
    };
    for (const room of rooms) {
      const count = rng.int(1, 3);
      for (let i = 0; i < count; i++) {
        const feat = rng.pick(theme.dressingFeatures);
        const def  = FEATURE_GLYPHS[feat];
        if (!def) continue;
        // pick random non-occupied floor tile
        for (let attempt = 0; attempt < 8; attempt++) {
          const tx = room.x + rng.int(0, room.w - 1);
          const ty = room.y + rng.int(0, room.h - 1);
          const tile = map.get(tx, ty);
          if (!tile || tile.solid || tile.type !== 'floor' || map.getEntitiesAt(tx, ty).length > 0) continue;
          
          if (feat === 'torch') {
              const item = Item.create('torch');
              item.x = tx;
              item.y = ty;
              map.addEntity(item);
          } else {
              tile.glyph = def.glyph; tile.fg = def.fg;
              tile.features.dressing = feat;
          }
          break;
        }
      }
    }
  }

  static _populateRooms(map, rooms, rng, levelNumber, theme) {
    const populator = new RoomGen(levelNumber, rng, theme, bus);
    if(rooms.length === 0) return;
    rooms[0].type = 'entry';
    if (levelNumber % 5 === 0 && rooms.length > 1) {
      const bossRoom = rooms[rooms.length - 1];
      bossRoom.type  = 'boss';
      populator.populateBossRoom(map, bossRoom);
    }
    for (const room of rooms) {
      if (room.type === 'entry' || room.type === 'boss') continue;
      populator.populate(map, room);
    }
  }
}
