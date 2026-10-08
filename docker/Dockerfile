# Evently — all images, built from the repository root.
#   php-dev : development (code bind-mounted, see compose.yaml)
#   php     : production PHP-FPM (Symfony API + back-office)
#   web     : production nginx (React build + Symfony public files)

# ---------------------------------------------------------------- PHP base
FROM php:8.4-fpm-alpine AS php-base

COPY --from=mlocati/php-extension-installer:2 /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_mysql intl zip opcache gd apcu exif
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/php/php.ini /usr/local/etc/php/conf.d/zz-evently.ini

RUN mkdir -p /var/www/backend/var/datasets /var/www/backend/vendor /var/www/backend/public/uploads /tmp/composer \
    && chown -R www-data:www-data /var/www/backend /tmp/composer
ENV COMPOSER_HOME=/tmp/composer
WORKDIR /var/www/backend

# ---------------------------------------------------------------- Development
# Everything (CLI and FPM workers) runs as root so that files created by the
# console (entities, migrations, cache) never conflict on the Windows bind mount.
# APP_ENV comes from backend/.env so that PHPUnit can switch to "test".
FROM php-base AS php-dev
RUN echo "opcache.validate_timestamps=1" > /usr/local/etc/php/conf.d/zz-dev.ini \
    && printf '[www]\nuser = root\ngroup = root\n' > /usr/local/etc/php-fpm.d/zz-dev.conf
CMD ["php-fpm", "-R"]

# ---------------------------------------------------------------- Production backend build
FROM php-base AS backend-build
ENV APP_ENV=prod APP_DEBUG=0
COPY backend/composer.json backend/composer.lock backend/symfony.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-progress --no-interaction
COPY backend/ ./
RUN rm -rf var/* public/uploads/* public/bundles \
    && composer dump-autoload --classmap-authoritative --no-dev \
    && APP_SECRET=build-only php bin/console assets:install public --no-interaction \
    && mkdir -p var/datasets public/uploads \
    && chown -R www-data:www-data var public/uploads

# ---------------------------------------------------------------- Production PHP
FROM php-base AS php
ENV APP_ENV=prod APP_DEBUG=0
RUN echo "opcache.validate_timestamps=0" > /usr/local/etc/php/conf.d/zz-prod.ini
COPY --from=backend-build --chown=www-data:www-data /var/www/backend /var/www/backend
COPY docker/php/entrypoint.sh /usr/local/bin/evently-entrypoint
RUN chmod +x /usr/local/bin/evently-entrypoint
USER www-data
ENTRYPOINT ["evently-entrypoint"]
CMD ["php-fpm"]

# ---------------------------------------------------------------- Front-end build
FROM node:24-alpine AS frontend-build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------------------- Production web server
FROM nginx:stable-alpine AS web
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/nginx/frontend.prod.inc /etc/nginx/conf.d/frontend.inc
COPY docker/nginx/security-headers.inc /etc/nginx/conf.d/security-headers.inc
# Symfony's public files: nginx checks they exist and serves EasyAdmin assets
COPY --from=backend-build /var/www/backend/public /var/www/backend/public
COPY --from=frontend-build /app/dist /var/www/frontend
