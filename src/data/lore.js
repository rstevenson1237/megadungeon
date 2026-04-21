/**
 * Lore entries placed in rooms by RoomGen._placeLore().
 * Each entry: { glyph: CP437 code, color: hex string, message: string }
 * Keys match THEMES keys plus 'generic' as a fallback pool.
 */
export const LORE = {

  dungeon_cellar: [
    {
      glyph: 0x22, color: '#ccbbaa',
      message: 'Carved over the doorway: "BY ORDER OF THE GARRISON COMMANDER — NO UNAUTHORIZED PERSONS BEYOND THIS POINT. VIOLATORS WILL BE DETAINED."',
    },
    {
      glyph: 0x22, color: '#ccbbaa',
      message: 'Scratched into a stone block by a small, careful hand: "Day 47. They have forgotten me. My name is Aldric. Remember me."',
    },
    {
      glyph: 0x22, color: '#ff9999',
      message: 'A faded notice is nailed to the wall, its edges rotted away. One word remains legible: "QUARANTINE."',
    },
    {
      glyph: 0x22, color: '#ccbbaa',
      message: 'Scratched beside a floor drain clogged with something dark: "DO NOT BLOCK THE DRAIN. — Sgt. Holt." Below it, another hand: "Holt is dead. The drain stays blocked."',
    },
    {
      glyph: 0xF0, color: '#aaaaff',
      message: 'A tally is carved deeply into the wall — hundreds of marks in neat rows. The last row is unfinished.',
    },
    {
      glyph: 0x22, color: '#ccbbaa',
      message: 'A child\'s drawing scratched into the stone: a house, a sun, stick figures holding hands. It seems impossibly out of place.',
    },
    {
      glyph: 0x22, color: '#ccbbaa',
      message: 'A note on rotting parchment: "Three rats in the east wall today. Tell Brennan to set more traps. — W.C." Below it, a different hand: "Brennan is dead."',
    },
    {
      glyph: 0xF0, color: '#ff9999',
      message: 'The floor bears old, dark stains arranged in a deliberate circle. Something was performed here. Something was answered.',
    },
    {
      glyph: 0x22, color: '#ccbbaa',
      message: 'An old duty roster is pinned to a rotting door frame. Every name on it has been crossed out.',
    },
    {
      glyph: 0x22, color: '#aaaaff',
      message: 'Carved in a scholar\'s precise hand: "The lower levels were sealed in the third year of the Interregnum. No record exists of what prompted the order."',
    },
  ],

  goblin_warren: [
    {
      glyph: 0x0F, color: '#aa4400',
      message: 'Red handprints crowd the low ceiling — far too many to count. They are not all the same size.',
    },
    {
      glyph: 0x0F, color: '#aa7722',
      message: 'A crude drawing shows stick figures fleeing from a large, looming shape. One figure holds something aloft. You cannot tell if it is a weapon or a torch.',
    },
    {
      glyph: 0x22, color: '#aadd88',
      message: 'Scratched in broken Common: "WE HERE. WE STAY. YOU GO AWAY." Below it: "OR YOU STAY FOREVER."',
    },
    {
      glyph: 0x0F, color: '#aa7722',
      message: 'A series of notched bones hangs from a cord — a counting system of some kind. The count is very high.',
    },
    {
      glyph: 0x0F, color: '#886633',
      message: 'Clumped fur and feathers are tied to a spike in the wall. A ward against something? Or an offering to something worse?',
    },
    {
      glyph: 0xF0, color: '#aaaaff',
      message: 'The pictographs here are different from the others — older, more precise, cut by a steadier hand. Something lived here long before the goblins arrived.',
    },
    {
      glyph: 0x22, color: '#aadd88',
      message: '"BIG CHIEF GRUKK WAS HERE. GRUKK IS STRONGEST." Most of the surrounding stone has been gnawed.',
    },
    {
      glyph: 0x0F, color: '#ff9999',
      message: 'A circle of ash on the floor surrounds a deep scorch mark. Bones are arranged at the edges. Some are larger than anything a rat could provide.',
    },
    {
      glyph: 0x22, color: '#aadd88',
      message: 'In crude pictographs: a figure descends into a hole, finds something shining, and then the figure has become very large. The sequence repeats, each time larger.',
    },
  ],

  catacomb: [
    {
      glyph: 0x22, color: '#aaaaff',
      message: '"HERE LIES MAREN ALDSWORTH, BELOVED OF THE TEMPLE, WHO SERVED FAITHFULLY FOR FORTY YEARS. MAY THE DARK HOLD HER GENTLY."',
    },
    {
      glyph: 0x22, color: '#ff9999',
      message: 'Carved above an empty niche: "HE ROSE ON THE THIRD NIGHT. WE DID NOT PURSUE HIM."',
    },
    {
      glyph: 0x22, color: '#ccbbaa',
      message: 'A wax tablet in a small alcove, the writing still legible: "If you read this, the seal has been broken. Leave now. You cannot know what sleeps here."',
    },
    {
      glyph: 0x22, color: '#aaaaff',
      message: 'A long epitaph covers the wall, methodically carved. The final line simply reads: "...and we buried the key with her, as agreed."',
    },
    {
      glyph: 0x22, color: '#ff9999',
      message: '"TOUCH NOTHING. TAKE NOTHING. THE COMPACT HOLDS ONLY AS LONG AS YOU SHOW RESPECT."',
    },
    {
      glyph: 0x22, color: '#ccffcc',
      message: 'A child-sized sarcophagus bears no inscription. Fresh flowers have been placed atop it. The flowers are not wilted.',
    },
    {
      glyph: 0xF0, color: '#ff9999',
      message: 'One name fills every available surface — carved, scratched, painted in faded pigment. VERATH. VERATH. VERATH. Hundreds of repetitions.',
    },
    {
      glyph: 0xF0, color: '#ff9999',
      message: 'A sealed alcove bears claw marks on its inner face. Whatever made them was scratching to get out.',
    },
    {
      glyph: 0x22, color: '#aaaaff',
      message: '"The Thirteenth Canon of Interment forbids disturbing those sealed after the Wasting Year. If you have read this, you are already in violation."',
    },
    {
      glyph: 0x22, color: '#ccbbaa',
      message: 'An archivist\'s note, pinned under a stone: "Confirmed: Section 7 contains pre-Compact burials. Recommend permanent closure. Recommend nobody ask why."',
    },
  ],

  generic: [
    {
      glyph: 0x22, color: '#ccbbaa',
      message: 'Scratched into the wall: "TURN BACK — ALDRIC THE BOLD." Below it, a different hand: "He did not turn back." Below that: "Neither did we."',
    },
    {
      glyph: 0xF0, color: '#aaaaff',
      message: 'A rough map is scratched into the floor. It shows passages that don\'t match anything you\'ve seen. Either the cartographer was lost, or you are.',
    },
    {
      glyph: 0x22, color: '#aaaaff',
      message: '"The fourth ward holds. Do not attempt the fifth." — unsigned, undated.',
    },
    {
      glyph: 0xF0, color: '#ff9999',
      message: 'A single rune is burned into a stone beam. You don\'t recognize it, but staring at it makes your palms itch.',
    },
    {
      glyph: 0x22, color: '#ff9999',
      message: 'An arrow scratched into the floor points deeper into the dungeon. Beside it: "DO NOT FOLLOW THE ARROW."',
    },
    {
      glyph: 0x22, color: '#ccbbaa',
      message: 'A journal, its pages fused together by damp: "Day one: found descent. Day four: found water. Day eight: found company." The entry for day nine is a single wet smear.',
    },
    {
      glyph: 0xF0, color: '#aaaaff',
      message: 'A chalk diagram on the floor — a circle of concentric rings with symbols at the cardinal points. Someone has scuffed through it deliberately.',
    },
    {
      glyph: 0x22, color: '#ccbbaa',
      message: '"If you find this, take the left passage at the three-way fork. I left supplies. — Hess." No indication of when this was written, or if Hess survived.',
    },
  ],
};
