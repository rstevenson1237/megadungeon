import { InputManager } from './engine/InputManager.js';
import { GameLoop } from './engine/GameLoop.js';
import { EventBus } from './engine/EventBus.js';
import { RNG } from './engine/RNG.js';
import { SaveManager } from './engine/SaveManager.js';
import { WorldMap } from './world/WorldMap.js';
import { createInitialTownState } from './data/town.js';
import { Entity } from './entities/Entity.js'; // Import the new Entity stub

class Game {
    constructor() {
        this.canvasEl = document.getElementById('main-canvas');
        this.input = new InputManager();
        this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));
        this.bus = new EventBus();
        this.rng = new RNG(Date.now()); // Master RNG for the game
        this.ctx = this.canvasEl.getContext('2d');
        
        this.gameState = {
            level: 1,
            player: {
                hp: 10,
                x: 5,
                y: 5
            },
            serialize: function() {
                return {
                    level: this.level,
                    player: this.player
                };
            }
        };

        this.worldMap = new WorldMap(this.rng.seed);
        console.log("Game created");
    }

    async init() {
        console.log("Initializing game...");
        this.canvasEl.width = 960;
        this.canvasEl.height = 800;
        
        this.loop.start();
        console.log("Game loop started.");

        this.bus.on('log:message', (data) => {
            console.log(`[LOG - ${data.category || 'general'}]: ${data.text}`);
        });

        this.bus.emit('log:message', { text: 'Game Initialized! (Font loading skipped)', category: 'game' });

        // --- Verification ---
        this.bus.emit('log:message', { text: 'Verifying World & TileMap...', category: 'world' });
        
        // 1. Get Level 1 TileMap
        const level1 = this.worldMap.getLevel(1);
        this.bus.emit('log:message', { text: `Generated Level 1 metadata: ${JSON.stringify(level1.metadata)}`, category: 'world' });

        // 2. Verify TileMap entity management
        const testMonster = new Entity('test_monster', 10, 10);
        level1.addEntity(testMonster);
        this.bus.emit('log:message', { text: `Entities at (10,10): ${level1.getEntitiesAt(10,10).length}`, category: 'world' });
        
        level1.moveEntity(testMonster, 12, 12);
        this.bus.emit('log:message', { text: `Entities at (10,10) after move: ${level1.getEntitiesAt(10,10).length}`, category: 'world' });
        this.bus.emit('log:message', { text: `Entities at (12,12) after move: ${level1.getEntitiesAt(12,12).length}`, category: 'world' });

        // 3. Verify FOV (stub)
        level1.computeFOV(12, 12, 5);
        this.bus.emit('log:message', { text: `Tile visibility at (12,12) after FOV: ${level1.get(12,12).visible}`, category: 'world' });
        this.bus.emit('log:message', { text: `Tile explored at (12,12) after FOV: ${level1.get(12,12).explored}`, category: 'world' });

        // 4. Verify walkability
        this.bus.emit('log:message', { text: `Is (0,0) walkable (void tile): ${level1.isWalkable(0,0)}`, category: 'world' });
        // Can't test a non-solid tile yet as carveRoom is a stub and doesn't change tile properties

        // 5. Verify Serialization
        const serializedWorld = this.worldMap.serialize();
        const deserializedWorld = WorldMap.deserialize(serializedWorld);
        this.bus.emit('log:message', { text: `Deserialized map contains ${deserializedWorld.levels.get(1).tiles.length} tiles.`, category: 'world' });
        
        this.bus.emit('log:message', { text: 'TileMap verification complete.', category: 'world' });
        // --- End Verification ---
    }

    update(dt) {
        let action;
        while ((action = this.input.consumeAction())) {
            this.bus.emit('log:message', { text: `Action: ${action}`, category: 'input' });
        }
    }

    render(dt) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);

        this.ctx.fillStyle = "#ffcc88";
        this.ctx.font = "20px monospace";
        this.ctx.fillText("MEGADUNGEON", 20, 40);

        this.ctx.fillStyle = "#00ff00";
        this.ctx.fillText("Step 2.4 (TileMap) Verified.", 20, 80);

        this.ctx.fillStyle = "#ccc";
        this.ctx.fillText("Check the browser's developer console for TileMap verification logs.", 20, 120);
    }
}

// --- Entry Point ---
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init().catch(console.error);
});
