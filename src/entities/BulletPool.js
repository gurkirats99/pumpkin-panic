/**
 * PUMPKIN PANIC.IO - Projectile Pool System
 * Supports standard seeds and 3 original weapon mutations:
 * TRIPLE SHOT, RAPID FIRE, and BOUNCING SEEDS.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};
    const Config = window.PumpkinPanic.Config;

    class Bullet extends Phaser.Physics.Arcade.Sprite {
        constructor(scene, x, y) {
            super(scene, x, y, 'bullet_seed');
            this.scene = scene;
            this.owner = null;
            this.damage = Config.PLAYER.BASE_DAMAGE;
            this.lifespan = 0;
            this.birthTime = 0;
            this.mutationType = 'NORMAL';
            this.bouncesLeft = 0;

            scene.add.existing(this);
            scene.physics.add.existing(this);
            this.setDepth(11);
        }

        spawn(x, y, angle, damage, owner, scaleMultiplier = 1.0, mutationType = 'NORMAL', maxBounces = 0) {
            this.owner = owner;
            this.damage = damage;
            this.birthTime = this.scene.time.now;
            this.lifespan = Config.PLAYER.BULLET_LIFETIME;
            this.mutationType = mutationType;
            this.bouncesLeft = maxBounces;

            // Texture & Lifespan & Speed based on weapon archetype / mutation
            const typeToTex = {
                NORMAL: 'bullet_seed',
                SINGLE: 'bullet_seed',
                TWIN: 'bullet_double',
                RAPID: 'bullet_smg',
                SHOTGUN: 'bullet_shotgun',
                SNIPER: 'bullet_sniper',
                TRIPLE: 'bullet_triple',
                GHOSTFIRE: 'bullet_ghostfire',
                BOUNCING: 'bullet_bouncing',
                HOMING: 'bullet_homing',
                MINIGUN: 'bullet_minigun',
                TOXIC: 'bullet_toxic',
                PLASMA: 'bullet_plasma',
                HEX: 'bullet_hex',
                CROSS: 'bullet_cross',
                METEOR: 'bullet_meteor',
                SPIRIT: 'bullet_spirit',
                LIGHTNING: 'bullet_lightning',
                VOID: 'bullet_void',
                SCYTHE: 'bullet_scythe',
                DOOM: 'bullet_doom',
                STAR: 'bullet_star',
                DISC: 'bullet_disc'
            };

            let tex = typeToTex[mutationType] || 'bullet_seed';
            let speed = Config.PLAYER.BULLET_SPEED;
            let scaleBonus = 1.35; // Generous base scale for high visibility

            if (mutationType === 'RAPID') {
                speed *= 1.25;
                scaleBonus = 1.22;
            } else if (mutationType === 'MINIGUN') {
                speed *= 1.3;
                scaleBonus = 1.25;
            } else if (mutationType === 'SNIPER') {
                speed *= 1.75;
                this.lifespan = 1350;
                scaleBonus = 1.7; // Long, striking high-caliber rail bolt
            } else if (mutationType === 'LIGHTNING') {
                speed *= 1.85;
                this.lifespan = 850;
                scaleBonus = 1.45;
            } else if (mutationType === 'SHOTGUN') {
                speed *= 1.15;
                this.lifespan = 700;
                scaleBonus = 1.45; // Chunky blazing buckshot
            } else if (mutationType === 'GHOSTFIRE') {
                speed *= 1.35;
                this.lifespan = 900;
                scaleBonus = 1.35;
            } else if (mutationType === 'HOMING') {
                speed *= 0.94;
                this.lifespan = 2300;
                scaleBonus = 1.45;
            } else if (mutationType === 'METEOR' || mutationType === 'DOOM' || mutationType === 'STAR') {
                speed *= 1.25;
                scaleBonus = 1.75; // Giant apocalyptic projectiles
            } else if (mutationType === 'SCYTHE') {
                speed *= 1.25;
                scaleBonus = 1.65; // Wide spinning death scythe
            } else if (mutationType === 'DISC' || mutationType === 'BOUNCING') {
                this.bouncesLeft = maxBounces || 2;
                this.lifespan = 1500;
                scaleBonus = 1.55;
            } else if (mutationType === 'PLASMA' || mutationType === 'VOID') {
                scaleBonus = 1.5;
            } else if (mutationType === 'TOXIC' || mutationType === 'HEX' || mutationType === 'SPIRIT' || mutationType === 'CROSS') {
                scaleBonus = 1.4;
            }

            this.setTexture(tex);
            this.enableBody(true, x, y, true, true);
            this.setScale(scaleMultiplier * scaleBonus);
            this.setRotation(angle);

            this.currentSpeed = speed;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            this.setVelocity(vx, vy);

            const r = Config.PLAYER.BULLET_RADIUS * scaleMultiplier * 1.15;
            const halfW = (this.width && this.width > 0) ? (this.width / 2) : 18;
            this.body.setCircle(r, -r + halfW, -r + halfW);
            this.body.setCollideWorldBounds(true);
            this.body.onWorldBounds = true;
            const isBouncer = (mutationType === 'BOUNCING' || mutationType === 'DISC');
            this.body.bounce.set(isBouncer ? 1.0 : 0);
        }

        handleBounce() {
            if ((this.mutationType === 'BOUNCING' || this.mutationType === 'DISC') && this.bouncesLeft > 0) {
                this.bouncesLeft--;
                this.setRotation(Math.atan2(this.body.velocity.y, this.body.velocity.x));
                if (this.scene.emitterManager) {
                    this.scene.emitterManager.emitSpark(this.x, this.y);
                }
                return true;
            }
            return false;
        }

        update(time, delta) {
            if (!this.active) return;

            // Spinning projectiles: SCYTHE, DISC, STAR, HEX, BOUNCING
            if (this.mutationType === 'SCYTHE' || this.mutationType === 'DISC' || this.mutationType === 'STAR' || this.mutationType === 'HEX' || this.mutationType === 'BOUNCING') {
                this.rotation += 0.24;
            }

            // Vivid particle sparks for weapon trails
            if (this.scene && this.scene.emitterManager && Math.random() < 0.28) {
                if (this.mutationType === 'METEOR' || this.mutationType === 'DOOM' || this.mutationType === 'SHOTGUN') {
                    this.scene.emitterManager.emitSpark(this.x, this.y);
                } else if (this.mutationType === 'LIGHTNING' || this.mutationType === 'PLASMA' || this.mutationType === 'VOID' || this.mutationType === 'STAR' || this.mutationType === 'GHOSTFIRE') {
                    this.scene.emitterManager.emitSpark(this.x, this.y);
                }
            }

            // HOMING WEAPON: Seek and curve towards nearest enemy pumpkin
            if (this.mutationType === 'HOMING' && this.scene && this.scene.entitiesGroup) {
                let target = null;
                let minDist = 580; // Homing detection radius
                const bx = this.x;
                const by = this.y;

                this.scene.entitiesGroup.children.iterate((ent) => {
                    if (ent && !ent.isDead && ent !== this.owner && ent.active) {
                        const d = Phaser.Math.Distance.Between(bx, by, ent.x, ent.y);
                        if (d < minDist) {
                            minDist = d;
                            target = ent;
                        }
                    }
                });

                if (target) {
                    const targetAngle = Phaser.Math.Angle.Between(bx, by, target.x, target.y);
                    const currentAngle = Math.atan2(this.body.velocity.y, this.body.velocity.x);
                    const steerRate = 0.085; // smooth seeking curve
                    const newAngle = Phaser.Math.Angle.RotateTo(currentAngle, targetAngle, steerRate);

                    this.setRotation(newAngle);
                    const spd = this.currentSpeed || (Config.PLAYER.BULLET_SPEED * 0.92);
                    this.setVelocity(Math.cos(newAngle) * spd, Math.sin(newAngle) * spd);

                    // Ethereal soul trail spark
                    if (this.scene.emitterManager && Math.random() < 0.25) {
                        this.scene.emitterManager.emitSpark(bx, by);
                    }
                }
            }

            if (time - this.birthTime > this.lifespan) {
                this.deactivate();
            }
        }

        deactivate() {
            this.disableBody(true, true);
            this.owner = null;
            this.mutationType = 'NORMAL';
            this.bouncesLeft = 0;
        }
    }

    class BulletPool {
        constructor(scene) {
            this.scene = scene;
            this.group = scene.physics.add.group({
                classType: Bullet,
                maxSize: 400,
                runChildUpdate: true
            });

            // Listen to world bounds collisions
            scene.physics.world.on('worldbounds', (body) => {
                if (body.gameObject && body.gameObject instanceof Bullet && body.gameObject.active) {
                    const bullet = body.gameObject;
                    if (!bullet.handleBounce()) {
                        this.scene.emitterManager.emitSpark(body.x, body.y);
                        bullet.deactivate();
                    }
                }
            });
        }

        spawnBullet(x, y, angle, damage, owner, scaleMultiplier = 1.0, mutationType = 'NORMAL', maxBounces = 0) {
            let bullet = this.group.getFirstDead(false);

            if (!bullet) {
                if (this.group.getLength() < this.group.maxSize) {
                    bullet = new Bullet(this.scene, x, y);
                    this.group.add(bullet);
                } else {
                    return null;
                }
            }

            bullet.spawn(x, y, angle, damage, owner, scaleMultiplier, mutationType, maxBounces);
            return bullet;
        }

        clear() {
            this.group.children.iterate((bullet) => {
                if (bullet && bullet.active) {
                    bullet.deactivate();
                }
            });
        }
    }

    window.PumpkinPanic.BulletPool = BulletPool;
})();
