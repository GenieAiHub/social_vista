# Social Vista — production image.
# Builds the React SPA (social-vista) and the API bundle (api-server). At runtime a
# single Node process serves /api/* and the built SPA. node_modules + source are kept
# so the compose `migrate` service can run drizzle-kit push against the local Postgres.
FROM node:20-slim

RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

# Full workspace is needed: pnpm workspace install + Vite alias "@assets" -> attached_assets.
COPY . .

RUN pnpm install --frozen-lockfile

RUN NODE_ENV=production pnpm --filter @workspace/social-vista run build \
 && pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
