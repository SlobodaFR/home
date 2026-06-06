# @home/analytics

## Purpose

Analytics produit et infrastructure. Expose `AnalyticsPort` — interface stable indépendante de PostHog. L'adapter PostHog est l'implémentation par défaut.

## Public API

```typescript
import { PostHogAnalyticsAdapter, type AnalyticsPort } from '@home/analytics';

const analytics: AnalyticsPort = new PostHogAnalyticsAdapter();

analytics.track('tool:executed', { tool: 'my-tool', duration: 42 });
analytics.identify('user-123', { plan: 'free' });
await analytics.shutdown(); // à appeler avant process.exit()
```

## Port

```typescript
interface AnalyticsPort {
  track(event: string, properties?: Record<string, unknown>): void;
  identify(userId: string, properties?: Record<string, unknown>): void;
  shutdown(): Promise<void>;
}
```

## Décisions clés

- Port séparé de `FeatureFlagsPort` — cycles de vie indépendants (→ ADR-0006)
- Dépend de `@home/posthog` (client partagé), pas de `posthog-node` directement (→ ADR-0005)
- `shutdown()` obligatoire pour flusher les events en attente

## Dépendances

- `@home/posthog` — client PostHog partagé
