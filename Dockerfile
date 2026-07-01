# ── Stage 1: Build the React / TanStack Start frontend ────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all deps (including devDependencies needed for build)
COPY package*.json ./
RUN npm ci

# Copy source and build.
# NITRO_PRESET is hard-coded in vite.config.ts but also set here so
# Nitro's environment auto-detection doesn't accidentally override it.
COPY . .
ENV NITRO_PRESET=node
RUN npm run build

# ── Stage 2: Lean production image ────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Backend source files
COPY server.cjs     ./server.cjs
COPY start.sh       ./start.sh
COPY middleware/    ./middleware/
COPY routes/        ./routes/
COPY database/      ./database/
COPY services/      ./services/

# Built frontend + SSR server from Stage 1
# .output/public/  — static assets (CSS/JS/images) served by Nitro
# .output/server/  — Nitro Node.js SSR handler (index.mjs)
COPY --from=builder /app/.output ./.output

# Persistent uploads directory (writable by app user)
RUN mkdir -p uploads

# Make startup script executable
RUN chmod +x start.sh

# Run as non-root (HuggingFace Spaces uses UID 1000)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
 && chown -R appuser:appgroup /app

USER appuser

# HuggingFace Spaces requires port 7860 (Nitro SSR server)
EXPOSE 7860

ENV NODE_ENV=production \
    PORT=7860 \
    API_PORT=3001

# start.sh launches:
#   1. node server.cjs           → Express API on 127.0.0.1:3001
#   2. node .output/server/index.mjs → Nitro SSR on 0.0.0.0:7860
#      Nitro proxies /api/** → http://127.0.0.1:3001/api/**
CMD ["/bin/sh", "start.sh"]
