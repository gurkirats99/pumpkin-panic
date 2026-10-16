/**
 * PUMPKIN PANIC.IO - Official CrazyGames SDK v3 Integration Adapter
 * 
 * Complies strictly with the official CrazyGames HTML5 SDK v3 documentation:
 * - https://sdk.crazygames.com/crazygames-sdk-v3.js
 * - Asynchronous initialization: window.CrazyGames.SDK.init()
 * - Environment detection: 'local' | 'crazygames' | 'disabled'
 * - Game lifecycle events: loadingStart(), loadingStop(), gameplayStart(), gameplayStop(), happytime()
 * - Safe video ad handling (Midgame & Rewarded) with audio muting & game pause callbacks
 * - User account authentication & system info detection
 * - Multiplayer Room Data synchronization: updateRoom(), leftRoom(), inviteLink(), addJoinRoomListener()
 * - Audio & Chat settings compliance (muteAudio, disableChat)
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};

    class CrazyGamesAdapter {
        constructor() {
            this.isAvailable = false;
            this.environment = 'disabled';
            this.currentUser = null;
            this.systemInfo = null;
            this.isAdPlaying = false;
            this.hasAdblockDetected = false;
            this.isGameplayActive = false;
            this.pendingInviteParams = null;
            this.sdkSettings = {
                muteAudio: false,
                disableChat: false
            };
        }

        /**
         * Asynchronously initialize CrazyGames SDK v3.
         * Must be called before any game logic starts.
         */
        async init() {
            if (typeof window.CrazyGames === 'undefined' || !window.CrazyGames.SDK) {
                console.log('[CrazyGames] SDK script not detected; running in standalone mode.');
                this.isAvailable = false;
                this.environment = 'disabled';
                return false;
            }

            try {
                // v3 SDK requires explicit init()
                await window.CrazyGames.SDK.init();
                this.isAvailable = true;
                this.environment = window.CrazyGames.SDK.environment || 'disabled';
                console.log(`[CrazyGames] SDK v3 initialized successfully. Environment: ${this.environment}`);

                // Retrieve device and system info if available
                if (window.CrazyGames.SDK.user && window.CrazyGames.SDK.user.systemInfo) {
                    this.systemInfo = window.CrazyGames.SDK.user.systemInfo;
                    console.log('[CrazyGames] System Info:', this.systemInfo);
                }

                // Check logged-in user profile
                await this.fetchUser();

                // Check adblock presence
                await this.checkAdblock();

                // Listen to platform game settings (muteAudio, disableChat)
                this.initSettingsListener();

                // Check if launched from platform invite parameters
                if (window.CrazyGames.SDK.game && window.CrazyGames.SDK.game.inviteParams) {
                    this.pendingInviteParams = window.CrazyGames.SDK.game.inviteParams;
                    console.log('[CrazyGames] Launched with inviteParams:', this.pendingInviteParams);
                }

                // Register listener for runtime room joins via friends drawer
                if (window.CrazyGames.SDK.game && typeof window.CrazyGames.SDK.game.addJoinRoomListener === 'function') {
                    window.CrazyGames.SDK.game.addJoinRoomListener((params) => {
                        this.handleJoinRoomNotification(params);
                    });
                }

                return true;
            } catch (err) {
                console.warn('[CrazyGames] SDK init encountered error:', err);
                this.isAvailable = false;
                this.environment = 'disabled';
                return false;
            }
        }

        isOperating() {
            return this.isAvailable && (this.environment === 'crazygames' || this.environment === 'local');
        }

        async fetchUser() {
            if (!this.isOperating() || !window.CrazyGames.SDK.user) return null;
            try {
                if (window.CrazyGames.SDK.user.isUserAccountAvailable) {
                    const user = await window.CrazyGames.SDK.user.getUser();
                    if (user && user.username) {
                        this.currentUser = user;
                        console.log(`[CrazyGames] Logged in as: ${user.username}`);
                        return user;
                    }
                }
            } catch (e) {
                console.log('[CrazyGames] User not authenticated or guest player.');
            }
            return null;
        }

        async checkAdblock() {
            if (!this.isOperating() || !window.CrazyGames.SDK.ad || typeof window.CrazyGames.SDK.ad.hasAdblock !== 'function') {
                return false;
            }
            try {
                this.hasAdblockDetected = await window.CrazyGames.SDK.ad.hasAdblock();
                if (this.hasAdblockDetected) {
                    console.log('[CrazyGames] Adblocker detected on client.');
                }
                return this.hasAdblockDetected;
            } catch (e) {
                return false;
            }
        }

        initSettingsListener() {
            if (!this.isOperating() || !window.CrazyGames.SDK.game) return;

            if (window.CrazyGames.SDK.game.settings) {
                this.sdkSettings = Object.assign(this.sdkSettings, window.CrazyGames.SDK.game.settings);
                this.applySettings();
            }

            if (typeof window.CrazyGames.SDK.game.addSettingsChangeListener === 'function') {
                window.CrazyGames.SDK.game.addSettingsChangeListener((newSettings) => {
                    console.log('[CrazyGames] Settings updated:', newSettings);
                    this.sdkSettings = Object.assign(this.sdkSettings, newSettings);
                    this.applySettings();
                });
            }
        }

        applySettings() {
            if (this.sdkSettings.muteAudio && window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.mute();
            }
        }

        // ==========================================
        // GAME LIFECYCLE & PERFORMANCE TRACKING
        // ==========================================

        loadingStart() {
            if (this.isOperating() && window.CrazyGames.SDK.game && typeof window.CrazyGames.SDK.game.loadingStart === 'function') {
                try {
                    window.CrazyGames.SDK.game.loadingStart();
                } catch (e) {}
            }
        }

        loadingStop() {
            if (this.isOperating() && window.CrazyGames.SDK.game && typeof window.CrazyGames.SDK.game.loadingStop === 'function') {
                try {
                    window.CrazyGames.SDK.game.loadingStop();
                } catch (e) {}
            }
        }

        gameplayStart() {
            if (this.isGameplayActive) return;
            this.isGameplayActive = true;

            if (this.isOperating() && window.CrazyGames.SDK.game && typeof window.CrazyGames.SDK.game.gameplayStart === 'function') {
                try {
                    window.CrazyGames.SDK.game.gameplayStart();
                    console.log('[CrazyGames] gameplayStart() triggered');
                } catch (e) {}
            }
        }

        gameplayStop() {
            if (!this.isGameplayActive) return;
            this.isGameplayActive = false;

            if (this.isOperating() && window.CrazyGames.SDK.game && typeof window.CrazyGames.SDK.game.gameplayStop === 'function') {
                try {
                    window.CrazyGames.SDK.game.gameplayStop();
                    console.log('[CrazyGames] gameplayStop() triggered');
                } catch (e) {}
            }
        }

        happytime() {
            if (this.isOperating() && window.CrazyGames.SDK.game && typeof window.CrazyGames.SDK.game.happytime === 'function') {
                try {
                    window.CrazyGames.SDK.game.happytime();
                } catch (e) {}
            }
        }

        // ==========================================
        // VIDEO ADVERTISEMENTS (MIDGAME & REWARDED)
        // ==========================================

        requestMidgameAd(onComplete) {
            if (!this.isOperating() || !window.CrazyGames.SDK.ad) {
                if (onComplete) onComplete(false);
                return;
            }

            const callbacks = {
                adStarted: () => {
                    this.isAdPlaying = true;
                    if (window.PumpkinPanic.AudioSystem) {
                        window.PumpkinPanic.AudioSystem.mute();
                    }
                },
                adFinished: () => {
                    this.isAdPlaying = false;
                    if (window.PumpkinPanic.AudioSystem && (!window.PumpkinPanic.ui || !window.PumpkinPanic.ui.isManuallyMuted)) {
                        window.PumpkinPanic.AudioSystem.unmute();
                    }
                    if (onComplete) onComplete(true);
                },
                adError: (error) => {
                    this.isAdPlaying = false;
                    console.log('[CrazyGames] Midgame ad bypassed or unfilled:', error ? error.code : 'unknown');
                    if (window.PumpkinPanic.AudioSystem && (!window.PumpkinPanic.ui || !window.PumpkinPanic.ui.isManuallyMuted)) {
                        window.PumpkinPanic.AudioSystem.unmute();
                    }
                    if (onComplete) onComplete(false);
                }
            };

            try {
                window.CrazyGames.SDK.ad.requestAd("midgame", callbacks);
            } catch (err) {
                console.warn('[CrazyGames] Error requesting midgame ad:', err);
                if (onComplete) onComplete(false);
            }
        }

        requestRewardedAd(onRewarded, onFailed) {
            if (!this.isOperating() || !window.CrazyGames.SDK.ad) {
                if (onFailed) onFailed({ code: 'sdkUnavailable', message: 'CrazyGames SDK not available' });
                return;
            }

            const callbacks = {
                adStarted: () => {
                    this.isAdPlaying = true;
                    if (window.PumpkinPanic.AudioSystem) {
                        window.PumpkinPanic.AudioSystem.mute();
                    }
                },
                adFinished: () => {
                    this.isAdPlaying = false;
                    if (window.PumpkinPanic.AudioSystem && (!window.PumpkinPanic.ui || !window.PumpkinPanic.ui.isManuallyMuted)) {
                        window.PumpkinPanic.AudioSystem.unmute();
                    }
                    if (onRewarded) onRewarded();
                },
                adError: (error) => {
                    this.isAdPlaying = false;
                    console.log('[CrazyGames] Rewarded ad unfilled/error:', error);
                    if (window.PumpkinPanic.AudioSystem && (!window.PumpkinPanic.ui || !window.PumpkinPanic.ui.isManuallyMuted)) {
                        window.PumpkinPanic.AudioSystem.unmute();
                    }
                    if (onFailed) onFailed(error);
                }
            };

            try {
                window.CrazyGames.SDK.ad.requestAd("rewarded", callbacks);
            } catch (err) {
                console.warn('[CrazyGames] Error requesting rewarded ad:', err);
                if (onFailed) onFailed(err);
            }
        }

        // ==========================================
        // MULTIPLAYER ROOM & FRIENDS INTEGRATION
        // ==========================================

        updateRoom(roomData) {
            if (!this.isOperating() || !window.CrazyGames.SDK.game || typeof window.CrazyGames.SDK.game.updateRoom !== 'function') {
                return;
            }
            try {
                window.CrazyGames.SDK.game.updateRoom(roomData);
                console.log('[CrazyGames] updateRoom synced:', roomData);
            } catch (e) {
                console.warn('[CrazyGames] updateRoom failed:', e);
            }
        }

        leftRoom() {
            if (!this.isOperating() || !window.CrazyGames.SDK.game || typeof window.CrazyGames.SDK.game.leftRoom !== 'function') {
                return;
            }
            try {
                window.CrazyGames.SDK.game.leftRoom();
                console.log('[CrazyGames] leftRoom() signaled');
            } catch (e) {}
        }

        getPlatformInviteLink(params = {}) {
            if (this.isOperating() && window.CrazyGames.SDK.game && typeof window.CrazyGames.SDK.game.inviteLink === 'function') {
                try {
                    const link = window.CrazyGames.SDK.game.inviteLink(params);
                    if (link) return link;
                } catch (e) {}
            }
            // Fallback to direct URL parameter
            const code = params.room || params.roomName || '';
            const base = window.location.href.split('?')[0];
            return `${base}?room=${encodeURIComponent(code)}`;
        }

        handleJoinRoomNotification(inviteParams) {
            console.log('[CrazyGames] Received room join listener notification:', inviteParams);
            const roomCode = inviteParams.room || inviteParams.roomName || inviteParams.roomId;
            if (roomCode && window.PumpkinPanic.ui) {
                window.PumpkinPanic.ui.startMultiplayerGame({ mode: 'join', roomCode: roomCode });
            }
        }

        isInstantMultiplayer() {
            if (this.isOperating() && window.CrazyGames.SDK.game) {
                return !!window.CrazyGames.SDK.game.isInstantMultiplayer;
            }
            return false;
        }

        getDeviceType() {
            if (this.systemInfo && this.systemInfo.device && this.systemInfo.device.type) {
                return this.systemInfo.device.type; // 'desktop' | 'tablet' | 'mobile'
            }
            const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 900);
            return isTouch ? 'mobile' : 'desktop';
        }
    }

    window.PumpkinPanic.CrazyGames = new CrazyGamesAdapter();
})();
