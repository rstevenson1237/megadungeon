// finish.v2 (f2) on base.v4 — the one direct-pixel pass (R2), on the base.v4 review's notes:
// 1. Flat ground cue: base.v4's glyph reads as an upright Y crack or sapling because nothing ties it to the floor
//    diamond. A short ground-plane frame now lies round it: a broken 2:1 diamond (24 x 12 px, centred on the cell's
//    floor diamond), cut as a 1 px ink groove only where it keeps a pixel of floor clear of the glyph, so it survives
//    as two clean 2:1 corner brackets (< >) left and right of the rune. Their floor-plane slope is what says "lying
//    flat". Ink in both states (the line gate's dark edge); the glyph keeps its glow (dormant) or cold stone (spent).
// 2. Stray lip pixels: the 1 px light lip runs at the stroke tips (lower-left naudiz tip, right of the crossing)
//    read as loose pixels; they are cleared.
// Rule-based ops over the frame (re-apply after re-renders); tokens only (R11).
export const base = 'base.v4';
export const meta = { notes: 'broken 2:1 ground-plane frame (corner brackets) round the glyph as a flat floor cue; tip lip pixels cleared' };

const R = 5;        // the frame's size in 2:1 steps from the centre: a 24 x 12 px diamond inside the cell's floor diamond
const MIN_RUN = 3;  // frame fragments shorter than this are dropped (no stray dots)

export function finish(g, ctx) {
  const { px } = ctx.lib;
  const spent = ctx.state === 'spent';
  const solid = (x, y) => g.inb(x, y) && g.alpha(x, y) === 255;

  // 2. clear the light lip runs (dormant: accent mid; spent: stone light); only the lip uses these steps
  const lip = px.color(spent ? 'stone.0' : 'accent.1');
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) if (solid(x, y) && g.get(x, y) === lip) g.clear(x, y);

  // 1. the broken frame: a 2:1 diamond centred between pixels on the floor diamond's centre (16, h - 8);
  // a pixel lies on the edge when its column steps (in pairs) plus its row steps from the centre make R
  const cx = g.w / 2, cy = g.h - 8, K = (x, y) => x + ',' + y;
  const ring = new Map();
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const u = Math.abs(x + 0.5 - cx) - 0.5, v = Math.abs(y + 0.5 - cy) - 0.5;
    if (Math.floor(u / 2) + v === R) ring.set(K(x, y), [x, y]);
  }
  // keep a pixel of floor between the ring and the glyph
  const near = (x, y) => { for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if (solid(x + a, y + b)) return true; return false; };
  const keep = new Map([...ring].filter(([, [x, y]]) => g.inb(x, y) && !near(x, y)));
  // drop short fragments (8-connected runs)
  const seen = new Set();
  for (const [k] of keep) {
    if (seen.has(k)) continue;
    const run = [k], stack = [k]; seen.add(k);
    while (stack.length) { const [x, y] = keep.get(stack.pop());
      for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) { const n = K(x + a, y + b);
        if (keep.has(n) && !seen.has(n)) { seen.add(n); run.push(n); stack.push(n); } } }
    if (run.length < MIN_RUN) for (const r of run) keep.delete(r);
  }
  for (const [x, y] of keep.values()) px.set(g, [x, y], 'outline');
  return g;
}
