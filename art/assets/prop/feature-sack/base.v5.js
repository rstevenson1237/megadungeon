// feature-sack base.v5 (x2) — from base.v4 (5.5); closed and looted unchanged. open: the mouth merged into the lit
// highlight and the red spill was a muddy clump. Now the mouth is a dark 3 px tall ellipse (outline ink) painted on the
// slumped top, right of the lit highlight, ringed by the cloth's mid step with a 1 px light near lip (wood.0); the lip is
// a smooth ring (no carved hollow, whose shading steps made blotches), the shading is smoother (smooth 3) and the loose
// red cord is gone, so nothing spills off the body. base.v4 header follows.
// feature-sack base.v4 (x1) — from base.v2 (6). Blind reviewer's fix: open read as a boulder and looted as a flat loaf.
// Closed is unchanged. open: an untied, slumped sack with a visible dark mouth (a dark hollow ringed by the rolled cloth
// lip), the untied neck flopped over the lit left side and the loose tie lying against its foot; the pale metal goods are
// gone, so the top's highlight is the cloth's own (wood ramp) step, not a cool blue-white; nothing lies off to the left,
// so the contact shadow sits under the body. looted: a collapsed sack with two fold creases (dark wood) and a crumpled
// neck bunched at one end; the stray cord (the dark-red pixel) is gone.
// base.v2 header follows.
// feature-sack base.v2 (r2) — from base.v1 (5.5). Roster fix: the closed sack read as a rock, so its top is now a
// pinched neck: a lower, pear-shaped body, a narrow neck, a dark leather cord cinched tight round it, and a flared tuft of cloth
// above with an ear flopping to one side, so the tied top breaks the round outline. The spilled goods in the open
// state drop the red-orange accent (set-wide rule: red only for magic and lights) for a pale metal glint.
// base.v1 header follows.
// feature-sack base.v1 (r1) — adapted from the iso chest template to the brief: a tied sack of coarse cloth, 0.6 m
// (10 px tall), standing on the cell's floor-diamond centre. One fine-voxel model (k = 2, as terrain-debris): each
// voxel belongs to exactly one part (blobs are unioned into a grid with a material priority), so nothing
// interpenetrates (R5). closed: a plump sack cinched at the neck by a leather cord, a puckered tuft above; open:
// untied and slumped, wider and lower, mouth fallen open with a rolled lip and a little spill of goods (accent);
// looted: empty and flat, a slack cloth pancake with its loose cord beside it. Coarse cloth is the wood ramp (the
// khaki of burlap; the cloth ramp is blue steel); the cord is leather. Role ramps only (R11).
export const meta = { brief: 'feature-sack', pass: 'x2', notes: 'open: painted dark ellipse mouth with light near lip, smoother shading, no red spill', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'leather'], default: 'wood' },
};

// the open sack's mouth (frame pixels from MOUTH_AT): k dark hollow, b rolled cloth rim, c the lit near lip
const MOUTH_AT = [13, 17];
const MOUTH = [
  '.bbbbbb.',
  'bbkkkkbb',
  'bkkkkkkb',
  'bbkkkkbb',
  '.bccccb.',
];

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, st = ctx.state, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const N = (w / 4) * K, C = N / 2;                  // the cell is N x N fine voxels; (C, C) is its centre
  const grid = new Map(), key = (x, y, z) => `${x},${y},${z}`;
  // blob(name, dx, dy, z0, rx, ry, rz): an ellipsoid sitting on z0; later blobs win the voxels they share (name null carves)
  const blob = (name, dx, dy, z0, rx, ry, rz) => {
    for (let z = Math.floor(z0); z < Math.ceil(z0 + 2 * rz); z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = ((x + 0.5 - C - dx) / rx) ** 2 + ((y + 0.5 - C - dy) / ry) ** 2 + ((z + 0.5 - z0 - rz) / rz) ** 2;
      if (d <= 1 && z >= 0) { if (name) grid.set(key(x, y, z), name); else grid.delete(key(x, y, z)); }
    }
  };
  if (st === 'open') {
    blob('body', 0, 0, 0, 4.6, 4.3, 2.4);
    blob('slump', 0, 0, 2.0, 3.9, 3.7, 1.6);
    blob('lip', 0, 0, 3.8, 3.7, 3.5, 0.9);            // the rolled cloth lip; the mouth is painted on it below
    blob('neck', -0.4, 3.6, 3.0, 1.5, 1.6, 1.0);       // the untied neck, flopped over the lit left side and down
    blob('neck', -0.8, 4.8, 1.4, 1.4, 1.4, 1.0);
    blob('neck', -1.1, 5.5, 0, 1.3, 1.3, 0.8);
  } else if (st === 'looted') {
    blob('body', 0, 0, 0, 5.0, 4.4, 1.4);
    blob('fold', -1, -0.8, 1, 3.0, 2.0, 1.0);
    blob('fold2', 1.8, 1.4, 1, 2.0, 1.5, 0.8);
    blob('crease', -1.2, 0.6, 2.2, 2.4, 0.45, 0.5);    // fold creases pressed into the slack cloth
    blob('crease', 1.0, -1.6, 2.0, 0.45, 1.8, 0.5);
    blob('neck', 4.0, -1.8, 0.6, 1.5, 1.3, 1.0);        // the crumpled, collapsed neck bunched at one end
    blob('neck', 5.0, -2.6, 0.3, 1.0, 0.9, 0.8);
  } else {
    blob('body', 0, 0, 0, 3.8, 3.6, 2.2);
    blob('shoulder', 0, 0, 2.2, 2.6, 2.4, 1.5);          // tapers the body up to the neck (a pear, not a ball)
    blob('neck', 0, 0, 4.2, 1.0, 1.0, 1.6);             // the pinched neck
    blob('tuft', 0.3, 0, 6.8, 2.2, 1.6, 0.9);           // flared cloth above the cinch
    blob('ear', 2.2, -0.4, 7.4, 1.0, 0.8, 0.9);         // a corner of cloth flopping to one side
    blob('cord', 0, 0, 5.4, 1.6, 1.6, 0.5);             // cord cinched tight round the neck
  }
  const parts = new Map();
  for (const [k, part] of grid) { if (!parts.has(part)) parts.set(part, []); parts.get(part).push(k.split(',').map(Number)); }
  const cord = [ctx.dir.pal.leather[1], ctx.dir.pal.leather[2]];  // dark leather so the cinch reads as a line
  const dark = [ctx.dir.pal[P.body][2], ctx.dir.pal[P.body][2]];   // mouth and creases: the cloth's own darkest step
  const mat = { cord, mouth: dark, crease: dark };
  for (const [part, cells] of parts) m.add({ type: 'cells', name: part, cells, mat: mat[part] || P.body, shade: 'toon' });
  const g = m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [C / K, C / K, 0], at: [w / 2, h - 8], shadow: true, smooth: st === 'open' ? 3 : undefined });
  // open: the mouth, painted on the slumped top right of the lit highlight (the raster's 1 px shading steps cannot draw
  // it cleanly): a dark 3 px tall ellipse (outline ink) ringed by the cloth's mid step, its near lip one light row.
  // The frame position is fixed by `at` (the cell's centre), so the patch's corner is too.
  if (st === 'open') {
    const tok = { k: ctx.dir.outline, b: ctx.dir.pal[P.body][1], c: ctx.dir.pal[P.body][0] };
    MOUTH.forEach((row, j) => [...row].forEach((t, i) => { if (tok[t] && g.get(MOUTH_AT[0] + i, MOUTH_AT[1] + j)) g.set(MOUTH_AT[0] + i, MOUTH_AT[1] + j, tok[t]); }));
  }
  return g;
}
