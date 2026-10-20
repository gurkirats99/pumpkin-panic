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
                let isAvailable = true;
                if (typeof window.CrazyGames.SDK.user.isUserAccountAvailable === 'function') {
                    isAvailable = await window.CrazyGames.SDK.user.isUserAccountAvailable();
                } else if (typeof window.CrazyGames.SDK.user.isUserAccountAvailable === 'boolean') {
                    isAvailable = window.CrazyGames.SDK.user.isUserAccountAvailable;
                }

                if (isAvailable && typeof window.CrazyGames.SDK.user.getUser === 'function') {
                    const user = await window.CrazyGames.SDK.user.getUser();
                    if (user && user.username) {
                        this.currentUser = user;
                        console.log(`[CrazyGames] Logged in as: ${user.username}`);
                        return user;
                    }
                }
            } catch (e) {
                console.log('[CrazyGames] User not authenticated or guest player:', e);
            }
            return null;
        }

        /**
         * Trigger the CrazyGames login / register modal prompt for guest players.
         */
        async promptAuth() {
            if (!this.isOperating() || !window.CrazyGames.SDK.user || typeof window.CrazyGames.SDK.user.showAuthPrompt !== 'function') {
                console.log('[CrazyGames] Auth prompt not available in current environment.');
                return null;
            }
            try {
                const user = await window.CrazyGames.SDK.user.showAuthPrompt();
                if (user && user.username) {
                    this.currentUser = user;
                    console.log('[CrazyGames] Player logged in via auth prompt:', user.username);
                    return user;
                }
            } catch (err) {
                console.log('[CrazyGames] Auth prompt dismissed or encountered error:', err);
            }
            return null;
        }

        /**
         * Register a callback listener when a guest logs into their CrazyGames account during gameplay.
         */
        addAuthListener(callback) {
            if (!this.isOperating() || !window.CrazyGames.SDK.user || typeof window.CrazyGames.SDK.user.addAuthListener !== 'function') {
                return;
            }
            try {
                window.CrazyGames.SDK.user.addAuthListener((user) => {
                    console.log('[CrazyGames] Auth listener triggered! User logged in:', user);
                    this.currentUser = user;
                    if (callback) callback(user);
                });
            } catch (e) {
                console.warn('[CrazyGames] addAuthListener failed:', e);
            }
        }

        // ==========================================
        // DATA MODULE (CLOUD PROGRESS & STORAGE)
        // ==========================================

        /**
         * Retrieve a string key from CrazyGames Data Module with LocalStorage fallback.
         */
        getData(key, defaultValue = null) {
            try {
                if (this.isOperating() && window.CrazyGames.SDK.data && typeof window.CrazyGames.SDK.data.getItem === 'function') {
                    const val = window.CrazyGames.SDK.data.getItem(key);
                    if (val !== null && val !== undefined) return val;
                }
            } catch (e) {
                console.warn('[CrazyGames] data.getItem failed, falling back to LocalStorage:', e);
            }
            try {
                const localVal = localStorage.getItem(key);
                return (localVal !== null && localVal !== undefined) ? localVal : defaultValue;
            } catch (e) {
                return defaultValue;
            }
        }

        /**
         * Save a string key to CrazyGames Data Module with LocalStorage backup.
         */
        setData(key, value) {
            const strVal = String(value);
            try {
                if (this.isOperating() && window.CrazyGames.SDK.data && typeof window.CrazyGames.SDK.data.setItem === 'function') {
                    window.CrazyGames.SDK.data.setItem(key, strVal);
                }
            } catch (e) {
                console.warn('[CrazyGames] data.setItem failed:', e);
            }
            try {
                localStorage.setItem(key, strVal);
            } catch (e) {}
        }

        /**
         * Remove a key from CrazyGames Data Module and LocalStorage.
         */
        removeData(key) {
            try {
                if (this.isOperating() && window.CrazyGames.SDK.data && typeof window.CrazyGames.SDK.data.removeItem === 'function') {
                    window.CrazyGames.SDK.data.removeItem(key);
                }
            } catch (e) {}
            try {
                localStorage.removeItem(key);
            } catch (e) {}
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
            // Ads disabled per user release specification
            if (onComplete) onComplete(true);
        }

        requestRewardedAd(onRewarded, onFailed) {
            // Ads disabled per user release specification
            if (onRewarded) onRewarded();
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
