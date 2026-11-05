# Ricochet

Real-time messaging with hubs, pods and private chats, voice notes and video notes.

This is a pnpm workspace. One repo, several packages that install together and import each other.

```
ricochet/
├─ apps/
│  ├─ web/       Next.js website (@ricochet/web)
│  ├─ mobile/    Expo app with NativeWind (@ricochet/mobile)
│  └─ api/       NestJS: REST, Socket.IO gateway, background worker (@ricochet/api)
└─ packages/
   ├─ shared/    Zod schemas, limits, event names, design tokens (@ricochet/shared)
   └─ db/        Drizzle schema and migrations (@ricochet/db)
```

## Start

```bash
pnpm install
pnpm build:packages         # builds shared and db, which the apps import
cp .env.example .env
pnpm infra:up               # Postgres, Redis and a local mail catcher in Docker
pnpm db:migrate             # create the tables

pnpm dev:api                # http://localhost:3001/health
pnpm dev:web                # http://localhost:3000
pnpm dev:mobile             # Expo dev server
```

While you edit `packages/*`, keep `pnpm dev:packages` running so the apps see changes.

## How the workspace fits together

- `pnpm-workspace.yaml` lists which folders are packages and holds shared version pins (the `catalog`).
- A package depends on another with `"@ricochet/shared": "workspace:*"`. pnpm links the folder instead of downloading it.
- `shared` and `db` are built with tsup to both ESM and CommonJS, so Next, Metro and NestJS can all import them.
- Run a command in one package with `pnpm --filter @ricochet/api <script>`, or in all with `pnpm -r <script>`.
- Add a dependency to one package: `pnpm --filter @ricochet/web add some-lib`.
- Mobile dependencies that must match the Expo SDK: use `pnpm --filter @ricochet/mobile exec expo install <package>`.

## Decisions

Hubs, pods and chats. Email code or link sign in. No end-to-end encryption in version 1.
Voice notes up to 10 minutes, video notes up to 60 seconds, groups up to 40 people. No calls in version 1.
