---

# ADR-0012 — Déploiement : application NestJS unique dans apps/api

## Statut

Accepted

## Contexte

Les BCs sont dans des packages npm séparés. Il faut décider comment ils sont exposés
via HTTP et déployés.

## Décision

**Application NestJS unique** dans `apps/api` qui importe les modules NestJS de chaque BC.

- Chaque BC expose un `XxxModule` NestJS dans sa couche adapters (`packages/xxx/src/adapters/http/`)
- `apps/api` compose ces modules : `AppModule` importe `AuthModule`, etc.
- Un seul process, un seul port HTTP sur le VPS

Les couches domaine et application de chaque BC restent **pures TypeScript**, sans décorateurs NestJS.
Seule la couche adapters utilise `@Controller`, `@Injectable`, `@Module`, etc.

## Conséquences

- Un seul déployable à gérer sur le VPS (PM2 ou systemd)
- Shared NestJS infrastructure (guards, interceptors, pipes) définie une fois dans `apps/api`
- La règle de dépendance est respectée : NestJS ne contamine pas le domaine
- Si un BC doit être extrait en microservice, seul l'adapter HTTP change
- `apps/` est ajouté aux workspaces npm : `"workspaces": ["packages/*", "apps/*"]`
