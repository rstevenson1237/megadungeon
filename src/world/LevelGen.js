// megadungeon/src/world/LevelGen.js
import { TileMap } from './TileMap.js';
import { THEMES } from '../data/themes.js';
import { RNG } from '../engine/RNG.js';

// Constants for map dimensions
const MAP_W = 80; // From CanvasRenderer COLS
const MAP_H = 40; // From CanvasRenderer ROWS

// --- STUB HELPERS for LevelGen ---

// BSP (Binary Space Partitioning)
class BSP {
  /**
   * @param { {x,y,w,h} } area The container to be partitioned.
   * @param {RNG} rng The random number generator.
   * @param { {minSize, maxSize, iterations} } options
   * @returns { {x,y,w,h}[] } An array of leaf partitions.
   */
  static split(area, rng, options) {
    const root = { ...area, children: [], isLeaf: true };
    const partitions = this._splitNode(root, rng, options.minSize, options.iterations);
    return partitions;
  }

  static _splitNode(node, rng, minSize, depth) {
    if (depth <= 0 || node.isLeaf && (node.w < minSize * 2 && node.h < minSize * 2)) {
      return [node];
    }

    // Decide split direction
    let splitHorizontal = rng.chance(0.5);
    if (node.w > node.h && node.w / node.h >= 1.25) splitHorizontal = false;
    else if (node.h > node.w && node.h / node.w >= 1.25) splitHorizontal = true;

    const max = (splitHorizontal ? node.h : node.w) - minSize;
    if (max < minSize) {
      return [node]; // Cannot split further
    }

    const splitPoint = rng.int(minSize, max);

    node.isLeaf = false;
    if (splitHorizontal) {
      node.children = [
        { x: node.x, y: node.y, w: node.w, h: splitPoint, children: [], isLeaf: true },
        { x: node.x, y: node.y + splitPoint, w: node.w, h: node.h - splitPoint, children: [], isLeaf: true }
      ];
    } else { // Vertical split
      node.children = [
        { x: node.x, y: node.y, w: splitPoint, h: node.h, children: [], isLeaf: true },
        { x: node.x + splitPoint, y: node.y, w: node.w - splitPoint, h: node.h, children: [], isLeaf: true }
      ];
    }

    const leaves = [];
    leaves.push(...this._splitNode(node.children[0], rng, minSize, depth - 1));
    leaves.push(...this._splitNode(node.children[1], rng, minSize, depth - 1));
    return leaves;
  }
}

// Room carving stub
function carveRoom(map, room, theme) {
  // Store room in map metadata
  map.metadata.rooms = map.metadata.rooms || [];
  map.metadata.rooms.push(room);

  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      if (map.inBounds(x, y)) {
        const tile = map.get(x, y);
        tile.type = 'floor';
        tile.solid = false;
        tile.opaque = false;
        tile.glyph = theme.floorGlyphs[0];
        tile.fg = theme.floorFg;
        tile.bg = theme.floorBg;
        tile.roomId = room.id;
      }
    }
  }
}

// Corridor carving stubs
function primMST(centers) {
  if (centers.length < 2) return [];

  const mstEdges = [];
  const inTree = new Set([centers[0]]);
  const notInTree = new Set(centers.slice(1));

  while (notInTree.size > 0) {
    let minEdge = { from: null, to: null, dist: Infinity };

    for (const outNode of notInTree) {
      for (const inNode of inTree) {
        const dist = Math.hypot(outNode.x - inNode.x, outNode.y - inNode.y);
        if (dist < minEdge.dist) {
          minEdge = { from: inNode, to: outNode, dist: dist };
        }
      }
    }

    if (minEdge.to) {
      mstEdges.push([minEdge.from, minEdge.to]);
      inTree.add(minEdge.to);
      notInTree.delete(minEdge.to);
    } else {
      // This should not happen in a connected graph of room centers
      break;
    }
  }

  return mstEdges;
}

function carveLCorridor(map, roomA, roomB, theme) {
  const ax = roomA.x + Math.floor(roomA.w / 2);
  const ay = roomA.y + Math.floor(roomA.h / 2);
  const bx = roomB.x + Math.floor(roomB.w / 2);
  const by = roomB.y + Math.floor(roomB.h / 2);

  // Horizontal segment
  for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
    if (map.inBounds(x, ay)) {
      const tile = map.get(x, ay);
      tile.type = 'floor';
      tile.solid = false;
      tile.opaque = false;
      tile.glyph = theme.floorGlyphs[0];
      tile.fg = theme.floorFg;
      tile.bg = theme.floorBg;
    }
  }

  // Vertical segment
  for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
    if (map.inBounds(bx, y)) {
      const tile = map.get(bx, y);
      tile.type = 'floor';
      tile.solid = false;
      tile.opaque = false;
      tile.glyph = theme.floorGlyphs[0];
      tile.fg = theme.floorFg;
      tile.bg = theme.floorBg;
    }
  }
}

function carveZCorridor(map, roomA, roomB, theme) {
  const ax = roomA.x + Math.floor(roomA.w / 2);
  const ay = roomA.y + Math.floor(roomA.h / 2);
  const bx = roomB.x + Math.floor(roomB.w / 2);
  const by = roomB.y + Math.floor(roomB.h / 2);

  // Vertical segment
  for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
    if (map.inBounds(ax, y)) {
      const tile = map.get(ax, y);
      tile.type = 'floor';
      tile.solid = false;
      tile.opaque = false;
      tile.glyph = theme.floorGlyphs[0];
      tile.fg = theme.floorFg;
      tile.bg = theme.floorBg;
    }
  }

  // Horizontal segment
  for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
    if (map.inBounds(x, by)) {
      const tile = map.get(x, by);
      tile.type = 'floor';
      tile.solid = false;
      tile.opaque = false;
      tile.glyph = theme.floorGlyphs[0];
      tile.fg = theme.floorFg;
      tile.bg = theme.floorBg;
    }
  }
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
    this._connectRooms(map, rooms, rng, theme);
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

  static _connectRooms(map, rooms, rng, theme) {
    if (rooms.length < 2) return; // Need at least two rooms to connect
    const centers = rooms.map(r => ({ x: r.x + (r.w>>1), y: r.y + (r.h>>1), room: r }));
    const mst     = primMST(centers);
    for (const [a, b] of mst) {
      if (rng.chance(0.5)) carveLCorridor(map, a.room, b.room, theme); // Pass room objects for clarity
      else                  carveZCorridor(map, a.room, b.room, theme);
    }
    // Extra loops (simplified for stub)
    const extras = Math.floor(rooms.length * 0.2);
    for (let i = 0; i < extras; i++) {
      const [a, b] = [rng.pick(centers), rng.pick(centers)];
      if (a.room !== b.room) carveLCorridor(map, a.room, b.room, theme);
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
      { min: 1,  max: 5,  pool: ['dungeon_cellar', 'goblin_warren'] },
      { min: 6,  max: 20, pool: ['catacomb'] }, // Expand as more themes are added
    ];
    const band = bands.find(b => levelNumber >= b.min && levelNumber <= b.max) ?? bands[0];
    const key  = rng.pick(band.pool);
    return { ...THEMES[key], key }; // spread to avoid mutating the source object
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
