# Session du 2026-06-08 — CI/CD, chaîne auth et cycle de vie des sessions

Récapitulatif de ce qui a été imaginé et/ou développé pendant la session.

## 1. Pipeline CI/CD

- **Coverage** : ajout de `@vitest/coverage-v8`, reporter `lcov`, script `test:coverage`
- **SonarCloud** : intégration scan + token via 1Password (`op://TECH/thomassloboda_home_secrets/SONAR_TOKEN`), org `slobodafr`, projectKey `SlobodaFR_home`
- **1Password** : correction des chemins de secrets vers le vault `TECH` / item `thomassloboda_home_secrets`
- **Alignement Node** : `node-version: 24` (matching `.nvmrc` = `v24.16.0`) dans `ci.yml` et `deploy.yml`, résolution d'un drift de lock file (`eastasianwidth`) causé par une divergence npm 10 vs npm 11

→ PR #30

## 2. Auth — agrégats du domaine (chaîne #26 → #27 → #28)

- `User` (Role, Permission, UserStatus, `hasPermission`, `promote`)
- `MagicLink` (`verify`, `consume`, erreurs `MagicLinkExpiredError` / `MagicLinkAlreadyUsedError` / `MagicLinkInvalidError`)
- `Session` (refresh token haché, rotation single-use, expiry)

Rebase en chaîne sur conflits récurrents (commit de scaffold déjà squashé sur `main`).

→ PR #26, #27, #28

## 3. Auth — use cases d'invitation et de vérification (issue #18)

- `InviteUser` : crée un `MagicLink`, envoie l'email d'invitation (bootstrap si aucun user, sinon permission `USERS_INVITE`)
- `VerifyMagicLink` : vérifie le token, crée la session, auto-promotion `ADMIN` si premier utilisateur

Implémenté en `tdd-auto`, 28/28 tests verts.

→ PR #31

## 4. Convention d'imports relatifs

Suppression des extensions `.js` sur les imports relatifs (37 fichiers) — incohérent avec `moduleResolution: "bundler"` qui pointe directement vers les sources `.ts`. Règle ajoutée à `CODE-STYLE.md`.

→ PR #32

## 5. Refactor des test doubles — `Fake*` → `InMemory*`

Les implémentations en mémoire des ports (`UserRepository`, `MagicLinkRepository`, `SessionRepository`, `TokenPort`, `EmailPort`) étaient rangées dans `application/__tests__/fakes/`. Ce sont en réalité de véritables adaptateurs secondaires fonctionnels — déplacés vers `adapters/in-memory/` et renommés `InMemory*` (classes + fichiers kebab-case), avec barrel `adapters/in-memory/index.ts`.

Mise à jour de la documentation et des skills (`tdd-core-patterns`, `tdd-e2e-patterns`, `tdd-integration-patterns`, `tdd-testing-patterns`, `clean-hexagonal-architecture.md`).

→ PR #33

## 6. Auth — cycle de vie des sessions (issue #19)

- `RefreshSession` : charge la session par hash, vérifie expiry + statut `ACTIVE` du user (nouveau `User.assertActive()` / `UserRevokedError`), effectue la rotation, persiste la nouvelle paire de tokens
- `RevokeSession` : charge par hash, supprime la session (`SessionRepository.deleteByTokenHash`, idempotent)

Implémenté en `tdd-auto`, RED-GREEN-CLEAN complet, 36/36 tests `@home/auth`, 55/55 sur le monorepo.

→ PR #34

## Vue d'ensemble — chaîne auth

```
InviteUser ──▶ MagicLink créé + email envoyé
                     │
                     ▼
VerifyMagicLink ──▶ Session créée (+ auto-promotion ADMIN si 1er user)
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
RefreshSession              RevokeSession
(rotation du refresh token)  (déconnexion / invalidation)
```

Voir le diagramme Excalidraw : [`auth-flow.excalidraw`](./diagrams/auth-flow.excalidraw)

## Issues restantes (file d'attente BC auth)

#20 à #24 — adaptateurs Prisma, email, TokenPort, module NestJS.
