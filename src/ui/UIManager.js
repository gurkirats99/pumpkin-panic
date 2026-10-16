/**
 * PUMPKIN PANIC.IO - User Interface Manager
 * Handles HTML5/CSS Start Screen, Skin Shop & Coin Economy,
 * Mobile Virtual Joystick & Touch Controls, HUD, and End Screen.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};
    const Config = window.PumpkinPanic.Config;

    class UIManager {
        constructor() {
            this.gameScene = null;
            this.selectedSkin = localStorage.getItem('pumpkin_panic_skin') || 'classic';
            this.playerName = localStorage.getItem('pumpkin_panic_name') || 'SpookyPumpkin';

            // Coin Currency & Hard Progression Unlocks (v3)
            if (localStorage.getItem('pumpkin_economy_v3') !== 'true') {
                localStorage.setItem('pumpkin_economy_v3', 'true');
                localStorage.setItem('pumpkin_coins', (Config.ECONOMY.STARTING_COINS || 25).toString());
                localStorage.setItem('pumpkin_unlocked_skins', JSON.stringify(['classic']));
                localStorage.setItem('pumpkin_panic_skin', 'classic');
                this.coins = Config.ECONOMY.STARTING_COINS || 25;
                this.unlockedSkins = ['classic'];
                this.selectedSkin = 'classic';
            } else {
                const savedCoins = localStorage.getItem('pumpkin_coins');
                this.coins = (savedCoins !== null) ? parseInt(savedCoins) : (Config.ECONOMY.STARTING_COINS || 25);
                try {
                    this.unlockedSkins = JSON.parse(localStorage.getItem('pumpkin_unlocked_skins')) || ['classic'];
                } catch (e) {
                    this.unlockedSkins = ['classic'];
                }
                if (!this.unlockedSkins.includes('classic')) {
                    this.unlockedSkins.push('classic');
                }
            }

            // Equipped Weapon from Armory
            this.selectedGun = localStorage.getItem('pumpkin_equipped_gun') || 'SEED_PISTOL';
            try {
                this.unlockedGuns = JSON.parse(localStorage.getItem('pumpkin_unlocked_guns')) || ['SEED_PISTOL'];
            } catch (e) {
                this.unlockedGuns = ['SEED_PISTOL'];
            }
            if (!this.unlockedGuns.includes('SEED_PISTOL')) {
                this.unlockedGuns.push('SEED_PISTOL');
            }

            // Cache DOM elements
            this.startScreen = document.getElementById('start-screen');
            this.hud = document.getElementById('hud');
            this.endScreen = document.getElementById('end-screen');
            this.howToPlayModal = document.getElementById('how-to-play-modal');

            // Start Screen Inputs & Elements
            this.nameInput = document.getElementById('player-name-input');
            this.playBtn = document.getElementById('play-btn');
            this.playMultiplayerBtn = document.getElementById('play-multiplayer-btn');
            this.playLocalBtn = document.getElementById('play-local-btn');
            this.howToPlayBtn = document.getElementById('how-to-play-btn');
            this.closeHelpBtn = document.getElementById('close-help-btn');
            this.muteBtn = document.getElementById('audio-toggle-btn');
            this.skinContainer = document.getElementById('skin-selector');
            this.gunContainer = document.getElementById('gun-selector');
            this.shopTabSkins = document.getElementById('shop-tab-skins');
            this.shopTabGuns = document.getElementById('shop-tab-guns');
            this.skinsPanel = document.getElementById('skins-shop-panel');
            this.gunsPanel = document.getElementById('guns-shop-panel');
            this.menuCoinsDisplay = document.getElementById('menu-coins-amount');

            // Multiplayer Matchmaking Modal Elements
            this.multiplayerModal = document.getElementById('multiplayer-modal');
            this.closeMultiplayerBtn = document.getElementById('close-multiplayer-btn');
            this.serverStatusDot = document.getElementById('server-status-dot');
            this.serverStatusText = document.getElementById('server-status-text');
            this.recheckServerBtn = document.getElementById('recheck-server-btn');
            this.mpQuickPlayBtn = document.getElementById('mp-quick-play-btn');
            this.mpCreateRoomBtn = document.getElementById('mp-create-room-btn');
            this.mpRoomCodeInput = document.getElementById('mp-room-code-input');
            this.mpJoinCodeBtn = document.getElementById('mp-join-code-btn');
            this.serverUrlInput = document.getElementById('server-url-input');
            this.saveServerUrlBtn = document.getElementById('save-server-url-btn');
            this.resetServerUrlBtn = document.getElementById('reset-server-url-btn');
            this.mpFallbackLocalBtn = document.getElementById('mp-fallback-local-btn');

            // Multiplayer Lobby Modal Elements
            this.lobbyModal = document.getElementById('multiplayer-lobby-modal');
            this.closeLobbyBtn = document.getElementById('close-lobby-btn');
            this.lobbyStatusDot = document.getElementById('lobby-status-dot');
            this.lobbyStatusText = document.getElementById('lobby-status-text');
            this.lobbyRoomCodeDisplay = document.getElementById('lobby-room-code-display');
            this.lobbyCopyCodeBtn = document.getElementById('lobby-copy-code-btn');
            this.lobbyShareLinkBtn = document.getElementById('lobby-share-link-btn');
            this.lobbyCopyFeedback = document.getElementById('lobby-copy-feedback');
            this.lobbyPlayerCount = document.getElementById('lobby-player-count');
            this.lobbyMaxPlayers = document.getElementById('lobby-max-players');
            this.lobbyBotInfoBadge = document.getElementById('lobby-bot-info-badge');
            this.lobbyPlayersList = document.getElementById('lobby-players-list');
            this.lobbyCountdownTitle = document.getElementById('lobby-countdown-title');
            this.lobbyCountdownDesc = document.getElementById('lobby-countdown-desc');
            this.lobbyCountdownTimer = document.getElementById('lobby-countdown-timer');
            this.lobbyStartBtn = document.getElementById('lobby-start-btn');
            this.lobbyLeaveBtn = document.getElementById('lobby-leave-btn');

            // Multiplayer Status Toast Elements
            this.statusToast = document.getElementById('mp-status-toast');
            this.toastStatusDot = document.getElementById('toast-status-dot');
            this.toastStatusTitle = document.getElementById('toast-status-title');
            this.toastStatusDesc = document.getElementById('toast-status-desc');
            this.toastTimeout = null;

            // Invite Prompt Modal Elements
            this.inviteModal = document.getElementById('invite-prompt-modal');
            this.inviteRoomCodeTag = document.getElementById('invite-room-code-tag');
            this.invitePlayerName = document.getElementById('invite-player-name');
            this.inviteJoinBtn = document.getElementById('invite-join-btn');
            this.inviteDeclineBtn = document.getElementById('invite-decline-btn');
            this.pendingInviteCode = null;
            this.lobbyCountdownInterval = null;

            // Connection Error Modal Elements
            this.connectionErrorModal = document.getElementById('connection-error-modal');
            this.connectionErrorMessage = document.getElementById('connection-error-message');
            this.errorFallbackLocalBtn = document.getElementById('error-fallback-local-btn');
            this.errorCloseBtn = document.getElementById('error-close-btn');

            // Reconnecting Modal Elements
            this.reconnectingModal = document.getElementById('reconnecting-modal');
            this.reconnectNowBtn = document.getElementById('reconnect-now-btn');
            this.reconnectLocalBtn = document.getElementById('reconnect-local-btn');

            // Rewarded Ad Elements
            this.rewardedAdContainer = document.getElementById('rewarded-ad-container');
            this.rewardedCoinsBtn = document.getElementById('rewarded-coins-btn');

            // HUD Room Code Pill
            this.hudRoomPill = document.getElementById('hud-room-pill');
            this.hudRoomCodeText = document.getElementById('hud-room-code-text');

            // HUD Elements
            this.hpFill = document.getElementById('hud-hp-fill');
            this.hpText = document.getElementById('hud-hp-text');
            this.xpFill = document.getElementById('hud-xp-fill');
            this.xpText = document.getElementById('hud-xp-text');
            this.lvlBadge = document.getElementById('hud-lvl-badge');
            this.hudPlayerName = document.getElementById('hud-player-name');
            this.aliveCountEl = document.getElementById('hud-alive-count');
            this.timerEl = document.getElementById('hud-timer');
            this.killsEl = document.getElementById('hud-kills');
            this.hudCoinsEl = document.getElementById('hud-coins');
            this.leaderboardList = document.getElementById('leaderboard-list');
            this.stormAlert = document.getElementById('storm-alert-banner');
            this.minimapCanvas = document.getElementById('minimap-canvas');
            this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;

            // Elimination Announcement & Weapon Mutation Elements
            this.elimBanner = document.getElementById('elimination-announcement');
            this.elimKiller = document.getElementById('elim-killer');
            this.elimVictim = document.getElementById('elim-victim');
            this.elimTimeout = null;

            this.weaponBadge = document.getElementById('hud-weapon-badge');
            this.weaponIcon = document.getElementById('hud-weapon-icon');
            this.weaponName = document.getElementById('hud-weapon-name');
            this.weaponDurationFill = document.getElementById('hud-weapon-duration-fill');

            // End Screen Elements
            this.endTitle = document.getElementById('end-title');
            this.endSubtitle = document.getElementById('end-subtitle');
            this.killerCard = document.getElementById('killer-card');
            this.killerName = document.getElementById('killer-name');
            this.statRank = document.getElementById('stat-rank');
            this.statKills = document.getElementById('stat-kills');
            this.statTime = document.getElementById('stat-time');
            this.statLevel = document.getElementById('stat-level');
            this.statScore = document.getElementById('stat-score');
            this.statCoinsEarned = document.getElementById('stat-coins-earned');
            this.playAgainBtn = document.getElementById('play-again-btn');
            this.mainMenuBtn = document.getElementById('main-menu-btn');

            // Mobile Virtual Joystick elements
            this.joystickBase = document.getElementById('virtual-joystick-base');
            this.joystickKnob = document.getElementById('virtual-joystick-knob');
            this.mobileFireBtn = document.getElementById('mobile-fire-btn');
            this.touchMoveId = null;
            this.touchAimId = null;
            this.joystickOrigin = { x: 0, y: 0 };

            this.initEvents();
            this.initSkinSelector();
            this.initGunSelector();
            this.updateAudioButtonState();
            this.updateCoinsDisplay();
            this.initMobileControls();
        }

        initEvents() {
            // Shop Tabs Switcher (Skins vs Weapons)
            if (this.shopTabSkins && this.shopTabGuns) {
                this.shopTabSkins.addEventListener('click', () => {
                    this.shopTabSkins.classList.add('active');
                    this.shopTabGuns.classList.remove('active');
                    if (this.skinsPanel) this.skinsPanel.classList.remove('hidden');
                    if (this.gunsPanel) this.gunsPanel.classList.add('hidden');
                    this.initSkinSelector();
                });
                this.shopTabGuns.addEventListener('click', () => {
                    this.shopTabGuns.classList.add('active');
                    this.shopTabSkins.classList.remove('active');
                    if (this.gunsPanel) this.gunsPanel.classList.remove('hidden');
                    if (this.skinsPanel) this.skinsPanel.classList.add('hidden');
                    this.initGunSelector();
                });
            }

            // Player Name input
            if (this.nameInput) {
                this.nameInput.value = this.playerName;
                this.nameInput.addEventListener('input', (e) => {
                    this.playerName = e.target.value.trim() || 'SpookyPumpkin';
                    localStorage.setItem('pumpkin_panic_name', this.playerName);
                });
            }

            // Primary Play Buttons
            if (this.playMultiplayerBtn) {
                this.playMultiplayerBtn.addEventListener('click', () => {
                    this.openMultiplayerModal();
                });
            }
            if (this.playLocalBtn) {
                this.playLocalBtn.addEventListener('click', () => {
                    this.startLocalGame();
                });
            }
            if (this.playBtn) {
                this.playBtn.addEventListener('click', () => {
                    this.startLocalGame();
                });
            }

            // Multiplayer Modal Events
            if (this.closeMultiplayerBtn && this.multiplayerModal) {
                this.closeMultiplayerBtn.addEventListener('click', () => {
                    this.multiplayerModal.classList.add('hidden');
                });
            }
            if (this.recheckServerBtn) {
                this.recheckServerBtn.addEventListener('click', () => {
                    this.checkServerHealth();
                });
            }
            if (this.mpQuickPlayBtn) {
                this.mpQuickPlayBtn.addEventListener('click', () => {
                    this.startMultiplayerGame({ mode: 'quick' });
                });
            }
            if (this.mpCreateRoomBtn) {
                this.mpCreateRoomBtn.addEventListener('click', () => {
                    const shortCode = 'PUMP' + Math.floor(10 + Math.random() * 90);
                    this.startMultiplayerGame({ mode: 'create', roomCode: shortCode });
                });
            }
            if (this.mpJoinCodeBtn) {
                this.mpJoinCodeBtn.addEventListener('click', () => {
                    this.handleJoinByCode();
                });
            }
            if (this.mpRoomCodeInput) {
                this.mpRoomCodeInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.handleJoinByCode();
                    }
                });
            }
            if (this.saveServerUrlBtn && this.serverUrlInput) {
                this.saveServerUrlBtn.addEventListener('click', () => {
                    const val = this.serverUrlInput.value.trim();
                    if (val) {
                        localStorage.setItem('pumpkin_panic_server_url', val);
                        if (Config.MULTIPLAYER) {
                            Config.MULTIPLAYER.SERVER_URL = val;
                        }
                        this.checkServerHealth();
                    }
                });
            }
            if (this.resetServerUrlBtn && this.serverUrlInput) {
                this.resetServerUrlBtn.addEventListener('click', () => {
                    localStorage.removeItem('pumpkin_panic_server_url');
                    const defaultUrl = Config.MULTIPLAYER ? Config.MULTIPLAYER.DEFAULT_LOCAL_URL : 'ws://localhost:2567';
                    this.serverUrlInput.value = defaultUrl;
                    if (Config.MULTIPLAYER) {
                        Config.MULTIPLAYER.SERVER_URL = defaultUrl;
                    }
                    this.checkServerHealth();
                });
            }
            if (this.mpFallbackLocalBtn) {
                this.mpFallbackLocalBtn.addEventListener('click', () => {
                    this.startLocalGame();
                });
            }

            // Multiplayer Lobby Modal Controls
            if (this.lobbyCopyCodeBtn) {
                this.lobbyCopyCodeBtn.addEventListener('click', () => {
                    this.copyRoomCode();
                });
            }
            if (this.lobbyShareLinkBtn) {
                this.lobbyShareLinkBtn.addEventListener('click', () => {
                    this.copyInviteLink();
                });
            }
            if (this.lobbyStartBtn) {
                this.lobbyStartBtn.addEventListener('click', () => {
                    this.launchMatchFromLobby();
                });
            }
            if (this.lobbyLeaveBtn) {
                this.lobbyLeaveBtn.addEventListener('click', () => {
                    this.leaveLobby();
                });
            }
            if (this.closeLobbyBtn) {
                this.closeLobbyBtn.addEventListener('click', () => {
                    this.leaveLobby();
                });
            }

            // Invite Detected Modal Controls
            if (this.inviteJoinBtn) {
                this.inviteJoinBtn.addEventListener('click', () => {
                    if (this.invitePlayerName) {
                        const name = this.invitePlayerName.value.trim() || 'SpookyPumpkin';
                        this.playerName = name;
                        localStorage.setItem('pumpkin_panic_name', name);
                        if (this.nameInput) this.nameInput.value = name;
                    }
                    if (this.inviteModal) this.inviteModal.classList.add('hidden');
                    if (this.pendingInviteCode) {
                        this.startMultiplayerGame({ mode: 'join', roomCode: this.pendingInviteCode });
                    }
                });
            }
            if (this.inviteDeclineBtn && this.inviteModal) {
                this.inviteDeclineBtn.addEventListener('click', () => {
                    this.inviteModal.classList.add('hidden');
                });
            }

            // Check for invite links in URL parameters on startup
            this.checkForInviteUrl();

            // Connection Error Modal Events
            if (this.errorFallbackLocalBtn) {
                this.errorFallbackLocalBtn.addEventListener('click', () => {
                    this.startLocalGame();
                });
            }
            if (this.errorCloseBtn && this.connectionErrorModal) {
                this.errorCloseBtn.addEventListener('click', () => {
                    this.connectionErrorModal.classList.add('hidden');
                });
            }

            // HUD Room Code Pill (Click to copy)
            if (this.hudRoomPill) {
                this.hudRoomPill.addEventListener('click', () => {
                    const code = this.hudRoomCodeText ? this.hudRoomCodeText.innerText.trim() : '';
                    if (code && navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(code).then(() => {
                            const copyLbl = this.hudRoomPill.querySelector('.copy-lbl');
                            if (copyLbl) {
                                const orig = copyLbl.innerText;
                                copyLbl.innerText = 'COPIED!';
                                setTimeout(() => { copyLbl.innerText = orig; }, 1500);
                            }
                        }).catch(() => {});
                    }
                });
            }

            // How to Play Modal
            if (this.howToPlayBtn && this.howToPlayModal) {
                this.howToPlayBtn.addEventListener('click', () => {
                    this.howToPlayModal.classList.remove('hidden');
                });
            }
            if (this.closeHelpBtn && this.howToPlayModal) {
                this.closeHelpBtn.addEventListener('click', () => {
                    this.howToPlayModal.classList.add('hidden');
                });
            }

            // Audio Mute Toggle
            if (this.muteBtn) {
                this.muteBtn.addEventListener('click', () => {
                    if (window.PumpkinPanic.AudioSystem) {
                        window.PumpkinPanic.AudioSystem.resumeContext();
                        window.PumpkinPanic.AudioSystem.toggleMute();
                        this.updateAudioButtonState();
                    }
                });
            }

            // Play Again Button (Instant Replay with Midgame Ad flow)
            if (this.playAgainBtn) {
                this.playAgainBtn.addEventListener('click', () => {
                    this.hideEndScreen();
                    if (window.PumpkinPanic.CrazyGames) {
                        window.PumpkinPanic.CrazyGames.requestMidgameAd(() => {
                            if (this.gameScene) this.gameScene.restartMatch();
                        });
                    } else {
                        if (this.gameScene) this.gameScene.restartMatch();
                    }
                });
            }

            // Main Menu Button (with Midgame Ad flow)
            if (this.mainMenuBtn) {
                this.mainMenuBtn.addEventListener('click', () => {
                    this.hideEndScreen();
                    if (window.PumpkinPanic.CrazyGames) {
                        window.PumpkinPanic.CrazyGames.requestMidgameAd(() => {
                            if (this.gameScene) this.gameScene.returnToMenu();
                        });
                    } else {
                        if (this.gameScene) this.gameScene.returnToMenu();
                    }
                });
            }

            // Rewarded Ad for Bonus Coins
            if (this.rewardedCoinsBtn) {
                this.rewardedCoinsBtn.addEventListener('click', () => {
                    if (!window.PumpkinPanic.CrazyGames) return;
                    this.rewardedCoinsBtn.disabled = true;
                    this.rewardedCoinsBtn.innerHTML = '<span class="ad-badge">⏳</span> Loading Ad...';

                    window.PumpkinPanic.CrazyGames.requestRewardedAd(
                        () => {
                            // Rewarded successfully
                            this.addCoins(100);
                            this.rewardedCoinsBtn.innerHTML = '<span class="ad-badge">✅</span> +100 Coins Claimed!';
                            this.rewardedCoinsBtn.classList.add('claimed');
                            if (this.statCoinsEarned) {
                                const current = parseInt(this.statCoinsEarned.innerText.replace(/[^0-9]/g, '')) || 0;
                                this.statCoinsEarned.innerText = `+${current + 100} 🪙 (Bonus!)`;
                            }
                        },
                        (err) => {
                            this.rewardedCoinsBtn.disabled = false;
                            this.rewardedCoinsBtn.innerHTML = '<span class="ad-badge">📺 BONUS</span> Watch Ad for +100 Coins 🪙';
                        }
                    );
                });
            }

            // Reconnecting Modal Controls
            if (this.reconnectNowBtn) {
                this.reconnectNowBtn.addEventListener('click', () => {
                    if (this.reconnectingModal) this.reconnectingModal.classList.add('hidden');
                    if (this.currentRoomCode && this.currentRoomCode !== '------') {
                        this.startMultiplayerGame({ mode: 'join', roomCode: this.currentRoomCode });
                    } else {
                        this.startMultiplayerGame({ mode: 'quick' });
                    }
                });
            }
            if (this.reconnectLocalBtn) {
                this.reconnectLocalBtn.addEventListener('click', () => {
                    if (this.reconnectingModal) this.reconnectingModal.classList.add('hidden');
                    this.startLocalGame();
                });
            }

            // Quick Replay Keyboard Shortcuts (SPACE or R on End Screen)
            window.addEventListener('keydown', (e) => {
                if (this.endScreen && !this.endScreen.classList.contains('hidden')) {
                    if (e.code === 'Space' || e.code === 'KeyR') {
                        e.preventDefault();
                        this.hideEndScreen();
                        if (this.gameScene) {
                            this.gameScene.restartMatch();
                        }
                    }
                }
            });
        }

        // ==========================================
        // COIN ECONOMY & PERSISTENCE
        // ==========================================

        addCoins(amount) {
            this.coins += amount;
            localStorage.setItem('pumpkin_coins', this.coins);
            this.updateCoinsDisplay();

            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playCoinSound();
            }
        }

        updateCoinsDisplay() {
            if (this.menuCoinsDisplay) {
                this.menuCoinsDisplay.innerText = this.coins.toLocaleString();
            }
            if (this.hudCoinsEl) {
                this.hudCoinsEl.innerText = this.coins.toLocaleString();
            }
        }

        unlockSkin(skinKey) {
            const skin = Config.SKINS[skinKey];
            if (!skin) return;

            if (this.coins < skin.price) {
                // Not enough coins feedback
                if (window.PumpkinPanic.AudioSystem) {
                    window.PumpkinPanic.AudioSystem.playHit();
                }
                return;
            }

            // Deduct coins & unlock
            this.coins -= skin.price;
            localStorage.setItem('pumpkin_coins', this.coins);

            if (!this.unlockedSkins.includes(skinKey)) {
                this.unlockedSkins.push(skinKey);
                localStorage.setItem('pumpkin_unlocked_skins', JSON.stringify(this.unlockedSkins));
            }

            // Equip newly unlocked skin
            this.selectedSkin = skinKey;
            localStorage.setItem('pumpkin_panic_skin', skinKey);

            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playSkinUnlock();
            }

            this.updateCoinsDisplay();
            this.initSkinSelector();
        }

        // ==========================================
        // VISUAL SKIN SHOP CARDS WITH HD PREVIEWS
        // ==========================================

        initSkinSelector() {
            if (!this.skinContainer) return;
            this.skinContainer.innerHTML = '';

            for (const [key, skin] of Object.entries(Config.SKINS)) {
                const isUnlocked = this.unlockedSkins.includes(key);
                const isEquipped = (this.selectedSkin === key);

                const card = document.createElement('div');
                card.className = `skin-card ${isEquipped ? 'equipped' : ''} ${isUnlocked ? 'unlocked' : 'locked'} ${key === 'inferno' ? 'is-bomb-skin' : ''}`;

                // Skin Preview Container (Canvas / Image)
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'skin-img-wrapper';

                const img = document.createElement('img');
                img.className = 'skin-preview-img';
                img.alt = skin.name;

                // Grab HD dataURL from BootScene generator if available
                if (window.PumpkinPanic.skinPreviews && window.PumpkinPanic.skinPreviews[key]) {
                    img.src = window.PumpkinPanic.skinPreviews[key];
                } else {
                    // Fallback to canvas
                    img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><circle cx="30" cy="30" r="25" fill="%23${skin.bodyColor.toString(16).padStart(6, '0')}"/></svg>`;
                }
                imgWrapper.appendChild(img);

                // Rarity Badge
                const rarityBadge = document.createElement('span');
                rarityBadge.className = `rarity-tag rarity-${skin.rarity.toLowerCase().replace(/[^a-z]/g, '')}`;
                rarityBadge.innerText = skin.rarity;
                imgWrapper.appendChild(rarityBadge);

                // Info Section
                const infoDiv = document.createElement('div');
                infoDiv.className = 'skin-info';

                const nameEl = document.createElement('div');
                nameEl.className = 'skin-name';
                nameEl.innerText = skin.name;

                const taglineEl = document.createElement('div');
                taglineEl.className = 'skin-tagline';
                taglineEl.innerText = skin.tagline;

                infoDiv.appendChild(nameEl);
                infoDiv.appendChild(taglineEl);

                // Action Button (Equip / Unlock / Equipped)
                const btn = document.createElement('button');
                btn.type = 'button';

                if (isEquipped) {
                    btn.className = 'skin-action-btn btn-equipped';
                    btn.innerText = '✔️ EQUIPPED';
                } else if (isUnlocked) {
                    btn.className = 'skin-action-btn btn-equip';
                    btn.innerText = 'EQUIP';
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectedSkin = key;
                        localStorage.setItem('pumpkin_panic_skin', key);
                        this.initSkinSelector();
                    });
                } else {
                    btn.className = `skin-action-btn btn-unlock ${this.coins < skin.price ? 'disabled' : ''}`;
                    btn.innerHTML = `🪙 ${skin.price} UNLOCK`;
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.unlockSkin(key);
                    });
                }

                card.appendChild(imgWrapper);
                card.appendChild(infoDiv);
                card.appendChild(btn);

                // Clicking card also equips if unlocked
                if (isUnlocked && !isEquipped) {
                    card.addEventListener('click', () => {
                        this.selectedSkin = key;
                        localStorage.setItem('pumpkin_panic_skin', key);
                        this.initSkinSelector();
                    });
                }

                this.skinContainer.appendChild(card);
            }
        }

        // ==========================================
        // 22 WEAPONS ARMORY SHOP CARDS & STATS
        // ==========================================

        initGunSelector() {
            if (!this.gunContainer) return;
            this.gunContainer.innerHTML = '';

            for (const [key, gun] of Object.entries(Config.GUNS)) {
                const isUnlocked = this.unlockedGuns.includes(key);
                const isEquipped = (this.selectedGun === key);

                const card = document.createElement('div');
                card.className = `gun-card ${isEquipped ? 'equipped' : ''} ${isUnlocked ? 'unlocked' : 'locked'}`;

                // Weapon Preview Container
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'gun-img-wrapper';

                const img = document.createElement('img');
                img.className = 'gun-preview-img';
                img.alt = gun.name;

                if (window.PumpkinPanic.gunPreviews && window.PumpkinPanic.gunPreviews[key]) {
                    img.src = window.PumpkinPanic.gunPreviews[key];
                } else {
                    img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><circle cx="30" cy="30" r="25" fill="%23${gun.color ? gun.color.toString(16).padStart(6, '0') : 'ffaa00'}"/></svg>`;
                }
                imgWrapper.appendChild(img);

                // Rarity Tag
                const rarityBadge = document.createElement('span');
                rarityBadge.className = `rarity-tag rarity-${gun.rarity.toLowerCase().replace(/[^a-z]/g, '')}`;
                rarityBadge.innerText = gun.rarity;
                imgWrapper.appendChild(rarityBadge);

                // Info Section
                const infoDiv = document.createElement('div');
                infoDiv.className = 'skin-info';

                const nameEl = document.createElement('div');
                nameEl.className = 'skin-name';
                nameEl.innerText = gun.name;

                const descEl = document.createElement('div');
                descEl.className = 'skin-tagline';
                descEl.innerText = gun.desc;

                infoDiv.appendChild(nameEl);
                infoDiv.appendChild(descEl);

                // Stats Section (Damage, Rate, Speed)
                const statsRow = document.createElement('div');
                statsRow.className = 'gun-stats-row';

                const dmgPct = Math.min(100, Math.round((gun.damageMultiplier / 3.6) * 100));
                const ratePct = Math.min(100, Math.round((1 / (gun.cooldownMultiplier || 1.0) / 4.5) * 100));
                const spdPct = Math.min(100, Math.round(((gun.speedMultiplier || 1.0) / 1.85) * 100));

                statsRow.innerHTML = `
                    <div class="gun-stat-item">
                        <span>DMG</span>
                        <div class="gun-stat-bar"><div class="gun-stat-fill fill-dmg" style="width: ${dmgPct}%;"></div></div>
                    </div>
                    <div class="gun-stat-item">
                        <span>RATE</span>
                        <div class="gun-stat-bar"><div class="gun-stat-fill fill-rate" style="width: ${ratePct}%;"></div></div>
                    </div>
                    <div class="gun-stat-item">
                        <span>SPD</span>
                        <div class="gun-stat-bar"><div class="gun-stat-fill fill-spd" style="width: ${spdPct}%;"></div></div>
                    </div>
                `;

                // Action Button (Equip / Unlock / Equipped)
                const btn = document.createElement('button');
                btn.type = 'button';

                if (isEquipped) {
                    btn.className = 'skin-action-btn btn-equipped';
                    btn.innerText = '✔️ EQUIPPED';
                } else if (isUnlocked) {
                    btn.className = 'skin-action-btn btn-equip';
                    btn.innerText = 'EQUIP';
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.selectedGun = key;
                        localStorage.setItem('pumpkin_equipped_gun', key);
                        this.initGunSelector();
                    });
                } else {
                    btn.className = `skin-action-btn btn-unlock ${this.coins < gun.price ? 'disabled' : ''}`;
                    btn.innerHTML = `🪙 ${gun.price} UNLOCK`;
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.unlockGun(key);
                    });
                }

                card.appendChild(imgWrapper);
                card.appendChild(infoDiv);
                card.appendChild(statsRow);
                card.appendChild(btn);

                if (isUnlocked && !isEquipped) {
                    card.addEventListener('click', () => {
                        this.selectedGun = key;
                        localStorage.setItem('pumpkin_equipped_gun', key);
                        this.initGunSelector();
                    });
                }

                this.gunContainer.appendChild(card);
            }
        }

        unlockGun(gunKey) {
            const gun = Config.GUNS[gunKey];
            if (!gun) return;

            if (this.coins < gun.price) {
                if (window.PumpkinPanic.AudioSystem) {
                    window.PumpkinPanic.AudioSystem.playHit();
                }
                return;
            }

            this.coins -= gun.price;
            localStorage.setItem('pumpkin_coins', this.coins);

            if (!this.unlockedGuns.includes(gunKey)) {
                this.unlockedGuns.push(gunKey);
                localStorage.setItem('pumpkin_unlocked_guns', JSON.stringify(this.unlockedGuns));
            }

            this.selectedGun = gunKey;
            localStorage.setItem('pumpkin_equipped_gun', gunKey);

            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playSkinUnlock();
            }

            this.updateCoinsDisplay();
            this.initGunSelector();
        }

        // ==========================================
        // MOBILE VIRTUAL JOYSTICK & TOUCH CONTROLS
        // ==========================================

        initMobileControls() {
            // Check touch capability
            const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 900);
            const mobileOverlay = document.getElementById('mobile-controls');
            if (mobileOverlay && isTouch) {
                mobileOverlay.classList.remove('hidden');
            }

            // Left side touch area for Virtual Joystick movement
            window.addEventListener('touchstart', (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    // Left half: movement joystick
                    if (touch.clientX < window.innerWidth * 0.5 && this.touchMoveId === null && !this.hud.classList.contains('hidden')) {
                        this.touchMoveId = touch.identifier;
                        this.joystickOrigin = { x: touch.clientX, y: touch.clientY };

                        if (this.joystickBase) {
                            this.joystickBase.style.left = `${touch.clientX}px`;
                            this.joystickBase.style.top = `${touch.clientY}px`;
                            this.joystickBase.classList.remove('hidden');
                        }
                        if (this.joystickKnob) {
                            this.joystickKnob.style.transform = `translate(-50%, -50%)`;
                        }
                    } 
                    // Right half: Touch Aim & Shoot
                    else if (touch.clientX >= window.innerWidth * 0.5 && this.touchAimId === null && !this.hud.classList.contains('hidden')) {
                        // Exclude touch on the fire button itself
                        if (e.target !== this.mobileFireBtn) {
                            this.touchAimId = touch.identifier;
                            this.updateTouchAim(touch.clientX, touch.clientY);
                            if (this.gameScene && this.gameScene.player) {
                                this.gameScene.player.isAutoFiring = true;
                            }
                        }
                    }
                }
            }, { passive: false });

            window.addEventListener('touchmove', (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (touch.identifier === this.touchMoveId) {
                        e.preventDefault();
                        const dx = touch.clientX - this.joystickOrigin.x;
                        const dy = touch.clientY - this.joystickOrigin.y;
                        const dist = Math.hypot(dx, dy);
                        const maxRadius = 45;

                        const clampedDist = Math.min(dist, maxRadius);
                        const angle = Math.atan2(dy, dx);
                        const knobX = Math.cos(angle) * clampedDist;
                        const knobY = Math.sin(angle) * clampedDist;

                        if (this.joystickKnob) {
                            this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
                        }

                        // Feed normalized vector to player
                        if (this.gameScene && this.gameScene.player) {
                            this.gameScene.player.joystickVector = {
                                x: knobX / maxRadius,
                                y: knobY / maxRadius
                            };
                        }
                    } else if (touch.identifier === this.touchAimId) {
                        e.preventDefault();
                        this.updateTouchAim(touch.clientX, touch.clientY);
                    }
                }
            }, { passive: false });

            const onTouchEnd = (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (touch.identifier === this.touchMoveId) {
                        this.touchMoveId = null;
                        if (this.joystickBase) {
                            this.joystickBase.classList.add('hidden');
                        }
                        if (this.gameScene && this.gameScene.player) {
                            this.gameScene.player.joystickVector = { x: 0, y: 0 };
                        }
                    } else if (touch.identifier === this.touchAimId) {
                        this.touchAimId = null;
                        if (this.gameScene && this.gameScene.player) {
                            this.gameScene.player.isAutoFiring = false;
                        }
                    }
                }
            };

            window.addEventListener('touchend', onTouchEnd);
            window.addEventListener('touchcancel', onTouchEnd);

            // Dedicated Fire Button (Tap & Hold)
            if (this.mobileFireBtn) {
                this.mobileFireBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (this.gameScene && this.gameScene.player) {
                        this.gameScene.player.isAutoFiring = true;
                    }
                });
                this.mobileFireBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    if (this.gameScene && this.gameScene.player) {
                        this.gameScene.player.isAutoFiring = false;
                    }
                });
            }
        }

        updateTouchAim(screenX, screenY) {
            if (!this.gameScene || !this.gameScene.player) return;
            const worldPt = this.gameScene.cameras.main.getWorldPoint(screenX, screenY);
            const player = this.gameScene.player;
            player.aimAngle = Phaser.Math.Angle.Between(player.x, player.y, worldPt.x, worldPt.y);

            if (player.aimPointer) {
                player.aimPointer.setRotation(player.aimAngle);
                const aimDist = 36 * player.scaleX;
                player.aimPointer.setPosition(Math.cos(player.aimAngle) * aimDist, Math.sin(player.aimAngle) * aimDist);
            }
        }

        updateAudioButtonState() {
            const isMuted = window.PumpkinPanic.AudioSystem ? window.PumpkinPanic.AudioSystem.isMuted : false;
            if (this.muteBtn) {
                this.muteBtn.innerHTML = isMuted ? '🔇 Audio: OFF' : '🔊 Audio: ON';
                this.muteBtn.classList.toggle('muted', isMuted);
            }
        }

        openMultiplayerModal() {
            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.resumeContext();
            }
            if (this.multiplayerModal) {
                this.multiplayerModal.classList.remove('hidden');
            }
            if (this.serverUrlInput) {
                this.serverUrlInput.value = Config.MULTIPLAYER ? Config.MULTIPLAYER.getServerUrl() : 'ws://localhost:2567';
            }
            this.checkServerHealth();
        }

        async checkServerHealth() {
            if (!this.serverStatusDot || !this.serverStatusText) return;
            this.serverStatusDot.className = 'status-dot dot-checking';
            this.serverStatusText.innerText = 'Checking server health...';

            const NetworkAdapter = window.PumpkinPanic.NetworkAdapter;
            if (!NetworkAdapter || !NetworkAdapter.checkHealth) {
                this.serverStatusDot.className = 'status-dot dot-offline';
                this.serverStatusText.innerText = 'Colyseus NetworkAdapter not initialized';
                return;
            }

            const currentUrl = Config.MULTIPLAYER ? Config.MULTIPLAYER.getServerUrl() : 'ws://localhost:2567';
            try {
                const result = await NetworkAdapter.checkHealth(currentUrl);
                if (result && result.ok) {
                    this.serverStatusDot.className = 'status-dot dot-online';
                    this.serverStatusText.innerText = `Online (${result.data.service || 'Active'} • ping ${result.latencyMs}ms)`;
                } else {
                    this.serverStatusDot.className = 'status-dot dot-offline';
                    const isLocal = currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1');
                    if (isLocal && (result.error === 'Failed to fetch' || result.error === 'Offline')) {
                        this.serverStatusText.innerText = 'Offline (Server not started. Double-click start_server.bat)';
                    } else {
                        this.serverStatusText.innerText = `Offline: ${result ? result.error : 'Server unreachable'}`;
                    }
                }
            } catch (err) {
                this.serverStatusDot.className = 'status-dot dot-offline';
                this.serverStatusText.innerText = 'Offline (Server not started. Double-click start_server.bat)';
            }
        }

        handleJoinByCode() {
            const code = this.mpRoomCodeInput ? this.mpRoomCodeInput.value.trim().toUpperCase() : '';
            if (!code) {
                if (this.mpRoomCodeInput) {
                    this.mpRoomCodeInput.focus();
                }
                return;
            }
            this.startMultiplayerGame({ mode: 'join', roomCode: code });
        }

        startLocalGame() {
            if (this.multiplayerModal) this.multiplayerModal.classList.add('hidden');
            if (this.connectionErrorModal) this.connectionErrorModal.classList.add('hidden');
            if (this.reconnectingModal) this.reconnectingModal.classList.add('hidden');
            this.setRoomCodeBadge(null);

            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.resumeContext();
            }

            const game = window.PumpkinPanic.game;
            if (game) {
                const gameScene = game.scene.getScene('GameScene');
                if (gameScene) {
                    gameScene.startMatch({
                        name: this.playerName || 'SpookyPumpkin',
                        skin: this.selectedSkin || 'classic',
                        gun: this.selectedGun || 'SEED_PISTOL',
                        isMultiplayer: false,
                        mode: 'local'
                    });
                }
            }
        }

        startMultiplayerGame(options = {}) {
            if (this.multiplayerModal) this.multiplayerModal.classList.add('hidden');
            if (this.connectionErrorModal) this.connectionErrorModal.classList.add('hidden');
            if (this.reconnectingModal) this.reconnectingModal.classList.add('hidden');

            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.resumeContext();
            }

            const game = window.PumpkinPanic.game;
            if (game) {
                const gameScene = game.scene.getScene('GameScene');
                if (gameScene) {
                    gameScene.startMatch({
                        name: this.playerName || 'SpookyPumpkin',
                        skin: this.selectedSkin || 'classic',
                        gun: this.selectedGun || 'SEED_PISTOL',
                        isMultiplayer: true,
                        multiplayerMode: options.mode || 'quick',
                        roomCode: options.roomCode || null
                    });
                }
            }
        }

        setRoomCodeBadge(code) {
            if (!this.hudRoomPill) return;
            if (code) {
                if (this.hudRoomCodeText) {
                    this.hudRoomCodeText.innerText = code;
                }
                this.hudRoomPill.classList.remove('hidden');
            } else {
                this.hudRoomPill.classList.add('hidden');
            }
        }

        showConnectionErrorModal(message) {
            if (this.multiplayerModal) this.multiplayerModal.classList.add('hidden');
            if (this.lobbyModal) this.lobbyModal.classList.add('hidden');
            if (this.connectionErrorMessage) {
                this.connectionErrorMessage.innerText = message || 'Could not connect to the multiplayer server.';
            }
            if (this.connectionErrorModal) {
                this.connectionErrorModal.classList.remove('hidden');
            }
            this.showStatusToast('DISCONNECTED', message || 'Multiplayer connection failed');
        }

        openLobby(options = {}) {
            this.currentRoomCode = options.roomCode || '------';
            this.currentNetworkAdapter = options.networkAdapter;
            this.gameScene = options.gameScene;
            this.isHost = options.networkAdapter ? options.networkAdapter.isHost() : !!options.isHost;

            if (this.startScreen) this.startScreen.classList.add('hidden');
            if (this.multiplayerModal) this.multiplayerModal.classList.add('hidden');
            if (this.connectionErrorModal) this.connectionErrorModal.classList.add('hidden');
            if (this.hud) this.hud.classList.add('hidden');
            if (this.lobbyModal) this.lobbyModal.classList.remove('hidden');

            if (this.lobbyRoomCodeDisplay) {
                this.lobbyRoomCodeDisplay.innerText = this.currentRoomCode;
            }

            this.setRoomCodeBadge(this.currentRoomCode);

            // Configure Start Button based on Host status
            if (this.lobbyStartBtn) {
                if (this.isHost) {
                    this.lobbyStartBtn.innerHTML = '🚀 START MATCH NOW';
                    this.lobbyStartBtn.disabled = false;
                    this.lobbyStartBtn.style.opacity = '1';
                    this.lobbyStartBtn.style.cursor = 'pointer';
                } else {
                    this.lobbyStartBtn.innerHTML = '⏳ WAITING FOR HOST...';
                    this.lobbyStartBtn.disabled = true;
                    this.lobbyStartBtn.style.opacity = '0.7';
                    this.lobbyStartBtn.style.cursor = 'not-allowed';
                }
            }

            if (this.lobbyCountdownTitle && this.lobbyCountdownDesc) {
                if (this.isHost) {
                    this.lobbyCountdownTitle.innerText = 'Host Matchmaking Controls';
                    this.lobbyCountdownDesc.innerText = 'Click Start Match Now to launch immediately, or match auto-starts when countdown ends.';
                } else {
                    this.lobbyCountdownTitle.innerText = 'Matchmaking in Progress';
                    this.lobbyCountdownDesc.innerText = 'Waiting for host to launch or countdown to complete. Server bots will fill empty slots.';
                }
            }

            // Render current players
            if (this.currentNetworkAdapter) {
                const humans = this.currentNetworkAdapter.getConnectedHumanPlayers();
                const botCount = this.currentNetworkAdapter.getBotCount();
                this.updateLobbyRoster(humans, botCount);
            }

            // Start 15-second matchmaking countdown
            if (this.lobbyCountdownInterval) {
                clearInterval(this.lobbyCountdownInterval);
                this.lobbyCountdownInterval = null;
            }
            let timeLeft = 15;
            if (this.lobbyCountdownTimer) this.lobbyCountdownTimer.innerText = `${timeLeft}s`;

            this.lobbyCountdownInterval = setInterval(() => {
                timeLeft--;
                if (this.lobbyCountdownTimer) this.lobbyCountdownTimer.innerText = `${timeLeft}s`;
                if (timeLeft <= 0) {
                    clearInterval(this.lobbyCountdownInterval);
                    this.lobbyCountdownInterval = null;
                    this.launchMatchFromLobby();
                }
            }, 1000);

            this.showStatusToast('LOBBY', `Joined Arena Room ${this.currentRoomCode}`);

            // Sync multiplayer room with CrazyGames SDK v3
            if (window.PumpkinPanic.CrazyGames) {
                window.PumpkinPanic.CrazyGames.updateRoom({
                    roomId: this.currentRoomCode,
                    isJoinable: true,
                    inviteParams: { room: this.currentRoomCode }
                });
            }
        }

        updateLobbyRoster(humans = [], botCount = 0) {
            if (!this.lobbyPlayersList) return;

            const humanCount = Math.max(1, humans.length);
            if (this.lobbyPlayerCount) this.lobbyPlayerCount.innerText = humanCount;
            if (this.lobbyMaxPlayers) this.lobbyMaxPlayers.innerText = '16';

            const queuedBots = Math.max(0, 16 - humanCount);
            if (this.lobbyBotInfoBadge) {
                this.lobbyBotInfoBadge.innerText = `🤖 ${queuedBots} Server Bots Queued`;
            }

            if (this.lobbyStatusText) {
                this.lobbyStatusText.innerText = `WAITING FOR PLAYERS (${humanCount}/16)`;
            }

            // Re-evaluate host status
            if (this.currentNetworkAdapter) {
                this.isHost = this.currentNetworkAdapter.isHost();
                if (this.lobbyStartBtn) {
                    if (this.isHost) {
                        this.lobbyStartBtn.innerHTML = '🚀 START MATCH NOW';
                        this.lobbyStartBtn.disabled = false;
                        this.lobbyStartBtn.style.opacity = '1';
                        this.lobbyStartBtn.style.cursor = 'pointer';
                    }
                }
            }

            this.lobbyPlayersList.innerHTML = '';
            humans.forEach(player => {
                const card = document.createElement('div');
                card.className = `lobby-player-card ${player.isSelf ? 'is-self' : ''}`;

                // Avatar
                const avatar = document.createElement('div');
                avatar.className = 'lobby-player-avatar';

                const img = document.createElement('img');
                img.className = 'lobby-avatar-img';
                img.alt = player.skin || 'classic';
                if (window.PumpkinPanic.skinPreviews && window.PumpkinPanic.skinPreviews[player.skin]) {
                    img.src = window.PumpkinPanic.skinPreviews[player.skin];
                } else {
                    img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><circle cx="20" cy="20" r="16" fill="%23ff7700"/></svg>';
                }
                avatar.appendChild(img);

                // Details
                const details = document.createElement('div');
                details.className = 'lobby-player-details';

                const nameRow = document.createElement('div');
                nameRow.className = 'lobby-player-name-row';

                const name = document.createElement('span');
                name.className = 'lobby-player-name';
                name.innerText = player.name;
                nameRow.appendChild(name);

                if (player.isHost) {
                    const hostTag = document.createElement('span');
                    hostTag.className = 'tag-badge tag-host';
                    hostTag.innerText = 'HOST';
                    nameRow.appendChild(hostTag);
                }

                if (player.isSelf) {
                    const youTag = document.createElement('span');
                    youTag.className = 'tag-badge tag-you';
                    youTag.innerText = 'YOU';
                    nameRow.appendChild(youTag);
                }

                const gunRow = document.createElement('div');
                gunRow.className = 'lobby-player-gun-row';

                const gunConfig = Config.GUNS && Config.GUNS[player.gun];
                const gunName = gunConfig ? gunConfig.name : player.gun;
                gunRow.innerHTML = `<span>🔫</span><span class="lobby-gun-label">${gunName}</span><span>• ${player.ping || 24}ms</span>`;

                details.appendChild(nameRow);
                details.appendChild(gunRow);

                card.appendChild(avatar);
                card.appendChild(details);
                this.lobbyPlayersList.appendChild(card);
            });
        }

        launchMatchFromLobby() {
            if (this.lobbyCountdownInterval) {
                clearInterval(this.lobbyCountdownInterval);
                this.lobbyCountdownInterval = null;
            }

            if (this.lobbyModal) this.lobbyModal.classList.add('hidden');
            if (this.hud) this.hud.classList.remove('hidden');

            if (this.currentNetworkAdapter && this.currentNetworkAdapter.room && this.isHost) {
                try {
                    this.currentNetworkAdapter.room.send("match_started", {});
                } catch (e) {}
            }

            if (this.gameScene) {
                this.onMatchStarted(this.gameScene);
                if (typeof this.gameScene.onLobbyMatchLaunched === 'function') {
                    this.gameScene.onLobbyMatchLaunched();
                }
            }

            this.showStatusToast('IN_MATCH', 'Battle Commenced! Arena Active');

            // Signal room match launched (no longer joinable)
            if (window.PumpkinPanic.CrazyGames) {
                window.PumpkinPanic.CrazyGames.updateRoom({
                    roomId: this.currentRoomCode,
                    isJoinable: false
                });
            }
        }

        leaveLobby() {
            if (this.lobbyCountdownInterval) {
                clearInterval(this.lobbyCountdownInterval);
                this.lobbyCountdownInterval = null;
            }

            if (this.lobbyModal) this.lobbyModal.classList.add('hidden');
            if (this.startScreen) this.startScreen.classList.remove('hidden');
            if (this.hud) this.hud.classList.add('hidden');

            if (this.currentNetworkAdapter) {
                this.currentNetworkAdapter.manualLeave = true;
                this.currentNetworkAdapter.disconnect();
                this.currentNetworkAdapter = null;
            }

            if (this.gameScene) {
                this.gameScene.returnToMenu();
            }

            this.setRoomCodeBadge(null);
            this.showStatusToast('DISCONNECTED', 'Left arena lobby');

            // Signal CrazyGames leftRoom
            if (window.PumpkinPanic.CrazyGames) {
                window.PumpkinPanic.CrazyGames.leftRoom();
            }
        }

        copyRoomCode() {
            const code = this.currentRoomCode || (this.currentNetworkAdapter && this.currentNetworkAdapter.getRoomCode());
            if (!code || code === '------') return;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(() => {
                    this.showCopyFeedback('COPIED!');
                }).catch(() => {
                    this.showCopyFeedback(code);
                });
            } else {
                this.showCopyFeedback('COPIED!');
            }
        }

        copyInviteLink() {
            let url = '';
            if (window.PumpkinPanic.CrazyGames && window.PumpkinPanic.CrazyGames.isOperating()) {
                url = window.PumpkinPanic.CrazyGames.getPlatformInviteLink({ room: this.currentRoomCode });
            }
            if (!url) {
                if (this.currentNetworkAdapter && typeof this.currentNetworkAdapter.getInviteUrl === 'function') {
                    url = this.currentNetworkAdapter.getInviteUrl();
                } else {
                    const code = this.currentRoomCode;
                    url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(code)}`;
                }
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    this.showCopyFeedback('LINK COPIED!');
                }).catch(() => {
                    this.showCopyFeedback('COPIED!');
                });
            } else {
                this.showCopyFeedback('LINK COPIED!');
            }
        }

        showCopyFeedback(msg) {
            if (!this.lobbyCopyFeedback) return;
            this.lobbyCopyFeedback.innerText = msg;
            this.lobbyCopyFeedback.style.opacity = '1';
            setTimeout(() => {
                if (this.lobbyCopyFeedback) {
                    this.lobbyCopyFeedback.style.opacity = '0';
                }
            }, 2000);
        }

        showStatusToast(status, message, durationMs = 3500) {
            if (!this.statusToast || !this.toastStatusTitle || !this.toastStatusDesc || !this.toastStatusDot) return;

            if (this.toastTimeout) {
                clearTimeout(this.toastTimeout);
                this.toastTimeout = null;
            }

            let title = 'Multiplayer Status';
            let dotClass = 'status-dot dot-online';

            switch (status) {
                case 'CONNECTING':
                    title = 'Connecting...';
                    dotClass = 'status-dot dot-checking';
                    break;
                case 'SEARCHING':
                    title = 'Searching Match...';
                    dotClass = 'status-dot dot-checking';
                    break;
                case 'LOBBY':
                    title = 'Arena Lobby';
                    dotClass = 'status-dot dot-online';
                    break;
                case 'IN_MATCH':
                    title = 'In Arena Match';
                    dotClass = 'status-dot dot-online';
                    break;
                case 'RECONNECTING':
                    title = 'Reconnecting...';
                    dotClass = 'status-dot dot-checking';
                    durationMs = 0; // persistent until resolved
                    if (this.reconnectingModal) {
                        this.reconnectingModal.classList.remove('hidden');
                    }
                    break;
                case 'DISCONNECTED':
                    title = 'Disconnected';
                    dotClass = 'status-dot dot-offline';
                    break;
                default:
                    title = status || 'Notice';
                    break;
            }

            this.toastStatusTitle.innerText = title;
            this.toastStatusDesc.innerText = message || '';
            this.toastStatusDot.className = dotClass;
            this.statusToast.classList.remove('hidden');

            if (durationMs > 0) {
                this.toastTimeout = setTimeout(() => {
                    if (this.statusToast) this.statusToast.classList.add('hidden');
                }, durationMs);
            }
        }

        checkForInviteUrl() {
            try {
                const params = new URLSearchParams(window.location.search);
                const code = params.get('room') || params.get('join');
                if (code && code.trim().length > 0) {
                    this.pendingInviteCode = code.trim().toUpperCase();
                    if (this.inviteRoomCodeTag) {
                        this.inviteRoomCodeTag.innerText = this.pendingInviteCode;
                    }
                    if (this.invitePlayerName) {
                        this.invitePlayerName.value = this.playerName || 'SpookyPumpkin';
                    }
                    if (this.inviteModal) {
                        this.inviteModal.classList.remove('hidden');
                    }
                }
            } catch (e) {
                console.warn("[UIManager] Failed to parse invite URL:", e);
            }
        }

        startGame() {
            this.startLocalGame();
        }

        onMatchStarted(gameScene) {
            this.gameScene = gameScene;
            this.hud.classList.remove('hidden');
            this.startScreen.classList.add('hidden');
            this.endScreen.classList.add('hidden');
            if (this.lobbyModal) this.lobbyModal.classList.add('hidden');
            if (this.multiplayerModal) this.multiplayerModal.classList.add('hidden');
            if (this.connectionErrorModal) this.connectionErrorModal.classList.add('hidden');

            if (this.hudPlayerName) {
                this.hudPlayerName.innerText = this.playerName;
            }
            this.updateCoinsDisplay();
        }

        updateHUD(data) {
            // Health Bar
            const hpPct = Math.max(0, Math.min(100, (data.health / data.maxHealth) * 100));
            if (this.hpFill) {
                this.hpFill.style.width = `${hpPct}%`;
                if (hpPct > 55) {
                    this.hpFill.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
                } else if (hpPct > 28) {
                    this.hpFill.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
                } else {
                    this.hpFill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
                }
            }
            if (this.hpText) {
                this.hpText.innerText = `${Math.ceil(data.health)} / ${Math.ceil(data.maxHealth)}`;
            }

            // Low-HP Adrenaline Screen Vignette
            document.body.classList.toggle('low-hp-adrenaline', hpPct <= 30 && data.health > 0);

            // XP Bar
            const levelRange = Math.max(1, data.nextLvlXp - data.currentLvlBaseXp);
            const currentLevelProgress = Math.max(0, data.xp - data.currentLvlBaseXp);
            const xpPct = Math.min(100, (currentLevelProgress / levelRange) * 100);

            if (this.xpFill) {
                this.xpFill.style.width = `${xpPct}%`;
            }
            if (this.xpText) {
                this.xpText.innerText = `XP: ${data.xp} / ${data.nextLvlXp}`;
            }
            if (this.lvlBadge) {
                this.lvlBadge.innerText = `LVL ${data.level}`;
            }

            // Alive & Kills
            if (this.aliveCountEl) {
                this.aliveCountEl.innerText = `${data.aliveCount} / ${data.totalPumpkins}`;
            }
            if (this.killsEl) {
                this.killsEl.innerText = `${data.kills}`;
            }

            // Match Survival Timer
            if (this.timerEl) {
                const totalSec = Math.floor(data.survivalTime);
                const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
                const secs = String(totalSec % 60).padStart(2, '0');
                this.timerEl.innerText = `${mins}:${secs}`;
            }

            // Storm Alert Banner
            if (this.stormAlert && data.stormStatus) {
                const st = data.stormStatus;
                if (st.state === 'WARNING') {
                    this.stormAlert.innerText = `⚠️ STORM SHRINKING IN ${st.timeLeft}s!`;
                    this.stormAlert.className = 'storm-banner warning';
                } else if (st.state === 'SHRINKING') {
                    this.stormAlert.innerText = `⚡ THE STORM IS CLOSING IN!`;
                    this.stormAlert.className = 'storm-banner shrinking';
                } else {
                    this.stormAlert.className = 'storm-banner hidden';
                }
            }

            // Draw Minimap
            this.renderMinimap(data.playerPos, data.stormStatus);
        }

        renderMinimap(playerPos, stormStatus) {
            if (!this.minimapCtx || !this.minimapCanvas) return;
            const ctx = this.minimapCtx;
            const w = this.minimapCanvas.width;
            const h = this.minimapCanvas.height;

            ctx.clearRect(0, 0, w, h);

            const worldSize = Config.WORLD.WIDTH;
            const scale = w / worldSize;

            // Safe Zone Circle
            if (stormStatus) {
                const scx = stormStatus.safeCenter.x * scale;
                const scy = stormStatus.safeCenter.y * scale;
                const sr = stormStatus.currentRadius * scale;

                ctx.fillStyle = 'rgba(68, 14, 97, 0.65)';
                ctx.fillRect(0, 0, w, h);

                ctx.save();
                ctx.globalCompositeOperation = 'destination-out';
                ctx.beginPath();
                ctx.arc(scx, scy, sr, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.strokeStyle = stormStatus.state === 'SHRINKING' ? '#ff3366' : '#a855f7';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(scx, scy, sr, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Local Bots (dots in local mode)
            if (this.gameScene && this.gameScene.bots && this.gameScene.bots.length > 0) {
                ctx.fillStyle = '#ef4444';
                for (let i = 0; i < this.gameScene.bots.length; i++) {
                    const bot = this.gameScene.bots[i];
                    if (bot && !bot.isDead) {
                        ctx.beginPath();
                        ctx.arc(bot.x * scale, bot.y * scale, 2.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }

            // Remote Entities (Multiplayer Mode: Human Players vs Bots)
            if (this.gameScene && this.gameScene.remoteEntities && this.gameScene.remoteEntities.size > 0) {
                this.gameScene.remoteEntities.forEach(entity => {
                    if (entity && !entity.isDead) {
                        // Human opponents in sky blue, bots in orange/red
                        ctx.fillStyle = entity.isBot ? '#f97316' : '#38bdf8';
                        ctx.beginPath();
                        ctx.arc(entity.x * scale, entity.y * scale, entity.isBot ? 2.5 : 3.5, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }

            // Player Dot
            if (playerPos) {
                ctx.fillStyle = '#10b981';
                ctx.shadowColor = '#34d399';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.arc(playerPos.x * scale, playerPos.y * scale, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        updateLeaderboard(rankings, playerRank) {
            if (!this.leaderboardList) return;
            this.leaderboardList.innerHTML = '';

            rankings.forEach((entry, idx) => {
                const li = document.createElement('li');
                li.className = `leaderboard-item ${entry.isPlayer ? 'is-player' : ''} ${entry.isDead ? 'is-dead' : ''}`;

                const rankSpan = document.createElement('span');
                rankSpan.className = 'lb-rank';
                rankSpan.innerText = `#${idx + 1}`;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'lb-name';
                nameSpan.innerText = entry.name;

                // Human vs Bot distinction
                if (entry.isHumanPlayer || entry.isPlayer) {
                    const tag = document.createElement('span');
                    tag.className = 'lb-tag-human';
                    tag.innerText = entry.isPlayer ? 'YOU' : 'PLAYER';
                    nameSpan.appendChild(tag);
                } else if (entry.isBot) {
                    const tag = document.createElement('span');
                    tag.className = 'lb-tag-bot';
                    tag.innerText = 'BOT';
                    nameSpan.appendChild(tag);
                }

                const scoreSpan = document.createElement('span');
                scoreSpan.className = 'lb-score';
                scoreSpan.innerText = `${entry.score} pts`;

                li.appendChild(rankSpan);
                li.appendChild(nameSpan);
                li.appendChild(scoreSpan);
                this.leaderboardList.appendChild(li);
            });
        }

        updateWeaponHUD(weaponId, progress = 1.0) {
            if (!this.weaponBadge) return;

            if (!weaponId || weaponId === 'NORMAL') {
                this.weaponBadge.classList.add('hidden');
                return;
            }

            const weapon = Config.WEAPONS[weaponId];
            if (!weapon) return;

            this.weaponBadge.classList.remove('hidden');
            this.weaponBadge.style.borderColor = weapon.bulletColor;
            if (this.weaponIcon) this.weaponIcon.innerText = weapon.icon;
            if (this.weaponName) {
                this.weaponName.innerText = weapon.name;
                this.weaponName.style.color = weapon.bulletColor;
            }
            if (this.weaponDurationFill) {
                this.weaponDurationFill.style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
                this.weaponDurationFill.style.background = `linear-gradient(90deg, ${weapon.bulletColor}, #ffffff)`;
            }
        }

        showEliminationBanner(victimName, killerName) {
            if (!this.elimBanner) return;

            if (this.elimKiller) this.elimKiller.innerText = killerName;
            if (this.elimVictim) this.elimVictim.innerText = victimName;

            this.elimBanner.classList.remove('hidden');

            if (this.elimTimeout) clearTimeout(this.elimTimeout);
            this.elimTimeout = setTimeout(() => {
                if (this.elimBanner) {
                    this.elimBanner.classList.add('hidden');
                }
            }, 2800);
        }

        showEndScreen(stats) {
            // Compute match rewards
            let placementCoins = Config.ECONOMY.PARTICIPATION_COINS;
            if (stats.rank === 1) {
                placementCoins = Config.ECONOMY.VICTORY_COINS;
            } else if (stats.rank <= 3) {
                placementCoins = Config.ECONOMY.TOP3_COINS;
            }

            const totalCoinsEarned = placementCoins + (stats.kills * Config.ECONOMY.COINS_PER_KILL);
            this.addCoins(totalCoinsEarned);

            // Hide in-game HUD weapon badge
            this.updateWeaponHUD(null, 0);

            if (this.endTitle) {
                if (stats.isVictory) {
                    this.endTitle.innerText = '👑 VICTORY ROYALE!';
                    this.endTitle.className = 'victory-text';
                    this.endSubtitle.innerText = 'LAST PUMPKIN STANDING IN THE HARVEST ARENA!';
                    if (this.killerCard) this.killerCard.classList.add('hidden');
                } else {
                    this.endTitle.innerText = '💀 SQUASHED!';
                    this.endTitle.className = 'defeat-text';
                    this.endSubtitle.innerText = 'Better luck next harvest, brave pumpkin!';

                    // Show killer attribution
                    if (this.killerCard && this.killerName) {
                        this.killerName.innerText = stats.killedByName || 'The Pumpkin Storm';
                        this.killerCard.classList.remove('hidden');
                    }
                }
            }

            if (this.statRank) this.statRank.innerText = `#${stats.rank} / ${stats.totalPlayers}`;
            if (this.statKills) this.statKills.innerText = `${stats.kills}`;

            const totalSec = Math.floor(stats.survivalTime);
            const mins = String(Math.floor(totalSec / 60)).padStart(2, '0');
            const secs = String(totalSec % 60).padStart(2, '0');
            if (this.statTime) this.statTime.innerText = `${mins}:${secs}`;

            if (this.statLevel) this.statLevel.innerText = `LVL ${stats.level}`;
            if (this.statScore) this.statScore.innerText = `${stats.score}`;
            if (this.statCoinsEarned) this.statCoinsEarned.innerText = `+${totalCoinsEarned} 🪙`;

            // Reset Rewarded Ad bonus button state
            if (this.rewardedCoinsBtn) {
                this.rewardedCoinsBtn.disabled = false;
                this.rewardedCoinsBtn.classList.remove('claimed');
                this.rewardedCoinsBtn.innerHTML = '<span class="ad-badge">📺 BONUS</span> Watch Ad for +100 Coins 🪙';
            }

            this.endScreen.classList.remove('hidden');
        }

        hideEndScreen() {
            document.body.classList.remove('low-hp-adrenaline');
            this.endScreen.classList.add('hidden');
            if (this.killerCard) this.killerCard.classList.add('hidden');
        }

        showStartMenu() {
            document.body.classList.remove('low-hp-adrenaline');
            this.endScreen.classList.add('hidden');
            this.hud.classList.add('hidden');
            this.startScreen.classList.remove('hidden');
            this.updateCoinsDisplay();
            this.initSkinSelector();
        }
    }

    window.PumpkinPanic.UIManager = UIManager;
})();
