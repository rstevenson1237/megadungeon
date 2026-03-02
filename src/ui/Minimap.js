/**
 * Renders a minimap showing explored rooms and corridors.
 * Toggle with [M]. Displays in overlay canvas with transparency.
 * Each dungeon tile is shown as a 2×2 pixel block.
 */
export class Minimap {
  constructor(tileMap, canvasEl) {
    this.tileMap = tileMap;
    this.canvas  = canvasEl;
    this.ctx     = canvasEl.getContext('2d');
    this.scale   = 2; // px per tile
  }

  render(playerX, playerY) {
    const { w, h } = this.tileMap;
    this.canvas.width  = w * this.scale;
    this.canvas.height = h * this.scale;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tile = this.tileMap.get(x, y);
        if (!tile.explored) continue;
        this.ctx.fillStyle = this._tileColor(tile, tile.visible);
        this.ctx.fillRect(x * this.scale, y * this.scale, this.scale, this.scale);
      }
    }

    // Player dot
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(playerX * this.scale, playerY * this.scale, this.scale, this.scale);
  }

  _tileColor(tile, visible) {
    const dim = visible ? 1 : 0.5;
    switch (tile.type) {
      case 'floor':      return `rgba(80,80,80,${dim})`;
      case 'wall':       return `rgba(140,140,140,${dim})`;
      case 'door':       return `rgba(160,120,60,${dim})`;
      case 'stair_down': return `rgba(100,200,100,${dim})`;
      case 'stair_up':   return `rgba(200,100,100,${dim})`;
      case 'water':      return `rgba(60,100,180,${dim})`;
      default:           return `rgba(50,50,50,${dim})`;
    }
  }
}
