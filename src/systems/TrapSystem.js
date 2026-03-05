// src/systems/TrapSystem.js
import { rollDiceStr, rollDie, statModifier } from '../engine/rules.js';
import { SkillSystem } from './SkillSystem.js';

export class TrapSystem {
    constructor(eventBus) {
        this.bus = eventBus;
    }
    
    /**
     * Called when player moves onto a tile. Checks for trap and resolves.
     * @param {Object} tile - The tile the player moved onto.
     * @param {Player} player - The player entity.
     * @returns {boolean} True if a trap triggered.
     */
    checkTile(tile, player) {
        const trap = tile.features?.trap;
        if (!trap || trap.triggered) return false;
        
        // Detection check
        if (SkillSystem.check(player, "trap_handling", trap.detectDC, () => rollDie(20))) {
            this.bus.emit('log:message', {
                text: `You notice a trap! ${trap.hint ?? 'Something is wrong here.'}`,
                category: 'trap'
            });
            trap.detected = true;
            return false; // Detected, not triggered — player can choose to disarm
        }
        
        // Trigger check
        if (Math.random() > trap.triggerChance) return false;
        
        // Trap triggers
        return this.trigger(trap, player);
    }
    
    trigger(trap, player) {
        trap.triggered = true;
        this.bus.emit('trap:trigger', { trap, victim: player });
        this.bus.emit('log:message', {
            text: `${trap.name}! ${trap.description}`,
            category: 'trap'
        });
        
        const effect = trap.effect;
        switch (effect.type) {
            case 'damage': {
                let dmg = rollDiceStr(effect.damage);
                const saved = this._rollSave(player, effect.save);
                if (saved && effect.saveType === 'half') dmg = Math.floor(dmg / 2);
                if (saved && effect.saveType === 'negate') dmg = 0;
                if (dmg > 0) {
                    player.hp = Math.max(0, player.hp - dmg);
                    this.bus.emit('log:message', {
                        text: `You take ${dmg} damage!${saved ? ' (saved)' : ''}`,
                        category: 'danger'
                    });
                }
                break;
            }
            case 'poison': {
                const saved = this._rollSave(player, effect.save);
                if (!saved) {
                    const dmg = rollDiceStr(effect.damage);
                    player.hp = Math.max(0, player.hp - dmg);
                    this.bus.emit('log:message', {
                        text: `Poison! You take ${dmg} damage and feel weakened.`,
                        category: 'danger'
                    });
                } else {
                    this.bus.emit('log:message', {
                        text: 'You resist the poison!',
                        category: 'trap'
                    });
                }
                break;
            }
            case 'teleport': {
                this.bus.emit('log:message', {
                    text: 'The world lurches around you!',
                    category: 'trap'
                });
                // Return special flag — Game.js handles actual teleportation
                return { teleport: true };
            }
            case 'fall': {
                const dmg = rollDiceStr(effect.damage.replace('_per_10ft', ''));
                player.hp = Math.max(0, player.hp - dmg);
                this.bus.emit('log:message', {
                    text: `You fall into a pit! ${dmg} damage!`,
                    category: 'danger'
                });
                break;
            }
        }
        
        if (player.hp <= 0) {
            this.bus.emit('player:death', { cause: trap.name });
        }
        return true;
    }
    
    /**
     * Attempt to disarm a detected trap.
     */
    disarm(trap, player) {
        if (SkillSystem.check(player, "trap_handling", trap.disarmDC, () => rollDie(20))) {
            trap.triggered = true; // Mark as neutralized
            this.bus.emit('log:message', {
                text: `You carefully disarm the ${trap.name}.`,
                category: 'trap'
            });
            return true;
        } else {
            this.bus.emit('log:message', {
                text: `You fail to disarm the trap!`,
                category: 'danger'
            });
            // Failed disarm triggers the trap
            this.trigger(trap, player);
            return false;
        }
    }
    
    _rollSave(entity, saveType) {
        const threshold = entity.class?.savingThrows?.[saveType] ?? 15;
        return rollDie(20) >= threshold;
    }
}
