# Art redo list

Approved and exported assets that are worth redrawing, with one proposed fix each. Robert approved batches 1 and 2 as
they were (October 12 and 13, 2026), so each one here is a candidate, not a fault in the build: an asset leaves this
list when Robert asks for its redo and the new version is approved, or when he says to keep it. Every redo is drawn
under the current settings (body rigs, the v1 lineup check, the blind gate) and needs no game code change, since the
asset contracts only grow.

Scores are own / blind, out of 10; the bar (`review.approveMin`) is 6.5 on the blind score. Source: `artgen status`
and the roster reviews in `art/ledger.jsonl`, October 18, 2026.

## Below the bar (28)

| Asset | What it is | Final | Score | Proposed fix |
| --- | --- | --- | --- | --- |
| terrain-water-shallow | shallow water | finish.v1 | 6 / 4.5 | Start again from `artgen texture water`; lighter, clearer ripples so it reads apart from deep water |
| family-l | lizards and lizardmen | finish.v1 | 5 / 4.5 | Redraw on the quadruped rig: splayed legs and a long tail that separate from the body |
| terrain-water-deep | deep water | finish.v2 | 6.5 / 5 | Start again from `artgen texture water`, darker and calmer than shallow |
| terrain-teleporter | teleporter ring | finish.v2 | 6.5 / 5 | Lower the two back stones to the 0.1 m brief so it reads as a ring on the floor, not an altar |
| family-k | kobolds | finish.v2 | 5.5 / 5 | Thicken the body and push the snout and tail so it holds up at 1x |
| terrain-stairs-down | stairs down | finish.v2 | 6 / 5.5 | Ship the best version (base.v3 scored 7) or redraw with a darker, clearer opening |
| terrain-debris | rubble | finish.v2 | 6.5 / 5.5 | Add dirt clumps between the stones now that props have the dirt ramp; tone down the white highlights |
| class-thief | thief | finish.v1 | 6.5 / 5.5 | Darken the torso to cloth or leather so it no longer reads as bare skin |
| family-g-cap | giants | finish.v2 | 6.5 / 5.5 | Grim, not villager: armour or hides, and the colour token (not skin) as the main body colour |
| family-i-cap | insect swarms | finish.v2 | 6.5 / 5.5 | Redraw on the flyer rig: a loose cloud of wings over a ground shadow |
| family-t-cap | trolls | finish.v2 | 6.5 / 5.5 | Lankier than the ogre: longer arms, stooped, a thinner trunk |
| family-w-cap | wraiths | finish.v1 | 6.5 / 5.5 | Ragged trailing hem and a clear hooded head; check it in the scene view against dark floors |
| family-b | bats | finish.v1 | 5.5 / 5.5 | Redraw on the flyer rig with a wider wingspan and ears |
| family-e | eels | finish.v2 | 5.5 / 5.5 | Redraw on the serpent rig with a fin and gape; check contrast on dark floors in the scene view |
| family-f | fungus horrors | finish.v1 | 6 / 5.5 | A clear mushroom cap and stalk silhouette, not a small humanoid |
| family-r | rats | finish.v2 | 5 / 5.5 | Redraw on the quadruped rig: ears, snout and a thin tail apart from the lizard |
| terrain-floor | floor | finish.v2 | 7 / 6 | Keep unless the in-game screenshot shows banding; the blind miss is small |
| terrain-stairs-up | stairs up | finish.v2 | 7 / 6 | Keep, or ship the best version |
| class-priest | priest | finish.v1 | 6.5 / 6 | A flowing robe with a tapered hem; the straight striped box breaks the robe rule |
| class-sorcerer | sorcerer | finish.v1 | 7 / 6 | Its own silhouette among the casters (see the caster note below); smaller, dimmer glow |
| class-beastmaster | beastmaster | finish.v2 | 6.5 / 6 | Drop the horned helm (the barbarian's); a bigger bird or a beast at heel that reads at 1x |
| family-d-cap | dragons | finish.v1 | 5 / 6 | Redraw on the large rig at the full 4 m: a clear neck, head and wings, taller than the hydra |
| family-h-cap | hydras | finish.v2 | 5.5 / 6 | Redraw on the large rig with separate necks |
| family-v-cap | vampires | finish.v1 | 6 / 6 | A tall cloaked figure; shrink the wings and make the colour token the main body colour |
| family-y-cap | bears | finish.v2 | 6 / 6 | Redraw on the quadruped rig at its 1.6 m: a shoulder hump, head, snout and ears |
| family-o | orcs | finish.v2 | 6.5 / 6 | A clear upright warrior silhouette with a weapon; lose the winged or big-eared look |
| family-q | wolves and hounds | finish.v2 | 5.5 / 6 | Redraw on the quadruped rig with the head and legs raised, apart from the lizard |
| npc-trader | trader | finish.v1 | 6 / 6 | A pack or laden frame on the back so the role reads at 1x |

## Lineup notes on assets above the bar

- **The casters look alike:** illusionist, sorcerer, warlock (and necromancer and hermit) share a hooded robe and a
  glowing hand. Give each its own headgear or held item, and let only one carry a bright glow.
- **The bandit** doesn't read as hostile next to the other people.
- **The golem** (family-c-cap) reads as a mech; with the metal and stone ramps now allowed for creatures, redraw it in
  stone or iron.
- **The giant's recolour ramp** covers a small area, so the per-row colour barely shows (see family-g-cap above).
