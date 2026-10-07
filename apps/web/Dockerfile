# Imagem do site público. Build a partir da raiz do monorepo:
#   docker build -f apps/web/Dockerfile -t alupa-web .
# Em produção, passar --build-arg ALUPA_INDEXAR=true para liberar buscadores.

FROM node:24-alpine AS base
RUN npm install -g pnpm@12.4.1
WORKDIR /repo

FROM base AS build
ARG ALUPA_INDEXAR=false
ENV ALUPA_INDEXAR=$ALUPA_INDEXAR NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN pnpm install --frozen-lockfile --filter "@alupa/web..."
RUN pnpm --filter @alupa/web build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /repo/apps/web/.next/standalone ./
COPY --from=build --chown=app:app /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=app:app /repo/apps/web/public ./apps/web/public
USER app
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
