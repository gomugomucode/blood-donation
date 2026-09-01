# ==============================================================================
# HemaCare Express Backend — Production Multi-Stage Dockerfile
# ==============================================================================

FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies cleanly
RUN npm ci

# Copy server source code and prisma schema
COPY server/ ./server/

# Generate Prisma Client & Build TypeScript
WORKDIR /app/server
RUN npx prisma generate
RUN npm run build

# Prune dev dependencies for lean production image
WORKDIR /app
RUN npm prune --omit=dev --workspace=server

# ==============================================================================
# Production Image
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=5000

# Install dumb-init for proper PID 1 signal handling (graceful shutdown)
RUN apk add --no-cache dumb-init

# Copy runtime dependencies and compiled output from builder
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/server/node_modules /app/server/node_modules
COPY --from=builder /app/server/dist /app/server/dist
COPY --from=builder /app/server/prisma /app/server/prisma
COPY --from=builder /app/server/package.json /app/server/package.json

# Create non-root user for security hardening
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 5000

# Dumb-init passes SIGTERM/SIGINT directly to node process for graceful drainage
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
