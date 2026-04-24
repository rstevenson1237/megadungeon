// src/ui/Renderer.js
import { XP_TABLE } from '../engine/rules.js';
import { SkillSystem } from '../systems/SkillSystem.js';

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

        // XP
        const xpNeeded = XP_TABLE[player.level] || 999999;
        const xpRatio = xpNeeded > 0 ? Math.min(player.xp / xpNeeded, 1) : 0;
        this.ctx.fillStyle = '#888888';
        this.ctx.fillText(`XP: ${player.xp}/${xpNeeded}`, x, y);
        y += lineH;
        this.ctx.fillStyle = '#222200';
        this.ctx.fillRect(x, y, barWidth, lineH - 4);
        this.ctx.fillStyle = '#aaaa00';
        this.ctx.fillRect(x, y, barWidth * xpRatio, lineH - 4);
        y += lineH * 1.5;

        // MP
        if (player.mpMax > 0) {
            const mpRatio = player.mp / player.mpMax;
            this.ctx.fillStyle = '#6666ff';
            this.ctx.fillText(`MP: ${player.mp}/${player.mpMax}`, x, y);
            y += lineH;
            this.ctx.fillStyle = '#000033';
            this.ctx.fillRect(x, y, barWidth, lineH - 4);
            this.ctx.fillStyle = '#4444cc';
            this.ctx.fillRect(x, y, barWidth * mpRatio, lineH - 4);
            y += lineH * 1.5;
        }

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
        ];

        if (player.mpMax > 0) {
            parts.push({ text: ` | `, color: '#333333' });
            parts.push({ text: `MP:${player.mp}/${player.mpMax}`, color: '#6666ff' });
        }

        parts.push(
            { text: ` | `, color: '#333333' },
            { text: `XP:${player.xp}`, color: '#888800' },
            { text: ` | `, color: '#333333' },
            { text: `AC:${player.ac}`, color: '#ffffff' },
            { text: ` | `, color: '#333333' },
            { text: `D:${player.depth}`, color: '#888888' }
        );
        
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

    drawTargetingOverlay(ctx, targeting, player, cameraX, cameraY, map) {
        const { TILE_W, TILE_H, VIEW_COLS, VIEW_ROWS } = this;
        const { cursor, mode, theme, aoeRadius = 0 } = targeting;

        const COLORS = {
            skill:  { fill: 'rgba(255,220,0,0.40)',  stroke: 'rgba(255,220,0,0.9)',  dim: 'rgba(0,0,0,0.40)' },
            magic:  { fill: 'rgba(80,120,255,0.40)', stroke: 'rgba(100,140,255,0.9)', dim: 'rgba(0,0,0,0.40)' },
            combat: { fill: 'rgba(255,60,60,0.40)',  stroke: 'rgba(255,80,80,0.9)',  dim: 'rgba(0,0,0,0.40)' },
        };
        const c = COLORS[theme] ?? COLORS.combat;

        // 1. Semi-transparent dim over the entire map viewport to signal "paused"
        ctx.fillStyle = c.dim;
        ctx.fillRect(0, 0, VIEW_COLS * TILE_W, VIEW_ROWS * TILE_H);

        // 2. AOE radius highlight for burst spells
        if (aoeRadius > 0) {
            for (let row = 0; row < VIEW_ROWS; row++) {
                for (let col = 0; col < VIEW_COLS; col++) {
                    const mx = cameraX + col;
                    const my = cameraY + row;
                    const dx = mx - cursor.x;
                    const dy = my - cursor.y;
                    if (Math.sqrt(dx * dx + dy * dy) <= aoeRadius) {
                        const tile = map?.get(mx, my);
                        if (tile?.visible) {
                            ctx.fillStyle = c.fill;
                            ctx.fillRect(col * TILE_W, row * TILE_H, TILE_W, TILE_H);
                        }
                    }
                }
            }
        }

        // 3. Cursor tile highlight
        const cursorCol = cursor.x - cameraX;
        const cursorRow = cursor.y - cameraY;
        if (cursorCol >= 0 && cursorCol < VIEW_COLS && cursorRow >= 0 && cursorRow < VIEW_ROWS) {
            const cx_ = cursorCol * TILE_W;
            const cy_ = cursorRow * TILE_H;
            ctx.fillStyle = c.fill;
            ctx.fillRect(cx_, cy_, TILE_W, TILE_H);
            ctx.strokeStyle = c.stroke;
            ctx.lineWidth = 2;
            ctx.strokeRect(cx_ + 1, cy_ + 1, TILE_W - 2, TILE_H - 2);

            // 4. Dashed trajectory line from player to cursor
            const px_ = (player.x - cameraX) * TILE_W + TILE_W / 2;
            const py_ = (player.y - cameraY) * TILE_H + TILE_H / 2;
            const tcx = cx_ + TILE_W / 2;
            const tcy = cy_ + TILE_H / 2;
            ctx.strokeStyle = c.stroke;
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(px_, py_);
            ctx.lineTo(tcx, tcy);
            ctx.stroke();
            ctx.setLineDash([]);

            // 5. Target info label above cursor tile
            const entityList = map?.getEntitiesAt(cursor.x, cursor.y) ?? [];
            const targetEnt = entityList.find(e => e.type === 'monster');
            if (targetEnt) {
                const hpPct = Math.round((targetEnt.hp / targetEnt.hpMax) * 100);
                const label = `${targetEnt.name} [${hpPct}%]`;
                ctx.textBaseline = 'bottom';
                ctx.font = `${Math.max(10, TILE_H - 4)}px monospace`;
                ctx.fillStyle = '#ffffff';
                ctx.fillText(label, cx_, cy_ > TILE_H ? cy_ - 2 : cy_ + TILE_H + 2);
            }
        }

        // 6. Mode hint bar at bottom of map viewport
        const hints = {
            adjacent:     '[Arrow] Select direction  [Enter] Confirm  [Esc] Cancel',
            ranged_cycle: '[Tab] Cycle targets  [Enter] Confirm  [Esc] Cancel',
            cursor_view:  '[Arrow] Move cursor (LoS)  [Enter] Confirm  [Esc] Cancel',
            cursor_map:   '[Arrow] Move cursor  [Enter] Confirm  [Esc] Cancel',
        };
        const hint = hints[mode] ?? '[Enter] Confirm  [Esc] Cancel';
        ctx.textBaseline = 'top';
        ctx.font = `${Math.max(10, TILE_H - 4)}px monospace`;
        ctx.fillStyle = 'rgba(200,200,200,0.9)';
        ctx.fillText(hint, 8, VIEW_ROWS * TILE_H - TILE_H);
    }

    drawCharacterSheet(ctx, player) {
        const tw = this.TILE_W;
        const th = this.TILE_H;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.font = `${th}px monospace`;

        const col1 = tw;
        const col2 = tw * 28;
        let y = th;

        // Header
        ctx.fillStyle = player.class.color ?? '#ffff00';
        ctx.font = `bold ${th + 2}px monospace`;
        ctx.fillText(`${player.name}  —  Level ${player.level} ${player.class.name}`, col1, y);
        y += th * 1.5;
        ctx.font = `${th}px monospace`;

        // XP
        ctx.fillStyle = '#aaaaaa';
        const nextXP = XP_TABLE[player.level] ?? 0;
        ctx.fillText(`XP: ${player.xp}  /  ${nextXP > 0 ? nextXP : 'MAX'}`, col1, y);
        y += th * 1.5;

        // Stats
        ctx.fillStyle = '#ffff88';
        ctx.fillText('— ATTRIBUTES —', col1, y); y += th;
        const statNames = { str:'Strength', dex:'Dexterity', con:'Constitution',
                            int:'Intelligence', wis:'Wisdom', cha:'Charisma' };
        for (const [key, label] of Object.entries(statNames)) {
            const val = player.stats[key] ?? 10;
            const mod = Math.floor((val - 10) / 2);
            const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
            ctx.fillStyle = '#cccccc';
            ctx.fillText(`${label.padEnd(14)} ${String(val).padStart(2)}  (${modStr})`, col1, y);
            y += th;
        }
        y += th * 0.5;

        // Combat
        ctx.fillStyle = '#ffff88';
        ctx.fillText('— COMBAT —', col1, y); y += th;
        ctx.fillStyle = '#cccccc';
        const atkBonus = player.class.attackBonus?.[player.level] ?? 0;
        ctx.fillText(`HP: ${player.hp} / ${player.hpMax}`, col1, y); y += th;
        if (player.mpMax > 0) { ctx.fillText(`MP: ${player.mp} / ${player.mpMax}`, col1, y); y += th; }
        ctx.fillText(`AC: ${player.ac}`, col1, y); y += th;
        ctx.fillText(`Attack Bonus: +${atkBonus}`, col1, y); y += th * 1.5;

        // Abilities
        if (player.abilities.size > 0) {
            ctx.fillStyle = '#ffff88';
            ctx.fillText('— ABILITIES —', col1, y); y += th;
            for (const ab of player.abilities) {
                ctx.fillStyle = '#aaffaa';
                ctx.fillText(`  ${ab.replace(/_/g,' ')}`, col1, y); y += th;
            }
            y += th * 0.5;
        }

        // Skills (second column)
        let sy = th * 3;
        ctx.fillStyle = '#ffff88';
        ctx.fillText('— SKILLS —', col2, sy); sy += th;
        for (const [key, rank] of Object.entries(player.skills)) {
            const statKey = SkillSystem.SKILL_STAT[key] ?? 'int';
            const mod = Math.floor(((player.stats[statKey] ?? 10) - 10) / 2);
            const total = rank + mod;
            const sign = total >= 0 ? '+' : '';
            ctx.fillStyle = rank > 0 ? '#ccffcc' : '#666666';
            ctx.fillText(`${key.replace(/_/g,' ').padEnd(16)} ${sign}${total}`, col2, sy);
            sy += th;
        }

        // Favored Enemies
        if (player.favoredEnemies?.length > 0) {
            sy += th * 0.5;
            ctx.fillStyle = '#ffff88';
            ctx.fillText('— FAVORED ENEMIES —', col2, sy); sy += th;
            for (const fe of player.favoredEnemies) {
                ctx.fillStyle = '#ffaaaa';
                ctx.fillText(`  ${fe}`, col2, sy); sy += th;
            }
        }

        // Footer hint
        ctx.fillStyle = '#555555';
        ctx.fillText('[Esc / T to close]', col1, ctx.canvas.height - th * 2);
    }

    wrapText(text, maxWidth) {
        if (!text) return [];
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
            const metrics = this.ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine.length > 0) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines;
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
