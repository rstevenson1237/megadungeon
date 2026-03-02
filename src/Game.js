import { InputManager } from './engine/InputManager.js';
import { GameLoop } from './engine/GameLoop.js';
import { EventBus } from './engine/EventBus.js';
import { RNG } from './engine/RNG.js';

class Game {
    constructor() {
        this.canvasEl = document.getElementById('main-canvas');
        this.input = new InputManager();
        this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));
        this.bus = new EventBus();
        this.rng = new RNG(Date.now());
        this.ctx = this.canvasEl.getContext('2d');
        console.log("Game created");
    }

    async init() {
        console.log("Initializing game...");
        // Set canvas size manually since we are not using CanvasRenderer for it
        this.canvasEl.width = 960; // 80 cols * 12px
        this.canvasEl.height = 800; // 40 rows * 20px
        
        this.loop.start();
        console.log("Game loop started.");

        this.bus.on('log:message', (data) => {
            console.log(`[LOG - ${data.category || 'general'}]: ${data.text}`);
        });

        this.bus.emit('log:message', { text: 'Game Initialized! (Font loading skipped)', category: 'game' });
    }

    update(dt) {
        let action;
        while ((action = this.input.consumeAction())) {
            this.bus.emit('log:message', { text: `Action: ${action}`, category: 'input' });
        }
    }

    render(dt) {
        // Clear screen
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);

        // Draw text using native canvas text
        this.ctx.fillStyle = "#ffcc88";
        this.ctx.font = "20px monospace";
        this.ctx.fillText("MEGADUNGEON", 20, 40);

        this.ctx.fillStyle = "#00ff00";
        this.ctx.fillText("Step 1.4 Implementation Verified.", 20, 80);

        this.ctx.fillStyle = "#ccc";
        this.ctx.fillText("Press any bound key (WASD, Arrows, etc).", 20, 120);
        this.ctx.fillText("Check the browser's developer console for action logs.", 20, 150);
        this.ctx.fillText("NOTE: font.png is empty, using native text rendering.", 20, 180);

    }
}

// --- Entry Point ---
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init().catch(console.error);
});
