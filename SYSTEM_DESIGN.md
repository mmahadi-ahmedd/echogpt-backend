# EchoGPT Backend — System Design

## 1. High-Level Architecture

```mermaid
flowchart TB
    Ext[Chrome Extension] -->|HTTPS + JWT| GW[NestJS API Gateway]

    subgraph API["NestJS Application"]
        GW --> Auth[Auth Module]
        GW --> Users[Users Module]
        GW --> Sub[Subscription Module]
        GW --> Prov[Provider Module]
        GW --> Chat[Chat Module]
        GW --> Search[Search Module]
        GW --> Admin[Admin Module]

        Chat --> Router[Provider Router / Strategy Layer]
        Search --> Router
        Router --> Adapter1[OpenAI Adapter]
        Router --> Adapter2[Claude Adapter]
        Router --> Adapter3[Gemini Adapter]

        Auth --> Guard[JWT + Roles Guards]
        Chat --> Usage[Usage Limiter]
        Guard -.applies to.-> Users
        Guard -.applies to.-> Sub
        Guard -.applies to.-> Prov
        Guard -.applies to.-> Admin
    end

    Adapter1 --> OpenAI[(OpenAI API)]
    Adapter2 --> ClaudeAPI[(Anthropic API)]
    Adapter3 --> Gemini[(Gemini API)]

    API --> DB[(PostgreSQL)]
```

## 2. Core Design Principle: Strategy/Adapter Pattern for Providers

Instead of branching logic per provider, one contract is shared across all AI providers:

```typescript
interface AIProviderAdapter {
  sendMessage(messages: ChatMessage[], apiKey: string, model: string): Promise<AIResponse>;
  healthCheck(apiKey: string, model: string): Promise<HealthStatus>;
}
```

`OpenAIAdapter`, `ClaudeAdapter`, and `GeminiAdapter` each implement this interface independently. A `ProviderRegistryService` resolves the correct adapter by name at runtime. Adding a fourth provider in the future means writing one new class — nothing else in the codebase needs to change.

## 3. Module Breakdown

| Module | Responsibility |
|---|---|
| `AuthModule` | Register, login, refresh, logout, email verification |
| `UsersModule` | Profile, roles, account deletion |
| `SubscriptionModule` | Plans, usage limits |
| `ProviderModule` | CRUD on AI providers, encrypted keys, health checks |
| `ChatModule` | Send prompt, streaming, conversation history |
| `SearchModule` | Web search, history, suggestions, caching |
| `AdminModule` | Dashboard, analytics, logs, system health |
| `CommonModule` | Shared guards, filters, decorators |

## 4. Database Design (Entities & Relations)

```mermaid
erDiagram
    USERS ||--o{ SESSIONS : has
    USERS ||--|| SUBSCRIPTIONS : has
    USERS ||--o{ CONVERSATIONS : owns
    USERS ||--o{ WEB_SEARCHES : makes
    USERS ||--o{ API_USAGE_LOGS : generates
    USERS }o--|| ROLES : assigned
    CONVERSATIONS ||--o{ MESSAGES : contains
    AI_PROVIDERS ||--o{ MESSAGES : used_by
    AI_PROVIDERS ||--o{ API_USAGE_LOGS : tracked_in

    USERS {
        uuid id PK
        string email
        string passwordHash
        uuid roleId FK
        boolean isEmailVerified
        timestamp createdAt
    }
    ROLES {
        uuid id PK
        string name
    }
    SESSIONS {
        uuid id PK
        uuid userId FK
        string refreshTokenHash
        timestamp expiresAt
    }
    SUBSCRIPTIONS {
        uuid id PK
        uuid userId FK
        enum plan
        int dailyLimit
    }
    AI_PROVIDERS {
        uuid id PK
        string name
        string model
        text encryptedApiKey
        boolean isEnabled
        boolean isDefault
    }
    CONVERSATIONS {
        uuid id PK
        uuid userId FK
        string title
    }
    MESSAGES {
        uuid id PK
        uuid conversationId FK
        uuid providerId FK
        enum role
        text content
        int tokensUsed
    }
    API_USAGE_LOGS {
        uuid id PK
        uuid userId FK
        uuid providerId FK
        string endpoint
        int statusCode
        timestamp createdAt
    }
    WEB_SEARCHES {
        uuid id PK
        uuid userId FK
        string query
        text resultSummary
    }
```

## 5. Relationship Reference

| Relationship | Type | FK location |
|---|---|---|
| roles → users | 1:N | users.roleId |
| users → sessions | 1:N | sessions.userId |
| users → subscriptions | 1:1 | subscriptions.userId (unique) |
| users → conversations | 1:N | conversations.userId |
| conversations → messages | 1:N | messages.conversationId |
| ai_providers → messages | 1:N | messages.providerId (nullable) |
| users → web_searches | 1:N | web_searches.userId |
| users → api_usage_logs | 1:N | api_usage_logs.userId |
| ai_providers → api_usage_logs | 1:N | api_usage_logs.providerId (nullable) |

## 6. Key Flows

**Auth (access + refresh token):**

```
Login → verify password → issue access token (15m) + refresh token (7d, hashed in Sessions)
Access token expires → client calls /auth/refresh
  → server checks hash match + expiry → issues new pair, rotates the session row
Logout → delete session row → refresh token is now useless even if stolen
```

**Chat request:**

```
POST /chat → JwtGuard → check daily usage limit
  → ProviderRegistryService resolves adapter (requested provider or default)
  → decrypt key → adapter.sendMessage() → catch provider errors gracefully
  → save Message rows → write ApiUsageLog → return response
```

## 7. Design Trade-offs

- **Global providers, admin-managed** — not per-user API keys, to keep key management centralized and auditable.
- **Refresh tokens as hashed random bytes**, not JWTs — allows real server-side revocation, unlike a stateless JWT refresh token.
- **In-memory search cache** instead of Redis — simpler for this project's scope, documented here as a clear production upgrade path.
- **Streaming implemented natively for OpenAI only** — Claude and Gemini adapters fall back to returning a single full-response chunk.
- **Docker was intentionally skipped** for this submission; the app runs directly against a cloud-hosted PostgreSQL instance (Neon).