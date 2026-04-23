// src/world/layouts/TownRuin.js
// Grid of ruined city blocks with partial wall collapse.
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
  const COLS = 4, ROWS = 3;
  const blockW = Math.floor((W - 2) / COLS);
  const blockH = Math.floor((H - 2) / ROWS);

  // 1 & 2. Carve one room per block, inset by 2 tiles
  const rooms = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const bx = 1 + col * blockW;
      const by = 1 + row * blockH;
      const maxW = blockW - 4;
      const maxH = blockH - 4;
      if (maxW <= 0 || maxH <= 0) continue;

      const rw = Math.max(theme.minRoomW, Math.min(rng.int(theme.minRoomW, theme.maxRoomW), maxW));
      const rh = Math.max(theme.minRoomH, Math.min(rng.int(theme.minRoomH, theme.maxRoomH), maxH));
      const offsetX = Math.max(0, maxW - rw);
      const offsetY = Math.max(0, maxH - rh);
      const rx = bx + 2 + (offsetX > 0 ? rng.int(0, offsetX) : 0);
      const ry = by + 2 + (offsetY > 0 ? rng.int(0, offsetY) : 0);

      for (let dy = 0; dy < rh; dy++)
        for (let dx = 0; dx < rw; dx++)
          setFloor(map, rx + dx, ry + dy, theme, rng);

      rooms.push(makeRoom(rx, ry, rw, rh, rooms.length));
    }
  }

  // 3. 2-tile-wide street corridors between adjacent rooms
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const idx = row * COLS + col;
      if (idx >= rooms.length) continue;
      const r = rooms[idx];
      const cx = r.x + (r.w >> 1);
      const cy = r.y + (r.h >> 1);

      // East neighbour
      if (col + 1 < COLS && idx + 1 < rooms.length) {
        const east = rooms[idx + 1];
        const ex = east.x;
        for (let x = r.x + r.w; x < ex; x++) {
          setFloor(map, x, cy,     theme, rng);
          setFloor(map, x, cy + 1, theme, rng);
        }
      }
      // South neighbour
      if (row + 1 < ROWS && idx + COLS < rooms.length) {
        const south = rooms[idx + COLS];
        const sy = south.y;
        for (let y = r.y + r.h; y < sy; y++) {
          setFloor(map, cx,     y, theme, rng);
          setFloor(map, cx + 1, y, theme, rng);
        }
      }
    }
  }

  // Collapse ~30% of wall tiles in the vicinity of each room (ruin effect)
  for (const room of rooms) {
    for (let dy = -3; dy < room.h + 3; dy++) {
      for (let dx = -3; dx < room.w + 3; dx++) {
        const tx = room.x + dx, ty = room.y + dy;
        if (!map.inBounds(tx, ty)) continue;
        const tile = map.get(tx, ty);
        if (tile.solid && rng.chance(0.30)) {
          tile.solid = false; tile.opaque = false;
          tile.type = 'rubble';
          tile.glyph = 0x2C; // ','
          tile.fg = '#665544'; tile.bg = theme.floorBg;
        }
      }
    }
  }

  if (rooms.length < 2) {
    console.warn(`TownRuin: only ${rooms.length} rooms, falling back to bsp_rooms`);
    return bspFallback(map, rng, theme, levelNumber);
  }

  map.metadata.rooms = rooms;
  return rooms;
}
