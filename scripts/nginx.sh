#!/usr/bin/env bash
# Host nginx edge: install the site, Basic Auth for the admin, TLS via certbot.
# Never edits TLS directives by hand — certbot owns those so renewals keep working.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
SRC="$NGINX_SRC_DIR/${PROXY_DOMAIN}.conf"
DEST="/etc/nginx/sites-available/${NGINX_SITE}"
LINK="/etc/nginx/sites-enabled/${NGINX_SITE}"

do_install() {
  [ -f "$SRC" ] || { err "$SRC not found."; return 1; }
  command -v nginx >/dev/null || { err "nginx is not installed — run Setup → h."; return 1; }

  # The conf hardcodes the proxy port; keep it in step with .env.production.
  if ! grep -q "127.0.0.1:${PROXY_HTTP_PORT}" "$SRC"; then
    warn "$SRC does not proxy to 127.0.0.1:${PROXY_HTTP_PORT} (PROXY_HTTP_PORT)."
    warn "Fix the port in the conf or in .env.production before continuing."
  fi

  # Refuse to squat a port another site already proxies to.
  local clash
  clash="$(grep -rl "127.0.0.1:${PROXY_HTTP_PORT}" /etc/nginx/sites-enabled/ 2>/dev/null | grep -v "${NGINX_SITE}$" || true)"
  [ -n "$clash" ] && warn "Another enabled site already proxies to :${PROXY_HTTP_PORT} → $clash"

  step "Installing $DEST"
  if [ -f "$DEST" ]; then
    $SUDO cp -a "$DEST" "${DEST}.bak.$(date +%Y%m%d-%H%M%S)"
    log "Backed up the existing site conf."
  fi
  $SUDO cp "$SRC" "$DEST"
  [ -L "$LINK" ] || $SUDO ln -s "$DEST" "$LINK"

  if [ ! -f "$HTPASSWD_FILE" ]; then
    warn "$HTPASSWD_FILE does not exist — the admin vhost will 500 until it does."
    echo "  Create it now? (you'll be asked for a password)"
    printf "  [y/N]: "; yn=""; read -r yn < /dev/tty 2>/dev/null || true
    case "$yn" in y|Y) $SUDO htpasswd -c "$HTPASSWD_FILE" royalnest ;; *) warn "Skipped." ;; esac
  else
    log "Basic Auth file present: $HTPASSWD_FILE"
  fi

  step "nginx -t"
  $SUDO nginx -t || { err "nginx config test FAILED — not reloading."; return 1; }
  $SUDO systemctl reload nginx && log "nginx reloaded."
}

do_certs() {
  command -v certbot >/dev/null || { err "certbot is not installed — run Setup → h."; return 1; }
  step "Requesting certificates for $PROXY_DOMAIN, www, admin"
  echo "  Requirements for the HTTP-01 challenge to succeed:"
  echo "    • DNS A records for all three names already point at this server"
  echo "    • port 80 is open (ufw allow 'Nginx Full')"
  echo "    • no CDN proxy sits in front of this box"
  printf "  Continue? [y/N]: "; yn=""; read -r yn < /dev/tty 2>/dev/null || true
  case "$yn" in y|Y) ;; *) log "Cancelled."; return ;; esac
  $SUDO certbot --nginx \
    -d "$PROXY_DOMAIN" -d "www.$PROXY_DOMAIN" -d "admin.$PROXY_DOMAIN" \
    && log "Certificates installed; certbot rewrote the vhosts for :443." \
    || err "certbot failed — the site stays on plain HTTP."
  $SUDO systemctl status certbot.timer --no-pager 2>/dev/null | head -3
}

do_status() {
  echo "  site conf : $DEST $( [ -f "$DEST" ] && echo '(present)' || echo '(MISSING)' )"
  echo "  enabled   : $LINK $( [ -L "$LINK" ] && echo '(linked)' || echo '(NOT linked)' )"
  echo "  htpasswd  : $HTPASSWD_FILE $( [ -f "$HTPASSWD_FILE" ] && echo '(present)' || echo '(MISSING)' )"
  echo "  proxy port: 127.0.0.1:${PROXY_HTTP_PORT}"
  $SUDO nginx -t 2>&1 | sed 's/^/  /'
  echo "  certificates:"
  $SUDO certbot certificates 2>/dev/null | grep -E 'Certificate Name|Domains|Expiry' | sed 's/^/    /' || echo "    (certbot not available)"
}

do_renew() {
  command -v certbot >/dev/null || { err "certbot is not installed."; return 1; }
  SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
  step "Renewing certificates"
  # --deploy-hook reloads nginx only when something actually renewed.
  $SUDO certbot renew --deploy-hook "systemctl reload nginx" \
    && log "Renewal check complete." || err "Renewal failed."
  $SUDO certbot certificates 2>/dev/null | grep -E 'Certificate Name|Expiry' | sed 's/^/  /'
}

case "${1:-install}" in
  install) do_install ;;
  certs)   do_certs ;;
  renew)   do_renew ;;
  status)  do_status ;;
  *) err "usage: nginx.sh [install|certs|renew|status]" ;;
esac
