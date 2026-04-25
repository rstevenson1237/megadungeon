// src/world/FeaturePlacer.js
import { getFeaturesForTheme } from '../data/features.js';

export class FeaturePlacer {

  /**
   * @param {TileMap} map
   * @param {Array<Room>} rooms
   * @param {RNG} rng
   * @param {Object} theme
   */
  static place(map, rooms, rng, theme) {
    const featurePool = getFeaturesForTheme(theme.key);
    if (featurePool.length === 0) return;

    for (const room of rooms) {
      if (room.type === 'entry') continue;  // entry room stays clean

      const count = rng.int(1, 4);
      for (let i = 0; i < count; i++) {
        const feature = rng.weightedPick(featurePool);
        if (!feature) continue;

        const pos = this._randomFloorTile(map, room, rng);
        if (!pos) continue;

        const tile = map.get(pos.x, pos.y);

        // Solid features (pillars, statues, thrones) mark the tile solid
        if (feature.solid) {
          tile.solid  = true;
          tile.opaque = feature.opaque ?? false;
        }

        tile.features.dungeon = {
          key:  feature.key,
          tier: feature.tier,
          used: false,   // tracks singleUse exhaustion
          data: {
            oldGlyph: tile.glyph,
            oldFg:    tile.fg,
          },      // runtime state (e.g. pairedCircleId)
        };
        tile.glyph = feature.glyph;
        tile.fg    = feature.fg;

        // Transport circles: pair them
        if (feature.key === 'transport_circle') {
          this._pairCircle(map, pos, rooms, rng);
        }

        // Throne: mark room type
        if (feature.key === 'throne') {
          room.type = 'throne_room';
        }
      }
    }
  }

  static _randomFloorTile(map, room, rng) {
    for (let attempt = 0; attempt < 12; attempt++) {
      const x = room.x + rng.int(0, room.w - 1);
      const y = room.y + rng.int(0, room.h - 1);
      const tile = map.get(x, y);
      if (!tile || tile.solid || tile.type !== 'floor') continue;
      if (tile.features.dungeon) continue;  // already has a feature
      if (map.getEntitiesAt(x, y).length > 0) continue;
      return { x, y };
    }
    return null;
  }

  static _pairCircle(map, pos, rooms, rng) {
    // Find another floor tile in a different room for the paired circle
    const otherRooms = rooms.filter(r => {
      const cx = r.x + Math.floor(r.w / 2);
      const cy = r.y + Math.floor(r.h / 2);
      return Math.abs(cx - pos.x) > 10 || Math.abs(cy - pos.y) > 10;
    });
    if (otherRooms.length === 0) return;

    const target = this._randomFloorTile(map, rng.pick(otherRooms), rng);
    if (!target) return;

    const targetTile = map.get(target.x, target.y);
    map.get(pos.x, pos.y).features.dungeon.data.pairedDest = target;
    targetTile.features.dungeon = {
      key:  'transport_circle',
      tier: 'interactive',
      used: false,
      data: { 
        pairedDest: pos,
        oldGlyph: targetTile.glyph,
        oldFg:    targetTile.fg,
      },
    };
    targetTile.glyph = 0x4F;
    targetTile.fg    = '#6644cc';
  }
}
