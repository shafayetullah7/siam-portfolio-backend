FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.24.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

FROM base AS development

RUN pnpm install --frozen-lockfile

COPY . .

# Sync node_modules when package.json/lockfile change (compose uses a separate node_modules volume).
CMD ["sh", "-c", "CI=true pnpm install --frozen-lockfile && exec pnpm run start:dev"]

FROM base AS builder

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

FROM base AS production

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/drizzle ./drizzle

CMD ["pnpm", "run", "start:prod"]
