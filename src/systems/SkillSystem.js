// src/systems/SkillSystem.js
export class SkillSystem {
  /**
   * Roll a skill check for an entity.
   * @param {Entity} entity
   * @param {string} skillKey  e.g. "trap_handling", "athletics"
   * @param {number} dc        Difficulty class
   * @param {function} rollFn  Injected die roller (default: d20)
   */
  static check(entity, skillKey, dc, rollFn = () => Math.floor(Math.random()*20)+1) {
    const rank = entity.skills?.[skillKey] ?? 0;
    const statKey = SkillSystem.SKILL_STAT[skillKey] ?? "int";
    const mod = Math.floor((entity.stats?.[statKey] ?? 10) - 10) >> 1;
    return rollFn() + rank + mod >= dc;
  }
}
SkillSystem.SKILL_STAT = {
  trap_handling: "dex", athletics: "str", stealth: "dex",
  persuasion: "cha", divine_lore: "wis", arcane_lore: "int",
};
