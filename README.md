# Evently

CMS for event websites (festivals, trade fairs, trail runs, seminars…) with data storytelling: data sets imported from CSV files, interactive charts, articles made of blocks, program, interactive map and ticketing. Built for the SAÉ 501.2 (BUT MMI).

**Stack**: Symfony 7.4 LTS + API Platform (PHP 8.4), React 19 + TypeScript, MySQL 8.4, nginx, Docker.

## Run it (development)

```bash
cp .env.example .env
docker compose up -d                        # http://localhost:8080
docker compose --profile tools up -d        # + phpMyAdmin on http://localhost:8081
```

The first visit opens the installer (tick “demo content” to get a complete fictional festival). The demo can also be added to an empty installed site with `docker compose exec php bin/console app:demo`.

## Checks

```bash
docker compose exec php composer test       # PHPUnit
docker compose exec php composer lint       # PHPStan (level 8) + PHP-CS-Fixer
cd frontend && npm test && npm run lint && npm run typecheck && npm run format:check
```

## Production images and distribution

```bash
docker compose -f compose.prod.yaml build   # images evently-web and evently-php
```

`distribution/` is the installation package for event organisers (compose file using the published images, `.env.example`, bilingual guide).

## Documentation

- `CLAUDE.md`: project conventions and commands.
- `docs/architecture.md`: data model, API, roles, chart rules, themes.
- `docs/backlog.md`: user stories and sprints.
- `docs/decisions.md`: why things are the way they are.
- API reference (OpenAPI): `/api/docs` on a running instance.
