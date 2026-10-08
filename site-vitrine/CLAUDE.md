# Evently Website

Site vitrine du CMS **Evently**. Evently est un CMS (à la WordPress : on télécharge un dossier, on l'installe, on le configure) qui permet de créer des sites d'événements à partir de modules prêts à l'emploi (billetterie, programmation, plan interactif, camping…) et de raconter ses données avec des visualisations (data storytelling). Il s'adresse à tout type d'événement : festivals, salons professionnels, marathons et trails, séminaires…

Projet réalisé dans le cadre de la SAÉ 501.2 (BUT MMI).

## Périmètre

Ce dépôt ne contient **que le site vitrine** : il présente Evently, explique comment l'utiliser et permet de le télécharger.

Hors périmètre, ne pas développer ici : le CMS lui-même (front React, back Symfony, API, back-office), la base de données, Docker, les rôles utilisateurs, l'import CSV, les visualisations de données.

## Stack

- HTML / JavaScript / Three.js / TailwindCSS. Pas de framework, pas de back-end.
- Aucune dépendance sans validation préalable.

## Structure

- `index.html` : accueil. Texte de présentation, scène 3D (voir plus bas), bouton de téléchargement et liens vers les autres pages.
- `documentation.html` : fonctionnement du CMS et guide d'installation.
- `telechargement.html` : téléchargement du CMS (dossier d'installation) et prérequis.
- `actualites.html` : nouveautés et mises à jour du CMS.
- `a-propos.html` : équipe, objectifs du projet.
- `contact.html` : formulaire ou coordonnées de contact.
- `mentions-legales.html` : mentions légales et politique de confidentialité.
- `assets/` : ressources, images, icônes, modèles 3D.

## Scène 3D de l'accueil

Le brief impose une scène 3D en WebGL sur la page d'accueil pour présenter l'outil.

- Direction artistique : low poly, monochrome.
- Animation pilotée par le scroll, en trois plans enchaînés :
  1. **Festival**, vu du ciel. Au scroll, la caméra descend et passe derrière la scène.
  2. **Salon professionnel**, vu à hauteur d'homme, en longeant les stands. Au bout du salon, la caméra se tourne vers une fenêtre bleu ciel, puis vers le sol.
  3. **Trail**, vu du ciel. La caméra descend vers la ligne de départ et un texte apparaît (« Prêt pour le départ ? »).
- Le texte de la page doit rester lisible et utilisable si WebGL n'est pas disponible.

## Conventions

- Contenu du site en français.
- Le header, la nav et le footer sont dupliqués dans chaque page : toute modification de l'un d'eux doit être reportée sur **toutes les pages**.
- Responsive obligatoire (mobile d'abord).
- Accessibilité de base : balises sémantiques, `alt` sur les images, contrastes suffisants, navigation au clavier.
- Éco-conception (exigée par le brief) : images compressées, modèles 3D légers, pas de ressource inutile.

## Méthode de travail

- Lis `../lessons.md` avant de commencer.
- Si la demande est ambiguë, pose une question avant de coder.
- Si quelque chose ne se passe pas comme prévu : arrête-toi, explique le problème et propose un nouveau plan avant de continuer.
- Ne modifie que ce qui est demandé. Signale les améliorations possibles sans les appliquer.

## Principes

- **Simplicité d'abord** : la solution la plus simple, avec le moins de code modifié possible.
- **Corriger la cause, pas le symptôme** : pas de rustine temporaire. Si la vraie correction dépasse le périmètre demandé, dis-le.

## Définition de « terminé »

- La page s'affiche sans erreur dans la console.
- Le rendu est correct en mobile et en desktop.
- Tous les liens internes fonctionnent.

## Apprentissage continu

Après chaque correction de ma part, ajoute une règle dans `../lessons.md` (crée-le s'il n'existe pas) :

- une ligne par règle, formulée comme une consigne (« Toujours… » / « Ne jamais… ») ;
- pas de doublon : reformule une règle existante plutôt que d'en ajouter une proche.
