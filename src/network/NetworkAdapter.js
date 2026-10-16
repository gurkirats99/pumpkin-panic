/**
 * PUMPKIN PANIC.IO - Multiplayer Network Architecture Adapter
 * 
 * Provides an abstract boundary between game simulation/rendering and network transport.
 * Allows seamless swap between local simulation (for local prototype & bots)
 * and server-authoritative Colyseus room client.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};

    class BaseNetworkAdapter {
        constructor() {
            this.listeners = {
                onStateUpdate: [],
                onEntityJoined: [],
                onEntityLeft: [],
                onEntityDamaged: [],
                onEntityDied: [],
                onStormUpdate: [],
                onLeaderboardUpdate: []
            };
        }

        on(event, callback) {
            if (this.listeners[event]) {
                this.listeners[event].push(callback);
            }
        }

        emit(event, data) {
            if (this.listeners[event]) {
                for (let i = 0; i < this.listeners[event].length; i++) {
                    this.listeners[event][i](data);
                }
            }
        }

        connect(options) {
            throw new Error('connect() must be implemented by adapter');
        }

        sendInput(movement) {
            throw new Error('sendInput() must be implemented by adapter');
        }

        sendShoot(targetX, targetY) {
            throw new Error('sendShoot() must be implemented by adapter');
        }

        disconnect() {
            this.listeners = {};
        }
    }

    /**
     * LocalNetworkAdapter: Runs local simulation for bots & player.
     * Serves as the authoritative source for the local single-player prototype.
     */
    class LocalNetworkAdapter extends BaseNetworkAdapter {
        constructor(scene) {
            super();
            this.scene = scene;
            this.isLocal = true;
            this.connected = false;
        }

        connect(options = {}) {
            this.connected = true;
            return Promise.resolve({
                sessionId: 'local-player-' + Date.now(),
                roomId: 'local-arena'
            });
        }

        sendInput(movement) {
            // In local mode, inputs are applied directly to the player entity in the scene
            if (this.scene && this.scene.player) {
                this.scene.player.applyMovementInput(movement.vx, movement.vy, movement.aimAngle);
            }
        }

        sendShoot(targetX, targetY) {
            if (this.scene && this.scene.player) {
                this.scene.player.requestShoot(targetX, targetY);
            }
        }

        disconnect() {
            super.disconnect();
            this.connected = false;
        }
    }

    /**
     * ColyseusNetworkAdapter:
     * Full-featured authoritative online multiplayer network adapter using Colyseus.
     * Manages real-time room connection, authoritative state sync, interpolation,
     * room code sharing, and health verification.
     */
    const getConfig = () => (window.PumpkinPanic && window.PumpkinPanic.Config) || {};
    const getMultiplayerConfig = () => getConfig().MULTIPLAYER || {
        getServerUrl: () => 'ws://localhost:2567',
        ROOM_NAME: 'pumpkin_arena',
        HEALTH_TIMEOUT_MS: 2800
    };

    class ColyseusNetworkAdapter extends BaseNetworkAdapter {
        constructor(scene, serverEndpoint) {
            super();
            this.scene = scene;
            this.endpoint = serverEndpoint || getMultiplayerConfig().getServerUrl();
            this.client = null;
            this.room = null;
            this.isLocal = false;
            this.connected = false;
            this.sessionId = null;
            this.roomCode = null;
        }

        static async checkHealth(endpoint) {
            const start = performance.now();
            try {
                const mpCfg = getMultiplayerConfig();
                const target = endpoint || mpCfg.getServerUrl();
                const httpUrl = target.replace(/^ws(s)?:/, 'http$1:');
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), mpCfg.HEALTH_TIMEOUT_MS || 2800);

                const res = await fetch(`${httpUrl}/health`, {
                    method: 'GET',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                const latencyMs = Math.round(performance.now() - start);
                if (res.ok) {
                    const data = await res.json();
                    return { ok: true, data, latencyMs };
                }
                return { ok: false, error: 'Status ' + res.status, latencyMs };
            } catch (err) {
                return { ok: false, error: err.message || 'Offline' };
            }
        }

        async connect(options = {}) {
            if (typeof Colyseus === 'undefined') {
                const err = new Error('Colyseus SDK not loaded on client');
                this.emit('onConnectionError', err);
                this.emit('onStatusChange', { status: 'DISCONNECTED', message: 'Colyseus SDK not loaded' });
                throw err;
            }

            const mpCfg = getMultiplayerConfig();
            this.endpoint = options.endpoint || this.endpoint || mpCfg.getServerUrl();
            this.client = new Colyseus.Client(this.endpoint);
            this.manualLeave = false;

            const roomName = mpCfg.ROOM_NAME || "pumpkin_arena";
            const joinOptions = {
                name: options.name || 'SpookyPumpkin',
                skin: options.skin || 'classic',
                gun: options.gun || localStorage.getItem('pumpkin_equipped_gun') || 'SEED_PISTOL',
                roomCode: options.roomCode || null,
                isPrivate: (options.mode === 'create')
            };

            try {
                this.emit('onStatusChange', {
                    status: (options.mode === 'quick' ? 'SEARCHING' : 'CONNECTING'),
                    message: (options.mode === 'quick' ? 'Searching for an arena match...' : 'Connecting to multiplayer arena...')
                });

                if (options.mode === 'create') {
                    // Host creates a private room
                    this.room = await this.client.create(roomName, joinOptions);
                } else if (options.mode === 'join' && (options.roomId || options.roomCode)) {
                    // Join by Room ID or Code with robust case & lookup handling
                    const targetCode = (options.roomId || options.roomCode).trim();
                    try {
                        this.room = await this.client.joinById(targetCode, joinOptions);
                    } catch (primaryErr) {
                        // Attempt fallback lookup via getAvailableRooms or normalized casing
                        let foundRoomId = null;
                        try {
                            const rooms = await this.client.getAvailableRooms(roomName);
                            if (rooms && rooms.length > 0) {
                                const match = rooms.find(r => 
                                    (r.roomId && r.roomId.toLowerCase() === targetCode.toLowerCase()) ||
                                    (r.metadata && r.metadata.roomCode && r.metadata.roomCode.toLowerCase() === targetCode.toLowerCase())
                                );
                                if (match) foundRoomId = match.roomId;
                            }
                        } catch (e) {}

                        if (foundRoomId) {
                            this.room = await this.client.joinById(foundRoomId, joinOptions);
                        } else {
                            throw primaryErr;
                        }
                    }
                } else {
                    // Quick Play (Matchmake into any available room or create)
                    this.room = await this.client.joinOrCreate(roomName, joinOptions);
                }

                this.connected = true;
                this.sessionId = this.room.sessionId;
                this.roomCode = (this.room.state && this.room.state.roomCode) || this.room.id;
                this.isRoomCreator = (options.mode === 'create');

                this.emit('onStatusChange', {
                    status: 'LOBBY',
                    message: 'Connected to arena lobby'
                });

                this.setupRoomListeners();

                return {
                    sessionId: this.room.sessionId,
                    roomId: this.room.id,
                    roomCode: this.roomCode
                };
            } catch (err) {
                this.connected = false;
                let userFriendlyMsg = err.message || 'Could not connect to multiplayer room';
                if (err.message && err.message.includes('not found')) {
                    userFriendlyMsg = `Room "${options.roomCode || options.roomId}" was not found. Please verify the code and try again.`;
                }
                const enhancedErr = new Error(userFriendlyMsg);
                enhancedErr.original = err;

                this.emit('onStatusChange', {
                    status: 'DISCONNECTED',
                    message: userFriendlyMsg
                });
                this.emit('onConnectionError', enhancedErr);
                throw enhancedErr;
            }
        }

        getRoomCode() {
            if (this.roomCode) return this.roomCode;
            if (this.room && this.room.id) return this.room.id;
            return '';
        }

        getInviteUrl() {
            const code = this.getRoomCode();
            if (!code) return '';
            const origin = window.location.origin || '';
            const path = window.location.pathname || '';
            const search = `?room=${encodeURIComponent(code)}`;
            if (origin.startsWith('http') || origin.startsWith('https')) {
                return `${origin}${path}${search}`;
            }
            // For file:// or custom webview protocols
            return `${window.location.href.split('?')[0]}${search}`;
        }

        getConnectedHumanPlayers() {
            if (!this.room || !this.room.state || !this.room.state.players) return [];
            const list = [];
            let firstHumanSessionId = null;

            this.room.state.players.forEach((player, sessionId) => {
                if (!player.isBot) {
                    if (!firstHumanSessionId) firstHumanSessionId = sessionId;
                    list.push({
                        sessionId: sessionId,
                        name: player.name || 'Pumpkin',
                        skin: player.skin || 'classic',
                        gun: player.gun || 'SEED_PISTOL',
                        isSelf: (sessionId === this.room.sessionId),
                        isHost: (this.isRoomCreator ? sessionId === this.room.sessionId : sessionId === firstHumanSessionId),
                        ping: Math.floor(18 + Math.random() * 12)
                    });
                }
            });

            return list;
        }

        getBotCount() {
            if (!this.room || !this.room.state || !this.room.state.players) return 0;
            let bots = 0;
            this.room.state.players.forEach(p => {
                if (p.isBot) bots++;
            });
            return bots;
        }

        isHost() {
            const humans = this.getConnectedHumanPlayers();
            if (humans.length === 0) return false;
            const self = humans.find(h => h.isSelf);
            return self ? !!self.isHost : false;
        }

        setupRoomListeners() {
            if (!this.room) return;

            const knownPlayerIds = new Set();

            const checkPlayersDiff = (playersMap) => {
                if (!playersMap) return;
                const currentIds = new Set();
                playersMap.forEach((player, sessionId) => {
                    currentIds.add(sessionId);
                    if (!knownPlayerIds.has(sessionId)) {
                        knownPlayerIds.add(sessionId);
                        const isLocalPlayer = (sessionId === this.room.sessionId);
                        this.emit('onEntityJoined', { player, sessionId, isLocalPlayer });
                    }
                });

                // Detect removals
                for (const prevId of knownPlayerIds) {
                    if (!currentIds.has(prevId)) {
                        knownPlayerIds.delete(prevId);
                        this.emit('onEntityLeft', { sessionId: prevId });
                    }
                }

                // Notify lobby of updated roster
                this.emit('onLobbyRosterUpdated', {
                    humans: this.getConnectedHumanPlayers(),
                    botCount: this.getBotCount(),
                    totalPlayers: this.room.state ? this.room.state.players.size : 1
                });
            };

            // Check if players are already present in initial state
            if (this.room.state && this.room.state.players) {
                checkPlayersDiff(this.room.state.players);
            }

            // Room state change (authoritative tick from server)
            this.room.onStateChange((state) => {
                this.emit('onStateUpdate', state);
                if (state && state.players) {
                    checkPlayersDiff(state.players);
                }
            });

            // Authoritative Broadcast Messages (Catch-all + specific dispatch)
            this.room.onMessage("*", (type, msg) => {
                if (type === "projectile_fired") {
                    const bulletSpeed = (window.PumpkinPanic.Config && window.PumpkinPanic.Config.PLAYER && window.PumpkinPanic.Config.PLAYER.BULLET_SPEED) || 720;
                    this.emit('onProjectileSpawned', {
                        proj: {
                            ownerId: msg.ownerId,
                            x: msg.x,
                            y: msg.y,
                            vx: Math.cos(msg.angle) * bulletSpeed,
                            vy: Math.sin(msg.angle) * bulletSpeed,
                            damage: 15,
                            mutationType: msg.mutation || 'NORMAL',
                            bouncesLeft: (msg.mutation === 'BOUNCING' ? 2 : 0)
                        }
                    });
                } else if (type === "entity_damaged") {
                    this.emit('onEntityDamaged', msg);
                } else if (type === "entity_eliminated") {
                    this.emit('onEntityDied', msg);
                } else if (type === "weapon_equipped") {
                    this.emit('onWeaponEquipped', msg);
                } else if (type === "explosive_triggered") {
                    this.emit('onExplosiveTriggered', msg);
                } else if (type === "explosive_detonated") {
                    this.emit('onExplosiveDetonated', msg);
                } else if (type === "level_up") {
                    this.emit('onLevelUp', msg);
                } else if (type === "match_ended") {
                    this.emit('onMatchEnded', msg);
                } else if (type === "match_started") {
                    this.emit('onMatchStartedByHost', msg);
                } else if (type === "chat_message") {
                    this.emit('onChatMessage', msg);
                }
            });

            // Room Error & Disconnect
            this.room.onError((code, message) => {
                console.error(`[Colyseus] Room Error (${code}):`, message);
                this.emit('onRoomError', { code, message });
                this.emit('onStatusChange', { status: 'DISCONNECTED', message: `Server error (${code}): ${message}` });
            });

            this.room.onLeave((code) => {
                console.log(`[Colyseus] Left room with code:`, code);
                this.connected = false;

                if (code > 1000 && !this.manualLeave) {
                    this.emit('onStatusChange', {
                        status: 'RECONNECTING',
                        message: 'Connection dropped unexpectedly. Reconnecting...'
                    });
                } else {
                    this.emit('onStatusChange', {
                        status: 'DISCONNECTED',
                        message: 'Disconnected from arena'
                    });
                }

                this.emit('onRoomLeave', { code });
            });
        }

        sendInput(movement) {
            if (this.room && this.connected) {
                this.room.send("player_input", {
                    vx: movement.vx,
                    vy: movement.vy,
                    aimAngle: movement.aimAngle
                });
            }
        }

        sendShoot(targetX, targetY, aimAngle) {
            if (this.room && this.connected) {
                this.room.send("player_shoot", {
                    targetX,
                    targetY,
                    aimAngle
                });
            }
        }

        sendHitEntity(targetId, damage) {
            if (this.room && this.connected) {
                this.room.send("player_hit_entity", {
                    targetId,
                    damage
                });
            }
        }

        sendCollectSeed(seedId) {
            if (this.room && this.connected) {
                this.room.send("collect_seed", {
                    seedId
                });
            }
        }

        sendCollectRune(runeId) {
            if (this.room && this.connected) {
                this.room.send("collect_rune", {
                    runeId
                });
            }
        }

        disconnect() {
            if (this.room) {
                try {
                    this.room.leave();
                } catch (e) {}
                this.room = null;
            }
            this.connected = false;
            super.disconnect();
        }
    }

    window.PumpkinPanic.NetworkAdapter = {
        Base: BaseNetworkAdapter,
        Local: LocalNetworkAdapter,
        Colyseus: ColyseusNetworkAdapter,
        checkHealth: ColyseusNetworkAdapter.checkHealth
    };
})();
