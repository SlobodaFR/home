# ADR-0004 — Télémétrie : traces uniquement (phase 1)

## Statut
Accepté

## Contexte
OpenTelemetry couvre traces, métriques et logs. Le workspace démarre sans trafic significatif à mesurer.

## Décision
`@home/telemetry` instrumente uniquement les **traces** (spans) exportées vers Grafana Cloud via OTLP. Les métriques OTel (`MeterProvider`) sont exclues de la phase 1.

## Conséquences
- Surface d'instrumentation réduite au démarrage
- Les métriques peuvent être ajoutées dans `@home/telemetry` sans changer l'API existante
- Grafana Cloud reçoit déjà les traces ; les métriques Prometheus peuvent suivre indépendamment
