export const PUZZLES = {

  three_statue_offering: {
    key: 'three_statue_offering',
    name: 'The Three Shrines',
    description: 'Three stone statues stand in alcoves — a warrior, a priest, and a mage.',
    examineText: (state) => {
      const base = 'Three ancient statues stand in alcoves:
  The Warrior grips an empty shield-hand.
  The Priest raises open palms toward heaven.
  The Mage's staff-cradle is carved but empty.';
      if (state.warrior_given && state.priest_given && state.mage_given)
        return base + '

All three statues now hold offerings. A hidden door grinds open.';
      return base + '

An inscription reads: GIVE EACH THEIR OWN.';
    },
    initialState: { warrior_given: false, priest_given: false, mage_given: false },
    interactions: [
      {
        key: 'offer_warrior', label: 'Offer weapon to warrior',
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
        available: (s) => !s.priest_given,
        resolve: (state, player, { item }) => {
          if (!item || !item.tags?.includes('holy'))
            return { success: false, message: 'The priest tilts its carved head, unimpressed.' };
          player.removeFromInventory(item);
          return { success: true, message: 'The holy symbol rises from your hand into the statue's palms.', stateChanges: { priest_given: true } };
        }
      },
      {
        key: 'offer_mage', label: 'Offer magical item to mage',
        available: (s) => !s.mage_given,
        resolve: (state, player, { item }) => {
          if (!item || !(item.category === 'scroll' || item.category === 'wand' || item.category === 'ring'))
            return { success: false, message: 'The mage's blank eyes do not move.' };
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
      : `The carved face speaks in a grinding voice:

"${state.riddle.question}"

You may speak your answer.`,
    initialState: {
      riddle: RIDDLES[Math.floor(Math.random() * RIDDLES.length)],
      attempts: 0, solved: false
    },
    interactions: [{
      key: 'answer', label: 'Speak an answer',
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
        return { success: false, message: `The face intones: "That is not it. ${3 - state.attempts} attempts remain."` };
      }
    }],
    solveCondition: (s) => s.solved,
    reward: { xp: 150, openPassage: 'gate' },
  },
};

const RIDDLES = [
  { question: 'I have cities, but no houses live there. I have forests, but no trees grow there. I have water, but no fish swim there. What am I?', answers: ['map'] },
  { question: 'I speak without a mouth and hear without ears. I have no body but come alive with wind. What am I?', answers: ['echo'] },
  { question: 'The more you take, the more you leave behind. What am I?', answers: ['footsteps', 'footstep', 'steps'] },
  { question: 'I pass before the sun yet make no shadow. What am I?', answers: ['wind', 'air'] },
];
