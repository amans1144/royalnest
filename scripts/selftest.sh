#!/usr/bin/env bash
# Verify the running deployment end to end. Exits non-zero on the first hard
# failure, so it is usable from CI or a cron watchdog.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

FAIL=0
check() {  # check <description> <expected-codes> <host> <path>
  local desc="$1" want="$2" host="$3" path="$4" code
  code="$(probe "$host" "$path")"
  if echo "$want" | grep -qw "${code:-000}"; then
    printf "  ${GREEN}PASS${NC}  %-46s → %s\n" "$desc" "$code"
  else
    printf "  ${RED}FAIL${NC}  %-46s → %s (wanted %s)\n" "$desc" "${code:-no response}" "$want"
    FAIL=1
  fi
}

step "Container status"
COMPOSE ps

step "Routing through the proxy (Host header decides the app)"
check "website root"          "200 301 302" "$PROXY_DOMAIN"        "/"
check "website sitemap"       "200"         "$PROXY_DOMAIN"        "/sitemap.xml"
check "website robots"        "200"         "$PROXY_DOMAIN"        "/robots.txt"
check "admin root"            "200 301 302 307" "admin.$PROXY_DOMAIN" "/"

step "Publish endpoints are closed to the internet"
code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 -X POST \
  -H "Host: $PROXY_DOMAIN" -H 'Content-Type: application/json' \
  -d '{"items":[]}' "http://127.0.0.1:${PROXY_HTTP_PORT}/api/marketing" 2>/dev/null)"
code="${code:-000}"
case "$code" in
  401) printf "  ${GREEN}PASS${NC}  %-46s → 401 (token required)\n" "POST /api/marketing unauthenticated" ;;
  503) printf "  ${YELLOW}WARN${NC}  %-46s → 503 (PUBLISH_TOKEN unset — publishing disabled)\n" "POST /api/marketing unauthenticated" ;;
  200) printf "  ${RED}FAIL${NC}  %-46s → 200 — ANYONE CAN PUBLISH\n" "POST /api/marketing unauthenticated"; FAIL=1 ;;
  *)   printf "  ${RED}FAIL${NC}  %-46s → %s\n" "POST /api/marketing unauthenticated" "$code"; FAIL=1 ;;
esac

step "Nothing internal is exposed on a host port"
for p in 3000 3005 4000 5432 6379; do
  if (echo >"/dev/tcp/0.0.0.0/$p") 2>/dev/null; then
    printf "  ${RED}FAIL${NC}  port %-5s is listening on the host — it must be internal only\n" "$p"; FAIL=1
  else
    printf "  ${GREEN}PASS${NC}  port %-5s not exposed\n" "$p"
  fi
done

step "Config sanity"
validate_env && printf "  ${GREEN}PASS${NC}  .env.production is coherent\n" || FAIL=1

echo ""
[ "$FAIL" -eq 0 ] && log "Self-test PASSED" || { err "Self-test FAILED"; exit 1; }
