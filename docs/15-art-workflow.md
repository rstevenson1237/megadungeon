# Art workflow: how this project runs artgen

How each art batch of Phase 6 is produced, from task 6.7 on. It applies the review of batches 1 and 2 (October 18,
2026: 70 assets, 371 scored passes) on top of artgen, now 0.14.0 (updated November 13, 2026, from 0.10.0), and the cost
lesson of batch 3. artgen's own skills (`.claude/skills/asset-production`,
`.claude/skills/artgen`) describe the pipeline itself; this page names only the project's choices, and wins where the
two differ.

## What artgen has done since 0.10.0

These came from our review and have been artgen's defaults since 0.10.0, written out in `art/artgen.config.json` so they are visible:

- **The best version ships.** The final is the gate-passing version with the best blind score, then the best own
  score, not the newest. `status` and the gallery show `final≠best` when a higher score lost.
- **The blind score is the gate.** A fresh reviewer's score chooses and gates the final; a blind miss gets one revision
  of its own (`review.blindRevisions`).
- **The finishing pass is optional** (`review.finish: "auto"`): it runs only when a review names a finish-level problem,
  or the base already scores at least the bar.
- **The lineup check runs after the first drafts** (`review.earlyRoster`): every v2 waits for a roster review of the
  v1s, and its notes go into each asset's v2 step. The final roster still runs before the gallery.
- **Heights fail.** An upright character or creature more than 15% off its brief height fails the gate.
- **BELOW BAR.** The gallery labels any asset whose blind score is under 6.5.

## What artgen 0.11 to 0.14 added

Most of 0.11 to 0.14 is tabletop maps (settlements, dungeon layouts), which this game does not use. The art pipeline
changes below are all opt-in: with our config unchanged, every asset keeps its status and final (checked on the update:
159 assets, no difference between 0.10.0 and 0.14.0), so nothing approved moves.

- **Shape gates (off here).** With `review.gates` set for a kind, or `gates` on a brief, v1 is a silhouette draft only
  (flat colours, no finish). The pipeline stops at `stage-gate shape` until Robert approves or rejects the shape
  (`artgen stage approve|reject <id> shape --note "…"`), and only then decorates it. A fresh `artgen init` gates
  characters and creatures; our config was made before that, so no gate is set. Turning it on is a settings change for
  Robert to approve (proposed with the update, November 13, 2026).
- **Shared body rigs.** The walker and the quadruped, serpent, flyer and large templates now draw on
  `ctx.lib.rigs.body(…)`, with bone lengths fixed per asset; the `rig-lengths` stage check fails limbs that stretch
  between frames. `FAMILY_BODIES` (below) still picks the rig; a redo starts from the new template.
- **Stages.** `artgen stages <id>` prints a version's stage keys (placeholder, shape, decorate, animation) and what has
  been approved, so a revision that keeps the silhouette needs no new shape review.
- **Review on the pull request.** `artgen pr prepare` writes `art/review/REVIEW.md` and the review sheets to commit to a
  pull request; Robert answers in a comment, one line per asset (`approve feature-altar`, or `feature-altar: too
  squat`), read with `artgen pr parse` and recorded `--via pr`. Only his own comment counts. The review UI (`artgen ui`)
  can't be reached from a cloud session, so this or the project's cards are the ways to review there.
- **References and data sheets.** A brief may list reference PNGs (`refs:`, under `art/refs/`); every review sheet
  shows them. `artgen sheet <id>` writes the asset's one-page data sheet.
- **Placeholders.** `artgen placeholder <id>` and `artgen export --placeholders` put flat stand-ins in the pack. Not
  used: the game already draws a glyph card for any asset with no art (task 6.3).
- **Feedback to artgen.** `artgen report <id> --note "…"` writes a feedback bundle to `art/feedback/`; nothing is sent
  unless Robert agrees (`--issue`). `artgen metrics export` writes counts and ratios (no images or ids) to
  `art/metrics/`, for Robert to commit or send on.
- **Image tools.** `artgen trace-base <id> <sketch.png>` turns a traced sketch into an asset's base, beside
  `artgen import-edit` for a hand-edited PNG (see the hand-edit offer under approvals).
- **Runtime 1.5.0.** Additive (lights for Pixi, placeholder lookups). The game's copy in `src/ui/art/runtime/` stays
  at 1.2.1 until an export with `--runtime` is asked for; nothing the game calls changed.

## Project settings (`art/artgen.config.json`)

- **Passes:** 2 revisions per asset, 3 for hero assets and props (batch 2's analytics: v3 added +0.26 and v4 +0.14),
  then the lineup check and at most one targeted revision from it (`review.rosterRevisions`).
- **Models:** first drafts (`base`) and the first two reviews (`reviewEarly`) run on Sonnet. Revisions, blind scores
  and the roster run on the session's strong model (`default`), since they decide what ships. Start each subagent
  with the model its stage names, and pass `--agent-tokens-in` to `score` when the count is known, so analytics show
  the real cost.
- **Review sheets:** the first review uses a low-detail sheet (one facing at 3x, `review.sheetDetail`).

## Colour limits

The direction's per-kind limits (`art/direction.json`, `palette.perKind`) were widened before batch 3 (Spec 01b,
clarification "Art workflow before task 6.7"): props may use cloth and dirt, and creatures metal, stone and glow. No
colour changed, so no approved asset changed. Before any batch starts, run `node tools/artgen/artgen.js brief lint`.
Settle each warning for that batch's briefs (reword the brief in `tools/art-briefs.ts`, or propose one direction
change to Robert) before drawing, never partway through.

## Body rigs

`tools/art-briefs.ts` gives each non-humanoid family a body rig (`FAMILY_BODIES`): four-legged beasts (q, r, l, Y),
serpents (c, e, n, w, S), flyers (b, I) and the large rig (D, H). Bosses take their family's rig. Redos of those
families and the batch 4 bosses start from the rig, not the humanoid walker.

## Budget for a batch

The full pipeline used up the session limit and then the weekly limit during batch 3 (October 23, 2026), so a batch
starts with a capped budget proposed to Robert before any drawing: how many revisions per asset, whether blind
re-revisions, the roster revision and the finish run, and the waves. Batch 3 finished on one revision per asset then
the blind checks, with a temporary local config (`passes 1`, `blindRevisions 0`, `rosterRevisions 0`, `finish
"never"`); blind scores ran 1 to 2 under own scores. That config is never committed, and it must be in place while
approving, since `approve` and the gallery compute finals from the config. artgen has no token budget of its own.

## Running a batch

1. **Before drawing:** run `brief lint` (above). Start effects from the nearest `artgen fx` preset (`fx --list`:
   fire, sparks, magic, impact, splash, dust and others) and liquids and surfaces from `artgen texture`.
2. **Waves of 12:** `make <ids> --parallel 4 --wave 12`. Finish a wave before the next starts, so a usage-limit pause
   leaves finished assets and a clean tree. After a pause, call `make --parallel` again: a `resume` packet continues a
   version that was written but never reviewed.
3. **Contrast in context:** use `review --scene` whenever an asset could vanish on a floor (dark creatures, brown
   cloth that could read as skin).
4. **Small things as one sheet:** status icons and floor items are judged together, at the size the game draws them,
   not one at a time at 5x.
5. **In-game screenshot before approval:** run the game on the Vite dev server with `?display=iso` and take a
   screenshot of a themed room with the new assets in it (Playwright, as in batch 1). It goes in the batch's folder in
   the project files, next to the gallery.
6. **Analytics after the batch:** `node tools/artgen/artgen.js analytics --out <batch folder>/analytics.md`, and act on
   its budget suggestions before the next batch.

## Asking Robert to approve

- Show the gallery with the in-game screenshot. Assets above the bar can be approved together.
- Show the BELOW BAR assets separately: a sheet of them side by side, each with one proposed fix, on a card that lets
  Robert tick which to redo. Approving one under the bar is his deliberate exception.
- Region or cell notes from the image tools web app (Asset Review) are welcome for small assets such as icons; they
  land in the ledger and are read on every run.
- Any asset he keeps under the bar, and any lineup note left open, goes into `art/redo.md` with one proposed fix, so
  the redo list lives in the repo.
- For organic creatures that code-drawn passes keep failing, offer a hand edit (`artgen import-edit` loads an edited
  PNG back in) instead of more passes. That is Robert's call per asset.
