import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClient = vi.hoisted(() => ({
  isFeatureEnabled: vi.fn(),
  getFeatureFlag: vi.fn(),
}));

vi.mock('@home/posthog', () => ({
  getPostHogClient: vi.fn().mockReturnValue(mockClient),
}));

import { PostHogFeatureFlagsAdapter } from '../adapters/posthog.adapter';

describe('PostHogFeatureFlagsAdapter', () => {
  let adapter: PostHogFeatureFlagsAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PostHogFeatureFlagsAdapter();
  });

  describe('isEnabled', () => {
    it('should return true when the flag is active', async () => {
      mockClient.isFeatureEnabled.mockResolvedValue(true);

      expect(await adapter.isEnabled('new-dashboard', 'user-1')).toBe(true);
      expect(mockClient.isFeatureEnabled).toHaveBeenCalledWith('new-dashboard', 'user-1');
    });

    it('should return false when the flag is inactive', async () => {
      mockClient.isFeatureEnabled.mockResolvedValue(false);

      expect(await adapter.isEnabled('new-dashboard')).toBe(false);
    });

    it('should return false when PostHog returns undefined', async () => {
      mockClient.isFeatureEnabled.mockResolvedValue(undefined);

      expect(await adapter.isEnabled('unknown-flag')).toBe(false);
    });
  });

  describe('getVariant', () => {
    it('should return the variant string when present', async () => {
      mockClient.getFeatureFlag.mockResolvedValue('variant-b');

      expect(await adapter.getVariant('experiment-x', 'user-2')).toBe('variant-b');
      expect(mockClient.getFeatureFlag).toHaveBeenCalledWith('experiment-x', 'user-2');
    });

    it('should return undefined when the variant is absent', async () => {
      mockClient.getFeatureFlag.mockResolvedValue(undefined);

      expect(await adapter.getVariant('experiment-x')).toBeUndefined();
    });

    it('should return undefined when PostHog returns a boolean instead of a string', async () => {
      mockClient.getFeatureFlag.mockResolvedValue(true);

      expect(await adapter.getVariant('boolean-flag')).toBeUndefined();
    });
  });
});
