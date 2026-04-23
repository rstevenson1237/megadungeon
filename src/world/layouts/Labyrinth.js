// src/world/layouts/Labyrinth.js
// Recursive-backtracker maze with widened dead-end rooms.
import { generate as bspFallback } from './BspRooms.js';

function makeRoom(x, y, w, h, id) {
  return { x, y, w, h, type: 'normal', content: null, explored: false, id };
}

function setFloor(map, x, y, theme, rng) {
  if (!map.inBounds(x, y)) return;
  const t = map.get(x, y);
  t.type = 'floor'; t.solid = false; t.opaque = false;
  t.glyph = rng.pick(theme.floorGlyphs); t.fg = theme.floorFg; t.bg = theme.floorBg;
}

/**
 * @param {TileMap} map
 * @param {RNG} rng
 * @param {Object} theme
 * @param {number} levelNumber
 * @returns {Array<Room>}
 */
export function generate(map, rng, theme, levelNumber) {
  const W = map.w, H = map.h;

  // 1. Fill with walls (default tile state is solid, just enforce it)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = map.get(x, y);
      t.type = 'wall'; t.solid = true; t.opaque = true;
      t.glyph = theme.wallGlyph; t.fg = theme.wallFg; t.bg = theme.wallBg;
    }
  }

  // 2. Recursive backtracker on odd-coordinate maze cells
  // Maze cell (mx, my) maps to map coordinate (1+mx*2, 1+my*2)
  const mazeW = Math.floor((W - 1) / 2);
  const mazeH = Math.floor((H - 1) / 2);
  const visited = new Uint8Array(mazeW * mazeH);
  const DIRS = [[0,-1],[0,1],[-1,0],[1,0]];

  const stack = [[0, 0]];
  visited[0] = 1;
  setFloor(map, 1, 1, theme, rng);

  while (stack.length) {
    const [mx, my] = stack[stack.length - 1];
    const shuffled = rng.shuffle(DIRS);
    let moved = false;
    for (const [dx, dy] of shuffled) {
      const nx = mx + dx, ny = my + dy;
      if (nx < 0 || nx >= mazeW || ny < 0 || ny >= mazeH || visited[ny * mazeW + nx]) continue;
      visited[ny * mazeW + nx] = 1;
      // Carve current cell, wall between, and next cell
      setFloor(map, 1 + mx * 2,      1 + my * 2,      theme, rng);
      setFloor(map, 1 + mx * 2 + dx, 1 + my * 2 + dy, theme, rng);
      setFloor(map, 1 + nx * 2,      1 + ny * 2,      theme, rng);
      stack.push([nx, ny]);
      moved = true;
      break;
    }
    if (!moved) stack.pop();
  }

  // 3. Find dead ends: maze cells with ≤1 open cardinal map-neighbour
  const deadEnds = [];
  for (let my = 0; my < mazeH; my++) {
    for (let mx = 0; mx < mazeW; mx++) {
      const wx = 1 + mx * 2, wy = 1 + my * 2;
      if (map.get(wx, wy).solid) continue;
      let open = 0;
      for (const [dx, dy] of DIRS) {
        const nx = wx + dx, ny = wy + dy;
        if (map.inBounds(nx, ny) && !map.get(nx, ny).solid) open++;
      }
      if (open <= 1) deadEnds.push([wx, wy]);
    }
  }

  // Widen 8–12 random dead ends into 3×3 rooms
  const shuffledEnds = rng.shuffle(deadEnds);
  const roomCount = Math.min(rng.int(8, 12), shuffledEnds.length);
  const rooms = [];

  for (let i = 0; i < roomCount; i++) {
    const [cx, cy] = shuffledEnds[i];
    const rx = cx - 1, ry = cy - 1;
    for (let dy = 0; dy < 3; dy++)
      for (let dx = 0; dx < 3; dx++)
        setFloor(map, rx + dx, ry + dy, theme, rng);
    if (map.inBounds(rx, ry) && map.inBounds(rx + 2, ry + 2))
      rooms.push(makeRoom(rx, ry, 3, 3, rooms.length));
  }

  if (rooms.length < 2) {
    console.warn(`Labyrinth: only ${rooms.length} rooms, falling back to bsp_rooms`);
    return bspFallback(map, rng, theme, levelNumber);
  }

  map.metadata.rooms = rooms;
  return rooms;
}
