// The leaderboard (Spec 09, "Leaderboard"): every character that dies or wins, kept in local storage, sorted by the
// deepest level reached and then the score, the best 100 kept. A character who dies after winning updates their entry
// rather than adding a second one.

/** The two methods of the browser's local storage that the board needs. */
export interface TextStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export class MemoryStorage implements TextStorage {
  readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

export type Outcome = 'died' | 'reached_100' | 'final_boss';

export interface BoardEntry {
  /** One per character: a later entry for the same character updates it. */
  id: string;
  seed: number;
  /** The date, when the seed was the seed of the day. */
  daily?: string;
  name: string;
  className: string;
  /** The level the character reached. */
  level: number;
  /** The lowest dungeon level reached on foot or by teleporter. */
  deepest: number;
  kills: number;
  /** Total XP, including XP past level 10. */
  score: number;
  outcome: Outcome;
  /** How and where the character died, if they did (also after a win). */
  cause?: string;
  diedAtLevel?: number;
  /** When the entry was made. */
  date: string;
}

export const BOARD_KEY = 'megadungeon.leaderboard';
export const BOARD_SIZE = 100;

/** Deepest first, then the higher score. */
export const byRank = (a: BoardEntry, b: BoardEntry): number => b.deepest - a.deepest || b.score - a.score;

/** How much better an outcome is: reaching level 100 and the final boss outrank dying. */
const RANK: Record<Outcome, number> = { died: 0, reached_100: 1, final_boss: 2 };

export class Leaderboard {
  constructor(private readonly storage: TextStorage) {}

  all(): BoardEntry[] {
    try {
      const parsed = JSON.parse(this.storage.getItem(BOARD_KEY) ?? '[]') as unknown;
      return Array.isArray(parsed) ? (parsed as BoardEntry[]) : [];
    } catch {
      return [];
    }
  }

  /** The entries in rank order: all runs, or only those of the seed of a given day. */
  view(view: 'all' | { daily: string } = 'all'): BoardEntry[] {
    const entries = this.all();
    return (view === 'all' ? entries : entries.filter((e) => e.daily === view.daily)).sort(byRank);
  }

  /**
   * Write an entry, or update the character's own. An update keeps the better outcome (a win is not undone by dying
   * later), and takes the latest numbers. The best 100 are kept.
   */
  record(entry: BoardEntry): BoardEntry {
    const entries = this.all();
    const at = entries.findIndex((e) => e.id === entry.id);
    let written = entry;
    if (at >= 0) {
      const old = entries[at]!;
      const better = RANK[entry.outcome] >= RANK[old.outcome] ? entry.outcome : old.outcome;
      written = { ...old, ...entry, outcome: better, deepest: Math.max(old.deepest, entry.deepest), date: entry.date };
      if (entry.outcome !== 'died' && old.cause !== undefined && entry.cause === undefined) {
        written.cause = old.cause;
        if (old.diedAtLevel !== undefined) written.diedAtLevel = old.diedAtLevel;
      }
      entries[at] = written;
    } else entries.push(entry);
    entries.sort(byRank);
    this.storage.setItem(BOARD_KEY, JSON.stringify(entries.slice(0, BOARD_SIZE)));
    return written;
  }
}
