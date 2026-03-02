/**
 * Manages the requestAnimationFrame loop.
 * The game is TURN-BASED — the loop only handles real-time rendering
 * (animations, CRT flicker, particle effects). Game state advances on input.
 */
export class GameLoop {
  constructor(updateFn, renderFn) {
    this._update = updateFn;
    this._render = renderFn;
    this._running = false;
    this._last = 0;
  }

  start() {
    this._running = true;
    requestAnimationFrame(t => this._loop(t));
  }

  stop() { this._running = false; }

  _loop(timestamp) {
    if (!this._running) return;
    const dt = Math.min((timestamp - this._last) / 1000, 0.1); // cap at 100ms
    this._last = timestamp;
    this._update(dt);
    this._render(dt);
    requestAnimationFrame(t => this._loop(t));
  }
}
