// Message log types (Spec 01, "Message log"). Rules return these; only the UI draws them.

/** Colour category of a message. */
export type LogKind = 'combat' | 'loot' | 'discovery' | 'rumour' | 'warning' | 'system';

export interface LogMessage {
  kind: LogKind;
  text: string;
}
