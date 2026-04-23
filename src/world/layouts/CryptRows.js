// src/world/layouts/CryptRows.js
// Parallel burial corridors with alternating alcove niches.
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
  const corridorCount = rng.int(4, 5);
  const corridorX = 2;
  const corridorLen = W - 4;

  // Evenly space corridors vertically
  const corridorYs = [];
  for (let i = 0; i < corridorCount; i++)
    corridorYs.push(Math.round(3 + i * (H - 7) / Math.max(1, corridorCount - 1)));

  // 1. Carve horizontal corridors
  for (const cy of corridorYs)
    for (let x = corridorX; x < corridorX + corridorLen; x++)
      setFloor(map, x, cy, theme, rng);

  // 2. Alcove niches: 3×2, every 5 tiles, alternating above/below each corridor
  const rooms = [];
  for (const cy of corridorYs) {
    let above = true;
    for (let x = corridorX + 2; x + 3 < corridorX + corridorLen; x += 5) {
      // above: niche occupies (x, cy-2) and (x, cy-1); below: (x, cy+1) and (x, cy+2)
      const ay = above ? cy - 2 : cy + 1;
      if (!map.inBounds(x, ay) || !map.inBounds(x + 2, ay + 1)) { above = !above; continue; }

      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 3; dx++)
          setFloor(map, x + dx, ay + dy, theme, rng);

      // The alcove row adjacent to the corridor is already adjacent — naturally connected
      rooms.push(makeRoom(x, ay, 3, 2, rooms.length));
      above = !above;
    }
  }

  // 3. Connect corridors at left and right ends with vertical passages
  const leftX  = corridorX;
  const rightX = corridorX + corridorLen - 1;
  for (let i = 0; i < corridorYs.length - 1; i++) {
    for (let y = corridorYs[i]; y <= corridorYs[i + 1]; y++) {
      setFloor(map, leftX,  y, theme, rng);
      setFloor(map, rightX, y, theme, rng);
    }
  }

  if (rooms.length < 2) {
    console.warn(`CryptRows: only ${rooms.length} rooms, falling back to bsp_rooms`);
    return bspFallback(map, rng, theme, levelNumber);
  }

  map.metadata.rooms = rooms;
  return rooms;
}
