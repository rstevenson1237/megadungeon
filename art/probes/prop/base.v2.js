// probe-prop base.v2 (r2) — Megadungeon's sarcophagus (Cellars and Crypts): a long stone box with an overhanging lid
// and a carved band, from base.v1 (template iso chest). Changed: stone body, longer and lower, lid overhangs, no lock.
// Decoration is a surface slab (R5): straps and the lock recolour the box surface instead of interpenetrating it.
// The model is sized from ctx.size; adapt it to the brief (barrel, crate, altar, door…). Role ramps only (R11).
export const meta = { brief: 'probe-prop', pass: 'r2', notes: 'stone sarcophagus', mirror: false };

export const params = {
  body: { type: 'swap', options: ['stone', 'wood', 'leather'], default: 'stone' },
  trim: { type: 'swap', options: ['accent', 'metal'], default: 'accent' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, open = ctx.state === 'open', m = ctx.lib.t2.scene3d();
  const W = Math.max(6, Math.round(w / 3.5)), D = Math.max(3, Math.round(W * 0.45)), H = Math.max(2, Math.round(W * 0.3));
  m.add({ type: 'box', name: 'body', x: 0, y: 0, z: 0, w: W, d: D, h: H, mat: P.body });
  // the lid overhangs by one cell all round; open, it lies askew beside the body
  if (open) m.add({ type: 'box', name: 'lid', x: 1, y: -2, z: 0, w: W, d: 2, h: 1, mat: P.body });
  else m.add({ type: 'box', name: 'lid', x: -1, y: -1, z: H, w: W + 2, d: D + 2, h: 1, mat: P.body });
  // a carved band runs the length of the lid (closed) or the rim of the body (open)
  if (open) m.add({ type: 'slab', name: 'band', x: 0, y: 0, z: H - 1, w: W, d: D, h: 1, mat: P.trim });
  else m.add({ type: 'slab', name: 'band', x: 1, y: D >> 1, z: H, w: W - 2, d: 1, h: 1, mat: P.trim });
  // screen origin: centre the model's footprint, bottom with room for the ground shadow
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D)), oy: Math.round(h - 4 - (W + D)) });
}
