import type { App } from '../../src/ui/app.ts';
import { creature } from '../../src/game/monsters.ts';
import { isClear } from '../../src/game/map-state.ts';
import { validTargets } from '../../src/game/targeting.ts';

// The check pages' helpers on the whole game (tasks 5.5 and 6.10): clear the level of creatures, and put one in the
// player's sight and take it away again, so a check can target something on any generated level.

export function installHooks(app: App): void {
  /** Take every creature off the level, so nothing interrupts the check. */
  function calm(): void {
    const game = app.clock?.game;
    if (game) game.state.monsters.length = 0;
  }

  /** Put an asleep goblin, the only creature, on the nearest cell the readied weapon could shoot at; false when there is none. */
  function placeTarget(): boolean {
    const game = app.clock?.game;
    if (!game) return false;
    calm();
    const { player, level } = game.state.map;
    for (let r = 2; r <= 4; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = player.x + dx;
          const y = player.y + dy;
          if (x < 0 || y < 0 || x >= level.width || y >= level.height || !isClear(game.state.map, x, y) || game.monsterAt(x, y)) continue;
          const goblin = creature({ id: 999_999, name: 'goblin', glyph: 'g', colour: 0x7fc75a, x, y, dice: 1, modifier: 0, awareness: 'asleep' });
          game.state.monsters.push(goblin);
          if (validTargets(game, game.ranged()?.range ?? 0).includes(goblin)) return true;
          game.state.monsters.pop();
        }
      }
    }
    return false;
  }

  /** Take the placed goblin off the level, as if it died. */
  function removeTarget(): void {
    const monsters = app.clock?.game?.state.monsters;
    const i = monsters?.findIndex((m) => m.id === 999_999) ?? -1;
    if (i >= 0) monsters!.splice(i, 1);
  }

  Object.assign(window, { harness: { calm, placeTarget, removeTarget } });
}
