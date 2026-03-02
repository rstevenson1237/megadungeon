import { InputManager } from './engine/InputManager.js';
import { GameLoop } from './engine/GameLoop.js';
import { EventBus } from './engine/EventBus.js';
import { RNG } from './engine/RNG.js';
import { SaveManager } from './engine/SaveManager.js';
import { WorldMap } from './world/WorldMap.js';
import { createInitialTownState } from './data/town.js';

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

        // Initialize WorldMap with a master seed
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
        if (SaveManager.hasSave()) {
            this.bus.emit('log:message', { text: 'Existing save file found. Press F8 to load.', category: 'save' });
        }

        // --- WorldMap Verification ---
        this.bus.emit('log:message', { text: 'Verifying WorldMap and LevelGen...', category: 'world' });
        const level1 = this.worldMap.getLevel(1); // Should trigger LevelGen.generate
        this.bus.emit('log:message', { text: `Generated Level 1 (via LevelGen): ${JSON.stringify(level1.metadata)}`, category: 'world' });

        const serializedWorld = this.worldMap.serialize();
        this.bus.emit('log:message', { text: `Serialized WorldMap (via LevelGen): ${JSON.stringify(serializedWorld)}`, category: 'world' });

        const deserializedWorld = WorldMap.deserialize(serializedWorld);
        this.bus.emit('log:message', { text: `Deserialized WorldMap (via LevelGen): ${JSON.stringify(deserializedWorld.levels.get(1).metadata)}`, category: 'world' });
        this.bus.emit('log:message', { text: 'WorldMap and LevelGen verification complete.', category: 'world' });
        // --- End WorldMap Verification ---
    }

    update(dt) {
        let action;
        while ((action = this.input.consumeAction())) {
            this.bus.emit('log:message', { text: `Action: ${action}`, category: 'input' });

            switch(action) {
                case 'save':
                    if (SaveManager.quickSave(this.gameState)) {
                        this.bus.emit('log:message', { text: 'Game state saved.', category: 'save' });
                    } else {
                        this.bus.emit('log:message', { text: 'Failed to save game state.', category: 'error' });
                    }
                    break;
                case 'load':
                    const loadedState = SaveManager.quickLoad();
                    if (loadedState) {
                        this.gameState.level = loadedState.level;
                        this.gameState.player = loadedState.player;
                        this.bus.emit('log:message', { text: `Game state loaded: Level ${loadedState.level}`, category: 'save' });
                        console.log('Loaded data:', loadedState);
                    } else {
                        this.bus.emit('log:message', { text: 'No save file to load.', category: 'save' });
                    }
                    break;
                case 'move:n':
                    this.gameState.player.y--;
                    break;
                case 'move:s':
                    this.gameState.player.y++;
                    break;
                case 'move:e':
                    this.gameState.player.x++;
                    break;
                case 'move:w':
                    this.gameState.player.x--;
                    break;
            }
        }
    }

    render(dt) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);

        this.ctx.fillStyle = "#ffcc88";
        this.ctx.font = "20px monospace";
        this.ctx.fillText("MEGADUNGEON", 20, 40);

        this.ctx.fillStyle = "#00ff00";
        this.ctx.fillText("Step 2.2 (LevelGen) Verified.", 20, 80);

        this.ctx.fillStyle = "#ccc";
        this.ctx.fillText("Press F5 to Save, F8 to Load.", 20, 120);
        this.ctx.fillText("Use WASD to move the player data.", 20, 150);
        this.ctx.fillText("Check the browser's console for WorldMap and LevelGen logs.", 20, 180);

        this.ctx.fillStyle = "#ffff00";
        this.ctx.fillText(`Player HP: ${this.gameState.player.hp}`, 20, 220);
        this.ctx.fillText(`Player Pos: (${this.gameState.player.x}, ${this.gameState.player.y})`, 20, 250);
        this.ctx.fillText(`Dungeon Level: ${this.gameState.level}`, 20, 280);
    }
}

// --- Entry Point ---
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init().catch(console.error);
});
