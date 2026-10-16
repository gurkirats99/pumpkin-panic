/**
 * PUMPKIN PANIC.IO - Bot Entity
 * Autonomous computer-controlled enemy pumpkins with readable state-machine AI.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};
    const Config = window.PumpkinPanic.Config;

    class Bot extends window.PumpkinPanic.Entity {
        constructor(scene, x, y, options = {}) {
            super(scene, x, y, {
                id: options.id || ('bot_' + Math.random().toString(36).substr(2, 7)),
                name: options.name || 'SpookyBot [BOT]',
                skin: options.skin || 'classic',
                isBot: true
            });

            // Bot AI States
            this.AI_STATES = {
                WANDER: 'WANDER',
                COLLECT_SEEDS: 'COLLECT_SEEDS',
                CHASE_ATTACK: 'CHASE_ATTACK',
                FLEE: 'FLEE'
            };
            this.currentState = this.AI_STATES.WANDER;

            // Decision timers
            this.nextDecisionTime = 0;
            this.wanderTarget = { x: x, y: y };
            this.currentTarget = null;
            this.targetSeed = null;

            // Aim dispersion for realistic combat
            this.aimError = (Math.random() - 0.5) * 0.25;

            // Reticle pointer tint for bot
            this.aimPointer.fillColor = 0xd448ff;

            // Weapon System for Bot - assign a random gun from Config.GUNS for vibrant battlefield diversity
            const gunKeys = Object.keys(Config.GUNS || {});
            const randomGunKey = options.gun || (gunKeys.length > 0 ? gunKeys[Math.floor(Math.random() * gunKeys.length)] : 'SEED_PISTOL');
            this.baseGunId = randomGunKey;
            this.baseGun = (Config.GUNS && Config.GUNS[randomGunKey]) ? Config.GUNS[randomGunKey] : { id: 'SEED_PISTOL', type: 'SINGLE', damageMultiplier: 1.0, cooldownMultiplier: 1.0 };

            // Weapon Mutation System for Bot
            this.activeWeapon = 'NORMAL';
            this.weaponTimer = 0;
            this.speedMultiplier = 1.0;
        }

        update(time, delta) {
            super.update(time, delta);
            if (this.isDead) return;

            // Update Progressive Difficulty Scaling based on match duration
            this.updateDifficultyScaling(time);

            // Weapon mutation countdown
            if (this.activeWeapon !== 'NORMAL') {
                this.weaponTimer -= delta;
                if (this.weaponTimer <= 0) {
                    this.activeWeapon = 'NORMAL';
                }
            }

            // AI Decision Loop (runs every 120ms to save CPU and maintain readable behavior)
            if (time > this.nextDecisionTime) {
                this.updateAIDecision(time);
                this.nextDecisionTime = time + 110 + Math.random() * 40;
            }

            // Execute current movement & combat action
            this.executeAction(time, delta);
        }

        updateDifficultyScaling(time) {
            const matchSeconds = Math.max(0, (time - this.scene.matchStartTime) / 1000);
            const scaling = Config.BOT_SCALING;

            if (matchSeconds >= scaling.PHASE_LATE_TIME) {
                // Late Game: Aggressive Gladiators!
                this.speedMultiplier = scaling.SPEED_LATE;
                this.fireCooldown = Config.PLAYER.FIRE_COOLDOWN * scaling.COOLDOWN_LATE;
                this.aimError = (Math.random() - 0.5) * (1 - scaling.ACCURACY_LATE) * 0.8;
            } else if (matchSeconds >= scaling.PHASE_MID_TIME) {
                // Mid Game: Sharpened Hunter mode
                this.speedMultiplier = scaling.SPEED_MID;
                this.fireCooldown = Config.PLAYER.FIRE_COOLDOWN;
                this.aimError = (Math.random() - 0.5) * (1 - scaling.ACCURACY_MID) * 1.0;
            } else {
                // Early Game: Normal Harvester mode
                this.speedMultiplier = 1.0;
                this.fireCooldown = Config.PLAYER.FIRE_COOLDOWN;
                this.aimError = (Math.random() - 0.5) * 0.25;
            }
        }

        equipWeapon(weaponId) {
            const weaponConfig = Config.WEAPONS[weaponId];
            if (!weaponConfig) return;

            this.activeWeapon = weaponId;
            this.weaponTimer = weaponConfig.duration;
            if (this.aimPointer) {
                this.aimPointer.fillColor = weaponConfig.color;
            }
        }

        updateAIDecision(time) {
            // 1. Storm Priority Check: If outside or close to storm edge, flee to center
            if (this.scene.stormSystem && this.scene.stormSystem.isNearDanger(this.x, this.y, 80)) {
                this.currentState = this.AI_STATES.FLEE;
                const center = this.scene.stormSystem.center;
                this.wanderTarget = { x: center.x, y: center.y };
                return;
            }

            // 2. Low HP Check: Retreat if badly wounded
            const hpRatio = this.health / this.maxHealth;
            if (hpRatio < Config.BOTS.RETREAT_HP_RATIO) {
                const threat = this.findNearestCombatant();
                if (threat) {
                    this.currentState = this.AI_STATES.FLEE;
                    // Move away from threat
                    const angleAway = Phaser.Math.Angle.Between(threat.x, threat.y, this.x, this.y);
                    this.wanderTarget = {
                        x: Phaser.Math.Clamp(this.x + Math.cos(angleAway) * 350, 100, Config.WORLD.WIDTH - 100),
                        y: Phaser.Math.Clamp(this.y + Math.sin(angleAway) * 350, 100, Config.WORLD.HEIGHT - 100)
                    };
                    return;
                }
            }

            // 3. Combat Check: Look for enemies within vision
            const enemy = this.findNearestCombatant();
            if (enemy) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
                const visionRadius = Config.BOTS.VISION_RADIUS * (this.speedMultiplier > 1.1 ? 1.2 : 1.0);
                if (dist <= visionRadius) {
                    this.currentState = this.AI_STATES.CHASE_ATTACK;
                    this.currentTarget = enemy;
                    return;
                }
            }
            this.currentTarget = null;

            // 4. Seed Gathering Check
            const seed = this.findNearestSeed();
            if (seed) {
                this.currentState = this.AI_STATES.COLLECT_SEEDS;
                this.targetSeed = seed;
                return;
            }

            // 5. Default Wander
            this.currentState = this.AI_STATES.WANDER;
            if (Phaser.Math.Distance.Between(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y) < 60) {
                this.pickNewWanderPoint();
            }
        }

        findNearestCombatant() {
            let closest = null;
            let minDist = Infinity;

            // Evaluate human player
            const player = this.scene.player;
            if (player && !player.isDead) {
                const d = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
                if (d < minDist) {
                    minDist = d;
                    closest = player;
                }
            }

            // Evaluate other bots
            if (this.scene.bots) {
                for (let i = 0; i < this.scene.bots.length; i++) {
                    const other = this.scene.bots[i];
                    if (other !== this && !other.isDead) {
                        const d = Phaser.Math.Distance.Between(this.x, this.y, other.x, other.y);
                        if (d < minDist) {
                            minDist = d;
                            closest = other;
                        }
                    }
                }
            }

            return closest;
        }

        findNearestSeed() {
            if (!this.scene.seedManager) return null;
            return this.scene.seedManager.getNearestSeed(this.x, this.y, 450);
        }

        pickNewWanderPoint() {
            // Stay inside safe zone if active
            let center = { x: Config.WORLD.WIDTH / 2, y: Config.WORLD.HEIGHT / 2 };
            let maxRadius = 900;

            if (this.scene.stormSystem) {
                center = this.scene.stormSystem.center;
                maxRadius = Math.max(100, this.scene.stormSystem.currentRadius - 100);
            }

            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * maxRadius;

            this.wanderTarget = {
                x: Phaser.Math.Clamp(center.x + Math.cos(angle) * dist, 80, Config.WORLD.WIDTH - 80),
                y: Phaser.Math.Clamp(center.y + Math.sin(angle) * dist, 80, Config.WORLD.HEIGHT - 80)
            };
        }

        executeAction(time, delta) {
            let targetX = this.wanderTarget.x;
            let targetY = this.wanderTarget.y;

            if (this.currentState === this.AI_STATES.CHASE_ATTACK && this.currentTarget && !this.currentTarget.isDead) {
                const dist = Phaser.Math.Distance.Between(this.x, this.y, this.currentTarget.x, this.currentTarget.y);
                
                // Aim directly at target with slight prediction & dispersion
                const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, this.currentTarget.x, this.currentTarget.y);
                this.aimAngle = baseAngle + this.aimError;

                // Fire seed if cooldown ready and within range
                if (dist <= Config.BOTS.ATTACK_RANGE && time > this.lastFireTime + this.fireCooldown) {
                    this.fire(this.currentTarget.x, this.currentTarget.y, time);
                }

                // Tactical positioning: approach if far, circle/maintain gap if close
                if (dist > 220) {
                    targetX = this.currentTarget.x;
                    targetY = this.currentTarget.y;
                } else {
                    // Strafe tangentially
                    const strafeAngle = baseAngle + Math.PI / 2;
                    targetX = this.x + Math.cos(strafeAngle) * 100;
                    targetY = this.y + Math.sin(strafeAngle) * 100;
                }
            } else if (this.currentState === this.AI_STATES.COLLECT_SEEDS && this.targetSeed && this.targetSeed.active) {
                targetX = this.targetSeed.x;
                targetY = this.targetSeed.y;
                // Aim in movement direction
                this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
            } else {
                // Moving toward wander / safe point
                this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
            }

            // Move toward target position with scaled speed
            const angleToTarget = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
            const distToTarget = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
            const activeSpeed = this.speed * (this.speedMultiplier || 1.0);

            if (distToTarget > 15) {
                const vx = Math.cos(angleToTarget) * activeSpeed;
                const vy = Math.sin(angleToTarget) * activeSpeed;
                this.body.setVelocity(vx, vy);
            } else {
                this.body.setVelocity(0, 0);
            }
        }

        fire(targetX, targetY, time) {
            this.lastFireTime = time;

            const spawnDist = (Config.PLAYER.BASE_RADIUS + 12) * this.scaleX;
            const spawnX = this.x + Math.cos(this.aimAngle) * spawnDist;
            const spawnY = this.y + Math.sin(this.aimAngle) * spawnDist;

            if (this.activeWeapon === 'TRIPLE') {
                const spreadRad = Phaser.Math.DegToRad(13);
                const angles = [this.aimAngle - spreadRad, this.aimAngle, this.aimAngle + spreadRad];
                const dmg = this.damage * Config.WEAPONS.TRIPLE.damageMultiplier;
                for (let i = 0; i < angles.length; i++) {
                    this.scene.bulletPool.spawnBullet(
                        spawnX,
                        spawnY,
                        angles[i],
                        dmg,
                        this,
                        this.scaleX,
                        'TRIPLE',
                        0
                    );
                }
            } else if (this.activeWeapon === 'RAPID') {
                const dmg = this.damage * Config.WEAPONS.RAPID.damageMultiplier;
                this.scene.bulletPool.spawnBullet(
                    spawnX,
                    spawnY,
                    this.aimAngle,
                    dmg,
                    this,
                    this.scaleX,
                    'RAPID',
                    0
                );
            } else if (this.activeWeapon === 'BOUNCING') {
                const dmg = this.damage * Config.WEAPONS.BOUNCING.damageMultiplier;
                this.scene.bulletPool.spawnBullet(
                    spawnX,
                    spawnY,
                    this.aimAngle,
                    dmg,
                    this,
                    this.scaleX,
                    'BOUNCING',
                    Config.WEAPONS.BOUNCING.maxBounces
                );
            } else if (this.activeWeapon === 'SHOTGUN') {
                const spreadRad = Phaser.Math.DegToRad(9);
                const angles = [
                    this.aimAngle - spreadRad * 2,
                    this.aimAngle - spreadRad,
                    this.aimAngle,
                    this.aimAngle + spreadRad,
                    this.aimAngle + spreadRad * 2
                ];
                const dmg = this.damage * (Config.WEAPONS.SHOTGUN ? Config.WEAPONS.SHOTGUN.damageMultiplier : 0.85);
                for (let i = 0; i < angles.length; i++) {
                    this.scene.bulletPool.spawnBullet(
                        spawnX,
                        spawnY,
                        angles[i],
                        dmg,
                        this,
                        this.scaleX,
                        'SHOTGUN',
                        0
                    );
                }
            } else if (this.activeWeapon === 'GHOSTFIRE') {
                const dmg = this.damage * (Config.WEAPONS.GHOSTFIRE ? Config.WEAPONS.GHOSTFIRE.damageMultiplier : 0.48);
                this.scene.bulletPool.spawnBullet(
                    spawnX,
                    spawnY,
                    this.aimAngle,
                    dmg,
                    this,
                    this.scaleX,
                    'GHOSTFIRE',
                    0
                );
            } else if (this.activeWeapon === 'HOMING') {
                const dmg = this.damage * (Config.WEAPONS.HOMING ? Config.WEAPONS.HOMING.damageMultiplier : 1.15);
                this.scene.bulletPool.spawnBullet(
                    spawnX,
                    spawnY,
                    this.aimAngle,
                    dmg,
                    this,
                    this.scaleX,
                    'HOMING',
                    0
                );
            } else {
                // Fire Bot's assigned weapon archetype
                const gun = this.baseGun || (Config.GUNS && Config.GUNS.SEED_PISTOL) || { type: 'SINGLE', damageMultiplier: 1.0 };
                const dmg = this.damage * (gun.damageMultiplier || 1.0);
                const gType = gun.type || 'SINGLE';

                if (gType === 'TWIN') {
                    const perp = this.aimAngle + Math.PI / 2;
                    const offset = 10 * this.scaleX;
                    this.scene.bulletPool.spawnBullet(spawnX + Math.cos(perp) * offset, spawnY + Math.sin(perp) * offset, this.aimAngle, dmg * 0.9, this, this.scaleX, 'TWIN', 0);
                    this.scene.bulletPool.spawnBullet(spawnX - Math.cos(perp) * offset, spawnY - Math.sin(perp) * offset, this.aimAngle, dmg * 0.9, this, this.scaleX, 'TWIN', 0);
                } else if (gType === 'SHOTGUN') {
                    const spreadRad = Phaser.Math.DegToRad(9);
                    [-spreadRad * 2, -spreadRad, 0, spreadRad, spreadRad * 2].forEach(angOff => {
                        this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle + angOff, dmg * 0.72, this, this.scaleX, 'SHOTGUN', 0);
                    });
                } else if (gType === 'TRIPLE') {
                    const spreadRad = Phaser.Math.DegToRad(13);
                    [-spreadRad, 0, spreadRad].forEach(angOff => {
                        this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle + angOff, dmg * 0.85, this, this.scaleX, 'TRIPLE', 0);
                    });
                } else if (gType === 'CROSS') {
                    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(angOff => {
                        this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle + angOff, dmg * 0.95, this, this.scaleX, 'CROSS', 0);
                    });
                } else if (gType === 'BOUNCING' || gType === 'DISC') {
                    this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle, dmg, this, this.scaleX, gType, gun.maxBounces || 2);
                } else if (gType === 'HOMING') {
                    this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle, dmg, this, this.scaleX, 'HOMING', 0);
                } else {
                    this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle, dmg, this, this.scaleX, gType, 0);
                }
            }

            // Muzzle effect
            this.scene.emitterManager.emitMuzzle(spawnX, spawnY, this.aimAngle);
        }
    }

    window.PumpkinPanic.Bot = Bot;
})();
