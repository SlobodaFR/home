import { getPostHogClient } from '@home/posthog';
import type { FeatureFlagsPort } from '../feature-flags.port';

const ANONYMOUS = 'anonymous';

export class PostHogFeatureFlagsAdapter implements FeatureFlagsPort {
  async isEnabled(flag: string, userId = ANONYMOUS): Promise<boolean> {
    return (await getPostHogClient().isFeatureEnabled(flag, userId)) ?? false;
  }

  async getVariant(flag: string, userId = ANONYMOUS): Promise<string | undefined> {
    const variant = await getPostHogClient().getFeatureFlag(flag, userId);
    return typeof variant === 'string' ? variant : undefined;
  }
}
