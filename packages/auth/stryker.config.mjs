import { strykerConfig } from '../../stryker.config.base.mjs';

export default strykerConfig({
  // Mutation testing targets business logic (domain + application). Adapters
  // are thin infrastructure glue — better covered by integration tests against
  // real infra than by mutating their lines.
  mutate: [
    'src/domain/**/*.ts',
    'src/application/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/*.spec.ts',
  ],
});
