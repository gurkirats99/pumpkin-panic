/**
 * PUMPKIN PANIC.IO - Player Entity
 * Handles user controls, responsive movement, aiming, and firing.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};
    const Config = window.PumpkinPanic.Config;

    class Player extends window.PumpkinPanic.Entity {
        constructor(scene, x, y, options = {}) {
            super(scene, x, y, {
                id: 'player_human',
                name: options.name || 'HeroPumpkin',
                skin: options.skin || 'classic',
                isBot: false
            });

            // Input references
            this.cursors = scene.input.keyboard.createCursorKeys();
            this.wasd = {
                up: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
                down: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
                left: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
                right: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
                space: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
                r: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
            };

            // Touch / Virtual Joystick inputs
            this.joystickVector = { x: 0, y: 0 };
            this.isAutoFiring = false;

            // Reticle pointer decoration
            this.aimPointer.fillColor = 0xffe600;

            // Equipped Gun from Armory
            this.baseGunId = options.gun || localStorage.getItem('pumpkin_equipped_gun') || 'SEED_PISTOL';
            this.baseGun = (Config.GUNS && Config.GUNS[this.baseGunId]) ? Config.GUNS[this.baseGunId] : (Config.GUNS ? Config.GUNS.SEED_PISTOL : { id: 'SEED_PISTOL', type: 'SINGLE', damageMultiplier: 1.0, cooldownMultiplier: 1.0 });

            // Weapon Mutation System (temporary in-game pickup runes)
            this.activeWeapon = 'NORMAL';
            this.weaponTimer = 0;
            this.weaponDuration = 0;

            // Aim Laser / Dotted Guide Line
            this.aimGuide = scene.add.graphics().setDepth(10);

            // Heartbeat audio timer for adrenaline
            this.lastHeartbeatTime = 0;

            // Show Spawn Shield banner on start
            scene.time.delayedCall(150, () => {
                if (this.active && !this.isDead) {
                    const shieldBanner = scene.add.text(this.x, this.y - 50, '🛡️ 4s SPAWN SHIELD ACTIVE!', {
                        fontFamily: 'Fredoka, sans-serif',
                        fontSize: '17px',
                        fontWeight: 'bold',
                        color: '#ffd700',
                        stroke: '#000000',
                        strokeThickness: 4
                    }).setOrigin(0.5);

                    scene.tweens.add({
                        targets: shieldBanner,
                        y: shieldBanner.y - 35,
                        alpha: 0,
                        duration: 2400,
                        ease: 'Cubic.easeOut',
                        onComplete: () => shieldBanner.destroy()
                    });
                }
            });
        }

        update(time, delta) {
            super.update(time, delta);
            if (this.isDead) {
                if (this.aimGuide) this.aimGuide.clear();
                this.checkQuickRestart();
                return;
            }

            // Low-HP Adrenaline Rush: 16% speed boost & heartbeat audio
            const isLowHp = (this.health <= this.maxHealth * 0.30);
            this.speedMultiplier = isLowHp ? (Config.PLAYER.ADRENALINE_SPEED_BOOST || 1.16) : 1.0;

            if (isLowHp && time > this.lastHeartbeatTime + 1200) {
                this.lastHeartbeatTime = time;
                if (window.PumpkinPanic.AudioSystem) {
                    window.PumpkinPanic.AudioSystem.playHeartbeat();
                }
            }

            // Weapon Mutation Countdown
            if (this.activeWeapon !== 'NORMAL') {
                this.weaponTimer -= delta;
                if (this.weaponTimer <= 0) {
                    this.activeWeapon = 'NORMAL';
                    this.weaponTimer = 0;
                    if (window.PumpkinPanic.ui) {
                        window.PumpkinPanic.ui.updateWeaponHUD(null, 0);
                    }
                } else if (window.PumpkinPanic.ui) {
                    window.PumpkinPanic.ui.updateWeaponHUD(this.activeWeapon, this.weaponTimer / this.weaponDuration);
                }
            }

            this.handleInput(time);
            this.renderAimGuide();
        }

        checkQuickRestart() {
            // Quick Replay Flow: Press Space or R to instantly restart match
            if (this.scene.matchOver) {
                if (Phaser.Input.Keyboard.JustDown(this.wasd.space) || Phaser.Input.Keyboard.JustDown(this.wasd.r)) {
                    if (window.PumpkinPanic.ui) {
                        window.PumpkinPanic.ui.hideEndScreen();
                    }
                    this.scene.restartMatch();
                }
            }
        }

        handleInput(time) {
            let vx = 0;
            let vy = 0;

            // Keyboard movement (WASD or Arrow keys)
            if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
            if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
            if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
            if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;

            // Virtual joystick blend (mobile)
            if (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) {
                vx = this.joystickVector.x;
                vy = this.joystickVector.y;
            }

            // Normalize diagonal movement with snappy acceleration and adrenaline boost
            const len = Math.hypot(vx, vy);
            const activeSpeed = this.speed * (this.speedMultiplier || 1.0);
            if (len > 0) {
                vx = (vx / len) * activeSpeed;
                vy = (vy / len) * activeSpeed;
                this.body.setVelocity(vx, vy);
            } else {
                // Snappy crisp stop with responsive damping
                this.body.setVelocity(this.body.velocity.x * 0.72, this.body.velocity.y * 0.72);
            }

            // Real-Time Aiming (Smart Auto-Aim for Touch/Mobile or Mouse Aim for Desktop)
            const isTouchActive = (this.joystickVector.x !== 0 || this.joystickVector.y !== 0) || this.hasTouchAim || (('ontouchstart' in window) && window.innerWidth <= 950);

            if (isTouchActive) {
                if (this.hasTouchAim) {
                    // Touch aiming angle is actively updated by UIManager touch handlers
                } else if (this.isAutoFiring) {
                    // Smart auto-targeting: lock onto the nearest living bot within range
                    let closestBot = null;
                    let closestDistSq = 560 * 560;
                    if (this.scene.bots && this.scene.bots.length > 0) {
                        for (let i = 0; i < this.scene.bots.length; i++) {
                            const bot = this.scene.bots[i];
                            if (bot && bot.active && !bot.isDead) {
                                const dSq = Phaser.Math.Distance.Squared(this.x, this.y, bot.x, bot.y);
                                if (dSq < closestDistSq) {
                                    closestDistSq = dSq;
                                    closestBot = bot;
                                }
                            }
                        }
                    }
                    if (closestBot) {
                        this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y, closestBot.x, closestBot.y);
                    } else if (len > 0) {
                        this.aimAngle = Math.atan2(vy, vx);
                    }
                } else if (len > 0) {
                    // Face direction of movement
                    this.aimAngle = Math.atan2(vy, vx);
                }
            } else {
                // Desktop Mouse Aiming (world coordinates calculation)
                let screenX = this.scene.input.activePointer.x;
                let screenY = this.scene.input.activePointer.y;

                if (this.scene.mousePos && typeof this.scene.mousePos.x === 'number') {
                    screenX = this.scene.mousePos.x;
                    screenY = this.scene.mousePos.y;
                }

                const worldPoint = this.scene.cameras.main.getWorldPoint(screenX, screenY);
                this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y, worldPoint.x, worldPoint.y);
            }

            // Synchronize reticle visuals immediately in real time
            if (this.aimPointer) {
                this.aimPointer.setRotation(this.aimAngle);
                const aimDist = 36 * this.scaleX;
                this.aimPointer.setPosition(Math.cos(this.aimAngle) * aimDist, Math.sin(this.aimAngle) * aimDist);
            }

            // Send input to authoritative multiplayer server if online
            if (this.scene.isMultiplayer && this.scene.networkAdapter && this.scene.networkAdapter.connected) {
                this.scene.networkAdapter.sendInput({ vx, vy, aimAngle: this.aimAngle });
            }

            // Fire cooldown calculation based on active mutation or base gun
            let currentCooldown = this.fireCooldown;
            if (this.activeWeapon && this.activeWeapon !== 'NORMAL') {
                if (this.activeWeapon === 'RAPID') {
                    currentCooldown *= Config.WEAPONS.RAPID.cooldownMultiplier;
                } else if (this.activeWeapon === 'GHOSTFIRE') {
                    currentCooldown *= (Config.WEAPONS.GHOSTFIRE ? Config.WEAPONS.GHOSTFIRE.cooldownMultiplier : 0.45);
                } else if (this.activeWeapon === 'SHOTGUN') {
                    currentCooldown *= (Config.WEAPONS.SHOTGUN ? Config.WEAPONS.SHOTGUN.cooldownMultiplier : 1.35);
                }
            } else if (this.baseGun && this.baseGun.cooldownMultiplier) {
                currentCooldown *= this.baseGun.cooldownMultiplier;
            }

            // Firing logic: mouse button held, spacebar down, or auto-fire active
            const isMouseDown = this.scene.isMouseDown || this.scene.input.activePointer.isDown;
            const isSpaceDown = this.wasd.space.isDown;

            if ((isMouseDown || isSpaceDown || this.isAutoFiring) && time > this.lastFireTime + currentCooldown) {
                const targetX = this.x + Math.cos(this.aimAngle) * 350;
                const targetY = this.y + Math.sin(this.aimAngle) * 350;
                this.fire(targetX, targetY, time);
            }
        }

        renderAimGuide() {
            if (!this.aimGuide) return;
            this.aimGuide.clear();

            // Draw a subtle dotted aim guide along the aimAngle
            const startDist = 42 * this.scaleX;
            const lineLength = 280;
            const step = 20;

            let color = 0xffaa00;
            if (this.activeWeapon && this.activeWeapon !== 'NORMAL') {
                if (this.activeWeapon === 'TRIPLE') color = 0x10b981;
                else if (this.activeWeapon === 'RAPID') color = 0x00f0ff;
                else if (this.activeWeapon === 'BOUNCING') color = 0xd946ef;
                else if (this.activeWeapon === 'SHOTGUN') color = 0xff6600;
                else if (this.activeWeapon === 'GHOSTFIRE') color = 0xa855f7;
                else if (this.activeWeapon === 'HOMING') color = 0x0ea5e9;
            } else if (this.baseGun && this.baseGun.color) {
                color = this.baseGun.color;
            }

            for (let d = startDist; d <= lineLength; d += step) {
                const px = this.x + Math.cos(this.aimAngle) * d;
                const py = this.y + Math.sin(this.aimAngle) * d;
                const alpha = Math.max(0.08, 0.55 - (d / lineLength) * 0.48);
                this.aimGuide.fillStyle(color, alpha);
                this.aimGuide.fillCircle(px, py, 2.4);
            }
        }

        equipWeapon(weaponId) {
            const weaponConfig = Config.WEAPONS[weaponId];
            if (!weaponConfig) return;

            this.activeWeapon = weaponId;
            this.weaponTimer = weaponConfig.duration;
            this.weaponDuration = weaponConfig.duration;

            // Reticle tint update
            if (this.aimPointer) {
                this.aimPointer.fillColor = weaponConfig.color;
            }

            // Floating announcement text
            const banner = this.scene.add.text(this.x, this.y - 45, `${weaponConfig.badge || weaponConfig.name}!`, {
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '18px',
                fontWeight: 'bold',
                color: weaponConfig.bulletColor,
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);

            this.scene.tweens.add({
                targets: banner,
                y: banner.y - 42,
                alpha: 0,
                duration: 1200,
                ease: 'Cubic.easeOut',
                onComplete: () => banner.destroy()
            });

            if (window.PumpkinPanic.ui) {
                window.PumpkinPanic.ui.updateWeaponHUD(weaponId, 1.0);
            }
        }

        fire(targetX, targetY, time) {
            this.lastFireTime = time;

            const spawnDist = (Config.PLAYER.BASE_RADIUS + 12) * this.scaleX;
            const spawnX = this.x + Math.cos(this.aimAngle) * spawnDist;
            const spawnY = this.y + Math.sin(this.aimAngle) * spawnDist;

            let recoilDist = 3.5;

            // Branch by active weapon mutation
            if (this.activeWeapon === 'TRIPLE') {
                // TRIPLE SHOT: 3-way fan spread (-13°, 0°, +13°)
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
                if (window.PumpkinPanic.AudioSystem) window.PumpkinPanic.AudioSystem.playShoot();
            } else if (this.activeWeapon === 'RAPID') {
                // RAPID FIRE: high speed cyan needle
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
                if (window.PumpkinPanic.AudioSystem) window.PumpkinPanic.AudioSystem.playShoot();
            } else if (this.activeWeapon === 'BOUNCING') {
                // BOUNCING SEEDS: violet ricochet crystal
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
                if (window.PumpkinPanic.AudioSystem) window.PumpkinPanic.AudioSystem.playShoot();
            } else if (this.activeWeapon === 'SHOTGUN') {
                // PUMPKIN BUCKSHOT: 5 spread fiery pellets (-18°, -9°, 0°, +9°, +18°)
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
                recoilDist = 7.0; // Heavier punch!
                if (window.PumpkinPanic.AudioSystem) window.PumpkinPanic.AudioSystem.playShotgun();
            } else if (this.activeWeapon === 'GHOSTFIRE') {
                // SOUL FLAMETHROWER: rapid searing flame pellet
                const dmg = this.damage * (Config.WEAPONS.GHOSTFIRE ? Config.WEAPONS.GHOSTFIRE.damageMultiplier : 0.48);
                const spreadJitter = (Math.random() - 0.5) * 0.12;
                this.scene.bulletPool.spawnBullet(
                    spawnX,
                    spawnY,
                    this.aimAngle + spreadJitter,
                    dmg,
                    this,
                    this.scaleX,
                    'GHOSTFIRE',
                    0
                );
                recoilDist = 1.8;
                if (window.PumpkinPanic.AudioSystem) window.PumpkinPanic.AudioSystem.playGhostfire();
            } else if (this.activeWeapon === 'HOMING') {
                // SPECTRE SEEKER: seeking phantom seed
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
                if (window.PumpkinPanic.AudioSystem) window.PumpkinPanic.AudioSystem.playHoming();
            } else {
                // Firing equipped weapon from Armory
                const gun = this.baseGun || (Config.GUNS && Config.GUNS.SEED_PISTOL) || { type: 'SINGLE', damageMultiplier: 1.0, speedMultiplier: 1.0 };
                const dmg = this.damage * (gun.damageMultiplier || 1.0);
                const gType = gun.type || 'SINGLE';

                if (gType === 'TWIN') {
                    // Twin parallel seeds
                    const perp = this.aimAngle + Math.PI / 2;
                    const offset = 12 * this.scaleX;
                    const p1x = spawnX + Math.cos(perp) * offset;
                    const p1y = spawnY + Math.sin(perp) * offset;
                    const p2x = spawnX - Math.cos(perp) * offset;
                    const p2y = spawnY - Math.sin(perp) * offset;

                    this.scene.bulletPool.spawnBullet(p1x, p1y, this.aimAngle, dmg * 0.9, this, this.scaleX, 'TWIN', 0);
                    this.scene.bulletPool.spawnBullet(p2x, p2y, this.aimAngle, dmg * 0.9, this, this.scaleX, 'TWIN', 0);
                    recoilDist = 4.2;
                } else if (gType === 'SHOTGUN') {
                    const spreadRad = Phaser.Math.DegToRad(9);
                    const angles = [
                        this.aimAngle - spreadRad * 2,
                        this.aimAngle - spreadRad,
                        this.aimAngle,
                        this.aimAngle + spreadRad,
                        this.aimAngle + spreadRad * 2
                    ];
                    for (let i = 0; i < angles.length; i++) {
                        this.scene.bulletPool.spawnBullet(spawnX, spawnY, angles[i], dmg * 0.72, this, this.scaleX, 'SHOTGUN', 0);
                    }
                    recoilDist = 6.8;
                } else if (gType === 'TRIPLE') {
                    const spreadRad = Phaser.Math.DegToRad(13);
                    [this.aimAngle - spreadRad, this.aimAngle, this.aimAngle + spreadRad].forEach(ang => {
                        this.scene.bulletPool.spawnBullet(spawnX, spawnY, ang, dmg * 0.85, this, this.scaleX, 'TRIPLE', 0);
                    });
                    recoilDist = 4.5;
                } else if (gType === 'CROSS') {
                    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(angOff => {
                        this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle + angOff, dmg * 0.95, this, this.scaleX, 'CROSS', 0);
                    });
                    recoilDist = 5.0;
                } else if (gType === 'GHOSTFIRE') {
                    const spreadJitter = (Math.random() - 0.5) * 0.12;
                    this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle + spreadJitter, dmg, this, this.scaleX, 'GHOSTFIRE', 0);
                    recoilDist = 1.8;
                } else if (gType === 'BOUNCING' || gType === 'DISC') {
                    this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle, dmg, this, this.scaleX, gType, gun.maxBounces || 2);
                    recoilDist = 4.0;
                } else if (gType === 'HOMING') {
                    this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle, dmg, this, this.scaleX, 'HOMING', 0);
                    recoilDist = 3.2;
                } else {
                    this.scene.bulletPool.spawnBullet(spawnX, spawnY, this.aimAngle, dmg, this, this.scaleX, gType, 0);
                    if (gType === 'SNIPER') recoilDist = 7.5;
                    else if (gType === 'METEOR' || gType === 'DOOM') recoilDist = 8.5;
                    else if (gType === 'MINIGUN') recoilDist = 1.5;
                    else recoilDist = 3.5;
                }

                if (window.PumpkinPanic.AudioSystem) {
                    if (gType === 'SHOTGUN') window.PumpkinPanic.AudioSystem.playShotgun();
                    else if (gType === 'GHOSTFIRE') window.PumpkinPanic.AudioSystem.playGhostfire();
                    else if (gType === 'HOMING') window.PumpkinPanic.AudioSystem.playHoming();
                    else window.PumpkinPanic.AudioSystem.playShoot();
                }
            }

            // Recoil animation
            this.x -= Math.cos(this.aimAngle) * recoilDist;
            this.y -= Math.sin(this.aimAngle) * recoilDist;

            // Muzzle spark
            this.scene.emitterManager.emitMuzzle(spawnX, spawnY, this.aimAngle);

            // Transmit firing request to authoritative multiplayer server
            if (this.scene.isMultiplayer && this.scene.networkAdapter && this.scene.networkAdapter.connected) {
                this.scene.networkAdapter.sendShoot(spawnX, spawnY, this.aimAngle);
            }
        }

        die(killer) {
            super.die(killer);
            if (this.aimGuide) {
                this.aimGuide.clear();
            }
            if (window.PumpkinPanic.AudioSystem) {
                window.PumpkinPanic.AudioSystem.playDefeat();
            }
        }

        destroy(fromScene) {
            if (this.aimGuide) {
                this.aimGuide.destroy();
            }
            super.destroy(fromScene);
        }
    }

    window.PumpkinPanic.Player = Player;
})();
