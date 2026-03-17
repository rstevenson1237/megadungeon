/**
 * This file contains templates for procedurally generating quests.
 */

export const QUEST_TEMPLATES = {
    kill: {
        generate: (depth, rng) => {
            const count = rng.int(5, 10);
            const target = 'goblin';
            return {
                type: 'kill',
                title: `Slay the Goblins on Level ${depth}`,
                description: `A group of goblins has been causing trouble on level ${depth}. Clear them out.`,
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
            const target = 'ancient_key';
            return {
                type: 'fetch',
                title: `Recover the Lost Artifact`,
                description: `A valuable artifact was lost on level ${depth}. Find it and bring it back.`,
                target,
                state: { recovered: false },
                reward: { xp: 150 * depth, gold: 75 * depth },
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
            const targetNPC = 'lost_merchant';
            return {
                type: 'rescue',
                title: `Rescue the Captive`,
                description: `A merchant was taken to level ${depth}. Find them and bring them back to the surface.`,
                targetNPC,
                state: { found: false, returned: false },
                reward: { xp: 400 * depth, gold: 200 * depth },
                completionCondition: (state, player, world) => state.returned,
            };
        },
    },
};
