/**
 * PUMPKIN PANIC.IO - Pumpkin Storm System
 * Shrinking danger circle with warning sirens, visual storm barrier, and outside-zone damage.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};
    const Config = window.PumpkinPanic.Config;

    class StormSystem {
        constructor(scene) {
            this.scene = scene;
            this.center = {
                x: Config.WORLD.WIDTH / 2,
                y: Config.WORLD.HEIGHT / 2
            };

            this.currentRadius = Config.STORM.PHASES[0].safeRadius;
            this.targetRadius = this.currentRadius;
            this.currentPhaseIndex = 0;

            // State: 'WAITING', 'WARNING', 'SHRINKING', 'FINAL'
            this.state = 'WAITING';
            this.phaseTimer = Config.STORM.INITIAL_DELAY;
            this.damageTimer = 0;

            // Visual graphics layer for the storm
            this.stormGraphics = scene.add.graphics().setDepth(20);
            this.borderGraphics = scene.add.graphics().setDepth(21);

            // Pulsing animation accumulator
            this.pulseTime = 0;
        }

        update(time, delta) {
            const dtSec = delta / 1000;
            this.pulseTime += delta * 0.003;

            // State Machine
            if (this.state === 'WAITING') {
                this.phaseTimer -= dtSec;
                if (this.phaseTimer <= Config.STORM.WARNING_TIME) {
                    this.state = 'WARNING';
                    if (window.PumpkinPanic.AudioSystem) {
                        window.PumpkinPanic.AudioSystem.playStormWarning();
                    }
                    this.scene.events.emit('storm_warning', {
                        timeRemaining: Math.ceil(this.phaseTimer)
                    });
                }
            } else if (this.state === 'WARNING') {
                this.phaseTimer -= dtSec;
                if (this.phaseTimer <= 0) {
                    this.startShrinking();
                }
            } else if (this.state === 'SHRINKING') {
                this.phaseTimer -= dtSec;
                const progress = 1 - Math.max(0, this.phaseTimer / Config.STORM.SHRINK_TIME);
                this.currentRadius = Phaser.Math.Linear(this.startRadius, this.targetRadius, progress);

                if (this.phaseTimer <= 0) {
                    this.currentRadius = this.targetRadius;
                    this.advancePhase();
                }
            }

            // Outside Zone Damage Tick
            this.damageTimer += delta;
            if (this.damageTimer >= Config.STORM.DAMAGE_INTERVAL) {
                this.damageTimer = 0;
                this.applyStormDamage();
            }

            // Render visual storm barrier
            this.renderStormVisuals();
        }

        startShrinking() {
            this.state = 'SHRINKING';
            this.startRadius = this.currentRadius;
            const nextPhase = Config.STORM.PHASES[this.currentPhaseIndex];
            this.targetRadius = nextPhase.safeRadius;
            this.phaseTimer = Config.STORM.SHRINK_TIME;

            this.scene.events.emit('storm_shrinking', {
                targetRadius: this.targetRadius,
                duration: Config.STORM.SHRINK_TIME
            });
        }

        advancePhase() {
            this.currentPhaseIndex++;
            if (this.currentPhaseIndex < Config.STORM.PHASES.length) {
                this.state = 'WAITING';
                this.phaseTimer = Config.STORM.INITIAL_DELAY;
            } else {
                this.state = 'FINAL';
                this.phaseTimer = 0;
            }
        }

        isOutsideSafeZone(x, y) {
            const dist = Phaser.Math.Distance.Between(x, y, this.center.x, this.center.y);
            return dist > this.currentRadius;
        }

        isNearDanger(x, y, margin = 80) {
            const dist = Phaser.Math.Distance.Between(x, y, this.center.x, this.center.y);
            return dist > (this.currentRadius - margin);
        }

        applyStormDamage() {
            // In online multiplayer mode, storm damage is authoritative from the server
            if (this.scene && this.scene.isMultiplayer) return;

            // Check player
            const player = this.scene.player;
            if (player && !player.isDead && this.isOutsideSafeZone(player.x, player.y)) {
                const dmg = player.maxHealth * Config.STORM.DAMAGE_PERCENT;
                player.takeDamage(dmg, null);
                // Trigger camera subtle shake and storm overlay flash
                this.scene.cameras.main.shake(120, 0.003);
            }

            // Check bots
            if (this.scene.bots) {
                for (let i = 0; i < this.scene.bots.length; i++) {
                    const bot = this.scene.bots[i];
                    if (bot && !bot.isDead && this.isOutsideSafeZone(bot.x, bot.y)) {
                        const dmg = bot.maxHealth * Config.STORM.DAMAGE_PERCENT;
                        bot.takeDamage(dmg, null);
                    }
                }
            }
        }

        renderStormVisuals() {
            this.stormGraphics.clear();
            this.borderGraphics.clear();

            const cx = this.center.x;
            const cy = this.center.y;
            const r = this.currentRadius;

            // Draw menacing dark purple vortex outside safe zone using concentric rings
            const maxWorldR = Config.WORLD.WIDTH * 0.75;
            this.stormGraphics.fillStyle(0x35084a, 0.42);

            // Path with circle hole
            this.stormGraphics.beginPath();
            this.stormGraphics.arc(cx, cy, maxWorldR, 0, Math.PI * 2, false);
            this.stormGraphics.arc(cx, cy, r, 0, Math.PI * 2, true);
            this.stormGraphics.closePath();
            this.stormGraphics.fillPath();

            // Glowing pulsating border ring
            const pulse = (Math.sin(this.pulseTime) + 1) * 0.5;
            const borderColor = (this.state === 'WARNING' || this.state === 'SHRINKING') ? 0xff2a55 : 0xa832eb;
            const borderWidth = 4 + pulse * 4;

            this.borderGraphics.lineStyle(borderWidth, borderColor, 0.85);
            this.borderGraphics.strokeCircle(cx, cy, r);

            // Subtle inner dashed ring
            this.borderGraphics.lineStyle(1.5, 0xffffff, 0.35 + pulse * 0.35);
            this.borderGraphics.strokeCircle(cx, cy, r - 6);
        }

        getStatusInfo() {
            return {
                state: this.state,
                phase: this.currentPhaseIndex + 1,
                maxPhases: Config.STORM.PHASES.length,
                timeLeft: Math.max(0, Math.ceil(this.phaseTimer)),
                currentRadius: this.currentRadius,
                safeCenter: this.center
            };
        }

        destroy() {
            if (this.stormGraphics) this.stormGraphics.destroy();
            if (this.borderGraphics) this.borderGraphics.destroy();
        }
    }

    window.PumpkinPanic.StormSystem = StormSystem;
})();
