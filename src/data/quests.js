/**
 * Quest templates. Each has a generate(depth, rng) function returning a quest object.
 *
 * completionCondition(state, player, world, self) — `self` is the quest object,
 * which lets conditions reference top-level fields (e.g. self.required) safely
 * after serialization/hydration without relying on closures.
 */

// Monsters that reliably appear at each depth band, cross-referenced from themes.js.
function monstersAtDepth(depth) {
    if (depth <= 10) return ['goblin', 'giant_rat', 'skeleton', 'giant_spider'];
    if (depth <= 20) return ['goblin', 'orc', 'zombie', 'hobgoblin', 'warg'];
    if (depth <= 35) return ['orc', 'zombie', 'ghoul', 'skeleton', 'wight'];
    if (depth <= 45) return ['ghoul', 'wight', 'wraith', 'vampire_spawn'];
    if (depth <= 65) return ['duergar', 'dark_dwarf_warrior', 'cave_troll', 'duergar_sorcerer'];
    if (depth <= 80) return ['fire_elemental', 'water_elemental', 'earth_elemental', 'magma_sprite', 'crystal_golem'];
    return ['shadow_demon', 'void_wraith', 'phase_spider', 'void_hound', 'rift_stalker'];
}

export const QUEST_TEMPLATES = {

    // Kill N of a specific monster type on the target level.
    kill: {
        generate: (depth, rng) => {
            const target = rng.pick(monstersAtDepth(depth));
            const count  = rng.int(5, 10);
            const targetName = target.replace(/_/g, ' ');
            return {
                type: 'kill',
                title: `Slay ${count} ${targetName}s`,
                description: `A pack of ${targetName}s plagues level ${depth}. Clear them out.`,
                target,
                targetDepth: depth,
                count,
                state: { killed: 0 },
                reward: { xp: 100 * depth, gold: 50 * depth },
                completionCondition: (state, _p, _w, self) => state.killed >= self.count,
            };
        },
    },

    // Kill N monsters of any type on one specific level.
    bounty: {
        generate: (depth, rng) => {
            const count = rng.int(8, 15);
            return {
                type: 'bounty',
                title: `Monster Cull on Level ${depth}`,
                description: `The guild wants level ${depth} thinned out. Kill any ${count} monsters there.`,
                targetDepth: depth,
                count,
                state: { killed: 0 },
                reward: { xp: 80 * depth, gold: 45 * depth },
                completionCondition: (state, _p, _w, self) => state.killed >= self.count,
            };
        },
    },

    // Pick up a specific item anywhere in the dungeon.
    fetch: {
        generate: (depth, rng) => {
            const fetchItems = depth <= 15 ? ['healing_potion', 'holy_symbol', 'torch']
                             : depth <= 40 ? ['potion_of_speed', 'scroll_magic_missile', 'ring_of_protection']
                             :               ['amulet_of_life_protection', 'ring_of_protection'];
            const target     = rng.pick(fetchItems);
            const targetName = target.replace(/_/g, ' ');
            return {
                type: 'fetch',
                title: `Recover a ${targetName}`,
                description: `A ${targetName} was lost in the dungeon around level ${depth}. Find one and bring it back.`,
                target,
                targetDepth: depth,
                state: { recovered: false },
                reward: { xp: 150 * depth, gold: 75 * depth, item: 'healing_potion' },
                completionCondition: (state) => state.recovered,
            };
        },
    },

    // Return to the surface having earned at least `required` gold since accepting.
    tribute: {
        generate: (depth, rng) => {
            const required = Math.floor(depth * 40 + rng.int(50, 150));
            return {
                type: 'tribute',
                title: `Gold Tribute (${required}g)`,
                description: `Return to the surface having earned at least ${required} gold from level ${depth} and below.`,
                targetDepth: depth,
                required,
                state: { baseGold: null },
                reward: { xp: 100 * depth, gold: 25 * depth },
                completionCondition: (state, player, _w, self) =>
                    state.baseGold !== null && (player.gold - state.baseGold) >= self.required,
            };
        },
    },

    // Reach a depth for the first time.
    explore: {
        generate: (depth, _rng) => {
            return {
                type: 'explore',
                title: `Explore to Level ${depth}`,
                description: `No one has ventured to level ${depth} and returned. Map the way.`,
                targetDepth: depth,
                state: { reached: false },
                reward: { xp: 200 * depth },
                completionCondition: (_s, player, _w, self) => player.depth >= self.targetDepth,
            };
        },
    },

    // Eliminate every monster on a target level.
    clear: {
        generate: (depth, _rng) => {
            return {
                type: 'clear',
                title: `Clear Level ${depth}`,
                description: `Level ${depth} is overrun. Eliminate every threat.`,
                targetDepth: depth,
                state: { cleared: false },
                reward: { xp: 500 * depth, gold: 100 * depth },
                completionCondition: (_s, _p, world, self) => {
                    const map = world.getLevel(self.targetDepth);
                    if (!map) return false;
                    return ![...map.entities.values()].flat().some(e => e.type === 'monster');
                },
            };
        },
    },

    // Find the captive NPC that is spawned on the target level when the quest is accepted.
    rescue: {
        generate: (depth, _rng) => {
            return {
                type: 'rescue',
                title: `Rescue the Captive on Level ${depth}`,
                description: `A merchant was taken to level ${depth}. Find them and escort them back to the surface.`,
                targetDepth: depth,
                state: { found: false, returned: false },
                reward: { xp: 400 * depth, gold: 200 * depth, item: 'ring_of_protection' },
                completionCondition: (state) => state.returned,
            };
        },
    },
};
