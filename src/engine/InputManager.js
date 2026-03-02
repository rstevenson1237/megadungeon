/**
 * Maps keyboard input to named game actions.
 * Supports multiple key bindings per action and rebinding.
 */
export class InputManager {
  constructor() {
    this._bindings = new Map(); // actionName → Set<key>
    this._pressed  = new Set(); // keys held this frame
    this._queue    = [];        // action queue for turn-based consumption
    this._setupDefaults();
    window.addEventListener('keydown', e => this._onKeyDown(e));
    window.addEventListener('keyup',   e => this._pressed.delete(e.code));
  }

  _setupDefaults() {
    const defaults = {
      'move:n':      ['KeyW', 'ArrowUp',    'Numpad8'],
      'move:s':      ['KeyS', 'ArrowDown',  'Numpad2'],
      'move:e':      ['KeyD', 'ArrowRight', 'Numpad6'],
      'move:w':      ['KeyA', 'ArrowLeft',  'Numpad4'],
      'move:ne':     ['Numpad9'],
      'move:nw':     ['Numpad7'],
      'move:se':     ['Numpad3'],
      'move:sw':     ['Numpad1'],
      'wait':        ['Period', 'Numpad5', 'Space'],
      'inventory':   ['KeyI'],
      'pickup':      ['KeyG', 'Comma'],
      'drop':        ['KeyQ'],
      'cast':        ['KeyZ'],
      'use':         ['KeyU'],
      'examine':     ['KeyX'],
      'map':         ['KeyM'],
      'stairs:down': ['Period', 'Shift+Period'],
      'stairs:up':   ['Comma',  'Shift+Comma'],
      'confirm':     ['Enter', 'Space'],
      'cancel':      ['Escape'],
    };
    for (const [action, keys] of Object.entries(defaults)) {
      this._bindings.set(action, new Set(keys));
    }
  }

  _onKeyDown(e) {
    this._pressed.add(e.code);
    const modified = `${e.shiftKey ? 'Shift+' : ''}${e.code}`;
    for (const [action, keys] of this._bindings) {
      if (keys.has(e.code) || keys.has(modified)) {
        this._queue.push(action);
        e.preventDefault();
        break;
      }
    }
  }

  /** Pop next action from queue. Returns null if empty. */
  consumeAction() {
    return this._queue.shift() ?? null;
  }

  bind(action, key) {
    (this._bindings.get(action) ?? this._bindings.set(action, new Set()).get(action)).add(key);
  }

  unbind(action, key) {
    this._bindings.get(action)?.delete(key);
  }
}
