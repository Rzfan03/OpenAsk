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

## DOMCloud

[DOMCloud](https://domcloud.co) is an Indonesian PaaS that supports Node.js apps with SQLite persistent storage.

### Steps

1. Push your code to GitHub
2. Go to DOMCloud dashboard → **New App** → **Connect GitHub**
3. Select your repository
4. Set these configurations:

| Setting | Value |
|---------|-------|
| Root Directory | `dashboard/` |
| Runtime | Node.js |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Persistent Storage | mount at `server/prisma/` |
| HTTP Port | `20130` |

5. **Persistent Storage** is required — SQLite database must survive deploys
6. Deploy

### Post-Deploy

1. Open the app URL
2. Login with `admin123`
3. Change the password immediately
4. Add API keys for your providers
5. Set a working directory

### Notes

- The `postinstall` script automatically generates the Prisma client after `npm install`
- The `start` script runs `prisma db push` to ensure the database schema is up to date
- SSE streaming works via DOMCloud's WebSocket support — no special config needed

## Docker

A multi-stage `Dockerfile` is at the project root.

```bash
docker build -t openask .
docker run -d \
  -p 20130:20130 \
  -v openask-data:/app/server/prisma \
  openask
```

The `/app/server/prisma` volume persists the SQLite database across restarts.

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
