# The API as a container. Build from the repository root:  docker build -f apps/api/Dockerfile .
# The same image runs the API and, with a different command, the database migrations.

FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.20.0 --activate

# Dependencies first, from the manifests alone, so a code change does not reinstall everything.
FROM base AS build
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY packages/shared/package.json packages/shared/
COPY packages/db/package.json packages/db/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile --filter @ricochet/api...

COPY packages packages
COPY apps/api apps/api
RUN pnpm --filter @ricochet/shared build && pnpm --filter @ricochet/db build && pnpm --filter @ricochet/api build
# A self-contained copy of the API with only its production dependencies. Injecting the workspace packages copies
# @ricochet/db and @ricochet/shared (with their own dependencies) into the result. Without it they stay symlinks to /repo,
# which does not exist in the runtime image.
RUN pnpm --config.inject-workspace-packages=true --filter @ricochet/api deploy --prod /out

FROM node:22-bookworm-slim AS runtime
# ffmpeg makes the poster frame for video notes and checks their real length.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data/media && chown -R node:node /data
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /out ./
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
