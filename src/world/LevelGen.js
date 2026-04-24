// megadungeon/src/world/LevelGen.js
import { TileMap } from './TileMap.js';
import { pickTheme } from '../data/themeRegistry.js';
import { pickLayout } from './layouts/index.js';
import { RoomGen } from './RoomGen.js';
import { bus } from '../engine/EventBus.js';
import { FeaturePlacer } from './FeaturePlacer.js';

// Named map sizes — layouts use map.w/map.h internally so all scale automatically.
const MAP_SIZES = {
  tiny:   { w: 40,  h: 20 },
  small:  { w: 56,  h: 28 },
  medium: { w: 78,  h: 38 },
  large:  { w: 104, h: 52 },
  huge:   { w: 130, h: 65 },
};

// --- LevelGen Implementation ---
export class LevelGen {
  static generate(levelNumber, rng) {
    const theme   = pickTheme(levelNumber, rng);       // themeRegistry
    const layout  = pickLayout(theme.key, rng);        // layouts/index
    const sizeKey = rng.pick(theme.mapSizes ?? ['medium']);
    const { w, h } = MAP_SIZES[sizeKey] ?? MAP_SIZES.medium;
    const map     = new TileMap(w, h);
    map.metadata.theme   = theme;
    map.metadata.layout  = layout.key;
    map.metadata.sizeKey = sizeKey;

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
    if (rooms.length === 0) return;

    const upRoom = rooms[0];
    const ux = upRoom.x + Math.floor(upRoom.w / 2);
    const uy = upRoom.y + Math.floor(upRoom.h / 2);
    this._stampStair(map, ux, uy, 'up');
    map.metadata.entry = { x: ux, y: uy };

    if (levelNumber >= 100) return;

    const eligible = rooms.slice(1).filter(r => {
      if (r.type === 'boss') return false;
      const cx = r.x + Math.floor(r.w / 2);
      const cy = r.y + Math.floor(r.h / 2);
      return Math.abs(cx - ux) + Math.abs(cy - uy) > 15;
    });

    const downRoom = eligible.length > 0 ? rng.pick(eligible) : rooms[rooms.length - 1];
    const dx = downRoom.x + Math.floor(downRoom.w / 2);
    const dy = downRoom.y + Math.floor(downRoom.h / 2);
    this._stampStair(map, dx, dy, 'down');
    map.metadata.stairDown = { x: dx, y: dy };
  }

  static _stampStair(map, x, y, direction) {
    if (!map.inBounds(x, y)) return;
    const t = map.get(x, y);
    if (direction === 'up') {
      t.type  = 'stair_up';
      t.glyph = 0x3C;
      t.fg    = '#ffaaaa';
    } else {
      t.type  = 'stair_down';
      t.glyph = 0x3E;
      t.fg    = '#aaffaa';
    }
    t.solid = false;
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
