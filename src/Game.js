import { CanvasRenderer } from './engine/Canvas.js';
import { InputManager } from './engine/InputManager.js';
import { GameLoop } from './engine/GameLoop.js';
import { EventBus } from './engine/EventBus.js';
import { RNG } from './engine/RNG.js';

class Game {
    constructor() {
        this.canvas = null;
        this.input = new InputManager();
        this.loop = new GameLoop(this.update.bind(this), this.render.bind(this));
        this.bus = new EventBus();
        this.rng = new RNG(Date.now());
        console.log("Game created");
    }

    async init() {
        console.log("Initializing game...");
        const fontImage = await this.loadFont();
        this.canvas = new CanvasRenderer(document.getElementById('main-canvas'), fontImage);
        
        this.loop.start();
        console.log("Game loop started.");

        this.bus.on('log:message', (data) => {
            console.log(`[LOG - ${data.category || 'general'}]: ${data.text}`);
        });

        this.bus.emit('log:message', { text: 'Game Initialized!', category: 'game' });
    }

    async loadFont() {
        const response = await fetch('assets/font.png');
        const blob = await response.blob();
        return createImageBitmap(blob);
    }

    update(dt) {
        let action;
        while ((action = this.input.consumeAction())) {
            this.bus.emit('log:message', { text: `Action: ${action}`, category: 'input' });
            // Here we would handle the action
        }
    }

    render(dt) {
        if (!this.canvas) return;
        this.canvas.clear();
        this.canvas.drawString(1, 1, "MEGADUNGEON", "#ffcc88");
        this.canvas.drawString(1, 3, "Step 1.4 Implementation Verified.", "#00ff00");
        this.canvas.drawString(1, 5, "Press any bound key (WASD, Arrows, etc).", "#ccc");
        this.canvas.drawString(1, 6, "Check the browser's developer console for action logs.", "#ccc");
    }
}

// --- Entry Point ---
// This ensures the DOM is loaded before we try to find the canvas.
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.init().catch(console.error);
});
