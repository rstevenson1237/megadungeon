// What the run remembers of the villages and the economy (Spec 07, task 2.11): the bank, the villages visited, the
// specialists that joined one, the quests, the shops' stock and the rumours heard. A plain, serialisable object that
// lives on the player so the dungeon can reach it (a kill that meets a quest goal, a captive freed); Spec 09 saves it.

import type { Item } from '../rules/items/types.ts';
import type { Service } from '../rules/villages/services.ts';
import type { SpecialistService } from '../rules/world/run-layout.ts';

/** A freed captive who follows the player (Spec 04): a quest's captive, or a specialist to deliver. */
export interface Escort {
  name: string;
  /** Hits left before it dies; a blow meant for the player may fall on it. */
  dice: number;
  quest?: string;
  service?: SpecialistService;
}

export type QuestStatus = 'active' | 'paid' | 'failed' | 'abandoned';

export interface TownState {
  /** The one balance every village shares (Spec 07). A new character starts with 20 gp. */
  bank: number;
  /** Depths of the villages the player has stood in; the surface is 0. The lift links them. */
  visited: number[];
  /** Specialists delivered: for each service, the village depths it was added to. */
  joined: Partial<Record<Service, number[]>>;
  /** A quest the player has taken or finished, by id; an id not here is still on its board. */
  quests: Record<string, QuestStatus>;
  /** Quest goals met in the dungeon that need no delivery: an opponent killed. */
  goals: string[];
  /** Each village's shop stock as rolled at the rest count it was rolled for. */
  shops: Record<number, { rest: number; items: Item[] }>;
  /** The last rumour each tavern told and the rest count it was bought at. */
  rumours: Record<number, { rest: number; text: string }>;
  /** Keys of the template phrasings already shown, so rumours and quests do not repeat while others are unseen. */
  seen: string[];
  /** The lift keeper's token has been taken (Spec 02): fares are cheaper for the rest of the run. */
  liftToken: boolean;
  escorts: Escort[];
}

export const STARTING_BANK = 20;

export const freshTown = (): TownState => ({
  bank: STARTING_BANK,
  visited: [0],
  joined: {},
  quests: {},
  goals: [],
  shops: {},
  rumours: {},
  seen: [],
  liftToken: false,
  escorts: [],
});

/** Take a quest's entry out of the journal (when it is abandoned or has failed). */
export function dropQuestEntry(journal: { kind: string; id: string }[], id: string): void {
  const at = journal.findIndex((e) => e.kind === 'quest' && e.id === id);
  if (at >= 0) journal.splice(at, 1);
}

/** A quest fails, unless it has been paid. Returns whether it failed now. */
export function failQuest(town: TownState, journal: { kind: string; id: string }[], id: string): boolean {
  if (town.quests[id] === 'paid' || town.quests[id] === 'failed') return false;
  town.quests[id] = 'failed';
  dropQuestEntry(journal, id);
  return true;
}
