// src/world/layouts/BspRooms.js
// Classic binary-space-partitioned rectangular rooms connected by L/Z corridors.

// --- BSP helpers (moved verbatim from LevelGen) ---

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

    let splitHorizontal = rng.chance(0.5);
    if (node.w > node.h && node.w / node.h >= 1.25) splitHorizontal = false;
    else if (node.h > node.w && node.h / node.w >= 1.25) splitHorizontal = true;

    const max = (splitHorizontal ? node.h : node.w) - minSize;
    if (max < minSize) return [node];

    const splitPoint = rng.int(minSize, max);

    node.isLeaf = false;
    if (splitHorizontal) {
      node.children = [
        { x: node.x, y: node.y,              w: node.w, h: splitPoint,          children: [], isLeaf: true },
        { x: node.x, y: node.y + splitPoint, w: node.w, h: node.h - splitPoint, children: [], isLeaf: true },
      ];
    } else {
      node.children = [
        { x: node.x,              y: node.y, w: splitPoint,          h: node.h, children: [], isLeaf: true },
        { x: node.x + splitPoint, y: node.y, w: node.w - splitPoint, h: node.h, children: [], isLeaf: true },
      ];
    }

    const leaves = [];
    leaves.push(...BSP._splitNode(node.children[0], rng, minSize, depth - 1));
    leaves.push(...BSP._splitNode(node.children[1], rng, minSize, depth - 1));
    return leaves;
  }
}

function carveRoom(map, room, theme, rng) {
  map.metadata.rooms = map.metadata.rooms || [];
  map.metadata.rooms.push(room);

  for (let y = room.y; y < room.y + room.h; y++) {
    for (let x = room.x; x < room.x + room.w; x++) {
      if (map.inBounds(x, y)) {
        const tile = map.get(x, y);
        tile.type   = 'floor';
        tile.solid  = false;
        tile.opaque = false;
        tile.glyph  = rng.pick(theme.floorGlyphs);
        tile.fg     = theme.floorFg;
        tile.bg     = theme.floorBg;
        tile.roomId = room.id;
      }
    }
  }
}

function primMST(centers) {
  if (centers.length < 2) return [];

  const mstEdges  = [];
  const inTree    = new Set([centers[0]]);
  const notInTree = new Set(centers.slice(1));

  while (notInTree.size > 0) {
    let minEdge = { from: null, to: null, dist: Infinity };

    for (const outNode of notInTree) {
      for (const inNode of inTree) {
        const dist = Math.hypot(outNode.x - inNode.x, outNode.y - inNode.y);
        if (dist < minEdge.dist) minEdge = { from: inNode, to: outNode, dist };
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

function carveLCorridor(map, roomA, roomB, theme, rng) {
  const ax = roomA.x + Math.floor(roomA.w / 2);
  const ay = roomA.y + Math.floor(roomA.h / 2);
  const bx = roomB.x + Math.floor(roomB.w / 2);
  const by = roomB.y + Math.floor(roomB.h / 2);

  for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
    if (map.inBounds(x, ay)) {
      const tile   = map.get(x, ay);
      tile.type    = 'floor';
      tile.solid   = false;
      tile.opaque  = false;
      tile.glyph   = rng.pick(theme.floorGlyphs);
      tile.fg      = theme.corridorFg || theme.floorFg;
      tile.bg      = theme.corridorBg || theme.floorBg;
    }
  }
  for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
    if (map.inBounds(bx, y)) {
      const tile   = map.get(bx, y);
      tile.type    = 'floor';
      tile.solid   = false;
      tile.opaque  = false;
      tile.glyph   = rng.pick(theme.floorGlyphs);
      tile.fg      = theme.corridorFg || theme.floorFg;
      tile.bg      = theme.corridorBg || theme.floorBg;
    }
  }
}

function carveZCorridor(map, roomA, roomB, theme, rng) {
  const ax = roomA.x + Math.floor(roomA.w / 2);
  const ay = roomA.y + Math.floor(roomA.h / 2);
  const bx = roomB.x + Math.floor(roomB.w / 2);
  const by = roomB.y + Math.floor(roomB.h / 2);

  for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) {
    if (map.inBounds(ax, y)) {
      const tile   = map.get(ax, y);
      tile.type    = 'floor';
      tile.solid   = false;
      tile.opaque  = false;
      tile.glyph   = rng.pick(theme.floorGlyphs);
      tile.fg      = theme.corridorFg || theme.floorFg;
      tile.bg      = theme.corridorBg || theme.floorBg;
    }
  }
  for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) {
    if (map.inBounds(x, by)) {
      const tile   = map.get(x, by);
      tile.type    = 'floor';
      tile.solid   = false;
      tile.opaque  = false;
      tile.glyph   = rng.pick(theme.floorGlyphs);
      tile.fg      = theme.corridorFg || theme.floorFg;
      tile.bg      = theme.corridorBg || theme.floorBg;
    }
  }
}

// --- Layout entry point ---

/**
 * @param {TileMap} map
 * @param {RNG} rng
 * @param {Object} theme
 * @param {number} levelNumber
 * @returns {Array<Room>}
 */
export function generate(map, rng, theme, levelNumber) {
  const rooms = [];
  const partitions = BSP.split(
    { x: 1, y: 1, w: map.w - 2, h: map.h - 2 },
    rng,
    { minSize: 6, maxSize: 15, iterations: 4 }
  );

  for (const p of partitions) {
    const roomW = rng.int(theme.minRoomW, Math.min(p.w - 2, theme.maxRoomW));
    const roomH = rng.int(theme.minRoomH, Math.min(p.h - 2, theme.maxRoomH));
    if (roomW <= 0 || roomH <= 0) continue;

    const room = {
      x: p.x + rng.int(1, p.w - roomW - 1),
      y: p.y + rng.int(1, p.h - roomH - 1),
      w: roomW,
      h: roomH,
      type: 'normal',
      content: null,
      explored: false,
      id: rooms.length,
    };
    carveRoom(map, room, theme, rng);
    rooms.push(room);
  }

  if (rooms.length >= 2) {
    const centers = rooms.map(r => ({ x: r.x + (r.w >> 1), y: r.y + (r.h >> 1), room: r }));
    const mst = primMST(centers);
    for (const [a, b] of mst) {
      if (rng.chance(0.5)) carveLCorridor(map, a.room, b.room, theme, rng);
      else                  carveZCorridor(map, a.room, b.room, theme, rng);
    }
    const extras = Math.floor(rooms.length * 0.2);
    for (let i = 0; i < extras; i++) {
      const [a, b] = [rng.pick(centers), rng.pick(centers)];
      if (a.room !== b.room) carveLCorridor(map, a.room, b.room, theme, rng);
    }
  }

  return rooms;
}
