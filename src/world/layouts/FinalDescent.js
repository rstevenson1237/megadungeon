// src/world/layouts/FinalDescent.js
// Bespoke single-floor arena layout for level 100.
import { FEATURES } from '../../data/features.js';

const AW = 24, AH = 20;   // Arena dimensions
const ANT_W = 6, ANT_H = 5;  // Antechamber dimensions
const CORNER_R = 3;           // Arena corner rounding radius

function makeRoom(x, y, w, h, type, id) {
  return { x, y, w, h, type, content: null, explored: false, id };
}

function setFloor(map, x, y, theme) {
  if (!map.inBounds(x, y)) return;
  const t = map.get(x, y);
  t.type = 'floor'; t.solid = false; t.opaque = false;
  t.glyph = theme.floorGlyphs[0]; t.fg = theme.floorFg; t.bg = theme.floorBg;
}

function carveRect(map, rx, ry, rw, rh, theme) {
  for (let dy = 0; dy < rh; dy++)
    for (let dx = 0; dx < rw; dx++)
      setFloor(map, rx + dx, ry + dy, theme);
}

function carveRounded(map, rx, ry, rw, rh, R, theme) {
  for (let dy = 0; dy < rh; dy++) {
    for (let dx = 0; dx < rw; dx++) {
      // Evaluate corner circles — skip tiles outside the arc
      if (dx < R && dy < R &&
          (R - dx) ** 2 + (R - dy) ** 2 > R * R) continue;
      if (dx >= rw - R && dy < R &&
          (dx - (rw - R - 1)) ** 2 + (R - dy) ** 2 > R * R) continue;
      if (dx < R && dy >= rh - R &&
          (R - dx) ** 2 + (dy - (rh - R - 1)) ** 2 > R * R) continue;
      if (dx >= rw - R && dy >= rh - R &&
          (dx - (rw - R - 1)) ** 2 + (dy - (rh - R - 1)) ** 2 > R * R) continue;
      setFloor(map, rx + dx, ry + dy, theme);
    }
  }
}

function placeFeature(map, x, y, featureKey) {
  if (!map.inBounds(x, y)) return;
  const def = FEATURES[featureKey];
  if (!def) return;
  const tile = map.get(x, y);
  if (!tile || tile.solid) return;
  if (def.solid) { tile.solid = true; tile.opaque = def.opaque ?? false; }
  tile.glyph = def.glyph;
  tile.fg    = def.fg;
  tile.features.dungeon = { key: featureKey, tier: def.tier, used: false, data: {} };
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

  // 1. Central arena (rounded rect 24×20)
  const arenaX = Math.floor((W - AW) / 2);
  const arenaY = Math.floor((H - AH) / 2);
  carveRounded(map, arenaX, arenaY, AW, AH, CORNER_R, theme);

  const arenaCX = arenaX + (AW >> 1);   // 39 on a 78-wide map
  const arenaCY = arenaY + (AH >> 1);   // 19 on a 38-tall map

  // 2. Antechambers (6×5) at cardinal points, connected via 2-wide doorways
  const halfAntW = ANT_W >> 1;   // 3
  const halfAntH = ANT_H >> 1;   // 2

  const northX = arenaCX - halfAntW;
  const northY = arenaY - ANT_H - 1;

  const southX = arenaCX - halfAntW;
  const southY = arenaY + AH + 1;

  const westX = arenaX - ANT_W - 1;
  const westY = arenaCY - halfAntH;

  const eastX = arenaX + AW + 1;
  const eastY = arenaCY - halfAntH;

  // Carve north antechamber + 2-wide doorway to arena
  carveRect(map, northX, northY, ANT_W, ANT_H, theme);
  for (let i = 0; i < 2; i++)
    setFloor(map, northX + halfAntW - 1 + i, arenaY - 1, theme);

  // Carve east antechamber + 2-wide doorway
  carveRect(map, eastX, eastY, ANT_W, ANT_H, theme);
  for (let i = 0; i < 2; i++)
    setFloor(map, arenaX + AW, eastY + halfAntH - 1 + i, theme);

  // Carve south antechamber + 2-wide doorway
  carveRect(map, southX, southY, ANT_W, ANT_H, theme);
  for (let i = 0; i < 2; i++)
    setFloor(map, southX + halfAntW - 1 + i, southY - 1, theme);

  // Carve west antechamber + 2-wide doorway
  carveRect(map, westX, westY, ANT_W, ANT_H, theme);
  for (let i = 0; i < 2; i++)
    setFloor(map, arenaX - 1, westY + halfAntH - 1 + i, theme);

  // 3. One predetermined feature per antechamber (last-chance preparation)
  placeFeature(map, northX + halfAntW,       northY + halfAntH,       'altar');
  placeFeature(map, eastX  + halfAntW,       eastY  + halfAntH,       'statue');
  placeFeature(map, southX + halfAntW,       southY + halfAntH,       'chest');
  placeFeature(map, westX  + halfAntW,       westY  + halfAntH,       'bookshelf');

  // 4. Boss spawn zone: 3×3 block at arena center
  map.metadata.bossSpawn = { x: arenaCX - 1, y: arenaCY - 1, w: 3, h: 3 };

  // 5. Stair up (<) at south edge of south antechamber (victory exit)
  const stairX = southX + halfAntW;
  const stairY = southY + ANT_H - 1;
  if (map.inBounds(stairX, stairY)) {
    const t = map.get(stairX, stairY);
    t.type  = 'stair_up';
    t.glyph = 0x3C;
    t.fg    = '#ffaaaa';
    t.solid = false;
  }

  // 6. Build room list in spec order
  const northRoom = makeRoom(northX, northY, ANT_W, ANT_H, 'normal', 0);
  const eastRoom  = makeRoom(eastX,  eastY,  ANT_W, ANT_H, 'normal', 1);
  const southRoom = makeRoom(southX, southY, ANT_W, ANT_H, 'normal', 2);
  const westRoom  = makeRoom(westX,  westY,  ANT_W, ANT_H, 'normal', 3);
  const arenaRoom = makeRoom(arenaX, arenaY, AW,    AH,    'boss',   4);

  const rooms = [northRoom, eastRoom, southRoom, westRoom, arenaRoom];
  map.metadata.rooms = rooms;
  return rooms;
}
