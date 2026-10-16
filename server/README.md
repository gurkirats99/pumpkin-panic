# PUMPKIN PANIC.IO - Authoritative Multiplayer Server

Real-time, server-authoritative multiplayer backend built with **Node.js** and **Colyseus**.

---

## Architecture Overview

- **Authoritative Physics & Combat**: The server simulates player movement speeds, projectile paths, obstacle/player collisions, health deduction, kills, deaths, growth levels, seed respawns, explosive seed blast AOE, and the shrinking pumpkin storm.
- **Client Anti-Cheat**: Clients transmit only raw inputs (`vx`, `vy`, `aimAngle`) and firing requests. The server validates rate limits, movement speed limits, cooldowns, and collision hits. Client reports of kills, damage, or scores are never trusted.
- **Server Bots**: Server-side bot AI dynamically balances matches when human player count is below the configured threshold. Bots are flagged with `isBot: true` and clearly labeled with `[BOT]`.

---

## Local Development Setup

### Prerequisites
- Node.js v18.0.0 or higher
- npm or yarn

### Quick Start
1. Open a terminal in the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Launch the server:
   ```bash
   npm start
   ```
4. Verify the server is running:
   - Health Endpoint: `http://localhost:2567/health`
   - Returns: `{"status":"ok","service":"pumpkin-panic-multiplayer","uptime":...}`

---

## Production Deployment

### Environment Variables
| Variable | Description | Default |
|---|---|---|
| `PORT` | Listening port for HTTP and WebSockets | `2567` |
| `NODE_ENV` | Environment mode (`production` or `development`) | `production` |

### Deploy to Render
1. Create a new **Web Service** on [Render.com](https://render.com).
2. Point to your repository root or set **Root Directory** to `server`.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Copy your Render URL (e.g. `https://pumpkin-panic-server.onrender.com`).
6. Point the client to your server via `wss://pumpkin-panic-server.onrender.com` (configurable in client settings or via URL query `?server=wss://pumpkin-panic-server.onrender.com`).

### Deploy to Railway
1. Create a new project on [Railway.app](https://railway.app).
2. Connect your repository and select the `server/` subdirectory.
3. Railway will automatically detect Node.js and run `npm install` and `npm start`.
4. Generate a public domain with WebSocket support enabled.

### Deploy to Fly.io
1. Install the `flyctl` CLI.
2. Inside `server/`, run `fly launch`.
3. Ensure port `2567` is mapped to `443` with `tls` and `http` handlers in `fly.toml`.
4. Run `fly deploy`.

### Docker Deployment
A standard Node.js Dockerfile for containerized deployment:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 2567
CMD ["npm", "start"]
```

---

## Health Check
- Endpoint: `GET /health`
- Response: `200 OK`
- Format:
  ```json
  {
    "status": "ok",
    "service": "pumpkin-panic-multiplayer",
    "uptime": 120,
    "timestamp": 1729090000000,
    "version": "1.0.0"
  }
  ```
