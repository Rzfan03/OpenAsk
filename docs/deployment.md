# Deployment

## Production Build

```bash
cd dashboard
npm install
npm run build
```

This produces:
- `dist/` — Compiled frontend (served by Express)
- Server TypeScript compiled by `tsc -p tsconfig.node.json`

### Start Production Server

```bash
npm start
```

Serves on `http://localhost:20130`. The Express app serves the built SPA from `dist/` and handles all API routes.

## Process Manager (PM2)

```bash
npm install -g pm2
pm2 start npm --name openask -- start
pm2 save
pm2 startup
```

## Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:20130;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_buffering off;  # Required for SSE
    }
}
```

> **Important:** `proxy_buffering off` is required for Server-Sent Events (chat streaming) to work correctly.

## Cloudflare Tunnel

For exposing without a public IP:

```bash
# Install cloudflared
npm install -g cloudflared

# Start tunnel from the dashboard
# Or manually:
cloudflared tunnel --url http://localhost:20130
```

The dashboard provides a Tunnel page to start/stop tunnels.

## Docker (Manual)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY dashboard/package*.json ./
RUN npm install
COPY dashboard/ .
RUN npm run build
EXPOSE 20130
CMD ["npm", "start"]
```

```bash
docker build -t openask .
docker run -d -p 20130:20130 -v openask-data:/app/server/prisma openask
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 20130 | Express server port |

All other configuration is stored in the SQLite database.

## Database Backups

The SQLite database is at `dashboard/server/prisma/dev.db`.

```bash
# Backup
cp dashboard/server/prisma/dev.db dev.db.backup

# Restore
cp dev.db.backup dashboard/server/prisma/dev.db
```

For automated backups, add a cron job:

```bash
0 3 * * * cp /path/to/openask/dashboard/server/prisma/dev.db /backups/openask-$(date +\%Y\%m\%d).db
```

## Security Checklist

- [ ] Change default password (`admin123`) after first login
- [ ] Set a restrictive working directory for file tools
- [ ] Use HTTPS in production (Nginx/Caddy/Cloudflare)
- [ ] Restrict API keys to necessary permissions only
- [ ] Regular database backups
- [ ] Keep Node.js and npm dependencies updated
