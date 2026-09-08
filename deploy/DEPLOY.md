# RoyalNest — VPS deployment

Same shape as the musicalarchive deployment already running on this server:
everything in Docker, the host nginx as the only public listener.

```
Internet
    │
    ▼
      VPS host nginx :80/:443        ← owns TLS, certbot renews it
                 │  127.0.0.1:8090
                 ▼
          proxy (Caddy, docker)      ← routes on the Host header
                 ├──► website:3000   royalnestrealty.in, www.
                 └──► admin:3005     admin.royalnestrealty.in
                          │
                       api:4000 ──► postgres / redis   (internal only)
```

Only the proxy binds a host port, and only on `127.0.0.1`. The website, admin,
api, postgres and redis have no published ports at all — nothing outside Docker
can reach them except through nginx.

## Port allocation on this server

`8088` and `8443` are already taken by the **musicalarchive** proxy. RoyalNest
uses **8090** (HTTP) and **8453** (HTTPS), set as `PROXY_HTTP_PORT` /
`PROXY_HTTPS_PORT` in `.env.production`. If you change them, change
`deploy/nginx/royalnestrealty.in.conf` to match — `deploy.sh → 4 → a` warns
when the two disagree.

## DNS

Three records at the registrar, all pointing at the VPS IP:

```
A   royalnestrealty.in         -> <VPS_IP>
A   www.royalnestrealty.in     -> <VPS_IP>
A   admin.royalnestrealty.in   -> <VPS_IP>
```

No CDN or proxy in front. certbot proves control of each name over HTTP-01, so
all three must resolve to this server and port 80 must be open
(`sudo ufw allow 'Nginx Full'`) before you request certificates.

---

## First deploy

```bash
cd /root
git clone git@github.com:amans1144/royalnest.git
cd royalnest
bash deploy.sh
```

Then `1) Setup / Configure` → `a) First-time setup`, which runs the whole
sequence: install dependencies → create `.env.production` → generate secrets →
build and start the stack → install the nginx site → request certificates →
self-test.

If you would rather drive it step by step, that is exactly:

```bash
bash deploy.sh   # 1 → d   install docker, nginx, certbot, apache2-utils
                 # 1 → b   fill in .env.production
                 # 1 → c   generate PUBLISH_TOKEN, JWT, DB and Redis passwords
                 # 2       build + start the stack
                 # 4 → a   install the nginx site (creates the Basic Auth file)
                 # 4 → b   Let's Encrypt certificates for apex, www and admin
                 # 7 → a   run database migrations
                 # 7 → d   create your admin user
                 # 10      self-test
```

## HTTPS

Both options issue a real Let's Encrypt certificate; they differ only in which
process owns port 443. `deploy.sh → 4 → f` switches between them and refuses
the second if something is already listening.

**nginx + certbot (default, and what this server already runs).** Host nginx
terminates TLS and proxies to Caddy on `127.0.0.1:8090`. Other sites keep
working — this box already serves klpandeymusic.com the same way. certbot
installs a systemd timer, so renewal is automatic; `4 → c` forces it early and
`4 → d` shows expiry dates.

```bash
bash deploy.sh   # 4 → a   install the site conf
                 # 4 → b   certbot --nginx for all three names
```

**Caddy direct.** Caddy binds `0.0.0.0:80` and `:443` and gets its own
certificate, with no nginx in the path. Only viable if nothing else serves
those ports, so on this server you would have to disable every other nginx site
first. Requires `ACME_EMAIL` in `.env.production`.

### What you must fill in by hand

`1 → c` generates every secret that has no external dependency. These it
cannot know:

| Value | Why it matters |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical tags, OG URLs, sitemap, robots.txt. **Baked in at build time** — changing it needs a rebuild, not a restart. |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | The admin's sign-in is a client-side mock; the committed default is public knowledge. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps on the site. |
| `ACME_EMAIL` | Only used if you ever switch the proxy to edge mode. |

`PUBLISH_TOKEN` and `NEXT_PUBLIC_PUBLISH_TOKEN` **must be identical** — the
generator sets both. If they drift, every publish from the admin returns 401.
If `PUBLISH_TOKEN` is empty, the website disables publishing entirely (503)
rather than leaving the endpoints open.

## Redeploying after a change

```bash
cd /root/royalnest
git pull
bash deploy.sh    # 2) Deploy — takes a pre-deploy backup, rebuilds, restarts, health-checks
```

To rebuild only one app, `3) Rebuild one app`. Published content is untouched
by a redeploy: it lives in the `royalnest_content` Docker volume, not in the
image.

**A restart is not enough for `NEXT_PUBLIC_*` changes.** Those are compiled
into the browser bundle, so they need `2` or `3` (a rebuild), never `5`.

## Backups

`6) Backup / Restore` snapshots the two things a redeploy cannot rebuild: the
published content volume and the Postgres database. `6 → d` installs a daily
cron. Backups land in `/var/backups/royalnest`, newest 14 kept.

They are on the same disk as the thing they protect, so copy them off the box:

```bash
rsync -avz root@<VPS_IP>:/var/backups/royalnest/ ~/royalnest-backups/
```

## Verifying

`9) Self-test` checks the whole chain and exits non-zero on failure, so it also
works from cron:

- the website and admin answer through the proxy, host-routed correctly
- an unauthenticated `POST /api/marketing` is refused (401, or 503 when
  publishing is disabled) — a 200 here means anyone can rewrite the site
- ports 3000, 3005, 4000, 5432 and 6379 are **not** listening on the host

By hand, from outside:

```bash
curl -I https://royalnestrealty.in
curl -s https://royalnestrealty.in/sitemap.xml | head
curl -I https://admin.royalnestrealty.in        # 401 until you pass Basic Auth

# publishing is closed to the internet
curl -s -o /dev/null -w '%{http_code}\n' -X POST \
  https://royalnestrealty.in/api/marketing \
  -H 'Content-Type: application/json' -d '{"items":[]}'    # -> 401
```

## Database and admin users

`7) Database / admins` covers everything schema- and account-related:

| Option | Does |
| --- | --- |
| `a` Run migrations | `prisma migrate deploy` — the normal path once migration files exist |
| `b` Push schema | `prisma db push` — first install only; no migration history, so never on a populated database |
| `c` List staff users | every SUPER_ADMIN / SALES_MANAGER / EXECUTIVE / EDITOR, with last-login |
| `d` Create / update an admin | prompts for email, role and password; argon2-hashed |
| `e` Seed demo data | the sample project and 20 plots — **not** for the public site |

Option `d` is the one to use. It refuses passwords under 12 characters, those
missing a mix of cases and digits, and anything containing a known default. Run
it again with the same email to change a password or role; leave the password
blank to update the other fields without touching it.

The underlying script is `apps/api/prisma/seed-admin.mjs`, which can also be
driven non-interactively:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec \
  -e ADMIN_EMAIL=you@royalnestrealty.in -e ADMIN_PASSWORD='...' \
  -e ADMIN_ROLE=SUPER_ADMIN \
  api node prisma/seed-admin.mjs
```

> **These are API users, not the admin console login.** The console at
> `admin.royalnestrealty.in` still authenticates against
> `NEXT_PUBLIC_ADMIN_EMAIL` / `NEXT_PUBLIC_ADMIN_PASSWORD` compiled into its
> bundle, gated by nginx Basic Auth. The database users above become the real
> login once `apps/api` grows an auth module.

Do **not** run `pnpm db:seed` (the demo seed) on the live site: it creates
`admin@spbuilders.com` with the published password `ChangeMe@123`.

## The API, postgres and redis

`apps/api` is still a scaffold — health endpoints only — and nothing on the
site calls it. It is wired into the stack for parity, but on a 1 vCPU / 4 GB
box you can leave it out until it has real modules:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml \
  up -d --scale api=0 proxy website admin
```

That saves roughly 400 MB of RAM. The website's content store is plain JSON on
a volume and does not need Postgres.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Publish says the tokens don't match | `PUBLISH_TOKEN` ≠ `NEXT_PUBLIC_PUBLISH_TOKEN`, or the admin wasn't **rebuilt** after changing it |
| Publish says publishing is disabled | `PUBLISH_TOKEN` is unset on the website — it fails closed by design |
| `413` on publish | `client_max_body_size` too low in the nginx site conf (it ships at 25M) |
| Canonical URLs point at localhost | `NEXT_PUBLIC_SITE_URL` wasn't set at **build** time |
| Admin vhost returns 500 | `/etc/nginx/.htpasswd-royalnest` is missing — `deploy.sh → 4 → d` |
| Both domains serve the website | nginx isn't passing `Host` through, so Caddy can't route — check `proxy_set_header Host $host` |
| certbot HTTP-01 fails | A record doesn't resolve here yet, port 80 blocked, or a proxy sits in front |
| Site 502s | `bash deploy.sh` → `7) Status / logs` |
| Port already in use on 8090 | Something else took it; `deploy.sh → 4 → a` warns which site |

## Known limitations

These are inherited from the app, not the deployment, and are worth fixing
before this carries real customer data:

1. **Admin auth is a client-side mock.** `apps/admin/src/lib/auth.ts` compares
   against credentials that ship in the JS bundle and keeps the session in
   `localStorage`. nginx Basic Auth is the real gate.
2. **The publish token is a `NEXT_PUBLIC_` value**, so anyone who can load the
   admin bundle can read it. Basic Auth is what stops the bundle being fetched.
3. **Uploads are data URIs inside JSON.** Fine for a brochure and a few dozen
   photos; it will not scale to hundreds. The S3 config in `.env.prod.example`
   is the intended replacement.
4. **Single instance per app.** The JSON store has no locking — never run two
   website containers against the same content volume.
