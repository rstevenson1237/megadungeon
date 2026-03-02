// megadungeon/src/entities/Entity.js - Stub for Phase 3 Step 3.1
export class Entity {
    constructor(type, x, y) {
        this.id   = Entity._nextId++;
        this.type = type;
        this.x    = x;
        this.y    = y;
        this.tags = new Set();
        this.components = {};
        console.log(`Stub Entity: Created ${type} at (${x},${y}) with id ${this.id}`);
    }

    addComponent(name, component) { this.components[name] = component; }
    getComponent(name) { return this.components[name]; }
    hasTag(tag) { return this.tags.has(tag); }
}
Entity._nextId = 1;
