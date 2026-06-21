# Architecture

## Overview

```
Browser (Vite dev :20128 / production :20130)
    │
    ├── React 19 SPA (Tailwind CSS, Radix UI)
    │
    └── API proxy → Express 5 (:20130)
                        │
                        ├── Routes (auth, config, chat, chats, skills, stats, tunnel, combos)
                        │
                        ├── Prisma ORM → SQLite (dev.db)
                        │
                        └── AI Provider APIs (OpenAI, Anthropic, Google, etc.)
```

**Two-server dev setup:** Vite dev server on port 20128 proxies `/api/*` to Express on port 20130. In production, Express serves the built SPA from `dist/`.

## Directory Structure

```
dashboard/
├── src/                          # React frontend
│   ├── routes/
│   │   ├── chat.tsx              # Chat page (SSE streaming, tool calls display, image attachments)
│   │   ├── login.tsx             # Login page
│   │   ├── overview.tsx          # Dashboard overview
│   │   ├── personality.tsx       # Personality config
│   │   ├── settings.tsx          # Provider & settings management
│   │   ├── skills.tsx            # Skills CRUD
│   │   └── community-skills.tsx  # Community skill store
│   ├── components/               # UI components (Radix-based)
│   │   ├── ui/                   # Primitive UI (card, badge, switch, label, select, slider, dialog, etc.)
│   │   ├── chat-sidebar.tsx      # Chat history sidebar
│   │   ├── markdown.tsx          # Markdown renderer
│   │   ├── token-chart.tsx       # Token usage chart
│   │   └── theme-toggle.tsx      # Dark/light toggle
│   ├── lib/
│   │   ├── api.ts                # API client
│   │   └── theme-context.tsx     # Theme provider
│   └── components/ui/            # Shared UI primitives
│
├── server/                       # Express backend
│   ├── index.ts                  # Express app entry point
│   ├── routes/
│   │   ├── auth.ts               # Login/logout/password
│   │   ├── config.ts             # Providers, personality, settings
│   │   ├── chat.ts               # SSE chat streaming endpoint
│   │   ├── chats.ts              # Conversation CRUD
│   │   ├── skills.ts             # Skills CRUD + install from GitHub
│   │   ├── community-skills.ts   # Community skill store listing
│   │   ├── combos.ts             # Model combo CRUD
│   │   ├── stats.ts              # Token usage stats + uptime
│   │   └── tunnel.ts             # Cloudflare Tunnel management
│   ├── lib/
│   │   ├── ai.ts                 # AI streaming core (tool loop, multi-provider)
│   │   ├── tools.ts              # Tool definitions + execution (file tools, web search)
│   │   ├── auth-middleware.ts     # Session-based auth (SQLite-backed)
│   │   ├── cache.ts              # Response caching with TTL
│   │   └── tunnel.ts             # Cloudflare tunnel process management
│   ├── prisma/
│   │   ├── schema.prisma         # Database schema
│   │   ├── client.ts             # Prisma client singleton
│   │   └── seed.ts               # Seed data
│   └── dist/                     # Built frontend (production)
│
├── vite.config.ts                # Vite + proxy config
├── tsconfig.json                 # Frontend TS config
└── tsconfig.node.json            # Server TS config
```

## Database Schema (SQLite)

### Config
Singleton app configuration (`id: 'main'`).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| password | String | — | bcrypt-hashed password |
| cavemanMode | Boolean | false | Caveman response mode |
| cacheEnabled | Boolean | false | Response caching |
| cacheTTL | Int | 300 | Cache TTL in seconds |
| avatarUrl | String | "" | User avatar URL |
| themeMode | String | "dark" | dark/light |
| themeAccent | String | "indigo" | Accent color |
| workingDir | String | "" | File system tools directory |
| tunnelUrl | String | "" | Cloudflare tunnel URL |
| tunnelPort | Int | 20130 | Tunnel target port |

### Provider
AI provider configuration.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Provider ID (openai, anthropic, google, groq, openrouter) |
| name | String | Display name |
| apiKey | String | API key |
| selectedModel | String | Active model ID |
| baseUrl | String | API base URL |
| isActive | Boolean | Currently active provider |

### Personality
AI behavior configuration.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| systemPrompt | String | "You are a helpful AI assistant." | System prompt |
| temperature | Float | 0.7 | Response creativity |
| maxTokens | Int | 4096 | Max response tokens |
| topP | Float | 1.0 | Nucleus sampling |
| frequencyPenalty | Float | 0.0 | Frequency penalty |
| activePreset | String | "Default" | Preset name |

### Skill
Capability that injects system prompts into chats.

| Field | Type | Description |
|-------|------|-------------|
| id | String | Slug ID |
| name | String | Display name |
| description | String | Short description |
| systemPrompt | String | Injected system prompt |
| icon | String | Lucide icon name |
| enabled | Boolean | Whether skill is active |

### Session
Auth token storage (survives server restarts).

| Field | Type | Description |
|-------|------|-------------|
| token | String | Session token (hex) |
| createdAt | DateTime | Creation timestamp |

### Chat / Message
Conversation storage (Message has `chatId` FK, cascade delete).

| Field | Type | Description |
|-------|------|-------------|
| Chat.id | String | CUID |
| Chat.title | String | Auto-titled from first message |
| Message.role | String | "user" or "assistant" |
| Message.content | String | Message text |
| Message.files | String | JSON array of file metadata |

### Cache
Response cache with TTL.

| Field | Type | Description |
|-------|------|-------------|
| id | String | SHA-256 hash of messages |
| response | String | Cached response |
| model | String | Model that generated it |
| expiresAt | DateTime | Expiration timestamp |

### Combo / ComboItem
Model combos (ordered lists of models for multi-model workflows).

## AI Chat Flow

```
User sends message → POST /api/chat/stream
    │
    ├── Server saves user message to DB
    ├── Hash messages → check cache (if enabled)
    ├── Call streamChat(messages)
    │   │
    │   ├── Fetch enabled skills → append system prompts
    │   ├── attachFiles() → convert file attachments to multimodal format
    │   ├── Provider-specific streaming:
    │   │   ├── OpenAI-compatible (OpenRouter, Groq, OpenAI):
    │   │   │   ├── Tool loop: LLM → tool_call → execute → result → LLM...
    │   │   │   └── Final streaming: yield content events
    │   │   ├── Anthropic: stream via Anthropic API
    │   │   └── Google Gemini: stream via Gemini API
    │   │
    │   └── Yield StreamEvent objects:
    │       ├── { type: 'tool_call', id, tool, args }
    │       ├── { type: 'tool_result', id, ok, result/error }
    │       ├── { type: 'content', content }
    │       └── { type: 'error', error }
    │
    ├── SSE to frontend:
    │   ├── data: {"type":"tool_call","tool":"web_search","args":{...}}
    │   ├── data: {"type":"tool_result","ok":true,"result":"..."}
    │   ├── data: {"type":"content","content":"..."}
    │   └── data: [DONE]
    │
    ├── Save assistant message to DB
    ├── Update chat title from first message
    ├── Record token usage stats
    └── Cache response (if enabled)
```

## Auth Flow

```
Login: POST /api/auth/login { password }
    → bcrypt compare
    → Create session token (random 32 bytes hex)
    → Store in Session table
    → Return token

Auth middleware:
    → Extract Bearer token from Authorization header
    → Look up in Session table (SQLite)
    → 401 if not found
    → next() if valid

Tokens persist across server restarts (SQLite-backed).
```

## Tool System

Tools are defined in `server/lib/tools.ts` as OpenAI-compatible function definitions:

| Tool | Description |
|------|-------------|
| read_file | Read file contents |
| write_file | Write content to file |
| edit_file | Find/replace in file |
| list_dir | List directory contents |
| delete_file | Delete a file |
| web_search | Search the web via DuckDuckGo |

All file tools enforce a security boundary: resolved paths must start with the configured working directory.

The tool loop in `streamChat` (OpenAI-compatible path):
1. Send messages + tool definitions to LLM
2. If response has tool_calls → execute each → push results → loop
3. If no tool_calls → stream final text response
