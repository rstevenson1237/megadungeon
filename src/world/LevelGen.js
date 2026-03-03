// megadungeon/src/world/LevelGen.js
import { TileMap } from './TileMap.js';
import { THEMES } from '../data/themes.js';
import { RNG } from '../engine/RNG.js';
import { RoomGen } from './RoomGen.js';

// Constants for map dimensions
const MAP_W = 78;
const MAP_H = 38;

// --- STUB HELPERS for LevelGen ---

// BSP (Binary Space Partitioning)
class BSP {
  static split(area, rng, options) {
    const root = { ...area, children: [], isLeaf: true };
    const partitions = BSP._splitNode(root, rng, options.minSize, options.iterations);
    return partitions;
  }

  static _splitNode(node, rng, minSize, depth) {
    if (depth <= 0 || (node.isLeaf && (node.w < minSize * 2 && node.h < minSize * 2))) {
        if (node.isLeaf) return [node];
        const leaves = [];
        node.children.forEach(child => leaves.push(...(BSP._splitNode(child, rng, minSize, 0))));
        return leaves;
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
    leaves.push(...BSP._splitNode(node.children[0], rng, minSize, depth - 1));
    leaves.push(...BSP._splitNode(node.children[1], rng, minSize, depth - 1));
    return leaves;
  }
}

// Room carving stub
function carveRoom(map, room, theme) {
  map.metadata.rooms = map.metadata.rooms || [];
  map.metadata.rooms.push(room);

  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
        if (map.inBounds(x, y)) {
            const tile = map.get(x,y);
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
    
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
        if (map.inBounds(x, ay)) {
            const tile = map.get(x, ay);
            tile.type = 'floor';
            tile.solid = false;
            tile.opaque = false;
            tile.glyph = theme.floorGlyphs[0]; 
            tile.fg = theme.corridorFg || theme.floorFg;
            tile.bg = theme.corridorBg || theme.floorBg;
        }
    }

    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
        if (map.inBounds(bx, y)) {
            const tile = map.get(bx, y);
            tile.type = 'floor';
            tile.solid = false;
            tile.opaque = false;
            tile.glyph = theme.floorGlyphs[0];
            tile.fg = theme.corridorFg || theme.floorFg;
            tile.bg = theme.corridorBg || theme.floorBg;
        }
    }
}

function carveZCorridor(map, roomA, roomB, theme) {
    const ax = roomA.x + Math.floor(roomA.w / 2);
    const ay = roomA.y + Math.floor(roomA.h / 2);
    const bx = roomB.x + Math.floor(roomB.w / 2);
    const by = roomB.y + Math.floor(roomB.h / 2);
    
    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
        if (map.inBounds(ax, y)) {
            const tile = map.get(ax, y);
            tile.type = 'floor';
            tile.solid = false;
            tile.opaque = false;
            tile.glyph = theme.floorGlyphs[0];
            tile.fg = theme.corridorFg || theme.floorFg;
            tile.bg = theme.corridorBg || theme.floorBg;
        }
    }

    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
        if (map.inBounds(x, by)) {
            const tile = map.get(x, by);
            tile.type = 'floor';
            tile.solid = false;
            tile.opaque = false;
            tile.glyph = theme.floorGlyphs[0];
            tile.fg = theme.corridorFg || theme.floorFg;
            tile.bg = theme.corridorBg || theme.floorBg;
        }
    }
}

// --- LevelGen Implementation ---
export class LevelGen {
  static generate(levelNumber, rng) {
    const theme   = this._pickTheme(levelNumber, rng);
    const map     = new TileMap(MAP_W, MAP_H);
    map.metadata.theme = theme;
    const rooms   = this._carveRooms(map, rng, theme);
    if(rooms.length > 1) {
        this._connectRooms(map, rooms, rng, theme);
    }
    this._placeStairs(map, rooms, rng, levelNumber);
    this._applyThemeDressing(map, rooms, rng, theme);
    this._populateRooms(map, rooms, rng, levelNumber, theme);
    return map;
  }

  static _carveRooms(map, rng, theme) {
    const rooms = [];
    const partitions = BSP.split(
      { x: 1, y: 1, w: MAP_W - 2, h: MAP_H - 2 },
      rng,
      { minSize: 6, maxSize: 15, iterations: 4 }
    );
    for (const p of partitions) {
      const roomW = rng.int(theme.minRoomW, Math.min(p.w - 2, theme.maxRoomW));
      const roomH = rng.int(theme.minRoomH, Math.min(p.h - 2, theme.maxRoomH));
      if (roomW <= 0 || roomH <=0) continue;

      const room = {
        x: p.x + rng.int(1, p.w - roomW -1),
        y: p.y + rng.int(1, p.h - roomH -1),
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
    if (rooms.length < 2) return;
    const centers = rooms.map(r => ({ x: r.x + (r.w>>1), y: r.y + (r.h>>1), room: r }));
    const mst     = primMST(centers);
    for (const [a, b] of mst) {
      if (rng.chance(0.5)) carveLCorridor(map, a.room, b.room, theme);
      else                  carveZCorridor(map, a.room, b.room, theme);
    }
    const extras = Math.floor(rooms.length * 0.2);
    for (let i = 0; i < extras; i++) {
      const [a, b] = [rng.pick(centers), rng.pick(centers)];
      if (a.room !== b.room) carveLCorridor(map, a.room, b.room, theme);
    }
  }

  static _placeStairs(map, rooms, rng, levelNumber) {
    if (levelNumber > 1 && rooms.length > 0) {
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

  static _applyThemeDressing(map, rooms, rng, theme) {
  }

  static _pickTheme(levelNumber, rng) {
    const bands = [
      { min: 1,  max: 5,  pool: ['dungeon_cellar', 'goblin_warren'] },
      { min: 6,  max: 20, pool: ['catacomb'] },
    ];
    const band = bands.find(b => levelNumber >= b.min && levelNumber <= b.max) ?? bands[0];
    const key  = rng.pick(band.pool);
    return { ...THEMES[key], key };
  }

  static _populateRooms(map, rooms, rng, levelNumber, theme) {
    const populator = new RoomGen(levelNumber, rng, theme);
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
