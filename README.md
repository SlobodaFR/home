# home

Collection d'outils TypeScript pour usage personnel et professionnel quotidien, organisée en npm workspace et déployée sur un VPS personnel.

## Stack

- **Langage** : TypeScript (strict, ESM)
- **Gestionnaire de paquets** : npm workspaces
- **Tests** : Vitest
- **Lint / format** : ESLint + Prettier
- **Hooks Git** : Husky — lint-staged (`pre-commit`), commitlint (`commit-msg`)
- **Convention de commits** : Conventional Commits (`type(scope): message`)
- **Releases** : semantic-release
- **CI/CD** : GitHub Actions → VPS via SSH
- **Secrets** : 1Password (`op` CLI / intégration GitHub Actions)

## Architecture

Hexagonal Architecture (ports & adapters) avec séparation stricte domaine / application / adapters. Voir [`CLAUDE.md`](./CLAUDE.md) et [`.claude/rules/`](./.claude/rules/) pour les règles canoniques (architecture, code style, anti-patterns, enforcement).

## Structure du workspace

Chaque outil vit dans son propre package sous `packages/`, chaque application sous `apps/`. Voir [`CONTEXT-MAP.md`](./CONTEXT-MAP.md) pour la cartographie complète des bounded contexts et packages, avec liens vers leurs `CONTEXT.md` respectifs.

## Commandes courantes

```bash
# Installer les dépendances
npm install

# Build tous les packages
npm run build -ws

# Build un package
npm run build -w packages/<name>

# Lancer tous les tests
npm test

# Lancer les tests d'un package
npm test -w packages/<name>

# Lancer un fichier de test précis
npx vitest run packages/<name>/src/__tests__/foo.test.ts

# Lint
npm run lint

# Format
npm run format
```

## Documentation

- [`CONTEXT-MAP.md`](./CONTEXT-MAP.md) — cartographie des bounded contexts et packages
- [`docs/adr/`](./docs/adr/) — Architecture Decision Records
- [`docs/agents/`](./docs/agents/) — guides pour les agents (issue tracker, triage, domain docs)
- [`docs/sessions/`](./docs/sessions/) — récapitulatifs de sessions de travail (avec diagrammes)

## Déploiement

GitHub Actions SSH sur le VPS et exécute le script de déploiement. Secrets stockés dans 1Password, injectés au runtime via `op run --` ou le SDK 1Password — jamais en dur ni committés.
