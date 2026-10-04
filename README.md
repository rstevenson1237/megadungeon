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
npm run content:check  # check the YAML content (schema, ids, references, template text)
npm run content:report # write coverage/content-coverage.html (tables against launch minimums, gaps)
npm run content:strict # content check plus the launch bar: fails on any short table or gap (Phase 3)
npm run content:build  # compile content/ to src/generated/content-bundle.json
npm run typecheck
npm test
npm run build        # production build into dist/
npm run ci           # everything CI runs
npm run smoke        # after a build: the browser smoke test and checks in Chromium, Firefox and WebKit
```

CI (`.github/workflows/ci.yml`) runs the content check, typecheck, tests and build on every push and pull request. Every merge to `main` also deploys the build to GitHub Pages at <https://rstevenson1237.github.io/megadungeon/>. Pages must be enabled once in the repository settings (Settings, Pages, Source: GitHub Actions).

## Font

The renderer bakes a 9x16 CP437 font into a glyph atlas (`src/ui/atlas.ts`). The font is IBM VGA 9x16 from The Ultimate Oldschool PC Font Pack by VileR, bundled unmodified in `src/ui/fonts/` under CC BY-SA 4.0 (attribution in `src/ui/fonts/NOTICE.md`, licence text alongside). The title screen carries the credit line.
