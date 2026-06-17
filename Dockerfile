FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat git && corepack enable

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY scripts/postinstall-prisma.mjs ./scripts/
RUN pnpm fetch --prod
RUN pnpm install --frozen-lockfile --prefer-offline

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runner
WORKDIR /app

ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
LABEL org.opencontainers.image.source="https://github.com/nabil0x/IELTS"

ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "server.js"]

FROM base AS runner-worker
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json
RUN chown -R worker:nodejs /app
USER worker
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "const Redis=require('ioredis');const client=new Redis(process.env.REDIS_URL,{maxRetriesPerRequest:1,enableOfflineQueue:false,lazyConnect:true});(async()=>{try{await client.connect();const pong=await client.ping();await client.quit();process.exit(pong==='PONG'?0:1);}catch{try{client.disconnect();}catch{}process.exit(1);}})()"
CMD ["node", "node_modules/.bin/tsx", "src/workers/index.ts"]
