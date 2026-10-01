import { describe, expect, it } from 'vitest';
import { Shell } from '../src/ui/shell.ts';
import type { PlayerState } from '../src/game/game.ts';
import { buyPrice, sellPrice } from '../src/rules/items/prices.ts';
import { gear, magic, press, screenText, testCharacter, townRun } from './helpers.ts';

const shown = (shell: Shell, s: string): boolean => screenText(shell).some((l) => l.includes(s));
const logText = (shell: Shell): string => shell.log.lines(shell.turn).map((l) => l.text).join(' | ');
const shellFor = (extra: Partial<PlayerState> = {}, at = 0, seed = 12345): Shell => {
  const shell = new Shell('', testCharacter());
  shell.setRun(townRun(seed, extra, at));
  return shell;
};
/** Choose the row of the open list that contains the text, by moving down to it. */
function choose(shell: Shell, label: string): void {
  for (let i = 0; i < 40; i++) {
    const row = screenText(shell).find((l) => l.includes(`> `) && l.includes(label));
    if (row) return void press(shell, 'Enter');
    press(shell, 's');
  }
  throw new Error(`no row "${label}"`);
}

describe('Spec 01 and 07: the village screens', () => {
  it('the village menu lists the services present, with the bank balance, and Go down', () => {
    const shell = shellFor();
    for (const name of ['Surface Village', 'Bank', 'Lodging', 'Lift', 'Shop', 'Appraiser', 'Smith', 'Tavern', 'Go down', 'Bank 20 gp']) expect(shown(shell, name), name).toBe(true);
  });

  it('a subterranean village lists Go up as well and only the services it has', () => {
    const shell = shellFor({}, 3);
    const services = shell.run!.town.services();
    expect(shown(shell, 'Go up')).toBe(true);
    expect(shown(shell, 'Bank')).toBe(true);
    for (const [service, label] of [['shop', 'Shop'], ['appraiser', 'Appraiser'], ['smith', 'Smith'], ['tavern', 'Tavern']] as const) {
      expect(screenText(shell).some((l) => l.trim() === label || l.includes(`  ${label} `) || l.includes(`> ${label}`) || l.includes(`  ${label}`.padEnd(8)))).toBe(services.includes(service));
    }
  });

  it('the bank deposits carried coins, shows the XP gained in the log and the pane, and Esc returns to the menu', () => {
    const shell = shellFor({ coins: 150 });
    choose(shell, 'Bank');
    expect(shown(shell, 'Deposit all carried treasure')).toBe(true);
    expect(shown(shell, '150 gp')).toBe(true);
    press(shell, 'Enter');
    expect(logText(shell)).toContain('You deposit 150 gp and earn 150 XP.');
    expect(shell.character.bank).toBe(170);
    expect(shell.character.xp).toBe(150);
    press(shell, 'Escape');
    expect(shell.overlays).toHaveLength(0);
  });

  it('a deposit across thresholds opens one level-up screen per level, in order, each giving a full die in the pool chosen', () => {
    const shell = shellFor({ coins: 4100 });
    const run = shell.run!;
    const skill = run.player.skill.max;
    choose(shell, 'Bank');
    press(shell, 'Enter');
    expect(shown(shell, 'You reach level 2')).toBe(true);
    choose(shell, 'Skill');
    expect(run.character.level).toBe(2);
    expect(run.player.skill.max).toBe(skill + 1);
    expect(shell.character.level).toBe(2);
    expect(shown(shell, 'You reach level 3')).toBe(true);
    choose(shell, 'Combat');
    expect(run.character.level).toBe(3);
    expect(run.levelsOwed).toBe(0);
    expect(shell.overlays.some((o) => o.constructor.name === 'LevelUpMenu')).toBe(false);
    expect(logText(shell)).toContain('You reach level 3.');
  });

  it('lodging asks 10 gp at the surface, restores the dice and tells the player it saved', () => {
    const shell = shellFor({ combatDice: 0 });
    choose(shell, 'Lodging');
    expect(shown(shell, '10 gp')).toBe(true);
    press(shell, 'Enter');
    expect(shell.run!.player.combatDice).toBe(shell.run!.player.combatMax);
    expect(shell.run!.player.town.bank).toBe(10);
    expect(logText(shell)).toContain('You wake rested.');
  });

  it('a service the balance cannot cover is refused in the log', () => {
    const shell = shellFor();
    shell.run!.player.town.bank = 4;
    choose(shell, 'Lodging');
    press(shell, 'Enter');
    expect(logText(shell)).toContain('bank holds only 4 gp');
    expect(shell.run!.player.town.bank).toBe(4);
  });

  it('the shop lists stock with prices; buying takes the price from the bank and puts the item in the pack', () => {
    const shell = shellFor();
    shell.run!.player.town.bank = 500;
    choose(shell, 'Shop');
    choose(shell, 'Buy');
    expect(shown(shell, 'Long sword')).toBe(true);
    choose(shell, 'Long sword');
    const sword = shell.run!.player.pack.find((i) => i.id === 'long_sword')!;
    expect(sword).toBeDefined();
    expect(shell.run!.player.town.bank).toBe(500 - buyPrice(sword, 0));
    expect(logText(shell)).toContain('You buy');
  });

  it('selling lists what is carried with the 50% price, and pays the bank without XP', () => {
    const shell = shellFor({ pack: [gear('long_sword', 'normal')] });
    choose(shell, 'Shop');
    choose(shell, 'Sell');
    expect(shown(shell, 'Long sword (Normal)')).toBe(true);
    press(shell, 'Enter');
    expect(shell.run!.player.town.bank).toBe(20 + sellPrice(gear('long_sword', 'normal')));
    expect(shell.character.xp).toBe(0);
  });

  it('the appraiser identifies an unknown item for 100 gp, and the smith repairs a broken one', () => {
    const ring = magic('ring_might', false);
    const shell = shellFor({ pack: [ring, gear('mace', 'normal', { broken: true })] });
    shell.run!.player.town.bank = 1000;
    choose(shell, 'Appraiser');
    choose(shell, 'Identify an item');
    press(shell, 'Enter');
    expect(logText(shell)).toContain('Ring of Might');
    expect(shell.run!.player.town.bank).toBe(900);
    press(shell, 'Escape');
    press(shell, 'Escape');
    choose(shell, 'Smith');
    expect(shown(shell, 'Mace (Broken)')).toBe(true);
    press(shell, 'Enter');
    expect(logText(shell)).toContain('The smith mends your mace');
  });

  it('the tavern sells a rumour, shows the quest board, takes a quest and lists it to abandon', () => {
    const shell = shellFor({}, 0, 10);
    shell.run!.player.town.bank = 1000;
    choose(shell, 'Tavern');
    choose(shell, 'Quest board');
    const quest = shell.run!.town.board()[0]!;
    expect(shown(shell, 'Reward')).toBe(true);
    press(shell, 'Enter');
    expect(shell.run!.player.town.quests[quest.quest.id]).toBe('active');
    press(shell, 'Escape');
    choose(shell, 'Your quests');
    expect(shown(shell, 'abandon')).toBe(true);
    press(shell, 'Enter');
    expect(shell.run!.player.town.quests[quest.quest.id]).toBe('abandoned');
  });

  it('the journal lists quests taken and offers to abandon one with Enter', () => {
    const shell = shellFor({}, 0, 10);
    const quest = shell.run!.town.board()[0]!;
    shell.run!.town.take(quest.quest.id);
    press(shell, 'j');
    expect(shown(shell, 'Quest:')).toBe(true);
    expect(shown(shell, 'Enter abandon a quest')).toBe(true);
    press(shell, 'Enter');
    expect(shown(shell, 'Abandon a quest')).toBe(true);
    press(shell, 'Enter');
    expect(shell.run!.player.town.quests[quest.quest.id]).toBe('abandoned');
  });

  it('the lift lists visited villages with fares, hides the others, and a ride arrives in the new village', () => {
    const shell = shellFor();
    const run = shell.run!;
    const second = run.layout!.villages[1]!.level;
    choose(shell, 'Lift');
    expect(shown(shell, 'No other village has been visited yet.')).toBe(true);
    press(shell, 'Escape');
    run.player.town.visited.push(second);
    run.player.town.bank = 5000;
    choose(shell, 'Lift');
    expect(shown(shell, `level ${second}`)).toBe(true);
    press(shell, 'Enter');
    expect(run.depth).toBe(second);
    expect(shell.title).toContain(`Level ${second}`);
    expect(shell.overlays).toHaveLength(0);
    expect(logText(shell)).toContain('The lift stops.');
  });

  it('Go down from the village leaves it for level 1', () => {
    const shell = shellFor();
    choose(shell, 'Go down');
    expect(shell.run!.depth).toBe(1);
    expect(shell.game).not.toBeNull();
  });
});
