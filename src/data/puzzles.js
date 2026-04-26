const RIDDLES = [
  { question: 'I have cities, but no houses live there. I have forests, but no trees grow there. I have water, but no fish swim there. What am I?', answers: ['map'] },
  { question: 'I speak without a mouth and hear without ears. I have no body but come alive with wind. What am I?', answers: ['echo'] },
  { question: 'The more you take, the more you leave behind. What am I?', answers: ['footsteps', 'footstep', 'steps'] },
  { question: 'I pass before the sun yet make no shadow. What am I?', answers: ['wind', 'air'] },
  { question: 'I build up castles, tear down mountains, make some men blind, and help others to see. What am I?', answers: ['sand'] },
  { question: 'What has roots as nobody sees, is taller than trees, up up up it goes, yet never grows?', answers: ['mountain'] },
  { question: 'I am always hungry, I must always be fed. The finger I touch will soon turn red. What am I?', answers: ['fire'] },
];

export const PUZZLES = {

  three_statue_offering: {
    key: 'three_statue_offering',
    name: 'The Three Shrines',
    description: 'Three stone statues stand in alcoves — a warrior, a priest, and a mage.',
    examineText: (state) => {
      const base = `Three ancient statues stand in alcoves:
  The Warrior grips an empty shield-hand.
  The Priest raises open palms toward heaven.
  The Mage's staff-cradle is carved but empty.`;
      if (state.warrior_given && state.priest_given && state.mage_given)
        return base + `\n\nAll three statues now hold offerings. A hidden door grinds open.`;
      return base + `\n\nAn inscription reads: GIVE EACH THEIR OWN.`;
    },
    initialState: { warrior_given: false, priest_given: false, mage_given: false },
    interactions: [
      {
        key: 'offer_warrior', label: 'Offer weapon to warrior',
        paramType: 'item',
        available: (s) => !s.warrior_given,
        resolve: (state, player, { item }) => {
          if (!item || item.category !== 'weapon')
            return { success: false, message: 'The warrior looks only at your blade.' };
          player.removeFromInventory(item);
          return { success: true, message: 'The warrior statue closes its hand around the weapon.', stateChanges: { warrior_given: true } };
        }
      },
      {
        key: 'offer_priest', label: 'Offer holy item to priest',
        paramType: 'item',
        available: (s) => !s.priest_given,
        resolve: (state, player, { item }) => {
          if (!item || !item.hasTag?.('holy'))
            return { success: false, message: 'The priest tilts its carved head, unimpressed.' };
          player.removeFromInventory(item);
          return { success: true, message: 'The holy symbol rises from your hand into the statue\'s palms.', stateChanges: { priest_given: true } };
        }
      },
      {
        key: 'offer_mage', label: 'Offer magical item to mage',
        paramType: 'item',
        available: (s) => !s.mage_given,
        resolve: (state, player, { item }) => {
          if (!item || !(item.category === 'scroll' || item.category === 'wand' || item.category === 'ring'))
            return { success: false, message: 'The mage\'s blank eyes do not move.' };
          player.removeFromInventory(item);
          return { success: true, message: 'The magical item floats into the cradle and hums with resonance.', stateChanges: { mage_given: true } };
        }
      }
    ],
    solveCondition: (s) => s.warrior_given && s.priest_given && s.mage_given,
    reward: { xp: 200, openPassage: 'north', items: ['ancient_key'] },
  },

  riddle_gate: {
    key: 'riddle_gate',
    name: 'The Speaking Gate',
    description: 'An iron gate with a carved face. Its stone eyes open as you approach.',
    examineText: (state) => state.solved
      ? 'The gate hangs open. The carved face stares blankly.'
      : `The carved face speaks in a grinding voice:\n\n"${state.riddle.question}"\n\nYou may speak your answer.`,
    initialState: {
      riddle: RIDDLES[Math.floor(Math.random() * RIDDLES.length)],
      attempts: 0, solved: false
    },
    interactions: [{
      key: 'answer', label: 'Speak an answer',
      paramType: 'text',
      available: (s) => !s.solved && s.attempts < 3,
      resolve: (state, player, { answer }) => {
        state.attempts++;
        const correct = state.riddle.answers.some(a => answer.toLowerCase().includes(a));
        if (correct) {
          return { success: true, message: 'The gate groans and swings open. The face is silent.', stateChanges: { solved: true } };
        }
        if (state.attempts >= 3) {
          return { success: false, message: 'The gate shudders. A bolt of force hurls you backward!', sideEffect: { type: 'damage', value: '1d6' } };
        }
        return { success: false, message: `The face intones: "That is not it. ${3 - state.attempts} attempt${3 - state.attempts === 1 ? '' : 's'} remain."` };
      }
    }],
    solveCondition: (s) => s.solved,
    reward: { xp: 150, openPassage: 'gate' },
  },

  blood_font: {
    key: 'blood_font',
    name: 'The Dry Font',
    description: 'A stone basin carved with desperate hands. Words ring its rim: LIFE FOR KNOWLEDGE.',
    examineText: (state) => state.filled
      ? 'The basin now holds a dark liquid. It whispers faintly.'
      : 'A deep stone basin sits empty, its carved channels dry and cracked.\n\nThe inscription reads: LIFE FOR KNOWLEDGE — POUR AND RECEIVE.',
    initialState: { filled: false },
    interactions: [
      {
        key: 'pour_potion', label: 'Pour a potion into the basin',
        paramType: 'item',
        available: (s) => !s.filled,
        resolve: (state, player, { item }) => {
          if (!item || item.category !== 'potion')
            return { success: false, message: 'The basin accepts only liquids poured from vessels.' };
          player.removeFromInventory(item);
          return {
            success: true,
            message: 'You pour the potion into the basin. The liquid darkens and spreads through hidden channels. Something stirs.',
            stateChanges: { filled: true }
          };
        }
      }
    ],
    solveCondition: (s) => s.filled,
    reward: { xp: 120, items: ['old_scroll'] },
  },

  lever_sequence: {
    key: 'lever_sequence',
    name: 'The Three Levers',
    description: 'Three iron levers protrude from the wall, labeled with worn symbols. Numbers are carved above: II — I — III.',
    examineText: (state) => {
      const labels = ['Left (I)', 'Center (II)', 'Right (III)'];
      const pulled = state.sequence.map((i) => labels[i]).join(', ') || 'none';
      if (state.failed)
        return 'The levers have reset with a clunk. The carved numbers hint at the order.\n\nNumbers above: II — I — III\n\nPulled so far: none';
      return `Three levers. Numbers above suggest the order of pulling.\n\nNumbers above: II — I — III\n\nPulled so far: ${pulled}`;
    },
    // Correct order: center (index 1) → left (index 0) → right (index 2), matching Roman numerals I, II, III reading order of II-I-III means pull II first then I then III = center, left, right
    initialState: { sequence: [], failed: false },
    interactions: [
      {
        key: 'pull_left', label: 'Pull left lever (II)',
        paramType: 'none',
        available: (s) => !s.failed || true,
        resolve: (state) => {
          if (state.failed) {
            state.sequence = [];
            state.failed = false;
          }
          const next = [...state.sequence, 0];
          const correct = [0, 1, 2]; // left, center, right — matching II(left), I(center)... wait
          // Correct: II first = left, I second = center... no wait.
          // Levers labeled II - I - III (left to right). Correct order is I, II, III = center, left, right
          const expected = [1, 0, 2]; // center=I first, left=II second, right=III third
          const pos = next.length - 1;
          if (next[pos] !== expected[pos]) {
            return { success: false, message: 'A grinding clunk — wrong order. The levers reset.', stateChanges: { sequence: [], failed: false } };
          }
          return { success: true, message: `The left lever clicks into place. ${3 - next.length} more to go.`, stateChanges: { sequence: next, failed: false } };
        }
      },
      {
        key: 'pull_center', label: 'Pull center lever (I)',
        paramType: 'none',
        available: (s) => !s.failed || true,
        resolve: (state) => {
          if (state.failed) {
            state.sequence = [];
            state.failed = false;
          }
          const next = [...state.sequence, 1];
          const expected = [1, 0, 2];
          const pos = next.length - 1;
          if (next[pos] !== expected[pos]) {
            return { success: false, message: 'A grinding clunk — wrong order. The levers reset.', stateChanges: { sequence: [], failed: false } };
          }
          const remaining = 3 - next.length;
          return { success: true, message: remaining > 0 ? `The center lever locks. ${remaining} more to go.` : 'All levers are set!', stateChanges: { sequence: next, failed: false } };
        }
      },
      {
        key: 'pull_right', label: 'Pull right lever (III)',
        paramType: 'none',
        available: (s) => !s.failed || true,
        resolve: (state) => {
          if (state.failed) {
            state.sequence = [];
            state.failed = false;
          }
          const next = [...state.sequence, 2];
          const expected = [1, 0, 2];
          const pos = next.length - 1;
          if (next[pos] !== expected[pos]) {
            return { success: false, message: 'A grinding clunk — wrong order. The levers reset.', stateChanges: { sequence: [], failed: false } };
          }
          return { success: true, message: 'The final lever locks with a deep resonant click.', stateChanges: { sequence: next, failed: false } };
        }
      }
    ],
    solveCondition: (s) => s.sequence.length === 3 && JSON.stringify(s.sequence) === JSON.stringify([1, 0, 2]),
    reward: { xp: 175, openPassage: 'south' },
  },

  word_of_unsealing: {
    key: 'word_of_unsealing',
    name: 'The Sealed Door',
    description: 'An iron door covered in carved glyphs. At its center: a single hollow where a word must be spoken.',
    examineText: (state) => state.solved
      ? 'The iron door stands open. The glyphs are dark and silent.'
      : `The carved glyphs pulse faintly. One line is different from the rest — not a ward, but a question.\n\n"WHAT WORD BREAKS ALL BONDS?"\n\nAttempts remaining: ${3 - state.attempts}`,
    initialState: { solved: false, attempts: 0 },
    interactions: [{
      key: 'answer', label: 'Speak the unsealing word',
      paramType: 'text',
      available: (s) => !s.solved && s.attempts < 3,
      resolve: (state, player, { answer }) => {
        state.attempts++;
        const word = answer.toLowerCase().trim();
        const correct = ['open', 'unlock', 'free', 'release', 'unseal', 'break'].some(w => word.includes(w));
        if (correct) {
          return { success: true, message: 'The glyphs flare white. With a grinding shriek, the iron door swings open.', stateChanges: { solved: true } };
        }
        if (state.attempts >= 3) {
          return { success: false, message: 'The glyphs pulse angrily. A shock of force throws you back!', sideEffect: { type: 'damage', value: '1d4' } };
        }
        return { success: false, message: `The glyphs dim. That is not the word. ${3 - state.attempts} attempt${3 - state.attempts === 1 ? '' : 's'} remain.` };
      }
    }],
    solveCondition: (s) => s.solved,
    reward: { xp: 130, openPassage: 'east' },
  },

};
