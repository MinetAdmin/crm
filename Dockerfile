# Build and run the console in one image. The image also carries db/ and
# scripts/, so migrations run as a job from the same artefact that serves the
# app and cannot drift from it.
#
# Debian slim rather than Alpine: Prisma's engines want glibc and openssl, and
# the musl variants are a recurring source of runtime surprises.

FROM node:22-slim AS base
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec prisma generate
RUN pnpm exec next build

FROM base AS run
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/db ./db
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/package.json ./package.json
USER node
EXPOSE 3000
# Env is validated at startup, so a bad configuration stops here with a
# readable message rather than serving broken pages.
CMD ["pnpm", "start"]
