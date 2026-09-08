#!/usr/bin/env bash
# Database: migrations and admin users.
# The password is read with `read -rs` and passed to the container as an env
# var on the exec, so it never lands in the shell history or the process list.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

api_running() { COMPOSE ps --status running api 2>/dev/null | grep -q api; }

require_api() {
  if ! api_running; then
    err "The api container is not running."
    err "Start it first:  deploy.sh -> 2) Deploy   (or 5 -> c to restart just the api)"
    return 1
  fi
}

do_migrate() {
  require_api || return
  step "Applying Prisma migrations"
  if COMPOSE exec -T api npx --yes prisma migrate deploy --schema prisma/schema.prisma; then
    log "Migrations applied."
  else
    warn "migrate deploy failed. If this project has no migration files yet,"
    warn "push the schema directly instead (option c)."
  fi
}

do_push() {
  require_api || return
  warn "db push syncs the schema WITHOUT migration history. Fine for a first"
  warn "install, wrong for an established database with data in it."
  confirm "yes push" || { log "Cancelled."; return; }
  COMPOSE exec -T api npx --yes prisma db push --schema prisma/schema.prisma \
    && log "Schema pushed." || err "db push failed."
}

do_seed_admin() {
  require_api || return
  step "Create or update an admin user"

  printf "  Email: "; email=""; read -r email < /dev/tty 2>/dev/null || true
  [ -z "$email" ] && { err "Email is required."; return; }

  echo "  Roles: SUPER_ADMIN (default) · SALES_MANAGER · EXECUTIVE · EDITOR"
  printf "  Role [SUPER_ADMIN]: "; role=""; read -r role < /dev/tty 2>/dev/null || true
  role="${role:-SUPER_ADMIN}"

  printf "  First name [Site]: "; fn=""; read -r fn < /dev/tty 2>/dev/null || true
  printf "  Last name [Admin]: ";  ln=""; read -r ln < /dev/tty 2>/dev/null || true

  echo "  Password rules: 12+ chars, upper + lower + digit, no common defaults."
  echo "  Leave blank to update an existing user without changing their password."
  printf "  Password: "; pw=""; read -rs pw < /dev/tty 2>/dev/null || true; echo
  if [ -n "$pw" ]; then
    printf "  Confirm:  "; pw2=""; read -rs pw2 < /dev/tty 2>/dev/null || true; echo
    [ "$pw" != "$pw2" ] && { err "Passwords do not match."; return; }
  fi

  COMPOSE exec -T \
    -e ADMIN_EMAIL="$email" \
    -e ADMIN_PASSWORD="$pw" \
    -e ADMIN_ROLE="$role" \
    -e ADMIN_FIRST_NAME="${fn:-Site}" \
    -e ADMIN_LAST_NAME="${ln:-Admin}" \
    api node prisma/seed-admin.mjs
}

do_list() {
  require_api || return
  COMPOSE exec -T -e ADMIN_LIST=1 api node prisma/seed-admin.mjs
}

do_demo_seed() {
  require_api || return
  warn "This loads DEMO data: a sample project, 20 plots, amenities — and a"
  warn "super admin with the well-known password ChangeMe@123."
  warn "Never run this on the public site without changing that password after."
  confirm "yes seed demo" || { log "Cancelled."; return; }
  COMPOSE exec -T api npx --yes tsx prisma/seed.ts \
    && { log "Demo data seeded."
         warn "Now change the demo admin's password with option d."; } \
    || err "Demo seed failed."
}

while true; do
  echo ""
  echo -e "${CYAN}  Database / admin users${NC}"
  echo "   a) Run migrations            — prisma migrate deploy"
  echo "   b) Push schema (first run)   — prisma db push, no migration history"
  echo "   c) List staff users"
  echo "   d) Create / update an admin  — prompts for email, role, password"
  echo "   e) Seed DEMO data            — sample project + plots (not for production)"
  echo "   0) Back"
  printf "  Choose: "; c=""; read -r c < /dev/tty 2>/dev/null || true
  case "$c" in
    a) do_migrate ;;
    b) do_push ;;
    c) do_list ;;
    d) do_seed_admin ;;
    e) do_demo_seed ;;
    0) exit 0 ;;
    '') exit 0 ;;
    *) err "Invalid option" ;;
  esac
done
