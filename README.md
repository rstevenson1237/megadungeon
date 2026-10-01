# Megadungeon

A browser-based megadungeon roguelike in TypeScript with a classic CP437 text interface.

- `CLAUDE.md`: the brief Claude Code reads at the start of every session.
- `docs/`: the approved intake, nine specs and phased implementation plan.
- `mockup/ui-mockup.html`: the approved UI mockup; open it in a browser.

## Development

Requires Node 22 or newer.

```
npm ci               # install
npm run dev          # build content, start the Vite dev server
npm run content:check  # check the YAML content (schema, ids)
npm run content:build  # compile content/ to src/generated/content-bundle.json
npm run typecheck
npm test
npm run build        # production build into dist/
npm run ci           # everything CI runs
```

CI (`.github/workflows/ci.yml`) runs the content check, typecheck, tests and build on every push and pull request. Every merge to `main` also deploys the build to GitHub Pages at <https://rstevenson1237.github.io/megadungeon/>. Pages must be enabled once in the repository settings (Settings, Pages, Source: GitHub Actions).

## Font

The renderer bakes a 9x16 CP437 font into a glyph atlas (`src/ui/atlas.ts`). Shades, blocks and box-drawing characters (codes 176 to 223) are drawn in code, so borders join in any font.

**The approved font, Px437 IBM VGA 9x16, is not bundled yet.** Its licence (believed CC BY-SA 4.0) still has to be confirmed and its attribution added first (see `CLAUDE.md`). Until then the page falls back to a system monospace font, so letter shapes are a stand-in. To switch: add the font file, an `@font-face` for `Px437 IBM VGA 9x16` in `index.html`, and the attribution here; no code change is needed because `src/main.ts` already asks for that family first.
