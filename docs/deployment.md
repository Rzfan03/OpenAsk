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

[DOMCloud](https://domcloud.co) is an Indonesian PaaS.

### Setup

A `domcloud.yaml` is at the project root — DOMCloud auto-detects it.

```yaml
commands:
- cd dashboard && npm install && npm run build
features:
- node
nginx:
  root: dashboard/dist
  passenger:
    enabled: on
    app_env: production
    app_start_command: cd dashboard && env PORT=$PORT node_modules/.bin/tsx server/index.ts
```

### Manual Steps

1. Push code to GitHub
2. DOMCloud dashboard → **New App** → **Connect GitHub**
3. Set **Persistent Storage** → mount at `dashboard/server/prisma/`
4. Set **HTTP Port** → `20130`
5. Deploy

Persistent Storage is required — SQLite database must survive deploys.

### Post-Deploy

1. Open the app URL
2. Login with `admin123`
3. Change the password immediately
4. Add API keys for your providers
5. Set a working directory

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
