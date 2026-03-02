// megadungeon/src/world/LevelGen.js
import { TileMap } from './TileMap.js';
import { THEMES } from '../data/town.js'; // Note: THEMES is currently in town.js stub
import { RNG } from '../engine/RNG.js';

// Constants for map dimensions
const MAP_W = 80; // From CanvasRenderer COLS
const MAP_H = 40; // From CanvasRenderer ROWS

// --- STUB HELPERS for LevelGen ---

// BSP (Binary Space Partitioning) Stub
class BSP {
  static split(area, rng, options) {
    console.log(`Stub BSP: Splitting area (${area.x},${area.y},${area.w},${area.h})`);
    // For now, just return the initial area as a single "partition"
    // In a real implementation, this would recursively split the area
    return [area];
  }
}

// Room carving stub
function carveRoom(map, room, theme) {
  console.log(`Stub carveRoom: Carving room at (${room.x},${room.y},${room.w},${room.h})`);
  // For now, just mark the room in the map metadata
  map.metadata.rooms = map.metadata.rooms || [];
  map.metadata.rooms.push(room);
}

// Corridor carving stubs
function primMST(centers) {
  console.log(`Stub primMST: Connecting ${centers.length} centers.`);
  // For now, return a dummy connection
  if (centers.length > 1) {
    return [[centers[0], centers[1]]];
  }
  return [];
}

function carveLCorridor(map, a, b) {
  console.log(`Stub carveLCorridor: Connecting ${a.x},${a.y} to ${b.x},${b.y}`);
  // Add some metadata for verification
  map.metadata.corridors = map.metadata.corridors || [];
  map.metadata.corridors.push({ type: 'L', from: a, to: b });
}

function carveZCorridor(map, a, b) {
  console.log(`Stub carveZCorridor: Connecting ${a.x},${a.y} to ${b.x},${b.y}`);
  map.metadata.corridors = map.metadata.corridors || [];
  map.metadata.corridors.push({ type: 'Z', from: a, to: b });
}

// RoomGen Stub
class RoomGen {
  constructor(levelNumber, rng, theme) {
    console.log(`Stub RoomGen: Initialized for level ${levelNumber} with theme ${theme.name}`);
    this.level = levelNumber;
    this.rng = rng;
    this.theme = theme;
  }

  populate(map, room) {
    console.log(`Stub RoomGen: Populating room ${room.id}`);
    room.content = 'stub_content'; // Mark room as populated by stub
  }

  populateBossRoom(map, room) {
    console.log(`Stub RoomGen: Populating boss room ${room.id}`);
    room.content = 'stub_boss_content'; // Mark room as populated by stub
  }
}

// --- LevelGen Implementation ---
export class LevelGen {
  static generate(levelNumber, rng) {
    console.log(`LevelGen: Generating level ${levelNumber} with seed ${rng.seed}`);
    const theme   = this._pickTheme(levelNumber, rng);
    const map     = new TileMap(MAP_W, MAP_H);
    const rooms   = this._carveRooms(map, rng, theme);
    this._connectRooms(map, rooms, rng);
    this._placeStairs(map, rooms, rng, levelNumber);
    this._applyThemeDressing(map, rooms, rng, theme);
    this._populateRooms(map, rooms, rng, levelNumber, theme);
    return map;
  }

  static _carveRooms(map, rng, theme) {
    const rooms = [];
    // BSP needs to ensure room boundaries are within map bounds correctly
    const partitions = BSP.split(
      { x: 1, y: 1, w: MAP_W - 2, h: MAP_H - 2 }, // Adjusted to leave border
      rng,
      { minSize: 5, maxSize: 15, iterations: 1 } // Reduced iterations for stub performance
    );
    for (const p of partitions) {
      // Ensure room dimensions fit within partition and theme constraints
      const roomW = rng.int(theme.minRoomW, Math.min(p.w - 2, theme.maxRoomW));
      const roomH = rng.int(theme.minRoomH, Math.min(p.h - 2, theme.maxRoomH));
      const room = {
        x: p.x + rng.int(0, p.w - roomW),
        y: p.y + rng.int(0, p.h - roomH),
        w: roomW,
        h: roomH,
        type: 'normal',
        content: null,
        explored: false,
        id: rooms.length
      };
      carveRoom(map, room, theme);
      rooms.push(room);
    }
    return rooms;
  }

  static _connectRooms(map, rooms, rng) {
    if (rooms.length < 2) return; // Need at least two rooms to connect
    const centers = rooms.map(r => ({ x: r.x + (r.w>>1), y: r.y + (r.h>>1), room: r }));
    const mst     = primMST(centers);
    for (const [a, b] of mst) {
      if (rng.chance(0.5)) carveLCorridor(map, a.room, b.room); // Pass room objects for clarity
      else                  carveZCorridor(map, a.room, b.room);
    }
    // Extra loops (simplified for stub)
    const extras = Math.floor(rooms.length * 0.2);
    for (let i = 0; i < extras; i++) {
      const [a, b] = [rng.pick(centers), rng.pick(centers)];
      if (a.room !== b.room) carveLCorridor(map, a.room, b.room);
    }
  }

  static _placeStairs(map, rooms, rng, levelNumber) {
    console.log(`Stub LevelGen: Placing stairs for level ${levelNumber}`);
    // Assume first room is entry, place stairs down in a random other room
    if (rooms.length > 1) {
        const stairDownRoom = rng.pick(rooms.filter(r => r.type !== 'entry'));
        map.metadata.stairs = map.metadata.stairs || {};
        map.metadata.stairs.down = { x: stairDownRoom.x + (stairDownRoom.w>>1), y: stairDownRoom.y + (stairDownRoom.h>>1) };
    }
  }

  static _applyThemeDressing(map, rooms, rng, theme) {
    console.log(`Stub LevelGen: Applying theme dressing (${theme.name})`);
    // Placeholder for applying flavor tiles etc.
  }

  static _pickTheme(levelNumber, rng) {
    const bands = [
      { min: 1,  max: 5,  pool: ['dungeon_cellar'] }, // Simplified for stub
    ];
    const band = bands.find(b => levelNumber >= b.min && levelNumber <= b.max);
    const key  = rng.pick(band.pool);
    // THEMES is currently in data/town.js as a stub
    const theme = THEMES[key] || THEMES.default_theme;
    theme.name = key; // Ensure theme has a name for logging
    return theme;
  }

  static _populateRooms(map, rooms, rng, levelNumber, theme) {
    const populator = new RoomGen(levelNumber, rng, theme);
    // Assume first room is entry, last is farthest (often boss on boss floor)
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
