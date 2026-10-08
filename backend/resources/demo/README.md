# Jeux de données d'exemple

Fichiers fictifs au format du brief : UTF-8, ligne d'en-tête, champs séparés par `;`, virgule décimale.
Ils servent aux démonstrations et aux tests manuels de l'import. Les jeux fournis par les enseignants pourront s'ajouter ici.

| Fichier | Lignes | Contenu | Graphiques possibles |
| --- | --- | --- | --- |
| `festival-affluence.csv` | 60 | Spectateurs par jour, scène et créneau | barres (scène × spectateurs), heatmap (jour × créneau), courbe |
| `billetterie-ventes.csv` | 132 | Ventes hebdomadaires par type de billet et canal | courbe (semaine × billets), camembert (canal), barres empilées |
| `trail-resultats.csv` | 190 | Résultats de trois courses : âge, sexe, club, temps | histogramme (temps), nuage de points (âge × temps), boîte à moustaches |
| `salon-stands.csv` | 48 | Stands d'un salon : surface, visiteurs, contacts, satisfaction | nuage de points (surface × visiteurs), treemap (secteur) |
| `enquete-festivaliers.csv` | 150 | Enquête : âge, origine, transport, notes, dépenses | camembert (transport), barres (origine × note), histogramme (dépenses) |

Pièges volontaires pour l'import :

- `Dossard` et `Répondant` sont détectés comme numériques alors que ce sont des identifiants : le fournisseur doit les passer en catégorielles.
- `Temps (min)` est vide pour les coureurs qui ont abandonné.
- `Date` et `Créneau` sont catégorielles (texte).

Ces fichiers alimentent aussi les données de démonstration (`bin/console app:demo` ou option de l’installeur), d’où leur place dans `backend/` : ils sont embarqués dans l’image de production.

Régénération : script `generate-samples.mjs` (graine fixe, mêmes valeurs à chaque exécution), non versionné.
