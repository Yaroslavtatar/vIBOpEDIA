# syntax=docker/dockerfile:1

# ==============================================================================
# Multi-stage Dockerfile for Vibopedia (Coolify & Production Ready)
# Features:
# - Debian Bookworm Slim with Node.js 22 (LTS) for full glibc & native bindings compatibility
# - Direct compatibility with glibc bindings (@rolldown/binding-linux-x64-gnu)
# - Fully satisfies better-sqlite3 engine requirement (Node >= 22)
# - Multi-stage caching for minimal image size and fast rebuilds
# - Integrated build verification test stage (test:build)
# - Secure non-root execution (user: node)
# - Persistent SQLite volume storage (/app/data)
# - Container healthcheck (/api/settings)
# ==============================================================================

# Stage 1: Base Debian Slim Environment (glibc)
FROM node:22-bookworm-slim AS base
WORKDIR /app

# Install system utilities needed for runtime and healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencies & Native Build Tools
FROM base AS dependencies
# Install tools required to compile better-sqlite3 native bindings
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    gcc \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build & test)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Stage 3: Testing & Validation
FROM dependencies AS test
WORKDIR /app
COPY . .
# Run all build verification tests (TypeScript, Vite build, SQLite schema, Docker validation)
RUN npm run test:build

# Stage 4: Frontend Builder
FROM dependencies AS builder
WORKDIR /app
COPY . .
# Compile Vite frontend assets to ./dist
RUN npm run build

# Stage 5: Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules from dependencies stage (contains compiled better-sqlite3)
COPY --from=dependencies /app/node_modules ./node_modules
# Copy compiled frontend dist from builder stage
COPY --from=builder /app/dist ./dist
# Copy backend application files and scripts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/scripts ./scripts

# Prepare persistent data directory with proper ownership
RUN mkdir -p /app/data && chown -R node:node /app

# SQLite persistent data volume
VOLUME ["/app/data"]

# Use standard non-root node user
USER node

EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/settings || exit 1

# Start Vibopedia production server
CMD ["npm", "start"]
