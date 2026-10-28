# Multi-stage Dockerfile for Vibopedia (Coolify Compatible)
FROM node:20-alpine AS builder

# Install build tools required for native C++ extensions (better-sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy full application code and build
COPY . .
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

# Install python3 & build tools if needed for SQLite runtime bindings
RUN apk add --no-cache python3 make g++

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and built assets from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create persistent storage directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app

VOLUME ["/app/data"]

USER node

EXPOSE 3000

# Start Express server with tsx or node runner
CMD ["npx", "tsx", "server.ts"]
