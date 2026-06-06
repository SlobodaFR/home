# @home/feature-flags

## Purpose

Feature flags centralisés via PostHog. Expose `FeatureFlagsPort` — interface stable permettant de swapper le fournisseur sans toucher au code applicatif. Permet le trunk-based development avec des features longues isolées par flag.

## Public API

```typescript
import { PostHogFeatureFlagsAdapter, type FeatureFlagsPort } from '@home/feature-flags';

const flags: FeatureFlagsPort = new PostHogFeatureFlagsAdapter();

if (await flags.isEnabled('new-dashboard', userId)) {
  // feature activée
}

const variant = await flags.getVariant('pricing-experiment', userId);
```

## Port

```typescript
interface FeatureFlagsPort {
  isEnabled(flag: string, userId?: string): Promise<boolean>;
  getVariant(flag: string, userId?: string): Promise<string | undefined>;
}
```

## Décisions clés

- Port séparé de `AnalyticsPort` — peut être swappé indépendamment (→ ADR-0006)
- Flags gérés dans le dashboard PostHog — pas de persistence locale (→ ADR-0005)
- `userId` optionnel — fallback sur `'anonymous'` pour les tools non-authentifiés
- Permet le trunk-based avec de longues features sans branches (→ ADR-0007)

## Dépendances

- `@home/posthog` — client PostHog partagé
