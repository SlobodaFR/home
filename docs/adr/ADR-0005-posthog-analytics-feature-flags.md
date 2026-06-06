# ADR-0005 — PostHog pour analytics et feature flags

## Statut
Accepté

## Contexte
Le workspace a besoin d'analytics produit et de feature flags. PostHog couvre les deux nativement avec un free tier généreux (1M events/mois).

## Décision
PostHog est le fournisseur unique pour analytics (`AnalyticsPort`) et feature flags (`FeatureFlagsPort`). Le client PostHog est partagé via `@home/posthog` (package interne privé).

## Conséquences
- Un seul compte SaaS à gérer
- `@home/posthog` est un détail d'implémentation — les consommateurs dépendent des ports, pas de PostHog
- Si PostHog est remplacé, seuls les adapters changent
