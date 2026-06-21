# OpenAsk

<p>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg" />
  <img alt="Platform" src="https://img.shields.io/badge/platform-Web%20%2B%20Android-brightgreen.svg" />
  <img alt="PRs" src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" />
</p>

**OpenAsk is an open-source AI chat platform with a web dashboard and Android client, connecting to OpenAI, Anthropic, Gemini, Groq, and OpenRouter through a single interface.**

---

## Web Dashboard

A self-hosted web interface for chatting with AI models, with file system tools, web search, skills/personality system, and conversation management.

### Features

- **Multi-provider** — Switch between OpenAI, Anthropic, Gemini, Groq, OpenRouter in one place
- **Personality system** — Custom system prompts with temperature, max tokens, top P, frequency penalty controls
- **Skills** — Enable/disable capabilities (web search, code review, debugging, etc.) that inject system prompts
- **File system tools** — AI can read, write, edit, list, and delete files in a configured working directory
- **Web search** — AI can search the web for current information via DuckDuckGo
- **Image attachments** — Send images to vision-capable models (GPT-4o, Claude 4, Gemini 2.5, etc.)
- **Real-time streaming** — Token-by-token streaming from all supported providers
- **Conversation history** — Auto-titled, persistent chat history with SQLite
- **Response caching** — Optional cache for repeated queries to save tokens
- **Tunneling** — Expose your instance via Cloudflare Tunnel
- **Dark/light theme** — Customizable with accent color picker
- **Token usage tracking** — Dashboard with token usage history chart
- **Session persistence** — Auth tokens stored in SQLite, survive server restarts

### Tech Stack

| Layer | |
|-------|---|
| Frontend | React 19, Vite 6, Tailwind CSS v4, Radix UI, React Router v7, Lucide React |
| Backend | Express 5, Prisma 6, TypeScript 6 |
| Database | SQLite (via Prisma) |
| Auth | bcryptjs password, token-based sessions in DB |

### Quick Start

```bash
cd dashboard
npm install
npx prisma db push --schema=server/prisma/schema.prisma
npx prisma generate --schema=server/prisma/schema.prisma
npm run db:seed
npm run dev
```

Default password: `admin123`

The Vite dev server runs on `http://localhost:20128` (proxies API to Express on port 20130).

### Configuration

1. Open the dashboard and go to **Dashboard > Overview**
2. Click **Settings** to set your working directory
3. Go to **Personality** to customize the AI's behavior
4. Add API keys for your preferred providers in **Settings**
5. Enable **Skills** like Web Search from the Skills page

### Commands

```bash
npm run dev           # Start dev server (Vite + Express concurrently)
npm run build         # Build for production
npm start             # Start production server
npm run db:seed       # Reset seed data (providers, skills, etc.)
```

### API Routes

| Route | Description |
|-------|-------------|
| `/api/auth/login` | Login with password |
| `/api/auth/logout` | Logout |
| `/api/config/settings` | App configuration |
| `/api/config/providers` | Provider management |
| `/api/config/test-model` | Test provider connection |
| `/api/chat/stream` | SSE streaming chat endpoint |
| `/api/chats` | Conversation CRUD |
| `/api/skills` | Skills CRUD |
| `/api/community-skills` | Community skill store |
| `/api/stats` | Token usage stats |
| `/api/tunnel` | Cloudflare Tunnel management |

### Providers & Models

| Provider | Default Model |
|----------|---------------|
| **OpenRouter** | openai/gpt-4o |
| **OpenAI** | gpt-4o |
| **Anthropic** | claude-3-5-sonnet-20241022 |
| **Google Gemini** | gemini-2.0-flash |
| **Groq** (default) | llama-3.3-70b-versatile |

---

## Documentation

Full documentation is in the [`docs/`](docs/) directory:

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/setup.md) | Installation, configuration, quick start |
| [Architecture](docs/architecture.md) | System design, database schema, AI flow |
| [Features](docs/features.md) | All features documented |
| [API Reference](docs/api.md) | Complete API endpoint docs |
| [Deployment Guide](docs/deployment.md) | Production deployment, Docker, Nginx |

## Project Structure

```
dashboard/
  src/
    routes/            Page components
    components/        UI components (Radix-based)
    lib/               API client, hooks
  server/
    routes/            Express API routes
    lib/               Tools, AI streaming, auth, cache
    prisma/            Schema, migrations, seed
  vite.config.ts       Vite config with API proxy
```

## Security

- Passwords hashed with bcryptjs
- Auth tokens stored in SQLite (not in-memory)
- File system tools are restricted to the configured working directory
- API keys stored in DB, transmitted only to their respective providers
- All routes except `/api/auth/login` require authentication

## License

MIT
