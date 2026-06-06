# TDD, DDD, Clean Architecture

## Synthèse – Matinée de formation

---

## 1. Se placer à la table du fondateur

La formation a commencé par un exercice volontairement déroutant :  
se placer **comme si nous étions attablés avec le fondateur**, entourés de 3 ou 4 développeurs.

Le fondateur présente son projet.  
Il explique sa vision, ses idées, ses attentes.

Puis arrive presque systématiquement la question fatidique :

> « Combien ça va me coûter ?  
> Et dans combien de temps pensez-vous que ce sera terminé ? »

### Le piège classique des développeurs

La majorité des développeurs tombe immédiatement dans un piège :

- annoncer un **chiffre**
- annoncer une **durée**

Comme si leur rôle se limitait à estimer un tout.

Or, ce réflexe est dangereux.

Le vrai rôle du développeur, à ce moment-là, **n’est pas d’estimer**,  
mais de **réfléchir à des solutions plus intelligentes**.

### La valeur réelle du développeur

Les fondateurs ne sont pas toujours capables d’avoir une pensée créative sur le logiciel.

Non pas par manque de vision,  
mais parce qu’ils **ignorent ce que le logiciel permet réellement** :

- casser l’ordre des choses,
- faire des raccourcis,
- livrer partiellement,
- produire du feedback très tôt.

Le développeur, lui, **sait** que tout n’a pas besoin d’arriver dans l’ordre.

Il peut donc :

- proposer des **variantes business**
- moins coûteuses au démarrage,
- plus rapides à livrer,
- et capables de satisfaire l’utilisateur très tôt.

### No Estimate par la créativité

Plutôt que d’estimer un projet complet, long et risqué,  
on propose :

- une **suite de petits produits**
- du plus spécifique au plus générique
- chacun apportant :
  - du feedback
  - de la valeur
  - parfois même une rentabilité partielle

C’est dans ce sens que l’on parle de **No Estimate** :

Non pas refuser de réfléchir,  
mais **rendre les estimations longue durée inutiles**  
grâce à la créativité et au design.

---

## 2. En informatique, il n’y a pas d’ordre des choses

Un principe fondamental permet déjà de voir le logiciel autrement :

> **Il n’existe pas d’ordre naturel en informatique.**

Toute décision peut être **remise à plus tard**.

### Les croyances limitantes

Beaucoup de développeurs pensent :

- qu’il faut une base de données pour commencer,
- qu’il faut gérer la sécurité dès le premier jour,
- qu’il faut tout mettre en place avant de coder,
- que “c’est comme ça, on n’a pas le choix”.

Ces croyances créent :

- du délai,
- du coût,
- de la lourdeur.

Et elles sont vécues comme des fatalités.

### Ce que dit vraiment la Clean Architecture

La Clean Architecture ne rajoute pas de contraintes.  
Elle en enlève.

Comme l’explique Uncle Bob :

> **Un bon architecte est capable de repousser le plus tard possible  
> les décisions techniques.**

Cela signifie :

- ne pas ignorer les sujets,
- mais **ne pas les payer trop tôt**.

Décider plus tard, c’est :

- aller plus vite maintenant,
- se concentrer sur l’essentiel,
- livrer quelque chose d’utile sans infrastructure lourde.

---

## 3. Simplifier radicalement le business (exemple Uber)

Prenons un exemple.

Le fondateur explique :

- il existe des utilisateurs basiques et premium,
- selon l’abonnement, on peut réserver :
  - un Uber standard,
  - ou un Uber X (Mercedes, service premium).

### Le raisonnement classique

Dans la tête du développeur classique :

- il faut gérer les abonnements,
- les conditions,
- les cas,
- les règles.

La complexité arrive immédiatement.

### Le raisonnement orienté valeur

Un développeur qui a intégré TDD et Clean Architecture pose une autre question :

> « Quelle est la vraie plus-value business, là, maintenant ? »

La réponse est claire : **Uber X**.

C’est ce qui fait décoller le business.

### Une proposition volontairement radicale

On peut donc proposer :

- supprimer la distinction basic / premium,
- garder un seul type d’utilisateur,
- faire **100 % Uber X par défaut**.

Résultat :

- un logiciel plus spécifique,
- mais beaucoup plus impactant,
- qui montre immédiatement sa valeur.

### Et si on veut garder l’abonnement ?

Même là, l’architecture aide.

On peut :

- garder un port du type :  
  « dis-moi quel est l’abonnement de l’utilisateur »
- **sans implémenter le vrai système d’abonnement**

Le tuyau existe.  
La logique métier est prête.  
L’infrastructure réelle viendra plus tard.

La business logic, elle, **ne changera pas**.

---

## 4. Petit périmètre, vraie agilité

Une fois ce petit lot identifié :

- il devient estimable,
- pricable,
- beaucoup moins risqué.

On peut livrer :

- souvent,
- parfois tous les jours.

### L’agilité réelle

> Un bon agiliste n’est pas celui qui fait le plus de choses possible.  
> C’est celui qui arrive à en faire le moins possible.

Le vrai gain est dans :

- la suppression,
- l’élimination,
- la réduction du périmètre.

---

## 5. Être agile dans le code : itérer avant d’incrémenter

Quand on commence à coder, de nouvelles croyances apparaissent :

- « On va commencer par cette classe »
- « Puis on reliera plus tard »

Le code devient un ensemble de boulons non assemblés.

Quand on demande :

> « Montre-moi le comportement du logiciel »

La réponse est :

> « On ne peut pas encore, tout n’est pas relié »

### Le principe fondamental d’itération

Être agile dans le code, c’est raisonner ainsi :

> Tu veux construire une bibliothèque ?  
> **Construis une bibliothèque.**

Même moche.  
Même fragile.  
Mais **debout**.

### Itérer, c’est montrer

Itérer, c’est :

- avoir quelque chose d’exécutable,
- le plus tôt possible,
- même simplifié.

Sans itération :

- pas de feedback,
- pas de discussion,
- pas d’apprentissage.

### Commencer par le comportement

On ne commence pas par :

- les entités,
- les recoins internes,
- les détails.

On commence par :

- **le comportement logiciel**
- **le use case**
- **le chemin d’exécution**

Le premier use case :

- s’exécute,
- fonctionne,
- produit quelque chose.

Et c’est déjà énorme.

---

## Conclusion

- Il n’y a pas d’ordre naturel en informatique
- Le développeur est force de proposition business
- La Clean Architecture permet de décider plus tard
- L’agilité consiste à faire moins
- L’itération prime sur l’incrément
- Le logiciel doit vivre dès le premier instant
