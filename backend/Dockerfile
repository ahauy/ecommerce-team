FROM node:22-alpine AS base
RUN npm install -g pnpm@10.28.0
WORKDIR /app

FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile --filter backend
COPY backend/ backend/
RUN pnpm --filter backend run build
RUN pnpm --filter backend deploy --prod --legacy /prod/backend

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /prod/backend/node_modules ./node_modules
COPY --from=build --chown=node:node /prod/backend/package.json ./package.json
COPY --from=build --chown=node:node /app/backend/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main"]
