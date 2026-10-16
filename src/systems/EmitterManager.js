/**
 * PUMPKIN PANIC.IO - Particle & Visual Effects System
 * Manages atmospheric mist, hit sparks, level up bursts, and juice splats.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};

    class EmitterManager {
        constructor(scene) {
            this.scene = scene;
            this.setupEmitters();
        }

        setupEmitters() {
            // Hit / Impact Spark Particles
            this.sparkEmitter = this.scene.add.particles(0, 0, 'particle_spark', {
                speed: { min: 40, max: 140 },
                scale: { start: 0.8, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: 250,
                blendMode: 'ADD',
                emitting: false
            }).setDepth(15);

            // Splat / Juice Particles
            this.splatEmitter = this.scene.add.particles(0, 0, 'particle_splat', {
                speed: { min: 60, max: 220 },
                scale: { start: 1.0, end: 0.2 },
                alpha: { start: 0.9, end: 0 },
                lifespan: 450,
                emitting: false
            }).setDepth(14);

            // Ambient Floating Fog / Mist Particles across arena
            this.mistEmitter = this.scene.add.particles(0, 0, 'particle_mist', {
                x: { min: 0, max: window.PumpkinPanic.Config.WORLD.WIDTH },
                y: { min: 0, max: window.PumpkinPanic.Config.WORLD.HEIGHT },
                speedX: { min: -15, max: 15 },
                speedY: { min: -8, max: 8 },
                scale: { min: 1.2, max: 2.5 },
                alpha: { start: 0.22, end: 0 },
                lifespan: 6000,
                frequency: 180,
                maxParticles: 45,
                blendMode: 'SCREEN'
            }).setDepth(5);
        }

        emitSpark(x, y) {
            this.sparkEmitter.emitParticleAt(x, y, 6);
        }

        emitMuzzle(x, y, angle) {
            // Small spark burst along firing vector
            this.sparkEmitter.emitParticleAt(x, y, 4);
        }

        emitSeedCollect(x, y, isSuper) {
            this.sparkEmitter.emitParticleAt(x, y, isSuper ? 14 : 6);
        }

        emitDeath(x, y, skinKey) {
            // Juice splats and sparks
            this.splatEmitter.emitParticleAt(x, y, 18);
            this.sparkEmitter.emitParticleAt(x, y, 16);
        }

        emitLevelUp(x, y) {
            // Golden circular burst
            this.sparkEmitter.emitParticleAt(x, y, 24);
        }

        emitExplosion(x, y) {
            // Fiery massive burst for explosive seed detonations
            this.splatEmitter.emitParticleAt(x, y, 26);
            this.sparkEmitter.emitParticleAt(x, y, 32);
        }

        destroy() {
            if (this.sparkEmitter) this.sparkEmitter.destroy();
            if (this.splatEmitter) this.splatEmitter.destroy();
            if (this.mistEmitter) this.mistEmitter.destroy();
        }
    }

    window.PumpkinPanic.EmitterManager = EmitterManager;
})();
