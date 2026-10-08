# Development: proxy everything else to the Vite dev server (with HMR websocket)
location / {
    proxy_pass http://node:5173;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
