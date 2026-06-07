import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      reportsDirectory: './coverage',
      include: ['packages/*/src/**', 'apps/*/src/**'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.spec.ts', '**/__tests__/**'],
    },
  },
});
