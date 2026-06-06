# ADR-0007 — Bootstrap explicite par app, pas de package partagé

## Statut
Accepté

## Contexte
Tous les packages (telemetry, logger, posthog) nécessitent une initialisation dans un ordre précis. OTel doit démarrer avant tout code instrumenté.

## Décision
Chaque app orchestre son propre bootstrap explicitement. Pas de package `@home/bootstrap` centralisé.

```typescript
// main.ts de chaque app
const config = loadConfig(appSchema);
initTelemetry(config);           // doit être premier
const logger = initLogger(config);
initPostHog(config);
```

## Conséquences
- Chaque app adapte sa séquence à ses besoins (un CLI n'a pas besoin de PostHog)
- La séquence est lisible et auditable dans chaque `main.ts`
- Si la répétition devient pénible (>3 apps identiques), extraire un `@home/bootstrap` à ce moment
