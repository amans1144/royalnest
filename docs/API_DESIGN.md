# API Design — SP Builders

NestJS · REST · URI-versioned (`/api/v1`) · Zod-validated · JWT + refresh · Swagger at `/docs`.

## Conventions

- **Base URL:** `/{globalPrefix}/v{n}` → `/api/v1`. Versioning via `VersioningType.URI`.
- **Auth:** `Authorization: Bearer <accessToken>`. Refresh token in an httpOnly cookie.
- **Validation:** every body/query/param passes a Zod schema from `@spb/types` through a
  global `ZodValidationPipe`. 422 on failure with field-level errors.
- **Response envelope** (via `TransformInterceptor`):
  ```json
  { "success": true, "data": {}, "meta": { "requestId": "…" } }
  ```
  Errors (via `HttpExceptionFilter`):
  ```json
  { "success": false, "error": { "code": "PLOT_NOT_FOUND", "message": "…", "details": [] } }
  ```
- **Pagination:** cursor-based for large lists — `?limit=20&cursor=<id>` →
  `meta: { nextCursor, hasMore, total? }`. Offset (`?page=&pageSize=`) offered for tables.
- **Filtering/sorting:** `?status=AVAILABLE&facing=EAST&minArea=1000&sort=-basePrice`.
- **Idempotency:** mutating POSTs accept `Idempotency-Key` header.
- **Rate limiting:** Redis-backed throttler; stricter buckets on auth + public enquiry.
- **Errors → HTTP:** 400 malformed · 401 unauth · 403 RBAC · 404 missing · 409 conflict
  (e.g. plot already booked) · 422 validation · 429 throttled · 500 unexpected.

## RBAC matrix (summary)

| Capability                    | SUPER_ADMIN | SALES_MANAGER | EXECUTIVE | EDITOR | VIEWER | CUSTOMER |
| ----------------------------- | :---------: | :-----------: | :-------: | :----: | :----: | :------: |
| Manage users/roles            | ✅ | — | — | — | — | — |
| Create/edit projects & plots  | ✅ | ✅ | — | ✅ | — | — |
| Plot editor (layout save)     | ✅ | ✅ | — | ✅ | — | — |
| Change plot status            | ✅ | ✅ | ✅ | — | — | — |
| Bookings & payments           | ✅ | ✅ | ✅ | — | — | — |
| CRM leads                     | ✅ | ✅ | ✅ (own) | — | read | — |
| Reports/exports               | ✅ | ✅ | own | — | read | — |
| View dashboards               | ✅ | ✅ | ✅ | ✅ | ✅ | — |
| Customer portal               | — | — | — | — | — | ✅ (own) |

## Endpoint surface (v1)

### Auth — `/auth`
```
POST   /auth/register              Create staff/customer (invite flow for staff)
POST   /auth/login                 email+password → access token (+ refresh cookie)
POST   /auth/refresh               rotate refresh → new access token
POST   /auth/logout                revoke refresh family
GET    /auth/google                start Google OAuth
GET    /auth/google/callback       OAuth callback → tokens
GET    /auth/me                    current principal
POST   /auth/forgot-password       email reset link
POST   /auth/reset-password        consume reset token
```

### Users & RBAC — `/users` (SUPER_ADMIN)
```
GET    /users            list (filter role/status, paginated)
POST   /users            create/invite
GET    /users/:id
PATCH  /users/:id        update profile/role/status
DELETE /users/:id        soft delete
```

### Projects — `/projects`
```
GET    /projects                    public list (published) — filters: type,city,status,price
GET    /projects/:slug              public detail (media, amenities, nearby, specs, downloads)
POST   /projects                    create                       [EDITOR+]
PATCH  /projects/:id                update                       [EDITOR+]
DELETE /projects/:id                soft delete                  [SALES_MANAGER+]
POST   /projects/:id/media          attach media                [EDITOR+]
POST   /projects/:id/amenities      set amenities                [EDITOR+]
POST   /projects/:id/nearby         add nearby place             [EDITOR+]
GET    /projects/:id/stats          inventory + sales rollup     [VIEWER+]
```

### Layouts & Plots — `/projects/:projectId/layouts`, `/plots`  ★ flagship
```
GET    /projects/:pid/layouts             list layouts
POST   /projects/:pid/layouts             create layout (upload master image)  [EDITOR+]
GET    /layouts/:id                        layout + all plots (viewer/editor payload)
PATCH  /layouts/:id                        canvas/config update                 [EDITOR+]
POST   /layouts/:id/publish                publish to live site                 [SALES_MANAGER+]

GET    /projects/:pid/plots                search plots (status,facing,area,budget,corner,road)
POST   /projects/:pid/plots                create plot                          [EDITOR+]
POST   /layouts/:id/plots/bulk             bulk upsert polygons (editor save)   [EDITOR+]
GET    /plots/:id                          plot detail (+history)
PATCH  /plots/:id                          update attributes/geometry           [EDITOR+]
PATCH  /plots/:id/status                   change status → emits socket event   [EXECUTIVE+]
PATCH  /plots/:id/price                    change price → writes price history  [SALES_MANAGER+]
DELETE /plots/:id                          soft delete                          [EDITOR+]
GET    /plots/:id/history                  status + price timeline
```
`PATCH /plots/:id/status` transaction: update plot → write `PlotStatusHistory` →
refresh project rollups → invalidate cache tag `project:{pid}:plots` → `AuditLog` →
emit `plot.updated` to room `project:{pid}`.

### Bookings — `/bookings`
```
GET    /bookings                    list/filter (project,status,agent)   [EXECUTIVE+]
POST   /bookings                    reserve plot → RESERVED (409 if taken)[EXECUTIVE+]
GET    /bookings/:id
PATCH  /bookings/:id                 update status / cancel
POST   /bookings/:id/payments        record payment → receipt
GET    /bookings/:id/installments    schedule
POST   /bookings/:id/installments    generate plan
POST   /bookings/:id/agreements      attach agreement
GET    /bookings/:id/receipts
```

### Leads / CRM — `/leads`
```
GET    /leads                 pipeline board / list (status,assignee,source)
POST   /leads                 create (also public enquiry ingress)
GET    /leads/:id             detail + timeline
PATCH  /leads/:id             update status/priority/assignee (writes activity)
POST   /leads/:id/activities  add note/call/email/whatsapp
POST   /leads/:id/assign      assign executive          [SALES_MANAGER+]
POST   /leads/:id/convert     → Customer + Booking draft
```

### Customers & Portal — `/customers`, `/portal`
```
GET    /customers                 list                       [EXECUTIVE+]
POST   /customers                 create
GET    /customers/:id             detail (bookings,docs)
GET    /portal/me                 customer's own profile      [CUSTOMER]
GET    /portal/bookings           own bookings/installments   [CUSTOMER]
GET    /portal/documents          own documents/receipts      [CUSTOMER]
GET    /portal/tickets            support tickets             [CUSTOMER]
POST   /portal/tickets            open ticket                 [CUSTOMER]
```

### Media library — `/media`
```
GET    /media/folders             tree
POST   /media/folders             create folder
POST   /media/upload              presigned S3 upload → asset record (bulk)
GET    /media/assets              list (filter type/folder/tags)
DELETE /media/assets/:id          soft delete
```

### Dashboard & Reports — `/dashboard`, `/reports`
```
GET    /dashboard/overview               KPIs: available/sold/reserved/blocked, revenue, leads, visits, conversion
GET    /dashboard/projects/:id           per-project charts
GET    /reports/sales?from=&to=          sales report
GET    /reports/bookings                 bookings report
GET    /reports/payments                 payments/collections
GET    /reports/availability             plot availability snapshot
GET    /reports/price-history            price change log
POST   /reports/export                   { type, format: pdf|excel|csv } → async job → download URL
```

### Notifications — `/notifications`
```
GET    /notifications             own feed (unread first)
PATCH  /notifications/:id/read
POST   /notifications/read-all
```

### Content (public) — `/content`
```
GET    /content/blog              published posts (paginated)
GET    /content/blog/:slug
GET    /content/testimonials
GET    /content/faqs
GET    /content/partners
POST   /content/contact          contact form
POST   /content/enquiries        project/plot enquiry → Lead
POST   /content/site-visits      book site visit
GET    /content/sitemap.xml      dynamic sitemap
```

### Health — `/health`
```
GET    /health        liveness
GET    /health/db     Prisma ping
GET    /health/redis  Redis ping
```

## Realtime (Socket.IO) — namespace `/realtime`

| Event (server→client)  | Payload                                   | When |
| ---------------------- | ----------------------------------------- | ---- |
| `plot.updated`         | `{ id, projectId, status, color, price }` | plot status/price/geometry change |
| `plot.created`         | `{ plot }`                                | new plot in a published layout |
| `plot.deleted`         | `{ id, projectId }`                       | plot removed |
| `booking.created`      | `{ bookingId, plotId, projectId }`        | reservation |
| `notification.new`     | `{ notification }`                        | user-targeted |

| Event (client→server)  | Payload            | Effect |
| ---------------------- | ------------------ | ------ |
| `project.join`         | `{ projectId }`    | join room `project:{id}` |
| `project.leave`        | `{ projectId }`    | leave room |

Rooms: `project:{id}` (plot feed) and `user:{id}` (personal notifications). Redis adapter
fans events across all API replicas.
