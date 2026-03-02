// src/world/TileMap.js - Stub for World Generation Step 2.4

// Helper function needed by WorldMap's deserialize
const createVoidTile = () => ({
  glyph: 0x20, // Space
  fg: '#000000',
  bg: '#000000',
  solid: true,
  opaque: true,
  explored: false,
  visible: false,
  type: 'void',
  features: {},
  roomId: null,
});

export class TileMap {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.tiles = new Array(w * h).fill(null).map(() => createVoidTile());
  }

  // Dummy serialize for WorldMap verification
  serialize() {
    return {
      w: this.w,
      h: this.h,
      // In a real implementation, you'd serialize actual tile data
      // For now, just pass dimensions
    };
  }

  // Dummy deserialize for WorldMap verification
  static deserialize(data) {
    console.log('Stub TileMap: Deserializing', data);
    return new TileMap(data.w, data.h);
  }
}
