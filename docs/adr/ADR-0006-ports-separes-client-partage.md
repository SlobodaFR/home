# ADR-0006 — Ports séparés, client PostHog partagé

## Statut
Accepté

## Contexte
Analytics et feature flags utilisent le même client PostHog mais ont des responsabilités distinctes et des cycles de vie indépendants.

## Décision
Deux ports distincts : `AnalyticsPort` (dans `@home/analytics`) et `FeatureFlagsPort` (dans `@home/feature-flags`). Les deux adapters partagent le client PostHog via `@home/posthog` (package interne, `private: true`).

## Conséquences
- Remplacer l'analytics ne touche pas les feature flags, et vice versa
- Un seul client PostHog initialisé = une seule connexion
- `@home/posthog` n'est jamais importé directement par le code applicatif
