import { SPELLS } from '../data/spells.js';
import { TurnUndeadTable } from '../data/tables.js';
import { rollDiceStr, rollDie } from '../engine/rules.js';
import { StatusSystem } from './StatusSystem.js';

// Stub for rollSave, should be in rules.js or similar
function rollSave(entity, saveType) {
  const threshold = entity.class?.savingThrows?.[saveType]
    ?? entity.def?.savingThrows?.[saveType]
    ?? 15;
  return rollDie(20) >= threshold;
}

/**
 * Resolves spell casting and effects.
 */
export class MagicSystem {
  constructor(eventBus, worldMap) {
    this.bus = eventBus;
    this.worldMap = worldMap;
  }

  /**
   * Attempt to cast a spell. Validates MP, applies effects.
   * @returns {{ success, message, targets }}
   */
  cast(caster, spellKey, targetPos) {
    const spell = SPELLS[spellKey];
    if (!spell) return { success: false, message: 'Unknown spell.' };
    if (caster.mp < spell.mpCost) return { success: false, message: 'Not enough mana.' };
    
    const map = this.worldMap.getLevel(caster.depth);
    if (!this._inRange(caster, targetPos, spell.range, map)) {
        return { success: false, message: 'Out of range.' };
    }

    caster.mp -= spell.mpCost;
    const targets = this._resolveTargets(caster, targetPos, spell, map);
    const results = targets.map(t => this._applyEffect(caster, t, spell));

    this.bus.emit('spell:cast', { caster, spell, targets, results });
    return { success: true, targets, results };
  }

  _inRange(caster, targetPos, rangeStr, map) {
      if (rangeStr === 'self' || rangeStr === 'touch') {
          return caster.x === targetPos.x && caster.y === targetPos.y;
      }
      if (rangeStr === 'sight') {
          const targetTile = map.get(targetPos.x, targetPos.y);
          return targetTile && targetTile.visible;
      }
      const range = parseInt(rangeStr);
      const dist = Math.hypot(caster.x - targetPos.x, caster.y - targetPos.y);
      return dist <= range;
  }

  _entitiesInRadius(pos, radius, map) {
      const entities = [];
      for(let y = pos.y - radius; y <= pos.y + radius; y++) {
          for(let x = pos.x - radius; x <= pos.x + radius; x++) {
              if (map.inBounds(x, y)) {
                  const dist = Math.hypot(pos.x - x, pos.y - y);
                  if (dist <= radius) {
                      entities.push(...map.getEntitiesAt(x, y));
                  }
              }
          }
      }
      return entities;
  }

  _resolveTargets(caster, pos, spell, map) {
    switch (spell.area) {
      case 'single':
        return map.getEntitiesAt(pos.x, pos.y).filter(e => e !== caster);
      case 'burst:15ft':
      case 'burst:20ft': {
        const radius = parseInt(spell.area.split(':')[1]) / 5; // 5ft per tile
        return this._entitiesInRadius(pos, radius, map).filter(e => e !== caster);
      }
      case 'all_visible':
        return [...map.entities.values()].flat().filter(e => {
            if (e === caster) return false;
            const tile = map.get(e.x, e.y);
            return tile && tile.visible;
        });
      case 'all_allies_in_burst:15ft': {
          const radius = 15 / 5;
          // Simple alignment check for 'ally' for now
          return this._entitiesInRadius(pos, radius, map).filter(e => e.alignment === caster.alignment);
      }
      default:
        return [];
    }
  }

  _applyEffect(caster, target, spell) {
    const effect = spell.effect;
    const saved  = spell.save !== 'none' && rollSave(target, spell.save);

    switch (effect.type) {
      case 'damage': {
        let dmg = rollDiceStr(effect.dice.replace('level', caster.level + ''));
        if(effect.extraMissilePerLevel) {
            const extraCount = Math.floor((caster.level - 1) / effect.extraMissilePerLevel);
            for(let i=0; i<extraCount; i++) {
                dmg += rollDiceStr(effect.dice.replace('level', '1'));
            }
        }
        if (saved && spell.saveEffect === 'half') dmg = Math.floor(dmg / 2);
        if (!saved || spell.saveEffect !== 'negate') {
          target.hp -= Math.max(0, dmg - (target.resistance?.[effect.element] ?? 0));
        }
        return { target, effect: 'damage', value: dmg, saved };
      }
      case 'heal': {
        const healed = rollDiceStr(effect.dice);
        target.hp = Math.min(target.hp + healed, target.hpMax);
        return { target, effect: 'heal', value: healed };
      }
      case 'sleep': {
        if (target.hasTag('undead') || target.hasTag('construct')) return { target, effect: 'immune' };
        if (!saved) StatusSystem.apply(target, 'sleep', { duration: rollDiceStr('1d4+4') });
        return { target, effect: 'sleep', saved };
      }
      case 'turn': {
        const hd = target.def?.hd ?? 1;
        const turn = TurnUndeadTable[caster.level]?.[hd-1];
        if (turn === 'T') StatusSystem.apply(target, 'flee', { duration: 10 });
        if (turn === 'D') target.hp = 0; // Destroyed
        return { target, effect: 'turn', result: turn };
      }
      case 'light': {
          // This would be handled by a system that applies light sources to the map
          console.log(`Applying light effect at ${target.x}, ${target.y}`);
          return {target, effect: 'light'};
      }
      case 'detect': {
          // This would be handled by a system that reveals entities on the map
          console.log(`Detecting ${effect.target}`);
          return {target, effect: 'detect'};
      }
      case 'buff': {
          StatusSystem.apply(target, 'buff', { stat: effect.stat, value: effect.value, duration: 10 /* temp */ });
          return {target, effect: 'buff'};
      }
    }
  }
}
