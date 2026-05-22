#!/usr/bin/env bash
# One-time setup: Herd nginx proxy for karriqi.test → Next.js on port 3010.
# Uses .test (Herd DNS) — not .dev, which browsers force to HTTPS (HSTS preload).
set -euo pipefail

DEV_HOST="karriqi.test"
DEV_PORT="${KARRIQI_DEV_PORT:-3010}"
HERD_HOME="${HERD_HOME:-$HOME/Library/Application Support/Herd}"
NGINX_SITE="${HERD_HOME}/config/valet/Nginx/${DEV_HOST}"
OLD_DEV_SITE="${HERD_HOME}/config/valet/Nginx/karriqi.dev"
PROXY_TARGET="http://127.0.0.1:${DEV_PORT}"
STATIC_PREFIX="41c270e4-5535-4daa-b23e-c269744c2f45"
VALET_SERVER="/Applications/Herd.app/Contents/Resources/valet/server.php"

mkdir -p "$(dirname "$NGINX_SITE")"

if [[ -f "$OLD_DEV_SITE" ]]; then
  rm -f "$OLD_DEV_SITE"
  echo "Removed old Herd proxy: karriqi.dev (.dev requires HTTPS in browsers)"
fi

cat >"$NGINX_SITE" <<EOF
# valet stub: proxy.valet.conf (karriqi Next.js dev)
server {
    listen 127.0.0.1:80;
    server_name ${DEV_HOST} www.${DEV_HOST} *.${DEV_HOST};
    root /;
    charset utf-8;
    client_max_body_size 1024M;

    location /${STATIC_PREFIX}/ {
        internal;
        alias /;
        try_files \$uri \$uri/;
    }

    access_log off;
    error_log "${HERD_HOME}/Log/${DEV_HOST}-error.log";

    error_page 404 "${VALET_SERVER}";

    location / {
        proxy_pass ${PROXY_TARGET};
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_set_header   X-Client-Verify   SUCCESS;
        proxy_set_header   X-NginX-Proxy true;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_http_version 1.1;
        proxy_read_timeout 1800;
        proxy_connect_timeout 1800;
        chunked_transfer_encoding on;
        proxy_redirect off;
        proxy_buffering off;
    }

    location ~ /\.ht {
        deny all;
    }
}

server {
    listen 127.0.0.1:60;
    server_name ${DEV_HOST} www.${DEV_HOST} *.${DEV_HOST};
    root /;
    charset utf-8;
    client_max_body_size 1024M;

    add_header X-Robots-Tag 'noindex, nofollow, nosnippet, noarchive';

    location /${STATIC_PREFIX}/ {
        internal;
        alias /;
        try_files \$uri \$uri/;
    }

    access_log off;
    error_log "${HERD_HOME}/Log/${DEV_HOST}-error.log";

    error_page 404 "${VALET_SERVER}";

    location / {
        proxy_pass ${PROXY_TARGET};
        proxy_set_header   Host              \$host;
        proxy_set_header   X-Real-IP         \$remote_addr;
        proxy_set_header   X-Forwarded-For   \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

echo "Wrote Herd proxy: ${NGINX_SITE} → ${PROXY_TARGET}"
echo ""
echo "Restart Herd (menu bar → Restart Services) so nginx picks up the proxy."
echo ""
echo "Then from the primary checkout:"
echo "  pnpm dev"
echo ""
echo "Open: http://${DEV_HOST}  (use http:// — not https://)"
