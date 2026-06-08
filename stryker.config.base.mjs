/**
 * Shared Stryker config — each package extends this from its own
 * `stryker.config.mjs` so `mutate` paths resolve relative to that package
 * (Stryker resolves globs relative to the config file's directory).
 *
 * No default `mutate` here on purpose: mutation testing only pays off on
 * business logic (domain + application). Each consuming package must list its
 * own domain/application paths and exclude adapters explicitly.
 */
export function strykerConfig(overrides = {}) {
  return {
    packageManager: 'npm',
    testRunner: 'vitest',
    coverageAnalysis: 'perTest',
    reporters: ['html', 'clear-text', 'progress'],
    htmlReporter: { fileName: 'reports/mutation/index.html' },
    thresholds: { high: 80, low: 60, break: 50 },
    tempDirName: '.stryker-tmp',
    ...overrides,
  };
}
