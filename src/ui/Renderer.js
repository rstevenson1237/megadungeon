// src/ui/Renderer.js

export class Renderer {
    constructor(canvasEl) {
        this.canvas = canvasEl;
        this.ctx = canvasEl.getContext('2d');
        
        // Base tile size at reference resolution (960×800)
        this.BASE_TILE_W = 12;
        this.BASE_TILE_H = 20;
        
        // These get recalculated on resize:
        this.TILE_W = 12;
        this.TILE_H = 20;
        this.VIEW_COLS = 56;
        this.VIEW_ROWS = 36;
        this.TOTAL_COLS = 80;
        this.TOTAL_ROWS = 40;
        this.HUD_X = 0;
        this.LOG_Y = 0;
        this.scale = 1;
        
        this.ctx.imageSmoothingEnabled = false;
        // The initial resize will be triggered by the game.
    }

    resize(availableWidth, availableHeight) {
        // Calculate scale factor: fit 80 columns × 40 rows into available space
        const scaleX = availableWidth / (this.TOTAL_COLS * this.BASE_TILE_W);
        const scaleY = availableHeight / (this.TOTAL_ROWS * this.BASE_TILE_H);
        this.scale = Math.min(scaleX, scaleY);
        
        this.TILE_W = Math.floor(this.BASE_TILE_W * this.scale);
        this.TILE_H = Math.floor(this.BASE_TILE_H * this.scale);
        
        // Ensure minimum tile size for readability (8px wide minimum)
        if (this.TILE_W < 8) {
            this.TILE_W = 8;
            this.TILE_H = Math.floor(this.TILE_W * (this.BASE_TILE_H / this.BASE_TILE_W));
        }
        
        const totalPixelW = availableWidth;
        const totalPixelH = availableHeight;
        
        const totalCols = Math.floor(totalPixelW / this.TILE_W);
        const totalRows = Math.floor(totalPixelH / this.TILE_H);
        
        this.compactMode = totalCols < 65;
        
        if (this.compactMode) {
            this.VIEW_COLS = totalCols;
            this.VIEW_ROWS = totalRows - 5; // Reserve 5 rows for log at bottom
            this.HUD_X = -1; // Signal: draw HUD as overlay
        } else {
            this.VIEW_COLS = totalCols - 24; // Reserve 24 cols for HUD panel
            this.VIEW_ROWS = totalRows - 4;  // Reserve 4 rows for log
            this.HUD_X = this.VIEW_COLS * this.TILE_W + 8;
        }
        
        this.LOG_Y = this.VIEW_ROWS * this.TILE_H + 4;
        
        this.canvas.width = totalCols * this.TILE_W;
        this.canvas.height = totalRows * this.TILE_H;
        
        this.fontSize = Math.max(10, this.TILE_H - 2);
        this.ctx.font = `${this.fontSize}px monospace`;
        this.ctx.textBaseline = 'top';
        this.ctx.imageSmoothingEnabled = false;
    }

  /**
   * Master render call. Called every frame by Game.render().
   */
  render(map, player, log, cameraX = 0, cameraY = 0, theme = null) {
    this._clear();
    this._drawTileMap(map, cameraX, cameraY);
    this._drawEntities(map, cameraX, cameraY);
    this._drawPlayer(player, cameraX, cameraY);
    this._drawHUD(player, theme);
    this._drawLog(log);
  }

  _clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

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
        if (color && !color.startsWith('#')) return color;
        if (!color) return '#000000';
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const dimFactor = 0.7;
        const dr = Math.floor(r * dimFactor);
        const dg = Math.floor(g * dimFactor);
        const db = Math.floor(b * dimFactor);
        return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
    }

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

    _drawPlayer(player, cameraX, cameraY) {
        const col = player.x - cameraX;
        const row = player.y - cameraY;
        const x = col * this.TILE_W;
        const y = row * this.TILE_H;

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillText('@', x, y);
    }

    _drawHUD(player, theme) {
        if (this.compactMode) {
            this._drawCompactHUD(player, theme);
            return;
        }
    
        const x = this.HUD_X;
        let y = 10;
        const lineH = this.TILE_H;
        const panelW = this.canvas.width - x;

        this.ctx.font = `${this.fontSize}px monospace`;

        // Separator
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x - 4, 0, 2, this.canvas.height);
        
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

        this.ctx.font = `${this.fontSize}px monospace`; // Reset font
    }

    _drawCompactHUD(player, theme) {
        // Draw a single status bar at the very top of the screen, overlaying the map
        const y = 0;
        const barH = this.TILE_H + 4;
        
        // Semi-transparent background
        this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
        this.ctx.fillRect(0, y, this.canvas.width, barH);
        
        this.ctx.font = `${Math.max(10, this.fontSize - 2)}px monospace`;
        
        const hpRatio = player.hp / player.hpMax;
        let hpColor = '#00ff00';
        if (hpRatio <= 0.5) hpColor = '#ffff00';
        if (hpRatio <= 0.25) hpColor = '#ff0000';
        
        // Compact: "Adventurer L1 Fighter | HP:20/20 | AC:6 | D:1"
        const parts = [
            { text: `${player.name} `, color: '#ffffff' },
            { text: `L${player.level} ${player.class.name}`, color: '#ffff00' },
            { text: ` | `, color: '#333333' },
            { text: `HP:${player.hp}/${player.hpMax}`, color: hpColor },
            { text: ` | `, color: '#333333' },
            { text: `AC:${player.ac}`, color: '#ffffff' },
            { text: ` | `, color: '#333333' },
            { text: `D:${player.depth}`, color: '#888888' },
        ];
        
        let x = 4;
        for (const p of parts) {
            this.ctx.fillStyle = p.color;
            this.ctx.fillText(p.text, x, y + 2);
            x += this.ctx.measureText(p.text).width;
        }
        
        this.ctx.font = `${this.fontSize}px monospace`;
    }

    _drawLog(log) {
        const x = 10;
        const y = this.LOG_Y;

        // Separator
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, y - 4, this.HUD_X > 0 ? this.HUD_X - 8 : this.canvas.width, 2);

        const messages = log.getVisible(4);
        messages.forEach((msg, i) => {
            this.ctx.fillStyle = msg.color;
            this.ctx.fillText(msg.text, x, y + i * this.TILE_H);
        });
    }
}

export function glyphToChar(code) {
  if (code >= 0x20 && code <= 0x7E) return String.fromCharCode(code);
  
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

export function buildCRTOverlay(w, h) {
  const canvas = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(w, h) : document.createElement('canvas');
  if (canvas.tagName === 'CANVAS') {
      canvas.width = w;
      canvas.height = h;
  }
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);

  const vignette = ctx.createRadialGradient(w/2, h/2, h*0.4, w/2, h/2, h*0.9);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  return canvas;
}
