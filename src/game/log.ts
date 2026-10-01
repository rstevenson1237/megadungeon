// The message log (Spec 01, "Message log"): newest at the bottom, repeats
// collapse into a count, long lines wrap, 200 lines of history are kept.

import type { LogKind, LogMessage } from '../core/log.ts';

export const LOG_WIDTH = 70;
export const LOG_HISTORY = 200;

export interface LogLine {
  text: string;
  kind: LogKind;
  /** True for messages from the current turn (drawn bright); older ones draw dim. */
  current: boolean;
}

interface Entry {
  kind: LogKind;
  text: string;
  count: number;
  /** Turn of the latest occurrence. */
  turn: number;
}

/** Break text into lines of at most `width` cells, at spaces where possible. */
export function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (let word of text.split(' ')) {
    while (word.length > width) {
      if (line) {
        lines.push(line);
        line = '';
      }
      lines.push(word.slice(0, width));
      word = word.slice(width);
    }
    if (line === '') line = word;
    else if (line.length + 1 + word.length <= width) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}

export class MessageLog {
  private entries: Entry[] = [];

  /**
   * Add a message made on `turn`. The same message as the one just before it,
   * on the same or the next turn, is not repeated: its count goes up instead,
   * so waiting six turns reads "You wait. (x6)".
   */
  add(message: LogMessage, turn: number): void {
    const last = this.entries[this.entries.length - 1];
    if (last && last.kind === message.kind && last.text === message.text && turn - last.turn <= 1) {
      last.count++;
      last.turn = turn;
      return;
    }
    this.entries.push({ kind: message.kind, text: message.text, count: 1, turn });
    this.trim();
  }

  private lineCount(): number {
    return this.entries.reduce((n, e) => n + wrapText(label(e), LOG_WIDTH).length, 0);
  }

  // Drop the oldest messages until the history fits in 200 lines.
  private trim(): void {
    while (this.entries.length > 1 && this.lineCount() > LOG_HISTORY) this.entries.shift();
  }

  /** Every history line, oldest first. */
  lines(currentTurn: number): LogLine[] {
    return this.entries.flatMap((e) =>
      wrapText(label(e), LOG_WIDTH).map((text) => ({ text, kind: e.kind, current: e.turn === currentTurn })),
    );
  }

  /** The newest `count` lines, oldest first. */
  tail(count: number, currentTurn: number): LogLine[] {
    return this.lines(currentTurn).slice(-count);
  }
}

const label = (e: Entry): string => (e.count > 1 ? `${e.text} (x${e.count})` : e.text);
