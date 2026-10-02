// The connective elements that change play (Spec 02, Addendum A; task 3.10): the named rival, who carries its loot from
// one appearance to the next and leaves its journal when killed; a lore chain whose last entry is a boss's weakness;
// and the artifact seals that weaken the final boss on level 100.

import { hash32 } from '../core/rng.ts';
import type { RollMode } from '../rules/character/dice.ts';
import type { BookItem } from '../rules/items/types.ts';
import type { Loot } from '../rules/world/level.ts';
import type { Link } from '../rules/world/run-layout.ts';
import { addLoot } from './combat.ts';
import type { Game, PlayerState } from './game.ts';
import type { Monster } from './monsters.ts';

/** What the named rival has done so far, kept on the player so it follows from level to level (Spec 02, Addendum A). */
export interface RivalArc {
  /** What it carries away from the last level it was left alive on, until it next appears. */
  carried: Loot[];
  /** The player attacked it: it is hostile at its later appearances. */
  hostile: boolean;
  /** It was killed: it never appears again. */
  dead: boolean;
}

const arcOf = (player: PlayerState, link: string): RivalArc => (player.rivals[link] ??= { carried: [], hostile: false, dead: false });

/**
 * The named rival on arrival: a dead one is gone from the level, a provoked one is hostile again, and a living one takes
 * up what it carried away from the last level it was left on.
 */
export function rivalsArrive(game: Game): void {
  const { monsters, player } = game.state;
  for (const m of monsters.slice()) {
    if (m.kind !== 'rival' || !m.link) continue;
    const arc = player.rivals[m.link];
    if (!arc) continue;
    if (arc.dead) {
      monsters.splice(monsters.indexOf(m), 1);
      continue;
    }
    if (arc.hostile) m.hostile = true;
    addLoot(m.carried, arc.carried);
    arc.carried = [];
  }
}

/** Leaving a level where the named rival is alive: what it carries goes with it to its next appearance. */
export function rivalsLeave(game: Game): void {
  const { monsters, player } = game.state;
  for (const m of monsters) {
    if (m.kind !== 'rival' || !m.link) continue;
    const arc = arcOf(player, m.link);
    arc.hostile ||= m.hostile;
    addLoot(arc.carried, m.carried);
    m.carried = [];
  }
}

/** The stash level of a rival link, from the run layout the game was given. */
const stashOf = (links: readonly Link[], link: string): number | undefined => {
  const found = links.find((l) => l.id === link);
  return found?.type === 'rival' ? found.stashLevel : undefined;
};

/** The rival's journal (a book): reading it adds a journal entry that names the stash's level (Spec 02, Addendum A). */
export function rivalJournal(game: Game, m: Monster): BookItem {
  const stash = stashOf(game.links, m.link!);
  const text =
    stash === undefined
      ? `${m.name}'s journal. The last pages are torn out.`
      : `${m.name}'s journal. The last page reads: "The rest of the haul is stashed on level ${stash}, where no one will look."`;
  return { kind: 'book', uid: hash32('rival-journal', game.runSeed >>> 0, m.link!), id: `rival_journal_${m.link}`, name: `${m.name}'s journal`, value: 0, text };
}

/** The named rival dies: it drops everything it carries with its journal, and never appears again. */
export function rivalDies(game: Game, m: Monster): void {
  if (m.kind !== 'rival' || !m.link) return;
  const arc = arcOf(game.state.player, m.link);
  addLoot(m.carried, arc.carried);
  arc.carried = [];
  arc.dead = true;
  m.carried.push({ kind: 'item', item: rivalJournal(game, m) });
}

/** The boss level a lore chain's last entry names, when that end is a boss's weakness. */
export function weaknessOf(links: readonly Link[], link: string): number | undefined {
  const found = links.find((l) => l.id === link);
  return found?.type === 'lore_chain' && found.end.kind === 'boss_weakness' ? found.end.level : undefined;
}

/**
 * A boss whose weakness the player has read rolls with disadvantage on every melee and ranged roll against the player
 * and on its defence against the player (Spec 02, Addendum A).
 */
export const weakMode = (game: Game, m: Monster): RollMode =>
  m.role === 'boss' && game.state.player.weaknesses.includes(game.state.map.level.depth) ? 'disadvantage' : 'normal';

/** Artifacts the player carries or wears. */
export function artifactsCarried(player: PlayerState): number {
  const worn = Object.values(player.equipment).filter((i) => i?.kind === 'artifact').length;
  return worn + player.pack.filter((i) => i.kind === 'artifact').length;
}

/**
 * The artifact seals (Spec 02, Addendum A): when the final boss first becomes alert it loses one die for each artifact
 * the player carries or wears, down to 1. The count is made once, and the log says so.
 */
export function breakSeals(game: Game, m: Monster): void {
  if (!m.final || m.sealed) return;
  m.sealed = true;
  const count = artifactsCarried(game.state.player);
  const lost = Math.min(count, Math.max(0, m.dice - 1));
  if (count === 0) return;
  m.dice -= lost;
  const name = m.kind === 'monster' ? `the ${m.name}` : m.name;
  const things = count === 1 ? 'artifact' : 'artifacts';
  game.queued.push({ kind: 'combat', text: `The seals of your ${count} ${things} burn against ${name}: it loses ${lost} ${lost === 1 ? 'die' : 'dice'}.` });
}
