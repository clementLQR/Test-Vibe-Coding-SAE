# Evently — PHP-FPM image (Symfony API + back-office)
FROM php:8.4-fpm-alpine AS base

COPY --from=mlocati/php-extension-installer:2 /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_mysql intl zip opcache gd apcu
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/php/php.ini /usr/local/etc/php/conf.d/zz-evently.ini
RUN mkdir -p /var/www/backend/var/datasets /var/www/backend/vendor /var/www/backend/public/uploads /tmp/composer \
    && chown -R www-data:www-data /var/www/backend /tmp/composer
ENV COMPOSER_HOME=/tmp/composer
WORKDIR /var/www/backend

# --- Development: code is bind-mounted, opcache revalidates files.
# Everything (CLI and FPM workers) runs as root so that files created by the
# console (entities, migrations, cache) never conflict on the Windows bind mount.
# APP_ENV comes from backend/.env so that PHPUnit can switch to "test".
FROM base AS dev
RUN echo "opcache.validate_timestamps=1" > /usr/local/etc/php/conf.d/zz-dev.ini \
    && printf '[www]\nuser = root\ngroup = root\n' > /usr/local/etc/php-fpm.d/zz-dev.conf
CMD ["php-fpm", "-R"]

# --- Production: code baked into the image
FROM base AS prod
ENV APP_ENV=prod
COPY backend/composer.json backend/composer.lock backend/symfony.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-progress
COPY backend/ ./
RUN composer dump-autoload --classmap-authoritative --no-dev \
    && composer run-script --no-dev post-install-cmd \
    && mkdir -p var public/uploads && chown -R www-data:www-data var public/uploads
