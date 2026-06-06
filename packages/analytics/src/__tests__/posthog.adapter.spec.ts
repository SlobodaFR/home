import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClient = vi.hoisted(() => ({
  capture: vi.fn(),
  identify: vi.fn(),
  shutdown: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@home/posthog', () => ({
  getPostHogClient: vi.fn().mockReturnValue(mockClient),
}));

import { PostHogAnalyticsAdapter } from '../adapters/posthog.adapter.js';

describe('PostHogAnalyticsAdapter', () => {
  let adapter: PostHogAnalyticsAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new PostHogAnalyticsAdapter();
  });

  it('should call posthog.capture with event and properties', () => {
    adapter.track('page_viewed', { page: '/home' });

    expect(mockClient.capture).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'page_viewed', properties: { page: '/home' } }),
    );
  });

  it('should call posthog.identify with userId and properties', () => {
    adapter.identify('user-42', { plan: 'pro' });

    expect(mockClient.identify).toHaveBeenCalledWith(
      expect.objectContaining({ distinctId: 'user-42', properties: { plan: 'pro' } }),
    );
  });

  it('should resolve after calling posthog.shutdown', async () => {
    await adapter.shutdown();

    expect(mockClient.shutdown).toHaveBeenCalledOnce();
  });
});
