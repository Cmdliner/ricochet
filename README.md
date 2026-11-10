# Ricochet

Real-time messaging built around **hubs** (communities), **pods** (topic channels inside a hub) and **private chats**,
with voice notes, video notes, reactions, live typing and presence, an activity inbox and push notifications.

This repository holds everything: the mobile app, the API, the marketing website, and the code they share.

> **License.** [MIT](./LICENSE).

## Contents

- [What is in the repository](#what-is-in-the-repository)
- [What you need](#what-you-need)
- [First-time setup](#first-time-setup)
- [Running the app on a phone or emulator](#running-the-app-on-a-phone-or-emulator)
- [Everyday commands](#everyday-commands)
- [How it works](#how-it-works)
- [How the code is organised](#how-the-code-is-organised)
- [Configuration](#configuration)
- [Testing and checks](#testing-and-checks)
- [Developer tools](#developer-tools)
- [Troubleshooting](#troubleshooting)
- [Deploying](#deploying)
- [Status and what is not built yet](#status-and-what-is-not-built-yet)
- [License](#license)

## What is in the repository

One pnpm workspace. Several packages that install together and import each other.

```
ricochet/
├─ apps/
│  ├─ mobile/    Expo + React Native app (NativeWind styling, Zustand state)      @ricochet/mobile
│  ├─ api/       NestJS: REST, Socket.IO gateway, background jobs                 @ricochet/api
│  └─ web/       Next.js marketing site (landing, privacy, terms, download)       @ricochet/web
└─ packages/
   ├─ shared/    Zod schemas, event names, limits, design tokens                  @ricochet/shared
   └─ db/        Drizzle schema and SQL migrations (PostgreSQL)                   @ricochet/db
```

`shared` and `db` are the contract between the phone and the server. A request body, a response and a realtime
event are each described once, as a Zod schema in `packages/shared`, and both sides use it.

## What you need

| Tool | Why | Notes |
|---|---|---|
| **Node.js 22 or newer** | everything | developed on Node 24 |
| **pnpm 11** | package manager | `corepack enable` picks up the version pinned in `package.json` |
| **Docker** | PostgreSQL, Redis and a mail catcher for development | any Docker that supports `docker compose` |
| **ffmpeg** (optional) | video notes get a poster frame and a checked length | without it videos still send, just without a poster |
| **A phone with Expo Go**, or an Android emulator or iOS simulator | to run the mobile app | see [the phone section](#running-the-app-on-a-phone-or-emulator) |

## First-time setup

Run these from the repository root. Each step says what you should see.

**1. Install the dependencies**

```bash
pnpm install
```

**2. Build the two shared packages.** The apps import the built output, so this has to happen once before anything
else starts, and again after you change `packages/shared` or `packages/db`.

```bash
pnpm build:packages
```

**3. Create your settings file**

```bash
cp .env.example .env          # on Windows PowerShell: Copy-Item .env.example .env
```

Open `.env` and replace `JWT_SECRET` with a long random string (at least 32 characters). One way to make one:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Everything else in the file already works for local development.

**4. Start the local services.** This runs PostgreSQL, Redis and Mailpit in Docker.

```bash
pnpm infra:up
```

| Service | Address from your computer | What it is for |
|---|---|---|
| PostgreSQL | `localhost:5442` | the database |
| Redis | `localhost:6380` | the realtime adapter and job queue |
| Mailpit | `localhost:1025` (SMTP) and **http://localhost:8025** | catches every email the API sends |

The unusual ports (5442 and 6380) are deliberate, so they never clash with a Postgres or Redis you already run.

**5. Create the database tables**

```bash
pnpm db:migrate
```

**6. Start the API**

```bash
pnpm dev:api
```

Open http://localhost:3001/health. It should answer with `"status": "ok"` and `"database": "up"`.

**7. Start the app** (see the next section for how to open it on a phone)

```bash
pnpm dev:mobile:lan
```

**8. Sign in.** Ricochet has no passwords. Type any email address in the app, then open
**http://localhost:8025**. The six-digit code arrives there. Type it into the app. New accounts then choose a name
and a handle.

**9. Optional: the website**

```bash
pnpm dev:web                  # http://localhost:3000
```

## Running the app on a phone or emulator

The mobile app runs inside **Expo Go**, the free app from the Play Store or App Store. The phone has to reach two
things on your computer: the Expo dev server (port 8081) and the API (port 3001).

1. Put the phone and the computer on the **same Wi-Fi network**.
2. Start the dev server with `pnpm dev:mobile:lan`. It picks your Wi-Fi address and ignores the virtual adapters that
   Docker, WSL, Hyper-V and VirtualBox add, which otherwise can end up in the QR code.
3. Scan the QR code with Expo Go (Android) or the Camera app (iOS).
4. The app finds the API at the same address, on port 3001. To point it somewhere else, set
   `EXPO_PUBLIC_API_URL`, for example `EXPO_PUBLIC_API_URL=http://192.168.1.20:3001`.

**Using an emulator instead.** With an Android emulator running, press `a` in the Expo terminal. The app reaches your
computer at `10.0.2.2`, which it handles itself. An emulator needs no Wi-Fi at all.

**What works in Expo Go and what does not**

| Feature | Expo Go |
|---|---|
| Messaging, reactions, realtime, profile photos | yes |
| Voice and video notes (microphone and camera) | yes, after you allow the permission prompts |
| Push notifications on **Android** | no. Android Expo Go no longer supports them. Use a development build. |
| Push notifications on iOS | needs a real device and a build with push enabled |

Push registration also needs an Expo project id. Run `eas init` once inside `apps/mobile`. Until then, the app skips
push registration and everything else keeps working.

## Everyday commands

| Command | What it does |
|---|---|
| `pnpm dev:api` | API with automatic restart on change (port 3001) |
| `pnpm dev:mobile:lan` | Expo dev server using your Wi-Fi address (port 8081) |
| `pnpm dev:mobile` | Expo dev server with Expo's own address choice |
| `pnpm dev:web` | the website (port 3000) |
| `pnpm dev:packages` | rebuilds `shared` and `db` as you edit them |
| `pnpm build` | builds every package |
| `pnpm typecheck` | TypeScript across all packages |
| `pnpm lint` | lint across all packages |
| `pnpm --filter @ricochet/api test` | the API's unit tests |
| `pnpm --filter @ricochet/api test:e2e` | the API's end-to-end tests (needs `pnpm infra:up`) |
| `pnpm db:generate` | writes a new SQL migration after you change `packages/db/src/schema.ts` |
| `pnpm db:migrate` | applies pending migrations |
| `pnpm infra:up` / `pnpm infra:down` | start or stop the Docker services |

Run a command in one package with `pnpm --filter @ricochet/api <script>`. Add a dependency to one package with
`pnpm --filter @ricochet/web add some-lib`. For mobile packages that must match the Expo SDK, use
`pnpm --filter @ricochet/mobile exec expo install <package>`.

## How it works

### The shape of a request

Every API feature follows the same layers:

```
HTTP request ─▶ controller ─▶ service ─▶ Drizzle ─▶ PostgreSQL
                  │              │
                  │              └─ the rules live here (who may do this, what must be true)
                  └─ checks the sign-in token and validates the body with a shared Zod schema
```

The realtime gateway is the same idea over a socket: it checks the token, validates the payload, and calls the same
services.

### People can only see what they belong to

- A person who is not in a hub, or not on a private pod's list, gets **404, not 403**. The existence of the thing is
  not revealed.
- Hub owners can see every pod, including private ones. Admins only see the private pods they were added to.
- The same access check (`ConversationAccessService`) guards reading messages, sending, reacting, marking read and
  joining a live room, so the rules cannot drift apart.

### Messages

- **HTTP is the source of truth, and the socket only announces.** A message is saved first and announced second. A
  phone that misses an announcement catches up by asking the history endpoint again.
- **History uses cursors, not page numbers.** Message ids are UUIDv7, which sort by time, so "older than this id"
  is cheap and stable while new messages arrive.
- **Sending is safe to retry.** Every message carries a `clientId` made on the phone, with a unique index in the
  database. Sending the same one twice returns the original message instead of creating a second.
- On the phone a message appears at once as a draft, then is replaced by the saved copy when the server answers.

### Realtime

The server uses Socket.IO with a Redis adapter, so more than one API server can run. A connection joins **rooms**,
and a room decides who hears an event:

| Room | Who is in it | Used for |
|---|---|---|
| `user:{id}` | every connection of one person | unread counts, notifications, read sync across devices |
| `conversation:{id}` | people with that pod or chat open right now | new messages, typing |
| `hub:{id}` | every connection of every member of that hub | presence (online and offline) |

| Event | Direction | Meaning |
|---|---|---|
| `conversation:open` / `close` | phone to server | join or leave a conversation room, after an access check |
| `typing:start` / `stop` | phone to server, relayed | someone is typing. The server expires it after 5 seconds. |
| `message:new` / `message:updated` | server to phone | a message arrived, or changed (reaction, video processed) |
| `unread:update` | server to phone | a conversation's unread count changed |
| `presence:update` | server to phone | someone went online or offline |
| `chat:updated` | server to phone | a private chat has a new last message |
| `activity:new` / `activity:unread` | server to phone | a new notification, or the badge count changed |

When someone loses access (removed from a private pod, left a hub), their live connections are removed from the
affected rooms immediately, so they stop receiving messages.

### Unread counts, activity and presence

- Unread counts come from one SQL definition shared by the badge, the read receipt and the list. A new member only
  counts messages from after they joined.
- The activity inbox covers mentions, reactions, announcements and hub invites. Whether a person can still see a
  notification is decided in the query, so leaving a hub hides its notifications without any clean-up code.
- Presence counts connections: a person is online while they have at least one, and goes offline only after a short
  grace period, so a signal blip does not flicker.

### Media: voice notes, video notes and photos

Files go from the phone **straight to storage**. The API only hands out an upload link, then checks what arrived.

1. The phone asks for an upload link (`POST /conversations/:id/media`).
2. It uploads the file to that link.
3. It sends the message that points at the file. The server checks the file's real bytes, not just the type the
   phone claims, before saving anything.
4. Video notes are then processed in the background: ffprobe reads the real length, ffmpeg makes a poster frame, and
   everyone looking at the conversation receives `message:updated`.

Storage sits behind one small interface (`MediaStorage`):

| Provider | Setting | Use |
|---|---|---|
| Local disk | `MEDIA_PROVIDER=local` (default) | development. Files go in `apps/api/.media`. |
| Cloudflare R2 | `MEDIA_PROVIDER=r2` | production. Avatars live in a public bucket, recordings in a private one and are only reachable through links that expire. |

Adding another provider means one new class and one line in `apps/api/src/media/media.module.ts`.

### Push notifications

Also behind an interface (`PushProvider`): Expo's push service today, or a `log` provider that only writes to the
log. After a message is saved, the server notifies people who are **not** the sender, have **not** muted the
conversation, are **not** already looking at it, and (for "mentions only") were named with `@handle`. Phones that
Expo reports as gone are forgotten automatically.

## How the code is organised

### `apps/api/src`

Each folder is one NestJS module: a controller (routes), a service (rules and database), and tests.

| Folder | Responsibility |
|---|---|
| `auth` | email codes, sessions, access and refresh tokens |
| `users` | the signed-in person's profile and avatar |
| `hubs` | hubs, members, roles, invite codes, hub invites |
| `pods` | pods, private guest lists, per-person settings |
| `messages` | history, sending, reactions, read state, unread counts, recordings |
| `chats` | people search and one-to-one chats |
| `activity` | the notification inbox |
| `realtime` | the Socket.IO gateway, rooms, typing, presence |
| `media` | storage providers and upload checks |
| `push` | push providers and the rules for who gets notified |
| `jobs` | background work (video processing), runnable as its own process with `start:worker` |
| `mail`, `config`, `db`, `common`, `health` | email sending, environment validation, the database connection, shared helpers |

### `apps/mobile/src`

| Folder | Responsibility |
|---|---|
| `app` | the screens. Folders and file names become routes (Expo Router). |
| `features/hubs` | the main Zustand store, message screens' pieces, recording and playback |
| `features/activity`, `features/push` | the notification inbox, and push registration and tap handling |
| `components/ui` | buttons, sheets, text fields, the custom dialog and other building blocks |
| `lib` | API client, realtime socket, media upload, dialogs, push |
| `stores` | the sign-in state |
| `theme` | light and dark colours |

The app keeps one store as a cache of what the server knows. Server answers go through small adapter functions that
turn them into the shapes the screens use.

### `packages`

- `shared`: Zod schemas, event names, limits and colours. Built with tsup to both ESM and CommonJS so Next, Metro and
  NestJS can all import it.
- `db`: the Drizzle schema (`src/schema.ts`) and the generated SQL migrations (`drizzle/`).

## Configuration

All server settings live in `.env` at the repository root. `.env.example` explains each one.

| Setting | Meaning | Default |
|---|---|---|
| `DATABASE_URL`, `REDIS_URL` | where PostgreSQL and Redis are | the Docker services |
| `JWT_SECRET` | signs sign-in tokens, at least 32 characters | **you must change it** |
| `PORT` | API port | `3001` |
| `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM` | outgoing email | Mailpit |
| `MEDIA_PROVIDER` | `local` or `r2` | `local` |
| `R2_*` | Cloudflare R2 account, keys, two buckets and the public address | unset |
| `PUSH_PROVIDER` | `expo` or `log` | `expo` |
| `FFMPEG_PATH`, `FFPROBE_PATH` | where ffmpeg and ffprobe are | `ffmpeg`, `ffprobe` on the path |

The mobile app has one optional setting: `EXPO_PUBLIC_API_URL`.

## Testing and checks

```bash
pnpm typecheck                       # TypeScript, all packages
pnpm lint                            # lint
pnpm --filter @ricochet/api test     # API unit tests
pnpm --filter @ricochet/api test:e2e # API end-to-end tests, needs pnpm infra:up
```

The API tests cover the pure rules: permissions, pagination, reaction grouping, mention parsing, typing expiry,
presence timing, signed links, upload content checks, push rules and provider behaviour.

The end-to-end tests (`apps/api/test`) start the real API, with a real database, Redis and sockets, and act like the
phone does: sign in with an emailed code, create hubs, join, send messages over a socket, check unread counts and
the activity inbox. They build the API first, then run it against a throwaway database called `ricochet_test` (rebuilt
on every run) and Redis database 15, so your development data is never touched. The only fake is the mail service,
which hands the test the code instead of sending it.

GitHub Actions (`.github/workflows/ci.yml`) runs the build, typecheck, lint, unit tests and end-to-end tests on every
push and pull request.

## Developer tools

Two scripts in `apps/api/scripts` let you act as other people without a phone. Both need the API and the Docker
services running.

```bash
# prints the tokens of a brand new throwaway user
node apps/api/scripts/dev-login.mjs "Ada Lovelace"

# a terminal stand-in for the phone: signs in, connects the socket and prints every event
node apps/api/scripts/socket-client.mjs "Ada"
```

Run the second one in two terminals to watch events travel between two people. Its commands include `hub`, `join`,
`open`, `say`, `typing`, `read`, `who`, `find`, `dm`, `chats`, `invite`, `unread` and `activity`. The top of
`socket-client.mjs` lists them all.

## Troubleshooting

**Expo Go says `java.io.IOException: failed to download remote update`.** The phone cannot download the app from
your computer. In order:

1. The phone must be on the same Wi-Fi network, not mobile data, with any VPN off.
2. Start with `pnpm dev:mobile:lan` so the QR code carries your Wi-Fi address.
3. Open `http://<your-computer-ip>:8081` in the phone's browser. If that does not load, the problem is the network
   or the computer's firewall (Windows: allow Node.js on your network profile), not the app. Some routers isolate
   devices from each other.
4. Fully close Expo Go, clear its storage, and scan again. The first load after a change takes 15 to 20 seconds.
5. As a way around Wi-Fi entirely: use an emulator, or plug the phone in over USB, run
   `adb reverse tcp:8081 tcp:8081 && adb reverse tcp:3001 tcp:3001`, set
   `EXPO_PUBLIC_API_URL=http://localhost:3001`, and open `exp://localhost:8081`.

**The app opens but cannot sign in or load anything.** The API is not running. Start it with `pnpm dev:api`.

**`Cannot find module '@ricochet/shared'` (or `@ricochet/db`).** The shared packages have not been built. Run
`pnpm build:packages`.

**The API cannot connect to the database.** Run `pnpm infra:up` and wait a few seconds. Check the Docker containers
are healthy.

**No sign-in email arrives.** Look in Mailpit at http://localhost:8025. Nothing is sent to real inboxes in development.
Sign-in codes are limited to five per hour per address.

**Metro does not show a change you just made.** Restart it with `--clear`: `pnpm dev:mobile:lan --clear`.

**Videos stay "processing" or have no poster.** ffmpeg and ffprobe are not installed, or not on the path. Install
them, or set `FFMPEG_PATH` and `FFPROBE_PATH`.

**Voice or video notes will not send.** The server checks the file's real contents. If a recording was empty or
unreadable on the phone, it is refused with "That file is not a valid recording". Record it again.

## Deploying

- **Website.** `apps/web` deploys to Vercel. The project settings are in `apps/web/vercel.json`. Set the project's
  root directory to `apps/web`.
- **API.** Build with `pnpm --filter @ricochet/api build`, run with `start:prod`. It needs PostgreSQL, Redis, an SMTP
  provider and a strong `JWT_SECRET`. For production also set `MEDIA_PROVIDER=r2` with its `R2_*` settings. Run
  `pnpm db:migrate` against the production database before starting a new version.
- **Worker.** Video processing runs inside the API process by default. To run it separately, start
  `pnpm --filter @ricochet/api start:worker` on a machine that has ffmpeg.
- **Mobile.** Release builds go through EAS (`eas build`). The bundle id and Android package are `app.ricochet.mobile`.
  Push notifications need the Expo project id from `eas init`, and Apple and Google credentials configured in EAS.

## Status and what is not built yet

Built: sign-in with email codes, hubs, pods (open and private), roles and invites, messages with history, reactions,
typing, presence, read state and unread counts, the activity inbox, one-to-one chats and people search, voice and
video notes, profile photos, push notifications, replies, @tagging with suggestions, blocking and reporting, and the
marketing site.

Blocking is silent: the person is never told, their messages are hidden from you and never notify you, and you cannot
write to someone you blocked until you unblock them. Reports are saved in the `reports` table (with a copy of the
message text) for a moderator to read; there is no moderator screen yet.

Not built yet:

- Optional PIN or password sign-in
- App store release setup (icons, store listings, a real support address)

Decisions so far: no group chats outside hubs (private chats are always one to one), email-code sign in, no end-to-end encryption in version 1, voice notes up to 10 minutes, video notes
up to 60 seconds, groups up to 40 people, no calls in version 1.

## License

Released under the [MIT License](./LICENSE). Copyright (c) 2026 Abiade Abdulazeez.
