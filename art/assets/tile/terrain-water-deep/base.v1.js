// terrain-water-deep base.v1 (r1) — from the iso floor tile template: a 32x16 diamond of deep, dark water on the grass
// ramp only (the deep water token). Body in the ramp's darkest step, thin broken ripple crests in the middle step and a
// few rare glints in the lightest, so it reads darker and deeper than shallow water (no stones). No outer line: the water runs
// on unbroken from diamond to diamond. The ripple field is
// periodic on the iso lattice (u, v diamond axes), so diamonds tile seamlessly; ctx.t shifts the phase one full turn
// over the 4 frames for a slow, seamless loop.
export const meta = { brief: 'terrain-water-deep', pass: 'r1', notes: 'deep water: dark body, sparse slow ripple crests, iso-lattice seamless 4-frame loop' };

export const params = {
  crest: { type: 'range', min: 0.75, max: 0.95, step: 0.05, default: 0.85 },
};

export function render(ctx) {
  const P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h, { outline: false });
  const TAU = Math.PI * 2, ph = TAU * (ctx.t || 0), seed = (ctx.seed || 0) % 97;
  const top = h - 16, cy = top + 8, diamond = `M${w / 2} ${top} L${w} ${cy} L${w / 2} ${h} L0 ${cy} Z`;
  s.add({ type: 'path', name: 'water', d: diamond, mat: 'grass', shade: 'flat', band: 2 });
  const bits = [];
  for (let y = top; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (Math.abs(x + 0.5 - w / 2) / (w / 2) + Math.abs(y + 0.5 - cy) / 8 > 1) continue;
      // iso lattice coordinates: one tile step along either diamond axis adds 1 to u or v
      const px = (x + 0.5) / w, py = (y + 0.5 - top) / 16, u = px + py, v = py - px;
      const warp = 0.55 * Math.sin(TAU * (u - 2 * v) + seed) + 0.35 * Math.sin(TAU * (2 * u + v) + seed * 0.7 + ph);
      // main swell: crests run roughly level across the screen, drifting over the loop
      const a = Math.sin(TAU * (u + v) * 1 + warp + ph);
      // cross chop that breaks the crests into short dashes
      const b = Math.sin(TAU * (2 * u - v) + 0.6 * warp - ph);
      const crest = a > P.crest && b > -0.2;
      const glint = a > 0.97 && b > 0.9;
      if (glint) bits.push({ type: 'rect', name: 'glint', x, y, w: 1, h: 1, color: 'grass.0' });
      else if (crest) bits.push({ type: 'rect', name: 'ripple', x, y, w: 1, h: 1, color: 'grass.1' });
    }
  }
  s.add({ type: 'group', name: 'surface', clip: { type: 'path', d: diamond }, children: bits });
  return ctx.lib.proc(s).noDefaults().render();
}
