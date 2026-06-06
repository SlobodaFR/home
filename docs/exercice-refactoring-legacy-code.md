# Exercice : Refactoring de Code Legacy

## L'Histoire de Kévin

Kévin, développeur junior fraîchement diplômé, a rejoint l'équipe il y a trois semaines. Quand son tech lead lui a parlé de "Software Craftsmanship", il a levé les yeux au ciel en soupirant : "Ouais ouais, moi je livre du code qui marche, c'est ça le vrai métier". Et effectivement, sa fonctionnalité de changement de destination... fonctionne. Par miracle. Kévin est plutôt fier de lui : "Tu vois, j'ai tout mis dans le contrôleur, c'est simple, c'est direct, pas besoin de se prendre la tête avec vos trucs d'architectes astronautes". Le problème, c'est que Kévin ne voit pas encore les dizaines de petits pièges qu'il a semés dans son code. Des pièges qui ne demandent qu'à exploser au visage du prochain développeur qui osera y toucher.

**Votre mission** : reprendre le code de Kévin et lui montrer, avec bienveillance, qu'on peut faire les choses autrement. Mieux. Plus proprement. En appliquant les bonnes pratiques que vous avez apprises.

## La Fonctionnalité de Kévin

### Ce que son code fait (et il en est très fier)

1. **Tout changement de trajet en cours de route entraîne un surcoût**, quelle que soit la formule initiale du client
2. **Si la nouvelle destination est sur Paris** : supplément de **8 euros**
3. **Si la nouvelle destination est à l'extérieur de Paris** : supplément de **6 euros**
4. **Si le ride est en statut "Complété" ou "Annulé"** : on ne peut pas changer la destination

### Où trouver le chef-d'oeuvre de Kévin

Le code se trouve dans :

```
packages/<bounded-context>/src/adapters/http/ride-destination-change.controller.ts
```

Endpoint HTTP :

```
PATCH /rides/:id/destination
Body: { newLatitude: number, newLongitude: number }
```

## Votre Objectif

Transformer le code de Kévin en quelque chose de maintenable, testable et évolutif. Sans casser ce qui fonctionne. Et si possible, sans vexer Kévin.

## Pour Commencer

1. Lancez l'application :

   ```bash
   npm run start:dev -w apps/api
   ```

2. Testez l'endpoint avec un ride existant :

   ```bash
   # D'abord créer un ride
   curl -X POST http://localhost:3000/rides \
     -H "Content-Type: application/json" \
     -d '{"pickUpPosition": {"latitude": 48.8566, "longitude": 2.3522}, "dropOffPosition": {"latitude": 48.8606, "longitude": 2.3376}}'

   # Ensuite changer la destination (remplacez {ride_id})
   curl -X PATCH http://localhost:3000/rides/{ride_id}/destination \
     -H "Content-Type: application/json" \
     -d '{"newLatitude": 48.8738, "newLongitude": 2.2950}'
   ```

3. Ouvrez le fichier `ride-destination-change.controller.ts` et... respirez un grand coup.

4. À vous de jouer !

Bon courage !
