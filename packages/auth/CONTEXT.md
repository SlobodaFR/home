# BC Auth — Context

## Responsabilité

Authentification passwordless (magic link) et autorisation (RBAC) pour l'ensemble de l'application.

## Agrégats

| Agrégat     | Responsabilité                                               | Cycle de vie     |
| ----------- | ------------------------------------------------------------ | ---------------- |
| `User`      | Identité, rôle (`ADMIN`/`USER`), statut (`ACTIVE`/`REVOKED`) | Long (permanent) |
| `MagicLink` | Token d'invitation haché, TTL 15 min, single-use             | Court (éphémère) |
| `Session`   | Refresh token haché, TTL 30 jours, rotation single-use       | Moyen (30 jours) |

## Rôles et permissions

```
ADMIN → USERS_INVITE, USERS_REVOKE, USERS_PROMOTE, USERS_DEMOTE
USER  → (aucune permission admin)
```

Permissions définies comme enum statique dans le domaine — pas de table DB.

## Use cases

| Use case          | Accès                       | Description                                          |
| ----------------- | --------------------------- | ---------------------------------------------------- |
| `InviteUser`      | `USERS_INVITE` ou bootstrap | Crée MagicLink + envoie email                        |
| `VerifyMagicLink` | Public                      | Vérifie token, crée session, auto-promeut si premier |
| `RefreshSession`  | Public                      | Rotation refresh token → nouvelle paire JWT          |
| `RevokeSession`   | Authentifié                 | Invalide le refresh token (déconnexion)              |
| `RevokeUser`      | `USERS_REVOKE`              | Passe en REVOKED + invalide toutes ses sessions      |
| `PromoteUser`     | `USERS_PROMOTE`             | Élève un USER en ADMIN                               |
| `DemoteUser`      | `USERS_DEMOTE`              | Rétrograde un ADMIN en USER                          |
| `ListUsers`       | `ADMIN`                     | Liste paginée des utilisateurs                       |
| `GetUser`         | `ADMIN`                     | Détail d'un utilisateur                              |

## Événements domaine

| Événement     | Side-effect                                  |
| ------------- | -------------------------------------------- |
| `UserInvited` | Déclenche l'envoi de l'email via `EmailPort` |
| `UserRevoked` | Invalide toutes les sessions actives du user |

## Ports (interfaces)

| Port                  | Implémentation(s)                                                 |
| --------------------- | ----------------------------------------------------------------- |
| `UserRepository`      | `PrismaUserRepository`                                            |
| `MagicLinkRepository` | `PrismaMagicLinkRepository`                                       |
| `SessionRepository`   | `PrismaSessionRepository`                                         |
| `EmailPort`           | `ResendEmailAdapter` (prod), `SmtpEmailAdapter` (dev/MailDev)     |
| `TokenPort`           | `JwtTokenAdapter` (access) + `CryptoTokenAdapter` (refresh/magic) |

## Infrastructure

- **DB** : SQLite via Prisma (`prisma/schema.prisma`)
- **Migrations** : `prisma migrate deploy` au démarrage
- **Tests d'intégration** : SQLite in-memory (`file::memory:`)
- **Email prod** : Resend (API key via 1Password)
- **Email dev** : MailDev via SMTP

## Règles domaine clés

1. **Bootstrap** : si aucun `User` en DB, `InviteUser` est accessible sans auth
2. **Auto-promotion** : si aucun `ADMIN` au moment de `VerifyMagicLink` → promu `ADMIN`
3. **Magic link single-use** : le token est invalidé immédiatement après vérification
4. **Refresh token rotation** : chaque usage génère un nouveau token, l'ancien est invalidé
5. **Révocation totale** : `RevokeUser` invalide toutes les sessions actives

## Dépendances

```
@home/auth
  ├── @home/config   (configuration Zod)
  ├── @home/logger   (LoggerPort)
  └── prisma         (client généré dans packages/auth)
```

## ADRs associés

- [ADR-0008](../../docs/adr/ADR-0008-auth-bc-sqlite-prisma.md) — SQLite via Prisma
- [ADR-0009](../../docs/adr/ADR-0009-auth-jwt-access-refresh.md) — JWT access + refresh
- [ADR-0010](../../docs/adr/ADR-0010-auth-magic-link-invite-only.md) — Magic link invite-only
- [ADR-0011](../../docs/adr/ADR-0011-auth-rbac-static-permissions.md) — RBAC statique
- [ADR-0012](../../docs/adr/ADR-0012-nestjs-single-app.md) — NestJS single app
