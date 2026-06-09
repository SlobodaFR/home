# apps/api — Context

## Responsabilité

Point d'entrée unique de l'application. Compose les modules NestJS des BCs et expose
l'API HTTP sur le VPS.

## Rôle

`apps/api` est un **déployable**, pas une librairie. Il ne contient aucune logique métier.
Son seul rôle est de câbler les modules NestJS des BCs et de configurer l'infrastructure
partagée (Swagger, guards globaux, interceptors futurs).

## Structure

```
apps/api/
  src/
    app.module.ts       ← compose AuthModule + futurs modules
    main.ts             ← bootstrap NestJS + Swagger
  package.json
  tsconfig.json         ← include workspace packages pour esbuild decorator support
```

## Bootstrap order

```
1. NestFactory.create(AppModule, new FastifyAdapter())
2. SwaggerModule.setup('docs', app, document)   ← OpenAPI UI disponible à /docs
3. app.listen(PORT, '0.0.0.0')
```

## Swagger

- URL : `http://localhost:3000/docs` (dev)
- Bearer auth déclaré globalement (`addBearerAuth`)
- Tags : `auth`, `users`
- Routes documentées via `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`, `@ApiResponse` dans les controllers du BC auth

## tsconfig particulier

`apps/api/tsconfig.json` étend `tsconfig.base.json` et **liste explicitement les packages workspace dans `include`** :

```json
"include": [
  "src/**/*",
  "../../packages/auth/src/**/*",
  "../../packages/config/src/**/*",
  ...
]
```

**Raison :** esbuild (via tsx) n'applique `experimentalDecorators` qu'aux fichiers correspondant aux patterns `include`. Sans ça, les décorateurs NestJS (`@Injectable`, `@Inject`, `@Controller`, etc.) dans les packages workspace ne sont pas transformés → erreur runtime `Parameter decorators only work when experimental decorators are enabled`.

## Dépendances

```
apps/api
  ├── @home/auth         (AuthModule)
  ├── @home/config       (configuration)
  ├── @home/logger       (LoggerPort)
  ├── @home/telemetry    (initTelemetry — à câbler)
  └── @home/posthog      (initPostHog — à câbler)
```

## ADRs associés

- [ADR-0007](../../docs/adr/ADR-0007-bootstrap-explicite-par-app.md) — Bootstrap explicite par app
- [ADR-0012](../../docs/adr/ADR-0012-nestjs-single-app.md) — NestJS single app
