// src/ui/Renderer.js

export class Renderer {
  constructor(canvasEl) {
    this.canvas  = canvasEl;
    this.ctx     = canvasEl.getContext('2d');
    this.TILE_W  = 12;   // px per tile column
    this.TILE_H  = 20;   // px per tile row
    this.VIEW_COLS = 56; // Map viewport columns (leaves room for HUD panel)
    this.VIEW_ROWS = 36; // Map viewport rows (leaves room for log)
    this.HUD_X    = this.VIEW_COLS * this.TILE_W + 8; // HUD panel starts here
    this.LOG_Y    = this.VIEW_ROWS * this.TILE_H + 4; // Log panel starts here
    
    // Set canvas size
    canvasEl.width  = 80 * this.TILE_W;   // 960px
    canvasEl.height = 40 * this.TILE_H;   // 800px
    
    this.ctx.font = `${this.TILE_H - 2}px monospace`;
    this.ctx.textBaseline = 'top';
  }

  /**
   * Master render call. Called every frame by Game.render().
   * @param {TileMap}      map
   * @param {Player}       player
   * @param {MessageLog}   log
   * @param {number}       cameraX  Top-left tile of viewport (for scrolling)
   * @param {number}       cameraY
   */
  render(map, player, log, cameraX = 0, cameraY = 0, theme = null) {
    this._clear();
    this._drawTileMap(map, cameraX, cameraY);
    this._drawEntities(map, cameraX, cameraY);
    this._drawPlayer(player, cameraX, cameraY);
    this._drawHUD(player, theme);
    this._drawLog(log);
  }

  // ---------------------------------------------------------------
  // PRIVATE METHODS — implement each:

  _clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Draw all tiles in the viewport area.
   * For each visible column col in [0, VIEW_COLS) and row in [0, VIEW_ROWS):
   *   1. Compute map coords: mx = cameraX + col, my = cameraY + row
   *   2. If out of bounds: draw black
   *   3. Get tile at (mx, my)
   *   4. If !tile.explored: draw black
   *   5. If tile.explored but !tile.visible: draw tile in "dim" colors
   *      (multiply RGB by 0.4 — apply a '#333' overlay or use dimmed fg color)
   *   6. If tile.visible: draw tile at full color
   *   7. Draw background rect then character glyph:
   *      ctx.fillStyle = tile.bg; ctx.fillRect(x, y, TILE_W, TILE_H);
   *      ctx.fillStyle = tile.fg; ctx.fillText(glyphToChar(tile.glyph), x, y);
   */
    _drawTileMap(map, cameraX, cameraY) {
        for (let row = 0; row < this.VIEW_ROWS; row++) {
            for (let col = 0; col < this.VIEW_COLS; col++) {
                const mx = cameraX + col;
                const my = cameraY + row;
                const x = col * this.TILE_W;
                const y = row * this.TILE_H;

                if (!map.inBounds(mx, my)) {
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(x, y, this.TILE_W, this.TILE_H);
                    continue;
                }

                const tile = map.get(mx, my);
                if (!tile.explored) {
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(x, y, this.TILE_W, this.TILE_H);
                    continue;
                }

                const bg = tile.visible ? tile.bg : this._dimColor(tile.bg);
                const fg = tile.visible ? tile.fg : this._dimColor(tile.fg);
                
                this.ctx.fillStyle = bg;
                this.ctx.fillRect(x, y, this.TILE_W, this.TILE_H);

                if (tile.glyph) {
                    this.ctx.fillStyle = fg;
                    this.ctx.fillText(glyphToChar(tile.glyph), x, y);
                }
            }
        }
    }

    _dimColor(color) {
        if (!color.startsWith('#')) return color;
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const dimFactor = 0.4;
        const dr = Math.floor(r * dimFactor);
        const dg = Math.floor(g * dimFactor);
        const db = Math.floor(b * dimFactor);
        return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
    }

  /**
   * Draw entities (monsters, items) on the map.
   * Iterate map.entities (Map of key → Entity[]).
   * For each entity array:
   *   1. Parse x,y from the key ("x,y")
   *   2. Compute screen col/row relative to camera
   *   3. Skip if outside viewport
   *   4. Check if tile at (x,y) is visible — only draw if visible
   *   5. Look up glyph and color from entity.def (for monsters) or entity data (for items)
   *   6. Draw background then character
   * 
   * Monster glyph: entity.def.glyph (CP437 code → char via glyphToChar)
   * Monster color: entity.def.color
   */
    _drawEntities(map, cameraX, cameraY) {
        for (const [key, entityList] of map.entities) {
            if (!entityList || entityList.length === 0) continue;
            
            const [mx, my] = key.split(',').map(Number);
            
            const col = mx - cameraX;
            const row = my - cameraY;

            if (col < 0 || col >= this.VIEW_COLS || row < 0 || row >= this.VIEW_ROWS) {
                continue;
            }

            const tile = map.get(mx, my);
            if (!tile || !tile.visible) {
                continue;
            }

            const entityToDraw = entityList.find(e => e.type === 'monster') || entityList[0];
            if(entityToDraw.type === 'player') continue;


            const glyph = entityToDraw.def?.glyph ?? entityToDraw.glyph;
            const color = entityToDraw.def?.color ?? entityToDraw.color;

            const x = col * this.TILE_W;
            const y = row * this.TILE_H;
            
            this.ctx.fillStyle = color;
            this.ctx.fillText(glyphToChar(glyph), x, y);
        }
    }

  /**
   * Draw the player '@' glyph.
   * Player is always in the center of the viewport (camera tracks player).
   * Screen position = (VIEW_COLS/2, VIEW_ROWS/2) — but use actual camera offset.
   * col = player.x - cameraX, row = player.y - cameraY
   * Color: '#ffffff' always (player is always visible)
   */
    _drawPlayer(player, cameraX, cameraY) {
        const col = player.x - cameraX;
        const row = player.y - cameraY;
        const x = col * this.TILE_W;
        const y = row * this.TILE_H;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('@', x, y);
    }

  /**
   * Draw the HUD panel on the right side.
   */
    _drawHUD(player, theme) {
        const x = this.HUD_X;
        let y = 10;
        const lineH = this.TILE_H;
        const panelW = this.canvas.width - x;

        // Separator
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x - 4, 0, 2, this.canvas.height);
        
        this.ctx.font = `16px monospace`;

        // Name, Class, Level
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(player.name, x, y);
        y += lineH;
        this.ctx.fillStyle = '#ffff00';
        this.ctx.fillText(`Lvl ${player.level} ${player.class.name}`, x, y);
        y += lineH * 1.5;

        // HP
        const hpRatio = player.hp / player.hpMax;
        let hpColor = '#00ff00';
        if (hpRatio <= 0.5) hpColor = '#ffff00';
        if (hpRatio <= 0.25) hpColor = '#ff0000';
        this.ctx.fillStyle = hpColor;
        this.ctx.fillText(`HP: ${player.hp}/${player.hpMax}`, x, y);
        y += lineH;
        const barWidth = panelW - 16;
        this.ctx.fillStyle = '#440000';
        this.ctx.fillRect(x, y, barWidth, lineH - 4);
        this.ctx.fillStyle = hpColor;
        this.ctx.fillRect(x, y, barWidth * hpRatio, lineH - 4);
        y += lineH * 1.5;

        // Stats
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText(`STR:${player.stats.str} DEX:${player.stats.dex} CON:${player.stats.con}`, x, y);
        y += lineH;
        this.ctx.fillText(`INT:${player.stats.int} WIS:${player.stats.wis} CHA:${player.stats.cha}`, x, y);
        y += lineH;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`AC: ${player.ac}`, x, y);
        y += lineH * 1.5;

        // Equipment
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText('─ Equipment ─', x, y);
        y += lineH;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`Wpn: ${player.equipped.weapon?.name ?? 'Unarmed'}`, x, y);
        y += lineH;
        this.ctx.fillText(`Arm: ${player.equipped.body?.name ?? 'None'}`, x, y);
        y += lineH * 1.5;

        // Status
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText('─ Status ─', x, y);
        y += lineH;
        this.ctx.fillStyle = '#ff6666';
        const statuses = player.statuses.map(s => `[${s.key}]`).join(' ');
        this.ctx.fillText(statuses, x, y);
        y += lineH * 1.5;

        // Depth
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText('─ Depth ─', x, y);
        y += lineH;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText(`Level ${player.depth}: ${theme?.name ?? 'Unknown'}`, x, y);
        y += lineH;

        this.ctx.font = `${this.TILE_H - 2}px monospace`; // Reset font
    }

  /**
   * Draw the message log at the bottom of the canvas.
   */
    _drawLog(log) {
        const x = 10;
        const y = this.LOG_Y;

        // Separator
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, y - 4, this.HUD_X - 8, 2);

        const messages = log.getVisible(4);
        messages.forEach((msg, i) => {
            this.ctx.fillStyle = msg.color;
            this.ctx.fillText(msg.text, x, y + i * (this.TILE_H - 4));
        });
    }
}

/**
 * Convert a CP437 char code to a renderable character string.
 * For MVP, handle the common cases. Unknown codes fall back to '?'.
 */
export function glyphToChar(code) {
  // Direct ASCII range: just use String.fromCharCode
  if (code >= 0x20 && code <= 0x7E) return String.fromCharCode(code);
  
  // Common CP437 non-ASCII glyphs used by the game:
  const cp437Map = {
    0x01: '☺', 0x02: '☻', 0x03: '♥', 0x04: '♦', 0x05: '♣', 0x06: '♠',
    0x07: '•', 0x0F: '☼',
    0xB0: '░', 0xB1: '▒', 0xB2: '▓', 0xDB: '█',
    0xC4: '─', 0xB3: '│', 0xDA: '┌', 0xBF: '┐', 0xC0: '└', 0xD9: '┘',
    0xC5: '┼', 0xC3: '├', 0xB4: '┤', 0xC1: '┴', 0xC2: '┬',
    0xFA: '·', 0xF9: '∙',
    0xAF: '»', 0xAD: '«',
    0xF4: '⌠', 0xF5: '⌡',
  };
  return cp437Map[code] ?? '?';
}

/**
 * Renders a subtle CRT scanline + vignette overlay on top of the game canvas.
 * Implemented as a second canvas layered over the main canvas via CSS.
 * Performance: Pre-rendered to an OffscreenCanvas, drawn once per frame.
 */
export function buildCRTOverlay(w, h) {
  const canvas = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(w, h) : document.createElement('canvas');
  if (canvas.tagName === 'CANVAS') {
      canvas.width = w;
      canvas.height = h;
  }
  const ctx = canvas.getContext('2d');

  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);

  // Vignette
  const vignette = ctx.createRadialGradient(w/2, h/2, h*0.4, w/2, h/2, h*0.9);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  return canvas;
}
