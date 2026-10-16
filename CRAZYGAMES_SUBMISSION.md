# 🎃 PUMPKIN PANIC.IO - CrazyGames Submission & Packaging Guide

This guide details the complete submission package for **PUMPKIN PANIC.IO** on the **CrazyGames Developer Portal**, including client packaging, SDK v3 integration verification, server deployment requirements, and remaining manual portal configurations.

---

## 1. Submission Readiness Summary

| Requirement | Implementation Status | Notes |
| :--- | :---: | :--- |
| **Official CrazyGames SDK v3** | ✅ Implemented | Loaded via `https://sdk.crazygames.com/crazygames-sdk-v3.js` with `await window.CrazyGames.SDK.init()`. |
| **Game Lifecycle Tracking** | ✅ Implemented | `loadingStart()`, `loadingStop()`, `gameplayStart()`, `gameplayStop()`, `happytime()`. |
| **No Premature gameplayStart** | ✅ Verified | `gameplayStart()` is triggered **only** when active combat commences, never in menus or loading screens. |
| **Midgame & Rewarded Video Ads** | ✅ Implemented | `requestMidgameAd()` on round transitions and `requestRewardedAd()` for +100 bonus coins on end screen. Pauses game & mutes audio. |
| **No Fake Ads or Fake Leaderboards** | ✅ Verified | Uses official SDK callbacks only. In-match leaderboard operates independently of platform API. |
| **Multiplayer Room Sync** | ✅ Implemented | Integrates `updateRoom()`, `leftRoom()`, and platform `inviteLink()` generator. |
| **Responsive UI & Aspect Ratio** | ✅ Verified | Fully responsive across all CrazyGames iframe dimensions (`907x510`, `800x450`, `1216x684`, `1920x1080`). |
| **Mobile & Touch Controls** | ✅ Implemented | Floating virtual movement joystick on left, touch aim + dedicated tap-and-hold fire button on right. |
| **Input & Gesture Protection** | ✅ Implemented | `user-select: none`, `touch-action: none`, `overscroll-behavior: none` on canvas/body while preserving text input in forms. |
| **Tab Visibility & Pause** | ✅ Implemented | Automatically mutes audio and pauses local offline physics simulation when tab is backgrounded. |
| **Audio Autoplay Compliance** | ✅ Implemented | Uses deferred `AudioContext` unlocked via standard user gesture listeners (`pointerdown`, `touchstart`, `keydown`). |
| **Dedicated UI Screens** | ✅ Implemented | Glowing pumpkin loading screen, connection notice modal, reconnecting radar modal, and match over screen. |
| **Package Weight & Performance** | ✅ Verified | Total client size is **< 500 KB** (0.5 MB), well under CrazyGames' 50 MB ceiling (<20 MB mobile threshold). Instant load. |

---

## 2. Standalone Client Packaging Instructions

The HTML5 client is completely decoupled from server-side Node.js code and can be zipped directly for upload to CrazyGames:

### Included Client Files:
```text
pumpkin-panic-client.zip
├── index.html                  (HTML5 entry with SDK scripts & UI overlays)
├── style.css                   (Halloween responsive stylesheet & animations)
└── src/                        (Game engine, scenes, entities & systems)
    ├── audio.js                (Web Audio synthesizer & autoplay compliance)
    ├── config.js               (Game balance tuning & multiplayer config)
    ├── main.js                 (Phaser 3 entry & game bootstrap)
    ├── entities/               (Player, Bot, Entity, BulletPool, SeedManager)
    ├── network/                (NetworkAdapter for Colyseus & Local mode)
    ├── platform/               (CrazyGamesAdapter.js SDK v3 implementation)
    ├── scenes/                 (BootScene.js preloader & GameScene.js combat)
    ├── systems/                (StormSystem, LeaderboardSystem, EmitterManager)
    └── ui/                     (UIManager.js menu, shop, HUD & modals)
```

> [!IMPORTANT]
> Do **NOT** include `server/`, `node_modules/`, `package.json`, or `.bat` files in the zip file uploaded to CrazyGames.

---

## 3. Multiplayer Server Deployment Requirements

Because CrazyGames hosts the HTML5 client inside a secure HTTPS iframe (`https://www.crazygames.com`), browser security policies enforce that WebSocket traffic must be encrypted over `wss://` (Secure WebSockets).

### Recommended Hosting Stack:
- **Server**: Colyseus 0.15 on Node.js 18+ (e.g. AWS EC2, DigitalOcean Droplet, Railway, Render, Fly.io, or Heroku).
- **Process Manager**: PM2 (`pm2 start src/index.js --name "pumpkin-arena"`).
- **Reverse Proxy**: Nginx or Caddy with SSL certificate (Let's Encrypt).
- **CORS Configuration**: Set `CORS_ORIGIN=*` or allow `https://*.crazygames.com`.

### Setting the Production Server URL:
In [`src/config.js`](file:///g:/dev/pumpkin%20panic/src/config.js), update line 22 with your live production WSS endpoint:
```javascript
MULTIPLAYER: {
    DEFAULT_SERVER_URL: 'wss://arena.yourdomain.com',
    ...
}
```
*(Alternatively, you can supply `?server=wss://arena.yourdomain.com` in the CrazyGames game launch parameters, or players can specify it in the in-game settings modal).*

---

## 4. Remaining Manual Configuration on CrazyGames Developer Portal

When creating or editing the game entry at **[developer.crazygames.com](https://developer.crazygames.com)**, complete the following items:

### 1. General Game Details
- **Title**: `PUMPKIN PANIC.IO`
- **Subheading**: `Survive the Spooky Pumpkin Arena!`
- **Game Orientation**: Landscape (with responsive mobile scaling).
- **Categories / Tags**: `.IO Games`, `Multiplayer`, `Shooter`, `Halloween`, `Survival`, `Arena`.

### 2. Controls Description
- **Desktop**:
  - `WASD` or `Arrow Keys`: Move pumpkin
  - `Mouse Aim`: Look / aim projectile
  - `Left Mouse Button` or `Space`: Fire pumpkin seeds
  - `R` or `Space` (on End Screen): Instant rematch
- **Mobile / Touch**:
  - `Left Thumb Virtual Joystick`: Smooth movement
  - `Right Thumb Touch & Drag`: Aim in any 360° direction
  - `FIRE Button`: Tap and hold to unleash continuous seed barrage

### 3. Required Graphical Assets
Prepare and upload the following standard CrazyGames promotional artwork:
- **Landscape Cover**: `1920x1080` (16:9 ratio, main game cover).
- **Portrait Cover**: `800x1200` (2:3 ratio, mobile feature carousel).
- **Square Icon / Thumbnail**: `800x800` (1:1 ratio, browser tile).

### 4. CrazyGames QA Testing Steps
Before hitting "Submit for Review":
1. Upload the zip build to the CrazyGames QA testing sandbox.
2. In the QA preview console, verify:
   - CrazyGames banner/watermark is visible.
   - `window.CrazyGames.SDK.environment` reports `'crazygames'`.
   - Ad testing tool successfully delivers midgame and rewarded video ads.
   - Rewarded ad grants +100 bonus coins upon successful completion.
   - Audio toggles mute during ad playback and unmutes afterwards.
   - Offline Local Practice Mode works seamlessly even if multiplayer WebSocket server is stopped.
