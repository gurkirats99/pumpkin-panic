# 🎃 PUMPKIN PANIC.IO - CrazyGames Submission & Packaging Guide

This guide details the submission package for **PUMPKIN PANIC.IO** on the **CrazyGames Developer Portal**, featuring **Full CrazyGames SDK v3 Integration**:
- **Official Multiplayer SDK**: `isInstantMultiplayer`, `updateRoom()`, `leftRoom()`, `inviteLink()`, and `addJoinRoomListener()`.
- **Live Production Server**: Connects to authoritative Colyseus cloud server on Render (`wss://pumpkin-panic-server.onrender.com`).
- **Data Module & Cloud Save**: `CrazyGames.SDK.data` automatically syncs player coins, unlocked skins, and guns across all devices.
- **CrazyGames User Account**: Detects logged-in CrazyGames username & avatar with verified badge and guest login modal (`showAuthPrompt()`).
- **Single Player Fallback**: 100% playable offline Battle Royale mode with 15 AI bots, 32 skins, and 22 weapons.
- **1-Click Packaging**: Automatically builds the `crazygames_build/` folder and `pumpkin-panic-crazygames.zip`.

---

## 1. 1-Click Packaging Instructions

To create the upload package:
1. In the project root directory, double-click:
   ```cmd
   build_crazygames.bat
   ```
2. The script will automatically:
   - Create the clean `crazygames_build/` folder containing `index.html`, `style.css`, and all `src/` modules.
   - Compress it into `pumpkin-panic-crazygames.zip`.
   - Copy all upload files (Zip + 3 Cover Posters) into `NEW_UPDATE_UPLOAD/`.
   - Open `NEW_UPDATE_UPLOAD` in File Explorer!

---

## 2. Release Configuration Details

| Feature | Release Configuration |
| :--- | :--- |
| **Multiplayer Mode** | **ENABLED & LIVE**. Full real-time PvP with Quick Match, Create Private Arena (Room Code), Join with Code, and CrazyGames Friend Invites. Auto-detects `isInstantMultiplayer` and `inviteParams`. |
| **Multiplayer Cloud Server** | Authoritative Colyseus Server live on Render (`wss://pumpkin-panic-server.onrender.com`). |
| **Progress Save** | **CrazyGames Data Module**. Progress (Coins, 32 Skins, 22 Weapons) automatically syncs to CrazyGames account in cloud with local fallback for guests. |
| **User Account** | Displays CrazyGames Username & Avatar with Verified badge. Guests can click "Sign In" to trigger SDK `showAuthPrompt()`. |
| **Offline Battle Royale** | `🎃 OFFLINE BATTLE ROYALE (BOTS)` — 100% offline-ready, running complete arena survival vs 15 bots, shrinking storm, 32 skins, 22 weapons, pinatas, and live leaderboard. |
| **Controls** | Full desktop (WASD/Mouse/Space/R) and mobile touchscreen (Virtual joystick + 360° aim + tap FIRE button). |
| **Audio** | Compliant with CrazyGames browser autoplay requirements (unlocks on user gesture) and platform settings `muteAudio`. |

---

## 3. Uploading to CrazyGames Developer Portal

1. Log in to [developer.crazygames.com](https://developer.crazygames.com).
2. Go to your game draft (`PUMPKIN PANIC.IO`).
3. Under **"Upload files *"**:
   - Upload **`pumpkin-panic-crazygames.zip`** from `NEW_UPDATE_UPLOAD/`.
4. Under **"Does your game save progress? *"**:
   - Select: **`🔘 Yes, using the Data Module from the CrazyGames SDK`**.
5. Under **"Game options"**:
   - ☑ **The game supports mobile devices**
   - **Mobile orientation***: **`BOTH`**
   - ☑ **The game is an online multiplayer game**
   - ☑ **The game supports CrazyGames muting audio through SDK**
6. Under **"Media"**:
   - Upload the 3 covers from `NEW_UPDATE_UPLOAD/`:
     - 16:9 Landscape (1920x1080)
     - 2:3 Portrait (800x1200)
     - 1:1 Square (800x800)
7. Preview in the CrazyGames QA Sandbox iframe:
   - Verify Quick Match connects to the live arena lobby!
   - Click "PLAY ONLINE MULTIPLAYER" or "OFFLINE BATTLE ROYALE".
8. Click **"Submit for Review"**!
