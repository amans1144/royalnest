#!/usr/bin/env bash
# Restore published content and/or the database from $BACKUP_DIR.
# Always takes a pre-restore snapshot first, so a wrong pick is recoverable.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

CONTENT_VOL="royalnest_content"

pick() {  # pick <glob> ; echoes the chosen path
  local files=() i=1
  while IFS= read -r f; do files+=("$f"); done < <(ls -1t $1 2>/dev/null)
  [ "${#files[@]}" -eq 0 ] && { err "No backups matching $1"; return 1; }
  for f in "${files[@]}"; do printf "   %2d) %s  (%s)\n" "$i" "$(basename "$f")" "$(du -h "$f" | cut -f1)" >&2; i=$((i+1)); done
  printf "  Choose [1-%d, 0=cancel]: " "${#files[@]}" >&2
  local n; n=""; read -r n < /dev/tty 2>/dev/null || true
  [ "$n" = "0" ] || [ -z "$n" ] && return 1
  echo "${files[$((n-1))]}"
}

restore_content() {
  local f; f="$(pick "$BACKUP_DIR/content_*.tar.gz")" || return
  [ -f "${f}.sha256" ] && { sha256sum -c "${f}.sha256" >/dev/null 2>&1 && log "checksum OK" || { err "CHECKSUM MISMATCH — refusing."; return 1; }; }
  warn "This REPLACES everything currently published on the live site."
  confirm "yes restore" || { log "Cancelled."; return; }
  bash "$(dirname "${BASH_SOURCE[0]}")/backup.sh" pre-restore
  step "Restoring $(basename "$f")"
  docker run --rm -v "${CONTENT_VOL}:/data" -v "$BACKUP_DIR:/in:ro" alpine:3 \
    sh -c "rm -rf /data/* && tar xzf /in/$(basename "$f") -C /data" \
    && log "Content restored." || { err "Restore FAILED"; return 1; }
  COMPOSE restart website && log "Website restarted."
}

restore_db() {
  local f; f="$(pick "$BACKUP_DIR/db_*.sql.gz")" || return
  [ -f "${f}.sha256" ] && { sha256sum -c "${f}.sha256" >/dev/null 2>&1 && log "checksum OK" || { err "CHECKSUM MISMATCH — refusing."; return 1; }; }
  warn "This DROPS and recreates the ${DB_NAME:-spbuilders} database."
  confirm "yes restore" || { log "Cancelled."; return; }
  bash "$(dirname "${BASH_SOURCE[0]}")/backup.sh" pre-restore
  step "Restoring $(basename "$f")"
  gzip -dc "$f" | COMPOSE exec -T -e PGPASSWORD="${DB_PASSWORD:-}" postgres \
    psql -U "${DB_USERNAME:-spb}" -d "${DB_NAME:-spbuilders}" >/dev/null \
    && log "Database restored." || err "Restore FAILED"
}

echo ""
echo "  a) Restore published content   b) Restore database   c) List backups   0) Back"
printf "  Choose: "; c=""; read -r c < /dev/tty 2>/dev/null || true
case "$c" in
  a) restore_content ;;
  b) restore_db ;;
  c) ls -1t "$BACKUP_DIR"/*.gz 2>/dev/null | sed 's#.*/#    #' || echo "    (none)" ;;
  *) ;;
esac
