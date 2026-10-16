@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo   PUMPKIN PANIC.IO - GitHub Push Script
echo ========================================================
echo.

:: 1. Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed or not in PATH.
    echo Please install Git from https://git-scm.com/
    pause
    exit /b 1
)

:: 2. Initialize git if not already initialized
if not exist ".git" (
    echo [*] Initializing new Git repository...
    git init
    git branch -M main
) else (
    echo [*] Existing Git repository detected.
)

:: 3. Stage files
echo [*] Staging project files (respecting .gitignore)...
git add .

:: 4. Commit
echo [*] Creating commit...
git commit -m "feat: complete CrazyGames submission build with authoritative multiplayer server and responsive controls"

:: 5. Remote check
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo [!] No GitHub remote URL found.
    set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/YOUR_USER/pumpkin-panic.git): "
    if "!REPO_URL!"=="" (
        echo [ERROR] Repository URL cannot be empty.
        pause
        exit /b 1
    )
    git remote add origin !REPO_URL!
)

:: 6. Push
echo [*] Pushing to GitHub (main branch)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo   SUCCESS! PUMPKIN PANIC.IO pushed to GitHub!
    echo ========================================================
) else (
    echo.
    echo [NOTE] If push was rejected, you may need to run:
    echo        git push -u origin main --force
)

echo.
pause
