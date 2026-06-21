# Setup Guide

## Prerequisites

- Node.js 20+
- npm

## Quick Start

```bash
cd dashboard
npm install
npx prisma db push --schema=server/prisma/schema.prisma
npx prisma generate --schema=server/prisma/schema.prisma
npm run db:seed
npm run dev
```

The dev server starts on `http://localhost:20128`. Default password: `admin123`.

## Step-by-Step

### 1. Install Dependencies

```bash
cd dashboard
npm install
```

### 2. Initialize Database

```bash
npx prisma db push --schema=server/prisma/schema.prisma
npx prisma generate --schema=server/prisma/schema.prisma
```

This creates `server/prisma/dev.db` (SQLite) with all tables.

### 3. Seed Default Data

```bash
npm run db:seed
```

Seeds:
- 5 providers: OpenRouter, OpenAI, Anthropic, Google Gemini, Groq (default active)
- Default personality with system prompt
- 6 built-in skills (Web Search, Code Review, Debugging, Creative Writing, Data Analysis, Caveman)
- Config with default password `admin123`

### 4. Start Development

```bash
npm run dev
```

Runs Vite (port 20128) and Express (port 20130) concurrently via `concurrently`.

### 5. Configure Providers

1. Open `http://localhost:20128`
2. Login with `admin123`
3. Go to **Settings** (avatar dropdown > Dashboard)
4. Add API keys for the providers you want to use
5. Test each connection with the **Test** button

## Configuration

### Working Directory

Set a working directory in **Dashboard > Overview**. The AI's file system tools (read, write, edit, list, delete) are restricted to this directory.

### Personality

Configure in **Personality** page:
- System prompt (how the AI behaves)
- Temperature (creativity)
- Max tokens (response length)
- Top P (nucleus sampling)
- Frequency penalty

### Skills

Enable/disable skills in **Skills** page. Enabled skills inject their system prompts into every chat. The **Web Search** skill enables the `web_search` tool.

## Environment

The Express server reads `PORT` environment variable (default: 20130).

No `.env` file required for the dashboard — all config is stored in the SQLite database.
