import { PostHog } from 'posthog-node';

export interface PostHogConfig {
  apiKey: string;
  host?: string;
}

let client: PostHog | undefined;

export function initPostHog(config: PostHogConfig): void {
  client = new PostHog(config.apiKey, {
    host: config.host ?? 'https://eu.posthog.com',
  });
}

export function getPostHogClient(): PostHog {
  if (!client) throw new Error('PostHog not initialized — call initPostHog() first.');
  return client;
}
