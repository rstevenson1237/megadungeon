import { defineConfig, devices } from '@playwright/test';

// The browser smoke test (plan, task 3.11): it drives the built page, served as GitHub Pages serves it, in Chromium.
// PLAYWRIGHT_CHROMIUM may name a Chromium already on the machine; CI installs Playwright's own.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM || undefined;

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173/megadungeon/',
    ...devices['Desktop Chrome'],
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/megadungeon/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
