import { MONSTERS } from "../data/monsters.js";

export const MonsterGroups = {
  roll(level, theme, rng) {
    const monsterKey = rng.weightedPick(
      Object.entries(theme.monsterWeights).map(([k, w]) => ({ value: k, weight: w }))
    );
    const def = MONSTERS[monsterKey];
    if (!def) return { members: [{ type: "goblin" }], treasureChance: 0.3 };

    // Group size: social monsters travel in packs
    const groupSize = def.tags?.includes("social")
      ? rng.int(2, 4) : rng.int(1, 2);
    const members = Array.from({ length: groupSize },
      () => ({ type: monsterKey }));
    const treasureChance = 0.2 + (level * 0.03);
    return { members, treasureChance };
  }
};
