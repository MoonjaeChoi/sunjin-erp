FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
# Compile TypeScript migrations to JavaScript
RUN npx tsc -p tsconfig.migrations.json

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy Next.js standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy compiled migrations and runner
COPY --from=builder /app/dist/migrations ./dist/migrations
COPY --from=builder /app/run-migrations.js ./run-migrations.js

# Copy node_modules for migration runner (typeorm, oracledb)
COPY --from=builder /app/node_modules ./node_modules

# Copy entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
CMD ["/app/docker-entrypoint.sh"]
