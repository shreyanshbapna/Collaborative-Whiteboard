# Excalidraw Monorepo

Collaborative whiteboard project built with a Turborepo monorepo:

- `apps/excalidraw-web`: Next.js frontend (canvas UI + auth screens)
- `apps/http-backend`: Express API for auth, room creation, and shape history
- `apps/ws-backend`: WebSocket server for real-time room updates
- Shared workspace packages for schema validation, DB client, configs, UI, and tooling

## Architecture

`excalidraw-web` connects to:

- HTTP API (`http-backend`) for signup/signin, room lookup, and previous shapes
- WebSocket server (`ws-backend`) for real-time drawing events

Both backends use Prisma + PostgreSQL via `@repo/db`.

## Monorepo structure

```text
.
├─ apps/
│  ├─ excalidraw-web/     # Next.js 16 app
│  ├─ http-backend/       # Express + JWT + Prisma
│  └─ ws-backend/         # ws + JWT + Prisma
├─ packages/
│  ├─ common/             # zod schemas shared with backend
│  ├─ common-backend/     # backend shared exports
│  ├─ db/                 # Prisma schema/config/client
│  ├─ secret/             # shared constants (JWT_SECRET, BACKEND_URL, WS_URL)
│  ├─ ui/                 # shared UI package scaffold
│  ├─ eslint-config/      # lint presets
│  ├─ typescript-config/  # tsconfig presets
│  └─ tailwind-css/       # tailwind/postcss deps
└─ turbo.json
```

## Tech stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS
- HTTP API: Express 5, JWT, bcrypt, Zod
- Realtime: WebSocket (`ws`)
- Database: PostgreSQL + Prisma
- Tooling: pnpm workspaces + Turborepo

## Prerequisites

- Node.js `>=18` (repo engine requirement)
- `pnpm` `9.x` (repo package manager)
- PostgreSQL running locally or remotely

## Setup

From repository root:

```bash
pnpm install
```

### 1) Configure database URL

Create `packages/db/.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
```

### 2) Generate Prisma client / run migrations

From repo root:

```bash
pnpm --filter @repo/db exec prisma generate
pnpm --filter @repo/db exec prisma migrate dev
```

### 3) Verify shared runtime constants

This project currently uses constants in `packages/secret/src/config.ts`:

- `JWT_SECRET`
- `BACKEND_URL` (default: `http://localhost:3001`)
- `WS_URL` (default: `ws://localhost:8080`)

Update them if your local ports/hosts differ.

## Run the project

### Start everything with Turborepo

```bash
pnpm dev
```

This runs `turbo run dev` across workspaces.

### Start services individually

Use separate terminals:

```bash
pnpm --filter http-backend dev
pnpm --filter ws-backend dev
pnpm --filter excalidraw-web dev
```

Default ports used in code:

- Frontend: `3000` (Next.js default)
- HTTP backend: `3001`
- WebSocket backend: `8080`

## Available root scripts

From repository root:

```bash
pnpm dev          # turbo run dev
pnpm build        # turbo run build
pnpm lint         # turbo run lint
pnpm check-types  # turbo run check-types
pnpm format       # prettier --write "**/*.{ts,tsx,md}"
```

## API summary (HTTP backend)

Base URL: `http://localhost:3001`

- `POST /signup`  
  Body: `{ name, email, password }`
- `POST /signin`  
  Body: `{ email, password }` -> returns JWT token
- `POST /create-room` (auth required)  
  Header includes `token`  
  Body: `{ name }`
- `GET /room/:slug`  
  Returns room id for slug
- `GET /shapes/:roomId`  
  Returns latest 50 stored chat/shape messages

## WebSocket message summary (ws backend)

Connect to: `ws://localhost:8080/?token=<jwt>`

Message types handled:

- `join_room` with `roomId`
- `leave_room` with `roomId`
- `chat` with `roomId` and serialized shape payload

On `chat`, server persists message to DB and broadcasts to users in the same room.

## Frontend routes (high level)

- `/` landing page
- `/signup` signup page
- `/signin` signin page
- `/create-room` room creation/auth flow page
- `/canvas/[slug]` collaborative canvas by room slug

## Notes

- `http-backend` and `ws-backend` `dev` scripts currently run a build and then start Node (no file-watch process).
- Secrets and service URLs are currently checked in as source constants in `@repo/secret`.
- Prisma schema lives at `packages/db/prisma/schema.prisma`.

## Troubleshooting

- If API calls fail from frontend, verify `BACKEND_URL` in `packages/secret/src/config.ts`.
- If socket connection fails, verify `WS_URL` and ensure ws backend is running.
- If backend fails to start with DB errors, confirm `packages/db/.env` and PostgreSQL connectivity.
