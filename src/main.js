/**
 * PUMPKIN PANIC.IO - Main Entry Point
 * Initializes Phaser 3 Game instance, scales viewport, and mounts UIManager.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};

    async function initGame() {
        // Initialize CrazyGames SDK v3
        if (window.PumpkinPanic.CrazyGames) {
            await window.PumpkinPanic.CrazyGames.init();
        }

        // Initialize UIManager
        window.PumpkinPanic.ui = new window.PumpkinPanic.UIManager();

        // If logged into CrazyGames, use player's CrazyGames username
        if (window.PumpkinPanic.CrazyGames && window.PumpkinPanic.CrazyGames.currentUser) {
            const cgUser = window.PumpkinPanic.CrazyGames.currentUser;
            if (cgUser.username) {
                window.PumpkinPanic.ui.playerName = cgUser.username;
                if (window.PumpkinPanic.ui.nameInput) {
                    window.PumpkinPanic.ui.nameInput.value = cgUser.username;
                }
            }
        }

        // Setup Phaser Game Configuration
        const config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#160c28',
            pixelArt: false,
            antialias: true,
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: [
                window.PumpkinPanic.BootScene,
                window.PumpkinPanic.GameScene
            ]
        };

        const game = new Phaser.Game(config);
        window.PumpkinPanic.game = game;

        // Listen for scene events to forward to UI
        game.events.on('ready', () => {
            const gameScene = game.scene.getScene('GameScene');
            if (gameScene) {
                gameScene.events.on('leaderboard_updated', (data) => {
                    if (window.PumpkinPanic.ui) {
                        window.PumpkinPanic.ui.updateLeaderboard(data.rankings, data.playerRank);
                    }
                });
            }

            // If platform requests instant multiplayer, start directly into match
            if (window.PumpkinPanic.CrazyGames && window.PumpkinPanic.CrazyGames.isInstantMultiplayer()) {
                console.log('[CrazyGames] isInstantMultiplayer is active; joining match directly');
                if (window.PumpkinPanic.ui) {
                    window.PumpkinPanic.ui.startMultiplayerGame({ mode: 'quick' });
                }
            } else if (window.PumpkinPanic.CrazyGames && window.PumpkinPanic.CrazyGames.pendingInviteParams) {
                const invite = window.PumpkinPanic.CrazyGames.pendingInviteParams;
                const roomCode = invite.room || invite.roomName || invite.roomId;
                if (roomCode && window.PumpkinPanic.ui) {
                    console.log('[CrazyGames] Auto-joining room from startup invite params:', roomCode);
                    window.PumpkinPanic.ui.startMultiplayerGame({ mode: 'join', roomCode: roomCode });
                }
            }
        });
    }

    // Start when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGame);
    } else {
        initGame();
    }
})();
