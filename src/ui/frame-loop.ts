// The frame loop of real time (Spec 01, Addendum B): each animation frame turns the time since the last one into
// ticks and has the game advance them. Game time is ticks, never milliseconds (Spec 04, Addendum B), so a slow frame,
// a pause or a fast-forward changes only when things are shown, never what happens.

/** A tick is 50 ms of play at normal pace. */
export const TICK_MS = 50;
/** Z in real time runs at four times speed: a tick every 12.5 ms. */
export const FAST_TICK_MS = TICK_MS / 4;
/** At most 4 ticks a frame: a slow or stalled frame slows the game rather than jumping it ahead. */
export const MAX_TICKS_PER_FRAME = 4;

/** What the loop drives: the shell of a real-time run. */
export interface Clocked {
  /** Whether ticks run now: false in turn mode, in a village, while paused, under an overlay, and once the player is dead. */
  readonly ticking: boolean;
  /** How long a tick lasts now: 50 ms, or 12.5 ms while Z fast-forwards. */
  readonly tickMs: number;
  /** Let the ticks pass; it stops early if time stops. */
  advance(ticks: number): void;
}

export class FrameLoop {
  /** The time of the last frame that counted, or null when time was stopped, so a pause never counts. */
  private last: number | null = null;
  /** Milliseconds counted but not yet a whole tick. */
  private owed = 0;

  constructor(
    /** The shell to drive now, or null when no run is on screen (the title, a death, the leaderboard). */
    private readonly target: () => Clocked | null,
    /** Draw the screen again: after any frame in which a tick ran. */
    private readonly redraw: () => void,
  ) {}

  /** One animation frame at `now` (milliseconds, as `requestAnimationFrame` gives it). Returns the ticks run. */
  frame(now: number): number {
    const clock = this.target();
    if (!clock?.ticking) {
      this.last = null;
      this.owed = 0;
      return 0;
    }
    if (this.last === null) {
      // Time starts or resumes: count from this frame on.
      this.last = now;
      return 0;
    }
    this.owed += Math.max(0, now - this.last);
    this.last = now;
    let ticks = Math.floor(this.owed / clock.tickMs);
    if (ticks > MAX_TICKS_PER_FRAME) {
      ticks = MAX_TICKS_PER_FRAME;
      this.owed = 0; // the rest is dropped, not caught up later
    } else {
      this.owed -= ticks * clock.tickMs;
    }
    if (ticks === 0) return 0;
    clock.advance(ticks);
    this.redraw();
    return ticks;
  }
}
