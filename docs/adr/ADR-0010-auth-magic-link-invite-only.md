---

# ADR-0010 — Authentification passwordless : magic link invite-only

## Statut

Accepted

## Contexte

L'application nécessite une authentification sans mot de passe, accessible à un petit
groupe d'utilisateurs de confiance.

## Décision

**Magic link invite-only** :

- Seul un admin peut inviter un email (`InviteUser` — permission `USERS_INVITE`)
- L'invitation génère un `MagicLink` (token haché, TTL 15 min, single-use)
- Un email est envoyé via `EmailPort` (Resend en prod, SMTP/MailDev en dev)
- Le clic sur le lien déclenche `VerifyMagicLink` qui émet access + refresh tokens

**Exception bootstrap** : si aucun `User` n'existe en DB, `InviteUser` est accessible
sans authentification — le premier utilisateur peut s'auto-inviter.

**Auto-promotion** : si aucun `ADMIN` n'existe au moment de `VerifyMagicLink`,
l'utilisateur vérifié est automatiquement promu `ADMIN`.

## Conséquences

- Aucune inscription publique — surface d'attaque réduite
- Pas de gestion de mots de passe (aucun hash de password en DB)
- Le provider email est swappable via `EmailPort` (port + adapters)
- Bootstrap ne nécessite pas d'intervention manuelle sur le serveur
