#!/bin/sh
# Evently production entrypoint: checks the configuration, waits for the database,
# applies the migrations, then starts PHP-FPM.
set -e

if [ "$1" = "php-fpm" ]; then
  if [ -z "$APP_SECRET" ] || [ "$APP_SECRET" = "change-me" ]; then
    echo "APP_SECRET is missing: set a random value in .env (e.g. openssl rand -hex 16)." >&2
    exit 1
  fi

  echo "Waiting for the database..."
  attempts=0
  until php bin/console dbal:run-sql "SELECT 1" > /dev/null 2>&1; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 60 ]; then
      echo "The database is unreachable: check DB_* in .env." >&2
      exit 1
    fi
    sleep 2
  done

  php bin/console doctrine:migrations:migrate --no-interaction --allow-no-migration
  php bin/console cache:warmup --no-interaction
fi

exec "$@"
