// boss-grask-the-pale base.v3 (r3, from base.v2) — the r2 review: skin lit from the direction's light (torso `linear`
// along the light, belly a broad sphere at low gain, no away-side rim on the hide, so no pillow ring); a clearer face
// (a lit brow shelf over 2 px dark sockets with a pale gleam, a nose, a jaw line under the underbite and taller tusks);
// calmer bone: horns, spikes and the mantle shaded flat in two bands (lit horns toward the light), the bead collar one
// bone torc with seams instead of seven loose beads, no rim layer on bone (it left orphans); one ink rule for bone (no
// underlays on horns/spikes, so the outline weight stays even); the loincloth is leather, not the blue cloth.
// boss-grask-the-pale base.v2 (r2, from base.v1) — the decorated pass on the approved shape (silhouette unchanged):
// bone parts (horn crown, femur club, spikes, beads, girdle, tusks) lit on the light side by a rim layer, a femur crack
// and knuckle seams; the loincloth is cloth with woven bands under a leather belt; the pauldron gets bone studs and a
// strap across the chest (front) or back; pale glowing eyes; scars as decals (a belly slash in front, whip scars on the
// back); the back facings show a bone mantle over the shoulder humps and a knobbed spine, so front and back differ
// inside the line; overlap AO and light material noise on hide and cloth.
// boss-grask-the-pale base.v1 (r1, shape draft) — from family-o-cap base.v4: the ogre's pear body and biped layout, made a
// bone-king: a tall crown of bone horns on the head, a spiked pauldron on the club shoulder, a bone-plate girdle over the
// loincloth, a bone-bead collar, and a giant femur for a club (long shaft, twin knuckle bulbs at the head). Flat materials only.
// family-o-cap base.v4 (x1, from base.v2) — the blind reviewer's point: v2 read as a golem (capsule limbs, box torso,
// small dome head, a stubby club at contact). The body is redrawn in the asset, still on the biped layout: a soft
// pear torso with hunched trapezius humps, a hanging pot belly over the hide loincloth, the egg head set forward and
// low between the humps (a narrow crown over a wide heavy jaw, tusks up from the underbite), each arm one continuous
// tapering bent limb from shoulder to fist, thick bowed legs on broad feet, and the club posed per frame so the
// contact frame slams it down and out beside the body instead of tucking it vertically in front.
// family-o-cap base.v2 (r2, from base.v1) — face only: 1 px dark eyes under a heavier brow ridge, an underbite jaw.
// family-o-cap base.v1 (r1) — ogres (glyph O, 3.6 m, twice the player) at the large frame. The skin is the recoloured
// ramp (recolour: skin).
import { biped, bipedAnchors, bipedLayout } from '../../../lib/beast.v1.js';
export const meta = { brief: 'boss-grask-the-pale', pass: 'r3', notes: 'directional skin light, clear face, calm flat bone, leather loincloth, even outline', mirror: false, recolour: 'skin' };
const H = 3.6;

// Per state and frame, in pixels from the body centre (x) and absolute y: the club arm (shoulder fixed) as elbow,
// fist and club head; the off arm as elbow and fist. Screen-left arm holds the club (as the biped rig's main hand).
const ARMS = {
  idle: [
    { e: [-17, 50], f: [-16, 61], c: [-24, 77], oe: [17, 50], of: [16, 61] },
    { e: [-17, 51], f: [-16, 62], c: [-24, 77], oe: [17, 51], of: [16, 62] },
  ],
  walk: [
    { e: [-17, 50], f: [-14, 60], c: [-21, 77], oe: [18, 49], of: [18, 59] },
    { e: [-17, 50], f: [-16, 61], c: [-24, 77], oe: [17, 50], of: [16, 61] },
    { e: [-18, 49], f: [-18, 59], c: [-27, 76], oe: [17, 50], of: [14, 60] },
    { e: [-17, 50], f: [-16, 61], c: [-24, 77], oe: [17, 50], of: [16, 61] },
  ],
  attack: [
    { e: [-19, 31], f: [-12, 22], c: [-20, 5], oe: [17, 49], of: [15, 57] },  // anticipation: club raised over the shoulder
    { e: [-20, 35], f: [-24, 29], c: [-27, 11], oe: [18, 48], of: [17, 56] }, // swing: coming over and out
    { e: [-19, 47], f: [-21, 57], c: [-27, 74], oe: [18, 50], of: [19, 59] }, // contact: slammed down beside the feet
    { e: [-18, 49], f: [-18, 60], c: [-24, 76], oe: [17, 50], of: [16, 61] }, // recovery
  ],
};
const armsOf = ctx => { const a = ARMS[ctx.state] ?? ARMS.idle; return a[(ctx.logical ?? ctx.frame) % a.length]; };

export function render(ctx) {
  const decals = []; // marks on named parts, laid by the procedural pass
  const proc = p => {
    p = p.add('ao', { part: ['body', 'belly', 'loincloth', 'leg', 'pauldron'] })
      .add('materialNoise', { part: ['loincloth', 'pauldron'], amount: 0.08, scale: 3, seed: ctx.variant ?? 0 });
    for (const d of decals) p = p.add('decal', d);
    return p;
  };
  return biped(ctx, k => {
    const { pal, cx, foot, P, back, smooth } = k, A = armsOf(ctx);
    const up = k.shoulder - (foot - k.Y(21)); // the bob
    const t = back ? 0 : -2;                  // the face turned toward the viewer's left
    const at = ([dx, y], dy = up) => [cx + dx, y + dy];

    // ---- the club arm (screen left) with its club; from behind it goes first, behind the body
    const clubArm = () => {
      const sh = at([-12, 40]), e = at(A.e), f = at(A.f), c = [cx + A.c[0], A.c[1] + (A.c[1] > 70 ? 0 : up)];
      const dir = [c[0] - f[0], c[1] - f[1]], len = Math.hypot(...dir), n = [dir[0] / len, dir[1] / len];
      const butt = [f[0] - n[0] * 3, f[1] - n[1] * 3], mid = [f[0] + n[0] * len * 0.55 - n[1] * 1, f[1] + n[1] * len * 0.55 + n[0] * 1];
      k.add({ type: 'tube', name: 'club', underlay: true, mat: pal.hair, shade: 'cyl', pts: [butt, mid, c], w: 3.4, w1: 5.4 });
      for (const m of [-1, 1]) k.add({ type: 'circle', name: 'femur-knob', cx: c[0] + m * 3.2 + n[0] * 1, cy: c[1] + n[1] * 1 + 1, r: 3.6, mat: pal.hair, shade: 'sphere' });
      k.add({ type: 'circle', name: 'femur-end', cx: f[0] - n[0] * 3, cy: f[1] - n[1] * 3, r: 2.2, mat: pal.hair, shade: 'sphere' });
      // a hairline crack down the shaft and the seam between the twin knuckles
      const cr = [f[0] + n[0] * len * 0.42, f[1] + n[1] * len * 0.42];
      decals.push({ name: 'crack', part: 'club', mat: 'hair', band: 2, shape: [
        { type: 'rect', x: Math.round(cr[0]), y: Math.round(cr[1]), w: 1, h: 2 }] });
      decals.push({ name: 'seam', part: 'femur-knob', mat: 'hair', band: 2, shape: { type: 'rect', x: Math.round(c[0]), y: Math.round(c[1] + n[1] * 1 - 1), w: 1, h: 3 } });
      k.add({ type: 'circle', name: 'knot', cx: f[0] + n[0] * len * 0.7 + n[1] * 2.6, cy: f[1] + n[1] * len * 0.7 - n[0] * 2.6, r: 1.6, mat: pal.leather, shade: 'flat', band: 0 });
      k.add({ type: 'circle', name: 'knot', cx: c[0] - n[0] * 3 - n[1] * 2.4, cy: c[1] - n[1] * 3 + n[0] * 2.4, r: 1.4, mat: pal.leather, shade: 'flat', band: 1 });
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', pts: [sh, e, f], w: 7.4, w1: 5 });
      k.add({ type: 'ellipse', name: 'fist', underlay: true, cx: f[0], cy: f[1], rx: 3.4, ry: 3, mat: pal.skin, shade: 'sphere' });
    };
    const offArm = () => {
      const sh = at([12, 40]), e = at(A.oe), f = at(A.of);
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', pts: [sh, e, f], w: 7.4, w1: 5 });
      k.add({ type: 'ellipse', name: 'fist', underlay: true, cx: f[0], cy: f[1], rx: 3.4, ry: 3, mat: pal.skin, shade: 'sphere' });
    };
    // ---- the egg head: a narrow crown over a wide heavy jaw, sunk forward between the shoulder humps
    const head = () => {
      const hx = cx + t, hy = 31 + up;
      k.add({ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d: smooth([[hx, hy - 10], [hx + 4.6, hy - 7.6], [hx + 5.8, hy - 2], [hx + 7, hy + 3], [hx + 5.6, hy + 6.4], [hx, hy + 7.4], [hx - 5.6, hy + 6.4], [hx - 7, hy + 3], [hx - 5.8, hy - 2], [hx - 4.6, hy - 7.6]]) });
      for (const [dx, h, w] of [[-6, 6, 3], [-3, 8, 3], [0, 10, 3.4], [3, 8, 3], [6, 6, 3]]) k.add({ type: 'path', name: 'horn', mat: pal.hair, shade: 'flat', band: dx <= 0 ? 0 : 1, d: `M${hx + dx - w / 2} ${hy - 7} L${hx + dx + (dx > 0 ? 1 : dx < 0 ? -1 : 0)} ${hy - 7 - h} L${hx + dx + w / 2} ${hy - 7} Z` });
      k.add({ type: 'rect', name: 'crown-band', x: Math.round(hx - 6), y: Math.round(hy - 8), w: 12, h: 3, mat: pal.hair, shade: 'flat', band: 1 });
      // the horns lashed to the band: a dark sinew binding between each pair
      decals.push({ name: 'binding', part: 'crown-band', mat: 'leather', band: 1, shape: [-4.5, -1.5, 1.5, 4.5].map(dx => ({ type: 'rect', x: Math.round(hx + dx), y: Math.round(hy - 8), w: 1, h: 3 })) });
      if (back) {
        // from behind: the knot of the binding and the ridge of the skull under the crown
        k.add({ type: 'rect', name: 'crown-knot', x: Math.round(hx - 1), y: Math.round(hy - 6), w: 2, h: 2, mat: pal.leather, shade: 'flat', band: 1 });
        k.add({ type: 'rect', name: 'nape', x: Math.round(hx - 3), y: Math.round(hy + 3), w: 6, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
        return;
      }
      // a heavy brow shelf lit on top, deep sockets under it with a pale gleam, a broad nose, the jaw line under the
      // underbite and two tall ivory tusks standing up past the upper lip
      k.add({ type: 'path', name: 'brow', mat: pal.skin, shade: 'flat', band: 1, d: smooth([[hx - 6, hy - 1.6], [hx - 4.6, hy - 4.2], [hx, hy - 3.6], [hx + 4.6, hy - 4.2], [hx + 6, hy - 1.6], [hx, hy - 2.4]]) });
      k.add({ type: 'rect', name: 'brow-lit', x: Math.round(hx - 5), y: Math.round(hy - 4), w: 4, h: 1, mat: pal.skin, shade: 'flat', band: 0 });
      for (const e of [-3, 2]) {
        k.add({ type: 'rect', name: 'socket', x: Math.round(hx + e - 0.5), y: Math.round(hy - 2), w: 2, h: 2, color: 'outline' });
        k.add({ type: 'rect', name: 'eye', x: Math.round(hx + e - 0.5) + (e < 0 ? 1 : 0), y: Math.round(hy - 1), w: 1, h: 1, color: 'glow.0' });
      }
      k.add({ type: 'rect', name: 'nose', x: Math.round(hx - 1), y: Math.round(hy), w: 2, h: 2, mat: pal.skin, shade: 'flat', band: 1 });
      k.add({ type: 'rect', name: 'nose-shadow', x: Math.round(hx + 1), y: Math.round(hy + 1), w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      k.add({ type: 'rect', name: 'mouth', x: Math.round(hx - 4), y: Math.round(hy + 3), w: 8, h: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'jaw', x: Math.round(hx - 4), y: Math.round(hy + 5), w: 8, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      for (const s of [-1, 1]) k.add({ type: 'rect', name: 'tusk', x: Math.round(hx + s * 3.5 - 0.5), y: Math.round(hy + 1), w: 1, h: 3, mat: pal.hair, shade: 'flat', band: 0 });
    };

    const pauldron = () => {
      const px = cx - 13, py = 35 + up;
      k.add({ type: 'ellipse', name: 'pauldron', underlay: true, cx: px, cy: py, rx: 7, ry: 4.5, mat: pal.leather, shade: 'sphere' });
      for (const [dx, dy] of [[-5, -4], [-1, -7], [4, -5]]) k.add({ type: 'path', name: 'spike', mat: pal.hair, shade: 'flat', band: dx < 0 ? 0 : 1, d: `M${px + dx - 1.8} ${py + dy + 3} L${px + dx + dx * 0.15} ${py + dy - 5} L${px + dx + 1.8} ${py + dy + 3} Z` });
      // bone studs along the hide's lower rim, and its stitched seam
      decals.push({ name: 'seam', part: 'pauldron', mat: 'leather', band: 2, shape: { type: 'rect', x: Math.round(px - 5), y: Math.round(py + 1), w: 10, h: 1 } });
      decals.push({ name: 'studs', part: 'pauldron', mat: 'hair', band: 0, shape: [-4, 0, 4].map(dx => ({ type: 'rect', x: Math.round(px + dx), y: Math.round(py + 2), w: 1, h: 1 })) });
    };
    // the pauldron's strap, diagonally over the chest (front) or the back to the off armpit
    const strap = () => k.add({ type: 'tube', name: 'strap', underlay: true, mat: pal.leather, shade: 'flat', band: 1, pts: [[cx - 10, 38 + up], [cx + 1, 41 + up], [cx + 12, 44 + up]], w: 2.2 });
    // ---- bowed thick legs on broad feet
    P.feet.forEach((dy, i) => {
      const s = i ? 1 : -1, lift = dy < 0 ? -2 : 0, fwd = dy > 0 ? 1 : 0;
      const hip = [k.baseCx + s * 6, 58], knee = [k.baseCx + s * 9, 67 + lift / 2], ankle = [k.baseCx + s * (7 + fwd), 74 + lift];
      k.add({ type: 'tube', name: 'leg', underlay: true, mat: pal.skin, shade: 'cyl', pts: [hip, knee, ankle], w: 9.6, w1: 6 });
      k.add({ type: 'ellipse', name: 'foot', underlay: true, cx: ankle[0] + s * 1.2, cy: 76 + lift, rx: 4.8, ry: 2.2, mat: pal.skin, shade: 'sphere' });
    });
    // ---- hide loincloth, ragged at the hem
    k.add({ type: 'path', name: 'loincloth', underlay: true, mat: pal.leather, shade: 'linear', gain: 1, d: smooth([[cx - 9, 55 + up], [cx + 9, 55 + up], [cx + 8, 64], [cx + 4, 66], [cx + 1, 70], [cx - 2, 66], [cx - 6, 67], [cx - 8.5, 63]]) });
    if (back) head();
    // ---- the pear torso: hunched trapezius humps, sloping heavy shoulders, sides widening into the gut
    k.add({ type: 'path', name: 'body', underlay: true, mat: pal.skin, shade: 'linear', gain: 1.1, d: smooth([
      [cx, 29 + up], [cx + 6, 27.5 + up], [cx + 12, 33 + up], [cx + 15.5, 40 + up], [cx + 14, 47 + up], [cx + 13, 53 + up], [cx + 10, 59 + up],
      [cx, 60 + up], [cx - 10, 59 + up], [cx - 13, 53 + up], [cx - 14, 47 + up], [cx - 15.5, 40 + up], [cx - 12, 33 + up], [cx - 6, 27.5 + up]]) });
    if (!back) {
      // the pot belly hanging over the loincloth's belt, a sagging chest line above it
      k.add({ type: 'ellipse', name: 'belly', underlay: true, cx: cx - 0.5, cy: 54 + up, rx: 10.5, ry: 8.5, mat: pal.skin, shade: 'sphere', gain: 0.9 });
      k.add({ type: 'rect', name: 'navel', x: Math.round(cx - 1), y: Math.round(55 + up), w: 1, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      // an old slash healed pale across the gut, and a nick over the heart
      decals.push({ name: 'scar', part: 'belly', mat: 'skin', band: 0, shape: { type: 'poly', pts: [[cx + 2, 47 + up], [cx + 3.4, 47 + up], [cx + 8.4, 54 + up], [cx + 7, 54 + up]] } });
      decals.push({ name: 'scar', part: 'body', mat: 'skin', band: 0, shape: { type: 'rect', x: Math.round(cx - 9), y: Math.round(43 + up), w: 3, h: 1 } });
      strap();
      k.add({ type: 'path', name: 'girdle', underlay: true, mat: pal.hair, shade: 'bevel', d: `M${cx - 11} ${59 + up} H${cx + 11} L${cx + 9} ${64 + up} L${cx + 5} ${62 + up} L${cx} ${66 + up} L${cx - 5} ${62 + up} L${cx - 9} ${64 + up} Z` });
      decals.push({ name: 'plates', part: 'girdle', mat: 'hair', band: 2, shape: [-6, -2, 2, 6].map(dx => ({ type: 'rect', x: Math.round(cx + dx), y: Math.round(59 + up), w: 1, h: 3 })) });
      head();
      // the bone torc: one band of ivory over the collarbones, its plates seamed
      k.add({ type: 'tube', name: 'bead', mat: pal.hair, shade: 'flat', band: 0, pts: [[cx - 9, 38 + up], [cx, 40.5 + up], [cx + 9, 38 + up]], w: 2.4 });
      decals.push({ name: 'torc-seams', part: 'bead', mat: 'hair', band: 1, shape: [-6, -2, 2, 6].map(dx => ({ type: 'rect', x: Math.round(cx + dx), y: Math.round(37.5 + up + (9 - Math.abs(dx)) / 3.6), w: 1, h: 2 })) });
      offArm(); clubArm(); pauldron();
    } else {
      // from behind: the spine's groove down the back, its knobs lit on top
      k.add({ type: 'rect', name: 'spine', x: Math.round(cx), y: Math.round(37 + up), w: 1, h: 18, mat: pal.skin, shade: 'flat', band: 2 });
      for (let y = 40; y <= 52; y += 4) k.add({ type: 'rect', name: 'vertebra', x: Math.round(cx - 1), y: Math.round(y + up), w: 3, h: 1, mat: pal.skin, shade: 'flat', band: 0 });
      // the loincloth's leather belt across the small of the back
      k.add({ type: 'rect', name: 'belt', x: Math.round(cx - 9), y: Math.round(57 + up), w: 18, h: 2, mat: pal.leather, shade: 'flat', band: 1 });
      // whip scars across the back, healed pale
      decals.push({ name: 'scar', part: 'body', mat: 'skin', band: 0, shape: [
        { type: 'poly', pts: [[cx - 10, 44 + up], [cx - 8.6, 44 + up], [cx - 3, 50 + up], [cx - 4.4, 50 + up]] },
        { type: 'poly', pts: [[cx + 3, 46 + up], [cx + 4.4, 46 + up], [cx + 10, 52 + up], [cx + 8.6, 52 + up]] }] });
      strap();
      // the bone mantle: ribs and long bones lashed in a fan over the shoulder humps
      k.add({ type: 'path', name: 'mantle-hide', underlay: true, mat: pal.leather, shade: 'flat', band: 2, d: smooth([[cx - 11, 35 + up], [cx - 6, 31 + up], [cx, 30.5 + up], [cx + 6, 31 + up], [cx + 11, 35 + up], [cx + 9, 38.5 + up], [cx, 37 + up], [cx - 9, 38.5 + up]]) });
      for (const [dx, lean] of [[-8, -1.5], [-4, -0.5], [0, 0], [4, 0.5], [8, 1.5]]) {
        k.add({ type: 'tube', name: 'mantle', mat: pal.hair, shade: 'flat', band: dx <= 0 ? 0 : 1, pts: [[cx + dx * 0.8, 31.5 + up + Math.abs(dx) * 0.3], [cx + dx + lean, 37.5 + up + Math.abs(dx) * 0.15]], w: 2, w1: 1.6 });
        k.add({ type: 'circle', name: 'mantle-knob', cx: cx + dx + lean, cy: 38 + up + Math.abs(dx) * 0.15, r: 1.3, mat: pal.hair, shade: 'flat', band: 0 });
      }
      clubArm(); offArm(); pauldron();
    }
  }, { height: H, proc });
}

// head and the club fist follow the drawing; eyes and mouth for the finish's face (front only); ground from the rig
export const anchors = ctx => {
  const base = bipedAnchors(ctx, { height: H, headDy: 4, eyes: 1.4, hand: L => [L.L + L.X(1), L.waist + L.Y(1)] });
  const Lo = bipedLayout(ctx, H), A = armsOf(ctx), up = Lo.shoulder - (Lo.foot - Lo.Y(21)), back = Lo.back;
  const flip = ctx.facing === 'e' || ctx.facing === 'n', fx = x => { const p = Math.round(x); return flip ? Lo.w - 1 - p : p; };
  const t = back ? 0 : -2, hx = Lo.cx + t, hy = 31 + up;
  const out = { ...base, head: [fx(hx), Math.round(hy - 6)], hand: [fx(Lo.cx + A.f[0]), Math.round(A.f[1] + up)] };
  delete out.eye; delete out.eye2; delete out.mouth;
  if (!back) { out.eye = [fx(hx - 3), Math.round(hy - 1)]; out.eye2 = [fx(hx + 2), Math.round(hy - 1)]; out.mouth = [fx(hx), Math.round(hy + 3)]; }
  return out;
};
