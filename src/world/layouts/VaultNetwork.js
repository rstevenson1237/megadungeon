// src/world/layouts/VaultNetwork.js
// Rectangular vaults distributed on a relaxed grid, MST-connected.
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

function center(r) {
  return { x: r.x + (r.w >> 1), y: r.y + (r.h >> 1) };
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
  const JITTER = 3;

  // 1–2. Place 5–7 vaults on a 3×2 relaxed grid
  const vaultCount = rng.int(5, 7);
  const gridCols = 3, gridRows = 2;
  const cellW = Math.floor(W / gridCols);
  const cellH = Math.floor(H / gridRows);
  const rooms = [];

  outer:
  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      if (rooms.length >= vaultCount) break outer;
      const diam = rng.int(7, 11);
      const cx = Math.round(cellW * (col + 0.5) + rng.int(-JITTER, JITTER));
      const cy = Math.round(cellH * (row + 0.5) + rng.int(-JITTER, JITTER));
      const rx = Math.max(1, cx - (diam >> 1));
      const ry = Math.max(1, cy - (diam >> 1));
      const rw = Math.min(diam, W - rx - 1);
      const rh = Math.min(diam, H - ry - 1);
      if (rw < 3 || rh < 3) continue;

      for (let dy = 0; dy < rh; dy++)
        for (let dx = 0; dx < rw; dx++)
          setFloor(map, rx + dx, ry + dy, theme, rng);

      rooms.push(makeRoom(rx, ry, rw, rh, rooms.length));
    }
  }

  // 3. Connect with Prim MST using L-corridors
  if (rooms.length >= 2) {
    const inTree   = [rooms[0]];
    const notInTree = rooms.slice(1);

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
      for (let x = Math.min(ca.x, cb.x); x <= Math.max(ca.x, cb.x); x++) setFloor(map, x, ca.y, theme, rng);
      for (let y = Math.min(ca.y, cb.y); y <= Math.max(ca.y, cb.y); y++) setFloor(map, cb.x, y, theme, rng);
      inTree.push(best.to);
      notInTree.splice(notInTree.indexOf(best.to), 1);
    }
  }

  if (rooms.length < 2) {
    console.warn(`VaultNetwork: only ${rooms.length} vaults, falling back to bsp_rooms`);
    return bspFallback(map, rng, theme, levelNumber);
  }

  map.metadata.rooms = rooms;
  return rooms;
}
