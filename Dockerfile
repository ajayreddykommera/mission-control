# ─────────────────────────────────────────────────────────────────────────────
# Mission Control — multi-stage Dockerfile
#
# Stage 1 (builder): installs all deps and builds the Nitro/TanStack Start app.
# Stage 2 (runner):  copies only the compiled output — no source, no dev deps.
#
# Build:
#   docker build -t mission-control .
#
# Run (local / dev Azure Tables):
#   docker run -p 3000:3000 \
#     -e AZURE_TABLES_ENV=azure \
#     -e AZURE_STORAGE_ACCOUNT_URL=https://<account>.table.core.windows.net \
#     -e AZURE_TENANT_ID=<tenant> \
#     -e AZURE_CLIENT_ID=<client-id> \
#     -e AZURE_CLIENT_SECRET=<secret> \
#     mission-control
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Enable corepack so pnpm is available without a separate install step
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy manifests first — Docker cache layer means deps only reinstall on changes
COPY package.json pnpm-lock.yaml ./

# Install all deps (including devDeps needed for the build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# build:prod loads .env.prod automatically via Vite's --mode flag.
# Values are baked into the JS bundle from that file.
# To override individual values (e.g. in CI), pass --build-arg:
#   docker build --build-arg PROD_URL=https://custom.example.com ...
ARG APP_ENV
ARG DEV_URL
ARG STAGE_URL
ARG PROD_URL

# Only set ENV if the ARG was explicitly provided — otherwise .env.prod wins.
RUN [ -n "$APP_ENV" ] && export APP_ENV=$APP_ENV; \
    [ -n "$DEV_URL" ] && export DEV_URL=$DEV_URL; \
    [ -n "$STAGE_URL" ] && export STAGE_URL=$STAGE_URL; \
    [ -n "$PROD_URL" ] && export PROD_URL=$PROD_URL; \
    pnpm build:prod

# ── Stage 2: runner ───────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Only copy the compiled Nitro output — no source code or dev dependencies
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Runtime secrets are injected via environment variables at container start.
# AZURE_STORAGE_CONNECTION_STRING is only needed when AZURE_TABLES_ENV=local.
ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Nitro emits a single server entry point at .output/server/index.mjs
CMD ["node", ".output/server/index.mjs"]
