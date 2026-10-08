# Evently — web image: nginx + React build (production)
FROM node:24-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:stable-alpine AS prod
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/nginx/frontend.prod.inc /etc/nginx/conf.d/frontend.inc
COPY --from=build /app/dist /var/www/frontend
