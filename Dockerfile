# ── Stage 1: Build the React / TanStack Start frontend ────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install all deps (including devDependencies needed for build)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Lean production image ────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Backend source files
COPY server.cjs     ./server.cjs
COPY middleware/    ./middleware/
COPY routes/        ./routes/
COPY database/      ./database/
COPY services/      ./services/

# Built frontend + SSR server from Stage 1
COPY --from=builder /app/.output ./.output

# Ensure index.html exists (fallback for SPA routing)
RUN mkdir -p .output/public && \
    test -f .output/public/index.html || echo '<!doctype html><html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>S.D. Model Sr. Sec. School, Karnal — Management System</title></head><body><div id="root"></div><script type="module" src="/assets/index-6bXTEkIM.js"><\/script></body></html>' > .output/public/index.html

# Persistent uploads directory (writable by app user)
RUN mkdir -p uploads

# Run as non-root (HuggingFace Spaces uses UID 1000)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
 && chown -R appuser:appgroup /app

USER appuser

# HuggingFace Spaces requires port 7860
EXPOSE 7860

ENV NODE_ENV=production \
    PORT=7860

CMD ["node", "server.cjs"]
