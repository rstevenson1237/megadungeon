// probe-tile base.v2 (r2) — Megadungeon's floor: worn flagstones, low in contrast so creatures stand out, from base.v1
// (template iso floor). Changed: grass patches replaced by four flagstones split by dark joints, one worn lighter.
export const meta = { brief: 'probe-tile', pass: 'r2', notes: 'worn flagstones, low contrast' };

export const params = {
  ground: { type: 'swap', options: ['dirt', 'grass', 'stone'], default: 'dirt' },
  patches: { type: 'range', min: 1, max: 4, step: 1, default: 3 },
};

export function render(ctx) {
  const { pal } = ctx.dir, P = ctx.params, [w, h] = ctx.size, s = ctx.lib.t2.scene(w, h), r = ctx.rng, X = v => (v * w) / 32;
  const diamond = `M${w / 2} 1 L${w - 1} ${h / 2} L${w / 2} ${h - 1} L1 ${h / 2} Z`;
  s.add({ type: 'path', name: 'ground', d: diamond, mat: pal[P.ground], shade: 'flat', band: 1 });
  // the diamond split into four flags along its two diagonals' midlines; joints are one darker band, one flag is worn
  const bits = [], worn = Math.floor(r() * 4), last = pal[P.ground].length - 1;
  const q = [[w / 2, 1], [w * 3 / 4, h / 4], [w / 2, h / 2], [w / 4, h / 4], [w - 1, h / 2], [w * 3 / 4, h * 3 / 4], [w / 2, h - 1], [w / 4, h * 3 / 4], [1, h / 2]];
  const flags = [[0, 1, 2, 3], [1, 4, 5, 2], [2, 5, 6, 7], [3, 2, 7, 8]];
  flags.forEach((f, i) => bits.push({ type: 'path', name: 'flag', d: 'M' + f.map(k => q[k].join(' ')).join(' L') + ' Z', mat: pal[P.ground], shade: 'flat', band: i === worn ? 0 : 1 }));
  bits.push({ type: 'path', name: 'joint', d: `M${w / 4} ${h / 4} L${w * 3 / 4} ${h * 3 / 4} L${w * 3 / 4 - 1} ${h * 3 / 4} L${w / 4 - 1} ${h / 4} Z`, mat: pal[P.ground], shade: 'flat', band: last });
  bits.push({ type: 'path', name: 'joint', d: `M${w * 3 / 4} ${h / 4} L${w / 4} ${h * 3 / 4} L${w / 4 + 1} ${h * 3 / 4} L${w * 3 / 4 + 1} ${h / 4} Z`, mat: pal[P.ground], shade: 'flat', band: last });
  for (let i = 0; i < P.patches; i++) bits.push({ type: 'rect', name: 'chip', x: X(8) + r() * X(16), y: h * 0.3 + r() * h * 0.4, w: 1, h: 1, mat: pal.stone, shade: 'flat', band: 1 });
  s.add({ type: 'group', name: 'surface', clip: { type: 'path', d: diamond }, children: bits });
  return ctx.lib.proc(s).noDefaults().render();
}
