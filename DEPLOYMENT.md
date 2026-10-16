# 🎃 PUMPKIN PANIC.IO - Multiplayer Server Deployment & Environment Guide

This guide details the server architecture, required environment variables, hosting configurations, SSL/WSS reverse proxy setups, and deployment best practices for the server-authoritative Colyseus multiplayer implementation.

---

## 1. Architecture Overview

- **Authoritative Framework**: [Colyseus 0.15](https://colyseus.io/) running on Node.js with `@colyseus/ws-transport` and Express.
- **Client**: Phaser 3 (HTML5 Canvas/WebGL) with `NetworkAdapter.Colyseus`.
- **Matchmaking Modes**:
  1. **Quick Play**: Automatically matches players into active arenas or provisions a new room (`pumpkin_arena`).
  2. **Create Private Room**: Generates an isolated room with a human-readable room code (e.g. `PUMP77`).
  3. **Join Private Room**: Connects to the room matching the code via direct room ID and matchmaking lookups.
  4. **Invite Flow**: Generates copyable room codes and shareable URLs (`?room=CODE` or `?join=CODE`).
  5. **Server-Controlled Bots**: Fills all remaining vacant seats (up to target player capacity) with authoritative bots that follow strict movement speed, weapon cooldowns, projectile damage, and storm rules.
  6. **Local Practice Mode**: Completely offline, client-simulated practice mode that functions even without network connectivity.

---

## 2. Server Environment Variables

| Variable Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Number | `2567` | Port for HTTP health checks and WebSocket connections. |
| `NODE_ENV` | String | `production` | Set to `production` for optimized Colyseus room and schema caching. |
| `CORS_ORIGIN` | String | `*` | Allowed CORS origins for web game portals (CrazyGames, Poki, custom domains). |
| `TARGET_MATCH_PLAYERS` | Number | `16` | Total combatants per arena room (real humans + server bots). |
| `MAX_ROOM_CLIENTS` | Number | `16` | Hard ceiling of concurrent human connections per arena room. |
| `SIMULATION_TICK_RATE` | Number | `25` | Server physics simulation ticks per second (40ms interval). |
| `STORM_DAMAGE_PERCENT` | Number | `0.07` | Percent max HP damage per second inflicted by the shrinking storm. |

---

## 3. Client Environment / Storage Settings

The client dynamically resolves server endpoints without requiring a build step:
- **Default Endpoint**: `ws://localhost:2567`
- **Config Setting**: `window.PumpkinPanic.Config.MULTIPLAYER.DEFAULT_LOCAL_URL`
- **User / Production Override**: Persisted in `localStorage.getItem('pumpkin_panic_server_url')` or configured via the in-game Settings Drawer.

When deploying to HTTPS (e.g., CrazyGames, itch.io, Vercel, Netlify):
```javascript
// Example production WebSocket URL
wss://pumpkin-panic-server.yourdomain.com
```

---

## 4. Production Deployment Methods

### Method A: PM2 Process Manager (Recommended for VPS / Ubuntu)

1. Clone repository on server and navigate to `server/`:
   ```bash
   cd /var/www/pumpkin-panic/server
   npm install --production
   ```
2. Start server under PM2:
   ```bash
   pm2 start src/index.js --name "pumpkin-arena" -i max
   pm2 save
   pm2 startup
   ```
3. Verify status:
   ```bash
   pm2 status
   curl http://localhost:2567/health
   ```

### Method B: Docker Container Deployment

Create a `Dockerfile` inside `server/`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

ENV PORT=2567
ENV NODE_ENV=production

EXPOSE 2567

CMD ["node", "src/index.js"]
```

Build and run:
```bash
docker build -t pumpkin-panic-server .
docker run -d -p 2567:2567 --restart always --name pumpkin-server pumpkin-panic-server
```

---

## 5. Nginx Reverse Proxy & SSL (WSS Configuration)

Because modern web game portals require HTTPS (CrazyGames iframe sandbox), WebSockets MUST use secure `wss://`.

Configure Nginx with WebSocket upgrade headers:

```nginx
server {
    server_name arena.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:2567;
        proxy_http_version 1.1;

        # WebSocket Upgrade Headers (Crucial for Colyseus)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;

        # Standard Forwarding Headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Extended timeouts for long-running matches
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/arena.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/arena.yourdomain.com/privkey.pem;
}
```

---

## 6. Server Health & Monitoring

The server exposes a public lightweight health probe for load balancers and clients:
- **Endpoint**: `GET /health`
- **Sample Response**:
  ```json
  {
    "status": "ok",
    "service": "pumpkin-panic-multiplayer",
    "uptime": 28410,
    "timestamp": 1792182000000,
    "version": "1.0.0"
  }
  ```

---

## 7. Disconnection & Offline Resiliency

- **Automatic Bot Redistribution**: If a human player leaves or loses connection, their entity is safely cleaned up, and server bots continue executing match logic.
- **Client Reconnection Grace**: If WebSocket connection drops abruptly (`code > 1000`), the client shows a `Reconnecting...` status toast before transitioning to `Disconnected`.
- **Local Practice Fallback**: If server connection is unavailable or refused, the client provides an instant 1-click fallback to Local Practice Mode so the player is never blocked.
