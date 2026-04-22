/**
 * This file contains templates for procedurally generating quests.
 */

export const QUEST_TEMPLATES = {
    kill: {
        generate: (depth, rng) => {
            const monstersByDepth = depth <= 10  ? ['goblin', 'giant_rat', 'skeleton']
                                  : depth <= 25  ? ['orc', 'zombie', 'hobgoblin', 'warg']
                                  : depth <= 45  ? ['ghoul', 'wight', 'wraith', 'vampire_spawn']
                                  : depth <= 65  ? ['duergar', 'dark_dwarf_warrior', 'cave_troll']
                                  : depth <= 80  ? ['fire_elemental', 'shadow_demon', 'crystal_golem']
                                  :               ['void_wraith', 'phase_spider', 'rift_stalker'];
            const target = rng.pick(monstersByDepth);
            const count = rng.int(5, 10);
            const targetName = target.replace(/_/g, ' ');
            return {
                type: 'kill',
                title: `Slay ${count} ${targetName}s on Level ${depth}`,
                description: `A group of ${targetName}s has been causing trouble on level ${depth}. Clear them out.`,
                target,
                count,
                state: { killed: 0 },
                reward: { xp: 100 * depth, gold: 50 * depth },
                completionCondition: (state, player, world) => state.killed >= count,
            };
        },
    },
    fetch: {
        generate: (depth, rng) => {
            const fetchItems = depth <= 15 ? ['healing_potion', 'holy_symbol', 'torch']
                             : depth <= 40 ? ['potion_of_speed', 'scroll_magic_missile', 'ring_of_protection']
                             :               ['amulet_of_life_protection', 'ring_of_protection'];
            const target = rng.pick(fetchItems);
            const targetName = target.replace(/_/g, ' ');
            return {
                type: 'fetch',
                title: `Recover the ${targetName}`,
                description: `A ${targetName} was lost on level ${depth}. Find one and bring it back.`,
                target,
                state: { recovered: false },
                reward: { xp: 150 * depth, gold: 75 * depth, item: 'healing_potion' },
                completionCondition: (state, player, world) => state.recovered,
            };
        },
    },
    explore: {
        generate: (depth, rng) => {
            const targetDepth = depth;
            return {
                type: 'explore',
                title: `Explore to Level ${depth}`,
                description: `No one has ventured to level ${depth} and returned. Map the way.`,
                targetDepth,
                state: { reached: false },
                reward: { xp: 200 * depth },
                completionCondition: (state, player, world) => player.depth >= targetDepth,
            };
        },
    },
    clear: {
        generate: (depth, rng) => {
            const targetDepth = depth;
            return {
                type: 'clear',
                title: `Clear Level ${depth}`,
                description: `Level ${depth} is overrun. Eliminate all threats.`,
                targetDepth,
                state: { cleared: false },
                reward: { xp: 500 * depth, gold: 100 * depth },
                completionCondition: (state, player, world) => {
                    const map = world.getLevel(targetDepth);
                    if (!map) return false;
                    return ![...map.entities.values()].flat().some(e => e.type === 'monster');
                },
            };
        },
    },
    rescue: {
        generate: (depth, rng) => {
            const targetDepth = depth;
            return {
                type: 'rescue',
                title: `Rescue the Captive on Level ${depth}`,
                description: `A merchant was taken to level ${depth}. Search the area and return to the surface safely.`,
                targetDepth,
                state: { found: false, returned: false },
                reward: { xp: 400 * depth, gold: 200 * depth, item: 'ring_of_protection' },
                completionCondition: (state, player, world) => state.returned,
            };
        },
    },
};
