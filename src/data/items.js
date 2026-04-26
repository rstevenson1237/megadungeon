
export const ITEMS = {
  // === WEAPONS ===
  short_sword: {
    key: 'short_sword', name: 'Short Sword', category: 'weapon',
    glyph: 0x29, color: '#aaaaaa', value: 10, stackable: false,
    weapon: { damage: [1, 6], attackBonus: 0, damageMod: 0, range: 1, twoHanded: false },
    description: 'A reliable single-edged blade. The mercenary\'s choice.',
  },
  dagger:       { key: 'dagger',       name: 'Dagger',         category: 'weapon',  glyph: 0x2D, color: '#aaaaaa', value: 2,  stackable: false, weapon: { damage: [1,4], attackBonus: 0, damageMod: 0, range: 1, twoHanded: false }, description: 'A short blade.' },
  long_sword:   { key: 'long_sword',   name: 'Long Sword',     category: 'weapon',  glyph: 0x2F, color: '#aaaaaa', value: 25, stackable: false, weapon: { damage: [1,8], attackBonus: 0, damageMod: 0, range: 1, twoHanded: false }, description: 'A knight\'s blade.' },
  mace:         { key: 'mace',         name: 'Mace',           category: 'weapon',  glyph: 0x5C, color: '#888888', value: 12, stackable: false, weapon: { damage: [1,6], attackBonus: 0, damageMod: 0, range: 1, twoHanded: false }, description: 'A flanged head on a stout shaft.' },
  staff:        { key: 'staff',        name: 'Staff',          category: 'weapon',  glyph: 0x7C, color: '#885533', value: 5,  stackable: false, weapon: { damage: [1,6], attackBonus: 0, damageMod: 0, range: 1, twoHanded: true  }, description: 'A walking stick that doubles as a weapon.' },
  short_bow:    { key: 'short_bow',    name: 'Short Bow',      category: 'weapon',  glyph: 0x29, color: '#885533', value: 25, stackable: false, weapon: { damage: [1,6], attackBonus: 0, damageMod: 0, range: 8, twoHanded: true  }, description: 'A compact recurve bow.' },

  // === ARMOR ===
  chain_mail: {
    key: 'chain_mail', name: 'Chain Mail', category: 'armor',
    glyph: 0x5B, color: '#888888', value: 75, stackable: false,
    armor: { acBonus: 4, slot: 'body', maxDexBonus: 3 },
    description: 'Interlocking iron rings. Deflects blades well, rattles conspicuously.',
  },
  leather_armor:{ key: 'leather_armor',name: 'Leather Armor',  category: 'armor',   glyph: 0x5B, color: '#885533',  value: 20,  stackable: false, armor: { acBonus: 2, slot: 'body', maxDexBonus: 6 }, description: 'Hardened leather.' },
  plate_mail:   { key: 'plate_mail',   name: 'Plate Mail',     category: 'armor',   glyph: 0x5B, color: '#cccccc', value: 400, stackable: false, armor: { acBonus: 6, slot: 'body', maxDexBonus: 1 }, description: 'Full plate armor.' },
  shield:       { key: 'shield',       name: 'Shield',         category: 'armor',   glyph: 0x5B, color: '#888888',  value: 15,  stackable: false, armor: { acBonus: 1, slot: 'offhand', maxDexBonus: 6 }, description: 'A wooden shield banded with iron.' },

  // === TOOLS / MISC ===
  torch: {
    key: 'torch', name: 'Torch', category: 'tool',
    glyph: 0x7E, color: '#ffaa00', value: 1, stackable: true,
    description: 'A wooden stick wrapped in oil-soaked cloth. Provides light.',
  },

  ration: {
    key: 'ration', name: 'Ration', category: 'food',
    glyph: 0x25, color: '#aa8844', value: 5, stackable: true,
    food: { nutrition: 500 },
    description: 'A portion of dried meat, hardtack, and nuts. Barely edible, but keeps you going.',
  },

  rope: {
    key: 'rope', name: '50ft of Rope', category: 'tool',
    glyph: 0x26, color: '#8b4513', value: 1, stackable: false,
    description: 'A coil of sturdy hemp rope. Never leave home without it.',
  },
  thieves_tools:{ key: 'thieves_tools',name: 'Thieves\' Tools', category: 'tool',   glyph: 0x2B, color: '#888844', value: 25, stackable: false, description: 'Lock picks, tension wrench, and assorted probes.' },
  holy_symbol:  { key: 'holy_symbol',  name: 'Holy Symbol',    category: 'tool',    glyph: 0x2B, color: '#ffff88', value: 10, stackable: false, tags: ['holy'], description: 'A wooden symbol of your deity.' },
  spellbook:    { key: 'spellbook',    name: 'Spellbook',      category: 'tool',    glyph: 0x2B, color: '#8844cc', value: 50, stackable: false, description: 'A leather-bound book of arcane formulae.' },
  inkpot:       { key: 'inkpot',       name: 'Inkpot',         category: 'tool',    glyph: 0x6F, color: '#222222', value: 2,  stackable: false, description: 'A small pot of black ink.' },
  arrows_20:    { key: 'arrows_20',    name: '20 Arrows',      category: 'tool',    glyph: 0x18, color: '#885533', value: 5,  stackable: true,  quantity: 20, description: 'A quiver of wooden arrows.' },
  lute:         { key: 'lute',         name: 'Lute',           category: 'tool',    glyph: 0x6C, color: '#cc9933', value: 15, stackable: false, description: 'A finely crafted stringed instrument. A bard\'s most important tool.' },
  gold_pile:    { key: 'gold_pile',    name: 'Gold Coins',     category: 'treasure',glyph: 0x24, color: '#ffcc00', value: 0,  stackable: true,  description: 'A handful of gold coins.' },

  // === POTIONS (unidentified until tested or ID'd) ===
  healing_potion: {
    key: 'healing_potion', name: 'Potion of Healing', genericName: 'Red Potion', category: 'potion',
    glyph: 0x21, color: '#ff4444', value: 50, stackable: true,
    potion: { effect: 'heal', magnitude: '2d4+2', duration: 0 },
    description: 'A warm, copper-tasting liquid that knits wounds with uncanny speed.',
  },

  potion_of_speed: {
    key: 'potion_of_speed', name: 'Potion of Speed', genericName: 'Silver Potion', category: 'potion',
    glyph: 0x21, color: '#aaaaff', value: 100, stackable: true,
    potion: { effect: 'haste', magnitude: 2, duration: 20 }, // 2× speed for 20 turns
    description: 'The world lurches into slow motion around you.',
  },

  // === SCROLLS ===
  scroll_magic_missile: {
    key: 'scroll_magic_missile', name: 'Scroll of Magic Missile', genericName: 'Rolled Parchment',
    category: 'scroll', glyph: 0x3F, color: '#ccccff', value: 35, stackable: false,
    scroll: { spellKey: 'magic_missile', casterLevel: 3 },
    description: 'Barely legible runes flare as your eyes trace the words of power.',
  },

  scroll_template: {
    key: 'scroll_template', name: 'Scroll', genericName: 'Rolled Parchment',
    category: 'scroll', glyph: 0x3F, color: '#ffffcc', value: 50, stackable: false,
    scroll: { spellKey: 'magic_missile', casterLevel: 1 },
    description: 'A hand-scribed magical scroll.',
  },

  // === MAGICAL ITEMS ===
  ring_of_protection: {
    key: 'ring_of_protection', name: 'Ring of Protection +1', genericName: 'Plain Ring',
    category: 'ring', glyph: 0x3D, color: '#ffcc44', value: 1000, stackable: false,
    effects: [{ type: 'ac', value: 1 }, { type: 'saves', value: 1 }],
    description: 'A faint shimmer plays over your skin when you wear it.',
  },

  amulet_of_life_protection: {
    key: 'amulet_of_life_protection', name: 'Amulet of Life Protection',
    category: 'amulet', glyph: 0x22, color: '#ffcc88', value: 5000, stackable: false,
    effects: [{ type: 'immune', value: 'energy_drain' }],
    description: 'A soul-gem that holds a tiny piece of your life force at all times — beyond reach of the undead.',
  },

  // === THEME WEAPONS ===
  crude_dagger: {
    key: 'crude_dagger', name: 'Crude Dagger', category: 'weapon',
    glyph: 0x2D, color: '#886644', value: 1, stackable: false,
    weapon: { damage: [1, 3], attackBonus: -1, damageMod: 0, range: 1, twoHanded: false },
    description: 'A sharpened scrap of iron. Barely counts as a weapon.',
  },
  war_axe: {
    key: 'war_axe', name: 'War Axe', category: 'weapon',
    glyph: 0x29, color: '#aaaaaa', value: 30, stackable: false,
    weapon: { damage: [1, 8], attackBonus: 0, damageMod: 1, range: 1, twoHanded: false },
    description: 'A heavy single-bitted axe favored by dwarven soldiers.',
  },
  forge_hammer: {
    key: 'forge_hammer', name: 'Forge Hammer', category: 'weapon',
    glyph: 0x29, color: '#886644', value: 20, stackable: false,
    weapon: { damage: [1, 8], attackBonus: 0, damageMod: 0, range: 1, twoHanded: true },
    description: 'Originally a smith\'s tool. Repurposed for war.',
  },
  phase_blade: {
    key: 'phase_blade', name: 'Phase Blade', category: 'weapon',
    glyph: 0x29, color: '#aa44ff', value: 800, stackable: false,
    weapon: { damage: [1, 8], attackBonus: 2, damageMod: 2, range: 1, twoHanded: false },
    description: 'The edge flickers between planes, bypassing mundane defenses.',
  },

  // === THEME TOOLS ===
  net: {
    key: 'net', name: 'Net', category: 'tool',
    glyph: 0x7E, color: '#885533', value: 8, stackable: false,
    description: 'A weighted throwing net. Restrains small creatures.',
  },
  bone_holy_symbol: {
    key: 'bone_holy_symbol', name: 'Bone Holy Symbol', category: 'tool',
    glyph: 0x2B, color: '#ccccaa', value: 5, stackable: false,
    tags: ['holy'],
    description: 'Carved from a finger bone. Crude, but the divine does not care.',
  },
  grave_dust: {
    key: 'grave_dust', name: 'Grave Dust', category: 'tool',
    glyph: 0x7E, color: '#888866', value: 5, stackable: true,
    description: 'Fine grey ash scraped from old graves. Used in certain rituals.',
  },
  embalming_kit: {
    key: 'embalming_kit', name: 'Embalming Kit', category: 'tool',
    glyph: 0x7E, color: '#aa8866', value: 15, stackable: false,
    description: 'Jars of preserving salts and lengths of linen wrapping.',
  },
  runic_chisel: {
    key: 'runic_chisel', name: 'Runic Chisel', category: 'tool',
    glyph: 0x7E, color: '#aaaacc', value: 40, stackable: false,
    description: 'Inscribed with dwarven runes. Used to carve magical sigils into stone.',
  },
  lodestone: {
    key: 'lodestone', name: 'Lodestone', category: 'tool',
    glyph: 0x7E, color: '#888888', value: 30, stackable: false,
    description: 'A magnetized stone. Tugs faintly toward the nearest exit.',
  },
  planar_compass: {
    key: 'planar_compass', name: 'Planar Compass', category: 'tool',
    glyph: 0x7E, color: '#aa44ff', value: 200, stackable: false,
    description: 'Its needle spins erratically, pointing at dimensional rifts.',
  },
  null_stone: {
    key: 'null_stone', name: 'Null Stone', category: 'tool',
    glyph: 0x7E, color: '#444466', value: 300, stackable: false,
    description: 'A matte black stone that suppresses magic within arm\'s reach.',
  },
  soul_candle: {
    key: 'soul_candle', name: 'Soul Candle', category: 'tool',
    glyph: 0x7E, color: '#4444ff', value: 150, stackable: true,
    description: 'Burns with a cold blue flame. The undead avoid its light.',
  },

  // === THEME TREASURE ===
  stolen_coin_purse: {
    key: 'stolen_coin_purse', name: 'Stolen Coin Purse', category: 'treasure',
    glyph: 0x24, color: '#ffcc44', value: 25, stackable: false,
    description: 'A leather purse jingling with pilfered coins.',
  },
  goblin_idol: {
    key: 'goblin_idol', name: 'Goblin Idol', category: 'treasure',
    glyph: 0x2A, color: '#886644', value: 8, stackable: false,
    description: 'A crude carved figure. Goblins treat it as sacred.',
  },
  burial_urn: {
    key: 'burial_urn', name: 'Burial Urn', category: 'treasure',
    glyph: 0x6F, color: '#888866', value: 20, stackable: false,
    description: 'A sealed clay urn. Presumably occupied.',
  },
  ancient_coin: {
    key: 'ancient_coin', name: 'Ancient Coin', category: 'treasure',
    glyph: 0x24, color: '#ccaa44', value: 10, stackable: true,
    description: 'A gold coin stamped with a forgotten king\'s face.',
  },
  antique_ring: {
    key: 'antique_ring', name: 'Antique Ring', category: 'treasure',
    glyph: 0x3D, color: '#ccaa66', value: 80, stackable: false,
    description: 'A valuable but non-magical ring of fine craftsmanship.',
  },
  iron_ingot: {
    key: 'iron_ingot', name: 'Iron Ingot', category: 'treasure',
    glyph: 0x2A, color: '#888888', value: 12, stackable: true,
    description: 'A bar of smelted iron. Dwarven smiths pay well for these.',
  },
  deep_gem: {
    key: 'deep_gem', name: 'Deep Gem', category: 'treasure',
    glyph: 0x2A, color: '#4444ff', value: 150, stackable: false,
    description: 'A blue gemstone mined from deep veins. Glows faintly.',
  },
  mithral_shard: {
    key: 'mithral_shard', name: 'Mithral Shard', category: 'treasure',
    glyph: 0x2A, color: '#aaccff', value: 400, stackable: false,
    description: 'A fragment of the legendary metal. Light as a feather.',
  },
  fire_opal: {
    key: 'fire_opal', name: 'Fire Opal', category: 'treasure',
    glyph: 0x2A, color: '#ff6622', value: 200, stackable: false,
    description: 'An orange gem that seems to flicker with inner flame.',
  },
  aquamarine: {
    key: 'aquamarine', name: 'Aquamarine', category: 'treasure',
    glyph: 0x2A, color: '#44ccff', value: 120, stackable: false,
    description: 'A pale blue gem the color of shallow water.',
  },
  earth_heart: {
    key: 'earth_heart', name: 'Earth Heart', category: 'treasure',
    glyph: 0x2A, color: '#886644', value: 250, stackable: false,
    description: 'A dark red crystal found only in elemental nodes. Pulsates.',
  },
  void_shard: {
    key: 'void_shard', name: 'Void Shard', category: 'treasure',
    glyph: 0x2A, color: '#440088', value: 300, stackable: false,
    description: 'A sliver of solidified nothingness. Cold beyond cold.',
  },
  dark_pearl: {
    key: 'dark_pearl', name: 'Dark Pearl', category: 'treasure',
    glyph: 0x2A, color: '#8844aa', value: 500, stackable: false,
    description: 'A perfect black pearl harvested from void-touched waters.',
  },

  // === MAGIC MATERIALS ===
  elemental_shard: {
    key: 'elemental_shard', name: 'Elemental Shard', category: 'tool',
    glyph: 0x2A, color: '#44ffff', value: 80, stackable: true,
    description: 'A crystallized fragment of elemental energy.',
  },
  elemental_essence: {
    key: 'elemental_essence', name: 'Elemental Essence', category: 'tool',
    glyph: 0x2A, color: '#44ff88', value: 100, stackable: true,
    description: 'Liquid elemental force, sealed in a tiny vial.',
  },
  mana_crystal: {
    key: 'mana_crystal', name: 'Mana Crystal', category: 'tool',
    glyph: 0x2A, color: '#8844ff', value: 80, stackable: true,
    description: 'A crystallized mana node. Arcane shops pay good prices.',
  },
  shadow_essence: {
    key: 'shadow_essence', name: 'Shadow Essence', category: 'tool',
    glyph: 0x2A, color: '#444466', value: 200, stackable: true,
    description: 'The distilled essence of void-shadow. Used in powerful enchantments.',
  },
  prismatic_flask: {
    key: 'prismatic_flask', name: 'Prismatic Flask', category: 'tool',
    glyph: 0x2A, color: '#ffaaff', value: 180, stackable: false,
    description: 'A flask that shifts through every color. Contains compressed elemental force.',
  },

  // === THEME WANDS ===
  bone_wand: {
    key: 'bone_wand', name: 'Bone Wand', genericName: 'Carved Wand',
    category: 'wand', glyph: 0x5C, color: '#ccaa88', value: 150, stackable: false,
    wand: { spellKey: 'fear', charges: 3, maxCharges: 3, casterLevel: 3 },
    description: 'Etched with tiny screaming faces.',
  },

  // === THEME POTIONS / DRINKABLES ===
  mead_skin: {
    key: 'mead_skin', name: 'Mead Skin', genericName: 'Leather Flask', category: 'potion',
    glyph: 0x21, color: '#ffcc44', value: 8, stackable: true,
    potion: { effect: 'heal', magnitude: '1d4', duration: 0 },
    description: 'Watered-down honey mead. Barely heals, but better than nothing.',
  },
  unholy_water: {
    key: 'unholy_water', name: 'Unholy Water', genericName: 'Dark Vial', category: 'potion',
    glyph: 0x21, color: '#884488', value: 20, stackable: true,
    potion: { effect: 'damage', magnitude: '1d6', duration: 0 },
    description: 'Blessed in reverse. Burns the living from the inside.',
  },
  dwarven_ale: {
    key: 'dwarven_ale', name: 'Dwarven Ale', category: 'food',
    glyph: 0x25, color: '#aa6622', value: 5, stackable: true,
    food: { nutrition: 200 },
    description: 'Strong enough to strip rust. Dwarves call it breakfast.',
  },

  // === THEME FOOD ===
  dwarven_bread: {
    key: 'dwarven_bread', name: 'Dwarven Bread', category: 'food',
    glyph: 0x25, color: '#aa8844', value: 3, stackable: true,
    food: { nutrition: 600 },
    description: 'Dense enough to use as a weapon. Keeps for decades.',
  },

  // === THEME SCROLLS ===
  old_scroll: {
    key: 'old_scroll', name: 'Old Scroll', genericName: 'Yellowed Parchment',
    category: 'scroll', glyph: 0x3F, color: '#ccbb88', value: 10, stackable: false,
    scroll: { spellKey: 'magic_missile', casterLevel: 1 },
    description: 'Faded runes on crumbling parchment. Still faintly legible.',
  },
  scroll_of_turning: {
    key: 'scroll_of_turning', name: 'Scroll of Turning', genericName: 'Holy Scroll',
    category: 'scroll', glyph: 0x3F, color: '#ffff88', value: 80, stackable: false,
    scroll: { spellKey: 'turn_undead', casterLevel: 3 },
    description: 'The undead recoil from the words written here.',
  },
  rift_scroll: {
    key: 'rift_scroll', name: 'Rift Scroll', genericName: 'Void Parchment',
    category: 'scroll', glyph: 0x3F, color: '#aa44ff', value: 250, stackable: false,
    scroll: { spellKey: 'teleport', casterLevel: 5 },
    description: 'Opens a tear in the fabric of space.',
  },
  storm_rune: {
    key: 'storm_rune', name: 'Storm Rune', genericName: 'Crackling Stone',
    category: 'scroll', glyph: 0x3F, color: '#ffff44', value: 200, stackable: false,
    scroll: { spellKey: 'lightning_bolt', casterLevel: 4 },
    description: 'A flat stone carved with crackling sigils.',
  },

  // === KEYS ===
  iron_key: {
    key: 'iron_key', name: 'Iron Key', category: 'tool',
    glyph: 0x6B, color: '#888888', value: 5, stackable: false,
    description: 'A heavy iron key. Opens standard dungeon locks.',
  },
  dimensional_key: {
    key: 'dimensional_key', name: 'Dimensional Key', category: 'tool',
    glyph: 0x6B, color: '#aa44ff', value: 500, stackable: false,
    description: 'A key that phases between planes. Opens otherworldly locks.',
  },

  // === WANDS ===
  wand_of_magic_missile: {
    key: 'wand_of_magic_missile', name: 'Wand of Magic Missiles', genericName: 'Plain Wand',
    category: 'wand', glyph: 0x5C, color: '#aaaaff', value: 300, stackable: false,
    wand: { spellKey: 'magic_missile', charges: 7, maxCharges: 7, casterLevel: 5 },
    description: 'A polished rod that crackles with pent-up force.',
  },
  wand_of_frost: {
    key: 'wand_of_frost', name: 'Wand of Frost', genericName: 'Icy Wand',
    category: 'wand', glyph: 0x5C, color: '#88ccff', value: 400, stackable: false,
    wand: { spellKey: 'frost_bolt', charges: 5, maxCharges: 5, casterLevel: 5 },
    description: 'Bone-cold to the touch.',
  },
  wand_of_fear: {
    key: 'wand_of_fear', name: 'Wand of Fear', genericName: 'Dark Wand',
    category: 'wand', glyph: 0x5C, color: '#884444', value: 350, stackable: false,
    wand: { spellKey: 'fear', charges: 5, maxCharges: 5, casterLevel: 5 },
    description: 'A twisted rod of blackened bone.',
  },
  wand_of_healing: {
    key: 'wand_of_healing', name: 'Wand of Healing', genericName: 'White Wand',
    category: 'wand', glyph: 0x5C, color: '#88ff88', value: 500, stackable: false,
    wand: { spellKey: 'cure_light_wounds', charges: 4, maxCharges: 4, casterLevel: 5 },
    description: 'Warm and smooth. It pulses faintly in your hand.',
  },
  wand_of_lightning: {
    key: 'wand_of_lightning', name: 'Wand of Lightning', genericName: 'Sparking Wand',
    category: 'wand', glyph: 0x5C, color: '#ffff44', value: 600, stackable: false,
    wand: { spellKey: 'lightning_bolt', charges: 4, maxCharges: 4, casterLevel: 5 },
    description: 'Hair-raising just to hold.',
  },

  // === CORE POTIONS ===
  potion_of_strength: {
    key: 'potion_of_strength', name: 'Potion of Strength', genericName: 'Murky Potion', category: 'potion',
    glyph: 0x21, color: '#ff8844', value: 150, stackable: true,
    potion: { effect: 'str_boost', magnitude: 4, duration: 15 },
    description: 'Your muscles swell with unnatural power.',
  },
  potion_of_invisibility: {
    key: 'potion_of_invisibility', name: 'Potion of Invisibility', genericName: 'Clear Potion', category: 'potion',
    glyph: 0x21, color: '#ccffff', value: 300, stackable: true,
    potion: { effect: 'invisible', magnitude: 1, duration: 10 },
    description: 'You fade from sight entirely.',
  },
  antidote: {
    key: 'antidote', name: 'Antidote', genericName: 'Green Potion', category: 'potion',
    glyph: 0x21, color: '#44ff88', value: 75, stackable: true,
    potion: { effect: 'cure_poison', magnitude: 1, duration: 0 },
    description: 'Neutralizes poison in the blood.',
  },
  potion_of_fire_resist: {
    key: 'potion_of_fire_resist', name: 'Potion of Fire Resistance', genericName: 'Orange Potion', category: 'potion',
    glyph: 0x21, color: '#ff6622', value: 200, stackable: true,
    potion: { effect: 'fire_resist', magnitude: 1, duration: 20 },
    description: 'Your skin feels cool despite the flames around you.',
  },

  // === CORE SCROLLS ===
  scroll_of_fireball: {
    key: 'scroll_of_fireball', name: 'Scroll of Fireball', genericName: 'Scorched Parchment',
    category: 'scroll', glyph: 0x3F, color: '#ff4422', value: 120, stackable: false,
    scroll: { spellKey: 'fireball', casterLevel: 5 },
    description: 'The parchment is warm to the touch.',
  },
  scroll_of_sleep: {
    key: 'scroll_of_sleep', name: 'Scroll of Sleep', genericName: 'Dreamy Parchment',
    category: 'scroll', glyph: 0x3F, color: '#8888ff', value: 80, stackable: false,
    scroll: { spellKey: 'sleep', casterLevel: 3 },
    description: 'The words seem to blur as you read them.',
  },
  scroll_of_detect_traps: {
    key: 'scroll_of_detect_traps', name: 'Scroll of Detect Traps', genericName: 'Warning Parchment',
    category: 'scroll', glyph: 0x3F, color: '#ffcc44', value: 50, stackable: false,
    scroll: { spellKey: 'detect_traps', casterLevel: 1 },
    description: 'Reveals hidden dangers to your senses.',
  },
  scroll_of_teleport: {
    key: 'scroll_of_teleport', name: 'Scroll of Teleportation', genericName: 'Shimmering Parchment',
    category: 'scroll', glyph: 0x3F, color: '#44aaff', value: 300, stackable: false,
    scroll: { spellKey: 'teleport', casterLevel: 7 },
    description: 'The words shift position as you read them.',
  },

  // === CORE WEAPONS ===
  battle_axe: {
    key: 'battle_axe', name: 'Battle Axe', category: 'weapon',
    glyph: 0x29, color: '#aaaaaa', value: 30, stackable: false,
    weapon: { damage: [1, 8], attackBonus: 0, damageMod: 1, range: 1, twoHanded: false },
    description: 'A broad-bladed axe built for chopping through armor.',
  },
  great_sword: {
    key: 'great_sword', name: 'Great Sword', category: 'weapon',
    glyph: 0x29, color: '#cccccc', value: 50, stackable: false,
    weapon: { damage: [2, 6], attackBonus: 0, damageMod: 0, range: 1, twoHanded: true },
    description: 'A massive two-handed blade that cleaves through ranks.',
  },
  hand_crossbow: {
    key: 'hand_crossbow', name: 'Hand Crossbow', category: 'weapon',
    glyph: 0x29, color: '#885533', value: 45, stackable: false,
    weapon: { damage: [1, 6], attackBonus: 1, damageMod: 0, range: 6, twoHanded: false },
    description: 'A compact crossbow that can be wielded in one hand.',
  },

  // === CORE ARMOR ===
  studded_leather: {
    key: 'studded_leather', name: 'Studded Leather', category: 'armor',
    glyph: 0x5B, color: '#aa7744', value: 45, stackable: false,
    armor: { acBonus: 3, slot: 'body', maxDexBonus: 5 },
    description: 'Leather reinforced with iron studs. Better protection without sacrificing agility.',
  },
  half_plate: {
    key: 'half_plate', name: 'Half-Plate', category: 'armor',
    glyph: 0x5B, color: '#aaaacc', value: 200, stackable: false,
    armor: { acBonus: 5, slot: 'body', maxDexBonus: 2 },
    description: 'Covers the vital areas with steel plates over a mail backing.',
  },

  // === HELMETS ===
  iron_helm: {
    key: 'iron_helm', name: 'Iron Helm', category: 'armor',
    glyph: 0x5B, color: '#888888', value: 20, stackable: false,
    armor: { acBonus: 1, slot: 'helmet', maxDexBonus: 6 },
    description: 'A simple iron cap. Dents easily but beats nothing.',
  },
  great_helm: {
    key: 'great_helm', name: 'Great Helm', category: 'armor',
    glyph: 0x5B, color: '#aaaaaa', value: 60, stackable: false,
    armor: { acBonus: 2, slot: 'helmet', maxDexBonus: 4 },
    description: 'A full bucket helm. Restricts vision slightly.',
  },

  // === CURSED ITEMS ===
  sword_of_wounding: {
    key: 'sword_of_wounding', name: 'Long Sword -1', genericName: 'Fine Long Sword',
    category: 'weapon', glyph: 0x2F, color: '#ff6644', value: 0, stackable: false,
    cursed: true,
    weapon: { damage: [1, 8], attackBonus: -1, damageMod: -1, range: 1, twoHanded: false },
    curse: { type: 'cannot_unequip', displayedAs: 'Long Sword +0' },
    description: 'It feels right in your hand — too right. You don\'t want to let go.',
  },
};
