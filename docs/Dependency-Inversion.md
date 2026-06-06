# L’inversion de dépendance

## Pourquoi ce principe émerge naturellement quand on fait du TDD

---

## Le point de départ : réserver une course UberX

À un moment de la matinée, on pose un use case simple :

> **Réserver une course UberX**

Ce use case doit :

- calculer le prix de la course,
- créer une `Ride`,
- la sauvegarder dans un repository,
- avec **le bon prix**.

Jusqu’ici, rien de surprenant.

---

## Ajout d’une règle métier : l’anniversaire du rider

Puis on ajoute une règle métier supplémentaire :

> Si c’est l’anniversaire du rider,  
> alors il bénéficie d’une ristourne  
> et **ne paie pas le supplément UberX**.

Donc, pour appliquer cette règle, il faut :

- connaître la date d’anniversaire du rider,
- comparer cette date avec **la date d’aujourd’hui**.

---

## L’erreur naïve : dépendre directement de la date système

La première implémentation naïve consiste à écrire dans le code :

- une comparaison entre :
  - `new Date()` (la date courante),
  - et la date d’anniversaire du rider.

Et là, un problème majeur apparaît immédiatement.

### Pourquoi c’est un problème ?

Parce que :

- la date du rider est figée,
- la date système, elle, **change tous les jours**.

Résultat :

- un test qui passe aujourd’hui,
- **cassera demain**.

Il devient impossible de garantir qu’un test s’exécute toujours dans les mêmes conditions.

---

## Les faux bons contournements

On pourrait essayer de ruser :

- créer un rider né “aujourd’hui”,
- jouer avec des dates relatives,
- ajouter ou soustraire des années (ex. `-18 ans`),
- bricoler pour “tomber juste”.

Mais très vite, cela devient :

- compliqué,
- fragile,
- illisible,
- et surtout **ingérable** dès que d’autres règles métier arrivent :
  - majorité,
  - ancienneté,
  - périodes spécifiques, etc.

Le problème n’est pas la règle métier.  
Le problème, c’est **la dépendance implicite à la date système**.

---

## Rendre explicite ce qui était implicite

La solution n’est pas de tricher avec les dates.  
La solution est de **rendre explicite la notion de “maintenant”**.

Jusqu’ici :

- la date est cachée dans le code (`new Date()`),
- elle est implicite,
- et incontrôlable.

On décide donc de :

- **ne plus appeler directement la date système**,
- mais de **la recevoir de l’extérieur**.

---

## Introduction d’une abstraction : DateTimeProvider

On introduit une interface :

- `DateTimeProvider`

Dont le rôle est simple :

- fournir la date courante.

Deux implémentations apparaissent naturellement :

### 1. SystemDateTimeProvider

- utilisé en production,
- retourne simplement `new Date()`.

### 2. FixedDateTimeProvider

- utilisé dans les tests,
- retourne une date **fixée par le test**.

Le test peut alors dire explicitement :

> “Supposons qu’aujourd’hui, nous sommes le 12 mars.”

Et vérifier :

- si le code utilise bien **cette date-là**,
- pour déterminer si c’est l’anniversaire du rider.

---

## Ce que cela change fondamentalement

À partir de ce moment :

- les tests deviennent **déterministes**,
- ils fonctionnent **tout le temps**,
- sans couac,
- sans dépendre du jour où ils sont exécutés.

Mais surtout, quelque chose de beaucoup plus important se produit.

---

## « On aurait pu faire ça avec un mock »

Quelqu’un pourrait dire :

> « On aurait pu simplement mocker la date. »

Oui.  
Mais la question clé est la suivante :

> **En production, peux-tu changer la date à la volée ?**

Par exemple :

- faire une démo,
- dire : “Aujourd’hui, c’est son anniversaire”,
- **sans changer les données du rider**,
- uniquement en changeant le temps.

Avec un mock :

- impossible.

Avec une inversion de dépendance :

- trivial.

---

## Le vrai sens de l’inversion de dépendance

Le principe est le suivant :

> **Je ne veux pas dépendre de la date.**  
> **Je veux que la date dépende de moi.**

Autrement dit :

- le code métier ne dépend pas du système,
- il dépend **d’une abstraction qu’il contrôle**.

La date est :

- cachée derrière une interface,
- interchangeable,
- pilotable.

C’est exactement ça, l’inversion de dépendance.

---

## Extension naturelle : repositories

Le même raisonnement s’applique immédiatement ailleurs.

### RideRepository

### RiderRepository

On ne veut pas que le use case dépende de :

- la mémoire,
- Prisma,
- une base de données spécifique.

Donc :

- on introduit des interfaces,
- avec plusieurs implémentations :
  - une “fausse” (in-memory, test),
  - une “vraie” (Prisma, SQL, etc.).

---

## Le « mode cerise »

C’est ce que l’on peut appeler le **mode cerise** :

- une **interface**,
- deux **tiges** :
  - une vraie,
  - une fausse.

Et tout le monde est content :

- les tests,
- la production,
- le métier.

---

## Ce que le TDD révèle naturellement

Ce point est fondamental :

> **Ce n’est pas l’architecture qui impose l’inversion de dépendance.**  
> **Ce sont les tests.**

Quand on commence par les tests :

- les dépendances problématiques apparaissent immédiatement,
- les éléments non contrôlables sautent aux yeux,
- les abstractions émergent naturellement.

Le TDD **force** à se poser les bonnes questions très tôt.

---

## Conclusion

- Le TDD révèle les dépendances cachées
- L’inversion de dépendance rend le code testable
- Les abstractions émergent par nécessité, pas par dogme
- Ce chemin mène naturellement vers la Clean Architecture
- La Clean Architecture n’est pas une décision préalable
- C’est une **conséquence logique** d’un TDD bien mené
