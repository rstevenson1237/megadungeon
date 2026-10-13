// family-e-cap finish.v1 (f) on base.v3 — the one direct-pixel pass (R2). Review of base.v3: the arms are smooth
// humanoid tubes ending in plain hands with pale skin-like highlight strips, so it reads as a robed man, not a shard
// elemental. This pass (1) drops the pale accent.0 strip along each arm one ramp step (to accent.1), and (2) paints a
// jagged 3-shard cluster fist (6 px of shard inside the ink) over each hand and the end of the forearm. The hand
// positions come from the same biped layout and pose the base draws with (art/lib/beast.v1.js), so the fists follow
// the walk swing and the attack. Colours are direction tokens (R11).
import { bipedLayout, pose } from '../../../lib/beast.v1.js';
export const base = 'base.v3';
export const meta = { pass: 'f', notes: 'arm highlight down one step; 3-shard cluster fists painted over the hands' };
const H = 2.4;

// three shards splaying from the knuckle mass, split by ink; 'a' lit, '7' shadow, '_' clears the old round hand rim
const FIST = [
  '..#####.',
  '.#aa777#',
  '#aa#a#7#',
  '#a7#a#7#',
  '#a7#a#77#',
  '.#7#7#7#',
  '.#7##.#.',
  '..#.....',
];
const KEY = { '#': 'outline', a: 'accent.1', 7: 'accent.2' };

const rot = ([x, y], [ox, oy], deg) => {
  const r = (deg * Math.PI) / 180, c = Math.cos(r), s = Math.sin(r);
  return [ox + (x - ox) * c - (y - oy) * s, oy + (x - ox) * s + (y - oy) * c];
};
const segDist = ([x, y], [ax, ay], [bx, by]) => {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x - ax - t * dx, y - ay - t * dy);
};

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const c = { size: [g.w, g.h], state: ctx.state, frame: ctx.frame, facing: ctx.facing };
  const Lo = bipedLayout(c, H), P = pose(c), { X, Y, cx, waist, shoulder } = Lo, flip = ctx.facing === 'e' || ctx.facing === 'n';
  const fx = ([x, y]) => [flip ? g.w - 1 - x : x, y];
  for (const [side, deg, origin] of [[-1, P.main, Lo.mainShoulder], [1, P.off, Lo.offShoulder]]) {
    const pts = [[cx + side * X(6), shoulder + Y(1)], [cx + side * X(9), shoulder + Y(5)], [cx + side * X(9), waist + Y(1)]].map(p => fx(rot(p, origin, deg)));
    // (1) the arm's pale strip one step down
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
      if (px.tokenAt(g, [x, y]) !== 'accent.0') continue;
      if (Math.min(segDist([x, y], pts[0], pts[1]), segDist([x, y], pts[1], pts[2])) <= X(2.2)) px.set(g, [x, y], 'accent.1');
    }
    // (2) the shard fist over the hand
    // the fist on the screen-right side is mirrored, its tones swapped so the lit side stays on the light's side
    const [hx, hy] = pts[2].map(Math.round), right = side * (flip ? -1 : 1) > 0;
    const rows = right ? FIST.map(r => [...r.padEnd(9, '.')].reverse().join('')) : FIST.map(r => r.padEnd(9, '.'));
    px.patch(g, [hx - 4, hy - 2], rows, right ? { ...KEY, a: 'accent.2', 7: 'accent.1' } : KEY, { anchor: 'topleft' });
  }
  return g;
}
