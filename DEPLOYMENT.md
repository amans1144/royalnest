# Deploying to a Hostinger KVM VPS

Target: **KVM 1** (1 vCPU, 4 GB RAM, 50 GB NVMe), Ubuntu 24.04 LTS.

What actually gets deployed today:

| App | Port | Purpose |
| --- | --- | --- |
| `apps/website` | 3000 | The public site |
| `apps/admin` | 3005 | The admin console |

`apps/api` (NestJS) is still a scaffold — only a health endpoint — and nothing on
the site calls it, so **Postgres, Redis and MinIO are not needed yet**. Skip them
until the API has real modules. That keeps a 1 vCPU box comfortable.

Published content (gallery, marketing material, site settings, plot layouts) is
stored as JSON files under `DATA_DIR`, written atomically. Uploaded images live
inside those files as data URIs.

Assumes two DNS records pointing at your VPS IP:

```
A   royalnestrealty.in         -> <VPS_IP>
A   www.royalnestrealty.in     -> <VPS_IP>
A   admin.royalnestrealty.in   -> <VPS_IP>
```

---

## 1. First login and a non-root user

From your Mac:

```bash
ssh root@<VPS_IP>
```

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy/    # keep key login
```

Log back in as `deploy` and confirm `sudo` works before closing the root session:

```bash
ssh deploy@<VPS_IP>
sudo whoami        # -> root
```

## 2. Firewall, updates, swap

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ufw fail2ban git nginx

sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo systemctl enable --now fail2ban
```

1 vCPU with 4 GB RAM builds Next.js fine, but swap stops an out-of-memory kill
if both builds ever overlap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h            # confirm 2Gi of swap
```

## 3. Node 20 and pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo corepack enable
sudo corepack prepare pnpm@10.30.1 --activate

node -v            # v20.x
pnpm -v            # 10.30.1
```

## 4. Get the code onto the server

The project is not a git repo yet. Either initialise one and push to
GitHub/GitLab (best — makes updates a `git pull`), or copy it directly.

**Option A — git (recommended)**

On your Mac, in the project root:

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create royalnest --private --source=. --push     # or add a remote manually
```

On the server:

```bash
sudo mkdir -p /var/www && sudo chown deploy:deploy /var/www
cd /var/www
git clone git@github.com:<you>/royalnest.git spbuilders
```

**Option B — rsync straight from your Mac**

```bash
rsync -avz --delete \
  --exclude node_modules --exclude .next --exclude .turbo \
  ~/Documents/spbuilders/ deploy@<VPS_IP>:/var/www/spbuilders/
```

## 5. Environment

Content must not live in `/tmp` — systemd clears it, and on some images it is a
tmpfs that empties on reboot. Create a real directory:

```bash
sudo mkdir -p /var/lib/spbuilders
sudo chown deploy:deploy /var/lib/spbuilders
```

Generate a publish token (the admin uses it to authorise writes to the site):

```bash
openssl rand -hex 32          # copy the output
```

Create `/var/www/spbuilders/.env.production`:

```bash
# ── Website (port 3000) ──
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://royalnestrealty.in
DATA_DIR=/var/lib/spbuilders
PUBLISH_TOKEN=<the openssl output>
ADMIN_ORIGIN=https://admin.royalnestrealty.in

# ── Admin (port 3005) ──
NEXT_PUBLIC_WEBSITE_URL=https://royalnestrealty.in
NEXT_PUBLIC_PUBLISH_TOKEN=<the same openssl output>
```

```bash
chmod 600 /var/www/spbuilders/.env.production
```

Two of these are **baked in at build time**, not read at runtime — change either
one and you must rebuild:

- `NEXT_PUBLIC_SITE_URL` — canonical tags, OG URLs, sitemap, robots.txt
- `NEXT_PUBLIC_WEBSITE_URL` / `NEXT_PUBLIC_PUBLISH_TOKEN` — where the admin
  publishes to, and the token it sends

`DATA_DIR`, `PUBLISH_TOKEN` and `ADMIN_ORIGIN` are read at runtime by the
website process, so those only need a restart.

## 6. Install and build

```bash
cd /var/www/spbuilders
pnpm install --frozen-lockfile

set -a; . ./.env.production; set +a
pnpm --filter @spb/website build
pnpm --filter @spb/admin build
```

Build one at a time on a 1 vCPU box — `turbo run build` would run both at once.
Each takes a couple of minutes.

## 7. systemd services

`/etc/systemd/system/spb-website.service`:

```ini
[Unit]
Description=RoyalNest website (Next.js)
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/spbuilders/apps/website
EnvironmentFile=/var/www/spbuilders/.env.production
ExecStart=/var/www/spbuilders/apps/website/node_modules/.bin/next start -p 3000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/spb-admin.service` — identical but:

```ini
Description=RoyalNest admin (Next.js)
WorkingDirectory=/var/www/spbuilders/apps/admin
ExecStart=/var/www/spbuilders/apps/admin/node_modules/.bin/next start -p 3005
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now spb-website spb-admin
sudo systemctl status spb-website --no-pager
curl -I http://127.0.0.1:3000        # 200
curl -I http://127.0.0.1:3005/login  # 200
```

## 8. Nginx

`/etc/nginx/sites-available/royalnest`:

```nginx
# ── Public site ──
server {
    listen 80;
    server_name royalnestrealty.in www.royalnestrealty.in;

    # Uploaded images and PDFs are posted as data URIs, so publishes are
    # multi-megabyte JSON bodies. Nginx's 1 MB default would 413 them.
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}

# ── Admin ──
server {
    listen 80;
    server_name admin.royalnestrealty.in;

    client_max_body_size 25M;

    # The admin's sign-in is a client-side mock — the demo credentials ship
    # inside the JS bundle. Basic Auth is what actually keeps strangers out.
    auth_basic "RoyalNest Admin";
    auth_basic_user_file /etc/nginx/.htpasswd-admin;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}
```

```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd-admin royalnest      # pick a strong password

sudo ln -s /etc/nginx/sites-available/royalnest /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

## 9. HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx \
  -d royalnestrealty.in -d www.royalnestrealty.in \
  -d admin.royalnestrealty.in
sudo systemctl status certbot.timer      # auto-renewal is already scheduled
```

Certbot rewrites the vhosts to listen on 443 and redirect from 80.

## 10. Bring your existing content across (optional)

Anything already published from your Mac lives in its temp dir. Copy it in
before going live:

```bash
# on your Mac
scp $TMPDIR/spb-published-*.json $TMPDIR/spb-site-settings.json \
    deploy@<VPS_IP>:/var/lib/spbuilders/
```

```bash
sudo systemctl restart spb-website
```

## 11. Verify

```bash
curl -I https://royalnestrealty.in
curl -I https://royalnestrealty.in/marketing
curl -s https://royalnestrealty.in/sitemap.xml | head

# publishing is closed to the internet
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://royalnestrealty.in/api/marketing \
  -H 'Content-Type: application/json' -d '{"items":[]}'      # -> 401
```

Then in a browser: open the admin, sign in through Basic Auth, upload something
under Marketing Material, press **Publish to website**, and confirm it appears
on the public page.

## 12. Redeploying after a change

```bash
cd /var/www/spbuilders
git pull                                  # or rsync again
pnpm install --frozen-lockfile
set -a; . ./.env.production; set +a
pnpm --filter @spb/website build
pnpm --filter @spb/admin build
sudo systemctl restart spb-website spb-admin
```

Published content is untouched by a redeploy — it lives in `/var/lib/spbuilders`,
not in the build.

## 13. Backups

The entire editable state of the site is one directory:

```bash
sudo tee /etc/cron.daily/spb-backup >/dev/null <<'EOF'
#!/bin/sh
mkdir -p /var/backups/spbuilders
tar czf "/var/backups/spbuilders/data-$(date +%F).tar.gz" -C /var/lib spbuilders
find /var/backups/spbuilders -name '*.tar.gz' -mtime +14 -delete
EOF
sudo chmod +x /etc/cron.daily/spb-backup
```

Pull a copy off the box periodically — a backup on the same disk is not a backup.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Publish says the tokens don't match | `PUBLISH_TOKEN` ≠ `NEXT_PUBLIC_PUBLISH_TOKEN`, or the admin wasn't rebuilt after changing it |
| Publish says publishing is disabled | `PUBLISH_TOKEN` is unset on the website — it fails closed by design |
| `413` on publish | `client_max_body_size` too low in nginx |
| Published content vanished after reboot | `DATA_DIR` unset, so it fell back to `/tmp` |
| Canonical URLs point at localhost | `NEXT_PUBLIC_SITE_URL` wasn't set at **build** time |
| Site 502s | `sudo journalctl -u spb-website -n 50` |

## Known limitations to fix before this is a real production system

1. **Admin auth is a mock.** `apps/admin/src/lib/auth.ts` compares against
   hardcoded credentials in client-side code and keeps the session in
   `localStorage`. Anyone who gets past Basic Auth can sign in, and the password
   is readable in the JS bundle. Change `DEMO_CREDENTIALS` from the default at
   minimum; replace with real JWT auth from the API when it exists.
2. **The publish token is a `NEXT_PUBLIC_` value**, so it is visible to anyone
   who can load the admin bundle. It stops the open internet writing to the
   site; Basic Auth is what stops the bundle being fetched. Together they are
   reasonable for a single-operator site, not for multi-user access.
3. **Uploads are stored as data URIs inside JSON.** Fine for a brochure and a few
   dozen photos; it will not scale to hundreds. The S3 path in `.env.example`
   is the intended replacement.
4. **Single instance per app.** The JSON store has no locking, so don't run two
   copies of the website against one `DATA_DIR`.
