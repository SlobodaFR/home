# @home/posthog (interne)

## Purpose

Package interne (`private: true`) qui initialise et expose le client PostHog partagé entre `@home/analytics` et `@home/feature-flags`. Ne doit jamais être importé directement par le code applicatif.

## Public API (interne uniquement)

```typescript
import { initPostHog, getPostHogClient } from '@home/posthog';

// Dans le bootstrap de l'app
initPostHog({ apiKey: config.POSTHOG_API_KEY });

// Dans les adapters (analytics, feature-flags)
const client = getPostHogClient();
```

## Décisions clés

- Client singleton — une seule connexion PostHog par process (→ ADR-0006)
- `getPostHogClient()` lève une erreur explicite si appelé avant `initPostHog()`
- Package `private: true` — jamais publié, jamais importé par du code applicatif (→ ADR-0005, ADR-0006)

## Dépendances

- `@home/config` — pour `POSTHOG_API_KEY`, `POSTHOG_HOST`
- `posthog-node` — client officiel PostHog
