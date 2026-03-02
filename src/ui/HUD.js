/**
 * Color-coded, categorized message log.
 * Categories determine color; categories can be filtered by player preference.
 */
export const LOG_COLORS = {
  combat:    '#ff6666',   // Red — damage, hits
  heal:      '#66ff66',   // Green — healing
  magic:     '#aa66ff',   // Purple — spell effects
  trap:      '#ffaa00',   // Orange — trap triggers
  puzzle:    '#66ccff',   // Cyan — puzzle events
  lore:      '#ccccaa',   // Cream — ambient/lore
  system:    '#888888',   // Gray — movement, pick up
  important: '#ffffff',   // White — level up, death
  danger:    '#ff2222',   // Bright red — critical danger
};

export class MessageLog {
  constructor(maxLines = 200) {
    this.messages = [];
    this.maxLines = maxLines;
    this.scroll   = 0; // Lines scrolled up (0 = bottom)
  }

  add(text, category = 'system') {
    this.messages.push({ text, category, color: LOG_COLORS[category], time: Date.now() });
    if (this.messages.length > this.maxLines) this.messages.shift();
    this.scroll = 0; // Snap to bottom on new message
  }

  getVisible(numLines = 4) {
    const from = Math.max(0, this.messages.length - numLines - this.scroll);
    return this.messages.slice(from, from + numLines);
  }

  scrollUp()   { this.scroll = Math.min(this.scroll + 1, this.messages.length - 4); }
  scrollDown() { this.scroll = Math.max(0, this.scroll - 1); }
}
