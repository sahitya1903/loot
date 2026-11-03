# Loot API image. Build from the repo root so the @loot/shared workspace is in the context:
#   docker build -f apps/api/Dockerfile -t loot-api .

FROM node:26-alpine AS deps
WORKDIR /app
# Every workspace manifest, so npm ci sees the same workspaces as the lockfile.
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
COPY packages/shared/package.json packages/shared/
# Only the API's production dependencies; no Expo/Next, no husky or Metro patch scripts.
RUN npm ci --omit=dev --workspace=apps/api --ignore-scripts && npm cache clean --force

FROM node:26-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
USER node
WORKDIR /app/apps/api
EXPOSE 4000
CMD ["node", "src/index.js"]
