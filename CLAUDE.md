# Evently — CMS

**Evently** est un CMS (à la WordPress : on télécharge un dossier, on l'installe, on le configure) pour créer le site d'un événement (festival, salon professionnel, trail, séminaire…) à partir de modules prêts à l'emploi, et pour **raconter ses données** (data storytelling) avec des visualisations interactives.

Projet réalisé dans le cadre de la SAÉ 501.2 (BUT MMI). Développeur : une seule personne (avec Claude).

## Documents de référence

| Fichier | Contenu |
| --- | --- |
| `Brief_SAÉ501.2_….docx.md` | Brief officiel des enseignants. **Fait foi** en cas de doute. |
| `SAE 5012.md` | Notes de l'équipe : thème, fonctionnalités imaginées, scène 3D. |
| `docs/architecture.md` | Stack, modèle de données, API, droits par rôle, règles des graphiques, thèmes. |
| `docs/backlog.md` | Epics, user stories, priorités, sprints. **À tenir à jour.** |
| `docs/decisions.md` | Journal des décisions (pourquoi tel choix). |
| `site-vitrine/CLAUDE.md` | Site vitrine d'Evently (HTML statique + scène 3D), dans `site-vitrine/`. Projet séparé : ne pas le mélanger avec le CMS, et ignorer ce `CLAUDE.md`-ci quand on travaille sur le vitrine. |
| `lessons.md` | Règles apprises des corrections. **À lire avant de commencer.** |

## Périmètre

Dans ce projet : le CMS lui-même.

- **API + back-office technique** en Symfony.
- **Front React** : site public de l'événement **et** interface d'administration (articles, blocs, jeux de données, visualisations, thèmes, médias, modules, utilisateurs).
- **Base de données** relationnelle, **Docker**, installation guidée, distribution téléchargeable.

Hors périmètre : le site vitrine (dossier `site-vitrine/`, voir `site-vitrine/CLAUDE.md`), et donc la scène 3D WebGL (elle est sur le vitrine, pas dans le CMS). Pas de paiement réel : la billetterie affiche des offres et renvoie vers un lien externe.

## Stack

- **Back** : PHP 8.4, Symfony 7.4 LTS, API Platform, Doctrine ORM, MySQL 8.4 LTS. EasyAdmin pour le back-office technique (super-admin).
- **Front** : React 19, TypeScript (strict), Vite, React Router, TanStack Query, TailwindCSS, react-i18next, Apache ECharts, Leaflet.
- **Services** : Docker Compose (nginx, php-fpm, mysql, phpMyAdmin). Images publiées sur un registre Docker.
- **Qualité** : PHPUnit, PHPStan (niveau 8), PHP-CS-Fixer ; Vitest + Testing Library, oxlint (avec règles d'accessibilité `jsx-a11y`), Prettier. CI GitLab (`.gitlab-ci.yml`).
- Toute dépendance **hors de cette liste** doit être validée avant d'être ajoutée.

## Structure du dépôt

```
backend/      Symfony (API, entités, sécurité, EasyAdmin)
frontend/     React + TS (site public + admin)
docker/       Dockerfile (dev et prod) et conf nginx / php
distribution/ Paquet d’installation pour les organisateurs
site-vitrine/ Site vitrine (projet séparé)
backend/resources/demo/  Jeux de données CSV d’exemple (séparateur « ; »), aussi utilisés par les données de démonstration
docs/         architecture, backlog, décisions
compose.yaml  environnement de développement
```

Dans `frontend/src/` : `features/<domaine>/` (articles, datasets, charts, themes, media, program, map, tickets, auth…), `components/` (UI partagée), `lib/` (client API, i18n), `routes/`.

## Commandes

Depuis la racine (copier `.env.example` en `.env` la première fois). Sous Git Bash, préfixer les commandes `docker compose exec` par `MSYS_NO_PATHCONV=1`.

| Action | Commande |
| --- | --- |
| Démarrer (site sur http://localhost:8080) | `docker compose up -d` |
| Avec phpMyAdmin (http://localhost:8081) | `docker compose --profile tools up -d` |
| Console Symfony | `docker compose exec php bin/console …` |
| Migrations | `docker compose exec php bin/console doctrine:migrations:migrate -n` |
| Back : tests / analyse + style | `docker compose exec php composer test` / `composer lint` (`composer fix` corrige le style) |
| Front : tests, lint, types, format | dans `frontend/` : `npm test`, `npm run lint`, `npm run typecheck`, `npm run format` |
| Front : build de prod | dans `frontend/` : `npm run build` |
| Données de démonstration (site installé et vide) | `docker compose exec php bin/console app:demo` |
| Images de production | `docker compose -f compose.prod.yaml build` (cibles `php` et `web` de `docker/Dockerfile`) |
| Essai de la prod sans toucher au dev | `docker compose -p evently-smoke -f compose.prod.yaml --env-file <fichier> up -d`, puis `down -v` sur ce projet uniquement |

Le serveur Vite tourne dans le conteneur `node` derrière nginx : on passe toujours par http://localhost:8080 (les routes `/api` et `/admin` vont à Symfony, le reste à React). L'admin React est sous `/admin-app`, EasyAdmin sous `/admin`.

Pièges de l'environnement (Windows + Docker Desktop) :

- `backend/vendor` et `backend/var` sont dans des **volumes Docker**, pas dans le dossier partagé (sinon chaque requête prend environ 15 s). Toujours lancer `composer` **dans le conteneur** ; le `vendor/` visible sous Windows n'est qu'une copie pour l'éditeur et peut être en retard.
- Après avoir recréé les volumes : `docker compose exec php composer install`.
- Les modifications de fichiers dans le dossier partagé n'envoient aucun événement à Docker : Vite surveille donc les fichiers par interrogation (`VITE_USE_POLLING=true` dans `compose.yaml`). Si le navigateur affiche une ancienne version, vérifier ce réglage avant de chercher ailleurs.
- En dev, le conteneur PHP tourne en root (`php-fpm -R`) pour éviter les conflits de droits sur le dossier partagé. L'image de prod tourne en `www-data`.

## Règles métier essentielles

Le détail est dans `docs/architecture.md`. À ne jamais perdre de vue :

- **Rôles** : visiteur (anonyme), abonné (note les blocs de 0 à 5), auteur (crée, modifie **seulement ses** articles), éditeur (modifie tous les articles), designer (**propose** des thèmes, validés par un admin), fournisseur de données (importe et valide des CSV), administrateur (tout). Les droits se vérifient **côté serveur** (voters Symfony) ; le front ne fait que masquer.
- **Article** = titre + résumé + blocs ordonnés. Bloc = titre (niveau 2 à 4), texte, image (médiathèque) ou visualisation. Article **classique** (sans visualisation) ou **dashboard** (au moins une visualisation pour être publié).
- **Jeux de données** : le contenu des CSV n'est **jamais stocké en base**, seulement le lien (fichier déposé ou URL) et la description des variables. Chaque variable est **catégorielle** ou **numérique**, confirmée par le fournisseur après un aperçu en tableau. Seuls les jeux validés sont utilisables.
- **Visualisations** : le type de graphique dépend du type des variables (ex. camembert = 1 catégorielle + 1 numérique ; nuage de points = 2 numériques). La matrice de compatibilité est définie **une seule fois** côté back (`ChartTypeRegistry`) et exposée par l'API ; le front construit ses formulaires à partir d'elle.
- **Thèmes** : surcouche de variables CSS (couleurs, tailles, police…) stockée en base, appliquée en cascade site → page → article. Le design de base reste responsive et mobile first sans thème.
- **Médias** : toute image ajoutée à un article va dans la médiathèque et devient réutilisable.

## Conventions

- **Code, noms et commentaires en anglais.** Contenu affiché **en français et en anglais** : aucun texte en dur dans les composants, tout passe par les clés i18n (`frontend/src/locales/{fr,en}`), les deux langues sont remplies en même temps.
- API REST sous `/api`, JSON. Les erreurs de validation renvoient des messages exploitables par le front.
- Schéma de base modifié **uniquement par migrations Doctrine** ; ne jamais modifier une migration déjà exécutée.
- Pas de `any` en TypeScript. Les types de l'API sont regroupés dans `frontend/src/lib/api/`.
- Mobile first, responsive obligatoire.
- **Accessibilité** : balises sémantiques, `alt` sur les images, contrastes AA, navigation au clavier, focus visible. Chaque graphique a un titre, une description et une alternative en tableau de données.
- **Sécurité** : mots de passe hachés, CSRF sur la session, validation de tous les uploads (type, taille), protection contre les requêtes vers des adresses internes lors du chargement d'un CSV par URL, contenu texte assaini avant affichage.
- **Éco-conception** : imports ECharts à la carte (`echarts/core`), découpage du code par route, images redimensionnées et converties en WebP à l'upload, pas de ressource inutile.

## Méthode de travail

- Lis `lessons.md` et la section du backlog concernée avant de commencer.
- Travaille **une user story à la fois** ; à la fin, coche-la dans `docs/backlog.md` et note toute décision dans `docs/decisions.md`.
- Si la demande est ambiguë ou contredit le brief, pose une question avant de coder.
- Si quelque chose ne se passe pas comme prévu : arrête-toi, explique le problème et propose un nouveau plan avant de continuer.
- Ne modifie que ce qui est demandé. Signale les améliorations possibles sans les appliquer.
- **Ne jamais utiliser GitHub** (ni `gh`, ni dépôt, ni issues GitHub). Git s'utilise en local ; le dépôt distant est le GitLab de l'université, poussé par l'utilisateur.

## Principes

- **Simplicité d'abord** : la solution la plus simple, avec le moins de code modifié possible.
- **Corriger la cause, pas le symptôme** : pas de rustine temporaire. Si la vraie correction dépasse le périmètre demandé, dis-le.
- Logique métier dans des services Symfony testables, pas dans les contrôleurs ; composants React petits, logique dans des hooks.

## Définition de « terminé »

- Les tests et le lint passent (back et front), le build front réussit.
- Les migrations s'appliquent sur une base vide.
- Aucune erreur dans la console navigateur ni dans les logs Symfony.
- Rendu correct en mobile et en desktop, utilisable au clavier.
- Textes présents en FR et en EN.
- Droits vérifiés pour chaque rôle concerné (test fonctionnel côté API).
- `docs/backlog.md` à jour.

## Apprentissage continu

Après chaque correction de ma part, ajoute une règle dans `lessons.md` :

- une ligne par règle, formulée comme une consigne (« Toujours… » / « Ne jamais… ») ;
- pas de doublon : reformule une règle existante plutôt que d'en ajouter une proche.
