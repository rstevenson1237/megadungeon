import { defineConfig, devices } from '@playwright/test';

// The browser checks (plan, tasks 3.11 and 4.12): the built page, served as GitHub Pages serves it, driven in the
// engines of Chrome, Firefox and Safari (Chromium, Firefox and WebKit). The Vite dev server also serves the check
// harness (e2e/harness), which runs the game's own modules for the glyph atlas and the timing criteria.
// PLAYWRIGHT_CHROMIUM may name a Chromium already on the machine; CI installs Playwright's own three browsers.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM || undefined;

export default defineConfig({
  testDir: 'e2e',
  timeout: 120_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173/megadungeon/',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: executablePath ? { executablePath } : {} } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: [
    {
      command: 'npx vite preview --port 4173 --strictPort',
      url: 'http://localhost:4173/megadungeon/',
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      url: 'http://localhost:5174/megadungeon/e2e/harness/',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
