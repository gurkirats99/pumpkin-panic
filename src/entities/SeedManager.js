/**
 * PUMPKIN PANIC.IO - Seed Manager & Pickup System
 * Manages glowing seed spawns, loot bursts on enemy defeat, and collection mechanics.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};
    const Config = window.PumpkinPanic.Config;

    class Seed extends Phaser.Physics.Arcade.Sprite {
        constructor(scene, x, y, isSuper = false) {
            super(scene, x, y, isSuper ? 'seed_super' : 'seed_normal');
            this.scene = scene;
            this.isSuper = isSuper;
            this.xpValue = isSuper ? Config.SEEDS.SUPER_XP : Config.SEEDS.NORMAL_XP;
            this.healValue = isSuper ? Config.SEEDS.SUPER_HEAL : Config.SEEDS.NORMAL_HEAL;
            this.isDrop = false;

            // Register with scene display list & physics engine
            scene.add.existing(this);
            scene.physics.add.existing(this);
            this.setDepth(9);
        }

        spawn(x, y, isSuper = false, isDrop = false) {
            if (!this.scene || !this.scene.sys || !this.scene.physics || !this.scene.physics.world) return;
            this.isSuper = isSuper;
            this.isDrop = isDrop;
            this.xpValue = isSuper ? Config.SEEDS.SUPER_XP : Config.SEEDS.NORMAL_XP;
            this.healValue = isSuper ? Config.SEEDS.SUPER_HEAL : Config.SEEDS.NORMAL_HEAL;
            this.setTexture(isSuper ? 'seed_super' : 'seed_normal');

            this.enableBody(true, x, y, true, true);
            this.setAlpha(1);
            this.setScale(1);

            // Subtle floating bob tween
            if (this.bobTween) this.bobTween.stop();
            if (this.scene && this.scene.tweens) {
                this.bobTween = this.scene.tweens.add({
                    targets: this,
                    y: y - 5,
                    duration: 900 + Math.random() * 400,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            const r = isSuper ? 16 : 10;
            if (this.body) {
                this.body.setCircle(r, -r + (isSuper ? 22 : 16), -r + (isSuper ? 22 : 16));
            }
        }

        collect(collector) {
            if (!this.active) return;
            this.disableBody(true, true);
            if (this.bobTween) {
                this.bobTween.stop();
            }

            // Award XP, healing, and coins
            if (typeof collector.addXP === 'function') {
                collector.addXP(this.xpValue);
            }
            if (typeof collector.heal === 'function' && collector.health < collector.maxHealth) {
                collector.heal(this.healValue);
            }
            if (typeof collector.addCoins === 'function') {
                const coinAmount = this.isSuper ? Config.ECONOMY.COIN_PER_SUPER_SEED : Config.ECONOMY.COIN_PER_NORMAL_SEED;
                collector.addCoins(coinAmount);
            }

            // Pickup spark effect
            if (this.scene.emitterManager) {
                this.scene.emitterManager.emitSeedCollect(this.x, this.y, this.isSuper);
            }

            // Sound
            if (window.PumpkinPanic.AudioSystem) {
                const player = this.scene.player;
                if (collector === player) {
                    window.PumpkinPanic.AudioSystem.playSeedCollect(this.isSuper);
                }
            }

            // Multiplayer server notification
            if (this.scene.isMultiplayer && collector === this.scene.player && this.seedId && this.scene.networkAdapter) {
                this.scene.networkAdapter.sendCollectSeed(this.seedId);
            }

            // If it's a fixed arena seed, schedule respawn (local mode only)
            if (!this.scene.isMultiplayer && !this.isDrop && this.scene.seedManager) {
                this.scene.seedManager.scheduleRespawn(this);
            }
        }
    }

    class WeaponRune extends Phaser.Physics.Arcade.Sprite {
        constructor(scene, x, y, weaponType = 'TRIPLE') {
            super(scene, x, y, 'pickup_' + weaponType.toLowerCase());
            this.scene = scene;
            this.weaponType = weaponType;

            scene.add.existing(this);
            scene.physics.add.existing(this);
            this.setDepth(9);
        }

        spawn(x, y, weaponType) {
            if (!this.scene || !this.scene.sys || !this.scene.physics || !this.scene.physics.world) return;
            this.weaponType = weaponType;
            this.setTexture('pickup_' + weaponType.toLowerCase());
            this.enableBody(true, x, y, true, true);
            this.setAlpha(1);
            this.setScale(1);

            // Floating bob animation
            if (this.bobTween) this.bobTween.stop();
            if (this.scene && this.scene.tweens) {
                this.bobTween = this.scene.tweens.add({
                    targets: this,
                    y: y - 7,
                    scaleX: 1.08,
                    scaleY: 1.08,
                    duration: 900,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            if (this.body) {
                this.body.setCircle(18, 6, 6);
            }
        }

        collect(collector) {
            if (!this.active) return;
            this.disableBody(true, true);
            if (this.bobTween) this.bobTween.stop();

            // Equip mutation on collector
            if (typeof collector.equipWeapon === 'function') {
                collector.equipWeapon(this.weaponType);
            }

            // Pickup particles
            if (this.scene.emitterManager) {
                this.scene.emitterManager.emitSpark(this.x, this.y);
            }

            // Audio
            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playWeaponPickup();
            }

            // Multiplayer server notification
            if (this.scene.isMultiplayer && collector === this.scene.player && this.runeId && this.scene.networkAdapter) {
                this.scene.networkAdapter.sendCollectRune(this.runeId);
            }

            // Schedule respawn after 18 seconds (local mode only)
            if (!this.scene.isMultiplayer && this.scene.seedManager && this.scene.time) {
                const sm = this.scene.seedManager;
                const t = this.scene.time.delayedCall(18000 + Math.random() * 4000, () => {
                    if (this.scene && this.scene.sys && this.scene.matchActive) {
                        const pt = sm.getRandomSafePoint();
                        const types = ['TRIPLE', 'RAPID', 'BOUNCING', 'SHOTGUN', 'GHOSTFIRE', 'HOMING'];
                        const nextType = types[Math.floor(Math.random() * types.length)];
                        this.spawn(pt.x, pt.y, nextType);
                    }
                });
                if (sm.respawnTimers) sm.respawnTimers.push(t);
            }
        }
    }

    class GoldenPinata extends Phaser.Physics.Arcade.Sprite {
        constructor(scene, x, y) {
            super(scene, x, y, 'loot_pinata');
            this.scene = scene;
            this.maxHealth = 200;
            this.health = 200;
            this.isDead = false;
            this.wanderTarget = { x, y };
            this.nextMoveTime = 0;

            scene.add.existing(this);
            scene.physics.add.existing(this);
            this.setDepth(10);
            this.setScale(1.4);
            this.body.setCircle(28, 12, 14);
            this.body.setCollideWorldBounds(true);

            // Overhead Title & HP bar
            this.titleText = scene.add.text(x, y - 48, '👑 GOLDEN PINATA GOURD', {
                fontFamily: 'Outfit, sans-serif',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#ffe600',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(11);

            this.hpBg = scene.add.rectangle(x, y - 38, 54, 6, 0x111111, 0.85).setDepth(11);
            this.hpFill = scene.add.rectangle(x - 27, y - 38, 54, 4, 0xffd700).setOrigin(0, 0.5).setDepth(11);

            // Floating bob tween
            this.bobTween = scene.tweens.add({
                targets: this,
                y: y - 8,
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        takeDamage(amount, attacker) {
            if (this.isDead || !this.active) return false;
            this.health = Math.max(0, this.health - amount);
            
            // Flash white on hit
            this.setTint(0xffffff);
            this.scene.time.delayedCall(70, () => {
                if (this.active) this.clearTint();
            });

            // Golden sparks
            if (this.scene.emitterManager) {
                this.scene.emitterManager.emitSpark(this.x, this.y);
            }

            // Update overhead HP
            const pct = Math.max(0, this.health / this.maxHealth);
            this.hpFill.width = 54 * pct;

            // Damage text
            const dmgText = this.scene.add.text(this.x + (Math.random() * 20 - 10), this.y - 30, `-${Math.round(amount)}`, {
                fontFamily: 'Outfit, sans-serif',
                fontSize: '13px',
                fontWeight: 'bold',
                color: '#ffd700',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            this.scene.tweens.add({
                targets: dmgText,
                y: dmgText.y - 35,
                alpha: 0,
                duration: 600,
                ease: 'Cubic.easeOut',
                onComplete: () => dmgText.destroy()
            });

            if (this.health <= 0) {
                this.burstJackpot(attacker);
                return true;
            }
            return false;
        }

        burstJackpot(attacker) {
            if (this.isDead) return;
            this.isDead = true;

            const px = this.x;
            const py = this.y;

            // Audio & Screen shake
            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playPinataLoot();
                window.PumpkinPanic.AudioSystem.playExplosion();
            }
            this.scene.cameras.main.shake(300, 0.015);

            // Giant celebratory banner
            const killerName = attacker ? attacker.name : 'A Hunter';
            const banner = this.scene.add.text(px, py - 60, `👑 ${killerName} CRACKED THE GOLDEN PINATA!\n💰 JACKPOT LOOT EXPLOSION! 🪙`, {
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '20px',
                fontWeight: 'bold',
                align: 'center',
                color: '#ffe600',
                stroke: '#000000',
                strokeThickness: 5
            }).setOrigin(0.5).setDepth(30);

            this.scene.tweens.add({
                targets: banner,
                y: banner.y - 60,
                scaleX: 1.15,
                scaleY: 1.15,
                alpha: 0,
                duration: 2500,
                ease: 'Cubic.easeOut',
                onComplete: () => banner.destroy()
            });

            // Award bonus coins to attacker
            if (attacker && typeof attacker.addCoins === 'function') {
                attacker.addCoins(300);
            }

            // Spawn 16 Super Seeds outward in a starburst
            for (let i = 0; i < 16; i++) {
                const ang = (i / 16) * Math.PI * 2;
                const dist = Phaser.Math.Between(50, 160);
                const tx = Phaser.Math.Clamp(px + Math.cos(ang) * dist, 80, Config.WORLD.WIDTH - 80);
                const ty = Phaser.Math.Clamp(py + Math.sin(ang) * dist, 80, Config.WORLD.HEIGHT - 80);

                const seed = new Seed(this.scene, px, py, true);
                this.scene.seedManager.seedsGroup.add(seed);
                seed.spawn(px, py, true, true);
                this.scene.tweens.add({
                    targets: seed,
                    x: tx,
                    y: ty,
                    duration: 450 + Math.random() * 200,
                    ease: 'Back.easeOut'
                });
            }

            // Spawn 2 random weapon runes
            const allTypes = ['TRIPLE', 'RAPID', 'BOUNCING', 'SHOTGUN', 'GHOSTFIRE', 'HOMING'];
            for (let i = 0; i < 2; i++) {
                const rType = allTypes[Math.floor(Math.random() * allTypes.length)];
                const rx = px + (i === 0 ? -70 : 70);
                const ry = py + 20;
                const rune = new WeaponRune(this.scene, rx, ry, rType);
                this.scene.seedManager.runesGroup.add(rune);
                rune.spawn(rx, ry, rType);
            }

            this.destroy();

            // Respawn after 55 seconds
            if (this.scene && this.scene.seedManager && this.scene.time) {
                const sm = this.scene.seedManager;
                const t = this.scene.time.delayedCall(55000, () => {
                    if (this.scene && this.scene.sys && this.scene.matchActive) {
                        const pt = sm.getRandomSafePoint();
                        sm.spawnPinata(pt.x, pt.y);
                    }
                });
                if (sm.respawnTimers) sm.respawnTimers.push(t);
            }
        }

        update(time, delta) {
            if (this.isDead || !this.active) return;

            // Keep overhead UI attached to pinata
            if (this.titleText) this.titleText.setPosition(this.x, this.y - 48);
            if (this.hpBg) this.hpBg.setPosition(this.x, this.y - 38);
            if (this.hpFill) this.hpFill.setPosition(this.x - 27, this.y - 38);

            // Gentle wandering
            if (time > this.nextMoveTime) {
                this.nextMoveTime = time + 2500 + Math.random() * 2000;
                this.wanderTarget = {
                    x: Phaser.Math.Clamp(this.x + (Math.random() - 0.5) * 500, 200, Config.WORLD.WIDTH - 200),
                    y: Phaser.Math.Clamp(this.y + (Math.random() - 0.5) * 500, 200, Config.WORLD.HEIGHT - 200)
                };
            }

            const dist = Phaser.Math.Distance.Between(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y);
            if (dist > 20) {
                const ang = Phaser.Math.Angle.Between(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y);
                this.body.setVelocity(Math.cos(ang) * 90, Math.sin(ang) * 90);
            } else {
                this.body.setVelocity(0, 0);
            }
        }

        destroy(fromScene) {
            if (this.bobTween) this.bobTween.stop();
            if (this.titleText) this.titleText.destroy();
            if (this.hpBg) this.hpBg.destroy();
            if (this.hpFill) this.hpFill.destroy();
            super.destroy(fromScene);
        }
    }

    class ExplosiveSeed extends Phaser.Physics.Arcade.Sprite {
        constructor(scene, x, y) {
            super(scene, x, y, 'seed_explosive');
            this.scene = scene;
            this.isTriggered = false;
            this.fuseTimer = null;
            this.pulseTween = null;

            scene.add.existing(this);
            scene.physics.add.existing(this);
            this.setDepth(9);

            // Warning radius graphic
            this.warningCircle = scene.add.graphics().setDepth(8).setVisible(false);
        }

        spawn(x, y) {
            if (!this.scene || !this.scene.sys || !this.scene.physics || !this.scene.physics.world) return;
            this.isTriggered = false;
            this.enableBody(true, x, y, true, true);
            this.setAlpha(1);
            this.setScale(1);
            this.clearTint();
            if (this.warningCircle) {
                this.warningCircle.clear();
                this.warningCircle.setVisible(false);
            }

            if (this.pulseTween) this.pulseTween.stop();
            if (this.scene && this.scene.tweens) {
                this.pulseTween = this.scene.tweens.add({
                    targets: this,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 700,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }

            if (this.body) {
                this.body.setCircle(18, 8, 8);
            }
        }

        triggerFuse() {
            if (this.isTriggered || !this.active) return;
            this.isTriggered = true;

            if (this.pulseTween) this.pulseTween.stop();

            // Play fuse warning audio
            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playFuseWarning();
            }

            // Show explosive warning blast radius circle (210px radius)
            const blastRadius = Config.EXPLOSIVE_SEEDS.BLAST_RADIUS;
            this.warningCircle.clear();
            this.warningCircle.lineStyle(2.5, 0xff2222, 0.85);
            this.warningCircle.strokeCircle(this.x, this.y, blastRadius);
            this.warningCircle.fillStyle(0xff0000, 0.12);
            this.warningCircle.fillCircle(this.x, this.y, blastRadius);
            this.warningCircle.setVisible(true);

            // Violent shaking and flashing
            this.scene.tweens.add({
                targets: this,
                x: this.x + 4,
                duration: 50,
                yoyo: true,
                repeat: 22,
                onUpdate: () => {
                    this.setTint(Math.random() < 0.5 ? 0xffffff : 0xff2200);
                }
            });

            // Detonate after fuse duration
            this.fuseTimer = this.scene.time.delayedCall(Config.EXPLOSIVE_SEEDS.FUSE_MS, () => {
                this.detonate();
            });
        }

        detonate() {
            if (!this.active) return;
            const bx = this.x;
            const by = this.y;
            const blastRadius = Config.EXPLOSIVE_SEEDS.BLAST_RADIUS;
            const blastDamage = Config.EXPLOSIVE_SEEDS.BLAST_DAMAGE;

            this.disableBody(true, true);
            this.warningCircle.clear();
            this.warningCircle.setVisible(false);

            // Massive explosion FX & audio
            if (this.scene.emitterManager) {
                this.scene.emitterManager.emitExplosion(bx, by);
            }
            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playExplosion();
            }

            // Camera shake
            this.scene.cameras.main.shake(220, 0.012);

            // Area of effect damage to nearby entities
            if (this.scene.entitiesGroup) {
                this.scene.entitiesGroup.children.iterate((ent) => {
                    if (ent && !ent.isDead && typeof ent.takeDamage === 'function') {
                        const dist = Phaser.Math.Distance.Between(bx, by, ent.x, ent.y);
                        if (dist <= blastRadius) {
                            // Damage with distance falloff
                            const factor = 1 - (dist / blastRadius) * 0.45;
                            const dmg = Math.round(blastDamage * factor);
                            ent.takeDamage(dmg, { name: 'Volatile Pumpkin Bomb' });

                            // Knockback impulse away from explosion center
                            const angle = Phaser.Math.Angle.Between(bx, by, ent.x, ent.y);
                            const knockbackSpeed = 240 * factor;
                            ent.body.setVelocity(Math.cos(angle) * knockbackSpeed, Math.sin(angle) * knockbackSpeed);
                        }
                    }
                });
            }

            // Respawn after delay
            if (this.scene && this.scene.seedManager && this.scene.time) {
                const sm = this.scene.seedManager;
                const t = this.scene.time.delayedCall(Config.EXPLOSIVE_SEEDS.RESPAWN_DELAY, () => {
                    if (this.scene && this.scene.sys && this.scene.matchActive) {
                        const pt = sm.getRandomSafePoint();
                        this.spawn(pt.x, pt.y);
                    }
                });
                if (sm.respawnTimers) sm.respawnTimers.push(t);
            }
        }

        destroy(fromScene) {
            if (this.fuseTimer) this.fuseTimer.remove();
            if (this.pulseTween) this.pulseTween.stop();
            if (this.warningCircle) this.warningCircle.destroy();
            super.destroy(fromScene);
        }
    }

    class SeedManager {
        constructor(scene) {
            this.scene = scene;
            this.respawnTimers = [];
            this.seedsGroup = scene.physics.add.group({
                classType: Seed,
                runChildUpdate: false
            });

            this.runesGroup = scene.physics.add.group({
                classType: WeaponRune,
                runChildUpdate: false
            });

            this.explosiveGroup = scene.physics.add.group({
                classType: ExplosiveSeed,
                runChildUpdate: false
            });

            this.pinataGroup = scene.physics.add.group({
                classType: GoldenPinata,
                runChildUpdate: true
            });
        }

        spawnPinata(x, y) {
            const pinata = new GoldenPinata(this.scene, x, y);
            this.pinataGroup.add(pinata);
            return pinata;
        }

        initSeeds() {
            this.clear();

            // Spawn normal seeds
            for (let i = 0; i < Config.SEEDS.NORMAL_COUNT; i++) {
                const pt = this.getRandomSafePoint();
                const seed = new Seed(this.scene, pt.x, pt.y, false);
                this.seedsGroup.add(seed);
                seed.spawn(pt.x, pt.y, false, false);
            }

            // Spawn super seeds
            for (let i = 0; i < Config.SEEDS.SUPER_COUNT; i++) {
                const pt = this.getRandomSafePoint();
                const seed = new Seed(this.scene, pt.x, pt.y, true);
                this.seedsGroup.add(seed);
                seed.spawn(pt.x, pt.y, true, false);
            }

            // Spawn weapon mutation runes (3 of each 6 types distributed in arena = 18 runes!)
            const weaponTypes = ['TRIPLE', 'RAPID', 'BOUNCING', 'SHOTGUN', 'GHOSTFIRE', 'HOMING'];
            for (let i = 0; i < 18; i++) {
                const type = weaponTypes[i % weaponTypes.length];
                const pt = this.getRandomSafePoint();
                const rune = new WeaponRune(this.scene, pt.x, pt.y, type);
                this.runesGroup.add(rune);
                rune.spawn(pt.x, pt.y, type);
            }

            // Spawn rare explosive seeds
            for (let i = 0; i < Config.EXPLOSIVE_SEEDS.COUNT; i++) {
                const pt = this.getRandomSafePoint();
                const expSeed = new ExplosiveSeed(this.scene, pt.x, pt.y);
                this.explosiveGroup.add(expSeed);
                expSeed.spawn(pt.x, pt.y);
            }

            // Spawn roaming Golden Mega Pinata Gourd mini-boss!
            const pinataPt = this.getRandomSafePoint();
            this.spawnPinata(pinataPt.x, pinataPt.y);
        }

        getRandomSafePoint() {
            let x, y, safe = false;
            let attempts = 0;
            const margin = 140;

            while (!safe && attempts < 25) {
                x = Phaser.Math.Between(margin, Config.WORLD.WIDTH - margin);
                y = Phaser.Math.Between(margin, Config.WORLD.HEIGHT - margin);
                safe = true;
                attempts++;
            }
            return { x, y };
        }

        scheduleRespawn(seed) {
            if (!this.scene || !this.scene.time) return;
            const t = this.scene.time.delayedCall(Config.SEEDS.RESPAWN_DELAY + Math.random() * 2000, () => {
                if (!this.scene || !this.scene.sys || !this.scene.matchActive) return;
                let pt = { x: 0, y: 0 };
                if (this.scene.stormSystem) {
                    const center = this.scene.stormSystem.center;
                    const r = Math.max(80, this.scene.stormSystem.currentRadius - 60);
                    const ang = Math.random() * Math.PI * 2;
                    const dist = Math.random() * r;
                    pt.x = Phaser.Math.Clamp(center.x + Math.cos(ang) * dist, 100, Config.WORLD.WIDTH - 100);
                    pt.y = Phaser.Math.Clamp(center.y + Math.sin(ang) * dist, 100, Config.WORLD.HEIGHT - 100);
                } else {
                    pt = this.getRandomSafePoint();
                }

                if (seed && seed.scene && seed.scene.sys) {
                    seed.spawn(pt.x, pt.y, seed.isSuper, false);
                }
            });
            if (this.respawnTimers) this.respawnTimers.push(t);
        }

        dropLootBurst(x, y, level = 1) {
            const count = Phaser.Math.Between(
                Config.SEEDS.DROP_SEEDS_ON_DEATH_MIN,
                Config.SEEDS.DROP_SEEDS_ON_DEATH_MAX + Math.min(6, level)
            );

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
                const distance = Phaser.Math.Between(35, 95);
                const targetX = Phaser.Math.Clamp(x + Math.cos(angle) * distance, 60, Config.WORLD.WIDTH - 60);
                const targetY = Phaser.Math.Clamp(y + Math.sin(angle) * distance, 60, Config.WORLD.HEIGHT - 60);

                const isSuper = (i === 0 && level >= 3);
                let seed = this.seedsGroup.getFirstDead(false);
                if (!seed) {
                    seed = new Seed(this.scene, x, y, isSuper);
                    this.seedsGroup.add(seed);
                }

                seed.spawn(x, y, isSuper, true);

                // Burst outward animation
                if (this.scene && this.scene.tweens) {
                    this.scene.tweens.add({
                        targets: seed,
                        x: targetX,
                        y: targetY,
                        duration: 350 + Math.random() * 200,
                        ease: 'Back.easeOut'
                    });
                }
            }
        }

        getNearestSeed(x, y, maxDistance = 450) {
            let closest = null;
            let minDist = maxDistance;

            if (this.seedsGroup && this.seedsGroup.children) {
                this.seedsGroup.children.iterate((seed) => {
                    if (seed && seed.active) {
                        const d = Phaser.Math.Distance.Between(x, y, seed.x, seed.y);
                        if (d < minDist) {
                            minDist = d;
                            closest = seed;
                        }
                    }
                });
            }

            return closest;
        }

        clear() {
            // Cancel all pending respawn delayedCalls
            if (this.respawnTimers && this.respawnTimers.length > 0) {
                this.respawnTimers.forEach(t => {
                    if (t && typeof t.remove === 'function') {
                        t.remove(false);
                    }
                });
                this.respawnTimers = [];
            }

            if (this.seedsGroup) {
                const seeds = this.seedsGroup.getChildren();
                for (let i = seeds.length - 1; i >= 0; i--) {
                    const seed = seeds[i];
                    if (seed) {
                        if (seed.bobTween) seed.bobTween.stop();
                        seed.destroy();
                    }
                }
                this.seedsGroup.clear(true, true);
            }

            if (this.runesGroup) {
                const runes = this.runesGroup.getChildren();
                for (let i = runes.length - 1; i >= 0; i--) {
                    const rune = runes[i];
                    if (rune) {
                        if (rune.bobTween) rune.bobTween.stop();
                        rune.destroy();
                    }
                }
                this.runesGroup.clear(true, true);
            }

            if (this.explosiveGroup) {
                const explosives = this.explosiveGroup.getChildren();
                for (let i = explosives.length - 1; i >= 0; i--) {
                    const exp = explosives[i];
                    if (exp) {
                        if (exp.fuseTimer) exp.fuseTimer.remove();
                        if (exp.pulseTween) exp.pulseTween.stop();
                        if (exp.warningCircle) exp.warningCircle.destroy();
                        exp.destroy();
                    }
                }
                this.explosiveGroup.clear(true, true);
            }

            if (this.pinataGroup) {
                const pinatas = this.pinataGroup.getChildren();
                for (let i = pinatas.length - 1; i >= 0; i--) {
                    const p = pinatas[i];
                    if (p) p.destroy();
                }
                this.pinataGroup.clear(true, true);
            }

            this.multiplayerSeedsMap = new Map();
            this.multiplayerRunesMap = new Map();
        }

        syncMultiplayerSeeds(seedsMap, runesMap) {
            if (!this.multiplayerSeedsMap) this.multiplayerSeedsMap = new Map();
            if (!this.multiplayerRunesMap) this.multiplayerRunesMap = new Map();

            // Sync seeds from Colyseus MapSchema
            if (seedsMap) {
                seedsMap.forEach((sState, sId) => {
                    let seedSprite = this.multiplayerSeedsMap.get(sId);
                    if (!seedSprite) {
                        seedSprite = new Seed(this.scene, sState.x, sState.y, !!sState.isSuper);
                        seedSprite.seedId = sId;
                        this.seedsGroup.add(seedSprite);
                        this.multiplayerSeedsMap.set(sId, seedSprite);
                    }
                    if (sState.active) {
                        if (!seedSprite.active) {
                            seedSprite.spawn(sState.x, sState.y, !!sState.isSuper, false);
                        } else {
                            seedSprite.setPosition(sState.x, sState.y);
                        }
                    } else if (!sState.active && seedSprite.active) {
                        seedSprite.disableBody(true, true);
                    }
                });
            }

            // Sync runes from Colyseus MapSchema
            if (runesMap) {
                runesMap.forEach((rState, rId) => {
                    let runeSprite = this.multiplayerRunesMap.get(rId);
                    if (!runeSprite) {
                        runeSprite = new WeaponRune(this.scene, rState.x, rState.y, rState.weaponType || 'TRIPLE');
                        runeSprite.runeId = rId;
                        this.runesGroup.add(runeSprite);
                        this.multiplayerRunesMap.set(rId, runeSprite);
                    }
                    if (rState.active) {
                        if (!runeSprite.active) {
                            runeSprite.spawn(rState.x, rState.y, rState.weaponType || 'TRIPLE');
                        } else {
                            runeSprite.setPosition(rState.x, rState.y);
                        }
                    } else if (!rState.active && runeSprite.active) {
                        runeSprite.disableBody(true, true);
                    }
                });
            }
        }
    }

    window.PumpkinPanic.SeedManager = SeedManager;
})();
