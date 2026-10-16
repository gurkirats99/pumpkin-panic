# 🎃 PUMPKIN PANIC.IO

> **SURVIVE. GROW. DOMINATE.**  
> A fast-paced, top-down 2D multiplayer Halloween arena survival shooter built with Phaser 3, Node.js, and Colyseus.  
> Features real-time authoritative online multiplayer with room matchmaking and a 100% playable offline practice mode with AI bots. Ready for CrazyGames publishing.

---

## 🎮 Gameplay Overview

In **PUMPKIN PANIC.IO**, you step into the cursed Harvest Arena as a cute but deadly Jack-o'-lantern:
- **Collect Glowing Seeds**: Harvest green, blue, and golden seeds or giant mega-pumpkins to gain XP and heal.
- **Weapon Mutations**: Grab mystical runes to unleash **TRIPLE SHOT**, **RAPID FIRE**, and **BOUNCING SEEDS**.
- **Explosive Seed Bombs**: Trigger glowing red unstable seeds that detonate after a 2.5-second countdown.
- **Grow into a Juggernaut**: Reach higher levels to expand in size, upgrade facial expressions, increase maximum health, and fire larger, deadlier pumpkin seeds.
- **Outrun the Pumpkin Storm**: Keep an eye on the shrinking safe perimeter! The purple storm inflicts heavy damage on anyone caught outside.
- **Defeat Rivals & Climb the Leaderboard**: Squash opponents, harvest their dropped seed bursts, and become the **Last Pumpkin Standing**!

---

## 🌐 Real Online Multiplayer Architecture (Node.js & Colyseus)

The game features real-time authoritative online multiplayer powered by a dedicated Node.js server using the **Colyseus** framework.

```
                    ┌─────────────────────────┐
                    │      Browser Client     │
                    │  Phaser 3 + Colyseus.js │
                    └───────────┬─────────────┘
                                │ WebSocket (25Hz inputs)
                                ▼
         ┌──────────────────────────────────────────────────┐
         │          Node.js Authoritative Server            │
         │                (Colyseus Room)                   │
         ├──────────────────────────────────────────────────┤
         │ • Input validation (speed limit, firing rate)    │
         │ • Projectile simulation & bouncing walls         │
         │ • Authoritative collision detection & damage     │
         │ • Seed/Rune pickups & explosive bomb countdowns  │
         │ • Battle Royale shrinking safe storm             │
         │ • Room lifecycle: create, join by code, cleanup  │
         │ • Autonomous server bots (labeled [BOT])         │
         │ • REST Health check endpoint: /health            │
         └──────────────────────────────────────────────────┘
```

### Server Authoritative Guarantees:
- **Zero Client Trust**: The server is the single source of truth for positions, health, growth, projectile hits, kills, deaths, score, pickups, and storm damage.
- **Movement Validation**: Movement vectors are normalized and clamped server-side to maximum allowable speed.
- **Rate-Limited Shooting**: Server enforces weapon firing cooldowns and max active projectiles per client.
- **Transparent Bot Labelling**: Server bots are clearly identified with the `[BOT]` tag on the leaderboard and minimap. They are never masqueraded as human players.
- **Dynamic Configuration**: Server URL is never hardcoded. It is dynamically resolved from URL query params (`?server=wss://...`), client settings, or `localStorage`, defaulting to `ws://localhost:2567`.

---

## 🚀 Quick Start Guide

### 1. Launching the Authoritative Multiplayer Server
Ensure you have **Node.js 18+** installed:

```bash
# Navigate to the server folder
cd server

# Install dependencies
npm install

# Start the server (runs on port 2567)
npm start
```
The server will output:
```
🎃 Pumpkin Panic Multiplayer Server listening on port 2567!
📡 Health check: http://localhost:2567/health
🎮 Authoritative room: pumpkin_arena
```

### 2. Launching the Client
You can open the client immediately with zero build steps:

- **Direct Browser Launch**: Double-click `index.html` or open `file:///g:/dev/pumpkin%20panic/index.html` in your browser.
- **Or via Local HTTP Server**:
  ```bash
  npx serve -l 3000 .
  # Then open http://localhost:3000
  ```

### 3. Playing Online or Offline
On the start screen:
- **🌐 PLAY ONLINE (MULTIPLAYER)**:
  - **Quick Match**: Matchmake instantly into an active arena.
  - **Create Arena**: Host a room and share the 6-character room code with friends.
  - **Join With Code**: Paste a friend's room code to join their game.
  - **Server URL Drawer**: Test health status or connect to a custom remote server.
- **🎃 LOCAL PRACTICE (OFFLINE)**:
  - Play immediately against autonomous local bots without running any server.
  - Also acts as an automatic fallback if the online multiplayer server is unreachable.

---

## 🕹️ Controls

| Action | Desktop Controls | Mobile / Touch Controls |
| :--- | :--- | :--- |
| **Movement** | `W`, `A`, `S`, `D` or **Arrow Keys** | Left dynamic virtual joystick |
| **Aim** | **Mouse Cursor** | Right screen touch pointer |
| **Shoot** | **Left Click** (hold for auto-fire) or `Spacebar` | Right **FIRE** virtual button |
| **Audio** | Sound toggle button on HUD & menu | Audio toggle button |
| **Room Code** | Click HUD room code pill to copy | Tap HUD room code pill to copy |

---

## 🚢 Production Server Deployment

The multiplayer server is lightweight, stateless per room, and ready for deployment on any cloud platform supporting WebSockets.

### Option A: Render.com (Recommended Free/Low Cost)
1. Fork or push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), create a new **Web Service**.
3. Set **Root Directory** to `server`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `npm start`.
6. Add Environment Variable: `PORT=2567`.
7. Once deployed, note your URL (e.g. `https://pumpkin-server.onrender.com`).
8. Connect clients via: `wss://pumpkin-server.onrender.com`.

### Option B: Railway.app
1. Create a new project pointing to the `server/` directory.
2. Railway detects Node.js and starts via `npm start`.
3. Generate a public domain with SSL enabled.

### Option C: Docker Container
Build and run the server anywhere Docker is available:
```bash
cd server
docker build -t pumpkin-panic-server .
docker run -p 2567:2567 pumpkin-panic-server
```

### Production CORS & Origin Settings
In `server/src/index.js`, CORS is configured to accept requests from any client origin or CrazyGames iframes:
```javascript
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"]
}));
```

---

## 🌟 CrazyGames Publishing Architecture

- **Separate Builds**: The client in the root folder (`index.html`, `src/`, `style.css`) is completely decoupled from the server deployment. It can be hosted on CrazyGames' static CDN while connecting to your remote Colyseus server.
- **Iframe & Sandbox Compatibility**: Automatic scaling with `Phaser.Scale.RESIZE`.
- **Zero Asset 404s**: All textures and skins are rendered procedurally on HTML5 canvas in `BootScene.js`.
- **Zero Audio Latency**: SFX and atmospheric background soundtrack are procedurally synthesized using the browser's Web Audio API.
- **Offline Fallback Guarantee**: If players lose connection or the multiplayer server undergoes maintenance, the game falls back to local practice mode with zero crashes.

---

## 📁 Project Structure

```
g:/dev/pumpkin panic/
├── index.html                  # Responsive client entry point & matchmaking modal
├── style.css                   # Glassmorphism dark UI & matchmaking cards
├── package.json                # Client project metadata
├── README.md                   # Project overview & deployment instructions
├── server/                     # Authoritative Node.js Multiplayer Server
│   ├── package.json            # Colyseus, WS transport, Express, CORS
│   ├── README.md               # Dedicated server architecture & API docs
│   └── src/
│       ├── index.js            # Express app, WebSocket transport, /health endpoint
│       ├── config.js           # Server physics constants, weapon stats, tick rate
│       ├── rooms/
│       │   └── PumpkinArena.js # Authoritative room simulation (25Hz)
│       └── schema/
│           └── GameState.js    # Colyseus Schema (Player, Projectile, Seeds, Storm)
└── src/                        # Client Game Source
    ├── config.js               # Client constants, skin catalog, multiplayer endpoint resolver
    ├── audio.js                # Web Audio API procedural sound effects & background music
    ├── main.js                 # Phaser 3 setup & CrazyGames lifecycle hooks
    ├── network/
    │   └── NetworkAdapter.js   # Colyseus client adapter & local adapter
    ├── entities/
    │   ├── Entity.js           # Base entity (health, XP, leveling, damage flash)
    │   ├── Player.js           # Player controller with input vector dispatch
    │   ├── Bot.js              # Local offline bot AI state machine
    │   ├── BulletPool.js       # Client projectile pool & particles
    │   └── SeedManager.js      # Seeds, runes, and explosive bomb spawns
    ├── systems/
    │   ├── StormSystem.js      # Shrinking storm perimeter calculations
    │   ├── LeaderboardSystem.js# Real-time scoring with [PLAYER] and [BOT] badges
    │   └── EmitterManager.js   # Particle bursts, smoke, explosions, sparks
    ├── scenes/
    │   ├── BootScene.js        # Procedural canvas vector texture generator
    │   └── GameScene.js        # Phaser 3 scene with multiplayer interpolation & local fallback
    └── ui/
        └── UIManager.js        # Matchmaking UI, server health check, HUD, End Screen
```
