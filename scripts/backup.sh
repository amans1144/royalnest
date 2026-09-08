#!/usr/bin/env bash
# Snapshot the two things a redeploy cannot rebuild:
#   1. the published content volume (gallery/marketing/settings/layout JSON)
#   2. the postgres database
# Written to $BACKUP_DIR with a sha256 alongside each artifact.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"
STAMP="$(date +%Y%m%d_%H%M%S)"
TAG="${1:-manual}"

$SUDO mkdir -p "$BACKUP_DIR" && $SUDO chown "$(id -u):$(id -g)" "$BACKUP_DIR" 2>/dev/null || true

step "Backing up published content"
CONTENT_VOL="$(COMPOSE config --format json 2>/dev/null | python3 -c "
import json,sys
try:
    c=json.load(sys.stdin); print(list(c.get('volumes',{}).keys()) and 'royalnest_content' or '')
except Exception: print('')
")"
CONTENT_VOL="${CONTENT_VOL:-royalnest_content}"
CONTENT_OUT="$BACKUP_DIR/content_${STAMP}_${TAG}.tar.gz"
if docker volume inspect "$CONTENT_VOL" >/dev/null 2>&1; then
  # A throwaway container is the only way to read a named volume's contents.
  docker run --rm -v "${CONTENT_VOL}:/data:ro" -v "$BACKUP_DIR:/out" alpine:3 \
    tar czf "/out/$(basename "$CONTENT_OUT")" -C /data . \
    && log "content → $CONTENT_OUT ($(du -h "$CONTENT_OUT" | cut -f1))" \
    || err "content backup FAILED"
  sha256sum "$CONTENT_OUT" > "${CONTENT_OUT}.sha256" 2>/dev/null || true
else
  warn "Volume $CONTENT_VOL does not exist yet — nothing published. Skipping."
fi

step "Backing up postgres"
DB_OUT="$BACKUP_DIR/db_${STAMP}_${TAG}.sql.gz"
if COMPOSE ps --status running postgres 2>/dev/null | grep -q postgres; then
  if COMPOSE exec -T -e PGPASSWORD="${DB_PASSWORD:-}" postgres \
       pg_dump -U "${DB_USERNAME:-spb}" -d "${DB_NAME:-spbuilders}" 2>/dev/null | gzip > "$DB_OUT"; then
    # A dump of a failed connection is a valid empty gzip — check it has content.
    if [ "$(gzip -dc "$DB_OUT" | head -c 1 | wc -c)" -eq 0 ]; then
      err "pg_dump produced an empty file — check DB_PASSWORD. Removing."
      rm -f "$DB_OUT"
    else
      sha256sum "$DB_OUT" > "${DB_OUT}.sha256"
      log "database → $DB_OUT ($(du -h "$DB_OUT" | cut -f1))"
    fi
  else
    err "pg_dump FAILED"; rm -f "$DB_OUT"
  fi
else
  warn "postgres is not running — skipping the database dump."
fi

step "Pruning to the newest $RETAIN_LOCAL_MAX of each kind"
for prefix in content db; do
  ls -1t "$BACKUP_DIR/${prefix}_"*.tar.gz "$BACKUP_DIR/${prefix}_"*.sql.gz 2>/dev/null \
    | tail -n +"$((RETAIN_LOCAL_MAX + 1))" \
    | while read -r old; do rm -f "$old" "${old}.sha256"; echo "  pruned $(basename "$old")"; done
done
log "Backup complete → $BACKUP_DIR"
warn "A backup on the same disk is not a backup — copy these off the box."
