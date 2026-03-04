// src/systems/StatusSystem.js

export class StatusSystem {
    /**
     * Apply a status effect to an entity.
     */
    static apply(entity, statusKey, options = {}) {
        if (!entity.statuses) entity.statuses = [];
        
        // Check if already has this status — refresh duration if so
        const existing = entity.statuses.find(s => s.key === statusKey);
        if (existing) {
            existing.duration = Math.max(existing.duration, options.duration ?? 0);
            return;
        }
        
        const status = {
            key: statusKey,
            duration: options.duration ?? 0,  // 0 = permanent until removed
            acMod: options.acMod ?? 0,
            attackMod: options.attackMod ?? 0,
            damageMod: options.damageMod ?? 0,
            stat: options.stat ?? null,
            value: options.value ?? 0,
        };
        
        // Apply type-specific defaults
        switch (statusKey) {
            case 'poison':   status.acMod = 0; status.damagePerTurn = options.damage ?? 1; break;
            case 'sleep':    status.acMod = 4; break; // Easier to hit sleeping targets
            case 'prone':    status.acMod = 2; break;
            case 'blessed':  status.attackMod = 1; break;
            case 'cursed':   status.attackMod = -1; break;
            case 'haste':    status.speedMod = 1; break;
            case 'flee':     break;
            case 'paralysis': status.acMod = 4; break;
            case 'buff':     break;
        }
        
        entity.statuses.push(status);
    }
    
    /**
     * Tick all statuses on an entity at end of turn.
     * Returns array of expired status keys.
     */
    static tick(entity) {
        if (!entity.statuses) return [];
        const expired = [];
        
        for (const status of entity.statuses) {
            // Apply per-turn effects
            if (status.damagePerTurn) {
                entity.hp = Math.max(0, entity.hp - status.damagePerTurn);
            }
            
            // Decrement duration
            if (status.duration > 0) {
                status.duration--;
                if (status.duration <= 0) {
                    expired.push(status.key);
                }
            }
        }
        
        // Remove expired
        entity.statuses = entity.statuses.filter(s => !expired.includes(s.key));
        return expired;
    }
    
    /**
     * Remove a specific status effect.
     */
    static remove(entity, statusKey) {
        if (!entity.statuses) return;
        entity.statuses = entity.statuses.filter(s => s.key !== statusKey);
    }
    
    /**
     * Check if entity has a specific status.
     */
    static has(entity, statusKey) {
        return entity.statuses?.some(s => s.key === statusKey) ?? false;
    }
}
