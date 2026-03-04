// src/ui/Menu.js

/**
 * A text-based menu that renders on the game canvas.
 * Supports scrollable item lists with letter-key selection (a-z).
 * 
 * Usage:
 *   const menu = new Menu('Inventory', items, { onSelect, onCancel });
 *   menu.render(ctx, x, y, w, h);
 *   menu.handleAction(action); // from InputManager
 */
export class Menu {
  constructor(title, items, callbacks = {}) {
    this.title = title;
    this.items = items;         // [{ label, key, color, enabled, data }]
    this.cursor = 0;            // Currently highlighted index
    this.scroll = 0;
    this.onSelect = callbacks.onSelect ?? (() => {});
    this.onCancel = callbacks.onCancel ?? (() => {});
    this.closed = false;
    this.maxVisible = 20;
  }

  handleAction(action) {
    if (action === 'cancel') {
      this.closed = true;
      this.onCancel();
      return;
    }
    if (action === 'move:n' || action === 'move:w') {
      this.cursor = Math.max(0, this.cursor - 1);
      this._adjustScroll();
      return;
    }
    if (action === 'move:s' || action === 'move:e') {
      this.cursor = Math.min(this.items.length - 1, this.cursor + 1);
      this._adjustScroll();
      return;
    }
    if (action === 'confirm') {
      if (this.items.length > 0 && this.items[this.cursor].enabled !== false) {
        this.onSelect(this.items[this.cursor], this.cursor);
      }
      return;
    }
    
    // Letter key selection: check if action corresponds to a-z
    // The InputManager doesn't bind letter keys by default, so we check
    // the raw key code from a separate mechanism. For now, use cursor + enter.
  }

  _adjustScroll() {
    if (this.cursor < this.scroll) this.scroll = this.cursor;
    if (this.cursor >= this.scroll + this.maxVisible) {
      this.scroll = this.cursor - this.maxVisible + 1;
    }
  }

  render(ctx, x, y, w, h, tileH) {
    const lineH = tileH;
    this.maxVisible = Math.floor((h - lineH * 3) / lineH);
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(x, y, w, h);
    
    // Border
    ctx.strokeStyle = '#555';
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    
    // Title
    ctx.fillStyle = '#ffcc44';
    ctx.font = `bold ${tileH}px monospace`;
    ctx.fillText(this.title, x + 8, y + 4);
    
    // Items
    ctx.font = `${tileH - 2}px monospace`;
    const visibleItems = this.items.slice(this.scroll, this.scroll + this.maxVisible);
    
    visibleItems.forEach((item, i) => {
      const idx = this.scroll + i;
      const iy = y + lineH * (i + 2);
      const letter = String.fromCharCode(97 + idx); // a, b, c...
      
      // Highlight cursor
      if (idx === this.cursor) {
        ctx.fillStyle = '#333366';
        ctx.fillRect(x + 4, iy - 2, w - 8, lineH);
      }
      
      const color = item.enabled === false ? '#555555' : (item.color ?? '#cccccc');
      ctx.fillStyle = color;
      ctx.fillText(`${letter}) ${item.label}`, x + 8, iy);
    });
    
    // Footer hint
    ctx.fillStyle = '#555555';
    ctx.fillText('[↑↓] Navigate  [Enter] Select  [Esc] Close', x + 8, y + h - lineH);
  }
}
