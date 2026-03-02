// megadungeon/src/world/TileMap.js
import { Entity } from '../entities/Entity.js'; // Will be a stub

// --- Helper for TileMap ---
// The actual Tile definition
const createVoidTile = () => ({
  glyph: 0x20,        // Space character
  fg: '#000000',      // Black foreground
  bg: '#000000',      // Black background
  solid: true,        // Blocks movement
  opaque: true,       // Blocks line of sight
  explored: false,    // Has been seen by player
  visible: false,     // Currently in FOV
  type: 'void',       // Type of tile
  features: {},       // Placeholder for features
  roomId: null,       // Which room this tile belongs to
});

// Stub for shadowcast FOV algorithm
function castLight(map, cx, cy, row, start, end, radius, xx, xy, yx, yy) {
  if (start < end) return;
  const radiusSq = radius * radius;
  let newStart = 0;
  let blocked = false;

  for (let distance = row; distance <= radius && !blocked; distance++) {
    const dy = -distance;
    for (let dx = -distance; dx <= 0; dx++) {
      const currentX = cx + dx * xx + dy * xy;
      const currentY = cy + dx * yx + dy * yy;
      const leftSlope  = (dx - 0.5) / (dy + 0.5);
      const rightSlope = (dx + 0.5) / (dy - 0.5);

      if (!map.inBounds(currentX, currentY) || start < rightSlope) continue;
      if (end > leftSlope) break;

      if (dx * dx + dy * dy <= radiusSq) {
        const tile = map.get(currentX, currentY);
        tile.visible  = true;
        tile.explored = true;
      }

      if (blocked) {
        if (map.get(currentX, currentY)?.opaque) {
          newStart = rightSlope;
        } else {
          blocked = false;
          start = newStart;
        }
      } else if (map.inBounds(currentX, currentY) && map.get(currentX, currentY)?.opaque && distance < radius) {
        blocked = true;
        castLight(map, cx, cy, distance + 1, start, leftSlope, radius, xx, xy, yx, yy);
        newStart = rightSlope;
      }
    }
  }
}

function shadowcast(map, ox, oy, radius, octant) {
  const MULT = [
    [1,  0,  0, -1, -1,  0,  0,  1],
    [0,  1, -1,  0,  0, -1,  1,  0],
    [0,  1,  1,  0,  0, -1, -1,  0],
    [1,  0,  0,  1, -1,  0,  0, -1],
  ];
  castLight(
    map, ox, oy,
    1, 1.0, 0.0, radius,
    MULT[0][octant], MULT[1][octant],
    MULT[2][octant], MULT[3][octant]
  );
}

// --- TileMap Implementation ---
export class TileMap {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.tiles = new Array(w * h).fill(null).map(() => createVoidTile());
    this.entities = new Map(); // `x,y` → Entity[]
    this.metadata = {};        // Arbitrary level-scoped data
  }

  idx(x, y)        { return y * this.w + x; }
  get(x, y)        { return this.tiles[this.idx(x, y)]; }
  set(x, y, tile)  { this.tiles[this.idx(x, y)] = tile; }
  inBounds(x, y)   { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  isWalkable(x, y) { return this.inBounds(x, y) && !this.get(x, y).solid; }

  getEntitiesAt(x, y) { return this.entities.get(`${x},${y}`) ?? []; }

  addEntity(entity) {
    const key = `${entity.x},${entity.y}`;
    const arr = this.entities.get(key) ?? [];
    arr.push(entity);
    this.entities.set(key, arr);
  }

  removeEntity(entity) {
    const key = `${entity.x},${entity.y}`;
    const arr = (this.entities.get(key) ?? []).filter(e => e !== entity);
    if (arr.length) this.entities.set(key, arr);
    else this.entities.delete(key);
  }

  moveEntity(entity, newX, newY) {
    this.removeEntity(entity);
    entity.x = newX;
    entity.y = newY;
    this.addEntity(entity);
  }

  /** Compute visible tiles using shadowcasting FOV */
  computeFOV(ox, oy, radius) {
    for (const tile of this.tiles) tile.visible = false;
    // Mark origin always visible
    if (this.inBounds(ox, oy)) {
      const t = this.get(ox, oy);
      t.visible  = true;
      t.explored = true;
    }
    for (let octant = 0; octant < 8; octant++) {
      shadowcast(this, ox, oy, radius, octant);
    }
  }

  /** Return all tiles of a given type */
  findTiles(type) {
    console.log(`TileMap: Finding tiles of type ${type}`);
    const result = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.get(x,y).type === type) result.push({x, y});
    return result;
  }

  serialize() {
    console.log('TileMap: Serializing map.');
    // When serializing, we only care about explored tiles.
    // For unexplored tiles, we can save a "void" placeholder to save space.
    return {
      w: this.w,
      h: this.h,
      tiles: this.tiles.map(tile => tile.explored ? tile : createVoidTile()),
      entities: [...this.entities.entries()].map(([key, arr]) => [key, arr.map(e => e.id)]), // Only save entity IDs for now
      metadata: this.metadata,
    };
  }

  static deserialize(data) {
    console.log('TileMap: Deserializing map.');
    const map = new TileMap(data.w, data.h);
    map.tiles = data.tiles.map(t => ({...createVoidTile(), ...t})); // merge to ensure all props exist
    map.metadata = data.metadata;
    // Entities would be deserialized here, using the IDs
    return map;
  }
}
