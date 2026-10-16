/**
 * PUMPKIN PANIC.IO - Base Entity
 * Shared base class for Player and Bots with growth milestones,
 * squash/stretch wobble, hit feedback, and killer tracking.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};
    const Config = window.PumpkinPanic.Config;

    class Entity extends Phaser.GameObjects.Container {
        constructor(scene, x, y, options = {}) {
            super(scene, x, y);
            this.scene = scene;
            this.id = options.id || ('ent_' + Math.random().toString(36).substr(2, 9));
            this.name = options.name || 'Pumpkin';
            this.isBot = !!options.isBot;
            this.skinKey = options.skin || 'classic';

            // Stats
            this.level = 1;
            this.xp = 0;
            this.kills = 0;
            this.score = 0;
            this.maxHealth = Config.PLAYER.BASE_HEALTH;
            this.health = this.maxHealth;
            this.speed = Config.PLAYER.BASE_SPEED;
            this.damage = Config.PLAYER.BASE_DAMAGE;
            this.fireCooldown = Config.PLAYER.FIRE_COOLDOWN;
            this.lastFireTime = 0;
            this.isDead = false;
            this.killedByName = null;

            // Invulnerability & Hit Flash
            this.isInvulnerable = false;
            this.invulnTimer = 0;

            // Spawn Shield (Complete protection when match begins)
            this.spawnShieldTimer = this.isBot ? 2500 : (Config.PLAYER.SPAWN_SHIELD_DURATION || 4000);
            this.speedMultiplier = 1.0;

            // Aim & Movement
            this.aimAngle = 0;
            this.targetX = x;
            this.targetY = y;
            this.baseScale = 1.0;

            // Setup Visuals
            this.setupVisuals();

            // Setup Physics Body
            scene.add.existing(this);
            scene.physics.add.existing(this);
            this.body.setCircle(Config.PLAYER.BASE_RADIUS);
            this.body.setOffset(-Config.PLAYER.BASE_RADIUS, -Config.PLAYER.BASE_RADIUS);
            this.body.setCollideWorldBounds(true);
            this.body.setDamping(true);
            this.body.setDrag(0.12);
            this.setDepth(12);
        }

        setupVisuals() {
            // Shadow
            this.shadow = this.scene.add.ellipse(0, 16, 52, 26, 0x000000, 0.35);
            this.add(this.shadow);

            // Spawn Shield Visual Barrier (Glowing golden dome)
            this.spawnShieldRing = this.scene.add.ellipse(0, 2, 74, 62, 0xffd700, 0.35);
            this.spawnShieldRing.setStrokeStyle(3, 0xffea00, 0.85);
            this.spawnShieldRing.setVisible(this.spawnShieldTimer > 0);
            this.add(this.spawnShieldRing);

            // Tier 3 Aura Ring (Pulsing energetic halo)
            this.auraRing = this.scene.add.ellipse(0, 4, 76, 56, 0x8b2fc9, 0.25).setVisible(false);
            this.add(this.auraRing);

            // Aim Reticle / Pointer
            this.aimPointer = this.scene.add.triangle(38, 0, 0, -8, 18, 0, 0, 8, 0xffa500, 0.85);
            this.add(this.aimPointer);

            // Pumpkin Body Sprite
            this.bodySprite = this.scene.add.sprite(0, 0, 'pumpkin_' + this.skinKey);
            this.add(this.bodySprite);

            // Tier 2: Leafy Spiked Collar
            this.collarSprite = this.scene.add.sprite(0, 18, 'tier_collar').setVisible(false);
            this.add(this.collarSprite);

            // Expressive Face Sprite (carved jack-o'-lantern)
            this.faceSprite = this.scene.add.sprite(0, 2, 'face_' + this.skinKey);
            this.add(this.faceSprite);

            // Tier 4: Radiant Flaming Titan Crown
            this.titanCrownSprite = this.scene.add.sprite(0, -32, 'tier_titan_crown').setVisible(false);
            this.add(this.titanCrownSprite);

            // Overhead UI Container
            this.overheadContainer = this.scene.add.container(0, -42);
            this.add(this.overheadContainer);

            // Nameplate
            const nameColor = this.isBot ? '#e0b0ff' : '#ffe600';
            this.nameText = this.scene.add.text(0, -12, this.name, {
                fontFamily: 'Outfit, sans-serif',
                fontSize: '11px',
                fontWeight: 'bold',
                color: nameColor,
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            this.overheadContainer.add(this.nameText);

            // Health Bar Background
            this.hpBarBg = this.scene.add.rectangle(0, 2, 44, 6, 0x111111, 0.85);
            this.hpBarBg.setStrokeStyle(1, 0x333333);
            this.overheadContainer.add(this.hpBarBg);

            // Health Bar Fill
            this.hpBarFill = this.scene.add.rectangle(-22, 2, 44, 4, 0x2cd448).setOrigin(0, 0.5);
            this.overheadContainer.add(this.hpBarFill);

            // Level Badge
            this.levelBadge = this.scene.add.text(-28, 2, '1', {
                fontFamily: 'Outfit, sans-serif',
                fontSize: '9px',
                fontWeight: 'bold',
                color: '#ffffff',
                backgroundColor: '#7b1fa2',
                padding: { x: 3, y: 1 }
            }).setOrigin(0.5);
            this.overheadContainer.add(this.levelBadge);
        }

        update(time, delta) {
            if (this.isDead) return;

            // Handle Spawn Shield Countdown
            if (this.spawnShieldTimer > 0) {
                this.spawnShieldTimer -= delta;
                if (this.spawnShieldRing) {
                    this.spawnShieldRing.setVisible(true);
                    this.spawnShieldRing.setScale(1.0 + Math.sin(time * 0.008) * 0.06);
                    this.spawnShieldRing.setAlpha(0.35 + (Math.sin(time * 0.012) + 1) * 0.2);
                }
                if (this.spawnShieldTimer <= 0) {
                    this.spawnShieldTimer = 0;
                    if (this.spawnShieldRing) this.spawnShieldRing.setVisible(false);
                    if (this.scene.emitterManager) {
                        this.scene.emitterManager.emitSpark(this.x, this.y);
                    }
                }
            } else if (this.spawnShieldRing && this.spawnShieldRing.visible) {
                this.spawnShieldRing.setVisible(false);
            }

            // Handle invulnerability countdown safely
            if (this.isInvulnerable) {
                if (typeof this.invulnTimer !== 'number' || isNaN(this.invulnTimer) || this.invulnTimer <= 0) {
                    this.isInvulnerable = false;
                    this.invulnTimer = 0;
                    if (this.bodySprite) this.bodySprite.setAlpha(1.0);
                } else {
                    this.invulnTimer -= delta;
                    if (this.bodySprite) {
                        this.bodySprite.setAlpha(Math.sin(time * 0.05) > 0 ? 0.45 : 1.0);
                    }
                    if (this.invulnTimer <= 0) {
                        this.isInvulnerable = false;
                        this.invulnTimer = 0;
                        if (this.bodySprite) this.bodySprite.setAlpha(1.0);
                    }
                }
            }

            // Juicy Movement Squash & Stretch Wobble
            const vx = this.body.velocity.x;
            const vy = this.body.velocity.y;
            const moveSpeed = Math.hypot(vx, vy);

            if (moveSpeed > 25) {
                const wobble = Math.sin(time * 0.016) * 0.06;
                this.setScale(this.baseScale * (1 + wobble), this.baseScale * (1 - wobble));
            } else {
                this.setScale(this.baseScale);
            }

            // Aim direction visuals
            this.aimPointer.setRotation(this.aimAngle);
            const aimDist = 36 * this.baseScale;
            this.aimPointer.setPosition(Math.cos(this.aimAngle) * aimDist, Math.sin(this.aimAngle) * aimDist);

            // Keep overhead UI oriented upright regardless of container rotation
            this.overheadContainer.setRotation(-this.rotation);

            // Inferno skin special blazing ember aura
            if (this.skinKey === 'inferno' && this.scene.emitterManager && Math.random() < 0.3) {
                this.scene.emitterManager.emitSpark(this.x + (Math.random() * 20 - 10), this.y + 12);
            }

            // Tier 3/4 Aura Pulsing
            if (this.level >= 8 && this.auraRing && this.auraRing.visible) {
                this.auraRing.setAlpha(0.2 + (Math.sin(time * 0.005) + 1) * 0.15);
            }
        }

        takeDamage(amount, attacker) {
            // Block all damage if entity is dead, invulnerable, or protected by spawn shield!
            if (this.isDead || this.isInvulnerable || this.spawnShieldTimer > 0) {
                if (this.spawnShieldTimer > 0 && this.spawnShieldRing) {
                    // Golden deflection spark
                    if (this.scene.emitterManager) {
                        this.scene.emitterManager.emitSpark(this.x, this.y);
                    }
                }
                return false;
            }

            this.health = Math.max(0, this.health - amount);
            this.updateHealthBar();

            // Hit Flash on entity sprites
            this.scene.tweens.add({
                targets: [this.bodySprite, this.faceSprite],
                tint: 0xffffff,
                duration: 65,
                yoyo: true,
                onComplete: () => {
                    if (this.bodySprite && this.faceSprite) {
                        this.bodySprite.clearTint();
                        this.faceSprite.clearTint();
                    }
                }
            });

            // Subtle camera screen shake if human player was damaged
            if (!this.isBot) {
                this.scene.cameras.main.shake(90, 0.004);
            }

            // Floating damage indicator
            this.spawnDamageNumber(amount);

            // Audio feedback
            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playHit();
            }

            // Brief invulnerability to prevent multi-hit shred
            this.isInvulnerable = true;
            this.invulnTimer = (Config.PLAYER && typeof Config.PLAYER.INVULN_TIME === 'number') ? Config.PLAYER.INVULN_TIME : 220;

            // Check defeat
            if (this.health <= 0) {
                this.die(attacker);
                return true;
            }
            return false;
        }

        spawnDamageNumber(amount) {
            if (!this.scene || !this.scene.add || !this.active) return;
            const isCrit = amount > 28;
            const dmgText = this.scene.add.text(
                this.x + (Math.random() * 24 - 12),
                this.y - 25,
                isCrit ? `💥-${Math.round(amount)}!` : `-${Math.round(amount)}`,
                {
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: isCrit ? '16px' : '13px',
                    fontWeight: 'bold',
                    color: isCrit ? '#ffb703' : '#ff4d4d',
                    stroke: '#000000',
                    strokeThickness: 3.5
                }
            ).setOrigin(0.5);

            if (this.scene.tweens) {
                this.scene.tweens.add({
                    targets: dmgText,
                    y: dmgText.y - 38,
                    alpha: 0,
                    duration: 700,
                    ease: 'Cubic.easeOut',
                    onComplete: () => dmgText.destroy()
                });
            }
        }

        heal(amount) {
            if (this.isDead) return;
            this.health = Math.min(this.maxHealth, this.health + amount);
            this.updateHealthBar();

            if (!this.scene || !this.scene.add || !this.active) return;
            const healText = this.scene.add.text(
                this.x + (Math.random() * 20 - 10),
                this.y - 25,
                `+${Math.round(amount)}`,
                {
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#2cd448',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5);

            this.scene.tweens.add({
                targets: healText,
                y: healText.y - 30,
                alpha: 0,
                duration: 600,
                ease: 'Cubic.easeOut',
                onComplete: () => healText.destroy()
            });
        }

        addXP(amount) {
            if (this.isDead) return;
            this.xp += amount;
            this.score = this.kills * 100 + this.xp;

            const nextLvlXp = Config.GROWTH.XP_THRESHOLDS[this.level] || Infinity;
            if (this.xp >= nextLvlXp && this.level < Config.GROWTH.MAX_LEVEL) {
                this.levelUp();
            }
        }

        addCoins(amount) {
            if (this.isDead) return;
            this.coins = (this.coins || 0) + amount;
            if (!this.isBot && window.PumpkinPanic.ui) {
                window.PumpkinPanic.ui.addCoins(amount);
            }
        }

        levelUp() {
            this.level++;
            this.levelBadge.setText(this.level.toString());

            // Stat growth scaling
            const prevMaxHp = this.maxHealth;
            this.maxHealth = Config.PLAYER.BASE_HEALTH + (this.level - 1) * Config.GROWTH.HP_PER_LEVEL;
            this.health += (this.maxHealth - prevMaxHp);

            this.damage = Config.PLAYER.BASE_DAMAGE + (this.level - 1) * Config.GROWTH.DAMAGE_PER_LEVEL;
            this.speed = Math.max(
                Config.GROWTH.MIN_SPEED,
                Config.PLAYER.BASE_SPEED - (this.level - 1) * Config.GROWTH.SPEED_PENALTY_PER_LEVEL
            );

            // Scale visual growth smoothly
            this.baseScale = 1.0 + (this.level - 1) * Config.GROWTH.SCALE_PER_LEVEL;
            this.scene.tweens.add({
                targets: this,
                scaleX: this.baseScale,
                scaleY: this.baseScale,
                duration: 400,
                ease: 'Back.easeOut'
            });

            // Update physics collision circle
            const newRadius = Config.PLAYER.BASE_RADIUS * this.baseScale;
            this.body.setCircle(newRadius);
            this.body.setOffset(-newRadius, -newRadius);

            // Check Growth Tier Milestones & Evolve Appearance
            let tierTitle = null;
            if (this.level === 4) {
                tierTitle = '🎃 EVOLVED: CARVED BEAST!';
                if (this.collarSprite) this.collarSprite.setVisible(true);
            } else if (this.level === 8) {
                tierTitle = '⚡ EVOLVED: GOURD COLOSSUS!';
                if (this.auraRing) this.auraRing.setVisible(true);
            } else if (this.level === 12) {
                tierTitle = '👑 ASCENDED: HARVEST TITAN!';
                if (this.titanCrownSprite) this.titanCrownSprite.setVisible(true);
            }

            // Growth celebration particles
            this.scene.emitterManager.emitLevelUp(this.x, this.y);

            // Floating celebration banner
            const popupMsg = tierTitle || ('GROWTH UP! LVL ' + this.level);
            const lvlText = this.scene.add.text(this.x, this.y - 48, popupMsg, {
                fontFamily: 'Fredoka, sans-serif',
                fontSize: tierTitle ? '18px' : '16px',
                fontWeight: 'bold',
                color: tierTitle ? '#ffaa00' : '#ffd700',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.scene.tweens.add({
                targets: lvlText,
                y: lvlText.y - 45,
                alpha: 0,
                duration: tierTitle ? 1400 : 1000,
                ease: 'Cubic.easeOut',
                onComplete: () => lvlText.destroy()
            });

            // Player camera zoom punch celebration
            if (!this.isBot) {
                this.scene.cameras.main.zoomTo(1.06, 120, 'Sine.easeInOut', false, (cam, progress) => {
                    if (progress === 1) {
                        cam.zoomTo(1.0, 200, 'Sine.easeOut');
                    }
                });
            }

            if (window.PumpkinPanic.AudioSystem && !this.isBot) {
                window.PumpkinPanic.AudioSystem.playLevelUp();
            }

            this.updateHealthBar();
        }

        updateHealthBar() {
            const pct = Math.max(0, Math.min(1, this.health / this.maxHealth));
            this.hpBarFill.width = 44 * pct;
            
            if (pct > 0.55) {
                this.hpBarFill.fillColor = 0x2cd448;
            } else if (pct > 0.28) {
                this.hpBarFill.fillColor = 0xffa500;
            } else {
                this.hpBarFill.fillColor = 0xff3333;
            }
        }

        die(killer) {
            if (this.isDead) return;
            this.isDead = true;
            this.health = 0;
            this.body.setVelocity(0, 0);
            this.body.checkCollision.none = true;
            this.killedByName = killer ? killer.name : 'The Pumpkin Storm';

            if (killer && killer !== this) {
                killer.kills++;
                killer.score = killer.kills * 100 + killer.xp;
                if (typeof killer.addCoins === 'function') {
                    killer.addCoins(Config.ECONOMY.COINS_PER_KILL);
                }
            }

            // Defeat particles & splat
            if (this.scene && this.scene.emitterManager) {
                this.scene.emitterManager.emitDeath(this.x, this.y, this.skinKey);
            }

            // Drop juicy glowing seed loot
            if (this.scene && this.scene.seedManager) {
                this.scene.seedManager.dropLootBurst(this.x, this.y, this.level);
            }

            // Dramatic squash and explode pop
            if (this.scene && this.scene.tweens) {
                this.scene.tweens.add({
                    targets: this,
                    scaleX: this.baseScale * 1.35,
                    scaleY: this.baseScale * 0.25,
                    alpha: 0,
                    duration: 220,
                    ease: 'Back.easeIn',
                    onComplete: () => {
                        this.setVisible(false);
                        this.destroy();
                    }
                });
            } else {
                this.destroy();
            }

            // Emit elimination event
            if (this.scene && this.scene.events) {
                this.scene.events.emit('entity_defeated', {
                    entity: this,
                    killer: killer,
                    killedByName: this.killedByName
                });
            }
        }
    }

    window.PumpkinPanic.Entity = Entity;
})();
