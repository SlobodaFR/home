# Domain Context

Ce fichier décrit les bounded contexts du projet et leurs relations. Pour le détail de chaque contexte, voir les `CONTEXT.md` par package et la `CONTEXT-MAP.md` à la racine.

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                       apps/api                          │
│              (NestJS — compose tous les modules)         │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐   ┌──────────┐   (futurs BCs...)
    │  @home/  │   │ outillage│
    │   auth   │   │ packages │
    └──────────┘   └──────────┘
```

## Bounded Contexts actifs

### `@home/auth` — Authentification & Autorisation

**Core domain** — accès à l'application.

| Concept      | Description                                                |
| ------------ | ---------------------------------------------------------- |
| `User`       | Identité, rôle (ADMIN/USER), statut (ACTIVE/REVOKED)       |
| `MagicLink`  | Token d'invitation passwordless, TTL 15 min, single-use    |
| `Session`    | Refresh token, TTL 30 jours, rotation single-use           |
| `Role`       | ADMIN ou USER                                              |
| `Permission` | USERS_INVITE / USERS_REVOKE / USERS_PROMOTE / USERS_DEMOTE |

Voir [`packages/auth/CONTEXT.md`](../packages/auth/CONTEXT.md) pour le détail complet.

## Packages outillage (transverses)

Ces packages ne sont pas des bounded contexts — ils fournissent de l'infrastructure
consommée par tous les BCs.

| Package               | Rôle                                      |
| --------------------- | ----------------------------------------- |
| `@home/config`        | Parsing de configuration (Zod + env vars) |
| `@home/logger`        | `LoggerPort` + Pino + corrélation OTel    |
| `@home/telemetry`     | Tracing OTel → Grafana Cloud              |
| `@home/posthog`       | Client PostHog partagé                    |
| `@home/analytics`     | `AnalyticsPort` → PostHog                 |
| `@home/feature-flags` | `FeatureFlagsPort` → PostHog              |

## Décisions architecturales

Voir [`docs/adr/`](adr/) pour l'ensemble des ADRs.

Les décisions clés :

- **ADR-0008** — SQLite + Prisma par BC (pas de DB partagée)
- **ADR-0009** — JWT access + refresh token rotatif
- **ADR-0010** — Magic link invite-only + bootstrap auto-promotion
- **ADR-0011** — RBAC statique (permissions enum dans le domaine)
- **ADR-0012** — Single NestJS app dans `apps/api`
