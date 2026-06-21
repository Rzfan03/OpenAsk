#!/usr/bin/env bash
set -e

cd "$(dirname "$0")/dashboard"

# Generate Prisma client + push schema
npx prisma generate --schema=server/prisma/schema.prisma --no-hints 2>/dev/null
npx prisma db push --schema=server/prisma/schema.prisma --accept-data-loss 2>/dev/null

# Start dev server (Vite frontend + API backend)
npx concurrently "vite" "tsx watch server/index.ts"
