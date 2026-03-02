/**
 * Handles serialization and persistence.
 * Uses localStorage for quick saves and IndexedDB for full run history.
 */
export class SaveManager {
  static SAVE_KEY = 'megadungeon_save';
  static HISTORY_DB = 'megadungeon_history';

  /** Serialize game state to JSON and store in localStorage */
  static quickSave(gameState) {
    try {
      const serialized = JSON.stringify(gameState.serialize());
      localStorage.setItem(this.SAVE_KEY, serialized);
      return true;
    } catch (e) {
      console.error('Save failed:', e);
      return false;
    }
  }

  static quickLoad() {
    const raw = localStorage.getItem(this.SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  static hasSave() {
    return !!localStorage.getItem(this.SAVE_KEY);
  }

  static deleteSave() {
    localStorage.removeItem(this.SAVE_KEY);
  }

  /** Record completed run to IndexedDB for statistics/history */
  static async recordRun(runSummary) {
    const db = await this._openDB();
    const tx = db.transaction('runs', 'readwrite');
    tx.objectStore('runs').add({ ...runSummary, date: Date.now() });
  }

  static _openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.HISTORY_DB, 1);
      req.onupgradeneeded = e => {
        e.target.result.createObjectStore('runs', { autoIncrement: true });
      };
      req.onsuccess = e => resolve(e.target.result);
      req.onerror   = e => reject(e.target.error);
    });
  }
}
