import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('posthog-node', () => ({
  PostHog: vi.fn().mockImplementation(() => ({
    shutdown: vi.fn().mockResolvedValue(undefined),
  })),
}));

describe('PostHog client', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should throw when getPostHogClient is called before initPostHog', async () => {
    const { getPostHogClient } = await import('../client.js');

    expect(() => getPostHogClient()).toThrow('PostHog not initialized');
  });

  it('should return the PostHog instance after initPostHog', async () => {
    const { initPostHog, getPostHogClient } = await import('../client.js');
    initPostHog({ apiKey: 'test-key' });

    expect(getPostHogClient()).toBeDefined();
  });

  it('should throw when initPostHog is called a second time', async () => {
    const { initPostHog } = await import('../client.js');
    initPostHog({ apiKey: 'first-key' });

    expect(() => initPostHog({ apiKey: 'second-key' })).toThrow('PostHog already initialized');
  });
});
