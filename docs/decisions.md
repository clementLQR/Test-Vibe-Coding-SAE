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
