# OpenAsk Dashboard — Design Spec

## Overview

Web dashboard + backend proxy untuk OpenAsk. Desktop browser jadi control panel (set API key, pilih model, atur personality), backend sebagai proxy AI chat yang di-expose via Cloudflare Tunnel, dan mobile OpenAsk existing sebagai client.

## Architecture

```
Browser ──▶ Backend:20128 ──▶ AI Provider (OpenAI, dll)
               │
Mobile ────────┘
               │
          Cloudflare Tunnel
          (trycloudflare.com)
```

Backend monolith: Express serve API + React SPA dalam 1 proses.

## Tech Stack

- **Frontend:** React 19, React Router v7, shadcn/ui, Tailwind CSS v4
- **Backend:** Express.js, Prisma, SQLite (serverless via better-sqlite3)
- **Tunnel:** cloudflared (Cloudflare Tunnel)
- **Build:** Vite, TypeScript

## Project Structure

```
dashboard/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── index.html
├── server/
│   ├── index.ts              # Express entry
│   ├── prisma/
│   │   └── schema.prisma
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── config.ts
│   │   ├── chat.ts
│   │   └── tunnel.ts
│   └── lib/
│       ├── ai.ts             # AI streaming proxy
│       └── tunnel.ts         # cloudflared manager
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── routes/
    │   ├── login.tsx
    │   ├── dashboard-layout.tsx
    │   ├── providers.tsx
    │   ├── personality.tsx
    │   └── tunnel.tsx
    ├── components/
    │   ├── ui/               # shadcn/ui
    │   ├── provider-card.tsx
    │   └── model-select.tsx
    └── lib/
        └── api.ts
```

## Database Schema (Prisma)

```prisma
model Config {
  id          String  @id @default("main")
  password    String  @default("admin123")  // bcrypt
  tunnelUrl   String  @default("")
  tunnelPort  Int     @default(20128)
}

model Provider {
  id            String  @id
  name          String
  apiKey        String  @default("")
  selectedModel String  @default("")
  baseUrl       String
  isActive      Boolean @default(false)
}

model Personality {
  id              String  @id @default("main")
  systemPrompt    String  @default("You are a helpful AI assistant.")
  temperature     Float   @default(0.7)
  maxTokens       Int     @default(4096)
  topP            Float   @default(1.0)
  frequencyPenalty Float  @default(0.0)
  activePreset    String  @default("Default")
}
```

## API Endpoints

| Method | Path | Auth | Function |
|--------|------|------|----------|
| POST | /api/auth/login | ❌ | Login, return token |
| POST | /api/auth/logout | ✅ | Hapus session |
| GET | /api/config/providers | ✅ | List providers |
| PUT | /api/config/providers/:id | ✅ | Update API key/model |
| GET | /api/config/personality | ✅ | Get personality |
| PUT | /api/config/personality | ✅ | Update personality |
| GET | /api/tunnel/status | ✅ | Status tunnel |
| POST | /api/tunnel/start | ✅ | Start tunnel |
| POST | /api/tunnel/stop | ✅ | Stop tunnel |
| POST | /api/chat/stream | ❌ | SSE streaming chat proxy |

## Auth

- Simple token-based (in-memory Map)
- Login: verify bcrypt(password) → generate random token
- Token via `Authorization: Bearer <token>` header
- /api/chat/stream tanpa auth untuk mobile

## Dashboard Pages

### / — Overview
- Status tunnel, active provider, ringkasan config

### /providers — Provider Management
- Daftar provider cards (OpenRouter, OpenAI, Anthropic, Google, Groq)
- Expand: input API key, pilih model (auto-fetch from API)

### /personality — Personality Settings
- Preset buttons (Default, Formal, Friendly, Sarkastik, Jenius)
- System prompt textarea
- Sliders: temperature, maxTokens, topP, frequencyPenalty

### /tunnel — Tunnel Control
- Start/Stop button
- Tunnel URL (copyable)
- Status indicator

## Chat Streaming (SSE)

Mobile POST `/api/chat/stream`:
```
{ messages: [{role, content}], file?: {name, type, base64} }
```

Backend:
1. Baca config dari DB (active provider, apiKey, model, personality)
2. Panggil AI provider dengan streaming
3. Forward SSE chunks ke mobile

## Tunnel Implementation

- `child_process.spawn('cloudflared', ['tunnel', '--url', 'http://localhost:20128'])`
- Parse stdout untuk URL tunnel
- Simpan URL + PID, stop via kill

## Mobile Integration

- Settings baru: input Tunnel URL + toggle "Use Tunnel"
- Jika aktif: chat POST ke `{tunnelUrl}/api/chat/stream`
- File: upload multipart ke backend, backend attach ke provider request
- Jika nonaktif: tetap panggil AI langsung (existing behavior)
