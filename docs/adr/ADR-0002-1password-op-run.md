# ADR-0002 — Secrets : `op run --` plutôt que le SDK 1Password

## Statut
Accepté

## Contexte
Les secrets (API keys, tokens) sont stockés dans 1Password. Deux mécanismes d'accès : `op run -- node script.js` (CLI injecte les secrets comme env vars avant le démarrage) ou `@1password/sdk` (fetch programmatique à runtime).

## Décision
Utilisation exclusive de `op run --`. Les secrets arrivent en env vars et sont validés par Zod comme n'importe quelle variable d'environnement.

## Conséquences
- Aucune dépendance SDK 1Password dans le code applicatif
- Surface d'attaque réduite
- `createConfig()` valide les secrets exactement comme les autres vars
- Incompatible avec la rotation dynamique de secrets à chaud (hors scope actuel)
