# SP Builders — Enterprise Real Estate Platform

A SaaS-quality real estate platform: a luxury public website, an operational admin
console with a **Figma-like interactive plot editor**, realtime plot availability, and a
full sales/CRM/bookings back office. Built as a TypeScript monorepo.

> **Status: Phase 1 (Foundation) complete** — folder structure, architecture, database
> design, Prisma schema, and API design are in place and runnable. See the roadmap below.

---

## Tech stack

| Layer      | Choice |
| ---------- | ------ |
| Frontend   | Next.js 15 (App Router), React 19, TypeScript, TailwindCSS, Radix UI, Framer Motion, TanStack Query, React Hook Form + Zod, Zustand, Recharts, Swiper |
| Backend    | NestJS 11, TypeScript, Socket.IO, BullMQ |
| Database   | PostgreSQL 16 (+ PostGIS) via Prisma ORM |
| Auth       | JWT access + rotating refresh tokens, Google OAuth |
| Storage    | AWS S3-compatible (MinIO in dev) |
| Cache/RT   | Redis (cache, Socket.IO adapter, queues) |
| Tooling    | pnpm workspaces + Turborepo, Prettier, Vitest/Jest |

## Monorepo layout

```
apps/
  website/   Public marketing + property discovery (Next.js, SSR/ISR)
  admin/     Operations console: projects, plot editor, CRM, bookings, reports
  api/       NestJS REST + Socket.IO + Prisma + BullMQ
packages/
  types/     Shared Zod schemas, DTO contracts, enums (FE↔BE source of truth)
  utils/     Framework-agnostic helpers (currency, geometry, RBAC, API client)
  ui/        Design system primitives (Button, Card, Badge…) on Radix + Tailwind
  components/ Composed components (PlotLegend, and more to come)
  hooks/     Reusable React hooks (useDebounce, useMediaQuery, useProjectSocket)
docs/
  ARCHITECTURE.md · DATABASE_DESIGN.md · API_DESIGN.md
```

See [ARCHITECTURE.md](./ARCHITECTURE.md), [docs/DATABASE_DESIGN.md](./docs/DATABASE_DESIGN.md),
and [docs/API_DESIGN.md](./docs/API_DESIGN.md) for the full design.

## Getting started

```bash
# 1. Prerequisites: Node ≥20, pnpm ≥10, Docker
cp .env.example .env

# 2. Start infrastructure (Postgres + Redis + MinIO)
docker compose up -d

# 3. Install dependencies
pnpm install

# 4. Set up the database
pnpm db:generate      # generate the Prisma client
pnpm db:migrate       # create the schema
pnpm db:seed          # super-admin + demo project with plots

# 5. Run everything (turbo runs all apps in parallel)
pnpm dev
#   website → http://localhost:3000
#   admin   → http://localhost:3001
#   api     → http://localhost:4000/api/v1   (Swagger at /docs)
```

Default seeded login: `admin@spbuilders.com` / `ChangeMe@123` (change immediately).

## Useful commands

```bash
pnpm dev            # all apps in watch mode
pnpm build          # build everything (Turbo-cached)
pnpm lint           # lint all packages
pnpm typecheck      # strict TS across the monorepo
pnpm test           # unit tests
pnpm db:studio      # Prisma Studio
```

## The flagship: interactive plot system

Each project has a **Layout** (uploaded master image) carrying many **Plots**, each a
polygon linked to a plot record with area, dimensions, price, facing, PLC, status, owner,
documents, and GPS coordinates. Admins draw/edit polygons in a Figma-like editor
(zoom/pan/snap/undo/redo/vertex editing/multi-select). The public site renders the same
layout with live status colors:

| Status | Color |
| ------ | ----- |
| Available | 🟢 Green |
| Booked | 🔵 Blue |
| Reserved | 🟡 Yellow |
| Sold | 🔴 Red |
| Blocked | ⚪ Gray |

When an admin changes a plot's status, **every connected client sees it update instantly**
via Socket.IO (Redis-backed, multi-replica safe).

## Delivery roadmap

- [x] **Phase 1** — Foundation: monorepo, architecture, DB design, Prisma schema, API design
- [ ] **Phase 2** — Authentication, RBAC, Dashboard
- [ ] **Phase 3** — Projects module
- [ ] **Phase 4** — Interactive Plot Editor + realtime viewer
- [ ] **Phase 5** — Public website
- [ ] **Phase 6** — Bookings, CRM, Reports, Notifications
- [ ] **Phase 7** — Deployment, optimization, testing, documentation
