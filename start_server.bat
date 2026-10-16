@echo off
title PUMPKIN PANIC.IO - Authoritative Multiplayer Server
color 0E

echo ===================================================
echo   🎃 PUMPKIN PANIC.IO - MULTIPLAYER SERVER (COLYSEUS)
echo ===================================================
echo.

cd /d "%~dp0server"

if not exist node_modules (
    echo [1/2] Installing server dependencies ^(Colyseus, Express, CORS^)...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Failed to install dependencies. Make sure Node.js is installed.
        pause
        exit /b %errorlevel%
    )
)

echo.
echo [2/2] Starting authoritative game server on port 2567...
echo.
echo 📡 Health check: http://localhost:2567/health
echo 🎮 Room name:    pumpkin_arena
echo.
echo Server running! Press Ctrl+C to stop.
echo ---------------------------------------------------
echo.

npm start
if %errorlevel% neq 0 (
    node src/index.js
)

pause
