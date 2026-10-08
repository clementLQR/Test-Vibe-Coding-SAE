# Journal des décisions

Format : date — décision — raison.

- 2026-10-08 — Le CMS couvre le brief (data storytelling) **et** trois modules événementiels au MVP : programme, plan interactif, billetterie sans paiement. Le camping est reporté. — Thème Evently de l'équipe, en restant réaliste pour un développeur seul.
- 2026-10-08 — La scène 3D WebGL est sur le site vitrine uniquement, pas dans le CMS. — Elle présente l'outil, rôle de la page d'accueil du vitrine.
- 2026-10-08 — Interface FR + EN, code en anglais. — Le brief exige une partie significative en anglais.
- 2026-10-08 — Admin éditorial en React, EasyAdmin réservé au back-office technique. — L'éditeur de blocs et l'aperçu des graphiques sont bien plus simples dans React ; EasyAdmin couvre l'exigence « backoffice Symfony ».
- 2026-10-08 — Graphiques avec Apache ECharts. — Beaucoup de types, interactivité native, configuration JSON facile à stocker, 3D possible (echarts-gl).
- 2026-10-08 — Auth par session Symfony (cookie HttpOnly) plutôt que JWT. — Front et API sur la même origine derrière nginx : plus simple et plus sûr.
- 2026-10-08 — Symfony 7.4 LTS + PHP 8.4 (dans Docker) + MySQL 8.4 LTS. — Versions à jour et maintenues pendant tout le projet. À revérifier au sprint 0.
- 2026-10-08 — Le contenu des CSV n'est jamais stocké en base, seulement la source (fichier ou URL) et la description des variables. — Exigence du brief.
- 2026-10-08 — Matrice de compatibilité des graphiques définie uniquement côté back et exposée par l'API. — Une seule source de vérité pour la validation et les formulaires.
- 2026-10-08 — Suivi du projet en Markdown (`docs/backlog.md`), jamais de GitHub. — Demande de l'utilisateur.
- 2026-10-08 — Le site vitrine est rangé dans `site-vitrine/` avec son propre `CLAUDE.md` ; `lessons.md` reste commun à la racine. — Séparer clairement les deux projets.
- 2026-10-08 — Symfony 7.4 LTS gardé plutôt que 8.1 (stable). — 8.1 n'est plus maintenue à partir de janvier 2027, en pleine fin de projet ; 7.4 l'est jusqu'en 2028.
- 2026-10-08 — oxlint (modèle Vite par défaut) à la place d'ESLint, avec les règles `jsx-a11y`. — Plus rapide, presque sans configuration, vérifie aussi l'accessibilité.
- 2026-10-08 — Commandes via scripts `composer` et `npm` plutôt qu'un Makefile. — `make` n'est pas installé par défaut sous Windows.
- 2026-10-08 — nelmio/cors-bundle conservé (imposé par le pack API Platform) mais inutile : front et API sont sur la même origine.
- 2026-10-08 — `vendor/` et `var/` du back dans des volumes Docker, conteneur PHP de dev en root. — Sur un dossier partagé Windows, une requête prenait environ 16 s (0,3 à 1 s ensuite) et `www-data` ne pouvait pas créer de fichiers.
- 2026-10-08 — Le tableau de bord EasyAdmin (`/admin`, actuellement 404) est reporté à E1-3. — Il doit être protégé par `ROLE_ADMIN`, qui n'existe qu'avec l'entité `User`.
- 2026-10-08 — Tableau de bord EasyAdmin livré (E1-3) : `/admin` réservé à `ROLE_ADMIN`, un visiteur est redirigé vers `/login`. — Remplace la ligne précédente.
- 2026-10-08 — Protection CSRF de l'API par contrôle d'origine (`Sec-Fetch-Site`, puis `Origin`) sur les requêtes qui modifient, plus cookie `SameSite=Lax`. — Pas de jeton à faire circuler dans le front ; protège aussi la connexion et la déconnexion.
- 2026-10-08 — Règle « pas de lock-out admin » (ne pas retirer son propre rôle admin, garder au moins un admin) dans un service unique `RoleChangeGuard`, utilisé par l'API et par EasyAdmin. — Une seule règle, deux interfaces.
- 2026-10-08 — Envoi d'image via un « state processor » API Platform, pas un contrôleur. — API Platform 5 n'accepte plus qu'un contrôleur personnalisé renvoie l'entité.
- 2026-10-08 — Seules des variantes WebP sont conservées (1600 px et miniature 400 px) ; l'original n'est pas gardé. Formats acceptés : JPEG, PNG, WebP (pas de SVG, risque XSS). — Éco-conception et sécurité.
- 2026-10-08 — Les tests écrivent les images dans `var/test-uploads/`, jamais dans la vraie médiathèque. — Éviter qu'un test efface des médias de développement.
- 2026-10-08 — `symfony/http-client` ajouté (composant officiel Symfony) pour charger un CSV par URL, à travers `NoPrivateNetworkHttpClient`. — Protection SSRF éprouvée (adresses internes, redirections) au lieu d'un contrôle maison.
- 2026-10-08 — Sources par URL limitées aux CSV (pas d'API JSON). — Les portails open data exportent en CSV ; une API JSON demanderait un mappage par source, hors de portée du MVP.
- 2026-10-08 — Fichiers CSV stockés dans `var/datasets` (volume Docker, hors `public/`), lecture mise en cache : sans limite pour un fichier déposé (il ne change pas), 10 min pour une URL. — Brief (contenu hors base) et éco-conception.
- 2026-10-08 — Une variable est numérique si toutes ses valeurs non vides sont des nombres (virgule ou point décimal, espaces de milliers). Le fournisseur peut corriger, mais un type numérique sans aucun nombre est refusé à la validation. — Détection simple et explicable.
- 2026-10-08 — Après validation, les types sont figés (les libellés restent modifiables). — Les graphiques s'appuient sur les types ; les changer casserait des visualisations publiées.
- 2026-10-08 — `GET /api/datasets/{id}/data` est public pour un jeu validé. — Les graphiques des articles publiés doivent s'afficher pour les visiteurs anonymes.
- 2026-10-08 — Le nom de colonne du CSV est la référence stable d'une variable, le libellé n'est qu'un affichage. — Renommer un libellé ne casse aucun graphique.
- 2026-10-08 — Jeux d'exemple fictifs générés par script (graine fixe) dans `samples/`, en attendant ceux des enseignants. — Démo et tests manuels sans dépendre d'un envoi.
