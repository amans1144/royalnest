# ============================================================================
#  RoyalNest API (NestJS + Prisma) — production image.
#
#  Internal-only: no published port. The website reaches it as http://api:4000
#  over the compose network; nothing outside Docker can route to it.
#
#  This keeps the whole built workspace rather than running `pnpm --prod deploy`
#  to prune it. `pnpm deploy` re-materialises node_modules from the store, which
#  drops the Prisma client generated during the build — the container then dies
#  at startup with "MODULE_NOT_FOUND: .prisma/client". Keeping the tree costs
#  disk and keeps the generated client exactly where Prisma resolves it, which
#  is the same trade-off the website and admin images already make.
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

COPY packages ./packages
COPY apps/api ./apps/api

# Generate the Prisma client, then compile.
RUN pnpm --filter @spb/api prisma:generate \
 && pnpm --filter @spb/api build

# ---- Runtime stage ---------------------------------------------------------
FROM node:20-alpine AS runner
RUN corepack enable
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=builder /repo ./
WORKDIR /repo/apps/api

EXPOSE 4000
CMD ["node", "dist/main.js"]
