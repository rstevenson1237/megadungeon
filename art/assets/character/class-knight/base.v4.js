// class-knight base.v4 (r4) — from base.v3 (best so far), one change: attack frames 2-3 are redrawn with the sword arm
// reaching forward past the shield and the full blade (guard, ~8px blade, point) extended forward from the fist: angled up
// in the swing (frame 2) and held near level on contact (frame 3), instead of a short stub and a lowered idle-like blade.
// class-knight base.v3 (r3) — from base.v2 (best so far), one change to the back view: the blue surcoat is drawn in every
// facing (no longer front-only), so n/w keep the surcoat over the mail, and the helm's rear is filled with metal (the
// back of the head and a neck guard down to the gorget) so no dark face-band shows at helm level from behind.
// class-knight base.v2 (r2) — from base.v1, one change: the sallet's face opening is redrawn as a dark visor line at
// the brow over lit skin (eyes, nose, a 2-px jaw) with a 1-px gorget step below the chin, instead of a dark brown blob.
// base.v1: the Knight on the shared player body (art/lib/person.v1.js): a mail hauberk to the knee
// under a long surcoat, a rounded sallet helm with an open face and a tall plume, a long sword held point-down before
// the right side and a round shield with a bold stripe on the left arm. Mail and surcoat (not the paladin's plate).
import { person, personAnchors, layout } from '../../../lib/person.v1.js';

// attack frames 2 and 3 (swing and contact) are drawn here with the sword arm reaching forward: the hand's place and the
// blade's turn upward (deg, 0 = level, pointing forward) per frame index
const STRIKE = { 1: { hx: -5.4, hy: 0.4, ang: 48 }, 2: { hx: -5.6, hy: 1.6, ang: 14 } };
const strike = ctx => ctx.state === 'attack' ? STRIKE[(ctx.logical ?? ctx.frame) % 4] : undefined;
const strikeHand = (Lo, st) => [Lo.cx + Lo.X(st.hx), Lo.shoulder + Lo.Y(st.hy)];
export const meta = { brief: 'class-knight', pass: 'r4', notes: 'mail and surcoat, plumed sallet, sword point down, striped shield', mirror: false };

export function render(ctx) {
  return person(ctx, k => {
    const { pal, X, Y, cx, waist, shoulder, headY, knee, L, R } = k;
    k.legs(pal.metal, 2.4, 1.6); k.boots(pal.leather);
    k.shape('hauberk', pal.metal, [[0, shoulder - Y(0.5)], [5, shoulder], [5.2, shoulder + Y(4)], [4.6, waist], [5.4, knee], [0, knee + Y(0.5)]]);
    k.shape('surcoat', pal.cloth, [[0, shoulder + Y(1)], [3.2, shoulder + Y(1)], [3.4, waist], [4, knee + Y(1)], [0, knee + Y(1.5)]], { shade: 'flat', band: 1 });
    k.add({ type: 'rect', name: 'belt', x: cx - X(4.6), y: waist - Y(0.6), w: X(9.2), h: Y(1.2), mat: pal.leather, shade: 'flat', band: 2 });
    k.head(headY, { wide: 3.1, crown: 4.4, jaw: 1.8, chin: 4.2, point: 0.3, eyes: 1.7, hair: pal.metal });
    k.add({ type: 'path', name: 'sallet', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx, headY - Y(5.4)], [cx + X(4), headY - Y(3.4)], [cx + X(4.6), headY + Y(1.5)], [cx + X(3), headY - Y(1)], [cx - X(3), headY - Y(1)], [cx - X(4.6), headY + Y(1.5)], [cx - X(4), headY - Y(3.4)]]) });
    // from behind: the sallet's rear is solid metal, flaring into a neck guard over the gorget
    k.rear(() => k.add({ type: 'path', name: 'sallet-rear', underlay: true, mat: pal.metal, shade: 'sphere', d: k.smooth([[cx, headY - Y(5.4)], [cx + X(4), headY - Y(3.4)], [cx + X(4.6), headY + Y(1.5)], [cx + X(3.4), headY + Y(4.4)], [cx - X(3.4), headY + Y(4.4)], [cx - X(4.6), headY + Y(1.5)], [cx - X(4), headY - Y(3.4)]]) }));
    // the face opening: visor line, lit face and eyes, a 2-px jaw, and the gorget's 1-px step under the chin
    k.front(() => {
      const fc = Math.round(cx) - 1, y0 = Math.round(headY), ex = [Math.round(cx - X(1.7)) - 1, Math.round(cx + X(1.7)) - 1];
      const px = (name, x, y, w, color) => k.add({ type: 'rect', name, x, y, w, h: 1, color });
      px('visor', fc - 3, y0 - 1, 7, 'outline');
      px('face', fc - 2, y0, 5, 'skin.1');
      ex.forEach(x => px('eye', x, y0, 1, 'outline'));
      px('face', fc - 2, y0 + 1, 5, 'skin.1'); px('face-lit', fc - 1, y0 + 1, 2, 'skin.0'); px('nose', fc, y0 + 1, 1, 'skin.2');
      px('jaw', fc - 2, y0 + 2, 5, 'skin.1'); px('jaw-lit', fc - 1, y0 + 2, 2, 'skin.0');
      px('jaw', fc - 1, y0 + 3, 3, 'skin.1');
      px('gorget', fc - 3, y0 + 4, 7, 'metal.1'); px('gorget-lit', fc - 2, y0 + 4, 2, 'metal.0');
    });
    k.add({ type: 'tube', name: 'plume', underlay: true, mat: pal.accent, shade: 'flat', band: 1, pts: [[cx, headY - Y(5)], [cx + X(1), headY - Y(9)], [cx + X(4.5), headY - Y(10.5)], [cx + X(6.5), headY - Y(8)]], w: X(2.2), w1: X(0.8) });
    k.off(() => {
      k.arm(1, pal.metal, R - X(2), waist - Y(2), { glove: pal.leather });
      k.add({ type: 'circle', name: 'shield', cx: R - X(0.5), cy: waist - Y(2.5), r: X(4.4), mat: pal.cloth, shade: 'sphere', underlay: true });
      k.add({ type: 'rect', name: 'stripe', x: R - X(1.5), y: waist - Y(6.5), w: X(2), h: Y(8), mat: pal.accent, shade: 'flat', band: 1 });
    });
    const st = strike(ctx);
    if (st) {
      k.P.main = 0;
      const [hx, hy] = strikeHand(k, st), g = hx - X(1.2), b = hx - X(8), tip = hx - X(9.4);
      k.main(() => {
        k.add({ type: 'group', name: 'sword', rotate: st.ang, origin: [hx, hy], children: [
          { type: 'path', name: 'blade', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${g} ${hy - 1} L${b} ${hy - 1} L${tip} ${hy} L${b} ${hy + 1} L${g} ${hy + 1} Z` },
          { type: 'capsule', name: 'guard', a: [g, hy - X(2.2)], b: [g, hy + X(2.2)], r: X(0.6), mat: pal.metal, shade: 'cyl', axis: 'y' },
          { type: 'capsule', name: 'grip', a: [g, hy], b: [hx + X(1.2), hy], r: X(0.5), mat: pal.leather, shade: 'cyl', axis: 'x' },
        ] });
        k.arm(-1, pal.metal, hx, hy, { glove: pal.leather });
      });
      return;
    }
    k.main(() => {
      k.arm(-1, pal.metal, L + X(1.5), waist - Y(1), { glove: pal.leather });
      k.add({ type: 'path', name: 'blade', underlay: true, mat: pal.metal, shade: 'bevel', d: `M${L + X(0.7)} ${waist} L${L + X(0.5)} ${knee + Y(4)} L${L + X(1.5)} ${knee + Y(5.5)} L${L + X(2.5)} ${knee + Y(4)} L${L + X(2.3)} ${waist} Z` });
      k.add({ type: 'capsule', name: 'guard', a: [L - X(1), waist - Y(0.2)], b: [L + X(4), waist - Y(0.2)], r: X(0.6), mat: pal.metal, shade: 'cyl', axis: 'x' });
    });
  });
}
export const anchors = ctx => {
  const out = personAnchors(ctx, { eyes: 1.7, hand: L => [L.L + L.X(1.5), L.waist - L.Y(1)] }), st = strike(ctx);
  if (st) {
    const Lo = layout(ctx), [x, y] = strikeHand(Lo, st).map(Math.round);
    out.hand = [ctx.facing === 'e' || ctx.facing === 'n' ? Lo.w - 1 - x : x, y];
  }
  return out;
};
