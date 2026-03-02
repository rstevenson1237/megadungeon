/**
 * Flat array-backed 2D grid of tile data.
 * 
 * @typedef {Object} Tile
 * @property {number}  glyph       CP437 char code
 * @property {string}  fg          Foreground color
 * @property {string}  bg          Background color  
 * @property {boolean} solid       Blocks movement
 * @property {boolean} opaque      Blocks line of sight
 * @property {boolean} explored    Has been seen by player
 * @property {boolean} visible     Currently in FOV
 * @property {string}  type        'floor'|'wall'|'door'|'water'|'lava'|'void'|'stair_up'|'stair_down'
 * @property {Object}  features    { torch, trap, puzzle, item_pile, ... }
 * @property {string}  roomId      Which room this tile belongs to
 */
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
    // Mark all previously-visible tiles as not currently visible
    for (const tile of this.tiles) tile.visible = false;
    // Shadowcast from (ox, oy) in all 8 octants
    for (let octant = 0; octant < 8; octant++) {
      shadowcast(this, ox, oy, radius, octant);
    }
    // Mark visible tiles as explored
    for (const tile of this.tiles) {
      if (tile.visible) tile.explored = true;
    }
  }

  /** Return all tiles of a given type */
  findTiles(type) {
    const result = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.get(x,y).type === type) result.push({x, y});
    return result;
  }

  serialize() { /* JSON-safe representation */ }
  static deserialize(data) { /* reconstruct from JSON */ }
}
