# Production: static React build, SPA fallback.
# Strict CSP: no inline or external script; images may come from OpenStreetMap tiles (map module).
set $evently_csp "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://tile.openstreetmap.org; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

location /assets/ {
    include /etc/nginx/conf.d/security-headers.inc;
    add_header Content-Security-Policy $evently_csp always;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location / {
    include /etc/nginx/conf.d/security-headers.inc;
    add_header Content-Security-Policy $evently_csp always;
    # index.html must always be revalidated so new releases are picked up
    add_header Cache-Control "no-cache";
    try_files $uri /index.html;
}
