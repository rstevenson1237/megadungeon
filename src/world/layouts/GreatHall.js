// src/world/layouts/GreatHall.js
// One large central hall with 4–6 antechambers off its perimeter.
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

function carveRect(map, rx, ry, rw, rh, theme, rng) {
  for (let dy = 0; dy < rh; dy++)
    for (let dx = 0; dx < rw; dx++)
      setFloor(map, rx + dx, ry + dy, theme, rng);
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

  // 1. Central hall
  const hallW = Math.floor(W * 0.45);
  const hallH = Math.floor(H * 0.55);
  const hallX = Math.floor((W - hallW) / 2);
  const hallY = Math.floor((H - hallH) / 2);

  carveRect(map, hallX, hallY, hallW, hallH, theme, rng);
  const rooms = [makeRoom(hallX, hallY, hallW, hallH, 0)];

  // 2. 4–6 side rooms, one per wall segment, cycling north/south/east/west first
  const sideCount = rng.int(4, 6);
  const sidesBase = ['north', 'south', 'east', 'west'];
  const extras = [];
  for (let i = 4; i < sideCount; i++) extras.push(sidesBase[rng.int(0, 3)]);
  const sides = rng.shuffle([...sidesBase, ...extras]).slice(0, sideCount);

  for (const side of sides) {
    const sw = rng.int(theme.minRoomW, theme.maxRoomW);
    const sh = rng.int(theme.minRoomH, theme.maxRoomH);
    let rx, ry, doorX, doorY;

    switch (side) {
      case 'north':
        rx = hallX + rng.int(0, Math.max(0, hallW - sw));
        ry = hallY - sh - 1;
        doorX = rx + (sw >> 1); doorY = hallY - 1;
        break;
      case 'south':
        rx = hallX + rng.int(0, Math.max(0, hallW - sw));
        ry = hallY + hallH + 1;
        doorX = rx + (sw >> 1); doorY = hallY + hallH;
        break;
      case 'west':
        rx = hallX - sw - 1;
        ry = hallY + rng.int(0, Math.max(0, hallH - sh));
        doorX = hallX - 1; doorY = ry + (sh >> 1);
        break;
      case 'east':
      default:
        rx = hallX + hallW + 1;
        ry = hallY + rng.int(0, Math.max(0, hallH - sh));
        doorX = hallX + hallW; doorY = ry + (sh >> 1);
        break;
    }

    // Bounds check
    if (rx < 1 || ry < 1 || rx + sw >= W - 1 || ry + sh >= H - 1) continue;

    carveRect(map, rx, ry, sw, sh, theme, rng);
    setFloor(map, doorX, doorY, theme, rng); // 1-tile doorway
    rooms.push(makeRoom(rx, ry, sw, sh, rooms.length));
  }

  if (rooms.length < 2) {
    console.warn(`GreatHall: only ${rooms.length} rooms, falling back to bsp_rooms`);
    return bspFallback(map, rng, theme, levelNumber);
  }

  map.metadata.rooms = rooms;
  return rooms;
}
