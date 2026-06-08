# Architecture Decision Records

Décisions d'architecture structurantes pour le workspace, classées par ordre chronologique.

| ADR                                                       | Titre                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------- |
| [ADR-0001](./ADR-0001-config-primitives.md)               | Config : primitives réutilisables plutôt que schéma centralisé |
| [ADR-0002](./ADR-0002-1password-op-run.md)                | Secrets : `op run --` plutôt que le SDK 1Password              |
| [ADR-0003](./ADR-0003-logger-port-otel-correlation.md)    | Logger : port avec `child()` et corrélation OTel automatique   |
| [ADR-0004](./ADR-0004-otel-traces-only.md)                | Télémétrie : traces uniquement (phase 1)                       |
| [ADR-0005](./ADR-0005-posthog-analytics-feature-flags.md) | PostHog pour analytics et feature flags                        |
| [ADR-0006](./ADR-0006-ports-separes-client-partage.md)    | Ports séparés, client PostHog partagé                          |
| [ADR-0007](./ADR-0007-bootstrap-explicite-par-app.md)     | Bootstrap explicite par app, pas de package partagé            |
| [ADR-0008](./ADR-0008-auth-bc-sqlite-prisma.md)           | Persistence du BC auth : SQLite via Prisma                     |
| [ADR-0009](./ADR-0009-auth-jwt-access-refresh.md)         | Sessions : JWT access token + refresh token rotatif            |
| [ADR-0010](./ADR-0010-auth-magic-link-invite-only.md)     | Authentification passwordless : magic link invite-only         |
| [ADR-0011](./ADR-0011-auth-rbac-static-permissions.md)    | Autorisation : RBAC avec permissions statiques                 |
| [ADR-0012](./ADR-0012-nestjs-single-app.md)               | Déploiement : application NestJS unique dans `apps/api`        |
