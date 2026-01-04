#!/usr/bin/env bash
set -euo pipefail

# Usage: sudo ./setup_certbot.sh your.domain.com email@example.com
DOMAIN=${1:-}
EMAIL=${2:-}
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: sudo $0 your.domain.com email@example.com"
  exit 1
fi

echo "Stopping any service that might use port 80/443..."
systemctl stop nginx || true
docker compose -f /srv/myapp/docker-compose.yml down || true

echo "Requesting certificate for $DOMAIN"
apt-get update
apt-get install -y certbot

certbot certonly --standalone -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"

CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
if [ ! -d "$CERT_DIR" ]; then
  echo "Certificate dir not found: $CERT_DIR"
  exit 1
fi

mkdir -p /srv/myapp/nginx/ssl
cp "$CERT_DIR/fullchain.pem" /srv/myapp/nginx/ssl/fullchain.pem
cp "$CERT_DIR/privkey.pem" /srv/myapp/nginx/ssl/privkey.pem
chown -R deploy:deploy /srv/myapp/nginx/ssl || true

echo "Restarting docker compose (if present)"
docker compose -f /srv/myapp/docker-compose.yml up -d --remove-orphans || true

echo "Certificate installed and copied to /srv/myapp/nginx/ssl"
echo "You should configure a cron job to renew certs:"
echo "0 3 * * * root certbot renew --post-hook 'docker compose -f /srv/myapp/docker-compose.yml restart nginx'"
