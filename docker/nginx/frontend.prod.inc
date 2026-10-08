# Production: static React build, SPA fallback
location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location / {
    try_files $uri /index.html;
}
