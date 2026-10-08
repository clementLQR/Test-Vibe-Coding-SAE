# Evently — installation

[Français](#français) · [English](#english)

## Français

Evently crée le site de votre événement (festival, salon, trail, séminaire…) et raconte ses données avec des graphiques interactifs.

### Prérequis

- Un serveur ou un ordinateur avec [Docker](https://docs.docker.com/get-docker/) et Docker Compose (inclus dans Docker Desktop).
- 2 Go de mémoire vive et 2 Go d’espace disque.

### Installation

1. Décompressez ce dossier sur la machine qui hébergera le site.
2. Copiez `.env.example` en `.env`, puis modifiez au minimum :
   - `APP_SECRET` : une valeur aléatoire, par exemple le résultat de `openssl rand -hex 16` ;
   - `DB_PASSWORD` et `DB_ROOT_PASSWORD` : des mots de passe solides ;
   - `SITE_URL` : l’adresse publique du site.
3. Dans ce dossier, lancez :
   ```bash
   docker compose up -d
   ```
   Le premier démarrage télécharge les images et prépare la base de données (une à deux minutes).
4. Ouvrez l’adresse du site : l’**installeur** vous demande le nom de l’événement, ses dates, son lieu, et crée le compte administrateur. Cochez « Installer les données de démonstration » pour découvrir Evently avec un festival fictif.

### Mettre en ligne (HTTPS)

Evently écoute en HTTP sur le port `HTTP_PORT`. En production, placez-le derrière un reverse proxy qui gère le certificat HTTPS (Caddy, Traefik, nginx, ou le proxy de votre hébergeur), et ajoutez-y l’en-tête `Strict-Transport-Security`.

### Au quotidien

| Action | Commande |
| --- | --- |
| Arrêter | `docker compose down` |
| Voir les journaux | `docker compose logs -f php` |
| Mettre à jour | changer `EVENTLY_VERSION` dans `.env`, puis `docker compose pull && docker compose up -d` (les migrations s’appliquent au démarrage) |
| Sauvegarder la base | `docker compose exec db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" evently' > sauvegarde.sql` |

Les données sont dans des volumes Docker (`db-data`, `uploads`, `datasets`). **N’utilisez jamais `docker compose down -v`** : cette option efface les volumes, donc la base, les images et les jeux de données.

---

## English

Evently builds the website of your event (festival, trade fair, trail run, seminar…) and tells the story of its data with interactive charts.

### Requirements

- A server or computer with [Docker](https://docs.docker.com/get-docker/) and Docker Compose (included in Docker Desktop).
- 2 GB of RAM and 2 GB of disk space.

### Installation

1. Unzip this folder on the machine that will host the website.
2. Copy `.env.example` to `.env`, then change at least:
   - `APP_SECRET`: a random value, for instance the output of `openssl rand -hex 16`;
   - `DB_PASSWORD` and `DB_ROOT_PASSWORD`: strong passwords;
   - `SITE_URL`: the public address of the website.
3. In this folder, run:
   ```bash
   docker compose up -d
   ```
   The first start downloads the images and prepares the database (one or two minutes).
4. Open the website address: the **installer** asks for the event name, dates and place, and creates the administrator account. Tick “Install the demo content” to discover Evently with a fictional festival.

### Going live (HTTPS)

Evently listens over HTTP on port `HTTP_PORT`. In production, put it behind a reverse proxy that handles the HTTPS certificate (Caddy, Traefik, nginx, or your host’s proxy), and add the `Strict-Transport-Security` header there.

### Day to day

| Action | Command |
| --- | --- |
| Stop | `docker compose down` |
| Read the logs | `docker compose logs -f php` |
| Update | change `EVENTLY_VERSION` in `.env`, then `docker compose pull && docker compose up -d` (migrations run at start-up) |
| Back up the database | `docker compose exec db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" evently' > backup.sql` |

Data lives in Docker volumes (`db-data`, `uploads`, `datasets`). **Never run `docker compose down -v`**: that option deletes the volumes, hence the database, images and data sets.
