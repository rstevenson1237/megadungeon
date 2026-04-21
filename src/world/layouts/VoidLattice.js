// src/world/layouts/VoidLattice.js
// Floating island platforms over a lethal void, connected by narrow bridges.
import { generate as bspFallback } from './BspRooms.js';

function makeRoom(x, y, w, h, id) {
  return { x, y, w, h, type: 'normal', content: null, explored: false, id };
}

function setFloor(map, x, y, theme) {
  if (!map.inBounds(x, y)) return;
  const t = map.get(x, y);
  t.type = 'floor'; t.solid = false; t.opaque = false; t.lethal = false;
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

  // 1. Fill entire map with lethal void (passable but deadly)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const t = map.get(x, y);
      t.type = 'void'; t.solid = false; t.opaque = false; t.lethal = true;
      t.glyph = 0x20; t.fg = '#000000'; t.bg = '#05000a';
    }
  }

  // 2. Place 8–12 island rooms with ≥5-tile gaps between them
  const islandCount = rng.int(8, 12);
  const MIN_GAP = 5;
  const islands = [];
  let tries = 0;

  while (islands.length < islandCount && tries++ < 800) {
    const iw = rng.int(4, 7);
    const ih = rng.int(4, 5);
    const ix = rng.int(1, W - iw - 1);
    const iy = rng.int(1, H - ih - 1);

    // Enforce minimum gap between islands
    let ok = true;
    for (const isl of islands) {
      if (ix < isl.x + isl.w + MIN_GAP && ix + iw + MIN_GAP > isl.x &&
          iy < isl.y + isl.h + MIN_GAP && iy + ih + MIN_GAP > isl.y) {
        ok = false; break;
      }
    }
    if (!ok) continue;

    for (let dy = 0; dy < ih; dy++)
      for (let dx = 0; dx < iw; dx++)
        setFloor(map, ix + dx, iy + dy, theme);

    islands.push(makeRoom(ix, iy, iw, ih, islands.length));
  }

  // 3. MST bridges: L-shaped 1-tile-wide floor strips
  if (islands.length >= 2) {
    const center = r => ({ x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) });
    const inTree    = [islands[0]];
    const notInTree = islands.slice(1);

    while (notInTree.length) {
      let best = { from: null, to: null, dist: Infinity };
      for (const a of inTree) {
        for (const b of notInTree) {
          const ca = center(a), cb = center(b);
          const d = Math.hypot(ca.x - cb.x, ca.y - cb.y);
          if (d < best.dist) best = { from: a, to: b, dist: d };
        }
      }
      if (!best.from) break;
      const ca = center(best.from), cb = center(best.to);
      for (let x = Math.min(ca.x, cb.x); x <= Math.max(ca.x, cb.x); x++) setFloor(map, x, ca.y, theme);
      for (let y = Math.min(ca.y, cb.y); y <= Math.max(ca.y, cb.y); y++) setFloor(map, cb.x, y, theme);
      inTree.push(best.to);
      notInTree.splice(notInTree.indexOf(best.to), 1);
    }
  }

  if (islands.length < 2) {
    console.warn(`VoidLattice: only ${islands.length} islands, falling back to bsp_rooms`);
    return bspFallback(map, rng, theme, levelNumber);
  }

  map.metadata.rooms = islands;
  return islands;
}
