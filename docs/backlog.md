# Backlog Evently CMS

Légende : priorité **M** = Must (MVP), **S** = Should, **C** = Could. Estimation en jours de travail (j). Cocher `[x]` quand la story respecte la définition de « terminé » du `CLAUDE.md`.

## Calendrier

Projet du lundi 12/10/2026 (S42) au vendredi 29/01/2027 (S4). Les dates exactes de remise et de soutenance seront communiquées par les enseignants (le brief indique « semaine du 27/01 au 31/01 », date de l'an dernier).

| Sprint | Semaines | Dates | Objectif |
| --- | --- | --- | --- |
| S0 | S42 | 12/10 – 18/10 | Socle : Docker, Symfony, React, CI, qualité |
| S1 | S43–S44 | 19/10 – 01/11 | Comptes, rôles, installeur, médiathèque |
| S2 | S45–S46 | 02/11 – 15/11 | Jeux de données (import, analyse, validation) |
| S3 | S47–S48 | 16/11 – 29/11 | Articles, blocs, visualisations MVP |
| S4 | S49–S50 | 30/11 – 13/12 | Site public, notation, thèmes |
| S5 | S51–S53 | 14/12 – 03/01 | Modules événementiels (programme, plan, billetterie). Vacances : marge |
| S6 | S1–S2 | 04/01 – 17/01 | i18n complète, accessibilité, sécurité, tests, distribution |
| S7 | S3–S4 | 18/01 – 29/01 | Gel des fonctionnalités, données de démo, vidéo, dossier, soutenance |

**MVP** = toutes les stories **M** des sprints S0 à S5. Le MVP doit être démontrable fin S5.

---

## E0 — Socle et DevOps (S0)

- [x] **E0-1** (M, 1 j) Dépôt git local, `.gitignore`, `.editorconfig`, arborescence `backend/ frontend/ docker/ samples/ docs/`.
- [x] **E0-2** (M, 1,5 j) `compose.yaml` : nginx, php-fpm 8.4, mysql 8.4, phpMyAdmin (profil dev), node (Vite). Volumes `db-data` et `uploads`, ports et variables dans `.env`.
  - `docker compose up` démarre tout ; `/api` répond, `/` affiche le front, phpMyAdmin se connecte.
- [x] **E0-3** (M, 1 j) Squelette Symfony 7.4 + API Platform + Doctrine + EasyAdmin, connexion à MySQL vérifiée (la première migration arrive avec `User`, E1-1).
- [x] **E0-4** (M, 1 j) Squelette Vite + React + TS strict + Tailwind + React Router + TanStack Query + react-i18next (FR/EN), client API typé.
- [x] **E0-5** (M, 0,5 j) Qualité : PHPUnit, PHPStan, PHP-CS-Fixer, Vitest, oxlint, Prettier ; scripts `composer test` / `composer lint` et `npm test` / `npm run lint`.
- [x] **E0-6** (S, 0,5 j) `.gitlab-ci.yml` : lint + tests back et front + build.
- [x] **E0-7** (M, 0,5 j) Compléter la section « Commandes » du `CLAUDE.md`.

## E1 — Comptes et rôles (S1)

- [ ] **E1-1** (M, 1 j) Entité `User`, hiérarchie des rôles, hachage des mots de passe.
- [ ] **E1-2** (M, 1 j) En tant que visiteur, je crée un compte abonné et je me connecte / déconnecte.
  - Session cookie, limitation des tentatives de connexion, messages d'erreur FR/EN.
- [ ] **E1-3** (M, 1 j) En tant qu'admin, je liste les utilisateurs et je change leurs rôles (admin React + EasyAdmin).
- [ ] **E1-4** (M, 1 j) Voters pour articles, jeux de données, thèmes, médias ; tests fonctionnels de la matrice des droits (`architecture.md` §3).
- [ ] **E1-5** (M, 0,5 j) Front : garde de routes par rôle, menu admin adapté au rôle.
- [ ] **E1-6** (C, 0,5 j) Réinitialisation du mot de passe par e-mail (Mailpit en dev).

## E2 — Installation à la WordPress (S1, S6)

- [ ] **E2-1** (M, 1,5 j) En tant que nouvel utilisateur, à la première visite, l'installeur me fait choisir la langue, le nom du site, les dates et lieu de l'événement, et créer le compte admin.
  - Installeur inaccessible dès qu'un admin existe (vérifié côté API).
- [ ] **E2-2** (S, 1 j) Option « installer les données de démonstration » (articles, jeux de données, programme, plan).
- [ ] **E2-3** (M, 1 j, S6) Paquet téléchargeable : `compose.yaml` de prod utilisant les images publiées, `.env.example`, `README` d'installation FR/EN.
- [ ] **E2-4** (M, 0,5 j, S6) Publication des images `web` et `php` sur un registre Docker, versionnées.

## E3 — Médiathèque (S1)

- [ ] **E3-1** (M, 1 j) En tant qu'auteur, je dépose une image (types et taille contrôlés) ; une variante WebP redimensionnée est générée.
- [ ] **E3-2** (M, 1 j) En tant qu'auteur, je parcours la médiathèque (grille, recherche) et je choisis une image existante pour un bloc.
- [ ] **E3-3** (M, 0,5 j) Texte alternatif FR/EN obligatoire avant insertion dans un article.
- [ ] **E3-4** (S, 0,5 j) Suppression impossible si le média est utilisé (liste des articles qui l'utilisent).

## E4 — Jeux de données (S2)

- [ ] **E4-1** (M, 1 j) Entités `Dataset` et `DatasetVariable`, stockage du fichier hors base.
- [ ] **E4-2** (M, 1,5 j) En tant que fournisseur, je dépose un CSV (séparateur `;`) et je vois un aperçu en tableau avec les variables et le type détecté.
  - Gestion UTF-8 / Windows-1252, virgule décimale, lignes vides, erreurs claires si le fichier est mal formé.
- [ ] **E4-3** (M, 1 j) En tant que fournisseur, je choisis pour chaque variable « catégorielle » ou « numérique », je renomme son libellé, puis je valide le jeu.
- [ ] **E4-4** (M, 1 j) `GET /api/datasets/{id}/data` : lecture de la source à la demande, conversion selon les types, cache court.
- [ ] **E4-5** (S, 1 j) En tant que fournisseur, j'ajoute un jeu par URL (CSV distant ou API open data) avec protection SSRF.
- [ ] **E4-6** (M, 0,5 j) `samples/` : 4 à 6 jeux de données événementiels d'exemple (affluence par jour et par scène, ventes de billets, temps des coureurs d'un trail, fréquentation des stands d'un salon, satisfaction…).
- [ ] **E4-7** (S, 0,5 j) Statistiques simples par variable dans l'aperçu (min, max, moyenne ; nombre de modalités).

## E5 — Visualisations (S3)

- [ ] **E5-1** (M, 1 j) `ChartTypeRegistry` + `GET /api/chart-types` + validation serveur d'une visualisation (rôles obligatoires, types de variables compatibles).
- [ ] **E5-2** (M, 2 j) En tant qu'auteur, je crée une visualisation en choisissant le jeu de données, le type, les variables (seules les variables compatibles sont proposées) et les couleurs, avec un aperçu en direct.
- [ ] **E5-3** (M, 2 j) Rendu ECharts des types MVP : bar, line, pie/donut, histogram, scatter (imports à la carte).
- [ ] **E5-4** (M, 1 j) Interactivité : infobulle, légende cliquable, zoom sur axes continus, export PNG.
- [ ] **E5-5** (M, 0,5 j) Accessibilité : titre, description, bascule « voir les données » en tableau.
- [ ] **E5-6** (S, 1,5 j) Types heatmap et treemap.
- [ ] **E5-7** (C, 2 j) Types boxplot, sankey, bar3d (echarts-gl, si plus-value démontrée).
- [ ] **E5-8** (S, 1 j) Filtre interactif côté lecteur (ex. choisir une catégorie, une plage de valeurs) sur un graphique publié.

## E6 — Articles et blocs (S3)

- [ ] **E6-1** (M, 1 j) Entités `Article` et `Block`, statuts brouillon / publié / masqué, slug unique.
- [ ] **E6-2** (M, 2 j) En tant qu'auteur, j'édite un article : titre, résumé, puis j'ajoute, modifie, supprime et réordonne (glisser-déposer et clavier) des blocs titre, texte, image, visualisation.
- [ ] **E6-3** (M, 0,5 j) Un article « dashboard » ne peut être publié qu'avec au moins une visualisation ; un article « classique » n'accepte pas de bloc visualisation.
- [ ] **E6-4** (M, 0,5 j) Un auteur ne voit et ne modifie que ses articles ; un éditeur voit et modifie tous les articles.
- [ ] **E6-5** (M, 0,5 j) Texte en Markdown restreint (gras, italique, liens, listes), assaini à l'affichage.
- [ ] **E6-6** (S, 0,5 j) Prévisualisation de l'article tel qu'il sera publié (avec son thème).
- [ ] **E6-7** (C, 1 j) Sauvegarde automatique du brouillon.

## E7 — Notation (S4)

- [ ] **E7-1** (M, 1 j) En tant qu'abonné, je note chaque bloc d'un article de 0 à 5 étoiles (une note par bloc, modifiable).
  - Composant étoiles accessible au clavier ; visiteur invité à se connecter.
- [ ] **E7-2** (M, 0,5 j) Moyenne et nombre de votes affichés sur chaque bloc.
- [ ] **E7-3** (S, 1 j) Tableau de bord admin : blocs et articles les mieux notés (lui-même en visualisation).

## E8 — Thèmes et design (S4)

- [ ] **E8-1** (M, 1 j) Design de base responsive, mobile first, piloté par variables CSS (`--ev-*`).
- [ ] **E8-2** (M, 1,5 j) En tant que designer, je propose un thème (site, page ou article) via un formulaire avec aperçu en direct.
  - Avertissement si le contraste texte / fond est insuffisant.
- [ ] **E8-3** (M, 1 j) En tant qu'admin, j'approuve, je rejette (avec commentaire) ou j'active une proposition de thème.
- [ ] **E8-4** (M, 0,5 j) Cascade article > page > site appliquée sur le site public.
- [ ] **E8-5** (S, 0,5 j) Palette de graphiques du thème utilisée par défaut par les visualisations.
- [ ] **E8-6** (C, 0,5 j) Thèmes prédéfinis (festival, salon, sport) à dupliquer.

## E9 — Site public et pages (S4)

- [ ] **E9-1** (M, 1 j) Accueil public de l'événement : nom, dates, lieu, derniers articles, accès aux modules.
- [ ] **E9-2** (M, 1 j) Liste des articles (filtre classique / dashboard) et page article.
- [ ] **E9-3** (M, 1 j) En tant qu'éditeur, je crée des pages (vierge, contact) composées de blocs, je gère leur statut et leur place dans le menu.
- [ ] **E9-4** (M, 0,5 j) Header, navigation, footer, sélecteur de langue, page 404.
- [ ] **E9-5** (S, 0,5 j) Métadonnées SEO et Open Graph par article / page.
- [ ] **E9-6** (M, 1 j) Tableau de bord admin : raccourcis selon le rôle, brouillons, jeux de données en attente, thèmes proposés.

## E10 — Modules événementiels (S5)

### Programme

- [ ] **E10-1** (M, 1 j) En tant qu'éditeur, je gère les lieux (scènes, salles, zones) et les créneaux du programme.
- [ ] **E10-2** (M, 1 j) En tant que visiteur, je consulte le programme par jour et par lieu, et je filtre par catégorie (vue liste sur mobile, grille sur desktop).
- [ ] **E10-3** (C, 0,5 j) En tant que visiteur, je mets des créneaux en favoris (stockage local).

### Plan interactif

- [ ] **E10-4** (M, 1,5 j) En tant qu'éditeur, je configure le fond du plan (carte OpenStreetMap ou image du lieu) et je place des points et des zones dessinées.
- [ ] **E10-5** (M, 1 j) En tant que visiteur, je consulte le plan : zoom, légende, clic sur un élément pour voir sa description et son programme lié.
- [ ] **E10-6** (S, 0,5 j) Alternative accessible : liste textuelle des éléments du plan.
- [ ] **E10-7** (C, 1 j) Dimensions réelles des zones (mètres) affichées.

### Billetterie (vitrine, sans paiement)

- [ ] **E10-8** (M, 0,5 j) En tant qu'éditeur, je gère des offres (nom, description, prix, disponibilité, lien externe).
- [ ] **E10-9** (M, 0,5 j) En tant que visiteur, je vois les offres et je suis redirigé vers le lien d'achat externe.

## E11 — Internationalisation (S6)

- [ ] **E11-1** (M, 1 j) Toute l'interface (public, admin, installeur, erreurs API) disponible en FR et en EN.
- [ ] **E11-2** (M, 1 j) Contenus traduisibles : article, page et créneau ont une version par langue ; lien entre les versions.
- [ ] **E11-3** (S, 0,5 j) Formats de dates et de nombres selon la langue (y compris dans les graphiques).

## E12 — Qualité, sécurité, accessibilité, éco-conception (continu, bilan S6)

- [ ] **E12-1** (M, 1 j) Audit sécurité : en-têtes HTTP (CSP, HSTS en prod), CSRF, uploads, SSRF, droits ; corrections.
- [ ] **E12-2** (M, 1 j) Audit accessibilité (axe / Lighthouse, clavier, lecteur d'écran sur les parcours clés) ; corrections.
- [ ] **E12-3** (M, 0,5 j) Audit éco-conception (poids des pages, requêtes, EcoIndex) ; corrections.
- [ ] **E12-4** (M, 1 j) Couverture de tests : services métier (analyse CSV, registre des graphiques, résolution des thèmes) et droits.
- [ ] **E12-5** (S, 1 j) Tests de bout en bout des parcours clés (Playwright, si validé).
- [ ] **E12-6** (S, 0,5 j) Documentation technique : README, schéma de la base, API (OpenAPI).

## E13 — Livrables SAÉ (S6–S7, principalement à ta charge)

Claude peut aider à rédiger, mais ces livrables reflètent ton travail et ta présentation.

- [ ] **E13-1** (M) Dossier projet : contexte, gestion de projet (ce backlog, sprints), architecture, choix techniques, qualité, bilan.
- [ ] **E13-2** (M) Entrepreneuriat : structure juridique, marque et logo, budget prévisionnel (S42 à S4, valorisation au minimum au SMIC + 25 % de charges, 4 € / heure-projet de coûts indirects), modèle économique, arguments de revente.
- [ ] **E13-3** (M) Pitch deck en anglais (500 mots minimum, 6 points du brief).
- [ ] **E13-4** (M) Vidéo de présentation (10 min max).
- [ ] **E13-5** (M) Soutenance : démo avec données de démonstration, plan B hors-ligne.

---

## Questions ouvertes

- Les enseignants fournissent des jeux de données d'exemple : les récupérer et les placer dans `samples/` (E4-6).
- Dates exactes de remise et de soutenance.
- Registre Docker cible pour les images (Docker Hub ou registre du GitLab de l'université).
