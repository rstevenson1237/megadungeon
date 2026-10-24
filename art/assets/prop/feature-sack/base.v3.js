// feature-sack base.v3 (r3) — from base.v2 (6). Roster fix: the sack still twinned the chest's olive-khaki and its tie was
// lost at 1x. The burlap is now the light, warm half of the wood ramp (wood.0/wood.1, a pale straw burlap, against the
// chest's dark red-brown), and the closed sack's tie is a clear knot: the cord ring is the darkest leather and a knot
// with two short hanging ends sits on the neck's front, so the cinch reads as a dark band with a nub at 1x.
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
export const meta = { brief: 'feature-sack', pass: 'r3', notes: 'light warm burlap, clear tied knot', mirror: false };

export const params = {
  body: { type: 'swap', options: ['wood', 'leather'], default: 'wood' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, st = ctx.state, K = 2, m = ctx.lib.t2.scene3d({ k: K });
  const N = (w / 4) * K, C = N / 2;                  // the cell is N x N fine voxels; (C, C) is its centre
  const grid = new Map(), key = (x, y, z) => `${x},${y},${z}`;
  // blob(name, dx, dy, z0, rx, ry, rz): an ellipsoid sitting on z0; later blobs win the voxels they share
  const blob = (name, dx, dy, z0, rx, ry, rz) => {
    for (let z = Math.floor(z0); z < Math.ceil(z0 + 2 * rz); z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = ((x + 0.5 - C - dx) / rx) ** 2 + ((y + 0.5 - C - dy) / ry) ** 2 + ((z + 0.5 - z0 - rz) / rz) ** 2;
      if (d <= 1 && z >= 0) grid.set(key(x, y, z), name);
    }
  };
  if (st === 'open') {
    blob('body', 0, 0, 0, 4.4, 4.0, 2.8);
    blob('slump', 0.5, 0.3, 2.4, 3.2, 3.0, 2.0);
    blob('flop', 3.0, -0.4, 0, 2.4, 1.7, 1.3);        // cloth slid down over the side
    blob('lip', -0.3, -0.2, 4.6, 3.0, 2.8, 0.9);        // the rolled, open mouth
    blob('goods', 0.2, 0.1, 5.0, 2.0, 1.8, 0.9);
    blob('coin', 2.8, 3.2, 0, 1.2, 1.0, 0.6);
    blob('cord', -4.4, 2.6, 0, 2.0, 0.6, 0.5);
  } else if (st === 'looted') {
    blob('body', 0, 0, 0, 5.0, 4.4, 1.4);
    blob('fold', -1, -0.8, 1, 3.0, 2.0, 1.0);
    blob('fold2', 1.8, 1.4, 1, 2.0, 1.5, 0.8);
    blob('cord', 4.2, -2.4, 0, 2.0, 0.6, 0.5);
  } else {
    blob('body', 0, 0, 0, 3.8, 3.6, 2.2);
    blob('shoulder', 0, 0, 2.2, 2.6, 2.4, 1.5);          // tapers the body up to the neck (a pear, not a ball)
    blob('neck', 0, 0, 4.2, 1.0, 1.0, 1.6);             // the pinched neck
    blob('tuft', 0.3, 0, 6.8, 2.2, 1.6, 0.9);           // flared cloth above the cinch
    blob('ear', 2.2, -0.4, 7.4, 1.0, 0.8, 0.9);         // a corner of cloth flopping to one side
    blob('cord', 0, 0, 5.2, 2.0, 2.0, 0.6);             // cord cinched tight round the neck
    blob('cord', 0.9, 1.7, 5.0, 1.0, 1.0, 0.9);         // the knot, on the neck's front
    blob('cord', 1.2, 2.2, 3.8, 0.5, 0.5, 0.8);         // its two short hanging ends
    blob('cord', 0.2, 2.2, 3.6, 0.5, 0.5, 0.8);
  }
  const parts = new Map();
  for (const [k, part] of grid) { if (!parts.has(part)) parts.set(part, []); parts.get(part).push(k.split(',').map(Number)); }
  const cord = [ctx.dir.pal.leather[1], ctx.dir.pal.leather[2]];  // dark leather so the cinch reads as a line
  const burlap = [ctx.dir.pal[P.body][0], ctx.dir.pal[P.body][1]];  // the light, warm half of the ramp
  const mat = { cord, goods: 'metal', coin: 'metal' };
  for (const [part, cells] of parts) m.add({ type: 'cells', name: part, cells, mat: mat[part] || burlap, shade: 'toon' });
  return m.render(w, h, { renderer: 'raster', yaw: 45, pivot: [C / K, C / K, 0], at: [w / 2, h - 8], shadow: true, });
}
