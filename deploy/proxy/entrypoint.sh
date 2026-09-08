#!/bin/sh
# ============================================================================
#  In-repo proxy (edge) — renders a Caddyfile at start from what is configured.
#
#  RoyalNest publishes two apps on two hostnames, so unlike a single-app proxy
#  this always routes on the Host header:
#
#      royalnestrealty.in       ─► website:3000
#      www.royalnestrealty.in   ─► website:3000
#      admin.royalnestrealty.in ─► admin:3005
#
#  Three modes:
#    • PROXY_INTERNAL=true              → HTTP :80 only. An external edge (the
#      VPS host nginx) terminates TLS and reverse-proxies to this on a
#      localhost port. This is the deployed default — see deploy/nginx/.
#    • PROXY_DOMAIN, no cert supplied   → HTTPS with an auto-provisioned
#      Let's Encrypt certificate. Needs 80/443 reachable from the internet and
#      DNS already pointing here. This is the normal edge-mode path.
#    • PROXY_DOMAIN + certs/origin.{crt,key} → HTTPS using a certificate you
#      supply yourself, for the case where something else issues it.
# ============================================================================
set -e
CONF=/etc/caddy/Caddyfile
DOMAIN="${PROXY_DOMAIN:-}"
EMAIL="${ACME_EMAIL:-}"
INTERNAL="${PROXY_INTERNAL:-false}"

if [ -z "$DOMAIN" ]; then
  echo "[proxy] FATAL: PROXY_DOMAIN is unset. Both hostnames are matched explicitly," >&2
  echo "[proxy]        so the proxy cannot tell the website from the admin without it." >&2
  echo "[proxy]        Set PROXY_DOMAIN in .env.production (e.g. royalnestrealty.in)." >&2
  exit 1
fi

# Shared response headers. Kept multi-line: Caddy rejects "{" with content on
# the same line.
SEC_HEADERS='
    header {
        X-Content-Type-Options nosniff
        X-Frame-Options DENY
        Referrer-Policy strict-origin-when-cross-origin
        -Server
    }
'

# Global options, always written first.
#   • trusted_proxies private_ranges → in internal mode this sits behind the VPS
#     host nginx; trusting that private-range upstream preserves its
#     X-Forwarded-Proto/For so the apps see the real https scheme and client IP.
#     Harmless in edge mode — real clients are never private-range.
{
  echo '{'
  [ -n "$EMAIL" ] && printf '    email %s\n' "$EMAIL"
  printf '    servers {\n        trusted_proxies static private_ranges\n    }\n'
  echo '}'
} > "$CONF"

if [ "$INTERNAL" = "true" ]; then
  # One HTTP listener; the host nginx already decided this traffic is ours.
  {
    printf ':80 {\n'
    printf '    encode gzip zstd\n'
    printf '    @admin host admin.%s\n' "$DOMAIN"
    printf '    handle @admin {\n        reverse_proxy admin:3005\n    }\n'
    printf '    handle {\n        reverse_proxy website:3000\n    }\n'
    printf '%s' "$SEC_HEADERS"
    printf '}\n'
  } >> "$CONF"
  echo "[proxy] HTTP :80 (internal) — host-routed for $DOMAIN; expecting nginx in front"
else
  if [ -f /certs/origin.crt ] && [ -f /certs/origin.key ]; then
    TLS_LINE='    tls /certs/origin.crt /certs/origin.key'
    MODE="supplied certificate"
  else
    TLS_LINE=''
    MODE="automatic Let's Encrypt"
  fi
  HSTS='    header Strict-Transport-Security "max-age=31536000; includeSubDomains"'

  {
    printf '%s, www.%s {\n' "$DOMAIN" "$DOMAIN"
    [ -n "$TLS_LINE" ] && printf '%s\n' "$TLS_LINE"
    printf '%s\n' "$HSTS"
    printf '    encode gzip zstd\n'
    printf '    reverse_proxy website:3000\n'
    printf '%s' "$SEC_HEADERS"
    printf '}\n\n'

    printf 'admin.%s {\n' "$DOMAIN"
    [ -n "$TLS_LINE" ] && printf '%s\n' "$TLS_LINE"
    printf '%s\n' "$HSTS"
    printf '    encode gzip zstd\n'
    printf '    reverse_proxy admin:3005\n'
    printf '%s' "$SEC_HEADERS"
    printf '}\n'
  } >> "$CONF"
  echo "[proxy] HTTPS for $DOMAIN, www.$DOMAIN, admin.$DOMAIN — $MODE"
fi

exec caddy run --config "$CONF" --adapter caddyfile
