# Database Design — SP Builders

PostgreSQL 16 + Prisma. Extensions: `pgcrypto`, `citext` (case-insensitive email),
`postgis` (geo radius/containment). Source of truth: [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma).

## Domain map

```
                         ┌──────────┐
                         │  User    │ (staff + customer login, RBAC role)
                         └────┬─────┘
             ┌───────────────┼─────────────────┬──────────────┐
       manager/creator   assignee/agent     uploader        author
             │               │                 │              │
        ┌────▼─────┐    ┌─────▼────┐      ┌─────▼─────┐  ┌─────▼────┐
        │ Project  │◄───│  Lead    │      │MediaAsset │  │ BlogPost │
        └────┬─────┘    └────┬─────┘      └───────────┘  └──────────┘
   ┌─────────┼──────────┐    │
   │         │          │    │
┌──▼───┐ ┌───▼────┐ ┌───▼────▼─┐    ┌──────────┐
│Layout│ │ProjMedia│ │ Booking  │───►│ Customer │
└──┬───┘ │Amenity  │ └────┬─────┘    └────┬─────┘
   │     │Nearby   │      │               │
┌──▼───┐ │Spec     │  ┌───┼────┬────────┐ │
│ Plot │ │Download │  │   │    │        │ │
└──┬───┘ └─────────┘ Pay Install Agree Receipt
   │                  │
 ┌─┴──────────┐       └─ Document (plot | booking | customer)
 │StatusHist  │
 │PriceHist   │
 └────────────┘
```

## Key modeling decisions

- **CUID primary keys** everywhere — collision-resistant, sortable-ish, safe to expose
  in URLs (no sequential enumeration).
- **Soft deletes** (`deletedAt`) on user-facing aggregates (User, Project, Plot, Booking,
  Lead, Customer, Layout, BlogPost, MediaAsset). A Prisma middleware scopes default
  reads to `deletedAt = null`.
- **Money as `Decimal(14,2)`** — never floats. `currency` kept per-record for multi-market
  readiness (defaults `INR`).
- **Denormalized inventory rollups** on `Project` (`totalPlots`, `availablePlots`, …) so
  homepage/listing cards render without aggregating thousands of plots. Refreshed inside
  the same transaction that mutates a plot's status.
- **Plot geometry in `Json`** (`polygon`, `gpsPolygon`) — vertex arrays in layout pixel
  space. This keeps the editor flexible (arbitrary polygons) while indexes on the scalar
  filter columns (`status`, `facing`, `area`, `basePrice`, `isCorner`) keep search fast.
- **Audit trail split**: `PlotStatusHistory` + `PlotPriceHistory` for domain timelines the
  UI shows; `AuditLog` for the compliance record of privileged mutations.
- **One active booking per plot**: `Booking.plotId @unique`. Reservations use
  `reservedUntil` for auto-release.

## Index strategy (hot paths)

| Query                                             | Index |
| ------------------------------------------------- | ----- |
| Plot search within a project by status            | `plots(projectId, status)` |
| Filter plots by facing / corner / area / price    | single-column indexes on each |
| Public unique plot lookup                          | `plots(projectId, plotNumber)` unique |
| Project listing by type + status                   | `projects(type, status)` |
| Homepage featured/published                        | `projects(isPublished, isFeatured)` |
| City/state discovery                               | `projects(city, state)` |
| CRM pipeline board                                 | `leads(status, priority)`, `leads(assigneeId, status)` |
| Follow-up reminders                                | `leads(nextFollowUpAt)` |
| Booking dashboards                                 | `bookings(status, paymentStatus)` |
| Installment ageing                                 | `installments(status, dueDate)` |
| Notification bell (unread)                         | `notifications(userId, readAt)` |
| Audit lookups                                      | `audit_logs(entityType, entityId)` |

## Migrations & tooling

```bash
pnpm db:generate   # prisma generate
pnpm db:migrate    # prisma migrate dev
pnpm db:seed       # seed roles, demo project, sample plots
pnpm db:studio     # Prisma Studio
```

PostGIS geometry columns (`Project.geom`, plot geo indexes) are added via a raw-SQL
migration after the initial Prisma migration, since Prisma models them as `Unsupported`.
