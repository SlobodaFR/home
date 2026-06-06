# apps/api — Context

## Responsabilité

Point d'entrée unique de l'application. Compose les modules NestJS des BCs et expose
l'API HTTP sur le VPS.

## Rôle

`apps/api` est un **déployable**, pas une librairie. Il ne contient aucune logique métier.
Son seul rôle est de câbler les modules NestJS des BCs et de configurer l'infrastructure
partagée (guards globaux, interceptors, Swagger, etc.).

## Structure

```
apps/api/
  src/
    app.module.ts       ← compose AuthModule + futurs modules
    main.ts             ← bootstrap NestJS, init telemetry + logger
  package.json
  tsconfig.json
```

## Bootstrap order

```
1. initTelemetry()     (@home/telemetry)
2. createPinoLogger()  (@home/logger)
3. initPostHog()       (@home/posthog)
4. NestFactory.create(AppModule)
```

## Dépendances

```
apps/api
  ├── @home/auth         (AuthModule)
  ├── @home/config       (configuration)
  ├── @home/logger       (LoggerPort)
  ├── @home/telemetry    (initTelemetry)
  └── @home/posthog      (initPostHog)
```

## ADRs associés

- [ADR-0007](../../docs/adr/ADR-0007-bootstrap-explicite-par-app.md) — Bootstrap explicite par app
- [ADR-0012](../../docs/adr/ADR-0012-nestjs-single-app.md) — NestJS single app
