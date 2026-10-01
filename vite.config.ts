import { defineConfig } from 'vitest/config';

// GitHub Pages serves from /<repository-name>/, so assets need that base path.
export default defineConfig({
  base: '/megadungeon/',
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
