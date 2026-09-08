#!/usr/bin/env bash
# Install the system packages the deployment needs. Ubuntu/Debian. Idempotent.
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/_common.sh"

SUDO=""; [ "$(id -u)" -ne 0 ] && SUDO="sudo"

step "Installing system dependencies"
$SUDO apt-get update -y || { err "apt update failed"; exit 1; }
$SUDO apt-get install -y ca-certificates curl gnupg git nginx ufw fail2ban \
                         apache2-utils certbot python3-certbot-nginx python3 || {
  err "apt install failed"; exit 1; }

if ! command -v docker >/dev/null; then
  step "Installing Docker Engine + compose plugin"
  $SUDO install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  $SUDO chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | $SUDO tee /etc/apt/sources.list.d/docker.list >/dev/null
  $SUDO apt-get update -y
  $SUDO apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
else
  log "Docker already installed: $(docker --version)"
fi

log "docker compose: $(docker compose version 2>/dev/null | head -1 || echo MISSING)"
log "nginx:          $(nginx -v 2>&1)"
log "certbot:        $(certbot --version 2>&1)"

# 4 GB RAM builds two Next.js apps, but only with swap to absorb the peak.
if ! swapon --show | grep -q .; then
  warn "No swap configured. Two Next.js builds on 4 GB can OOM."
  echo "  Create 2 GB of swap:"
  echo "    $SUDO fallocate -l 2G /swapfile && $SUDO chmod 600 /swapfile"
  echo "    $SUDO mkswap /swapfile && $SUDO swapon /swapfile"
  echo "    echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab"
else
  log "swap: $(swapon --show=SIZE --noheadings | tr '\n' ' ')"
fi
