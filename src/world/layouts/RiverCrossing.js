// src/world/layouts/RiverCrossing.js
// A sinuous river bisects the level; rooms on each bank with bridge crossings.
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

function connectRooms(map, roomList, theme) {
  for (let i = 0; i < roomList.length - 1; i++) {
    const a = roomList[i], b = roomList[i + 1];
    const ax = a.x + (a.w >> 1), ay = a.y + (a.h >> 1);
    const bx = b.x + (b.w >> 1), by = b.y + (b.h >> 1);
    for (let x = Math.min(ax, bx); x <= Math.max(ax, bx); x++) setFloor(map, x, ay, theme);
    for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) setFloor(map, bx, y, theme);
  }
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
  const riverWidth = rng.int(2, 3);
  const midY = Math.floor(H / 2);

  // 1. Sinuous river: drift ±1 tile every 6 columns
  let ry = midY;
  for (let x = 1; x < W - 1; x++) {
    if (x % 6 === 0) ry = Math.max(midY - 2, Math.min(midY + 2, ry + rng.int(-1, 1)));
    for (let w = 0; w < riverWidth; w++) {
      const ty = ry + w;
      if (!map.inBounds(x, ty)) continue;
      const t = map.get(x, ty);
      t.type = 'water'; t.solid = false; t.opaque = false;
      t.glyph = 0x7E; t.fg = '#3366cc'; t.bg = '#001133';
    }
  }

  // 2. Rooms on north and south halves (3 per half, simple grid zones)
  const rooms = [];
  const halves = [
    { y1: 1, y2: midY - 2 },
    { y1: midY + riverWidth + 1, y2: H - 2 },
  ];

  for (const { y1, y2 } of halves) {
    const halfH = y2 - y1;
    if (halfH < 4) continue;
    const zoneW = Math.floor((W - 2) / 3);

    for (let col = 0; col < 3; col++) {
      const zx = 1 + col * zoneW;
      const rw = Math.max(theme.minRoomW, Math.min(theme.maxRoomW, zoneW - 2));
      const rh = Math.max(theme.minRoomH, Math.min(theme.maxRoomH, halfH - 2));
      if (rw <= 0 || rh <= 0) continue;
      const rx = zx + rng.int(0, Math.max(0, zoneW - rw - 1));
      const room_y = y1 + rng.int(0, Math.max(0, halfH - rh - 1));
      if (!map.inBounds(rx, room_y) || !map.inBounds(rx + rw - 1, room_y + rh - 1)) continue;

      for (let dy = 0; dy < rh; dy++)
        for (let dx = 0; dx < rw; dx++)
          setFloor(map, rx + dx, room_y + dy, theme);

      rooms.push(makeRoom(rx, room_y, rw, rh, rooms.length));
    }
  }

  // Connect rooms within each half
  const northRooms = rooms.filter(r => r.y + r.h <= midY);
  const southRooms = rooms.filter(r => r.y >= midY + riverWidth);
  connectRooms(map, northRooms, theme);
  connectRooms(map, southRooms, theme);

  // 3. 2–3 bridge strips crossing the river
  const bridgeCount = rng.int(2, 3);
  const usedX = new Set();
  let tries = 0;
  while (usedX.size < bridgeCount && tries++ < 100) {
    const bx = rng.int(5, W - 6);
    if (usedX.has(bx)) continue;
    usedX.add(bx);
    for (let y = midY - 1; y <= midY + riverWidth + 1; y++) setFloor(map, bx, y, theme);
  }

  if (rooms.length < 2) {
    console.warn(`RiverCrossing: only ${rooms.length} rooms, falling back to bsp_rooms`);
    return bspFallback(map, rng, theme, levelNumber);
  }

  map.metadata.rooms = rooms;
  return rooms;
}
