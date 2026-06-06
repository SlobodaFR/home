---

# ADR-0011 — Autorisation : RBAC avec permissions statiques

## Statut

Accepted

## Contexte

L'application nécessite un contrôle d'accès fin. Deux rôles identifiés en V1 : `ADMIN` et `USER`.

## Décision

**RBAC avec permissions définies comme enum statique dans le domaine** :

```typescript
enum Permission {
  USERS_INVITE = 'users:invite',
  USERS_REVOKE = 'users:revoke',
  USERS_PROMOTE = 'users:promote',
  USERS_DEMOTE = 'users:demote',
}

enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [USERS_INVITE, USERS_REVOKE, USERS_PROMOTE, USERS_DEMOTE],
  [Role.USER]: [],
};
```

Les permissions ne sont pas stockées en DB — elles évoluent avec le code.

## Conséquences

- Changement de permission = changement de comportement métier → versionné dans git
- Domaine pur, testable sans DB
- Extensible : nouveaux rôles ou permissions = PR, pas de migration
- Les BCs consommateurs utiliseront `AuthorizationPort` pour vérifier les permissions
