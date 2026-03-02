// src/data/town.js - Stub for World Map Step 2.1 (createInitialTownState)
// This file will contain TOWN_LOCATIONS definition in a later phase.

export const createInitialTownState = () => {
    console.log("Stub: Creating initial town state.");
    return {
        // Placeholder for town-related data
        name: "Homestead",
        merchants: [],
        quests: [],
        // ...
    };
};

// Stub for THEMES, needed by LevelGen. Will be expanded in Step 2.3
export const THEMES = {
  default_theme: {
    minRoomW: 5, maxRoomW: 10, minRoomH: 5, maxRoomH: 10
  }
};
