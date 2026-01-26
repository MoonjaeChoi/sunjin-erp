FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src/migrations ./src/migrations
COPY --from=builder /app/src/entities ./src/entities
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/ormconfig.ts ./ormconfig.ts
COPY --from=builder /app/run-migrations.js ./run-migrations.js
COPY docker-entrypoint.sh ./
RUN chmod +x /app/docker-entrypoint.sh
EXPOSE 3000
CMD ["/app/docker-entrypoint.sh"]
