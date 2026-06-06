# @home/config

## Purpose

Configuration primitive pour tous les packages. Parse et valide les variables d'environnement contre un schéma Zod fourni par l'appelant. Les secrets arrivent déjà en env vars via `op run --` — ce package ne lit jamais 1Password directement.

## Public API

```typescript
import { createConfig } from '@home/config';
import { z } from 'zod';

const config = createConfig(z.object({
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  MY_API_KEY: z.string(),
}));
// Lance une erreur au démarrage si une var est manquante ou invalide
```

## Décisions clés

- Chaque package définit son propre schéma Zod — pas de schéma global (→ ADR-0001)
- Les secrets 1Password arrivent via `op run --`, pas via SDK (→ ADR-0002)
- Échec rapide au démarrage avec message clair listant toutes les vars invalides

## Dépendances

- `zod` — définition et validation du schéma
