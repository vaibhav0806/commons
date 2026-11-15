FROM node:24.15.0-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24.15.0-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3007 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/migrations ./migrations
COPY --from=build --chown=node:node /app/scripts/migrate.ts ./scripts/migrate.ts
COPY --from=build --chown=node:node /app/src/lib/graph.ts /app/src/lib/graph-projection.ts ./src/lib/
COPY --from=build --chown=node:node /app/scripts/graph-sync.mjs /app/scripts/file-cleanup.mjs ./scripts/
USER node
EXPOSE 3007
CMD ["sh", "-c", "node scripts/migrate.ts && exec node server.js"]
