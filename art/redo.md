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

## Batch 3: not approved, below the bar (17)

Task 6.7 ran one capped revision per asset (October 23, 2026). Robert approved the 21 above the bar and sent these 24 here. The art redo wave 1 (November 20, 2026) approved 7 more (coins, gems, weapon, book, bolt, push, die lost); the 5 floor items and effects it left below the bar carry its notes. They are not exported, so the game draws their glyph until a redo is approved.

| Asset | Final | Score | Proposed fix |
| --- | --- | --- | --- |
| feature-altar | base.v3 | 6 / 5.5 | issue: blind re-score 5.5 is under 6.5: Works: clean stone ramp, correct iso top-lit, outline and ground contact fine, offered state's candles add the only light. Biggest problem: reads as a squat stone cube/crate, not an altar - near-cubic two-tier block with no overhanging mensa slab, no recessed pedestal, the brown-red top/left-face patch reads as rust or a stain rather than an altar cloth; silhouette is a rounded hexagon blob. Next: widen and lower into a long slab (like the anchor) overhanging a narrower stepped plinth, make the cloth a clear draped runner with a hanging fold on the front face, make offerings small candles/bowl rather than square blocks. |
| feature-sarcophagus | finish.v1 | 6.5 / 5 | base revision: taper the body (wider at head end, coffin profile), add a carved effigy/cross relief and banded plinth on the lid, and for open slide the lid diagonally off one end showing a dark interior cavity |
| feature-rune | finish.v1 | 7 / 6 | base revision: redraw as an open angular rune (straight strokes, no creature-like body loop) inside a faint foreshortened circle, drop the outer outline for a carved inner-shadow edge (selective line), keep the glow core to 1-2 bright pixels |
| feature-sign | finish.v2 | 7 / 5.5 | base revision: put the face on the mid wood steps with a darker grain line, cut the letters as 2 rows of 1 px dark strokes along the plane, thicken the rim to 2 px with corner nails |
| feature-wall-rune | finish.v1 | 7.5 / 6 | base revision: cut the rune in (dark inner groove + 1px light lower lip, no full outer outline) so spent reads as an engraving on stone, give it a more angular multi-stroke rune shape, and keep the dormant glow to the groove core with a one-step accent halo |
| feature-spirit-totem | finish.v1 | 7.5 / 5.5 | base revision: narrow the shaft to ~10-12px with wings only at the top, separate 2-3 faces with lit brow/nose planes and fewer dark interior lines, sit it on a wider stone plinth reading on the floor diamond's bottom 16 rows |
| family-armour | base.v1 | 6 / 6 | Wave 1 (Nov 20): v3 front-on shirt (blind 5) and v4 1px checker (own 4.5, a speckled rock) both lost to v1. Keep v1's flat folded pose, smaller; mail as 2px ring clusters, not a 1px checker; sleeves, collar notch and hem |
| family-clothing | base.v4 | 7 / 5.5 | Wave 1: still reads as a pillow or flat stone. Stacked fold layers with a darker band, a hood or collar flap at the gold clasp, highlight only on the lit rim |
| family-ammunition | base.v2 | 7 / 6 | Wave 1: flat bundles v3/v4 (blind 5.5) read as sticks with the same pale ends. Distinct metal arrowheads at one end, splayed cloth or accent fletching at the other, 3-4 clean shafts with dark gaps, ends fanned like a sheaf |
| family-quest-item | base.v2 | 7 / 6 | Wave 1: v3 read as a bottle, v4 as rubble (own 5). Big cloth planes (light top, mid side, dark under), one unbroken cord with a knot, a raised tied end or tag |
| fx-miss | base.v4 | 6.5 / 6 | Wave 1: reads as snow or rock mounds. Needs warm dusty grey-brown and an open (not closed) outline; effects lack stone/dirt ramps and the line gate wants a dark outline, so this needs a direction decision first |
| icon-poisoned | base.v2 | 5 / 6 | curve the fang (hooked tip, 1px narrower near the root) and colour the two drips in the brightest green/grass step so they read as venom, keep them separate from the tip by 1px |
| icon-slowed | base.v2 | 6.5 / 6 | round the shell's corners (cut x3,y1 and x7,y5 to outline), lengthen the body forward and add a 1px eye-stalk pair above the head at x1,y0-1 |
| icon-hasted | base.v2 | 5.5 / 5 | draw an L-shaped boot (3px shaft up the left, toe pointing right along the bottom row) in the leather ramp and attach a smaller 2-3 feather wing to the heel/back of the shaft |
| icon-asleep | base.v1 | 4.5 / 6 | cut it to a downward-curving lid arc (top half only, open below), make the lash line a single curved dark row with 3 ticks, and lift the top edge to the highlight step so the lid shape leads |
| icon-held | base.v2 | 6 / 5.5 | draw a U-shaped shackle (rounded 1px-thick bar over an open cuff) with one short chain link hanging off it, round the ring corners and give the metal one highlight pixel on the upper left |
| icon-cursed | base.v1 | 7 / 5.5 | round the ring's corners, end both arcs cleanly at a 1-2px diagonal gap at upper right with the outline closing each end, and drop the outline around the empty gap |

Open lineup notes from batch 3:

- **Coins:** Robert chose gold on October 24, 2026. `art/direction.json` now has a `gold` ramp for props (the gold material maps to it), so the redo draws the coins in `gold`, not the metal or accent ramp.
- **fx-hit and icon-blessed** (both approved) are four-point stars. Redraw icon-blessed as a disc with eight rays.

## Batch 4: approved below the bar (16)

Robert approved all 44 task 6.9 assets on November 18, 2026. These 16 carried a blind score under 6.5 in their approval
warnings (`art/ledger.jsonl`). Robert asked on November 20, 2026 to work through the whole list, so they are added here.
The common complaint: boxy bodies, thin or small for a boss, facings that differ little.

| Asset | Final | Blind | Proposed fix |
| --- | --- | --- | --- |
| boss-the-drowned-duke | base.v5 | 5 | Read as drowned: a bloated, weed-hung body, split legs, a coat that drips; drop the grey pillar legs |
| boss-the-tallow-king | base.v4 | 5.5 | Keep the candle crown; a melting, sagging body that is taller than wide |
| boss-morrigan-dusk | base.v3 | 5.5 | Open the mantle so the arms show; make the four facings differ; a second ramp beside the teal |
| boss-azhul-emberheart | base.v2 | 6 | Simplify the wing and arm masses; distinct facings; clearly bigger than its family |
| boss-eshkal-the-unmaker | base.v2 | 6 | Something that unmakes: a broken or dissolving outline, not a generic red dragon |
| boss-grask-the-pale | base.v4 | 6 | Rounder head and limbs; bone-pale skin, not salmon |
| boss-hexmother-yarrow | base.v3 | 6 | Bulk her up to boss size: a wide hat and robe, a big staff, a bright accent |
| boss-hrolf-the-hammerlord | base.v2 | 6 | Break the boxy body and the cloak slab; bigger, with more contrast |
| boss-old-mawkin | base.v5 | 6 | Jointed, splayed legs on the quadruped rig |
| boss-sister-gloam | base.v4 | 6 | A flowing robe with a tapered, ragged hem |
| boss-the-gilded-wyrm | base.v3 | 6 | Gold scales and horns in the gold ramp (Spec 01b, art redo clarification); a bigger footprint |
| boss-the-hollow-abbot | base.v4 | 6 | A flowing robe, not a flat-hemmed trapezoid |
| boss-the-hungering-dark | base.v2 | 6 | Dark body (deep cloth or stone ramp) with a glowing maw; firmer side and back views |
| boss-the-lantern-man | base.v2 | 6 | A big, bright lantern as the focus; break the plain robe column |
| boss-varn-ironmouth | base.v5 | 6 | Thick legs and a hulking torso; a bigger head and iron jaw |
| boss-qorra-of-the-lake | base.v2 | 6 | A thick neck and a large coil in idle and walk, as strong as the attack pose |

## Lineup notes only (7)

Above the bar, but redrawn in the same pass for the lineup notes above: class-illusionist, class-warlock,
class-necromancer, npc-hermit (the casters), npc-bandit (looks hostile), family-c-cap (stone or iron golem, not a mech)
and icon-blessed (a disc with eight rays, apart from fx-hit).
