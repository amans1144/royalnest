# ============================================================================
#  RoyalNest public website (Next.js) — production image.
#
#  Two stages. The builder installs the whole pnpm workspace (the lockfile
#  covers every project, so a partial copy could not satisfy --frozen-lockfile)
#  and builds only this app; the runner keeps the built tree and runs
#  `next start`.
#
#  Manifests are copied before the source so that editing a component does not
#  invalidate the install layer — that install is the slow part on a 1 vCPU VPS.
#
#  NEXT_PUBLIC_* are inlined into the client bundle at BUILD time, so they
#  arrive as build args, not runtime env. Changing one means rebuilding this
#  image; a restart is not enough. docker-compose.prod.yml passes them from
#  .env.production.
# ============================================================================

# ---- Build stage -----------------------------------------------------------
FROM node:20-alpine AS builder
RUN corepack enable
WORKDIR /repo

# Manifests only — cached until a dependency actually changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json turbo.json ./
COPY apps/website/package.json  apps/website/
COPY apps/admin/package.json    apps/admin/
COPY apps/api/package.json      apps/api/
COPY packages/components/package.json packages/components/
COPY packages/hooks/package.json      packages/hooks/
COPY packages/types/package.json      packages/types/
COPY packages/ui/package.json         packages/ui/
COPY packages/utils/package.json      packages/utils/
RUN pnpm install --frozen-lockfile

# Source. The workspace packages are consumed as TypeScript source via
# next.config.mjs `transpilePackages`, so they have no build step of their own.
COPY packages ./packages
COPY apps/website ./apps/website

ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_WEBSITE_URL
ARG NEXT_PUBLIC_PUBLISH_TOKEN
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SOCKET_URL
ARG NEXT_PUBLIC_ADMIN_EMAIL
ARG NEXT_PUBLIC_ADMIN_PASSWORD
ARG NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_GTM_ID
ARG NEXT_PUBLIC_ALLOW_INDEXING
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_WEBSITE_URL=$NEXT_PUBLIC_WEBSITE_URL \
    NEXT_PUBLIC_PUBLISH_TOKEN=$NEXT_PUBLIC_PUBLISH_TOKEN \
    NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL \
    NEXT_PUBLIC_ADMIN_EMAIL=$NEXT_PUBLIC_ADMIN_EMAIL \
    NEXT_PUBLIC_ADMIN_PASSWORD=$NEXT_PUBLIC_ADMIN_PASSWORD \
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$NEXT_PUBLIC_GOOGLE_MAPS_API_KEY \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID \
    NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID \
    NEXT_PUBLIC_ALLOW_INDEXING=$NEXT_PUBLIC_ALLOW_INDEXING \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production
RUN pnpm --filter @spb/website build

# ---- Runtime stage ---------------------------------------------------------
FROM node:20-alpine AS runner
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /repo ./
WORKDIR /repo/apps/website

# No published ports — the proxy reaches this over the internal network.
EXPOSE 3000
CMD ["pnpm", "start"]
