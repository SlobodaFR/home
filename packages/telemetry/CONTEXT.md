# @home/telemetry

## Purpose

Instrumentation distribuée pour tous les packages. Initialise le SDK OpenTelemetry et exporte les traces vers Grafana Cloud via OTLP. Doit être initialisé en **premier** dans le bootstrap de chaque app, avant tout import instrumenté.

## Public API

```typescript
import { initTelemetry } from '@home/telemetry';

initTelemetry({
  otlpEndpoint: 'https://otlp-gateway-prod-eu-west-0.grafana.net/otlp/v1/traces',
  serviceName: 'my-tool',
  serviceVersion: '1.0.0',
});
```

## Décisions clés

- Traces uniquement en phase 1 — pas de métriques OTel (→ ADR-0004)
- Doit démarrer avant tout autre package (OTel exige d'être initialisé en premier)
- Shutdown automatique sur `SIGTERM` pour flusher les spans en attente

## Dépendances

- `@home/config` — pour `OTLP_ENDPOINT`, `SERVICE_NAME`
- `@opentelemetry/sdk-node` — SDK complet
- `@opentelemetry/exporter-trace-otlp-http` — export vers Grafana Cloud
- `@opentelemetry/auto-instrumentations-node` — instrumentation automatique Node.js
