// src/world/layouts/DelveShaft.js
// Horizontal mine platforms connected by vertical shafts.
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

/**
 * @param {TileMap} map
 * @param {RNG} rng
 * @param {Object} theme
 * @param {number} levelNumber
 * @returns {Array<Room>}
 */
export function generate(map, rng, theme, levelNumber) {
  const W = map.w, H = map.h;
  const platformCount = rng.int(6, 8);
  const slotH = Math.floor((H - 2) / platformCount);
  const rooms = [];

  // 1. Carve platforms distributed evenly across map height
  for (let i = 0; i < platformCount; i++) {
    const pw = rng.int(8, Math.min(14, W - 4));
    const ph = rng.int(2, 4);
    const slotTop = 1 + i * slotH;
    const py = slotTop + Math.max(0, Math.floor((slotH - ph) / 2));
    const px = rng.int(1, W - pw - 1);
    if (!map.inBounds(px, py) || !map.inBounds(px + pw - 1, py + ph - 1)) continue;

    for (let dy = 0; dy < ph; dy++)
      for (let dx = 0; dx < pw; dx++)
        setFloor(map, px + dx, py + dy, theme);

    rooms.push(makeRoom(px, py, pw, ph, rooms.length));
  }

  // 2. Connect adjacent platforms with a 1-tile vertical shaft
  for (let i = 0; i < rooms.length - 1; i++) {
    const upper = rooms[i], lower = rooms[i + 1];
    const ox1 = Math.max(upper.x, lower.x);
    const ox2 = Math.min(upper.x + upper.w - 1, lower.x + lower.w - 1);
    let shaftX;
    if (ox1 <= ox2) {
      shaftX = rng.int(ox1, ox2);
    } else {
      // No horizontal overlap: bridge at lower room level then drop
      shaftX = upper.x + (upper.w >> 1);
      const lx = lower.x + (lower.w >> 1);
      for (let x = Math.min(shaftX, lx); x <= Math.max(shaftX, lx); x++) setFloor(map, x, lower.y, theme);
    }
    for (let y = upper.y + upper.h; y <= lower.y; y++) setFloor(map, shaftX, y, theme);
  }

  if (rooms.length < 2) {
    console.warn(`DelveShaft: only ${rooms.length} rooms, falling back to bsp_rooms`);
    return bspFallback(map, rng, theme, levelNumber);
  }

  map.metadata.rooms = rooms;
  return rooms;
}
