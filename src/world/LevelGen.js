// megadungeon/src/world/LevelGen.js
import { TileMap } from './TileMap.js';
import { pickTheme } from '../data/themeRegistry.js';
import { pickLayout } from './layouts/index.js';
import { RoomGen } from './RoomGen.js';
import { bus } from '../engine/EventBus.js';
import { FeaturePlacer } from './FeaturePlacer.js';
import { isDungeonTownLevel } from '../data/dungeonTowns.js';

// Named map sizes — layouts use map.w/map.h internally so all scale automatically.
const MAP_SIZES = {
  tiny:   { w: 40,  h: 20 },
  small:  { w: 56,  h: 28 },
  medium: { w: 78,  h: 38 },
  large:  { w: 104, h: 52 },
  huge:   { w: 130, h: 65 },
};

// --- LevelGen Implementation ---
export class LevelGen {
  static generate(levelNumber, rng) {
    const theme   = pickTheme(levelNumber, rng);       // themeRegistry
    const layout  = pickLayout(theme.key, rng);        // layouts/index
    const sizeKey = rng.pick(theme.mapSizes ?? ['medium']);
    const { w, h } = MAP_SIZES[sizeKey] ?? MAP_SIZES.medium;
    const map     = new TileMap(w, h);
    map.metadata.theme   = theme;
    map.metadata.layout  = layout.key;
    map.metadata.sizeKey = sizeKey;

    const rooms = layout.generate(map, rng, theme, levelNumber);

    if (rooms.length > 1) {
      // Connection is the responsibility of each layout internally.
      // BspRooms connects during generate(); other layouts may differ.
    }

    this._placeStairs(map, rooms, rng, levelNumber);
    this._placeRunes(map, rooms, rng, levelNumber);
    FeaturePlacer.place(map, rooms, rng, theme);
    this._populateRooms(map, rooms, rng, levelNumber, theme);
    this._ensureStairDownReachable(map, levelNumber);
    return map;
  }

  static _placeStairs(map, rooms, rng, levelNumber) {
    if (rooms.length === 0) return;

    const upRoom = rooms[0];
    const ux = upRoom.x + Math.floor(upRoom.w / 2);
    const uy = upRoom.y + Math.floor(upRoom.h / 2);
    this._stampStair(map, ux, uy, 'up');
    map.metadata.entry = { x: ux, y: uy };

    if (levelNumber >= 100) return;

    const eligible = rooms.slice(1).filter(r => {
      if (r.type === 'boss') return false;
      const cx = r.x + Math.floor(r.w / 2);
      const cy = r.y + Math.floor(r.h / 2);
      return Math.abs(cx - ux) + Math.abs(cy - uy) > 15;
    });

    const downRoom = eligible.length > 0 ? rng.pick(eligible) : rooms[rooms.length - 1];
    const dx = downRoom.x + Math.floor(downRoom.w / 2);
    const dy = downRoom.y + Math.floor(downRoom.h / 2);
    this._stampStair(map, dx, dy, 'down');
    map.metadata.stairDown = { x: dx, y: dy };
  }

  static _stampStair(map, x, y, direction) {
    if (!map.inBounds(x, y)) return;
    const t = map.get(x, y);
    if (direction === 'up') {
      t.type  = 'stair_up';
      t.glyph = 0x3C;
      t.fg    = '#ffaaaa';
    } else {
      t.type  = 'stair_down';
      t.glyph = 0x3E;
      t.fg    = '#aaffaa';
    }
    t.solid = false;
  }

  static _placeRunes(map, rooms, rng, levelNumber) {
    if (levelNumber < 3 || levelNumber >= 98) return;

    const count = rng.pick([0, 1, 2]);
    if (count === 0) return;

    const eligible = rooms.filter(r => r.type !== 'entry' && r.type !== 'boss');
    if (!eligible.length) return;

    const usedDests = new Set();
    for (let i = 0; i < count; i++) {
      const room = rng.pick(eligible);
      const pos  = this._randomFloorInRoom(map, room, rng);
      if (!pos) continue;

      // Pick destination: 5–15 levels away; 70% deeper, 30% shallower
      let destLevel, tries = 0;
      do {
        const sign = rng.next() < 0.7 ? 1 : -1;
        destLevel = Math.max(1, Math.min(99, levelNumber + sign * rng.int(5, 15)));
        if (isDungeonTownLevel(destLevel)) {
          destLevel = Math.max(1, Math.min(99, destLevel + sign));
        }
        tries++;
      } while ((isDungeonTownLevel(destLevel) || usedDests.has(destLevel)) && tries < 10);

      if (isDungeonTownLevel(destLevel) || usedDests.has(destLevel)) continue;
      usedDests.add(destLevel);

      const tile = map.get(pos.x, pos.y);
      tile.features.rune = { destLevel };
      tile.glyph = 0xF0;
      tile.fg    = '#8844cc';
      tile.solid = false;

      if (!map.metadata.runes) map.metadata.runes = [];
      map.metadata.runes.push({ x: pos.x, y: pos.y, destLevel });
    }
  }

  static _randomFloorInRoom(map, room, rng) {
    for (let a = 0; a < 12; a++) {
      const x = room.x + rng.int(0, room.w - 1);
      const y = room.y + rng.int(0, room.h - 1);
      const t = map.get(x, y);
      if (t && !t.solid && t.type === 'floor' && !t.features.dungeon && !t.features.rune) {
        return { x, y };
      }
    }
    return null;
  }

  static _populateRooms(map, rooms, rng, levelNumber, theme) {
    const populator = new RoomGen(levelNumber, rng, theme, bus);
    if(rooms.length === 0) return;
    rooms[0].type = 'entry';
    if (levelNumber % 5 === 0 && rooms.length > 1) {
      const bossRoom = rooms[rooms.length - 1];
      bossRoom.type  = 'boss';
      populator.populateBossRoom(map, bossRoom);
    }
    for (const room of rooms) {
      if (room.type === 'entry' || room.type === 'boss') continue;
      populator.populate(map, room);
    }

    // Guarantee minimum puzzle count per band without relying on cross-level state.
    const minPuzzles = populator.band.minPuzzles ?? 0;
    if (minPuzzles > 0) {
      const puzzleCount = rooms.filter(r => r.content === 'puzzle').length;
      if (puzzleCount < minPuzzles) {
        // Prefer converting lowest-cost rooms first: empty → lore → shrine
        const candidates = rooms.filter(r =>
          r.type === 'normal' &&
          r.content !== 'puzzle' &&
          ['empty', 'lore', 'shrine'].includes(r.content)
        );
        candidates.sort((a, b) => {
          const order = { empty: 0, lore: 1, shrine: 2 };
          return (order[a.content] ?? 3) - (order[b.content] ?? 3);
        });
        for (let i = 0; i < (minPuzzles - puzzleCount) && i < candidates.length; i++) {
          candidates[i].content = 'puzzle';
          populator._placePuzzle(map, candidates[i]);
        }
      }
    }
  }

  // BFS from the entry stair; if stair_down is unreachable, relocate it to the
  // farthest reachable floor tile from the entry so the player can always descend.
  static _ensureStairDownReachable(map, levelNumber) {
    if (levelNumber >= 100) return;
    const entry     = map.metadata.entry;
    const stairDown = map.metadata.stairDown;
    if (!entry || !stairDown) return;

    // BFS — 4-directional, only non-solid tiles
    const visited = new Set();
    const queue   = [entry];
    visited.add(`${entry.x},${entry.y}`);
    while (queue.length) {
      const { x, y } = queue.shift();
      for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
        const nx = x + dx, ny = y + dy;
        const key = `${nx},${ny}`;
        if (visited.has(key) || !map.inBounds(nx, ny)) continue;
        if (map.get(nx, ny).solid) continue;
        visited.add(key);
        queue.push({ x: nx, y: ny });
      }
    }

    if (visited.has(`${stairDown.x},${stairDown.y}`)) return; // already reachable

    // Pick the reachable floor tile farthest (Manhattan) from the entry for the stair
    let bestPos = null, bestDist = -1;
    for (const key of visited) {
      const [x, y] = key.split(',').map(Number);
      const t = map.get(x, y);
      if (t.type === 'stair_up') continue;
      const dist = Math.abs(x - entry.x) + Math.abs(y - entry.y);
      if (dist > bestDist) { bestDist = dist; bestPos = { x, y }; }
    }
    if (!bestPos) return;

    // Restore old stair_down tile to plain floor
    const old = map.get(stairDown.x, stairDown.y);
    old.type  = 'floor';
    old.glyph = map.metadata.theme?.floorGlyphs?.[0] ?? 0x2E;
    old.fg    = map.metadata.theme?.floorFg ?? '#555555';
    old.solid = false;

    this._stampStair(map, bestPos.x, bestPos.y, 'down');
    map.metadata.stairDown = bestPos;
  }
}
