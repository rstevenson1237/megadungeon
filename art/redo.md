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

## Batch 3: not approved, below the bar (24)

Task 6.7 ran one capped revision per asset (October 23, 2026). Robert approved the 21 above the bar and sent these 24 here. They are not exported, so the game draws their glyph until a redo is approved.

| Asset | Final | Score | Proposed fix |
| --- | --- | --- | --- |
| feature-altar | base.v3 | 6 / 5.5 | issue: blind re-score 5.5 is under 6.5: Works: clean stone ramp, correct iso top-lit, outline and ground contact fine, offered state's candles add the only light. Biggest problem: reads as a squat stone cube/crate, not an altar - near-cubic two-tier block with no overhanging mensa slab, no recessed pedestal, the brown-red top/left-face patch reads as rust or a stain rather than an altar cloth; silhouette is a rounded hexagon blob. Next: widen and lower into a long slab (like the anchor) overhanging a narrower stepped plinth, make the cloth a clear draped runner with a hanging fold on the front face, make offerings small candles/bowl rather than square blocks. |
| feature-sarcophagus | finish.v1 | 6.5 / 5 | base revision: taper the body (wider at head end, coffin profile), add a carved effigy/cross relief and banded plinth on the lid, and for open slide the lid diagonally off one end showing a dark interior cavity |
| feature-rune | finish.v1 | 7 / 6 | base revision: redraw as an open angular rune (straight strokes, no creature-like body loop) inside a faint foreshortened circle, drop the outer outline for a carved inner-shadow edge (selective line), keep the glow core to 1-2 bright pixels |
| feature-sign | finish.v2 | 7 / 5.5 | base revision: put the face on the mid wood steps with a darker grain line, cut the letters as 2 rows of 1 px dark strokes along the plane, thicken the rim to 2 px with corner nails |
| feature-wall-rune | finish.v1 | 7.5 / 6 | base revision: cut the rune in (dark inner groove + 1px light lower lip, no full outer outline) so spent reads as an engraving on stone, give it a more angular multi-stroke rune shape, and keep the dormant glow to the groove core with a one-step accent halo |
| feature-spirit-totem | finish.v1 | 7.5 / 5.5 | base revision: narrow the shaft to ~10-12px with wings only at the top, separate 2-3 faces with lit brow/nose planes and fewer dark interior lines, sit it on a wider stone plinth reading on the floor diamond's bottom 16 rows |
| family-coins | base.v1 | 7 / 4 | next change (base): rebuild as a spill of 5-7 flat iso ellipses (about 5x3 px each) with a short stack of 3-4 at the back, using the gold ramp (light rim top-left, dark underside band), a 1-2 px specular glint on the top coin, scattered unevenly across the diamond rather than a tight block |
| family-gems | finish.v2 | 7 / 6 | recolour the tan stone to a gem hue with a pointed pavilion, add a bright table facet and darker pavilion facets to each gem, and a 1px sparkle highlight so the pile reads at 1x |
| family-weapon | base.v1 | 7.5 / 5.5 | lengthen the blade to about two thirds of the item, taper it to a 1-2px point, make the crossguard a thin bar across the blade, shrink the grip and pommel, and centre it on the diamond |
| family-armour | base.v1 | 6 / 6 | add a ring-mail texture (alternating light/mid 1px rows across the top face), a visible fold line and a sleeve edge, and darken the neck opening to the metal shadow step instead of brown |
| family-clothing | base.v1 | 6 / 5.5 | make it one clean rounded folded rectangle in a single cloth ramp with one or two soft fold lines, drop the brown side (use the cloth shadow step), keep the clasp as a 2px accent on the front edge, clean stray pixels on the right end |
| family-book | base.v1 | 7 / 5 | make the cover a dark leather or cloth ramp with a 1px lighter border or clasp, give the near long side and front edge a pale 1-row page band between two cover lines, and clear the stray dark pixels on the top face |
| family-ammunition | base.v2 | 7 / 6 | lay the bundle flat along the iso diagonal with 3-4 shafts splayed slightly, heads at one end and fletching at the other, and keep the cord as a 1px light-leather band across the middle |
| family-quest-item | base.v2 | 7 / 6 | break the outline with a knotted cord tie and a loose cloth flap or tuft at the top, thin the cord to 1px wrapped diagonally, and give the cloth a fold or two so the object inside shows its shape |
| fx-miss | base.v2 | 7 / 5 | base revision - replace the arc with a rounded dust cloud (2-3 overlapping blobs) on the dirt/stone ramp, lighter values, growing f1-f3 and thinning/breaking apart on f4; keep a 1-2px spray of grit, drop the blade arc |
| fx-bolt | base.v1 | 7 / 6 | base revision - drop the fin pixels, make the head a pointed light core (glow light) with a 1px flicker ring that pulses f1-f4, let the tail break into 2-3 trailing sparks on alternate frames; trim the dark outline clusters along the tail |
| fx-push | base.v1 | 6.5 / 6 | base revision - make the wave a thin 2px arc (cream edge, slate trailing band) with 1-2 fainter echo arcs behind it, widen and move it 3-4px per frame and fade/break it on f4; drop the regular horizontal streaks or make them uneven and shorter |
| fx-die-lost | base.v2 | 7 / 6 | base revision - draw a small iso cube (light top face with 1 pip, two shaded side faces with pips on the stone/skin-light ramp), crack it on f2-f3 and on f4 push the two halves 2-3px apart with a tilt and a couple of chip pixels; clean the stray dark pixels in the crack |
| icon-poisoned | base.v2 | 5 / 6 | curve the fang (hooked tip, 1px narrower near the root) and colour the two drips in the brightest green/grass step so they read as venom, keep them separate from the tip by 1px |
| icon-slowed | base.v2 | 6.5 / 6 | round the shell's corners (cut x3,y1 and x7,y5 to outline), lengthen the body forward and add a 1px eye-stalk pair above the head at x1,y0-1 |
| icon-hasted | base.v2 | 5.5 / 5 | draw an L-shaped boot (3px shaft up the left, toe pointing right along the bottom row) in the leather ramp and attach a smaller 2-3 feather wing to the heel/back of the shaft |
| icon-asleep | base.v1 | 4.5 / 6 | cut it to a downward-curving lid arc (top half only, open below), make the lash line a single curved dark row with 3 ticks, and lift the top edge to the highlight step so the lid shape leads |
| icon-held | base.v2 | 6 / 5.5 | draw a U-shaped shackle (rounded 1px-thick bar over an open cuff) with one short chain link hanging off it, round the ring corners and give the metal one highlight pixel on the upper left |
| icon-cursed | base.v1 | 7 / 5.5 | round the ring's corners, end both arcs cleanly at a 1-2px diagonal gap at upper right with the outline closing each end, and drop the outline around the empty gap |

Open lineup notes from batch 3:

- **Coins:** Robert chose gold on October 24, 2026. `art/direction.json` now has a `gold` ramp for props (the gold material maps to it), so the redo draws the coins in `gold`, not the metal or accent ramp.
- **fx-hit and icon-blessed** (both approved) are four-point stars. Redraw icon-blessed as a disc with eight rays.
