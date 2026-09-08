#!/usr/bin/env bash
# ============================================================================
#  RoyalNest — Deployment Manager
#
#  The single human entry point on the VPS. Every infra action is a numbered
#  menu choice; the scripts/*.sh helpers are internal and are never run
#  directly. Brings up the production topology in Docker:
#
#      host nginx :443 ─► proxy (Caddy) ─┬─► website:3000 ─► api:4000
#                         127.0.0.1:8090 └─► admin:3005        │
#                                                       postgres / redis
#
#  Only the proxy binds a host port, and only on loopback. The host nginx
#  terminates TLS and is the sole public listener.
#
#  Usage:  bash deploy.sh
# ============================================================================
set -uo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPTS="$SCRIPT_DIR/scripts"
source "$SCRIPTS/_common.sh"

# ── 2) Deploy ───────────────────────────────────────────────────────────────
do_up() {
  preflight || return
  validate_env || { err "Fix .env.production first (Setup → b)."; return; }

  step "Pre-deploy backup (rollback point)"
  bash "$SCRIPTS/backup.sh" pre-deploy

  step "Building + starting the stack"
  warn "On a 1 vCPU box the two Next.js builds take several minutes each."
  COMPOSE up -d --build || { err "Stack failed to start."; return; }
  COMPOSE ps

  step "Health"
  wait_http_ok "$PROXY_DOMAIN" "/" 45 || warn "Website not answering yet — check 7) logs."
  wait_http_ok "admin.$PROXY_DOMAIN" "/" 20 || warn "Admin not answering yet."
  log "Deployed. Public entry is the host nginx — see 4) Nginx edge."
}

# ── 3) Rebuild a single app ─────────────────────────────────────────────────
do_rebuild() {
  preflight || return
  echo ""
  echo "  a) website    b) admin    c) api    d) proxy (config only)    0) Back"
  printf "  Choose: "; c=""; read -r c < /dev/tty 2>/dev/null || true
  case "$c" in
    a) COMPOSE up -d --build website && wait_http_ok "$PROXY_DOMAIN" "/" 45 ;;
    b) COMPOSE up -d --build admin   && wait_http_ok "admin.$PROXY_DOMAIN" "/" 30 ;;
    c) COMPOSE up -d --build api ;;
    d) COMPOSE up -d --force-recreate proxy && wait_http_ok "$PROXY_DOMAIN" "/" 20 ;;
    *) ;;
  esac
}

# ── 4) HTTPS / nginx edge ───────────────────────────────────────────────────
do_nginx() {
  while true; do
    echo ""
    echo -e "${CYAN}  HTTPS / nginx edge${NC}   (host nginx owns :80/:443 and TLS)"
    if [ "${PROXY_INTERNAL:-true}" = "true" ]; then
      echo "   mode: nginx + certbot (Let's Encrypt)"
    else
      echo "   mode: Caddy direct (Caddy owns :80/:443)"
    fi
    echo ""
    echo "   a) Install / update the site conf   — copy, link, nginx -t, reload"
    echo "   b) Enable HTTPS (Let's Encrypt)     — certbot for apex, www and admin"
    echo "   c) Renew certificates now           — certbot renew"
    echo "   d) Status                           — conf, link, htpasswd, cert expiry"
    echo "   e) Set the admin Basic Auth password"
    echo "   f) Switch HTTPS mode                — nginx+certbot <-> Caddy direct"
    echo "   0) Back"
    printf "  Choose: "; c=""; read -r c < /dev/tty 2>/dev/null || true
    case "$c" in
      a) bash "$SCRIPTS/nginx.sh" install ;;
      b) bash "$SCRIPTS/nginx.sh" certs ;;
      c) bash "$SCRIPTS/nginx.sh" renew ;;
      d) bash "$SCRIPTS/nginx.sh" status ;;
      e) SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
         $SUDO htpasswd "${HTPASSWD_FILE}" royalnest || $SUDO htpasswd -c "${HTPASSWD_FILE}" royalnest ;;
      f) do_https_mode ;;
      0) return ;;
      *) err "Invalid option" ;;
    esac
  done
}

# Two ways to get a real Let's Encrypt certificate. They differ only in which
# process owns port 443.
do_https_mode() {
  echo ""
  echo -e "${CYAN}  HTTPS mode${NC}"
  echo "   a) nginx + certbot   (recommended — and what this server already does)"
  echo "      Host nginx owns :80/:443 and terminates TLS; Caddy stays on"
  echo "      127.0.0.1:${PROXY_HTTP_PORT}. Other sites can share the box."
  echo "      certbot renews automatically via its systemd timer."
  echo "   b) Caddy direct      (only if nothing else serves :80/:443)"
  echo "      Caddy binds 0.0.0.0:80 and :443 and obtains its own certificate."
  echo "      The nginx site must be disabled first or the ports collide."
  echo "   0) Cancel"
  printf "  Choose: "; m=""; read -r m < /dev/tty 2>/dev/null || true
  case "$m" in
    a) sed -i 's#^PROXY_INTERNAL=.*#PROXY_INTERNAL=true#; s#^PROXY_BIND=.*#PROXY_BIND=127.0.0.1#' "$ENV_FILE"
       sed -i 's#^PROXY_HTTP_PORT=.*#PROXY_HTTP_PORT=8090#; s#^PROXY_HTTPS_PORT=.*#PROXY_HTTPS_PORT=8453#' "$ENV_FILE"
       log "Set to nginx + certbot."
       log "Apply with: 3) Rebuild -> d) proxy, then 4) a) and 4) b)." ;;
    b) warn "Caddy will bind :80 and :443 on every interface."
       if ss -ltn 2>/dev/null | grep -qE ':(80|443) '; then
         err "Something already listens on :80/:443:"
         ss -ltnp 2>/dev/null | grep -E ':(80|443) ' | sed 's/^/    /'
         err "Disable it first, e.g.:"
         err "  sudo rm /etc/nginx/sites-enabled/${NGINX_SITE} && sudo systemctl reload nginx"
         return
       fi
       if [ -z "${ACME_EMAIL:-}" ]; then
         printf "  ACME_EMAIL (Let's Encrypt registration address): "
         e=""; read -r e < /dev/tty 2>/dev/null || true
         if [ -z "$e" ]; then err "An email is required for Let's Encrypt."; return; fi
         sed -i "s#^ACME_EMAIL=.*#ACME_EMAIL=$e#" "$ENV_FILE"
       fi
       sed -i 's#^PROXY_INTERNAL=.*#PROXY_INTERNAL=false#; s#^PROXY_BIND=.*#PROXY_BIND=0.0.0.0#' "$ENV_FILE"
       sed -i 's#^PROXY_HTTP_PORT=.*#PROXY_HTTP_PORT=80#; s#^PROXY_HTTPS_PORT=.*#PROXY_HTTPS_PORT=443#' "$ENV_FILE"
       log "Set to Caddy direct. Apply with: 3) Rebuild -> d) proxy."
       warn "DNS for $PROXY_DOMAIN, www and admin must already point at this box,"
       warn "or the certificate order fails and the site stays on plain HTTP." ;;
    *) log "Cancelled." ;;
  esac
}

# ── 1) Setup / Configure ────────────────────────────────────────────────────
do_configure() {
  echo ""
  echo -e "  ${YELLOW}Values that must change before a real deploy:${NC}"
  echo "    PUBLISH_TOKEN + NEXT_PUBLIC_PUBLISH_TOKEN  — must be IDENTICAL, else every publish 401s"
  echo "    NEXT_PUBLIC_SITE_URL                       — baked in at BUILD time (canonical/sitemap/robots)"
  echo "    NEXT_PUBLIC_ADMIN_PASSWORD                 — the committed default is not a password"
  echo "    DB_PASSWORD · REDIS_PASSWORD · JWT_*       — (c) generates all of these"
  while true; do
    echo ""
    echo -e "${CYAN}  Setup / Configure${NC}"
    echo "   a) First-time setup           — deps → env → secrets → nginx → deploy"
    echo "   b) Configure .env.production  — walk every value"
    echo "   c) Generate secrets           — publish token, JWT, DB/Redis passwords"
    echo "   d) Install system deps        — docker, nginx, certbot, apache2-utils"
    echo "   e) Configure the proxy domain (PROXY_DOMAIN / ACME_EMAIL)"
    echo "   f) Show effective config"
    echo "   0) Back"
    printf "  Choose: "; c=""; read -r c < /dev/tty 2>/dev/null || true
    case "$c" in
      a) do_first_run ;;
      b) setup_env_file "$ENV_EXAMPLE" "$ENV_FILE" ".env.production" ;;
      c) generate_secrets ;;
      d) bash "$SCRIPTS/install-deps.sh" ;;
      e) printf "  PROXY_DOMAIN [%s]: " "$PROXY_DOMAIN"; d=""; read -r d < /dev/tty 2>/dev/null || true
         [ -n "$d" ] && sed -i "s#^PROXY_DOMAIN=.*#PROXY_DOMAIN=$d#" "$ENV_FILE" && log "Set. Re-run deploy.sh to pick it up."
         printf "  ACME_EMAIL [%s]: " "${ACME_EMAIL:-}"; e=""; read -r e < /dev/tty 2>/dev/null || true
         [ -n "$e" ] && sed -i "s#^ACME_EMAIL=.*#ACME_EMAIL=$e#" "$ENV_FILE" && log "Set." ;;
      f) do_showconfig ;;
      0) return ;;
      *) err "Invalid option" ;;
    esac
  done
}

# Guided zero → live first run. Idempotent: safe to re-run.
do_first_run() {
  step "First-time setup"
  echo "  This will, in order:"
  echo "    1. install system dependencies (docker, nginx, certbot)"
  echo "    2. create .env.production and generate its secrets"
  echo "    3. build and start the stack"
  echo "    4. install the nginx site and issue Let's Encrypt certificates"
  printf "  Proceed? [y/N]: "; yn=""; read -r yn < /dev/tty 2>/dev/null || true
  case "$yn" in y|Y) ;; *) log "Cancelled."; return ;; esac

  bash "$SCRIPTS/install-deps.sh" || { err "Stopped at: dependencies"; return; }
  [ -f "$ENV_FILE" ] || { cp "$ENV_EXAMPLE" "$ENV_FILE"; chmod 600 "$ENV_FILE"; log "Created .env.production"; }
  generate_secrets
  warn "Now fill in the values secrets cannot generate (domain, admin password, API keys)."
  printf "  Open the configurator? [Y/n]: "; yn=""; read -r yn < /dev/tty 2>/dev/null || true
  case "$yn" in n|N) ;; *) setup_env_file "$ENV_EXAMPLE" "$ENV_FILE" ".env.production" ;; esac
  source "$SCRIPTS/_common.sh"   # re-read what was just written

  do_up || { err "Stopped at: deploy"; return; }
  bash "$SCRIPTS/nginx.sh" install || { err "Stopped at: nginx"; return; }
  bash "$SCRIPTS/nginx.sh" certs
  bash "$SCRIPTS/selftest.sh"
  log "Setup complete. https://$PROXY_DOMAIN  ·  https://admin.$PROXY_DOMAIN"
}

# ── 5) Quick restart ────────────────────────────────────────────────────────
do_restart() {
  preflight || return
  echo ""
  echo "  a) website   b) admin   c) api   d) proxy   e) all (no rebuild)   0) Back"
  printf "  Choose: "; c=""; read -r c < /dev/tty 2>/dev/null || true
  case "$c" in
    a) COMPOSE restart website && wait_http_ok "$PROXY_DOMAIN" "/" 30 ;;
    b) COMPOSE restart admin   && wait_http_ok "admin.$PROXY_DOMAIN" "/" 20 ;;
    c) COMPOSE restart api ;;
    d) COMPOSE restart proxy ;;
    e) COMPOSE up -d --no-build ;;
    *) ;;
  esac
}

# ── 6) Backup / Restore ─────────────────────────────────────────────────────
do_backuprestore() {
  preflight || return
  while true; do
    echo ""
    echo -e "${CYAN}  Backup / Restore${NC}   ($BACKUP_DIR)"
    echo "   a) Back up now            — published content + database"
    echo "   b) Restore                — pick a snapshot (takes a pre-restore backup first)"
    echo "   c) List backups"
    echo "   d) Install the daily backup cron"
    echo "   0) Back"
    printf "  Choose: "; c=""; read -r c < /dev/tty 2>/dev/null || true
    case "$c" in
      a) bash "$SCRIPTS/backup.sh" manual ;;
      b) bash "$SCRIPTS/restore.sh" ;;
      c) ls -1t "$BACKUP_DIR"/*.gz 2>/dev/null | sed 's#.*/#    #' || echo "    (none)" ;;
      d) SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
         $SUDO tee /etc/cron.daily/royalnest-backup >/dev/null <<CRON
#!/bin/sh
cd "$SCRIPT_DIR" && /bin/bash scripts/backup.sh cron >> /var/log/royalnest-backup.log 2>&1
CRON
         $SUDO chmod +x /etc/cron.daily/royalnest-backup && log "Installed /etc/cron.daily/royalnest-backup" ;;
      0) return ;;
      *) err "Invalid option" ;;
    esac
  done
}

# ── 7) Database / admin users ───────────────────────────────────────────────
do_database() { preflight || return; bash "$SCRIPTS/seed-admin.sh"; }

# ── 8) Status / logs ────────────────────────────────────────────────────────
do_status() {
  preflight || return
  while true; do
    echo ""
    echo "  a) Stack status (ps)      b) proxy logs    c) website logs"
    echo "  d) admin logs             e) api logs      f) resource usage"
    echo "  0) Back"
    printf "  Choose: "; s=""; read -r s < /dev/tty 2>/dev/null || true
    case "$s" in
      a) COMPOSE ps ;;
      b) COMPOSE logs --tail=60 proxy ;;
      c) COMPOSE logs --tail=60 website ;;
      d) COMPOSE logs --tail=60 admin ;;
      e) COMPOSE logs --tail=60 api ;;
      f) docker stats --no-stream ;;
      0) return ;;
      *) err "Invalid option" ;;
    esac
  done
}

do_showconfig() {
  echo ""
  echo "  repo            $SCRIPT_DIR"
  echo "  env file        $ENV_FILE $( [ -f "$ENV_FILE" ] && echo '(present)' || echo '(MISSING)' )"
  echo "  domain          $PROXY_DOMAIN  (www.$PROXY_DOMAIN, admin.$PROXY_DOMAIN)"
  echo "  proxy bound to  ${PROXY_BIND:-127.0.0.1}:${PROXY_HTTP_PORT}"
  echo "  proxy mode      $( [ "${PROXY_INTERNAL:-true}" = "true" ] && echo 'internal (host nginx terminates TLS)' || echo 'edge (Caddy owns 80/443)' )"
  echo "  site url        ${NEXT_PUBLIC_SITE_URL:-<unset>}   (build-time)"
  echo "  publish token   $( [ -n "${PUBLISH_TOKEN:-}" ] && echo 'set' || echo 'UNSET — publishing disabled' )"
  echo "  tokens match    $( [ "${PUBLISH_TOKEN:-}" = "${NEXT_PUBLIC_PUBLISH_TOKEN:-x}" ] && echo 'yes' || echo 'NO — publishes will 401' )"
  echo "  backups         $BACKUP_DIR (keep $RETAIN_LOCAL_MAX)"
}

do_down() {
  preflight || return
  warn "This stops the stack — the site goes down."
  echo "  a) Stop, keep data    b) Stop and WIPE volumes (content + database)    0) Cancel"
  printf "  Choose: "; d=""; read -r d < /dev/tty 2>/dev/null || true
  case "$d" in
    a) COMPOSE down; log "Stopped (data kept)." ;;
    b) warn "This destroys everything published on the site."
       confirm "yes wipe" && { COMPOSE down -v; log "Stopped, volumes wiped."; } || log "Cancelled." ;;
    *) log "Cancelled." ;;
  esac
}

main() {
  while true; do
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  RoyalNest — Deployment Manager${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════${NC}"
    echo -e "  ${CYAN}── deploy ──${NC}"
    echo "   1) Setup / Configure   — deps · env · secrets · domain"
    echo "   2) Deploy              — backup → build → up → health"
    echo "   3) Rebuild one app     — website · admin · api · proxy"
    echo "   4) HTTPS / nginx edge  — site conf · Let's Encrypt · Basic Auth"
    echo "   5) Quick restart"
    echo "   6) Backup / Restore"
    echo "   7) Database / admins   — migrations · create admin user"
    echo "   8) Status / logs"
    echo "   9) Down                — stop the stack"
    echo -e "  ${CYAN}── verify ──${NC}"
    echo "  10) Self-test           — routing, publish auth, port exposure"
    echo "  11) Show effective config"
    echo "   0) Exit"
    echo -e "${CYAN}───────────────────────────────────────────────${NC}"
    printf "  Choose [0-11]: "; choice=""; if ! read -r choice < /dev/tty 2>/dev/null; then echo; log "No terminal attached — run this interactively."; exit 0; fi
    case "$choice" in
      1) do_configure ;;
      2) do_up ;;
      3) do_rebuild ;;
      4) do_nginx ;;
      5) do_restart ;;
      6) do_backuprestore ;;
      7) do_database ;;
      8) do_status ;;
      9) do_down ;;
      10) preflight && bash "$SCRIPTS/selftest.sh" ;;
      11) do_showconfig ;;
      0) log "Bye!"; exit 0 ;;
      *) err "Invalid option" ;;
    esac
  done
}

main "$@"
