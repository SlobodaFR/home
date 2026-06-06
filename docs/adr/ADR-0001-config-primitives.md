# ADR-0001 — Config : primitives réutilisables plutôt que schéma centralisé

## Statut
Accepté

## Contexte
Le workspace contient plusieurs packages indépendants ayant chacun leurs propres besoins de configuration. Deux approches possibles : un schéma Zod global centralisé dans `@home/config`, ou des primitives que chaque package utilise pour définir son propre schéma.

## Décision
`@home/config` expose uniquement `createConfig(schema: ZodSchema)`. Chaque package définit et valide son propre schéma localement.

## Conséquences
- `@home/config` reste stable quand un nouveau package est ajouté
- Chaque package est autonome et testable en isolation
- Pas de couplage entre packages via un schéma partagé
