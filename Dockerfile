# =============================================================
#  Dockerfile — Next.js 15 standalone + Chromium (untuk Puppeteer PDF)
#  Dioptimasi ringan untuk VPS 2–4 GB. Chromium dari repo Alpine
#  (bukan download bundled) supaya image kecil & --no-sandbox aman.
# =============================================================

# ---------- Stage 1: deps ----------
FROM node:20-alpine AS deps
WORKDIR /app
# Jangan download Chromium bundled — runner memakai Chromium sistem Alpine
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
RUN npm ci

# ---------- Stage 2: builder ----------
FROM node:20-alpine AS builder
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma client wajib digenerate sebelum build
RUN npx --yes prisma@6.19.3 generate
RUN npm run build

# ---------- Stage 3: runner (produksi) ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Jakarta
# Beri tahu Puppeteer memakai Chromium sistem, JANGAN download sendiri
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Chromium + font + tzdata (WIB) + TINI (Reaper / Pembunuh Zombie Chromium)
RUN apk add --no-cache \
    chromium \
    nss freetype harfbuzz ca-certificates ttf-freefont font-noto-emoji \
    tzdata openssl tini \
  && cp /usr/share/zoneinfo/Asia/Jakarta /etc/localtime \
  && echo "Asia/Jakarta" > /etc/timezone

# User non-root demi keamanan
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Output standalone Next.js
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma engine + skema (dibutuhkan runtime & untuk migrate deploy)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

# Folder upload (DI LUAR public/ agar Next.js tidak 404 saat driver upload)
RUN mkdir -p /app/data/uploads && chown -R nextjs:nodejs /app/data
ENV UPLOAD_DIR=/app/data/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

# tini -g: teruskan sinyal ke seluruh process group + reap semua yatim.
ENTRYPOINT ["/sbin/tini", "-g", "--"]
# `exec` → node MENGGANTIKAN sh, bukan jadi anaknya.
CMD ["sh", "-c", "npx --yes prisma@6.19.3 migrate deploy && exec node server.js"]