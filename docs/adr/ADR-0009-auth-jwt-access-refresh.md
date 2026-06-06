---

# ADR-0009 — Sessions : JWT access token + refresh token rotatif

## Statut

Accepted

## Contexte

Après vérification d'un magic link, l'utilisateur doit obtenir des credentials pour
authentifier ses requêtes suivantes.

## Décision

- **Access token** : JWT signé HS256, durée 15 min, stateless
- **Refresh token** : token opaque aléatoire, stocké **haché** en DB (`Session`), durée 30 jours
- **Rotation** : chaque usage du refresh token invalide l'ancien et émet un nouveau
- **Transport** : `Authorization: Bearer <accessToken>` uniquement (pas de cookie)

## Conséquences

- Validation des requêtes courantes sans hit DB (access token stateless)
- Révocation possible via invalidation du refresh token en DB
- Rotation détecte la réutilisation d'un token volé (si l'ancien est re-présenté → révocation totale)
- Le secret JWT est stocké dans 1Password, injecté via `op run --`
