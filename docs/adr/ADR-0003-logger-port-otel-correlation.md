# ADR-0003 — Logger : port avec child() et corrélation OTel automatique

## Statut
Accepté

## Contexte
Le logger doit être interchangeable (Pino maintenant, autre chose demain) et les logs doivent être corrélés avec les traces OpenTelemetry pour faciliter le debugging en production.

## Décision
`LoggerPort` expose `debug/info/warn/error` + `child(bindings)`. L'adapter Pino injecte automatiquement `traceId` et `spanId` depuis le contexte OTel actif via `@opentelemetry/api` (API légère, sans le SDK complet).

## Conséquences
- `@home/logger` dépend de `@opentelemetry/api` (peer dependency légère)
- Corrélation logs ↔ traces sans appel explicite à chaque log
- Swapper Pino = écrire un nouvel adapter qui implémente `LoggerPort`
