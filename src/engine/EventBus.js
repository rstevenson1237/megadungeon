/**
 * Global event bus. Systems communicate by emitting/subscribing to events
 * rather than holding direct references to each other.
 * 
 * Standard event names (document all additions here):
 *   'turn:end'          — After player action resolves
 *   'player:move'       — {from, to}
 *   'player:attack'     — {attacker, defender, damage, hit}
 *   'player:death'      — {cause}
 *   'monster:death'     — {monster, killer}
 *   'item:pickup'       — {item, entity}
 *   'item:use'          — {item, user, target}
 *   'spell:cast'        — {spell, caster, targets}
 *   'trap:trigger'      — {trap, victim}
 *   'puzzle:solved'     — {puzzle, solver}
 *   'level:descend'     — {fromLevel, toLevel}
 *   'level:ascend'      — {fromLevel, toLevel}
 *   'log:message'       — {text, color, category}
 *   'ui:refresh'        — (triggers full UI redraw)
 */
export class EventBus {
  constructor() { this._handlers = {}; }

  on(event, handler) {
    (this._handlers[event] ??= []).push(handler);
    return () => this.off(event, handler); // returns unsubscribe fn
  }

  off(event, handler) {
    this._handlers[event] = (this._handlers[event] ?? []).filter(h => h !== handler);
  }

  emit(event, data = {}) {
    for (const h of (this._handlers[event] ?? [])) {
      h(data);
    }
  }

  once(event, handler) {
    const unsub = this.on(event, (data) => { handler(data); unsub(); });
  }
}

export const bus = new EventBus(); // singleton
