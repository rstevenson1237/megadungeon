// feature-altar base.v1 (r1) — adapted from the iso chest template to the brief: a plain stone altar, 1.1 m (about 18 px),
// a low stepped plinth, a narrower shaft carved with one blank, empty lozenge (the nameless god) and a broad slab top.
// State idle: the slab is bare; state offered: an offering lies on it (a gold cup, a folded cloth and a dark-red stain/candle-less
// bead of accent). One iso T2+ 3D model; decoration is surface slabs (R5). Role ramps only (R11); no floor drawn.
export const meta = { brief: 'feature-altar', pass: 'r1', notes: 'stepped stone altar with blank carved lozenge; offering on top when offered', mirror: false };

export const params = {
  body: { type: 'swap', options: ['stone'], default: 'stone' },
};

export function render(ctx) {
  const [w, h] = ctx.size, P = ctx.params, offered = ctx.state === 'offered', m = ctx.lib.t2.scene3d();
  const W = 6, D = 5;                                                  // 1 model unit = 2 px across, 2 px up
  m.add({ type: 'box', name: 'plinth', x: 0, y: 0, z: 0, w: W, d: D, h: 1, mat: P.body });
  m.add({ type: 'box', name: 'shaft', x: 1, y: 1, z: 1, w: W - 2, d: D - 2, h: 5, mat: P.body });
  m.add({ type: 'box', name: 'slab', x: 0, y: 0, z: 6, w: W, d: D, h: 2, mat: P.body });
  // the blank lozenge: a dark slab on the shaft's front face
  m.add({ type: 'slab', name: 'lozenge', x: 2, y: D - 2, z: 2, w: 2, d: 1, h: 3, mat: 'metal' });
  if (offered) {
    m.add({ type: 'slab', name: 'cloth', x: 1, y: 1, z: 8, w: 3, d: 2, h: 1, mat: 'cloth' });
    m.add({ type: 'box', name: 'cup', x: 4, y: 2, z: 8, w: 1, d: 1, h: 2, mat: 'accent', hi: 'glow.0' });
  }
  return m.render(w, h, { ox: Math.round(w / 2 - (W - D)), oy: Math.round(h - 8 - (W + D) / 2) });
}
