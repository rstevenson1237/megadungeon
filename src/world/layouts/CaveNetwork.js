// src/world/layouts/CaveNetwork.js
// Organic cave using cellular automaton smoothing.
import { generate as bspFallback } from './BspRooms.js';

function makeRoom(x, y, w, h, id) {
  return { x, y, w, h, type: 'normal', content: null, explored: false, id };
}

function setFloor(map, x, y, theme) {
  if (!map.inBounds(x, y)) return;
  const t = map.get(x, y);
  t.type = 'floor'; t.solid = false; t.opaque = false;
  t.glyph = theme.floorGlyphs[0]; t.fg = theme.floorFg; t.bg = theme.floorBg;
}

function setWall(map, x, y, theme) {
  if (!map.inBounds(x, y)) return;
  const t = map.get(x, y);
  t.type = 'wall'; t.solid = true; t.opaque = true;
  t.glyph = theme.wallGlyph; t.fg = theme.wallFg; t.bg = theme.wallBg;
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

  // 1. Fill with walls
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      setWall(map, x, y, theme);

  // 2. Seed 45% interior floor
  const grid = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++)
      grid[y * W + x] = rng.chance(0.45) ? 1 : 0;

  // 3. Five iterations of CA smoothing (≥5 of 8 neighbours → floor)
  const scratch = new Uint8Array(W * H);
  for (let iter = 0; iter < 5; iter++) {
    scratch.fill(0);
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if (dx !== 0 || dy !== 0) n += grid[(y + dy) * W + (x + dx)];
        scratch[y * W + x] = n >= 5 ? 1 : 0;
      }
    }
    grid.set(scratch);
  }

  // 4. Flood-fill to keep only the largest connected region
  const visited = new Uint8Array(W * H);
  let largest = [];

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (!grid[y * W + x] || visited[y * W + x]) continue;
      const region = [];
      const stack = [y * W + x];
      visited[y * W + x] = 1;
      while (stack.length) {
        const idx = stack.pop();
        region.push(idx);
        const rx = idx % W, ry = (idx / W) | 0;
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx = rx + dx, ny = ry + dy;
          if (nx >= 1 && nx < W-1 && ny >= 1 && ny < H-1) {
            const ni = ny * W + nx;
            if (grid[ni] && !visited[ni]) { visited[ni] = 1; stack.push(ni); }
          }
        }
      }
      if (region.length > largest.length) largest = region;
    }
  }

  if (!largest.length) {
    console.warn('CaveNetwork: no floor region produced, falling back to bsp_rooms');
    return bspFallback(map, rng, theme, levelNumber);
  }

  // Discard tiles outside largest region
  const keep = new Set(largest);
  for (let i = 0; i < grid.length; i++) if (grid[i] && !keep.has(i)) grid[i] = 0;

  // Apply floor tiles
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++)
      if (grid[y * W + x]) setFloor(map, x, y, theme);

  // 5. Extract rooms: divide into 4×3 zones; zones with ≥16 floor tiles → room (bounding box)
  const COLS = 4, ROWS = 3;
  const zW = Math.floor((W - 2) / COLS);
  const zH = Math.floor((H - 2) / ROWS);
  const rooms = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const zx  = 1 + col * zW;
      const zy  = 1 + row * zH;
      const zx2 = col === COLS - 1 ? W - 2 : zx + zW;
      const zy2 = row === ROWS - 1 ? H - 2 : zy + zH;

      let minX = zx2, maxX = zx - 1, minY = zy2, maxY = zy - 1, count = 0;
      for (let y = zy; y < zy2; y++) {
        for (let x = zx; x < zx2; x++) {
          if (!grid[y * W + x]) continue;
          count++;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      if (count >= 16) rooms.push(makeRoom(minX, minY, maxX - minX + 1, maxY - minY + 1, rooms.length));
    }
  }

  // 6. Sort by area descending
  rooms.sort((a, b) => b.w * b.h - a.w * a.h);

  if (rooms.length < 2) {
    console.warn(`CaveNetwork: only ${rooms.length} rooms, falling back to bsp_rooms`);
    return bspFallback(map, rng, theme, levelNumber);
  }

  map.metadata.rooms = rooms;
  return rooms;
}
