// boss-grask-the-pale base.v4 (r4, from base.v3) — the rescale: the brief's height is now 4.6 m (74 px, twice the drawn
// player), so the rig runs at H = 4.6 and every hard-coded measure goes through the scale helpers (Y about the feet by
// 74/64, X across by 1.1, the club head kept inside the 64 px frame, the raised club's heights eased above the shoulder so it
// keeps its length under the frame top); 1 px features stay whole pixels and the face uses the extra pixels (a wider
// mouth and jaw, 5 px tusks, a taller nose, a wider lit brow).
// One cheap fix from the blind note: the head is drawn 1.2x larger again (more mass), and from behind it shows a
// lashed hair tail under the crown knot so the back facings read as backs.
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
export const meta = { brief: 'boss-grask-the-pale', pass: 'r4', notes: 'rescaled to 4.6 m (74 px), bigger head, back hair tail', mirror: false, recolour: 'skin' };
const H = 4.6;

// The v3 drawing's measures (64 px tall at 3.6 m) mapped to the new height: y about the feet row, x from the body's
// centre, radii and widths. Relative to the frame: FY is the feet row (size h - 2), the scale the height ratio.
const v3px = 64, newPx = 74;
const geo = ctx => {
  const [w, h] = ctx.size, FY = h - 2, SY = newPx / v3px, SX = 1.1, HS = 1.2;
  return { FY, SY, SX, HS, Y: y => FY - (FY - y) * SY, X: dx => dx * SX, R: r => r * SX, top: Math.round(h * 0.06) };
};

// Per state and frame, in v3 pixels from the body centre (x) and absolute y: the club arm (shoulder fixed) as elbow,
// fist and club head; the off arm as elbow and fist. Screen-left arm holds the club (as the biped rig's main hand).
const ARMS = {
  idle: [
    { e: [-17, 50], f: [-16, 61], c: [-24, 77], oe: [17, 50], of: [16, 61] },
    { e: [-17, 51], f: [-16, 62], c: [-24, 77], oe: [17, 51], of: [16, 62] },
  ],
  walk: [
    { e: [-17, 50], f: [-14, 60], c: [-21, 77], oe: [18, 49], of: [18, 59] },
    { e: [-17, 50], f: [-16, 61], c: [-24, 77], oe: [17, 50], of: [16, 61] },
    { e: [-18, 49], f: [-18, 59], c: [-26, 76], oe: [17, 50], of: [14, 60] },
    { e: [-17, 50], f: [-16, 61], c: [-24, 77], oe: [17, 50], of: [16, 61] },
  ],
  attack: [
    { e: [-19, 31], f: [-12, 22], c: [-20, 5], oe: [17, 49], of: [15, 57] },  // anticipation: club raised over the shoulder
    { e: [-20, 35], f: [-24, 29], c: [-26, 11], oe: [18, 48], of: [17, 56] }, // swing: coming over and out
    { e: [-19, 47], f: [-21, 57], c: [-26, 74], oe: [18, 50], of: [19, 59] }, // contact: slammed down beside the feet
    { e: [-18, 49], f: [-18, 60], c: [-24, 76], oe: [17, 50], of: [16, 61] }, // recovery
  ],
};
const armsOf = ctx => { const a = ARMS[ctx.state] ?? ARMS.idle; return a[(ctx.logical ?? ctx.frame) % a.length]; };
const headAt = (ctx, back, up) => { const G = geo(ctx); return { t: back ? 0 : -2, hy: G.Y(31) + up }; };

export function render(ctx) {
  const G = geo(ctx), { X, Y, R, SY, HS } = G, ri = v => Math.max(1, Math.round(v));
  const decals = []; // marks on named parts, laid by the procedural pass
  const proc = p => {
    p = p.add('ao', { part: ['body', 'belly', 'loincloth', 'leg', 'pauldron'] })
      .add('materialNoise', { part: ['loincloth', 'pauldron'], amount: 0.08, scale: 3, seed: ctx.variant ?? 0 });
    for (const d of decals) p = p.add('decal', d);
    return p;
  };
  return biped(ctx, k => {
    const { pal, cx, P, back, smooth } = k, A = armsOf(ctx);
    const up = k.shoulder - (k.foot - k.Y(21)); // the bob
    const { t, hy: hy0 } = headAt(ctx, back, up);
    const at = ([dx, y], dy = up) => [cx + X(dx), Y(y) + dy];
    const pts = (list, dy = up) => list.map(([dx, y]) => [cx + X(dx), Y(y) + dy]);

    // ---- the club arm (screen left) with its club; from behind it goes first, behind the body
    const clubArm = () => {
      // above the shoulder (the raised club) heights are eased so the club head stays under the frame top at full length
      const T = G.top + R(4), y40 = Y(40), Ya = y => y >= 40 ? Y(y) : y40 - (40 - y) * (y40 - T) / 35;
      const atA = ([dx, y]) => [cx + X(dx), Ya(y) + up];
      const sh = at([-12, 40]), e = atA(A.e), f = atA(A.f);
      const c = [Math.max(cx + X(A.c[0]), R(7.6)), A.c[1] > 70 ? Y(A.c[1]) : Ya(A.c[1]) + up];
      const dir = [c[0] - f[0], c[1] - f[1]], len = Math.hypot(...dir), n = [dir[0] / len, dir[1] / len];
      const butt = [f[0] - n[0] * R(3), f[1] - n[1] * R(3)], mid = [f[0] + n[0] * len * 0.55 - n[1] * 1, f[1] + n[1] * len * 0.55 + n[0] * 1];
      k.add({ type: 'tube', name: 'club', underlay: true, mat: pal.hair, shade: 'cyl', pts: [butt, mid, c], w: R(3.4), w1: R(5.4) });
      for (const m of [-1, 1]) k.add({ type: 'circle', name: 'femur-knob', cx: c[0] + m * R(3.2) + n[0], cy: c[1] + n[1] + 1, r: R(3.6), mat: pal.hair, shade: 'sphere' });
      k.add({ type: 'circle', name: 'femur-end', cx: f[0] - n[0] * R(3), cy: f[1] - n[1] * R(3), r: R(2.2), mat: pal.hair, shade: 'sphere' });
      // a hairline crack down the shaft and the seam between the twin knuckles
      const cr = [f[0] + n[0] * len * 0.55, f[1] + n[1] * len * 0.55]; // clear of the pauldron spikes when raised
      decals.push({ name: 'crack', part: 'club', mat: 'hair', band: 2, shape: [
        { type: 'rect', x: Math.round(cr[0]), y: Math.round(cr[1]), w: 1, h: 3 }] });
      decals.push({ name: 'seam', part: 'femur-knob', mat: 'hair', band: 2, shape: { type: 'rect', x: Math.round(c[0]), y: Math.round(c[1] + n[1] - 1), w: 1, h: 4 } });
      k.add({ type: 'circle', name: 'knot', cx: f[0] + n[0] * len * 0.7 + n[1] * R(2.6), cy: f[1] + n[1] * len * 0.7 - n[0] * R(2.6), r: R(1.6), mat: pal.leather, shade: 'flat', band: 0 });
      k.add({ type: 'circle', name: 'knot', cx: c[0] - n[0] * R(3) - n[1] * R(2.4), cy: c[1] - n[1] * R(3) + n[0] * R(2.4), r: R(1.4), mat: pal.leather, shade: 'flat', band: 1 });
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', pts: [sh, e, f], w: R(7.4), w1: R(5) });
      k.add({ type: 'ellipse', name: 'fist', underlay: true, cx: f[0], cy: f[1], rx: R(3.4), ry: 3 * SY, mat: pal.skin, shade: 'sphere' });
    };
    const offArm = () => {
      const sh = at([12, 40]), e = at(A.oe), f = at(A.of);
      k.add({ type: 'tube', name: 'arm', underlay: true, mat: pal.skin, shade: 'cyl', pts: [sh, e, f], w: R(7.4), w1: R(5) });
      k.add({ type: 'ellipse', name: 'fist', underlay: true, cx: f[0], cy: f[1], rx: R(3.4), ry: 3 * SY, mat: pal.skin, shade: 'sphere' });
    };
    // ---- the egg head: a narrow crown over a wide heavy jaw, sunk forward between the shoulder humps; drawn HS larger
    // than the body's scale (the blind note: more head mass)
    const head = () => {
      const hx = cx + t, hy = hy0, s = R(HS), v = SY * HS; // head measures in v3 px, scaled
      const hp = list => list.map(([dx, dy]) => [hx + dx * s, hy + dy * v]);
      k.add({ type: 'path', name: 'head', underlay: true, mat: pal.skin, shade: 'sphere', d: smooth(hp([[0, -10], [4.6, -7.6], [5.8, -2], [7, 3], [5.6, 6.4], [0, 7.4], [-5.6, 6.4], [-7, 3], [-5.8, -2], [-4.6, -7.6]])) });
      const cb = hy - 7 * v; // the crown band's top edge, where the horns stand
      if (back) {
        // from behind: a lashed tail of coarse hair down the nape, under the crown (the back cue)
        k.add({ type: 'tube', name: 'hair-tail', underlay: true, mat: pal.hair, shade: 'flat', band: 2, pts: [[hx, cb + 3 * v], [hx + 0.5, hy + 3 * v], [hx - 0.5, hy + 8 * v]], w: 4 * s, w1: 2.4 * s });
      }
      for (const [dx, h, w] of [[-6, 6, 3], [-3, 8, 3], [0, 10, 3.4], [3, 8, 3], [6, 6, 3]]) {
        const bx = hx + dx * s, tip = bx + (dx > 0 ? 1 : dx < 0 ? -1 : 0) * s;
        k.add({ type: 'path', name: 'horn', mat: pal.hair, shade: 'flat', band: dx <= 0 ? 0 : 1, d: `M${bx - (w / 2) * s} ${cb} L${tip} ${cb - h * SY} L${bx + (w / 2) * s} ${cb} Z` });
      }
      const bw = Math.round(12 * s), bh = Math.round(3 * v);
      k.add({ type: 'rect', name: 'crown-band', x: Math.round(hx - bw / 2), y: Math.round(cb - 1 * v), w: bw, h: bh, mat: pal.hair, shade: 'flat', band: 1 });
      // the horns lashed to the band: a dark sinew binding between each pair
      decals.push({ name: 'binding', part: 'crown-band', mat: 'leather', band: 1, shape: [-4.5, -1.5, 1.5, 4.5].map(dx => ({ type: 'rect', x: Math.round(hx + dx * s), y: Math.round(cb - 1 * v), w: 1, h: bh })) });
      if (back) {
        // the knot of the binding and the ridge of the skull under the crown
        k.add({ type: 'rect', name: 'crown-knot', x: Math.round(hx - 1.5), y: Math.round(cb + 1 * v), w: 3, h: 3, mat: pal.leather, shade: 'flat', band: 1 });
        k.add({ type: 'rect', name: 'nape', x: Math.round(hx - 4 * s), y: Math.round(hy + 4 * v), w: Math.round(8 * s), h: 1, mat: pal.skin, shade: 'flat', band: 2 });
        return;
      }
      // a heavy brow shelf lit on top, deep sockets under it with a pale gleam, a broad nose, the jaw line under the
      // underbite and two tall ivory tusks standing up past the upper lip
      k.add({ type: 'path', name: 'brow', mat: pal.skin, shade: 'flat', band: 1, d: smooth(hp([[-6, -1.6], [-4.6, -4.2], [0, -3.6], [4.6, -4.2], [6, -1.6], [0, -2.4]])) });
      k.add({ type: 'rect', name: 'brow-lit', x: Math.round(hx - 5 * s), y: Math.round(hy - 4 * v), w: Math.round(4.5 * s), h: 1, mat: pal.skin, shade: 'flat', band: 0 });
      for (const e of [-3, 2]) {
        const ex = Math.round(hx + e * s - 0.5), ey = Math.round(hy - 2 * v);
        k.add({ type: 'rect', name: 'socket', x: ex, y: ey, w: 2, h: 2, color: 'outline' });
        k.add({ type: 'rect', name: 'eye', x: ex + (e < 0 ? 1 : 0), y: ey + 1, w: 1, h: 1, color: 'glow.0' });
      }
      k.add({ type: 'rect', name: 'nose', x: Math.round(hx - 1), y: Math.round(hy + 0.2 * v), w: 2, h: 3, mat: pal.skin, shade: 'flat', band: 1 });
      k.add({ type: 'rect', name: 'nose-shadow', x: Math.round(hx + 1), y: Math.round(hy + 0.2 * v) + 1, w: 1, h: 2, mat: pal.skin, shade: 'flat', band: 2 });
      const mw = Math.round(8 * s), my = Math.round(hy + 3.4 * v);
      k.add({ type: 'rect', name: 'mouth', x: Math.round(hx - mw / 2), y: my, w: mw, h: 1, color: 'outline' });
      k.add({ type: 'rect', name: 'jaw', x: Math.round(hx - mw / 2), y: Math.round(hy + 5.6 * v), w: mw, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      for (const sd of [-1, 1]) k.add({ type: 'rect', name: 'tusk', x: Math.round(hx + sd * 3.5 * s - 0.5), y: my - 3, w: 1, h: 5, mat: pal.hair, shade: 'flat', band: 0 });
    };

    const pauldron = () => {
      const [px, py] = at([-13, 35]);
      k.add({ type: 'ellipse', name: 'pauldron', underlay: true, cx: px, cy: py, rx: R(7), ry: 4.5 * SY, mat: pal.leather, shade: 'sphere' });
      for (const [dx, dy] of [[-5, -4], [-1, -7], [4, -5]]) {
        const bx = px + R(dx), by = py + dy * SY;
        k.add({ type: 'path', name: 'spike', mat: pal.hair, shade: 'flat', band: dx < 0 ? 0 : 1, d: `M${bx - R(1.8)} ${by + 3 * SY} L${bx + R(dx * 0.15)} ${by - 5 * SY} L${bx + R(1.8)} ${by + 3 * SY} Z` });
      }
      // bone studs along the hide's lower rim, and its stitched seam
      decals.push({ name: 'seam', part: 'pauldron', mat: 'leather', band: 2, shape: { type: 'rect', x: Math.round(px - R(5)), y: Math.round(py + SY), w: Math.round(R(10)), h: 1 } });
      decals.push({ name: 'studs', part: 'pauldron', mat: 'hair', band: 0, shape: [-4, 0, 4].map(dx => ({ type: 'rect', x: Math.round(px + R(dx)), y: Math.round(py + 2 * SY) + 1, w: 1, h: 1 })) });
    };
    // the pauldron's strap, diagonally over the chest (front) or the back to the off armpit
    const strap = () => k.add({ type: 'tube', name: 'strap', underlay: true, mat: pal.leather, shade: 'flat', band: 1, pts: pts([[-10, 38], [1, 41], [12, 44]]), w: R(2.4) });
    // ---- bowed thick legs on broad feet
    P.feet.forEach((dy, i) => {
      const s = i ? 1 : -1, lift = dy < 0 ? -2 : 0, fwd = dy > 0 ? 1 : 0;
      const hip = [k.baseCx + X(s * 6), Y(58)], knee = [k.baseCx + X(s * 9), Y(67) + lift / 2], ankle = [k.baseCx + X(s * (7 + fwd)), Y(74) + lift];
      k.add({ type: 'tube', name: 'leg', underlay: true, mat: pal.skin, shade: 'cyl', pts: [hip, knee, ankle], w: R(9.6), w1: R(6) });
      k.add({ type: 'ellipse', name: 'foot', underlay: true, cx: ankle[0] + R(s * 1.2), cy: Y(76) + lift, rx: R(4.8), ry: 2.2, mat: pal.skin, shade: 'sphere' });
    });
    // ---- hide loincloth, ragged at the hem
    k.add({ type: 'path', name: 'loincloth', underlay: true, mat: pal.leather, shade: 'linear', gain: 1, d: smooth([...pts([[-9, 55], [9, 55]]), ...pts([[8, 64], [4, 66], [1, 70], [-2, 66], [-6, 67], [-8.5, 63]], 0)]) });
    if (back) head();
    // ---- the pear torso: hunched trapezius humps, sloping heavy shoulders, sides widening into the gut
    k.add({ type: 'path', name: 'body', underlay: true, mat: pal.skin, shade: 'linear', gain: 1.1, d: smooth(pts([
      [0, 29], [6, 27.5], [12, 33], [15.5, 40], [14, 47], [13, 53], [10, 59],
      [0, 60], [-10, 59], [-13, 53], [-14, 47], [-15.5, 40], [-12, 33], [-6, 27.5]])) });
    if (!back) {
      // the pot belly hanging over the loincloth's belt, a sagging chest line above it
      const [bx, by] = at([-0.5, 54]);
      k.add({ type: 'ellipse', name: 'belly', underlay: true, cx: bx, cy: by, rx: R(10.5), ry: 8.5 * SY, mat: pal.skin, shade: 'sphere', gain: 0.9 });
      const [nx, ny] = at([-1, 55.5]);
      k.add({ type: 'rect', name: 'navel', x: Math.round(nx), y: Math.round(ny), w: 2, h: 1, mat: pal.skin, shade: 'flat', band: 2 });
      // an old slash healed pale across the gut, and a nick over the heart
      decals.push({ name: 'scar', part: 'belly', mat: 'skin', band: 0, shape: { type: 'poly', pts: pts([[2, 47], [3.4, 47], [8.4, 54], [7, 54]]) } });
      const [sx, sy] = at([-9, 43]);
      decals.push({ name: 'scar', part: 'body', mat: 'skin', band: 0, shape: { type: 'rect', x: Math.round(sx), y: Math.round(sy), w: 4, h: 1 } });
      strap();
      const g = pts([[-11, 59], [11, 59], [9, 64], [5, 62], [0, 66], [-5, 62], [-9, 64]]);
      k.add({ type: 'path', name: 'girdle', underlay: true, mat: pal.hair, shade: 'bevel', d: `M${g.map(p => p.join(' ')).join(' L')} Z` });
      decals.push({ name: 'plates', part: 'girdle', mat: 'hair', band: 2, shape: [-6, -2, 2, 6].map(dx => ({ type: 'rect', x: Math.round(cx + X(dx)), y: Math.round(Y(59) + up), w: 1, h: 4 })) });
      head();
      // the bone torc: one band of ivory over the collarbones, its plates seamed
      k.add({ type: 'tube', name: 'bead', mat: pal.hair, shade: 'flat', band: 0, pts: pts([[-9, 38], [0, 40.5], [9, 38]]), w: R(2.6) });
      decals.push({ name: 'torc-seams', part: 'bead', mat: 'hair', band: 1, shape: [-6, -2, 2, 6].map(dx => ({ type: 'rect', x: Math.round(cx + X(dx)), y: Math.round(Y(37.5 + (9 - Math.abs(dx)) / 3.6) + up), w: 1, h: 2 })) });
      offArm(); clubArm(); pauldron();
    } else {
      // from behind: the spine's groove down the back, its knobs lit on top
      const [spx, spy] = at([0, 37]);
      k.add({ type: 'rect', name: 'spine', x: Math.round(spx), y: Math.round(spy), w: 1, h: Math.round(18 * SY), mat: pal.skin, shade: 'flat', band: 2 });
      for (let y = 40; y <= 52; y += 4) k.add({ type: 'rect', name: 'vertebra', x: Math.round(spx - 1), y: Math.round(Y(y) + up), w: 3, h: 1, mat: pal.skin, shade: 'flat', band: 0 });
      // the loincloth's leather belt across the small of the back
      const [blx, bly] = at([-9, 57]);
      k.add({ type: 'rect', name: 'belt', x: Math.round(blx), y: Math.round(bly), w: Math.round(R(18)), h: 2, mat: pal.leather, shade: 'flat', band: 1 });
      // whip scars across the back, healed pale
      decals.push({ name: 'scar', part: 'body', mat: 'skin', band: 0, shape: [
        { type: 'poly', pts: pts([[-10, 44], [-8.6, 44], [-3, 50], [-4.4, 50]]) },
        { type: 'poly', pts: pts([[3, 46], [4.4, 46], [10, 52], [8.6, 52]]) }] });
      strap();
      // the bone mantle: ribs and long bones lashed in a fan over the shoulder humps
      k.add({ type: 'path', name: 'mantle-hide', underlay: true, mat: pal.leather, shade: 'flat', band: 2, d: smooth(pts([[-11, 35], [-6, 31], [0, 30.5], [6, 31], [11, 35], [9, 38.5], [0, 37], [-9, 38.5]])) });
      for (const [dx, lean] of [[-8, -1.5], [-4, -0.5], [0, 0], [4, 0.5], [8, 1.5]]) {
        k.add({ type: 'tube', name: 'mantle', mat: pal.hair, shade: 'flat', band: dx <= 0 ? 0 : 1, pts: pts([[dx * 0.8, 31.5 + Math.abs(dx) * 0.3], [dx + lean, 37.5 + Math.abs(dx) * 0.15]]), w: R(2.2), w1: R(1.7) });
        const [mx, my] = at([dx + lean, 38 + Math.abs(dx) * 0.15]);
        k.add({ type: 'circle', name: 'mantle-knob', cx: mx, cy: my, r: R(1.4), mat: pal.hair, shade: 'flat', band: 0 });
      }
      clubArm(); offArm(); pauldron();
    }
  }, { height: H, proc });
}

// head and the club fist follow the drawing; eyes and mouth for the finish's face (front only); ground from the rig
export const anchors = ctx => {
  const G = geo(ctx), s = G.R(G.HS), v = G.SY * G.HS;
  const base = bipedAnchors(ctx, { height: H, headDy: 4, eyes: 1.4, hand: L => [L.L + L.X(1), L.waist + L.Y(1)] });
  const Lo = bipedLayout(ctx, H), A = armsOf(ctx), up = Lo.shoulder - (Lo.foot - Lo.Y(21)), back = Lo.back;
  const flip = ctx.facing === 'e' || ctx.facing === 'n', fx = x => { const p = Math.round(x); return flip ? Lo.w - 1 - p : p; };
  const { t, hy } = headAt(ctx, back, up), hx = Lo.cx + t;
  const T = G.top + G.R(4), y40 = G.Y(40), fy = A.f[1] >= 40 ? G.Y(A.f[1]) : y40 - (40 - A.f[1]) * (y40 - T) / 35;
  const out = { ...base, head: [fx(hx), Math.round(hy - 6 * v)], hand: [fx(Lo.cx + G.X(A.f[0])), Math.round(fy + up)] };
  delete out.eye; delete out.eye2; delete out.mouth;
  if (!back) { out.eye = [fx(hx - 3 * s), Math.round(hy - v)]; out.eye2 = [fx(hx + 2 * s), Math.round(hy - v)]; out.mouth = [fx(hx), Math.round(hy + 3.4 * v)]; }
  return out;
};
