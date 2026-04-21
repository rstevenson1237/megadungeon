// megadungeon/src/world/LevelGen.js
import { TileMap } from './TileMap.js';
import { pickTheme } from '../data/themeRegistry.js';
import { pickLayout } from './layouts/index.js';
import { RoomGen } from './RoomGen.js';
import { bus } from '../engine/EventBus.js';
import { FeaturePlacer } from './FeaturePlacer.js';

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
    FeaturePlacer.place(map, rooms, rng, theme);
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
