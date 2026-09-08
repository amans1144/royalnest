#!/usr/bin/env bash
# Shared library for the RoyalNest deployment scripts. SOURCED, never executed
# directly. All human entry is through ../deploy.sh (numbered menu).
#
# Provides: env loading, the COMPOSE() wrapper, colored logging, health waits
# and the interactive env configurator.

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$REPO_DIR/docker-compose.prod.yml"
ENV_FILE="$REPO_DIR/.env.production"
ENV_EXAMPLE="$REPO_DIR/.env.prod.example"
NGINX_SRC_DIR="$REPO_DIR/deploy/nginx"
PROXY_DIR="$REPO_DIR/deploy/proxy"
PROXY_CERTS="$PROXY_DIR/certs"

# ── Safe env loader: parse KEY=VALUE WITHOUT executing the value as shell, so a
#    value containing spaces or $( ) can never be evaluated.
load_env_file() {
  [ -f "$1" ] || return 0
  local line key val
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in ''|'#'*) continue ;; esac
    [ "${line#*=}" != "$line" ] || continue
    key="${line%%=*}"; val="${line#*=}"
    key="$(printf '%s' "$key" | tr -d '[:space:]')"; [ -z "$key" ] && continue
    case "$val" in \"*\") val="${val#\"}"; val="${val%\"}" ;; \'*\') val="${val#\'}"; val="${val%\'}" ;; esac
    export "$key=$val"
  done < "$1"
}

load_env_file "$ENV_FILE"

PROXY_DOMAIN="${PROXY_DOMAIN:-royalnestrealty.in}"
PROXY_HTTP_PORT="${PROXY_HTTP_PORT:-8090}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/royalnest}"
RETAIN_LOCAL_MAX="${RETAIN_LOCAL_MAX:-14}"
NGINX_SITE="${NGINX_SITE:-$PROXY_DOMAIN}"
HTPASSWD_FILE="${HTPASSWD_FILE:-/etc/nginx/.htpasswd-royalnest}"

CYAN='\033[0;36m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $*"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)] WARN:${NC} $*"; }
err()  { echo -e "${RED}[$(date +%H:%M:%S)] ERROR:${NC} $*" >&2; }
step() { echo -e "\n${CYAN}▸ $*${NC}"; }

# --env-file makes ${VAR} interpolation in the compose file resolve from
# .env.production; the services' own `env_file:` handles runtime env.
COMPOSE() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

require_env_file() {
  [ -f "$ENV_FILE" ] && return 0
  err ".env.production not found."
  err "Create it first:  cp .env.prod.example .env.production  (or deploy.sh → 1 → b)"
  return 1
}

# Fail loudly on the settings that silently produce a broken site.
validate_env() {
  local bad=0
  [ -n "${PUBLISH_TOKEN:-}" ] || { err "PUBLISH_TOKEN is empty — publishing will be disabled (503)."; bad=1; }
  if [ "${PUBLISH_TOKEN:-}" != "${NEXT_PUBLIC_PUBLISH_TOKEN:-}" ]; then
    err "PUBLISH_TOKEN != NEXT_PUBLIC_PUBLISH_TOKEN — every publish from the admin will 401."
    bad=1
  fi
  [ -n "${DB_PASSWORD:-}" ]    || { err "DB_PASSWORD is empty."; bad=1; }
  [ -n "${REDIS_PASSWORD:-}" ] || { err "REDIS_PASSWORD is empty."; bad=1; }
  case "${NEXT_PUBLIC_SITE_URL:-}" in
    https://*) ;;
    *) warn "NEXT_PUBLIC_SITE_URL is not an https:// URL — canonical tags, sitemap and robots.txt will be wrong. It is baked in at BUILD time." ;;
  esac
  [ "$bad" -eq 0 ]
}

preflight() {
  docker info >/dev/null 2>&1 || { err "Docker daemon not reachable (need root or the docker group)."; return 1; }
  require_env_file || return 1
}

# Curl the full public chain: host loopback → caddy → app. Host header selects
# which app Caddy routes to, exactly as nginx will pass it in production.
probe() {  # probe <host-header> <path>
  curl -sS -o /dev/null -w '%{http_code}' --max-time 10 \
    -H "Host: $1" "http://127.0.0.1:${PROXY_HTTP_PORT}$2" 2>/dev/null
}

wait_http_ok() {  # wait_http_ok <host-header> <path> <tries>
  local host="$1" path="$2" tries="${3:-30}" code
  for _ in $(seq 1 "$tries"); do
    code="$(probe "$host" "$path")"
    case "$code" in 200|301|302|307|308) log "  $host$path → $code"; return 0 ;; esac
    sleep 2
  done
  err "  $host$path did not become healthy (last: ${code:-no response})"
  return 1
}

confirm() {
  local phrase="$1"
  printf "  Type '%s' to confirm: " "$phrase"
  reply=""; read -r reply < /dev/tty 2>/dev/null || true
  [ "$reply" = "$phrase" ]
}

# ── Interactive env configurator ─────────────────────────────────────────────
# Reads each KEY=default from the template, shows the CURRENT value, Enter keeps
# it. Values are written UNQUOTED to stay compatible with docker compose
# env_file, which does not shell-parse quotes.
setup_env_file() {
  local example_file="$1" env_file="$2" label="$3"
  [ -f "$example_file" ] || { err "$example_file not found"; return 1; }
  [ -f "$env_file" ] || { cp "$example_file" "$env_file"; chmod 600 "$env_file"; log "Created $env_file from the template."; }

  step "Configuring $label"
  echo "  Target: $env_file   (Enter = keep current)"
  echo ""
  local key cur new
  while IFS= read -r line; do
    case "$line" in ''|'#'*) continue ;; esac
    [ "${line#*=}" != "$line" ] || continue
    key="${line%%=*}"; key="$(printf '%s' "$key" | tr -d '[:space:]')"
    [ -z "$key" ] && continue
    cur="$(grep -E "^${key}=" "$env_file" 2>/dev/null | head -1)"; cur="${cur#*=}"
    printf "  %-32s [%s]: " "$key" "${cur:-<empty>}"
    new=""; read -r new < /dev/tty 2>/dev/null || true
    [ -z "$new" ] && continue
    if grep -qE "^${key}=" "$env_file"; then
      # Use a non-/ delimiter: values are URLs and contain slashes.
      python3 - "$env_file" "$key" "$new" <<'PY'
import sys
path, key, val = sys.argv[1], sys.argv[2], sys.argv[3]
lines = open(path).read().splitlines(True)
for i, l in enumerate(lines):
    if l.split('=', 1)[0].strip() == key:
        lines[i] = f"{key}={val}\n"
        break
open(path, 'w').write(''.join(lines))
PY
    else
      printf '%s=%s\n' "$key" "$new" >> "$env_file"
    fi
  done < "$example_file"
  chmod 600 "$env_file"
  log "Saved $env_file"
}

# Generate the secrets that have no external dependency.
# Never overwrites a value that is already set — rotating a live secret has to
# be a deliberate act, not a side effect of re-running setup.
generate_secrets() {
  require_env_file || return 1
  command -v openssl >/dev/null || { err "openssl not found."; return 1; }
  step "Generating secrets into $ENV_FILE"
  ENV_FILE="$ENV_FILE" python3 - <<'PY'
import os, re, secrets, string

path = os.environ['ENV_FILE']
lines = open(path).read().splitlines(True)

def current(key):
    for l in lines:
        if l.split('=', 1)[0].strip() == key:
            v = l.split('=', 1)[1].strip()
            return '' if v in ('', 'CHANGE_ME') else v
    return ''

def setval(key, val):
    for i, l in enumerate(lines):
        if l.split('=', 1)[0].strip() == key:
            lines[i] = f"{key}={val}\n"
            return
    lines.append(f"{key}={val}\n")

alnum = string.ascii_letters + string.digits
gen   = lambda n: ''.join(secrets.choice(alnum) for _ in range(n))

# Resolve each secret to its FINAL value first: keep what is already there,
# otherwise generate. The connection strings are then built from those finals,
# so they can never drift out of step with the passwords.
token = current('PUBLISH_TOKEN') or secrets.token_hex(32)
finals = {
    'PUBLISH_TOKEN':             token,
    'NEXT_PUBLIC_PUBLISH_TOKEN': token,   # must equal PUBLISH_TOKEN exactly
    'JWT_ACCESS_SECRET':  current('JWT_ACCESS_SECRET')  or gen(48),
    'JWT_REFRESH_SECRET': current('JWT_REFRESH_SECRET') or gen(48),
    'DB_PASSWORD':        current('DB_PASSWORD')        or gen(32),
    'REDIS_PASSWORD':     current('REDIS_PASSWORD')     or gen(32),
}

generated = [k for k in finals if not current(k)]
for k, v in finals.items():
    setval(k, v)

user = current('DB_USERNAME') or 'spb'
name = current('DB_NAME') or 'spbuilders'
dbpw, rdpw = finals['DB_PASSWORD'], finals['REDIS_PASSWORD']
setval('DATABASE_URL', f'postgresql://{user}:{dbpw}@postgres:5432/{name}?schema=public')
setval('DIRECT_URL',   f'postgresql://{user}:{dbpw}@postgres:5432/{name}?schema=public')
setval('REDIS_URL',    f'redis://:{rdpw}@redis:6379')

open(path, 'w').write(''.join(lines))
print('  generated: ' + (', '.join(sorted(generated)) if generated else '(nothing was empty)'))
print('  kept existing: ' + (', '.join(sorted(set(finals) - set(generated))) or '(none)'))
print('  rebuilt: DATABASE_URL, DIRECT_URL, REDIS_URL from the final passwords')
PY
  local rc=$?
  chmod 600 "$ENV_FILE"
  [ "$rc" -eq 0 ] || { err "Secret generation failed."; return 1; }
  log "PUBLISH_TOKEN and NEXT_PUBLIC_PUBLISH_TOKEN are identical."
  warn "NEXT_PUBLIC_PUBLISH_TOKEN is baked in at build time — rebuild (2) for it to take effect."
}
