# EchoGPT Backend

Production-ready REST API for the **EchoGPT Chrome Extension** — a multi-AI chat assistant. Built with NestJS, PostgreSQL, Prisma, and documented with Swagger/OpenAPI.

## Tech Stack

- **Framework:** NestJS
- **Database:** PostgreSQL (hosted on Neon)
- **ORM:** Prisma
- **Auth:** JWT (access + refresh tokens, rotated on use)
- **Docs:** Swagger / OpenAPI
- **AI Providers:** OpenAI, Anthropic (Claude), Google Gemini — via a shared adapter interface

## Architecture

See [`SYSTEM_DESIGN.md`](./SYSTEM_DESIGN.md) for the full architecture, ER diagram, and design rationale.

**Key design decisions:**
- **Adapter/Strategy pattern for AI providers** — one shared interface (`AIProviderAdapter`), one class per provider. Adding a new provider means writing one class; nothing else in the codebase changes.
- **Refresh tokens are random bytes, hashed with SHA-256 before storage** — not JWTs. A stolen database dump gives an attacker nothing usable, and revoking a session is a single `DELETE`.
- **Provider API keys are encrypted at rest with AES-256-GCM**, decrypted only in memory when a request is made, and never returned in any API response (masked as `sk-••••••••XXXX`).
- **Every route is protected by default** (global `JwtAuthGuard` + `RolesGuard`), opted out per-route with `@Public()` — a stronger default than protecting routes one at a time.
- **One `ApiUsageLog` table powers both the daily rate limiter and the admin analytics dashboard**, so the two can never drift out of sync.

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (local or hosted, e.g. Neon, Supabase, Railway)

### Setup

```bash
git clone https://github.com/mmahadi-ahmedd/echogpt-backend
cd echogpt-backend
npm install
cp .env.example .env
# Fill in .env with your DATABASE_URL and generated secrets (see .env.example for the generator command)

npx prisma migrate dev
npx prisma db seed

npm run start:dev
```

Server runs at `http://localhost:3000`
Swagger docs at `http://localhost:3000/api/docs`

### Test accounts

**Admin:**
```
Email: admin@echogpt.com
Password: Admin@12345
```

**Regular user:**
```
Email: user2@example.com
Password: User@123
```

Change these credentials immediately in any real deployment.

## API Overview

| Module | Base path | Description |
|---|---|---|
| Auth | `/auth` | Register, login, refresh, logout, email verification |
| Users | `/users` | Profile, update, change password, delete account |
| Subscriptions | `/subscription` | Plan info, upgrade/downgrade, usage tracking |
| AI Providers | `/providers` | Admin-only CRUD, health checks, encrypted key storage |
| Chat | `/chat` | Send prompt, streaming, conversation history |
| Search | `/search` | AI-assisted search, history, recent, suggestions, caching |
| Admin | `/admin` | Dashboard stats, user/subscription management, analytics, logs, system health |

Full request/response schemas for every endpoint are in Swagger at `/api/docs`.

## Known Trade-offs / Not Fully Implemented

Documented honestly rather than silently left out:

- **Email verification** returns the token directly in the API response instead of sending a real email — no SMTP/mail provider was wired up, out of scope for this deadline. In production this would go through SendGrid, SES, or similar.
- **Streaming chat responses** (`POST /chat/stream`) is natively implemented for OpenAI. Claude and Gemini adapters fall back to returning the full response as a single chunk, since their native streaming SDKs weren't wired up under today's timeline.
- **Search result caching** uses a simple in-memory `Map` with a 10-minute TTL — per-process, not shared across multiple server instances. A production deployment would use Redis instead.
- **Docker** was intentionally skipped for this submission; the app runs directly via `npm run start:dev` against a cloud-hosted Postgres instance (Neon).

## Database

Schema: [`prisma/schema.prisma`](./prisma/schema.prisma)
Migrations: [`prisma/migrations/`](./prisma/migrations/)

9 core tables: `roles`, `users`, `sessions`, `subscriptions`, `ai_providers`, `conversations`, `messages`, `web_searches`, `api_usage_logs`.

## Testing

A Postman collection is included at [`postman/EchoGPT.postman_collection.json`](./postman/EchoGPT.postman_collection.json), or use the live Swagger UI at `/api/docs` to try every endpoint interactively.
