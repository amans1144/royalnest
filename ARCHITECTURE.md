# SP Builders — System Architecture

> Enterprise-grade real estate platform. Luxury public website + operational admin
> console + REST/Realtime API, built as a TypeScript monorepo.

---

## 1. High-level topology

```
                                 ┌───────────────────────────┐
                                 │        Cloudflare / CDN     │
                                 └──────────────┬──────────────┘
                                                │
        ┌───────────────────────┬───────────────┴───────────────┬────────────────────┐
        │                       │                                │                    │
┌───────▼────────┐     ┌────────▼────────┐              ┌────────▼────────┐   ┌───────▼───────┐
│  website (SSR)  │     │   admin (SPA/    │              │   REST API v1   │   │  Socket.IO GW  │
│  Next.js 15     │     │   SSR) Next.js15 │              │   NestJS        │   │  (same Nest    │
│  App Router     │     │                  │              │                 │   │   process)     │
└───────┬────────┘     └────────┬─────────┘              └───┬─────────┬───┘   └───────┬───────┘
        │  React Query / Axios   │                            │         │               │
        └────────────┬───────────┘                            │         │               │
                     │  HTTPS (JWT access token)               │         │               │
                     └─────────────────────────────────────────┘         │               │
                                                                          │               │
                        ┌──────────────┬────────────────┬────────────────┼───────────────┤
                        │              │                 │                │               │
                 ┌──────▼─────┐ ┌──────▼──────┐  ┌───────▼──────┐ ┌───────▼─────┐ ┌───────▼──────┐
                 │ PostgreSQL │ │    Redis     │  │  S3 storage  │ │ BullMQ jobs │ │  Providers   │
                 │  (Prisma)  │ │ cache/pubsub │  │  (media)     │ │  (queues)   │ │ SMTP/SMS/WA  │
                 └────────────┘ └─────────────┘  └──────────────┘ └─────────────┘ └──────────────┘
```

- **Single API process** exposes both the versioned REST surface and the Socket.IO
  gateway. The Socket.IO Redis adapter lets us scale horizontally (N API pods) while
  keeping realtime plot updates consistent.
- **Redis** is used for: response/query caching, the Socket.IO pub/sub adapter, rate
  limiting counters, and BullMQ background job queues (emails, exports, image processing).

---

## 2. Monorepo layout

```
spbuilders/
├── apps/
│   ├── website/        # Public marketing + property discovery site (Next.js 15, SSR/ISR)
│   ├── admin/          # Operations console: projects, plot editor, CRM, bookings, reports
│   └── api/            # NestJS REST + Socket.IO + Prisma + BullMQ
├── packages/
│   ├── types/          # Shared TS types, Zod schemas, API DTO contracts, enums
│   ├── utils/          # Framework-agnostic helpers (currency, geo, dates, formatters)
│   ├── ui/             # Design system: primitives (Button, Card, Dialog…) on Radix + Tailwind
│   ├── components/     # Higher-level composed components (PlotMap, ProjectCard, EMICalculator)
│   └── hooks/          # Reusable React hooks (useSocket, usePlots, useDebounce, useMediaQuery)
├── docs/
│   ├── DATABASE_DESIGN.md
│   └── API_DESIGN.md
├── tsconfig.base.json
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Dependency direction (never inverted):**

```
apps/*  ──►  packages/components ──►  packages/ui ──►  packages/utils
   │                │                                      ▲
   └────────────────┴──────────────►  packages/types  ─────┘
                                          ▲
                        apps/api ─────────┘   (types is the single source of truth
                                               for DTOs/enums shared FE↔BE)
```

- `@spb/types` holds Zod schemas that are the **contract**. The API validates inbound
  requests with them; the frontend infers TS types from the same schemas. One source of truth.
- `@spb/ui` and `@spb/components` are **client-only** React packages; `@spb/types` and
  `@spb/utils` are isomorphic (usable in Node/Nest and the browser).

---

## 3. Backend architecture (apps/api — NestJS)

Layered **Clean Architecture** with the **Repository + Service** pattern. Every domain
module follows the same shape:

```
src/modules/<domain>/
├── <domain>.module.ts        # Nest module wiring
├── <domain>.controller.ts    # HTTP layer — thin, only maps req/res, no logic
├── <domain>.service.ts       # Business/use-case layer — orchestration, transactions
├── <domain>.repository.ts    # Data-access layer — the ONLY place Prisma is touched
├── dto/                      # Zod-backed DTOs (create/update/query)
└── entities/                 # Domain view models / serializers
```

**Layer rules (enforced by review + lint boundaries):**

| Layer        | May depend on                     | Must NOT                                   |
| ------------ | --------------------------------- | ------------------------------------------ |
| Controller   | Service, DTOs                     | touch Prisma, contain business rules       |
| Service      | Repository, other Services, ports | know about HTTP (req/res), build SQL        |
| Repository   | PrismaService                     | contain business rules, HTTP concerns      |

**Cross-cutting infrastructure** (`src/common/` + `src/infra/`):

- `PrismaService` — connection lifecycle, soft-delete middleware, query logging.
- `RedisService` / `CacheService` — cache-aside helper with tag-based invalidation.
- Global `ZodValidationPipe`, `HttpExceptionFilter`, `AuditInterceptor`,
  `LoggingInterceptor` (Winston), `TransformInterceptor` (uniform response envelope).
- Guards: `JwtAuthGuard`, `RolesGuard` (RBAC), `ThrottlerGuard` (rate limiting).
- `S3Service` (AWS SDK v3), `MailService`, `SmsService`, `WhatsappService`.
- `EventsGateway` (Socket.IO) with the Redis adapter.
- BullMQ `queues/` for async work (exports, media processing, notifications).

**Core modules:** `auth`, `users`, `rbac`, `projects`, `plots`, `layouts`,
`bookings`, `leads`, `customers`, `media`, `notifications`, `reports`, `dashboard`,
`audit`, `search`, `seo`.

---

## 4. Realtime — Interactive Plot System

The flagship feature. Realtime flow when an admin flips a plot's status:

```
Admin UI ──PATCH /plots/:id/status──► PlotsController ──► PlotsService
                                                            │ 1. tx: update Plot + PlotStatusHistory
                                                            │ 2. invalidate cache tag: project:{id}:plots
                                                            │ 3. write AuditLog
                                                            └─► EventsGateway.emit(
                                                                   room `project:{id}`,
                                                                   'plot.updated', { id, status, color })
                                                                        │ (Redis adapter fans out)
Every website/admin client in room `project:{id}` ◄── socket 'plot.updated' ──┘
                                                    └─► React Query cache patch → plot repaints instantly
```

- Clients join a Socket.IO **room per project** on the project-details / plot-editor page.
- Server is the source of truth; clients apply optimistic patches then reconcile on the
  authoritative `plot.updated` event.
- Redis pub/sub adapter guarantees delivery across all API replicas.

---

## 5. Frontend architecture (Next.js 15 App Router)

- **Rendering strategy:**
  - Marketing pages (Home, About, Blog, project SEO pages) → **SSG/ISR** for speed + SEO.
  - Project detail / plot map → SSR shell + client-side realtime hydration.
  - Admin → mostly client components behind auth (SPA feel) with server actions for mutations.
- **State:** `React Query` for all server state (caching, pagination, infinite scroll);
  `Zustand` for ephemeral UI/global client state (plot editor tool state, filters, theme).
- **Forms:** `React Hook Form` + `Zod` resolver, schemas imported from `@spb/types`.
- **Data access:** a typed Axios client in `@spb/utils` with interceptors for auth token
  refresh; wrapped by React Query hooks in `@spb/hooks`.
- **Design system:** Tailwind + Radix primitives in `@spb/ui`; Framer Motion for
  transitions; Recharts for dashboards; React Leaflet / Google Maps for geography;
  a custom SVG/Canvas engine for the plot editor & viewer.

---

## 6. Security

- Short-lived JWT **access** tokens (15m) + rotating **refresh** tokens (30d) stored as
  httpOnly, secure, SameSite cookies; refresh-token reuse detection (token family).
- **RBAC** via `@Roles()` decorator + `RolesGuard`: SUPER_ADMIN, SALES_MANAGER,
  EXECUTIVE, EDITOR, VIEWER, CUSTOMER.
- Helmet, strict CORS allow-list, global rate limiting (Redis-backed throttler).
- All input validated by Zod at the boundary; Prisma parameterizes all queries
  (no raw string SQL) → SQL-injection safe by construction.
- Full **audit log** + **activity log** of privileged mutations via `AuditInterceptor`.
- Secrets only via env; nothing sensitive in the client bundle.

---

## 7. Performance

- Redis cache-aside on hot reads (project lists, plot availability, dashboard aggregates)
  with tag invalidation on writes.
- DB: covering indexes on hot filters, composite indexes for plot search, connection
  pooling (PgBouncer/`DIRECT_URL` split for migrations).
- Frontend: route-level code splitting, dynamic imports for heavy widgets (editor, maps,
  charts), `next/image` optimization, virtualized tables (TanStack Virtual), infinite
  scroll + cursor pagination on the API.
- Plot viewer renders large layouts (1000+ polygons) on Canvas/SVG with viewport culling.

---

## 8. Observability & Ops

- **Winston** structured JSON logs, request-id correlation, log levels per env.
- Health endpoints (`/health`, `/health/db`, `/health/redis`) for k8s probes.
- Swagger/OpenAPI served at `/docs` (non-prod) generated from Zod DTOs.
- Env-driven config module; 12-factor. Dockerized services; Turbo remote cache in CI.

---

## 9. Delivery phases

1. **Phase 1** — Foundation: monorepo, architecture, DB design, Prisma schema, API design. ← *current*
2. **Phase 2** — Auth, RBAC, Dashboard.
3. **Phase 3** — Projects module.
4. **Phase 4** — Interactive Plot Editor (Figma-like) + realtime viewer.
5. **Phase 5** — Public website.
6. **Phase 6** — Bookings, CRM, Reports, Notifications.
7. **Phase 7** — Deployment, optimization, testing, documentation.
