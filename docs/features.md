# Features

## Chat

Real-time streaming chat with multiple AI providers. Token-by-token response streaming via SSE.

- Text input with auto-resize textarea
- File attachments via Paperclip button (images, PDF, TXT, DOC, DOCX)
- Image preview before sending
- Image display in chat bubbles
- Shift+Enter for newline, Enter to send
- Auto-scroll to latest message

## Multi-Provider

Switch between 5 built-in providers or add custom OpenAI-compatible endpoints.

| Provider | Type | Auth |
|----------|------|------|
| OpenAI | OpenAI-compatible | API key |
| Anthropic | Anthropic API | API key |
| Google Gemini | Gemini API | API key |
| Groq | OpenAI-compatible | API key |
| OpenRouter | OpenAI-compatible | API key |

Features per provider:
- **OpenAI-compatible** (OpenAI, Groq, OpenRouter, custom): Full tool loop support + streaming
- **Anthropic**: Streaming only (no tools yet)
- **Google Gemini**: Streaming only (no tools yet)

Dynamic model fetching from each provider's `/models` endpoint.
Connection testing with ping message.
Only one provider active at a time.

## Personality System

Configure how the AI behaves:

| Parameter | Range | Description |
|-----------|-------|-------------|
| System prompt | Any text | Instructions that define AI behavior |
| Temperature | 0.0 - 2.0 | Response creativity (higher = more random) |
| Max tokens | 1 - 32768 | Maximum response length |
| Top P | 0.0 - 1.0 | Nucleus sampling threshold |
| Frequency penalty | -2.0 - 2.0 | Penalize repeated tokens |

Presets: Save/load named configurations.

## Skills

Skills inject system prompts into every chat to enable specific capabilities.

**Built-in Skills:**

| Skill | Description | Tool |
|-------|-------------|------|
| Web Search | Search the web for current information | `web_search` |
| Code Review | Security analysis and best practices | — |
| Debugging | Structured debugging approach | — |
| Creative Writing | Vivid language and narrative structure | — |
| Data Analysis | Statistical rigor and methodology | — |
| Caveman | Caveman language mode | — |

Enabled skills' system prompts are appended to the personality's system prompt before each LLM call.

**Community Skills:** Install skills from GitHub repositories via the Community Skills page. Fetches `SKILL.md` from the repo's `main` branch.

## File System Tools

AI can manipulate files in a configured working directory.

| Tool | Description | Security |
|------|-------------|----------|
| `read_file` | Read file contents | Path must be within working directory |
| `write_file` | Create/overwrite file | Path must be within working directory |
| `edit_file` | Find/replace in file | Path must be within working directory |
| `list_dir` | List directory contents | Path must be within working directory |
| `delete_file` | Delete a file | Path must be within working directory |

Paths can be absolute or relative to the working directory. Absolute paths outside the working directory are rejected with "Access denied".

## Web Search

AI can search the web via DuckDuckGo API (no API key required).

- Triggered by the `web_search` tool (requires Web Search skill enabled)
- Returns instant answers, summaries, and related web results
- No configuration needed — works out of the box

## Image Attachments

Send images to vision-capable models:

| Model Family | Supported Models |
|-------------|------------------|
| OpenAI | GPT-4o, GPT-4o-mini, o3, o4-mini |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku, Claude 4 Sonnet |
| Google | Gemini 2.5 Pro/Flash, Gemini 2.0 Flash |
| OpenRouter | Any vision model from above |

Images are converted to base64 and sent inline in the API request. Preview shown before sending.

## Conversation Management

- **Auto-titling**: Chat title auto-generated from first message
- **Persistent history**: All messages stored in SQLite
- **Sidebar**: Quick navigation between conversations
- **New chat**: Clear and start fresh
- **Delete**: Remove conversations

## Response Caching

Optional cache to avoid redundant API calls for identical queries.

- Enabled/disabled in Settings
- Configurable TTL (cache duration)
- Cache key: SHA-256 hash of the message array
- Bypassed automatically when file attachments are present (unique hash per image)

## Token Usage Tracking

- **Total tokens**: Lifetime token usage (input + output)
- **Hourly breakdown**: Token usage in the last hour
- **Historical chart**: Per-minute token usage over the last 30 minutes

## Cloudflare Tunnel

Expose your instance to the internet via Cloudflare Tunnel.

- Start/stop from the dashboard
- Auto-detects `cloudflared` binary
- Displays tunnel URL
- URL saved to database for persistence

## Theme

- Dark/light mode toggle
- Accent color picker (indigo, blue, green, red, purple, orange, pink, teal, yellow, cyan)
- Avatar URL configuration
- All theme preferences persisted in database

## Authentication

- Password-based login
- bcrypt password hashing
- Token-based sessions stored in SQLite (survives server restarts)
- Logout invalidates session token
- Change password from the dashboard

## Security

- File system tools restricted to configured working directory
- Path traversal attempts blocked
- Auth tokens in SQLite (not in-memory)
- API keys stored in database, sent only to respective providers
- All routes except login require authentication
- Express JSON body parser limited to 50MB for image attachments
