---

# ADR-0008 — Persistence du BC auth : SQLite via Prisma

## Statut

Accepted

## Contexte

Le BC `auth` a besoin de persister trois agrégats : `User`, `MagicLink`, `Session`.
L'application est déployée sur un VPS en usage solo/petit groupe.

## Décision

SQLite via Prisma. Le schema et les migrations sont colocalisés dans `packages/auth/prisma/`.
Chaque BC est propriétaire de ses données — pas de DB partagée entre contextes.

## Conséquences

- Zéro infra supplémentaire sur le VPS (fichier local)
- Migrations gérées par Prisma (`prisma migrate deploy`)
- Tests d'intégration : Prisma + SQLite in-memory (`:memory:`) via `DATABASE_URL=file::memory:`
- Si un futur BC nécessite PostgreSQL, il aura son propre schema Prisma indépendant
