import { getPostHogClient } from '@home/posthog';
import type { AnalyticsPort } from '../analytics.port.js';

export class PostHogAnalyticsAdapter implements AnalyticsPort {
  track(event: string, properties?: Record<string, unknown>): void {
    getPostHogClient().capture({ distinctId: 'system', event, properties });
  }

  identify(userId: string, properties?: Record<string, unknown>): void {
    getPostHogClient().identify({ distinctId: userId, properties });
  }

  async shutdown(): Promise<void> {
    await getPostHogClient().shutdown();
  }
}
