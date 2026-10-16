/**
 * PUMPKIN PANIC.IO - Main Game Scene
 * Core gameplay loop, physics collisions, arena environment, camera tracking, and lifecycle.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};
    const Config = window.PumpkinPanic.Config;

    class GameScene extends Phaser.Scene {
        constructor() {
            super({ key: 'GameScene' });
            this.matchActive = false;
            this.matchOver = false;
            this.matchStartTime = 0;
            this.matchDuration = 0;
            this.player = null;
            this.bots = [];
            this.entitiesGroup = null;
        }

        create() {
            try {
                console.log("[GameScene] create() started");
                this.matchActive = false;
                this.matchOver = false;

                // Set physics world bounds
                this.physics.world.setBounds(0, 0, Config.WORLD.WIDTH, Config.WORLD.HEIGHT);

                // 1. Initialize Visual Effects Emitter
                console.log("[GameScene] Initializing EmitterManager...");
                this.emitterManager = new window.PumpkinPanic.EmitterManager(this);

                // 2. Build Spooky Arena Map
                console.log("[GameScene] Building arena environment...");
                this.createArenaEnvironment();

                // 3. Initialize Bullet Pool
                console.log("[GameScene] Initializing BulletPool...");
                this.bulletPool = new window.PumpkinPanic.BulletPool(this);

                // 4. Initialize Seed Manager
                console.log("[GameScene] Initializing SeedManager...");
                this.seedManager = new window.PumpkinPanic.SeedManager(this);
                this.seedManager.initSeeds();

                // 5. Entities Group & Collision System
                this.entitiesGroup = this.physics.add.group();
                this.activeColliders = [];
                this.setupCollisions();

                // 6. Setup Camera for Menu Ambient Drift
                this.cameras.main.setBounds(0, 0, Config.WORLD.WIDTH, Config.WORLD.HEIGHT);
                this.cameras.main.centerOn(Config.WORLD.WIDTH / 2, Config.WORLD.HEIGHT / 2);
                this.cameras.main.setZoom(1.0);

                // 7. Setup Global Real-Time Mouse & Pointer Tracking
                this.setupGlobalInput();

                // 8. Register Event Listeners
                this.events.on('entity_defeated', this.handleEntityDefeated, this);
                this.events.on('leaderboard_updated', (data) => {
                    if (window.PumpkinPanic.ui) {
                        window.PumpkinPanic.ui.updateLeaderboard(data.rankings, data.playerRank);
                    }
                });
                console.log("[GameScene] create() finished successfully!");
            } catch (err) {
                console.error("[GameScene] CRASHED in create():", err);
            }
        }

        setupGlobalInput() {
            if (this.globalInputInitialized) return;
            this.globalInputInitialized = true;

            this.mousePos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            this.isMouseDown = false;

            this._onPointerMove = (e) => {
                this.mousePos.x = e.clientX;
                this.mousePos.y = e.clientY;
            };

            this._onPointerDown = (e) => {
                if (e.button === 0) {
                    this.isMouseDown = true;
                    this.mousePos.x = e.clientX;
                    this.mousePos.y = e.clientY;
                }
            };

            this._onPointerUp = (e) => {
                if (e.button === 0) {
                    this.isMouseDown = false;
                }
            };

            this._onPreventDefault = (e) => {
                // Allow normal text selection/interaction inside input fields and textareas
                if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
                    return;
                }
                // Prevent browser text/image drag behavior during click-drag
                e.preventDefault();
            };

            window.addEventListener('pointermove', this._onPointerMove, { passive: true });
            window.addEventListener('mousemove', this._onPointerMove, { passive: true });
            window.addEventListener('pointerdown', this._onPointerDown, { passive: true });
            window.addEventListener('mousedown', this._onPointerDown, { passive: true });
            window.addEventListener('pointerup', this._onPointerUp, { passive: true });
            window.addEventListener('mouseup', this._onPointerUp, { passive: true });
            window.addEventListener('dragstart', this._onPreventDefault);
            window.addEventListener('selectstart', this._onPreventDefault);

            if (this.game && this.game.canvas) {
                this.game.canvas.addEventListener('contextmenu', this._onPreventDefault);
            }

            // Tab Visibility handling for pausing/resuming local offline gameplay
            this._onVisibilityChange = () => {
                if (document.hidden) {
                    if (this.matchActive && !this.isMultiplayer && !this.scene.isPaused('GameScene')) {
                        this.scene.pause('GameScene');
                        this.wasPausedByTab = true;
                    }
                } else {
                    if (this.wasPausedByTab) {
                        this.wasPausedByTab = false;
                        if (this.scene.isPaused('GameScene')) {
                            this.scene.resume('GameScene');
                        }
                    }
                }
            };
            document.addEventListener('visibilitychange', this._onVisibilityChange);
        }

        createArenaEnvironment() {
            // Dark purple ground base
            const bg = this.add.graphics();
            bg.fillStyle(Config.WORLD.BG_COLOR, 1);
            bg.fillRect(0, 0, Config.WORLD.WIDTH, Config.WORLD.HEIGHT);

            // Subtle spooky grid pattern & ground accents
            const gridGfx = this.add.graphics();
            gridGfx.lineStyle(1, 0x22133d, 0.45);
            for (let x = 0; x <= Config.WORLD.WIDTH; x += Config.WORLD.GRID_SIZE * 2) {
                gridGfx.moveTo(x, 0);
                gridGfx.lineTo(x, Config.WORLD.HEIGHT);
            }
            for (let y = 0; y <= Config.WORLD.HEIGHT; y += Config.WORLD.GRID_SIZE * 2) {
                gridGfx.moveTo(0, y);
                gridGfx.lineTo(Config.WORLD.WIDTH, y);
            }
            gridGfx.strokePath();

            // Obstacles Group (Solid tombstones and fences that block bullets and movement)
            this.obstacles = this.physics.add.staticGroup();

            // Arena Outer Boundary Fence
            const fenceStep = 60;
            for (let x = 30; x < Config.WORLD.WIDTH; x += fenceStep) {
                const topFence = this.obstacles.create(x, 25, 'fence');
                topFence.body.setSize(54, 30).setOffset(5, 10);
                const botFence = this.obstacles.create(x, Config.WORLD.HEIGHT - 25, 'fence');
                botFence.body.setSize(54, 30).setOffset(5, 10);
            }
            for (let y = 30; y < Config.WORLD.HEIGHT; y += fenceStep) {
                const leftFence = this.obstacles.create(25, y, 'fence');
                leftFence.body.setSize(30, 54).setOffset(10, 5);
                const rightFence = this.obstacles.create(Config.WORLD.WIDTH - 25, y, 'fence');
                rightFence.body.setSize(30, 54).setOffset(10, 5);
            }

            // Scatter Spooky Grass Tufts (decorative ground decals)
            for (let i = 0; i < Config.WORLD.GRASS_TUFT_COUNT; i++) {
                const gx = Phaser.Math.Between(80, Config.WORLD.WIDTH - 80);
                const gy = Phaser.Math.Between(80, Config.WORLD.HEIGHT - 80);
                this.add.image(gx, gy, 'grass_tuft').setDepth(2).setAlpha(0.7);
            }

            // Scatter Tactical Tombstones (solid cover)
            for (let i = 0; i < Config.WORLD.TOMBSTONE_COUNT; i++) {
                const tx = Phaser.Math.Between(150, Config.WORLD.WIDTH - 150);
                const ty = Phaser.Math.Between(150, Config.WORLD.HEIGHT - 150);
                if (Phaser.Math.Distance.Between(tx, ty, Config.WORLD.WIDTH / 2, Config.WORLD.HEIGHT / 2) > 300) {
                    const stone = this.obstacles.create(tx, ty, 'tombstone');
                    stone.body.setSize(32, 28).setOffset(16, 20);
                    stone.setDepth(6);
                }
            }

            // Scatter Spooky Trees (atmosphere & tall cover)
            for (let i = 0; i < Config.WORLD.TREE_COUNT; i++) {
                const rx = Phaser.Math.Between(180, Config.WORLD.WIDTH - 180);
                const ry = Phaser.Math.Between(180, Config.WORLD.HEIGHT - 180);
                if (Phaser.Math.Distance.Between(rx, ry, Config.WORLD.WIDTH / 2, Config.WORLD.HEIGHT / 2) > 350) {
                    const tree = this.obstacles.create(rx, ry, 'tree_spooky');
                    tree.body.setSize(38, 30).setOffset(61, 95);
                    tree.setDepth(18); // canopy renders over characters
                }
            }
        }

        startMatch(options = {}) {
            this.cleanupMatch();

            this.playerData = options;
            this.matchOver = false;
            this.matchStartTime = this.time.now;
            this.playerKillStreak = 0;
            this.isMultiplayer = !!options.isMultiplayer;
            this.remoteEntities = new Map();

            // 1. Ensure Entities Group is Clean
            if (!this.entitiesGroup) {
                this.entitiesGroup = this.physics.add.group();
            } else {
                this.entitiesGroup.clear(false, false);
            }

            if (this.isMultiplayer) {
                // ==========================================
                // ONLINE MULTIPLAYER MODE (Colyseus Authoritative)
                // ==========================================
                this.startMultiplayerMatch(options);
            } else {
                // ==========================================
                // LOCAL PRACTICE MODE (Single Player vs Local Bots)
                // ==========================================
                this.startLocalMatch(options);
            }
        }

        startLocalMatch(options) {
            // 1. Respawn & Refresh Local Seeds
            this.seedManager.initSeeds();

            // 2. Spawn Local Player Entity
            const spawnCenter = Config.WORLD.WIDTH / 2;
            const playerSpawn = {
                x: spawnCenter + Phaser.Math.Between(-150, 150),
                y: spawnCenter + Phaser.Math.Between(-150, 150)
            };
            this.player = new window.PumpkinPanic.Player(this, playerSpawn.x, playerSpawn.y, {
                name: this.playerData.name || 'SpookyPumpkin',
                skin: this.playerData.skin || 'classic',
                gun: this.playerData.gun || localStorage.getItem('pumpkin_equipped_gun') || 'SEED_PISTOL'
            });
            this.entitiesGroup.add(this.player);

            // 3. Spawn Local Autonomous Bots
            this.bots = [];
            this.spawnBots();
            for (let i = 0; i < this.bots.length; i++) {
                this.entitiesGroup.add(this.bots[i]);
            }

            // 4. Setup Collisions
            this.setupCollisions();

            // 5. Camera follows Player
            this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
            this.cameras.main.setZoom(1.0);

            // 6. Initialize Systems
            if (this.stormSystem) this.stormSystem.destroy();
            this.stormSystem = new window.PumpkinPanic.StormSystem(this);

            if (this.leaderboardSystem) {
                this.leaderboardSystem.init(1 + this.bots.length);
            } else {
                this.leaderboardSystem = new window.PumpkinPanic.LeaderboardSystem(this);
                this.leaderboardSystem.init(1 + this.bots.length);
            }

            // 7. Local Network Adapter
            this.networkAdapter = new window.PumpkinPanic.NetworkAdapter.Local(this);
            this.networkAdapter.connect();

            this.matchActive = true;

            // Notify UI
            if (window.PumpkinPanic.ui) {
                window.PumpkinPanic.ui.onMatchStarted(this);
            }

            // Signal CrazyGames gameplayStart
            if (window.PumpkinPanic.CrazyGames) {
                window.PumpkinPanic.CrazyGames.gameplayStart();
            }
        }

        startMultiplayerMatch(options) {
            this.bots = [];

            // 1. Initialize Seeds & Storm
            this.seedManager.clear();

            if (this.stormSystem) this.stormSystem.destroy();
            this.stormSystem = new window.PumpkinPanic.StormSystem(this);

            if (this.leaderboardSystem) {
                this.leaderboardSystem.init(8);
            } else {
                this.leaderboardSystem = new window.PumpkinPanic.LeaderboardSystem(this);
                this.leaderboardSystem.init(8);
            }

            // 2. Create Colyseus Network Adapter
            const serverEndpoint = options.serverUrl || Config.MULTIPLAYER.getServerUrl();
            this.networkAdapter = new window.PumpkinPanic.NetworkAdapter.Colyseus(this, serverEndpoint);

            // 3. Setup Network Adapter Event Listeners
            this.setupMultiplayerNetworkEvents();

            // 4. Connect to Room
            this.networkAdapter.connect({
                mode: options.multiplayerMode || 'quick',
                roomId: options.roomId || null,
                roomCode: options.roomCode || null,
                name: options.name || this.playerData.name || 'SpookyPumpkin',
                skin: options.skin || this.playerData.skin || 'classic'
            }).then(result => {
                this.roomCode = result.roomCode;
                console.log(`[Multiplayer] Successfully connected to room: ${result.roomCode}`);
                this.isLobbyActive = true;
                this.matchActive = true;

                if (window.PumpkinPanic.ui) {
                    window.PumpkinPanic.ui.setRoomCodeBadge(this.roomCode);
                    window.PumpkinPanic.ui.openLobby({
                        roomCode: this.roomCode,
                        networkAdapter: this.networkAdapter,
                        gameScene: this
                    });
                }
            }).catch(err => {
                console.error("[Multiplayer] Connection failed:", err);
                if (window.PumpkinPanic.ui) {
                    window.PumpkinPanic.ui.showConnectionErrorModal(
                        err.message || `Could not connect to multiplayer server at ${serverEndpoint}.\n\nWould you like to play Local Practice Mode instead?`
                    );
                }
            });

            // 5. Setup Full Collisions & Interactions
            this.setupCollisions();
        }

        onLobbyMatchLaunched() {
            this.isLobbyActive = false;
            this.matchActive = true;
            this.matchStartTime = Date.now();
            if (this.player && this.cameras && this.cameras.main) {
                this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
                this.cameras.main.setZoom(1.0);
            }

            // Signal CrazyGames gameplayStart
            if (window.PumpkinPanic.CrazyGames) {
                window.PumpkinPanic.CrazyGames.gameplayStart();
            }
        }

        setupMultiplayerNetworkEvents() {
            if (!this.networkAdapter) return;

            // Entity Joined (Human or Server-side Bot)
            this.networkAdapter.on('onEntityJoined', (data) => {
                const { player, sessionId, isLocalPlayer } = data;

                if (isLocalPlayer) {
                    // Spawn local player container
                    if (this.player) this.player.destroy();
                    this.player = new window.PumpkinPanic.Player(this, player.x, player.y, {
                        id: sessionId,
                        name: player.name,
                        skin: player.skin,
                        isBot: false
                    });
                    this.entitiesGroup.add(this.player);
                    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
                    this.cameras.main.setZoom(1.0);
                } else {
                    // Spawn remote player or server bot
                    if (this.remoteEntities.has(sessionId)) {
                        this.remoteEntities.get(sessionId).destroy();
                    }
                    const remote = new window.PumpkinPanic.Entity(this, player.x, player.y, {
                        id: sessionId,
                        name: player.name,
                        skin: player.skin,
                        isBot: !!player.isBot
                    });
                    remote.targetX = player.x;
                    remote.targetY = player.y;
                    remote.targetAim = player.aimAngle;
                    this.remoteEntities.set(sessionId, remote);
                    this.entitiesGroup.add(remote);
                }
            });

            // Entity Left
            this.networkAdapter.on('onEntityLeft', (data) => {
                const { sessionId } = data;
                const remote = this.remoteEntities.get(sessionId);
                if (remote) {
                    remote.destroy();
                    this.remoteEntities.delete(sessionId);
                }
            });

            // Authoritative State Update Tick
            this.networkAdapter.on('onStateUpdate', (state) => {
                if (!state) return;

                // Synchronize authoritative seeds & runes from Colyseus
                if (this.seedManager && (state.seeds || state.runes)) {
                    this.seedManager.syncMultiplayerSeeds(state.seeds, state.runes);
                }

                if (!state.players) return;

                // Synchronize combatants
                state.players.forEach((p, sId) => {
                    if (this.networkAdapter && sId === this.networkAdapter.sessionId) {
                        // Local Player sync
                        if (this.player && !this.player.isDead) {
                            this.player.health = p.health;
                            this.player.maxHealth = p.maxHealth;
                            this.player.level = p.level;
                            this.player.kills = p.kills;
                            this.player.score = p.score;
                            this.player.updateHealthBar();
                            if (p.isDead && !this.player.isDead) {
                                this.player.die(null);
                            }
                        }
                    } else {
                        // Remote Entity sync
                        const remote = this.remoteEntities.get(sId);
                        if (remote && !remote.isDead) {
                            remote.targetX = p.x;
                            remote.targetY = p.y;
                            remote.targetAim = p.aimAngle;
                            remote.health = p.health;
                            remote.maxHealth = p.maxHealth;
                            remote.level = p.level;
                            remote.kills = p.kills;
                            remote.score = p.score;
                            remote.activeWeapon = p.activeWeapon;
                            remote.updateHealthBar();
                            if (p.isDead && !remote.isDead) {
                                remote.die(null);
                            }
                        }
                    }
                });

                // Synchronize Storm
                if (state.storm && this.stormSystem) {
                    this.stormSystem.center = { x: state.storm.centerX, y: state.storm.centerY };
                    this.stormSystem.currentRadius = state.storm.currentRadius;
                    this.stormSystem.targetRadius = state.storm.targetRadius;
                    this.stormSystem.state = state.storm.state;
                    this.stormSystem.timeLeft = state.storm.timeLeft;
                }
            });

            // Authoritative Projectile Spawns
            this.networkAdapter.on('onProjectileSpawned', (data) => {
                const { proj } = data;
                if (!proj) return;

                // Only render projectiles fired by other players (local player has client-side prediction)
                if (this.networkAdapter && proj.ownerId !== this.networkAdapter.sessionId) {
                    const angle = Math.atan2(proj.vy, proj.vx);
                    this.bulletPool.spawnBullet(
                        proj.x,
                        proj.y,
                        angle,
                        proj.damage,
                        null,
                        1.0,
                        proj.mutationType,
                        proj.bouncesLeft
                    );
                }
            });

            // Authoritative Damage Events
            this.networkAdapter.on('onEntityDamaged', (data) => {
                const { entityId, amount, health, maxHealth } = data;
                let target = null;
                if (this.player && this.player.id === entityId) target = this.player;
                else if (this.remoteEntities.has(entityId)) target = this.remoteEntities.get(entityId);

                if (target) {
                    target.health = health;
                    target.maxHealth = maxHealth;
                    target.updateHealthBar();
                    target.spawnDamageNumber(amount);

                    // Hit Flash
                    this.tweens.add({
                        targets: [target.bodySprite, target.faceSprite],
                        tint: 0xffffff,
                        duration: 65,
                        yoyo: true,
                        onComplete: () => {
                            if (target.bodySprite && target.faceSprite) {
                                target.bodySprite.clearTint();
                                target.faceSprite.clearTint();
                            }
                        }
                    });

                    if (target === this.player) {
                        this.cameras.main.shake(90, 0.004);
                    }
                }
            });

            // Authoritative Elimination Events
            this.networkAdapter.on('onEntityDied', (data) => {
                const { victimId, victimName, killerId, killerName } = data;

                if (window.PumpkinPanic.ui) {
                    window.PumpkinPanic.ui.showEliminationBanner(victimName, killerName);
                }

                if (window.PumpkinPanic.AudioSystem) {
                    window.PumpkinPanic.AudioSystem.playEliminationSound();
                }

                let victim = null;
                if (this.player && this.player.id === victimId) victim = this.player;
                else if (this.remoteEntities.has(victimId)) victim = this.remoteEntities.get(victimId);

                if (victim) {
                    victim.die({ name: killerName });
                }

                if (victim === this.player) {
                    this.triggerGameOver(false, killerName);
                }
            });

            // Authoritative Match Ended
            this.networkAdapter.on('onMatchEnded', (data) => {
                const isVictory = (this.player && !this.player.isDead && (data.winnerId === this.player.id || data.winnerName === this.player.name));
                this.triggerGameOver(isVictory, null);
            });

            // Connection Error / Room Leave
            this.networkAdapter.on('onConnectionError', (err) => {
                console.warn("[Multiplayer] Connection error:", err);
                if (window.PumpkinPanic.ui) {
                    window.PumpkinPanic.ui.showConnectionErrorModal(
                        "Disconnected from multiplayer room. Fall back to local practice mode?"
                    );
                }
            });
        }

        spawnBots() {
            const count = Config.BOTS.COUNT;
            const center = Config.WORLD.WIDTH / 2;

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
                const distance = Phaser.Math.Between(550, 2400);
                const bx = Phaser.Math.Clamp(center + Math.cos(angle) * distance, 180, Config.WORLD.WIDTH - 180);
                const by = Phaser.Math.Clamp(center + Math.sin(angle) * distance, 180, Config.WORLD.HEIGHT - 180);

                const botName = Config.BOTS.NAMES[i] || (`SpookyBot_${i + 1} [BOT]`);
                const botSkin = Config.BOTS.SKINS[i % Config.BOTS.SKINS.length];

                const bot = new window.PumpkinPanic.Bot(this, bx, by, {
                    name: botName,
                    skin: botSkin
                });
                this.bots.push(bot);
            }
        }

        setupCollisions() {
            // Remove previous colliders if any were registered
            if (this.activeColliders && this.activeColliders.length > 0) {
                this.activeColliders.forEach(c => {
                    if (c) this.physics.world.removeCollider(c);
                });
            }
            this.activeColliders = [];

            // 1. Entities collide with Obstacles & Boundaries
            this.activeColliders.push(this.physics.add.collider(this.entitiesGroup, this.obstacles));

            // 2. Soft push collision between entities
            this.activeColliders.push(this.physics.add.collider(this.entitiesGroup, this.entitiesGroup));

            // 3. Bullets collide with Obstacles
            this.activeColliders.push(this.physics.add.collider(this.bulletPool.group, this.obstacles, (objA, objB) => {
                const bullet = (objA && typeof objA.deactivate === 'function') ? objA : objB;
                if (bullet && typeof bullet.deactivate === 'function') {
                    this.emitterManager.emitSpark(bullet.x, bullet.y);
                    bullet.deactivate();
                }
            }));

            // 4. Bullets collide with Entities (Bullet vs Entity)
            this.activeColliders.push(this.physics.add.overlap(this.bulletPool.group, this.entitiesGroup, (objA, objB) => {
                let entity = null;
                let bullet = null;

                if (objA && typeof objA.takeDamage === 'function') {
                    entity = objA;
                    bullet = objB;
                } else if (objB && typeof objB.takeDamage === 'function') {
                    entity = objB;
                    bullet = objA;
                }

                if (!entity || !bullet || !bullet.active || entity.isDead) return;
                if (bullet.owner === entity) return;

                entity.takeDamage(bullet.damage, bullet.owner);
                this.emitterManager.emitSpark(bullet.x, bullet.y);
                bullet.deactivate();
            }));

            // 5. Entities collect Seeds
            this.activeColliders.push(this.physics.add.overlap(this.entitiesGroup, this.seedManager.seedsGroup, (objA, objB) => {
                let entity = null;
                let seed = null;

                if (objA && typeof objA.addXP === 'function') {
                    entity = objA;
                    seed = objB;
                } else if (objB && typeof objB.addXP === 'function') {
                    entity = objB;
                    seed = objA;
                }

                if (!entity || !seed || entity.isDead || !seed.active) return;
                if (typeof seed.collect === 'function') {
                    seed.collect(entity);
                }
            }));

            // 6. Entities collect Weapon Mutation Runes
            this.activeColliders.push(this.physics.add.overlap(this.entitiesGroup, this.seedManager.runesGroup, (objA, objB) => {
                let entity = null;
                let rune = null;

                if (objA && typeof objA.equipWeapon === 'function') {
                    entity = objA;
                    rune = objB;
                } else if (objB && typeof objB.equipWeapon === 'function') {
                    entity = objB;
                    rune = objA;
                }

                if (!entity || !rune || entity.isDead || !rune.active) return;
                if (typeof rune.collect === 'function') {
                    rune.collect(entity);
                }
            }));

            // 7. Entities trigger Explosive Seeds when touched
            this.activeColliders.push(this.physics.add.overlap(this.entitiesGroup, this.seedManager.explosiveGroup, (objA, objB) => {
                const expSeed = (objA && typeof objA.triggerFuse === 'function') ? objA : objB;
                if (expSeed && typeof expSeed.triggerFuse === 'function') {
                    expSeed.triggerFuse();
                }
            }));

            // 8. Bullets ignite Explosive Seeds on impact
            this.activeColliders.push(this.physics.add.overlap(this.bulletPool.group, this.seedManager.explosiveGroup, (objA, objB) => {
                const expSeed = (objA && typeof objA.triggerFuse === 'function') ? objA : objB;
                const bullet = (objA && typeof objA.deactivate === 'function') ? objA : objB;
                if (expSeed && typeof expSeed.triggerFuse === 'function') {
                    expSeed.triggerFuse();
                }
                if (bullet && typeof bullet.deactivate === 'function') {
                    this.emitterManager.emitSpark(bullet.x, bullet.y);
                    bullet.deactivate();
                }
            }));

            // 9. Bullets damage Golden Pinata mini-boss!
            if (this.seedManager.pinataGroup) {
                this.activeColliders.push(this.physics.add.overlap(this.bulletPool.group, this.seedManager.pinataGroup, (objA, objB) => {
                    const pinata = (objA && typeof objA.takeDamage === 'function') ? objA : objB;
                    const bullet = (objA && typeof objA.deactivate === 'function') ? objA : objB;
                    if (!pinata || !bullet || !bullet.active || pinata.isDead) return;

                    pinata.takeDamage(bullet.damage, bullet.owner);
                    this.emitterManager.emitSpark(bullet.x, bullet.y);
                    bullet.deactivate();
                }));
                this.activeColliders.push(this.physics.add.collider(this.entitiesGroup, this.seedManager.pinataGroup));
            }
        }

        handleEntityDefeated(data) {
            const { entity, killer, killedByName } = data;

            // Elimination Announcement in UI
            if (window.PumpkinPanic.ui) {
                const victimName = entity ? entity.name : 'A Pumpkin';
                const killerLabel = killedByName || (killer ? killer.name : 'The Pumpkin Storm');
                window.PumpkinPanic.ui.showEliminationBanner(victimName, killerLabel);
            }

            // Elimination audio
            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playEliminationSound();
            }

            // Player Killstreak Check (Local and Multiplayer)
            if (killer === this.player && entity !== this.player) {
                this.playerKillStreak = (this.playerKillStreak || 0) + 1;
                let streakTitle = null;
                let bonusCoins = 0;

                if (this.playerKillStreak === 2) {
                    streakTitle = '⚡ DOUBLE HARVEST! (+50 🪙)';
                    bonusCoins = 50;
                } else if (this.playerKillStreak === 3) {
                    streakTitle = '🎃 TRIPLE HARVEST! (+100 🪙)';
                    bonusCoins = 100;
                } else if (this.playerKillStreak === 5) {
                    streakTitle = '💀 PUMPKIN CARNAGE! (+250 🪙)';
                    bonusCoins = 250;
                } else if (this.playerKillStreak === 8) {
                    streakTitle = '👑 UNSTOPPABLE GOURD! (+500 🪙)';
                    bonusCoins = 500;
                } else if (this.playerKillStreak >= 12) {
                    streakTitle = '🌟 GODLIKE HARVEST LORD! (+1,000 🪙)';
                    bonusCoins = 1000;
                }

                if (streakTitle) {
                    if (window.PumpkinPanic.AudioSystem) {
                        window.PumpkinPanic.AudioSystem.playKillstreak(this.playerKillStreak);
                    }
                    if (this.player) {
                        this.player.addCoins(bonusCoins);

                        // Giant Floating Killstreak Banner
                        const ksText = this.add.text(this.player.x, this.player.y - 70, streakTitle, {
                            fontFamily: 'Fredoka, sans-serif',
                            fontSize: '22px',
                            fontWeight: 'bold',
                            color: '#ffea00',
                            stroke: '#000000',
                            strokeThickness: 5
                        }).setOrigin(0.5).setDepth(26);

                        this.tweens.add({
                            targets: ksText,
                            y: ksText.y - 45,
                            scaleX: 1.15,
                            scaleY: 1.15,
                            alpha: 0,
                            duration: 1800,
                            ease: 'Cubic.easeOut',
                            onComplete: () => ksText.destroy()
                        });
                    }
                }
            } else if (entity === this.player) {
                this.playerKillStreak = 0;
            }

            // In Multiplayer Mode, the match ending is determined authoritatively by the server!
            if (this.isMultiplayer) {
                if (entity === this.player) {
                    this.triggerGameOver(false, killedByName);
                }
                return;
            }

            // Update leaderboard immediately (Local mode)
            if (this.leaderboardSystem) {
                this.leaderboardSystem.computeRankings();
            }

            // If player died -> Game Over
            if (entity === this.player) {
                this.triggerGameOver(false, killedByName);
                return;
            }

            // If all bots are defeated -> Player Victory! (Local Practice Mode only)
            const livingBots = this.bots.filter(b => !b.isDead);
            if (livingBots.length === 0 && this.player && !this.player.isDead) {
                this.triggerGameOver(true, null);
            }
        }

        triggerGameOver(isVictory, killedByName) {
            if (this.matchOver) return;
            this.matchOver = true;
            this.matchDuration = (this.time.now - this.matchStartTime) / 1000;

            // Signal CrazyGames lifecycle events
            if (window.PumpkinPanic.CrazyGames) {
                window.PumpkinPanic.CrazyGames.gameplayStop();
                if (isVictory) {
                    window.PumpkinPanic.CrazyGames.happytime();
                }
            }

            if (isVictory && window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playVictory();
            }

            // Camera slow zoom on player/winner
            this.cameras.main.zoomTo(1.15, 1200, 'Cubic.easeOut');

            // Dispatch match end to UIManager with killer attribution
            if (window.PumpkinPanic.ui) {
                window.PumpkinPanic.ui.showEndScreen({
                    isVictory: isVictory,
                    killedByName: killedByName || 'Unknown Threat',
                    rank: isVictory ? 1 : this.leaderboardSystem.playerRank,
                    totalPlayers: 1 + this.bots.length,
                    kills: this.player ? this.player.kills : 0,
                    level: this.player ? this.player.level : 1,
                    xp: this.player ? this.player.xp : 0,
                    score: this.player ? this.player.score : 0,
                    survivalTime: this.matchDuration
                });
            }
        }

        update(time, delta) {
            if (!this.matchActive || this.isLobbyActive) {
                // Ambient camera centering / drift while on start screen or in lobby
                const cx = Config.WORLD.WIDTH / 2;
                const cy = Config.WORLD.HEIGHT / 2;
                if (this.player && this.isLobbyActive) {
                    this.cameras.main.centerOn(this.player.x, this.player.y);
                } else {
                    this.cameras.main.centerOn(cx + Math.cos(time * 0.0004) * 80, cy + Math.sin(time * 0.0004) * 80);
                }
                return;
            }

            if (this.matchOver) return;

            // Update Player
            if (this.player && !this.player.isDead) {
                this.player.update(time, delta);
            }

            // Update Remote Entities with Smooth Position Interpolation (Online Multiplayer)
            if (this.isMultiplayer && this.remoteEntities) {
                const lerpFactor = Config.MULTIPLAYER.INTERPOLATION_LERP || 0.24;
                this.remoteEntities.forEach(remote => {
                    if (remote && !remote.isDead) {
                        if (remote.targetX !== undefined) {
                            remote.x = Phaser.Math.Linear(remote.x, remote.targetX, lerpFactor);
                        }
                        if (remote.targetY !== undefined) {
                            remote.y = Phaser.Math.Linear(remote.y, remote.targetY, lerpFactor);
                        }
                        if (remote.targetAim !== undefined) {
                            remote.aimAngle = remote.targetAim;
                        }
                        remote.update(time, delta);
                    }
                });
            }

            // Update Bots (Local Practice Mode)
            for (let i = 0; i < this.bots.length; i++) {
                const bot = this.bots[i];
                if (bot && !bot.isDead) {
                    bot.update(time, delta);
                }
            }

            // Update Pumpkin Storm
            if (this.stormSystem) {
                this.stormSystem.update(time, delta);
            }

            // Update Leaderboard
            if (this.leaderboardSystem) {
                this.leaderboardSystem.update(time, delta);
            }

            // Sync HUD Data
            if (window.PumpkinPanic.ui && this.player) {
                const totalActivePumpkins = 1 + this.bots.length + (this.remoteEntities ? this.remoteEntities.size : 0);
                window.PumpkinPanic.ui.updateHUD({
                    health: this.player.health,
                    maxHealth: this.player.maxHealth,
                    level: this.player.level,
                    xp: this.player.xp,
                    nextLvlXp: Config.GROWTH.XP_THRESHOLDS[this.player.level] || 9999,
                    currentLvlBaseXp: Config.GROWTH.XP_THRESHOLDS[this.player.level - 1] || 0,
                    kills: this.player.kills,
                    score: this.player.score,
                    survivalTime: (this.time.now - this.matchStartTime) / 1000,
                    aliveCount: this.leaderboardSystem.aliveCount,
                    totalPumpkins: totalActivePumpkins,
                    playerRank: this.leaderboardSystem.playerRank,
                    stormStatus: this.stormSystem.getStatusInfo(),
                    playerPos: { x: this.player.x, y: this.player.y }
                });
            }
        }

        cleanupMatch() {
            if (this.bulletPool) this.bulletPool.clear();
            if (this.seedManager) this.seedManager.clear();
            if (this.stormSystem) this.stormSystem.destroy();

            // Disconnect and clean network adapter
            if (this.networkAdapter) {
                try {
                    this.networkAdapter.disconnect();
                } catch (e) {}
                this.networkAdapter = null;
            }

            // Clean remote entities
            if (this.remoteEntities) {
                this.remoteEntities.forEach(remote => {
                    if (remote) remote.destroy();
                });
                this.remoteEntities.clear();
            }

            if (this.player) {
                this.player.destroy();
                this.player = null;
            }

            for (let i = 0; i < this.bots.length; i++) {
                if (this.bots[i]) {
                    this.bots[i].destroy();
                }
            }
            this.bots = [];

            // Clean entities group safely without destroying the group instance
            if (this.entitiesGroup) {
                this.entitiesGroup.clear(false, false);
            }

            // Remove and clear all active physics colliders to prevent memory leaks across matches
            if (this.activeColliders && this.activeColliders.length > 0) {
                this.activeColliders.forEach(c => {
                    if (c) this.physics.world.removeCollider(c);
                });
                this.activeColliders = [];
            }
        }

        restartMatch() {
            this.startMatch(this.playerData);
        }

        returnToMenu() {
            if (window.PumpkinPanic.CrazyGames) {
                window.PumpkinPanic.CrazyGames.gameplayStop();
            }
            this.matchActive = false;
            this.matchOver = false;
            this.cleanupMatch();

            this.cameras.main.stopFollow();
            this.cameras.main.centerOn(Config.WORLD.WIDTH / 2, Config.WORLD.HEIGHT / 2);
            this.cameras.main.setZoom(1.0);

            if (window.PumpkinPanic.ui) {
                window.PumpkinPanic.ui.showStartMenu();
            }
        }
    }

    window.PumpkinPanic.GameScene = GameScene;
})();
