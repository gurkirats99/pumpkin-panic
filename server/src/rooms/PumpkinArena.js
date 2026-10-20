const colyseus = require('colyseus');
const { Room } = colyseus;
const {
    PumpkinArenaState,
    PlayerState,
    ProjectileState,
    SeedState,
    RuneState,
    ExplosiveSeedState
} = require('../schema/GameState');
const Config = require('../config');

class PumpkinArenaRoom extends Room {
    onCreate(options) {
        this.maxClients = 16;
        this.setState(new PumpkinArenaState());

        // Room Code (e.g. "PUMP77")
        this.state.roomCode = options.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
        this.state.matchActive = true;
        this.state.matchTime = 0;

        // Internal server simulation tracking
        this.nextProjectileId = 1;
        this.nextSeedId = 1;
        this.bots = [];
        this.lastStormDamageTime = 0;

        // Initialize arena elements
        this.initSeeds();
        this.initRunes();
        this.initExplosives();
        this.initStorm();

        // Message Handlers
        this.onMessage("player_input", (client, message) => {
            this.handlePlayerInput(client.sessionId, message);
        });

        this.onMessage("player_shoot", (client, message) => {
            this.handlePlayerShoot(client.sessionId, message);
        });

        this.onMessage("player_hit_entity", (client, message) => {
            this.handlePlayerHit(client.sessionId, message);
        });

        this.onMessage("collect_seed", (client, message) => {
            this.handleCollectSeed(client.sessionId, message);
        });

        this.onMessage("start_match_now", (client, message) => {
            this.broadcast("match_started", {
                startedBy: client.sessionId,
                timestamp: Date.now()
            });
        });

        this.onMessage("match_started", (client, message) => {
            this.broadcast("match_started", {
                startedBy: client.sessionId,
                timestamp: Date.now()
            });
        });

        // Set authoritative simulation loop: 25 updates per second (40ms tick)
        this.setSimulationInterval((deltaTime) => this.update(deltaTime), 40);
    }

    onJoin(client, options) {
        const player = new PlayerState();
        player.id = client.sessionId;
        player.sessionId = client.sessionId;
        player.name = (options.name && options.name.trim().substring(0, 16)) || ("Pumpkin_" + client.sessionId.substring(0, 4));
        player.skin = options.skin || "classic";
        player.gun = options.gun || "SEED_PISTOL";
        player.isBot = false;

        // Count existing human players before this join
        let existingHumans = 0;
        this.state.players.forEach(p => {
            if (!p.isBot) existingHumans++;
        });

        // If this is the only human joining, or if match was over, or storm was shrunk: start fresh match!
        if (existingHumans === 0 || this.state.matchOver || this.state.storm.currentRadius < 1100) {
            this.resetMatch();
        }

        // Safe spawn point near arena center
        const spawnCenter = Config.WORLD.WIDTH / 2;
        player.x = spawnCenter + (Math.random() - 0.5) * 300;
        player.y = spawnCenter + (Math.random() - 0.5) * 300;
        player.health = Config.PLAYER.BASE_HEALTH;
        player.maxHealth = Config.PLAYER.BASE_HEALTH;

        player.lastFireTime = 0;
        player.invulnUntil = Date.now() + (Config.PLAYER.SPAWN_SHIELD_DURATION || 4000);

        this.state.players.set(client.sessionId, player);

        this.broadcast("chat_message", {
            type: "system",
            text: `${player.name} joined the harvest arena!`
        });

        // Adjust bots count based on human count
        this.balanceBots();
    }

    async onLeave(client, consented) {
        const player = this.state.players.get(client.sessionId);
        if (player) {
            player.isDead = true;
            this.state.players.delete(client.sessionId);

            this.broadcast("chat_message", {
                type: "system",
                text: `${player.name} disconnected.`
            });

            // Adjust bot balance and check victory conditions immediately
            this.balanceBots();
            this.checkMatchConditions();
        }
    }

    onDispose() {
        this.bots = [];
    }

    handlePlayerInput(sessionId, message) {
        const player = this.state.players.get(sessionId);
        if (!player || player.isDead) return;

        // Validate movement velocity & apply speed limit
        let vx = Number(message.vx) || 0;
        let vy = Number(message.vy) || 0;
        const len = Math.hypot(vx, vy);

        const currentMaxSpeed = Config.WORLD.MAX_SPEED;
        if (len > currentMaxSpeed) {
            vx = (vx / len) * currentMaxSpeed;
            vy = (vy / len) * currentMaxSpeed;
        }

        player.vx = vx;
        player.vy = vy;

        if (typeof message.aimAngle === 'number') {
            player.aimAngle = message.aimAngle;
        }
    }

    handlePlayerShoot(sessionId, message) {
        const player = this.state.players.get(sessionId);
        if (!player || player.isDead) return;

        const now = Date.now();
        let cooldown = Config.PLAYER.FIRE_COOLDOWN;
        if (player.activeWeapon && player.activeWeapon !== 'NORMAL') {
            if (player.activeWeapon === 'RAPID') {
                cooldown *= Config.WEAPONS.RAPID.cooldownMultiplier;
            } else if (player.activeWeapon === 'GHOSTFIRE') {
                cooldown *= (Config.WEAPONS.GHOSTFIRE ? Config.WEAPONS.GHOSTFIRE.cooldownMultiplier : 0.45);
            } else if (player.activeWeapon === 'SHOTGUN') {
                cooldown *= (Config.WEAPONS.SHOTGUN ? Config.WEAPONS.SHOTGUN.cooldownMultiplier : 1.35);
            }
        } else if (player.gun && Config.GUNS && Config.GUNS[player.gun]) {
            cooldown *= (Config.GUNS[player.gun].cooldownMultiplier || 1.0);
        }

        if (now < (player.lastFireTime || 0) + cooldown) {
            return; // Rate limit exceeded; ignore firing
        }
        player.lastFireTime = now;

        const aimAngle = (typeof message.aimAngle === 'number') ? message.aimAngle : player.aimAngle;
        player.aimAngle = aimAngle;

        this.spawnAuthoritativeProjectiles(player, aimAngle);
    }

    handlePlayerHit(sessionId, message) {
        if (!message || !message.targetId) return;
        const attacker = this.state.players.get(sessionId);
        if (!attacker || attacker.isDead) return;

        const target = this.state.players.get(message.targetId);
        if (!target || target.isDead || target.id === attacker.id) return;

        // Validation: verify distance between attacker and target is reasonable (< 950px)
        const dist = Math.hypot(attacker.x - target.x, attacker.y - target.y);
        if (dist > 950) return;

        // Apply validated damage
        const damage = Math.min(80, Math.max(8, Number(message.damage) || Config.PLAYER.BASE_DAMAGE));
        this.applyDamage(target, damage, sessionId);
    }

    handleCollectSeed(sessionId, message) {
        const player = this.state.players.get(sessionId);
        if (!player || player.isDead) return;

        const seed = this.state.seeds.get(message.seedId);
        if (!seed || !seed.active) return;

        const dist = Math.hypot(player.x - seed.x, player.y - seed.y);
        if (dist < 180) {
            seed.active = false;
            const xpGain = seed.isSuper ? Config.SEEDS.SUPER_XP : Config.SEEDS.NORMAL_XP;
            const healGain = seed.isSuper ? Config.SEEDS.SUPER_HEAL : Config.SEEDS.NORMAL_HEAL;

            this.awardXP(player, xpGain);
            player.health = Math.min(player.maxHealth, player.health + healGain);

            setTimeout(() => {
                seed.x = 120 + Math.random() * (Config.WORLD.WIDTH - 240);
                seed.y = 120 + Math.random() * (Config.WORLD.HEIGHT - 240);
                seed.active = true;
            }, Config.SEEDS.RESPAWN_DELAY);
        }
    }

    handleCollectRune(sessionId, message) {
        const player = this.state.players.get(sessionId);
        if (!player || player.isDead) return;

        const rune = this.state.runes.get(message.runeId);
        if (!rune || !rune.active) return;

        const dist = Math.hypot(player.x - rune.x, player.y - rune.y);
        if (dist < 180) {
            rune.active = false;
            player.activeWeapon = rune.weaponType;
            player.weaponTimeRemaining = Config.WEAPONS[rune.weaponType].duration;

            this.broadcast("weapon_equipped", {
                entityId: player.id,
                weaponType: rune.weaponType
            });

            setTimeout(() => {
                rune.x = 140 + Math.random() * (Config.WORLD.WIDTH - 280);
                rune.y = 140 + Math.random() * (Config.WORLD.HEIGHT - 280);
                rune.active = true;
            }, 18000);
        }
    }

    spawnAuthoritativeProjectiles(owner, aimAngle) {
        const spawnDist = 40;
        const spawnX = owner.x + Math.cos(aimAngle) * spawnDist;
        const spawnY = owner.y + Math.sin(aimAngle) * spawnDist;

        if (owner.activeWeapon === 'TRIPLE') {
            const spread = Config.WEAPONS.TRIPLE.spreadRad;
            const angles = [aimAngle - spread, aimAngle, aimAngle + spread];
            const dmg = Config.PLAYER.BASE_DAMAGE * Config.WEAPONS.TRIPLE.damageMultiplier;

            angles.forEach(ang => {
                this.createProjectile(owner.id, spawnX, spawnY, ang, dmg, 'TRIPLE', 0);
            });
        } else if (owner.activeWeapon === 'RAPID') {
            const dmg = Config.PLAYER.BASE_DAMAGE * Config.WEAPONS.RAPID.damageMultiplier;
            const speed = Config.PLAYER.BULLET_SPEED * Config.WEAPONS.RAPID.speedMultiplier;
            this.createProjectile(owner.id, spawnX, spawnY, aimAngle, dmg, 'RAPID', 0, speed);
        } else if (owner.activeWeapon === 'BOUNCING') {
            const dmg = Config.PLAYER.BASE_DAMAGE * Config.WEAPONS.BOUNCING.damageMultiplier;
            this.createProjectile(owner.id, spawnX, spawnY, aimAngle, dmg, 'BOUNCING', Config.WEAPONS.BOUNCING.maxBounces);
        } else if (owner.activeWeapon === 'SHOTGUN') {
            const spread = 0.157;
            const angles = [aimAngle - spread * 2, aimAngle - spread, aimAngle, aimAngle + spread, aimAngle + spread * 2];
            const dmg = Config.PLAYER.BASE_DAMAGE * (Config.WEAPONS.SHOTGUN ? Config.WEAPONS.SHOTGUN.damageMultiplier : 0.85);
            angles.forEach(ang => {
                this.createProjectile(owner.id, spawnX, spawnY, ang, dmg, 'SHOTGUN', 0, Config.PLAYER.BULLET_SPEED * 1.15);
            });
        } else if (owner.activeWeapon === 'GHOSTFIRE') {
            const dmg = Config.PLAYER.BASE_DAMAGE * (Config.WEAPONS.GHOSTFIRE ? Config.WEAPONS.GHOSTFIRE.damageMultiplier : 0.48);
            const speed = Config.PLAYER.BULLET_SPEED * 1.35;
            this.createProjectile(owner.id, spawnX, spawnY, aimAngle, dmg, 'GHOSTFIRE', 0, speed);
        } else if (owner.activeWeapon === 'HOMING') {
            const dmg = Config.PLAYER.BASE_DAMAGE * (Config.WEAPONS.HOMING ? Config.WEAPONS.HOMING.damageMultiplier : 1.15);
            const speed = Config.PLAYER.BULLET_SPEED * 0.92;
            this.createProjectile(owner.id, spawnX, spawnY, aimAngle, dmg, 'HOMING', 0, speed);
        } else {
            // Use equipped gun archetype if available
            const gunCfg = (Config.GUNS && owner.gun && Config.GUNS[owner.gun]) ? Config.GUNS[owner.gun] : null;
            if (gunCfg) {
                const dmg = Config.PLAYER.BASE_DAMAGE * (gunCfg.damageMultiplier || 1.0);
                const spd = Config.PLAYER.BULLET_SPEED * (gunCfg.speedMultiplier || 1.0);

                if (gunCfg.type === 'TWIN') {
                    const perp = aimAngle + Math.PI / 2;
                    const offset = 12;
                    this.createProjectile(owner.id, spawnX + Math.cos(perp) * offset, spawnY + Math.sin(perp) * offset, aimAngle, dmg * 0.9, 'TWIN', 0, spd);
                    this.createProjectile(owner.id, spawnX - Math.cos(perp) * offset, spawnY - Math.sin(perp) * offset, aimAngle, dmg * 0.9, 'TWIN', 0, spd);
                } else if (gunCfg.type === 'SHOTGUN') {
                    const spread = 0.157;
                    const angles = [aimAngle - spread * 2, aimAngle - spread, aimAngle, aimAngle + spread, aimAngle + spread * 2];
                    angles.forEach(ang => {
                        this.createProjectile(owner.id, spawnX, spawnY, ang, dmg * 0.75, 'SHOTGUN', 0, spd);
                    });
                } else if (gunCfg.type === 'TRIPLE') {
                    const spread = 0.23;
                    [aimAngle - spread, aimAngle, aimAngle + spread].forEach(ang => {
                        this.createProjectile(owner.id, spawnX, spawnY, ang, dmg * 0.85, 'TRIPLE', 0, spd);
                    });
                } else if (gunCfg.type === 'CROSS') {
                    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(off => {
                        this.createProjectile(owner.id, spawnX, spawnY, aimAngle + off, dmg * 0.95, 'CROSS', 0, spd);
                    });
                } else if (gunCfg.type === 'BOUNCING' || gunCfg.type === 'DISC') {
                    this.createProjectile(owner.id, spawnX, spawnY, aimAngle, dmg, gunCfg.type, gunCfg.maxBounces || 2, spd);
                } else {
                    this.createProjectile(owner.id, spawnX, spawnY, aimAngle, dmg, gunCfg.type || 'NORMAL', 0, spd);
                }
            } else {
                this.createProjectile(owner.id, spawnX, spawnY, aimAngle, Config.PLAYER.BASE_DAMAGE, 'NORMAL', 0);
            }
        }

        this.broadcast("projectile_fired", {
            ownerId: owner.id,
            x: spawnX,
            y: spawnY,
            angle: aimAngle,
            mutation: owner.activeWeapon || (owner.gun || 'NORMAL')
        });
    }

    createProjectile(ownerId, x, y, angle, damage, mutationType, maxBounces, customSpeed) {
        const p = new ProjectileState();
        p.id = "proj_" + (this.nextProjectileId++);
        p.ownerId = ownerId;
        p.x = x;
        p.y = y;
        p.damage = damage;
        p.mutationType = mutationType;
        p.bouncesLeft = maxBounces;

        const speed = customSpeed || Config.PLAYER.BULLET_SPEED;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.birthTime = Date.now();

        this.state.projectiles.set(p.id, p);
    }

    initSeeds() {
        for (let i = 0; i < Config.SEEDS.NORMAL_COUNT; i++) {
            this.createSeed(false);
        }
        for (let i = 0; i < Config.SEEDS.SUPER_COUNT; i++) {
            this.createSeed(true);
        }
    }

    createSeed(isSuper) {
        const s = new SeedState();
        s.id = "seed_" + (this.nextSeedId++);
        s.isSuper = isSuper;
        s.active = true;
        s.x = 120 + Math.random() * (Config.WORLD.WIDTH - 240);
        s.y = 120 + Math.random() * (Config.WORLD.HEIGHT - 240);
        this.state.seeds.set(s.id, s);
    }

    initRunes() {
        const types = ['TRIPLE', 'RAPID', 'BOUNCING', 'SHOTGUN', 'GHOSTFIRE', 'HOMING'];
        for (let i = 0; i < 18; i++) {
            const r = new RuneState();
            r.id = "rune_" + (i + 1);
            r.weaponType = types[i % types.length];
            r.x = 140 + Math.random() * (Config.WORLD.WIDTH - 280);
            r.y = 140 + Math.random() * (Config.WORLD.HEIGHT - 280);
            r.active = true;
            this.state.runes.set(r.id, r);
        }
    }

    initExplosives() {
        for (let i = 0; i < Config.EXPLOSIVE_SEEDS.COUNT; i++) {
            const e = new ExplosiveSeedState();
            e.id = "exp_" + (i + 1);
            e.x = 180 + Math.random() * (Config.WORLD.WIDTH - 360);
            e.y = 180 + Math.random() * (Config.WORLD.HEIGHT - 360);
            e.isTriggered = false;
            e.active = true;
            e.fuseTimer = 0;
            this.state.explosives.set(e.id, e);
        }
    }

    initStorm() {
        this.state.storm.centerX = Config.WORLD.WIDTH / 2;
        this.state.storm.centerY = Config.WORLD.HEIGHT / 2;
        this.state.storm.currentRadius = 1500;
        this.state.storm.targetRadius = 1500;
        this.state.storm.state = "DELAY";
        this.state.storm.timeLeft = Config.STORM.INITIAL_DELAY;
        this.stormPhaseIndex = 0;
    }

    balanceBots() {
        // Count human players
        let humanCount = 0;
        this.state.players.forEach(p => {
            if (!p.isBot) humanCount++;
        });

        const targetBots = Math.max(0, Config.BOTS.TARGET_MATCH_PLAYERS - humanCount);

        // Remove excess server bots if real human players joined
        while (this.bots.length > targetBots) {
            const removedBot = this.bots.pop();
            if (removedBot) {
                this.state.players.delete(removedBot.id);
            }
        }

        // Add server bots if needed
        while (this.bots.length < targetBots) {
            const botIdx = this.bots.length;
            const botId = "bot_" + Math.random().toString(36).substring(2, 7);
            const bot = new PlayerState();
            bot.id = botId;
            bot.sessionId = botId;
            bot.name = Config.BOTS.NAMES[botIdx % Config.BOTS.NAMES.length];
            bot.skin = Config.BOTS.SKINS[botIdx % Config.BOTS.SKINS.length];
            bot.isBot = true;

            const angle = Math.random() * Math.PI * 2;
            const dist = 550 + Math.random() * 2100;
            bot.x = Math.max(180, Math.min(Config.WORLD.WIDTH - 180, Config.WORLD.WIDTH / 2 + Math.cos(angle) * dist));
            bot.y = Math.max(180, Math.min(Config.WORLD.HEIGHT - 180, Config.WORLD.HEIGHT / 2 + Math.sin(angle) * dist));
            bot.health = Config.PLAYER.BASE_HEALTH;
            bot.maxHealth = Config.PLAYER.BASE_HEALTH;
            bot.lastFireTime = 0;
            bot.invulnUntil = Date.now() + 2500;
            bot.wanderTarget = { x: bot.x, y: bot.y };
            bot.nextDecisionTime = 0;

            this.bots.push(bot);
            this.state.players.set(botId, bot);
        }
    }

    update(deltaTime) {
        if (!this.state.matchActive) return;

        const dtSec = deltaTime / 1000;
        this.state.matchTime += dtSec;
        const now = Date.now();

        // 1. Authoritative Player & Bot Simulation
        this.state.players.forEach(player => {
            if (player.isDead) return;

            // Move player position based on velocity
            player.x = Math.max(40, Math.min(Config.WORLD.WIDTH - 40, player.x + player.vx * dtSec));
            player.y = Math.max(40, Math.min(Config.WORLD.HEIGHT - 40, player.y + player.vy * dtSec));

            // Weapon countdown
            if (player.activeWeapon !== 'NORMAL') {
                player.weaponTimeRemaining = Math.max(0, player.weaponTimeRemaining - deltaTime);
                if (player.weaponTimeRemaining <= 0) {
                    player.activeWeapon = 'NORMAL';
                }
            }

            // Server-side Bot AI update
            if (player.isBot) {
                this.updateBotAI(player, now, dtSec);
            }

            // Seed collection check
            this.checkSeedPickup(player);
            this.checkRunePickup(player);
            this.checkExplosiveOverlap(player);
        });

        // 2. Authoritative Projectile Simulation
        this.updateProjectiles(now, dtSec);

        // 3. Explosive Seeds Fuse Countdown & Blast
        this.updateExplosives(now);

        // 4. Storm Simulation & Damage
        this.updateStorm(now, dtSec);

        // 5. Match State & Victory Check
        this.checkMatchConditions();
    }

    updateProjectiles(now, dtSec) {
        const toRemove = [];

        this.state.projectiles.forEach((proj, key) => {
            proj.x += proj.vx * dtSec;
            proj.y += proj.vy * dtSec;

            // Check lifetime
            if (!proj.birthTime || (now - proj.birthTime > Config.PLAYER.BULLET_LIFETIME)) {
                toRemove.push(key);
                return;
            }

            // Arena boundary bounce
            if (proj.x < 20 || proj.x > Config.WORLD.WIDTH - 20) {
                if (proj.mutationType === 'BOUNCING' && proj.bouncesLeft > 0) {
                    proj.vx *= -1;
                    proj.bouncesLeft--;
                } else {
                    toRemove.push(key);
                    return;
                }
            }
            if (proj.y < 20 || proj.y > Config.WORLD.HEIGHT - 20) {
                if (proj.mutationType === 'BOUNCING' && proj.bouncesLeft > 0) {
                    proj.vy *= -1;
                    proj.bouncesLeft--;
                } else {
                    toRemove.push(key);
                    return;
                }
            }

            // Collision check against all active combatants
            this.state.players.forEach(target => {
                if (target.isDead || target.id === proj.ownerId) return;

                const dist = Math.hypot(target.x - proj.x, target.y - proj.y);
                const targetRadius = Config.WORLD.PLAYER_RADIUS * (1.0 + (target.level - 1) * 0.055);

                if (dist <= targetRadius + 8) {
                    // Hit confirmed!
                    this.applyDamage(target, proj.damage, proj.ownerId);
                    toRemove.push(key);
                }
            });
        });

        toRemove.forEach(k => this.state.projectiles.delete(k));
    }

    applyDamage(target, amount, attackerId) {
        if (target.isDead) return;
        const now = Date.now();
        if (now < (target.invulnUntil || 0)) return; // Invulnerability window

        target.health = Math.max(0, target.health - amount);
        target.invulnUntil = now + Config.PLAYER.INVULN_TIME;

        // Broadcast hit event for client juice
        this.broadcast("entity_damaged", {
            entityId: target.id,
            amount: amount,
            health: target.health,
            maxHealth: target.maxHealth
        });

        if (target.health <= 0) {
            this.eliminateEntity(target, attackerId);
        }
    }

    eliminateEntity(target, attackerId) {
        target.isDead = true;
        target.health = 0;

        const attacker = this.state.players.get(attackerId);
        const killerName = attacker ? attacker.name : "The Pumpkin Storm";

        if (attacker && attacker !== target) {
            attacker.kills++;
            attacker.score += 100 + target.xp;
        }

        // Broadcast elimination announcement
        this.broadcast("entity_eliminated", {
            victimId: target.id,
            victimName: target.name,
            killerId: attackerId,
            killerName: killerName
        });

        // Drop loot seeds around victim position
        this.dropDeathLoot(target.x, target.y);
    }

    dropDeathLoot(x, y) {
        for (let i = 0; i < 5; i++) {
            const s = new SeedState();
            s.id = "seed_loot_" + (this.nextSeedId++);
            s.isSuper = (i === 0);
            s.active = true;
            const ang = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 60;
            s.x = Math.max(40, Math.min(Config.WORLD.WIDTH - 40, x + Math.cos(ang) * dist));
            s.y = Math.max(40, Math.min(Config.WORLD.HEIGHT - 40, y + Math.sin(ang) * dist));
            this.state.seeds.set(s.id, s);
        }
    }

    checkSeedPickup(player) {
        this.state.seeds.forEach((seed, key) => {
            if (!seed.active) return;
            const dist = Math.hypot(player.x - seed.x, player.y - seed.y);
            if (dist < 38) {
                seed.active = false;
                const xpGain = seed.isSuper ? Config.SEEDS.SUPER_XP : Config.SEEDS.NORMAL_XP;
                const healGain = seed.isSuper ? Config.SEEDS.SUPER_HEAL : Config.SEEDS.NORMAL_HEAL;

                this.awardXP(player, xpGain);
                player.health = Math.min(player.maxHealth, player.health + healGain);

                // Schedule seed respawn
                setTimeout(() => {
                    seed.x = 120 + Math.random() * (Config.WORLD.WIDTH - 240);
                    seed.y = 120 + Math.random() * (Config.WORLD.HEIGHT - 240);
                    seed.active = true;
                }, Config.SEEDS.RESPAWN_DELAY);
            }
        });
    }

    checkRunePickup(player) {
        this.state.runes.forEach((rune, key) => {
            if (!rune.active) return;
            const dist = Math.hypot(player.x - rune.x, player.y - rune.y);
            if (dist < 36) {
                rune.active = false;
                player.activeWeapon = rune.weaponType;
                player.weaponTimeRemaining = Config.WEAPONS[rune.weaponType].duration;

                this.broadcast("weapon_equipped", {
                    entityId: player.id,
                    weaponType: rune.weaponType
                });

                // Respawn rune after 18 seconds
                setTimeout(() => {
                    rune.x = 140 + Math.random() * (Config.WORLD.WIDTH - 280);
                    rune.y = 140 + Math.random() * (Config.WORLD.HEIGHT - 280);
                    rune.active = true;
                }, 18000);
            }
        });
    }

    checkExplosiveOverlap(player) {
        this.state.explosives.forEach(exp => {
            if (!exp.active || exp.isTriggered) return;
            const dist = Math.hypot(player.x - exp.x, player.y - exp.y);
            if (dist < 36) {
                this.triggerExplosive(exp);
            }
        });
    }

    triggerExplosive(exp) {
        if (!exp.active || exp.isTriggered) return;
        exp.isTriggered = true;
        exp.detonateTime = Date.now() + Config.EXPLOSIVE_SEEDS.FUSE_MS;

        this.broadcast("explosive_triggered", {
            id: exp.id,
            x: exp.x,
            y: exp.y,
            fuseMs: Config.EXPLOSIVE_SEEDS.FUSE_MS
        });
    }

    updateExplosives(now) {
        this.state.explosives.forEach(exp => {
            if (!exp.active || !exp.isTriggered) return;

            if (now >= (exp.detonateTime || 0)) {
                // Detonate explosive!
                exp.active = false;
                exp.isTriggered = false;

                const blastRadius = Config.EXPLOSIVE_SEEDS.BLAST_RADIUS;
                const blastDamage = Config.EXPLOSIVE_SEEDS.BLAST_DAMAGE;

                this.broadcast("explosive_detonated", {
                    id: exp.id,
                    x: exp.x,
                    y: exp.y,
                    radius: blastRadius
                });

                // Deal area of effect damage
                this.state.players.forEach(p => {
                    if (p.isDead) return;
                    const d = Math.hypot(p.x - exp.x, p.y - exp.y);
                    if (d <= blastRadius) {
                        const factor = 1 - (d / blastRadius) * 0.45;
                        const dmg = Math.round(blastDamage * factor);
                        this.applyDamage(p, dmg, "Volatile Pumpkin Bomb");
                    }
                });

                // Respawn after delay
                setTimeout(() => {
                    exp.x = 180 + Math.random() * (Config.WORLD.WIDTH - 360);
                    exp.y = 180 + Math.random() * (Config.WORLD.HEIGHT - 360);
                    exp.active = true;
                    exp.isTriggered = false;
                }, Config.EXPLOSIVE_SEEDS.RESPAWN_DELAY);
            }
        });
    }

    awardXP(player, amount) {
        player.xp += amount;
        player.score = player.kills * 100 + player.xp;

        while (player.level < Config.GROWTH.MAX_LEVEL && player.xp >= (Config.GROWTH.XP_THRESHOLDS[player.level] || Infinity)) {
            player.level++;
            player.maxHealth += Config.GROWTH.HP_PER_LEVEL;
            player.health += Config.GROWTH.HP_PER_LEVEL;

            this.broadcast("level_up", {
                entityId: player.id,
                level: player.level
            });
        }
    }

    updateStorm(now, dtSec) {
        const storm = this.state.storm;
        storm.timeLeft = Math.max(0, storm.timeLeft - dtSec);

        if (storm.timeLeft <= 0) {
            if (storm.state === 'DELAY') {
                storm.state = 'WARNING';
                storm.timeLeft = Config.STORM.WARNING_TIME;
            } else if (storm.state === 'WARNING') {
                storm.state = 'SHRINKING';
                storm.timeLeft = Config.STORM.SHRINK_TIME;
                const phase = Config.STORM.PHASES[this.stormPhaseIndex] || { safeRadius: 100 };
                storm.targetRadius = phase.safeRadius;
            } else if (storm.state === 'SHRINKING') {
                storm.state = 'DELAY';
                storm.timeLeft = Config.STORM.INITIAL_DELAY;
                this.stormPhaseIndex = Math.min(Config.STORM.PHASES.length - 1, this.stormPhaseIndex + 1);
            }
        }

        // Smooth radius transition
        if (storm.state === 'SHRINKING') {
            const shrinkStep = (1500 / Config.STORM.SHRINK_TIME) * dtSec;
            storm.currentRadius = Math.max(storm.targetRadius, storm.currentRadius - shrinkStep);
        }

        // Apply storm damage every 1 second
        if (now - this.lastStormDamageTime >= Config.STORM.DAMAGE_INTERVAL) {
            this.lastStormDamageTime = now;
            this.state.players.forEach(p => {
                if (p.isDead) return;
                const d = Math.hypot(p.x - storm.centerX, p.y - storm.centerY);
                if (d > storm.currentRadius) {
                    const dmg = Math.round(p.maxHealth * Config.STORM.DAMAGE_PERCENT);
                    this.applyDamage(p, dmg, "The Pumpkin Storm");
                }
            });
        }
    }

    updateBotAI(bot, now, dtSec) {
        if (now > (bot.nextDecisionTime || 0)) {
            bot.nextDecisionTime = now + 120 + Math.random() * 60;

            // Find nearest human player or other pumpkin
            let nearestEnemy = null;
            let minDist = 460;

            this.state.players.forEach(other => {
                if (other === bot || other.isDead) return;
                const d = Math.hypot(bot.x - other.x, bot.y - other.y);
                if (d < minDist) {
                    minDist = d;
                    nearestEnemy = other;
                }
            });

            if (nearestEnemy) {
                // Aim at enemy
                const angle = Math.atan2(nearestEnemy.y - bot.y, nearestEnemy.x - bot.x);
                bot.aimAngle = angle + (Math.random() - 0.5) * 0.2;

                // Move toward or strafe
                const speed = 190;
                bot.vx = Math.cos(angle) * speed;
                bot.vy = Math.sin(angle) * speed;

                // Shoot if cooldown ready
                let cooldown = Config.PLAYER.FIRE_COOLDOWN * 1.5;
                if (now > (bot.lastFireTime || 0) + cooldown) {
                    bot.lastFireTime = now;
                    this.spawnAuthoritativeProjectiles(bot, bot.aimAngle);
                }
            } else {
                // Wander
                if (Math.hypot(bot.x - bot.wanderTarget.x, bot.y - bot.wanderTarget.y) < 50) {
                    bot.wanderTarget = {
                        x: 200 + Math.random() * (Config.WORLD.WIDTH - 400),
                        y: 200 + Math.random() * (Config.WORLD.HEIGHT - 400)
                    };
                }
                const angle = Math.atan2(bot.wanderTarget.y - bot.y, bot.wanderTarget.x - bot.x);
                bot.aimAngle = angle;
                bot.vx = Math.cos(angle) * 140;
                bot.vy = Math.sin(angle) * 140;
            }
        }
    }

    checkMatchConditions() {
        let aliveCount = 0;
        let lastAlive = null;

        this.state.players.forEach(p => {
            if (!p.isDead) {
                aliveCount++;
                lastAlive = p;
            }
        });

        if (aliveCount <= 1 && this.state.players.size > 1 && !this.state.matchOver) {
            this.state.matchOver = true;
            this.state.winnerName = lastAlive ? lastAlive.name : "None";

            this.broadcast("match_ended", {
                winnerName: this.state.winnerName,
                winnerId: lastAlive ? lastAlive.id : null
            });

            // Automatically restart match for the next round after 5 seconds
            this.clock.setTimeout(() => {
                this.resetMatch();
            }, 5000);
        }
    }

    resetMatch() {
        this.state.matchActive = true;
        this.state.matchOver = false;
        this.state.winnerName = "";
        this.state.matchTime = 0;

        // Reset storm to initial wide perimeter
        this.initStorm();

        // Clear and regenerate world items
        this.state.seeds.clear();
        this.initSeeds();
        this.state.runes.clear();
        this.initRunes();
        this.state.explosives.clear();
        this.initExplosives();
        this.state.projectiles.clear();

        // Respawn all players near safe arena center
        const spawnCenter = Config.WORLD.WIDTH / 2;
        this.state.players.forEach(p => {
            p.health = Config.PLAYER.BASE_HEALTH;
            p.maxHealth = Config.PLAYER.BASE_HEALTH;
            p.isDead = false;
            p.level = 1;
            p.xp = 0;
            p.kills = 0;
            p.score = 0;
            p.activeWeapon = "NORMAL";
            p.weaponTimeRemaining = 0;
            p.x = spawnCenter + (Math.random() - 0.5) * 300;
            p.y = spawnCenter + (Math.random() - 0.5) * 300;
            p.vx = 0;
            p.vy = 0;
            p.invulnUntil = Date.now() + 1500; // Brief spawn shield
        });

        // Refresh server-side bots without leaving dead bots in state
        const toDelete = [];
        this.state.players.forEach((p, id) => {
            if (p.isBot) toDelete.push(id);
        });
        toDelete.forEach(id => this.state.players.delete(id));
        this.bots = [];
        this.balanceBots();
    }
}

module.exports = { PumpkinArenaRoom };
