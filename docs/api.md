# API Reference

Base URL: `http://localhost:20130/api`

All routes except `POST /api/auth/login` require `Authorization: Bearer <token>` header.

## Auth

### POST /api/auth/login

```json
// Request
{ "password": "admin123" }

// Response
{ "token": "a1b2c3d4e5f6..." }
```

### POST /api/auth/logout

Invalidates the current session token.

```json
// Response
{ "ok": true }
```

### PUT /api/auth/password

```json
// Request
{ "oldPassword": "admin123", "newPassword": "newpass456" }

// Response
{ "ok": true }
```

## Config

### GET /api/config/settings

Public (no auth required). Returns theme, cache, and working directory settings.

```json
{
  "cavemanMode": false,
  "cacheEnabled": false,
  "cacheTTL": 300,
  "avatarUrl": "",
  "themeMode": "dark",
  "themeAccent": "indigo",
  "workingDir": ""
}
```

### PUT /api/config/settings

```json
// Request (partial update)
{ "workingDir": "/home/user/projects", "themeMode": "light" }

// Response
{ "cavemanMode": false, "workingDir": "/home/user/projects", ... }
```

### GET /api/config/providers

```json
[
  { "id": "openai", "name": "OpenAI", "apiKey": "sk-...", "selectedModel": "gpt-4o", "baseUrl": "https://api.openai.com/v1", "isActive": false },
  { "id": "groq", "name": "Groq", "apiKey": "", "selectedModel": "llama-3.3-70b-versatile", "baseUrl": "https://api.groq.com/openai/v1", "isActive": true }
]
```

### POST /api/config/providers

```json
// Request
{ "id": "custom", "name": "Custom", "baseUrl": "https://custom.api/v1", "apiKey": "", "selectedModel": "", "isActive": false }

// Response (created provider)
```

### PUT /api/config/providers/:id

```json
// Request (partial update)
{ "apiKey": "sk-...", "selectedModel": "gpt-4o", "isActive": true }
```

Only one provider can be active at a time. Setting `isActive: true` deactivates others.

### GET /api/config/providers/:id/models

Fetches available models from the provider's `/models` endpoint.

```json
["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", ...]
```

### POST /api/config/providers/:id/test

Tests the provider connection with a ping message.

```json
// Response
{ "ok": true, "message": "Connection successful" }
// or
{ "ok": false, "message": "401 Unauthorized" }
```

### GET /api/config/personality

```json
{
  "id": "main",
  "systemPrompt": "You are a helpful AI assistant.",
  "temperature": 0.7,
  "maxTokens": 4096,
  "topP": 1.0,
  "frequencyPenalty": 0.0,
  "activePreset": "Default"
}
```

### PUT /api/config/personality

```json
// Request (partial update)
{ "temperature": 0.9, "systemPrompt": "You are a poet." }
```

## Chat

### POST /api/chat/stream

The main chat endpoint. Streams SSE events.

```json
// Request
{
  "chatId": "abc123",       // omit to create new chat
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "user", "content": "What's in this image?", "file": { "name": "photo.jpg", "type": "image/jpeg", "base64": "/9j/4AAQ..." } }
  ]
}
```

**SSE Event Types:**

```
data: {"type":"content","content":"Hello! How can I"}

data: {"type":"tool_call","id":"call_xxx","tool":"web_search","args":{"query":"latest AI news 2026"}}

data: {"type":"tool_result","id":"call_xxx","ok":true,"result":"**Search Results:**\\n- AI breakthroughs... (https://...)")

data: {"type":"error","error":"API Error: 401 Unauthorized"}

data: [DONE]
```

The `file` field is only needed for the last user message. Image attachments are converted to OpenAI vision API format. Supported file types: images (converted to multimodal), PDF, TXT, DOC, DOCX (truncated to 1000 chars).

## Chats

### GET /api/chats

List all conversations (ordered by most recent).

```json
[
  { "id": "abc123", "title": "How do I implement...", "createdAt": "...", "updatedAt": "..." },
  { "id": "def456", "title": "New Chat", "createdAt": "...", "updatedAt": "..." }
]
```

### POST /api/chats

```json
// Request
{ "title": "My Chat" }

// Response (created chat)
```

### PUT /api/chats/:id

```json
// Request
{ "title": "Renamed Chat" }
```

### DELETE /api/chats/:id

```json
// Response
{ "ok": true }
```

### GET /api/chats/:id/messages

```json
[
  { "id": "msg1", "role": "user", "content": "Hello", "files": "[]", "chatId": "abc123", "createdAt": "..." },
  { "id": "msg2", "role": "assistant", "content": "Hi there!", "files": "[]", "chatId": "abc123", "createdAt": "..." }
]
```

## Skills

### GET /api/skills

```json
[
  { "id": "web-search", "name": "Web Search", "description": "Enables real-time web search...", "systemPrompt": "You can search the web...", "icon": "Globe", "enabled": true },
  { "id": "code-review", "name": "Code Review", "description": "...", "systemPrompt": "...", "icon": "Code2", "enabled": false }
]
```

### POST /api/skills

```json
// Request
{ "name": "My Skill", "description": "...", "systemPrompt": "You should...", "icon": "Lightbulb" }

// Response (created skill)
```

### PUT /api/skills/:id

```json
// Request (partial update)
{ "enabled": true, "systemPrompt": "New prompt..." }
```

### PUT /api/skills/:id/toggle

Toggles the `enabled` boolean.

### POST /api/skills/install

Installs a skill from a GitHub repository.

```json
// Request
{ "repo": "username/repo" }

// Response (created/updated skill)
```

Fetches `SKILL.md` from the repo's main branch.

## Community Skills

### GET /api/community-skills

Returns a curated list of community skills.

```json
[
  { "id": "find-skills", "name": "Find Skills", "repo": "vercel-labs/skills", "description": "Discover and install agent skills...", "installs": "2.1M" },
  { "id": "frontend-design", "name": "Frontend Design", "repo": "anthropics/skills", "description": "...", "installs": "571K" }
]
```

## Stats

### GET /api/stats/uptime

```json
{ "start": 1718950000000, "uptime": 3600000 }
```

### GET /api/stats/tokens

```json
{ "totalTokensIn": 15000, "totalTokensOut": 45000, "hourly": { "in": 500, "out": 1200 } }
```

### GET /api/stats/token-history

```json
[
  { "time": 1718950000000, "in": 100, "out": 300 },
  { "time": 1718950060000, "in": 50, "out": 150 }
]
```

Buckets of token usage per minute over the last hour.

## Tunnel

### GET /api/tunnel/status

```json
{ "running": true, "url": "https://example.trycloudflare.com" }
```

### POST /api/tunnel/start

Starts a Cloudflare Tunnel. Requires `cloudflared` installed.

```json
{ "running": true, "url": "https://random.trycloudflare.com" }
```

### POST /api/tunnel/stop

```json
{ "running": false, "url": "" }
```

## Combos

### GET /api/combos

```json
[
  { "id": "my-combo-123", "name": "My Combo", "items": [{ "id": "item1", "model": "gpt-4o", "order": 0 }, { "id": "item2", "model": "claude-3", "order": 1 }] }
]
```

### POST /api/combos

```json
// Request
{ "name": "My Combo" }
```

### PUT /api/combos/:id

```json
// Request
{ "name": "Renamed" }
```

### DELETE /api/combos/:id

### POST /api/combos/:id/items

```json
// Request
{ "model": "gpt-4o" }
```

### DELETE /api/combos/:id/items/:itemId

### PUT /api/combos/:id/items/:itemId

```json
// Request
{ "model": "claude-3" }
```

### PUT /api/combos/:id/items/reorder

```json
// Request
{ "items": ["itemId1", "itemId2", "itemId3"] }
```

## SSE Event Reference

The `/api/chat/stream` endpoint uses Server-Sent Events. Each line is `data: <json>\n\n`.

| Event Type | Fields | Description |
|------------|--------|-------------|
| `content` | `content` | Streaming text chunk |
| `tool_call` | `id`, `tool`, `args` | AI called a tool |
| `tool_result` | `id`, `ok`, `result`, `error` | Tool execution result |
| `error` | `error` | Fatal error, stream ends |
| `[DONE]` | — | Stream complete |

### Frontend Event Handling (chat.tsx)

```typescript
// buffer SSE data
buffer += decoder.decode(value, { stream: true })
const lines = buffer.split('\n')
buffer = lines.pop() ?? ''

for (const line of lines) {
  if (!line.startsWith('data: ')) continue
  const data = line.slice(6).trim()
  if (data === '[DONE]') break

  const json = JSON.parse(data)
  if (json.type === 'content') appendToLastAssistant(json.content)
  else if (json.type === 'tool_call') addToolCallCard(json.id, json.tool, json.args)
  else if (json.type === 'tool_result') updateToolCallCard(json.id, json.ok, json.result, json.error)
  else if (json.type === 'error') showError(json.error)
}
```
