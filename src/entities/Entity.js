/**
 * All game objects that exist on the map inherit from Entity.
 */
export class Entity {
  constructor(type, x, y) {
    this.id   = Entity._nextId++;
    this.type = type;   // 'player' | 'monster' | 'item' | 'trap' | 'npc'
    this.x    = x;
    this.y    = y;
    this.tags = new Set(); // Arbitrary flags: 'undead', 'flying', 'cursed', etc.
    this.components = {};  // Component bag for optional behaviors
  }

  addComponent(name, component) { this.components[name] = component; }
  getComponent(name) { return this.components[name]; }
  hasTag(tag) { return this.tags.has(tag); }
}
Entity._nextId = 1;
