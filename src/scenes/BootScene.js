/**
 * PUMPKIN PANIC.IO - Boot Scene & Procedural Asset Generator
 * Procedurally generates all character sprites, skins, environment elements,
 * seeds, projectiles, particle textures, and HD skin shop previews.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};
    const Config = window.PumpkinPanic.Config;

    class BootScene extends Phaser.Scene {
        constructor() {
            super({ key: 'BootScene' });
        }

        preload() {
            if (window.PumpkinPanic.CrazyGames) {
                window.PumpkinPanic.CrazyGames.loadingStart();
            }
        }

        create() {
            window.PumpkinPanic.skinPreviews = {};
            window.PumpkinPanic.gunPreviews = {};

            const progressBar = document.getElementById('loading-progress-bar');
            const pctText = document.getElementById('loading-pct-text');
            const statusText = document.getElementById('loading-status-text');

            if (progressBar) progressBar.style.width = '35%';
            if (pctText) pctText.innerText = '35%';
            if (statusText) statusText.innerText = 'Generating Pumpkin Skins...';

            this.generateAllTextures();

            if (progressBar) progressBar.style.width = '100%';
            if (pctText) pctText.innerText = '100%';
            if (statusText) statusText.innerText = 'Arena Ready!';

            // Signal CrazyGames loadingStop
            if (window.PumpkinPanic.CrazyGames) {
                window.PumpkinPanic.CrazyGames.loadingStop();
            }

            // Smoothly hide loading screen
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                setTimeout(() => {
                    loadingScreen.classList.add('fade-out');
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                    }, 500);
                }, 300);
            }

            // Refresh UI Skin & Gun Armory Shops so HD preview images appear immediately
            if (window.PumpkinPanic.ui) {
                window.PumpkinPanic.ui.initSkinSelector();
                if (window.PumpkinPanic.ui.initGunSelector) {
                    window.PumpkinPanic.ui.initGunSelector();
                }
            }

            this.scene.start('GameScene');
        }

        generateAllTextures() {
            // 1. Generate Pumpkin Body & Face Textures for all skins
            for (const [key, palette] of Object.entries(Config.SKINS)) {
                this.generatePumpkinBodyTexture(key, palette);
                this.generatePumpkinFaceTexture(key, palette);
                this.generateCombinedSkinPreview(key, palette);
            }

            // 2. Generate Seeds & Projectiles for all weapons
            this.generateBulletTexture();
            this.generateGunPreviews();
            this.generateSeedTextures();

            // 3. Generate Environment Elements
            this.generateTreeTexture();
            this.generateTombstoneTexture();
            this.generateFenceTexture();
            this.generateGrassTexture();

            // 4. Generate Particle Textures
            this.generateParticleTextures();
        }

        generatePumpkinBodyTexture(key, palette) {
            const size = 80;
            const canvas = this.textures.createCanvas('pumpkin_' + key, size, size);
            const ctx = canvas.context;
            const cx = size / 2;
            const cy = size / 2 + 3;

            ctx.clearRect(0, 0, size, size);

            // ==========================================
            // TOP STEM / HORNS / CROWN
            // ==========================================
            ctx.save();
            if (key === 'inferno' || key === 'apocalypse') {
                // 🔥 Demonic Curving Flame Horns & Dark Core!
                ctx.fillStyle = key === 'apocalypse' ? '#dc2626' : '#ff3300';
                ctx.shadowColor = '#ff6600';
                ctx.shadowBlur = 10;

                // Left Demon Horn
                ctx.beginPath();
                ctx.moveTo(cx - 10, cy - 22);
                ctx.quadraticCurveTo(cx - 20, cy - 36, cx - 24, cy - 44);
                ctx.quadraticCurveTo(cx - 12, cy - 34, cx - 4, cy - 23);
                ctx.closePath();
                ctx.fill();

                // Right Demon Horn
                ctx.beginPath();
                ctx.moveTo(cx + 10, cy - 22);
                ctx.quadraticCurveTo(cx + 20, cy - 36, cx + 24, cy - 44);
                ctx.quadraticCurveTo(cx + 12, cy - 34, cx + 4, cy - 23);
                ctx.closePath();
                ctx.fill();

                // Center Hellfire Core Spike
                ctx.fillStyle = key === 'apocalypse' ? '#fbbf24' : '#ffaa00';
                ctx.beginPath();
                ctx.moveTo(cx - 3, cy - 22);
                ctx.lineTo(cx, cy - 38);
                ctx.lineTo(cx + 3, cy - 22);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (key === 'celestial' || key === 'cosmic') {
                // 🌟 Glowing Solar Angel Halo
                ctx.strokeStyle = key === 'celestial' ? '#fde047' : '#c084fc';
                ctx.shadowColor = key === 'celestial' ? '#facc15' : '#a855f7';
                ctx.shadowBlur = 12;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.ellipse(cx, cy - 34, 18, 6, 0, 0, Math.PI * 2);
                ctx.stroke();

                // Star on top
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(cx, cy - 34, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (key === 'cyber') {
                // High-tech Cyber Antenna & Neon Nodes
                ctx.fillStyle = '#475569';
                ctx.fillRect(cx - 2, cy - 36, 4, 15);
                ctx.fillStyle = '#00f0ff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(cx, cy - 38, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (key === 'golden' || key === 'royal') {
                // 24K Royal Crown on top
                ctx.fillStyle = key === 'royal' ? '#c084fc' : '#ffd700';
                ctx.shadowColor = '#ffea00';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.moveTo(cx - 12, cy - 22);
                ctx.lineTo(cx - 14, cy - 34);
                ctx.lineTo(cx - 6, cy - 28);
                ctx.lineTo(cx, cy - 36);
                ctx.lineTo(cx + 6, cy - 28);
                ctx.lineTo(cx + 14, cy - 34);
                ctx.lineTo(cx + 12, cy - 22);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (key === 'necromancer') {
                // 💀 Bone Skull Horns
                ctx.fillStyle = '#e2e8f0';
                ctx.beginPath();
                ctx.moveTo(cx - 8, cy - 22);
                ctx.quadraticCurveTo(cx - 16, cy - 34, cx - 18, cy - 40);
                ctx.quadraticCurveTo(cx - 10, cy - 32, cx - 3, cy - 23);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx + 8, cy - 22);
                ctx.quadraticCurveTo(cx + 16, cy - 34, cx + 18, cy - 40);
                ctx.quadraticCurveTo(cx + 10, cy - 32, cx + 3, cy - 23);
                ctx.closePath();
                ctx.fill();
            } else if (key === 'frost') {
                // ❄️ Glacial Icicle Spikes
                ctx.fillStyle = '#93c5fd';
                ctx.beginPath();
                ctx.moveTo(cx - 9, cy - 22);
                ctx.lineTo(cx - 6, cy - 35);
                ctx.lineTo(cx - 2, cy - 23);
                ctx.lineTo(cx, cy - 39);
                ctx.lineTo(cx + 2, cy - 23);
                ctx.lineTo(cx + 6, cy - 35);
                ctx.lineTo(cx + 9, cy - 22);
                ctx.closePath();
                ctx.fill();
            } else {
                // Classic Woody Curved Stem & Leaf
                ctx.fillStyle = this.colorToHex(palette.stemColor || 0x48a02c);
                ctx.beginPath();
                ctx.moveTo(cx - 3, cy - 23);
                ctx.quadraticCurveTo(cx - 1, cy - 36, cx + 8, cy - 37);
                ctx.quadraticCurveTo(cx + 5, cy - 31, cx + 4, cy - 23);
                ctx.closePath();
                ctx.fill();

                // Cute green leaf
                ctx.fillStyle = '#65c43d';
                ctx.beginPath();
                ctx.ellipse(cx + 7, cy - 31, 4.5, 3, Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();

            // ==========================================
            // PUMPKIN BODY LOBES
            // ==========================================
            const bodyColor = this.colorToHex(palette.bodyColor);
            const ribColor = this.colorToHex(palette.ribColor);

            if (key === 'inferno') {
                // Molten Obsidian Lava Body with Glowing Fissures
                ctx.save();
                ctx.shadowColor = '#ff4400';
                ctx.shadowBlur = 12;

                // Left lobe
                ctx.fillStyle = '#3a0808';
                ctx.beginPath();
                ctx.ellipse(cx - 17, cy, 15, 25, -0.2, 0, Math.PI * 2);
                ctx.fill();

                // Right lobe
                ctx.beginPath();
                ctx.ellipse(cx + 17, cy, 15, 25, 0.2, 0, Math.PI * 2);
                ctx.fill();

                // Mid lobes
                ctx.fillStyle = '#200404';
                ctx.beginPath();
                ctx.ellipse(cx - 9, cy, 16, 26, -0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx + 9, cy, 16, 26, 0.1, 0, Math.PI * 2);
                ctx.fill();

                // Center lobe
                ctx.beginPath();
                ctx.ellipse(cx, cy, 17, 27, 0, 0, Math.PI * 2);
                ctx.fill();

                // Glowing Molten Lava Fissure Veins
                ctx.strokeStyle = '#ff6600';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(cx - 12, cy - 14);
                ctx.lineTo(cx - 16, cy + 8);
                ctx.moveTo(cx + 12, cy - 14);
                ctx.lineTo(cx + 16, cy + 8);
                ctx.moveTo(cx - 4, cy + 14);
                ctx.lineTo(cx + 6, cy + 18);
                ctx.stroke();

                ctx.strokeStyle = '#ffee33';
                ctx.lineWidth = 1.0;
                ctx.stroke();
                ctx.restore();
            } else if (key === 'cyber') {
                // High-Tech Cyber Armor with Hex / Circuit Grooves
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.ellipse(cx - 17, cy, 15, 25, -0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx + 17, cy, 15, 25, 0.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#1e293b';
                ctx.beginPath();
                ctx.ellipse(cx - 9, cy, 16, 26, -0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx + 9, cy, 16, 26, 0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx, cy, 17, 27, 0, 0, Math.PI * 2);
                ctx.fill();

                // Glowing Cyan Circuit Traces
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.moveTo(cx - 15, cy - 8);
                ctx.lineTo(cx - 20, cy + 10);
                ctx.lineTo(cx - 14, cy + 18);
                ctx.moveTo(cx + 15, cy - 8);
                ctx.lineTo(cx + 20, cy + 10);
                ctx.lineTo(cx + 14, cy + 18);
                ctx.stroke();
            } else {
                // Standard & Special Organic Lobes
                ctx.fillStyle = ribColor;
                ctx.beginPath();
                ctx.ellipse(cx - 17, cy, 15, 25, -0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx + 17, cy, 15, 25, 0.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.ellipse(cx - 9, cy, 16, 26, -0.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx + 9, cy, 16, 26, 0.1, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.ellipse(cx, cy, 17, 27, 0, 0, Math.PI * 2);
                ctx.fill();

                // Outer border stroke
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.ellipse(cx, cy, 29, 26, 0, 0, Math.PI * 2);
                ctx.stroke();

                // Top-Left highlight sheen
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.beginPath();
                ctx.ellipse(cx - 12, cy - 10, 6, 12, -0.3, 0, Math.PI * 2);
                ctx.fill();
            }

            canvas.refresh();
        }

        generatePumpkinFaceTexture(key, palette) {
            const size = 80;
            const canvas = this.textures.createCanvas('face_' + key, size, size);
            const ctx = canvas.context;
            const cx = size / 2;
            const cy = size / 2 + 4;

            ctx.clearRect(0, 0, size, size);

            const eyeColor = this.colorToHex(palette.eyeColor);
            const glowColor = this.colorToHex(palette.glowColor);

            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 8;
            ctx.fillStyle = eyeColor;

            if (key === 'inferno') {
                // Blazing Demon Eyes with Fiery Flame Points
                ctx.beginPath();
                ctx.moveTo(cx - 18, cy - 10);
                ctx.quadraticCurveTo(cx - 12, cy - 18, cx - 6, cy - 8);
                ctx.lineTo(cx - 11, cy - 2);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(cx + 18, cy - 10);
                ctx.quadraticCurveTo(cx + 12, cy - 18, cx + 6, cy - 8);
                ctx.lineTo(cx + 11, cy - 2);
                ctx.closePath();
                ctx.fill();

                // Demonic Hellfire Fangs
                ctx.fillStyle = '#ffbb00';
                ctx.beginPath();
                ctx.moveTo(cx - 18, cy + 7);
                ctx.lineTo(cx - 12, cy + 6);
                ctx.lineTo(cx - 9, cy + 14); // sharp fang
                ctx.lineTo(cx - 5, cy + 7);
                ctx.lineTo(cx, cy + 13);
                ctx.lineTo(cx + 5, cy + 7);
                ctx.lineTo(cx + 9, cy + 14); // sharp fang
                ctx.lineTo(cx + 12, cy + 6);
                ctx.lineTo(cx + 18, cy + 7);
                ctx.quadraticCurveTo(cx, cy + 22, cx - 18, cy + 7);
                ctx.closePath();
                ctx.fill();
            } else if (key === 'cyber') {
                // Sleek Neon Visor Slit
                ctx.fillRect(cx - 18, cy - 8, 36, 6);
                // Digital Dot Smile
                ctx.fillRect(cx - 14, cy + 9, 5, 4);
                ctx.fillRect(cx - 6, cy + 11, 4, 4);
                ctx.fillRect(cx + 2, cy + 11, 4, 4);
                ctx.fillRect(cx + 9, cy + 9, 5, 4);
            } else {
                // Carved Jack-o'-Lantern Eyes
                ctx.beginPath();
                ctx.moveTo(cx - 16, cy - 8);
                ctx.lineTo(cx - 5, cy - 5);
                ctx.lineTo(cx - 9, cy);
                ctx.closePath();
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(cx + 16, cy - 8);
                ctx.lineTo(cx + 5, cy - 5);
                ctx.lineTo(cx + 9, cy);
                ctx.closePath();
                ctx.fill();

                // Nose
                ctx.beginPath();
                ctx.moveTo(cx, cy - 1);
                ctx.lineTo(cx - 3, cy + 3);
                ctx.lineTo(cx + 3, cy + 3);
                ctx.closePath();
                ctx.fill();

                // Toothy Grin
                ctx.beginPath();
                ctx.moveTo(cx - 17, cy + 8);
                ctx.quadraticCurveTo(cx - 10, cy + 7, cx - 7, cy + 10);
                ctx.lineTo(cx - 5, cy + 8);
                ctx.lineTo(cx - 3, cy + 11);
                ctx.lineTo(cx, cy + 9);
                ctx.lineTo(cx + 3, cy + 11);
                ctx.lineTo(cx + 5, cy + 8);
                ctx.lineTo(cx + 7, cy + 10);
                ctx.quadraticCurveTo(cx + 10, cy + 7, cx + 17, cy + 8);
                ctx.quadraticCurveTo(cx, cy + 20, cx - 17, cy + 8);
                ctx.closePath();
                ctx.fill();
            }

            ctx.shadowBlur = 0;
            canvas.refresh();
        }

        generateCombinedSkinPreview(key, palette) {
            // Composite body + face together into an HD 80x80 preview image
            const size = 80;
            const canvas = this.textures.createCanvas('preview_' + key, size, size);
            const ctx = canvas.context;

            ctx.clearRect(0, 0, size, size);

            const bodyCanvas = this.textures.get('pumpkin_' + key).getSourceImage();
            const faceCanvas = this.textures.get('face_' + key).getSourceImage();

            if (bodyCanvas) ctx.drawImage(bodyCanvas, 0, 0);
            if (faceCanvas) ctx.drawImage(faceCanvas, 0, 0);

            canvas.refresh();

            // Export to data URL for clean UI display
            try {
                window.PumpkinPanic.skinPreviews[key] = canvas.canvas.toDataURL();
            } catch (e) {}
        }

        generateBulletTexture() {
            // 1. Normal Bullet (Golden Seed)
            {
                const size = 36;
                const canvas = this.textures.createCanvas('bullet_seed', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
                grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
                grad.addColorStop(0.35, 'rgba(255, 170, 0, 0.9)');
                grad.addColorStop(0.7, 'rgba(234, 88, 12, 0.4)');
                grad.addColorStop(1, 'rgba(180, 50, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.moveTo(9, 0);
                ctx.quadraticCurveTo(0, -6, -8, -4);
                ctx.quadraticCurveTo(-11, 0, -8, 4);
                ctx.quadraticCurveTo(0, 6, 9, 0);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#c2410c';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                // Bright center core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(1, 0, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                canvas.refresh();
            }

            // 2. TRIPLE SHOT Bullet (Emerald Broadside Shard)
            {
                const size = 36;
                const canvas = this.textures.createCanvas('bullet_triple', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
                grad.addColorStop(0, 'rgba(209, 250, 229, 1)');
                grad.addColorStop(0.4, 'rgba(16, 185, 129, 0.9)');
                grad.addColorStop(0.75, 'rgba(5, 150, 105, 0.35)');
                grad.addColorStop(1, 'rgba(4, 120, 87, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#a7f3d0';
                ctx.beginPath();
                ctx.moveTo(11, 0);
                ctx.lineTo(-4, -6);
                ctx.lineTo(-9, 0);
                ctx.lineTo(-4, 6);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#047857';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-2, -1.5, 5, 3);
                ctx.restore();
                canvas.refresh();
            }

            // 3. RAPID FIRE Bullet (Electric Cyan Needle)
            {
                const size = 36;
                const canvas = this.textures.createCanvas('bullet_rapid', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
                grad.addColorStop(0, 'rgba(236, 254, 255, 1)');
                grad.addColorStop(0.4, 'rgba(6, 182, 212, 0.9)');
                grad.addColorStop(1, 'rgba(8, 145, 178, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(13, 0);
                ctx.lineTo(-9, -4);
                ctx.lineTo(-5, 0);
                ctx.lineTo(-9, 4);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#0891b2';
                ctx.lineWidth = 1.4;
                ctx.stroke();
                ctx.restore();
                canvas.refresh();
            }

            // 4. BOUNCING SEEDS Bullet (Mystic Violet Ricochet Crystal)
            {
                const size = 38;
                const canvas = this.textures.createCanvas('bullet_bouncing', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 17);
                grad.addColorStop(0, 'rgba(250, 232, 255, 1)');
                grad.addColorStop(0.45, 'rgba(217, 70, 239, 0.9)');
                grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 17, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#f0abfc';
                ctx.beginPath();
                ctx.moveTo(11, 0);
                ctx.lineTo(0, -8);
                ctx.lineTo(-10, 0);
                ctx.lineTo(0, 8);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#a21caf';
                ctx.lineWidth = 1.6;
                ctx.stroke();
                // Facet highlight
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(10, 0);
                ctx.lineTo(0, -7);
                ctx.lineTo(-3, 0);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                canvas.refresh();
            }

            // 5. SHOTGUN Bullet (Heavy Molten Buckshot Pellet)
            {
                const size = 36;
                const canvas = this.textures.createCanvas('bullet_shotgun', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
                grad.addColorStop(0, 'rgba(255, 255, 220, 1)');
                grad.addColorStop(0.35, 'rgba(249, 115, 22, 0.95)');
                grad.addColorStop(0.7, 'rgba(220, 38, 38, 0.5)');
                grad.addColorStop(1, 'rgba(185, 28, 28, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#ea580c';
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffedd5';
                ctx.beginPath();
                ctx.arc(-1, -1, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                canvas.refresh();
            }

            // 6. GHOSTFIRE Bullet (Piercing Violet Soul Flame)
            {
                const size = 38;
                const canvas = this.textures.createCanvas('bullet_ghostfire', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 17);
                grad.addColorStop(0, 'rgba(243, 232, 255, 1)');
                grad.addColorStop(0.45, 'rgba(168, 85, 247, 0.9)');
                grad.addColorStop(1, 'rgba(107, 33, 168, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 17, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#d8b4fe';
                ctx.beginPath();
                ctx.moveTo(12, 0);
                ctx.quadraticCurveTo(2, -9, -8, -3);
                ctx.quadraticCurveTo(-4, 0, -8, 3);
                ctx.quadraticCurveTo(2, 9, 12, 0);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(1, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                canvas.refresh();
            }

            // 7. HOMING SPECTRE Bullet (Seeking Phantom Skull)
            {
                const size = 38;
                const canvas = this.textures.createCanvas('bullet_homing', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 17);
                grad.addColorStop(0, 'rgba(224, 242, 254, 1)');
                grad.addColorStop(0.45, 'rgba(56, 189, 248, 0.9)');
                grad.addColorStop(1, 'rgba(2, 132, 199, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 17, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#bae6fd';
                ctx.beginPath();
                ctx.arc(1, 0, 7.5, 0, Math.PI * 2);
                ctx.fill();
                // Wispy phantom tail
                ctx.beginPath();
                ctx.moveTo(-5, -4);
                ctx.lineTo(-12, 0);
                ctx.lineTo(-5, 4);
                ctx.closePath();
                ctx.fill();
                // Dark glowing eyes
                ctx.fillStyle = '#0369a1';
                ctx.beginPath();
                ctx.arc(2, -3, 2, 0, Math.PI * 2);
                ctx.arc(2, 3, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                canvas.refresh();
            }

            // 8. DOUBLE_TAP Bullet (Twin Lime Energy Bolts)
            {
                const size = 36;
                const canvas = this.textures.createCanvas('bullet_double', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
                grad.addColorStop(0, 'rgba(236, 252, 203, 1)');
                grad.addColorStop(0.45, 'rgba(132, 204, 22, 0.9)');
                grad.addColorStop(1, 'rgba(77, 124, 15, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#bef264';
                // Twin parallel darts
                ctx.fillRect(-7, -5, 14, 3.5);
                ctx.fillRect(-7, 1.5, 14, 3.5);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-2, -4.5, 6, 2.5);
                ctx.fillRect(-2, 2, 6, 2.5);
                ctx.restore();
                canvas.refresh();
            }

            // 9. PUMPKIN_SMG Bullet (Vine Blaster Thorn)
            {
                const size = 36;
                const canvas = this.textures.createCanvas('bullet_smg', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
                grad.addColorStop(0, 'rgba(207, 250, 254, 1)');
                grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.9)');
                grad.addColorStop(1, 'rgba(8, 145, 178, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(11, 0);
                ctx.lineTo(-8, -3);
                ctx.lineTo(-5, 0);
                ctx.lineTo(-8, 3);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#0891b2';
                ctx.lineWidth = 1.2;
                ctx.stroke();
                ctx.restore();
                canvas.refresh();
            }

            // 10. SNIPER_SEED Bullet (Haunted Longshot High-Caliber Rail Spear)
            {
                const size = 42;
                const canvas = this.textures.createCanvas('bullet_sniper', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 19);
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.35, 'rgba(244, 114, 182, 0.95)');
                grad.addColorStop(0.7, 'rgba(236, 72, 153, 0.5)');
                grad.addColorStop(1, 'rgba(190, 24, 93, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 19, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#ffffff';
                // Long sharp rail dart
                ctx.beginPath();
                ctx.moveTo(16, 0);
                ctx.lineTo(-12, -4.5);
                ctx.lineTo(-7, 0);
                ctx.lineTo(-12, 4.5);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#db2777';
                ctx.lineWidth = 1.8;
                ctx.stroke();
                // Glowing magenta power core
                ctx.fillStyle = '#ec4899';
                ctx.fillRect(-2, -1.5, 8, 3);
                ctx.restore();
                canvas.refresh();
            }

            // 11. MINIGUN Bullet (Hot Golden Vulcan Tracer)
            {
                const size = 36;
                const canvas = this.textures.createCanvas('bullet_minigun', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 16);
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.4, 'rgba(234, 179, 8, 0.95)');
                grad.addColorStop(1, 'rgba(161, 98, 7, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 16, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#fef08a';
                ctx.fillRect(-7, -3, 14, 6);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-4, -1.5, 9, 3);
                ctx.restore();
                canvas.refresh();
            }

            // 12. TOXIC_SPITTER Bullet (Corrosive Venom Dart)
            {
                const size = 38;
                const canvas = this.textures.createCanvas('bullet_toxic', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 17);
                grad.addColorStop(0, 'rgba(220, 252, 231, 1)');
                grad.addColorStop(0.45, 'rgba(34, 197, 94, 0.95)');
                grad.addColorStop(1, 'rgba(21, 128, 61, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 17, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#4ade80';
                ctx.beginPath();
                ctx.moveTo(11, 0);
                ctx.quadraticCurveTo(0, -7, -7, -3);
                ctx.quadraticCurveTo(-10, 0, -7, 3);
                ctx.quadraticCurveTo(0, 7, 11, 0);
                ctx.closePath();
                ctx.fill();
                // Toxic droplet bubbles
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, -1, 2.5, 0, Math.PI * 2);
                ctx.arc(-4, 1, 1.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                canvas.refresh();
            }

            // 13. PLASMA_CANNON Bullet (Cyber Pulse Ion Orb)
            {
                const size = 40;
                const canvas = this.textures.createCanvas('bullet_plasma', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.35, 'rgba(0, 240, 255, 0.95)');
                grad.addColorStop(0.7, 'rgba(2, 132, 199, 0.45)');
                grad.addColorStop(1, 'rgba(3, 105, 161, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                canvas.refresh();
            }

            // 14. HEX_BURST Bullet (Witch's Mystic Rune Star)
            {
                const size = 38;
                const canvas = this.textures.createCanvas('bullet_hex', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 17);
                grad.addColorStop(0, 'rgba(250, 232, 255, 1)');
                grad.addColorStop(0.45, 'rgba(147, 51, 234, 0.95)');
                grad.addColorStop(1, 'rgba(88, 28, 135, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 17, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#f3e8ff';
                ctx.beginPath();
                ctx.moveTo(0, -11);
                ctx.lineTo(4, -4);
                ctx.lineTo(11, 0);
                ctx.lineTo(4, 4);
                ctx.lineTo(0, 11);
                ctx.lineTo(-4, 4);
                ctx.lineTo(-11, 0);
                ctx.lineTo(-4, -4);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#a855f7';
                ctx.lineWidth = 1.4;
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                canvas.refresh();
            }

            // 15. CROSS_FIRE Bullet (Grave Crossbow Bolt)
            {
                const size = 40;
                const canvas = this.textures.createCanvas('bullet_cross', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
                grad.addColorStop(0, 'rgba(255, 228, 230, 1)');
                grad.addColorStop(0.45, 'rgba(244, 63, 94, 0.9)');
                grad.addColorStop(1, 'rgba(159, 18, 57, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-3, -11, 6, 22);
                ctx.fillRect(-9, -4, 18, 5);
                ctx.strokeStyle = '#e11d48';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(-3, -11, 6, 22);
                ctx.strokeRect(-9, -4, 18, 5);
                ctx.restore();
                canvas.refresh();
            }

            // 16. METEOR_LAUNCHER Bullet (Molten Magma Boulder)
            {
                const size = 44;
                const canvas = this.textures.createCanvas('bullet_meteor', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
                grad.addColorStop(0, 'rgba(255, 255, 200, 1)');
                grad.addColorStop(0.35, 'rgba(249, 115, 22, 0.95)');
                grad.addColorStop(0.7, 'rgba(220, 38, 38, 0.7)');
                grad.addColorStop(1, 'rgba(127, 29, 29, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                // Jagged magma crust
                ctx.fillStyle = '#431407';
                ctx.beginPath();
                ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
                ctx.fill();
                // Glowing magma veins
                ctx.strokeStyle = '#ffedd5';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-5, -4);
                ctx.lineTo(0, 1);
                ctx.lineTo(6, -2);
                ctx.stroke();
                ctx.restore();
                canvas.refresh();
            }

            // 17. SPIRIT_ORB Bullet (Sonic Banshee Shockwave)
            {
                const size = 40;
                const canvas = this.textures.createCanvas('bullet_spirit', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
                grad.addColorStop(0, 'rgba(236, 254, 255, 1)');
                grad.addColorStop(0.5, 'rgba(103, 232, 249, 0.85)');
                grad.addColorStop(1, 'rgba(8, 145, 178, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = '#67e8f9';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                canvas.refresh();
            }

            // 18. CHAIN_LIGHTNING Bullet (Storm Arc Electric Spike)
            {
                const size = 40;
                const canvas = this.textures.createCanvas('bullet_lightning', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.45, 'rgba(59, 130, 246, 0.95)');
                grad.addColorStop(1, 'rgba(30, 58, 138, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(11, -11);
                ctx.lineTo(2, -2);
                ctx.lineTo(7, 0);
                ctx.lineTo(-11, 11);
                ctx.lineTo(-2, 2);
                ctx.lineTo(-7, 0);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#60a5fa';
                ctx.lineWidth = 1.6;
                ctx.stroke();
                ctx.restore();
                canvas.refresh();
            }

            // 19. VOID_BEAM Bullet (Nether Ray Singularity)
            {
                const size = 40;
                const canvas = this.textures.createCanvas('bullet_void', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 18);
                grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
                grad.addColorStop(0.35, 'rgba(124, 58, 237, 0.95)');
                grad.addColorStop(0.75, 'rgba(91, 33, 182, 0.45)');
                grad.addColorStop(1, 'rgba(46, 16, 101, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, 9, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
                canvas.refresh();
            }

            // 20. REAPER_SCYTHE Bullet (Soul Carver Spinning Blade)
            {
                const size = 44;
                const canvas = this.textures.createCanvas('bullet_scythe', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
                grad.addColorStop(0, 'rgba(255, 241, 242, 1)');
                grad.addColorStop(0.4, 'rgba(225, 29, 72, 0.95)');
                grad.addColorStop(1, 'rgba(136, 19, 55, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#ffe4e6';
                ctx.beginPath();
                ctx.arc(0, 0, 13, -Math.PI / 2, Math.PI / 2, false);
                ctx.arc(5, 0, 11, Math.PI / 2, -Math.PI / 2, true);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#e11d48';
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.restore();
                canvas.refresh();
            }

            // 21. DOOM_BLASTER Bullet (Apocalypse Demonic Hell-Core)
            {
                const size = 44;
                const canvas = this.textures.createCanvas('bullet_doom', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
                grad.addColorStop(0, 'rgba(254, 202, 202, 1)');
                grad.addColorStop(0.4, 'rgba(255, 0, 85, 0.95)');
                grad.addColorStop(0.8, 'rgba(127, 29, 29, 0.7)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#ff0055';
                ctx.beginPath();
                ctx.arc(0, 0, 9.5, 0, Math.PI * 2);
                ctx.fill();
                // Demon eyes
                ctx.fillStyle = '#fef08a';
                ctx.beginPath();
                ctx.arc(-3, -2, 2.5, 0, Math.PI * 2);
                ctx.arc(3, -2, 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
                canvas.refresh();
            }

            // 22. CELESTIAL_STAR Bullet (God Gourd Supernova)
            {
                const size = 44;
                const canvas = this.textures.createCanvas('bullet_star', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
                grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
                grad.addColorStop(0.4, 'rgba(253, 224, 71, 0.95)');
                grad.addColorStop(0.8, 'rgba(234, 179, 8, 0.55)');
                grad.addColorStop(1, 'rgba(161, 98, 7, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const r = (i % 2 === 0) ? 12 : 5;
                    const a = (i * Math.PI) / 4;
                    const px = Math.cos(a) * r;
                    const py = Math.sin(a) * r;
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();
                canvas.refresh();
            }

            // 23. NEON_DISC Bullet (Cyber Slicer Disc)
            {
                const size = 42;
                const canvas = this.textures.createCanvas('bullet_disc', size, size);
                const ctx = canvas.context;
                const cx = size / 2, cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 19);
                grad.addColorStop(0, 'rgba(204, 251, 241, 1)');
                grad.addColorStop(0.45, 'rgba(0, 255, 204, 0.95)');
                grad.addColorStop(1, 'rgba(15, 118, 110, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 19, 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.translate(cx, cy);
                ctx.strokeStyle = '#00ffcc';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.stroke();
                // Cross spokes
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-1.5, -9, 3, 18);
                ctx.fillRect(-9, -1.5, 18, 3);
                ctx.restore();
                canvas.refresh();
            }
        }

        generateGunPreviews() {
            // Generate crisp visual preview data URLs for all 22 weapons in the Armory Shop
            window.PumpkinPanic.gunPreviews = window.PumpkinPanic.gunPreviews || {};
            const size = 64;

            for (const [key, gun] of Object.entries(Config.GUNS)) {
                const canvas = this.textures.createCanvas('gun_preview_' + key, size, size);
                const ctx = canvas.context;
                const cx = size / 2;
                const cy = size / 2;

                ctx.clearRect(0, 0, size, size);

                // Radial weapon aura backdrop
                const aura = ctx.createRadialGradient(cx, cy, 4, cx, cy, 28);
                aura.addColorStop(0, gun.bulletColor || '#ffaa00');
                aura.addColorStop(0.7, 'rgba(22, 12, 40, 0.85)');
                aura.addColorStop(1, 'rgba(10, 5, 20, 0)');
                ctx.fillStyle = aura;
                ctx.beginPath();
                ctx.arc(cx, cy, 28, 0, Math.PI * 2);
                ctx.fill();

                // Sleek tech border ring
                ctx.strokeStyle = gun.bulletColor || '#ffaa00';
                ctx.lineWidth = 2;
                ctx.shadowColor = gun.bulletColor || '#ffaa00';
                ctx.shadowBlur = 6;
                ctx.beginPath();
                ctx.arc(cx, cy, 26, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Dedicated Procedural Weapon Artwork
                this.drawWeaponIllustration(ctx, cx, cy, key, gun);

                canvas.refresh();

                try {
                    window.PumpkinPanic.gunPreviews[key] = canvas.canvas.toDataURL();
                } catch (e) {}
            }
        }

        drawWeaponIllustration(ctx, cx, cy, key, gun) {
            ctx.save();
            ctx.translate(cx, cy);

            const bColor = gun.bulletColor || '#ffaa00';

            switch (key) {
                case 'SEED_PISTOL': {
                    // Wooden grip
                    ctx.fillStyle = '#854d0e';
                    ctx.beginPath();
                    ctx.roundRect(-10, 1, 7, 12, [2, 2, 4, 4]);
                    ctx.fill();
                    // Brass frame
                    ctx.fillStyle = '#eab308';
                    ctx.fillRect(-8, -4, 11, 7);
                    // Cylinder
                    ctx.fillStyle = '#475569';
                    ctx.beginPath();
                    ctx.arc(-2, -1, 4.5, 0, Math.PI * 2);
                    ctx.fill();
                    // Iron barrel
                    ctx.fillStyle = '#64748b';
                    ctx.fillRect(3, -4, 13, 5);
                    // Orange muzzle ring
                    ctx.fillStyle = '#f97316';
                    ctx.fillRect(15, -5, 3, 7);
                    break;
                }
                case 'DOUBLE_TAP': {
                    // Walnut stock
                    ctx.fillStyle = '#78350f';
                    ctx.beginPath();
                    ctx.roundRect(-12, 0, 8, 12, [2, 2, 4, 4]);
                    ctx.fill();
                    // Receiver
                    ctx.fillStyle = '#334155';
                    ctx.fillRect(-7, -6, 9, 9);
                    // Twin green-steel barrels
                    ctx.fillStyle = '#4d7c0f';
                    ctx.fillRect(2, -6, 14, 4);
                    ctx.fillRect(2, -1, 14, 4);
                    // Dual lime vents
                    ctx.fillStyle = '#a3e635';
                    ctx.fillRect(15, -7, 2, 5);
                    ctx.fillRect(15, -2, 2, 5);
                    break;
                }
                case 'PUMPKIN_SMG': {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(-11, -5, 19, 8);
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(-9, -7, 15, 2);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(-8, 3, 6, 9);
                    // Curved magazine
                    ctx.fillStyle = '#334155';
                    ctx.beginPath();
                    ctx.moveTo(1, 3);
                    ctx.quadraticCurveTo(4, 9, 8, 12);
                    ctx.lineTo(5, 12);
                    ctx.quadraticCurveTo(1, 9, -2, 3);
                    ctx.closePath();
                    ctx.fill();
                    // Barrel
                    ctx.fillStyle = '#475569';
                    ctx.fillRect(8, -4, 9, 6);
                    ctx.fillStyle = '#22d3ee';
                    ctx.fillRect(16, -3, 2, 4);
                    break;
                }
                case 'PUMPKIN_SHOTGUN': {
                    ctx.fillStyle = '#9a3412';
                    ctx.fillRect(-15, -2, 8, 7);
                    ctx.fillStyle = '#334155';
                    ctx.fillRect(-7, -5, 11, 8);
                    ctx.fillStyle = '#475569';
                    ctx.fillRect(4, -5, 14, 6);
                    // Orange pump slide
                    ctx.fillStyle = '#ea580c';
                    ctx.fillRect(4, 1, 8, 4.5);
                    ctx.fillStyle = '#f97316';
                    ctx.fillRect(17, -6, 3, 8);
                    break;
                }
                case 'SNIPER_SEED': {
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(-15, -2, 10, 6);
                    ctx.fillRect(-5, -4, 11, 7);
                    // Long slender barrel
                    ctx.fillStyle = '#64748b';
                    ctx.fillRect(6, -2, 17, 3);
                    ctx.fillStyle = '#ec4899';
                    ctx.fillRect(22, -4, 3, 7);
                    // Elevated Scope
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(-4, -9, 14, 4);
                    ctx.fillStyle = '#f43f5e';
                    ctx.fillRect(-4, -8, 2, 2);
                    ctx.fillRect(8, -8, 2, 2);
                    // Bipod
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(12, 1);
                    ctx.lineTo(9, 8);
                    ctx.moveTo(14, 1);
                    ctx.lineTo(17, 8);
                    ctx.stroke();
                    break;
                }
                case 'TRIPLE_FAN': {
                    ctx.fillStyle = '#065f46';
                    ctx.fillRect(-10, -5, 11, 10);
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(1, -2, 16, 4);
                    ctx.save();
                    ctx.rotate(-0.35);
                    ctx.fillRect(1, -2, 15, 3.5);
                    ctx.restore();
                    ctx.save();
                    ctx.rotate(0.35);
                    ctx.fillRect(1, -1.5, 15, 3.5);
                    ctx.restore();
                    ctx.fillStyle = '#6ee7b7';
                    ctx.beginPath();
                    ctx.arc(-4, 0, 4, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'GHOSTFIRE': {
                    // Soul flamethrower
                    ctx.fillStyle = '#6b21a8';
                    ctx.beginPath();
                    ctx.roundRect(-14, -8, 10, 16, 4);
                    ctx.fill();
                    ctx.fillStyle = '#a855f7';
                    ctx.fillRect(-11, -6, 4, 12);
                    ctx.fillStyle = '#71717a';
                    ctx.fillRect(-4, -2, 13, 5);
                    ctx.fillStyle = '#c084fc';
                    ctx.beginPath();
                    ctx.moveTo(9, -5);
                    ctx.lineTo(14, -2);
                    ctx.lineTo(14, 3);
                    ctx.lineTo(9, 5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#e9d5ff';
                    ctx.beginPath();
                    ctx.moveTo(14, 0);
                    ctx.quadraticCurveTo(18, -4, 21, 0);
                    ctx.quadraticCurveTo(18, 4, 14, 0);
                    ctx.fill();
                    break;
                }
                case 'BOUNCER_CRYSTAL': {
                    ctx.fillStyle = '#cbd5e1';
                    ctx.fillRect(-10, -4, 13, 8);
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillRect(3, -2, 8, 4);
                    ctx.fillStyle = '#475569';
                    ctx.fillRect(-7, 4, 5, 8);
                    ctx.fillStyle = '#d946ef';
                    // Crystals
                    ctx.beginPath();
                    ctx.moveTo(19, 0);
                    ctx.lineTo(14, -3);
                    ctx.lineTo(13, 0);
                    ctx.lineTo(14, 3);
                    ctx.closePath();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(11, -8);
                    ctx.lineTo(8, -6);
                    ctx.lineTo(10, -4);
                    ctx.closePath();
                    ctx.fill();
                    ctx.beginPath();
                    ctx.moveTo(11, 8);
                    ctx.lineTo(8, 6);
                    ctx.lineTo(10, 4);
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
                case 'HOMING_SPECTRE': {
                    ctx.fillStyle = '#e2e8f0';
                    ctx.beginPath();
                    ctx.arc(-2, 0, 9, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#0284c7';
                    ctx.beginPath();
                    ctx.arc(-3, -3, 2.5, 0, Math.PI * 2);
                    ctx.arc(-3, 3, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#cbd5e1';
                    ctx.fillRect(5, -3, 8, 6);
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 2.2;
                    ctx.beginPath();
                    ctx.moveTo(13, 0);
                    ctx.quadraticCurveTo(17, -5, 20, -2);
                    ctx.stroke();
                    break;
                }
                case 'MINIGUN': {
                    ctx.fillStyle = '#713f12';
                    ctx.fillRect(-12, -7, 10, 14);
                    ctx.strokeStyle = '#ca8a04';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-10, -7);
                    ctx.lineTo(-6, -11);
                    ctx.lineTo(2, -11);
                    ctx.lineTo(4, -7);
                    ctx.stroke();
                    ctx.fillStyle = '#eab308';
                    ctx.fillRect(-2, -5, 18, 2.5);
                    ctx.fillRect(-2, -1.5, 18, 3);
                    ctx.fillRect(-2, 2.5, 18, 2.5);
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(7, -6, 3, 12);
                    ctx.fillRect(15, -6, 2, 12);
                    break;
                }
                case 'TOXIC_SPITTER': {
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(-14, -3, 8, 6);
                    ctx.fillRect(-11, 3, 5, 8);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                    ctx.strokeStyle = '#86efac';
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.roundRect(-6, -6, 12, 12, 3);
                    ctx.fill();
                    ctx.stroke();
                    ctx.fillStyle = '#22c55e';
                    ctx.fillRect(-5, -2, 10, 7);
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillRect(6, -1.5, 12, 3);
                    ctx.fillStyle = '#4ade80';
                    ctx.beginPath();
                    ctx.arc(19, 1, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'PLASMA_CANNON': {
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(-14, -6, 12, 12);
                    ctx.fillStyle = '#0284c7';
                    ctx.fillRect(-2, -6, 18, 3.5);
                    ctx.fillRect(-2, 2.5, 18, 3.5);
                    const pGrad = ctx.createRadialGradient(6, 0, 1, 6, 0, 5.5);
                    pGrad.addColorStop(0, '#ffffff');
                    pGrad.addColorStop(0.5, '#00f0ff');
                    pGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
                    ctx.fillStyle = pGrad;
                    ctx.beginPath();
                    ctx.arc(6, 0, 5.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'HEX_BURST': {
                    ctx.fillStyle = '#451a03';
                    ctx.beginPath();
                    ctx.moveTo(-15, 2);
                    ctx.lineTo(-4, -2);
                    ctx.lineTo(8, -1);
                    ctx.lineTo(12, 0);
                    ctx.lineWidth = 4;
                    ctx.strokeStyle = '#451a03';
                    ctx.stroke();
                    ctx.fillStyle = '#a855f7';
                    ctx.beginPath();
                    ctx.arc(-2, -1, 3, 0, Math.PI * 2);
                    ctx.arc(5, -1, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#d8b4fe';
                    ctx.beginPath();
                    ctx.moveTo(19, 0);
                    ctx.lineTo(15, -4);
                    ctx.lineTo(13, 0);
                    ctx.lineTo(15, 4);
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
                case 'CROSS_FIRE': {
                    ctx.fillStyle = '#334155';
                    ctx.fillRect(-12, -2, 22, 4);
                    ctx.strokeStyle = '#e11d48';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(3, -12);
                    ctx.quadraticCurveTo(0, 0, 3, 12);
                    ctx.stroke();
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(3, -12);
                    ctx.lineTo(-8, 0);
                    ctx.lineTo(3, 12);
                    ctx.stroke();
                    ctx.fillStyle = '#f43f5e';
                    ctx.beginPath();
                    ctx.moveTo(14, 0);
                    ctx.lineTo(9, -3.5);
                    ctx.lineTo(9, 3.5);
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
                case 'METEOR_LAUNCHER': {
                    ctx.fillStyle = '#1c1917';
                    ctx.beginPath();
                    ctx.moveTo(-12, -7);
                    ctx.lineTo(8, -6);
                    ctx.lineTo(12, -8);
                    ctx.lineTo(14, 8);
                    ctx.lineTo(8, 6);
                    ctx.lineTo(-12, 7);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#ff4500';
                    ctx.lineWidth = 1.8;
                    ctx.beginPath();
                    ctx.moveTo(-8, -2);
                    ctx.lineTo(-2, 2);
                    ctx.lineTo(5, -1);
                    ctx.lineTo(10, 3);
                    ctx.stroke();
                    ctx.fillStyle = '#f97316';
                    ctx.beginPath();
                    ctx.arc(12, 0, 4.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'SPIRIT_ORB': {
                    ctx.fillStyle = '#475569';
                    ctx.fillRect(-12, -4, 12, 8);
                    ctx.fillRect(-9, 4, 5, 7);
                    ctx.strokeStyle = '#67e8f9';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(2, 0, 4, -Math.PI / 2, Math.PI / 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(6, 0, 7, -Math.PI / 2, Math.PI / 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(10, 0, 10, -Math.PI / 2, Math.PI / 2);
                    ctx.stroke();
                    break;
                }
                case 'CHAIN_LIGHTNING': {
                    ctx.fillStyle = '#1e3a8a';
                    ctx.fillRect(-12, -4, 14, 8);
                    ctx.fillStyle = '#ca8a04';
                    ctx.fillRect(2, -6, 10, 2.5);
                    ctx.fillRect(2, 3.5, 10, 2.5);
                    ctx.strokeStyle = '#60a5fa';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(12, -5);
                    ctx.lineTo(14, -1);
                    ctx.lineTo(11, 1);
                    ctx.lineTo(16, 0);
                    ctx.lineTo(12, 5);
                    ctx.stroke();
                    break;
                }
                case 'VOID_BEAM': {
                    ctx.fillStyle = '#2e1065';
                    ctx.fillRect(-14, -5, 16, 10);
                    ctx.fillStyle = '#581c87';
                    ctx.fillRect(2, -4, 10, 2);
                    ctx.fillRect(2, 2, 10, 2);
                    const vGrad = ctx.createRadialGradient(-3, 0, 1, -3, 0, 6);
                    vGrad.addColorStop(0, '#000000');
                    vGrad.addColorStop(0.7, '#7c3aed');
                    vGrad.addColorStop(1, 'rgba(124, 58, 237, 0)');
                    ctx.fillStyle = vGrad;
                    ctx.beginPath();
                    ctx.arc(-3, 0, 6, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'REAPER_SCYTHE': {
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(-10, 12);
                    ctx.lineTo(4, -8);
                    ctx.stroke();
                    ctx.fillStyle = '#e11d48';
                    ctx.beginPath();
                    ctx.moveTo(4, -8);
                    ctx.quadraticCurveTo(16, -14, 19, -4);
                    ctx.quadraticCurveTo(12, -8, 4, -5);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#f8fafc';
                    ctx.beginPath();
                    ctx.arc(4, -7, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                case 'DOOM_BLASTER': {
                    ctx.fillStyle = '#7f1d1d';
                    ctx.beginPath();
                    ctx.arc(-2, 0, 9, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#dc2626';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(-4, -7);
                    ctx.quadraticCurveTo(-9, -13, -12, -9);
                    ctx.moveTo(-4, 7);
                    ctx.quadraticCurveTo(-9, 13, -12, 9);
                    ctx.stroke();
                    ctx.fillStyle = '#ff0055';
                    ctx.beginPath();
                    ctx.arc(5, 0, 5, -Math.PI / 2, Math.PI / 2);
                    ctx.fill();
                    break;
                }
                case 'CELESTIAL_STAR': {
                    ctx.fillStyle = '#ca8a04';
                    ctx.beginPath();
                    ctx.moveTo(-12, -2);
                    ctx.lineTo(-4, -8);
                    ctx.lineTo(2, -2);
                    ctx.lineTo(2, 2);
                    ctx.lineTo(-4, 8);
                    ctx.lineTo(-12, 2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.fillStyle = '#fde047';
                    ctx.beginPath();
                    for (let i = 0; i < 8; i++) {
                        const r = (i % 2 === 0) ? 9 : 4.5;
                        const a = (i * Math.PI) / 4;
                        const px = 9 + Math.cos(a) * r;
                        const py = Math.sin(a) * r;
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.fill();
                    break;
                }
                case 'NEON_DISC': {
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(-14, -4, 10, 8);
                    ctx.fillStyle = '#0d9488';
                    ctx.fillRect(-4, -2, 6, 4);
                    ctx.fillStyle = '#00ffcc';
                    ctx.beginPath();
                    ctx.arc(9, 0, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.arc(9, 0, 3, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                }
                default: {
                    ctx.fillStyle = bColor;
                    ctx.fillRect(-8, -3, 16, 6);
                    break;
                }
            }

            ctx.restore();
        }

        generateSeedTextures() {
            // Normal Seed Pickup
            {
                const size = 32;
                const canvas = this.textures.createCanvas('seed_normal', size, size);
                const ctx = canvas.context;
                const cx = size / 2;
                const cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 3, cx, cy, 14);
                grad.addColorStop(0, 'rgba(100, 255, 150, 0.85)');
                grad.addColorStop(0.6, 'rgba(50, 200, 100, 0.3)');
                grad.addColorStop(1, 'rgba(0, 255, 100, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 14, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#8aff80';
                ctx.beginPath();
                ctx.ellipse(cx, cy, 6, 9, Math.PI / 6, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#27ae60';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                canvas.refresh();
            }

            // Super Seed Pickup
            {
                const size = 44;
                const canvas = this.textures.createCanvas('seed_super', size, size);
                const ctx = canvas.context;
                const cx = size / 2;
                const cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 20);
                grad.addColorStop(0, 'rgba(255, 230, 80, 0.95)');
                grad.addColorStop(0.5, 'rgba(255, 160, 0, 0.5)');
                grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 20, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#f39c12';
                ctx.beginPath();
                ctx.ellipse(cx - 6, cy + 1, 7, 10, -0.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(cx + 6, cy + 1, 7, 10, 0.2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#f1c40f';
                ctx.beginPath();
                ctx.ellipse(cx, cy + 1, 8, 11, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#2ecc71';
                ctx.fillRect(cx - 2, cy - 13, 4, 5);
                canvas.refresh();
            }

            // RARE EXPLOSIVE SEED (Volatile Pumpkin Bomb)
            {
                const size = 52;
                const canvas = this.textures.createCanvas('seed_explosive', size, size);
                const ctx = canvas.context;
                const cx = size / 2;
                const cy = size / 2;
                ctx.clearRect(0, 0, size, size);

                // Pulsing Danger Red/Amber Halo
                const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 24);
                grad.addColorStop(0, 'rgba(255, 50, 50, 0.95)');
                grad.addColorStop(0.6, 'rgba(255, 140, 0, 0.6)');
                grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(cx, cy, 24, 0, Math.PI * 2);
                ctx.fill();

                // Dark Crimson Volatile Shell
                ctx.fillStyle = '#b91c1c';
                ctx.beginPath();
                ctx.ellipse(cx, cy, 14, 16, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ff4444';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Hazard warning stripes
                ctx.fillStyle = '#f59e0b';
                ctx.beginPath();
                ctx.moveTo(cx - 6, cy - 8);
                ctx.lineTo(cx + 6, cy - 8);
                ctx.lineTo(cx, cy + 6);
                ctx.closePath();
                ctx.fill();

                // Exclamation / Skull mark
                ctx.fillStyle = '#111';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('!', cx, cy + 4);

                // Sparking fuse on top
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(cx, cy - 16);
                ctx.quadraticCurveTo(cx + 5, cy - 22, cx + 8, cy - 24);
                ctx.stroke();

                // Fuse spark
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(cx + 8, cy - 24, 3, 0, Math.PI * 2);
                ctx.fill();

                canvas.refresh();
            }

            // WEAPON RUNES (Triple, Rapid, Bouncing, Shotgun, Ghostfire, Homing)
            this.generateWeaponRuneTexture('pickup_triple', '🌿', '#10b981', '#059669');
            this.generateWeaponRuneTexture('pickup_rapid', '⚡', '#06b6d4', '#0891b2');
            this.generateWeaponRuneTexture('pickup_bouncing', '🔮', '#d946ef', '#a855f7');
            this.generateWeaponRuneTexture('pickup_shotgun', '💥', '#ff6600', '#c2410c');
            this.generateWeaponRuneTexture('pickup_ghostfire', '🔥', '#a855f7', '#7c3aed');
            this.generateWeaponRuneTexture('pickup_homing', '👻', '#0ea5e9', '#0284c7');

            // Golden Mega Pinata Gourd
            this.generateMegaPinataTexture();

            // GROWTH TIER DECORATIONS
            this.generateTierDecorationTextures();
        }

        generateMegaPinataTexture() {
            const size = 96;
            const canvas = this.textures.createCanvas('loot_pinata', size, size);
            const ctx = canvas.context;
            const cx = size / 2;
            const cy = size / 2;
            ctx.clearRect(0, 0, size, size);

            // Shimmering Golden Halo
            const aura = ctx.createRadialGradient(cx, cy, 10, cx, cy, 46);
            aura.addColorStop(0, 'rgba(255, 235, 59, 0.95)');
            aura.addColorStop(0.5, 'rgba(255, 179, 0, 0.6)');
            aura.addColorStop(1, 'rgba(255, 143, 0, 0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(cx, cy, 46, 0, Math.PI * 2);
            ctx.fill();

            // Radiant Golden Pumpkin Body
            const bodyGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 32);
            bodyGrad.addColorStop(0, '#fff9c4');
            bodyGrad.addColorStop(0.5, '#ffd54f');
            bodyGrad.addColorStop(1, '#ff8f00');
            ctx.fillStyle = bodyGrad;
            ctx.beginPath();
            ctx.ellipse(cx, cy + 4, 34, 28, 0, 0, Math.PI * 2);
            ctx.fill();

            // Ribs
            ctx.strokeStyle = '#d48806';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(cx, cy + 4, 22, 28, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx, cy + 4, 10, 28, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Golden Crown on top
            ctx.fillStyle = '#ffea00';
            ctx.beginPath();
            ctx.moveTo(cx - 16, cy - 24);
            ctx.lineTo(cx - 20, cy - 38);
            ctx.lineTo(cx - 10, cy - 30);
            ctx.lineTo(cx, cy - 42);
            ctx.lineTo(cx + 10, cy - 30);
            ctx.lineTo(cx + 20, cy - 38);
            ctx.lineTo(cx + 16, cy - 24);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#b78103';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Emerald jewels on crown
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(cx, cy - 32, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Cute playful face
            ctx.fillStyle = '#3e2723';
            ctx.beginPath();
            ctx.arc(cx - 10, cy + 2, 3.5, 0, Math.PI * 2);
            ctx.arc(cx + 10, cy + 2, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy + 7, 7, 0.2, Math.PI - 0.2);
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#3e2723';
            ctx.stroke();

            canvas.refresh();
        }

        generateWeaponRuneTexture(key, symbol, primaryColor, borderColor) {
            const size = 48;
            const canvas = this.textures.createCanvas(key, size, size);
            const ctx = canvas.context;
            const cx = size / 2;
            const cy = size / 2;
            ctx.clearRect(0, 0, size, size);

            // Radiant Diamond Aura
            const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, 22);
            grad.addColorStop(0, primaryColor);
            grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.4)');
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, 22, 0, Math.PI * 2);
            ctx.fill();

            // Diamond Rune Plate
            ctx.fillStyle = '#181126';
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 18);
            ctx.lineTo(cx + 18, cy);
            ctx.lineTo(cx, cy + 18);
            ctx.lineTo(cx - 18, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Inner Rune Symbol
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(symbol, cx, cy);

            canvas.refresh();
        }

        generateTierDecorationTextures() {
            // Tier 2: Spiked Leafy Thorn Collar
            {
                const canvas = this.textures.createCanvas('tier_collar', 64, 24);
                const ctx = canvas.context;
                ctx.clearRect(0, 0, 64, 24);
                ctx.fillStyle = '#15803d';
                ctx.strokeStyle = '#4ade80';
                ctx.lineWidth = 1.2;

                // Curved leafy spikes
                for (let i = 0; i < 5; i++) {
                    const x = 12 + i * 10;
                    ctx.beginPath();
                    ctx.moveTo(x - 5, 12);
                    ctx.lineTo(x, 2);
                    ctx.lineTo(x + 5, 12);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                canvas.refresh();
            }

            // Tier 4: Radiant Flaming Titan Crown
            {
                const canvas = this.textures.createCanvas('tier_titan_crown', 72, 36);
                const ctx = canvas.context;
                ctx.clearRect(0, 0, 72, 36);
                const cx = 36;

                // Blazing Halo Aura
                ctx.fillStyle = '#f59e0b';
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.moveTo(cx - 24, 30);
                ctx.lineTo(cx - 26, 10);
                ctx.lineTo(cx - 14, 20);
                ctx.lineTo(cx, 4); // tall center spike
                ctx.lineTo(cx + 14, 20);
                ctx.lineTo(cx + 26, 10);
                ctx.lineTo(cx + 24, 30);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                canvas.refresh();
            }
        }

        generateTreeTexture() {
            const size = 160;
            const canvas = this.textures.createCanvas('tree_spooky', size, size);
            const ctx = canvas.context;
            const cx = size / 2;
            const cy = size / 2;

            ctx.clearRect(0, 0, size, size);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 50, 48, 22, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1c132b';
            ctx.strokeStyle = '#2b1b42';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(cx - 18, cy + 55);
            ctx.quadraticCurveTo(cx - 12, cy + 10, cx - 14, cy - 20);
            ctx.quadraticCurveTo(cx - 28, cy - 45, cx - 45, cy - 55);
            ctx.quadraticCurveTo(cx - 30, cy - 40, cx - 10, cy - 30);
            ctx.quadraticCurveTo(cx - 4, cy - 65, cx, cy - 70);
            ctx.quadraticCurveTo(cx + 10, cy - 40, cx + 25, cy - 50);
            ctx.quadraticCurveTo(cx + 45, cy - 55, cx + 55, cy - 48);
            ctx.quadraticCurveTo(cx + 35, cy - 35, cx + 16, cy - 15);
            ctx.quadraticCurveTo(cx + 14, cy + 15, cx + 22, cy + 55);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#e056fd';
            ctx.shadowColor = '#e056fd';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.ellipse(cx - 2, cy + 10, 4, 7, 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            canvas.refresh();
        }

        generateTombstoneTexture() {
            const size = 64;
            const canvas = this.textures.createCanvas('tombstone', size, size);
            const ctx = canvas.context;
            const cx = size / 2;
            const cy = size / 2;

            ctx.clearRect(0, 0, size, size);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 18, 20, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3a3447';
            ctx.beginPath();
            ctx.moveTo(cx - 14, cy + 18);
            ctx.lineTo(cx - 14, cy - 8);
            ctx.quadraticCurveTo(cx, cy - 24, cx + 14, cy - 8);
            ctx.lineTo(cx + 14, cy + 18);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#221e2b';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#181420';
            ctx.font = 'bold 9px serif';
            ctx.textAlign = 'center';
            ctx.fillText('R.I.P', cx, cy);

            ctx.strokeStyle = '#181420';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + 4, cy - 14);
            ctx.lineTo(cx + 8, cy - 8);
            ctx.lineTo(cx + 6, cy - 2);
            ctx.stroke();

            canvas.refresh();
        }

        generateFenceTexture() {
            const size = 64;
            const canvas = this.textures.createCanvas('fence', size, size);
            const ctx = canvas.context;

            ctx.clearRect(0, 0, size, size);

            ctx.fillStyle = '#2c223b';
            ctx.fillRect(4, 18, 56, 5);
            ctx.fillRect(4, 34, 56, 5);

            for (let i = 0; i < 4; i++) {
                const px = 10 + i * 15;
                ctx.beginPath();
                ctx.moveTo(px, 48);
                ctx.lineTo(px, 12);
                ctx.lineTo(px + 3, 5);
                ctx.lineTo(px + 6, 12);
                ctx.lineTo(px + 6, 48);
                ctx.closePath();
                ctx.fill();
            }

            canvas.refresh();
        }

        generateGrassTexture() {
            const size = 32;
            const canvas = this.textures.createCanvas('grass_tuft', size, size);
            const ctx = canvas.context;
            const cx = size / 2;

            ctx.clearRect(0, 0, size, size);

            ctx.strokeStyle = '#392452';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(cx - 8, 26);
            ctx.quadraticCurveTo(cx - 10, 14, cx - 12, 8);

            ctx.moveTo(cx - 3, 26);
            ctx.quadraticCurveTo(cx - 2, 12, cx - 1, 6);

            ctx.moveTo(cx + 3, 26);
            ctx.quadraticCurveTo(cx + 5, 12, cx + 7, 7);

            ctx.moveTo(cx + 8, 26);
            ctx.quadraticCurveTo(cx + 11, 14, cx + 13, 10);
            ctx.stroke();

            canvas.refresh();
        }

        generateParticleTextures() {
            // Spark
            {
                const canvas = this.textures.createCanvas('particle_spark', 16, 16);
                const ctx = canvas.context;
                ctx.clearRect(0, 0, 16, 16);
                const grad = ctx.createRadialGradient(8, 8, 1, 8, 8, 7);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.4, '#ffd700');
                grad.addColorStop(1, 'rgba(255, 160, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(8, 8, 7, 0, Math.PI * 2);
                ctx.fill();
                canvas.refresh();
            }

            // Splat
            {
                const canvas = this.textures.createCanvas('particle_splat', 24, 24);
                const ctx = canvas.context;
                ctx.clearRect(0, 0, 24, 24);
                ctx.fillStyle = '#ff7700';
                ctx.beginPath();
                ctx.arc(12, 12, 6, 0, Math.PI * 2);
                ctx.arc(6, 10, 3.5, 0, Math.PI * 2);
                ctx.arc(17, 8, 4, 0, Math.PI * 2);
                ctx.arc(15, 17, 3, 0, Math.PI * 2);
                ctx.fill();
                canvas.refresh();
            }

            // Mist
            {
                const canvas = this.textures.createCanvas('particle_mist', 64, 64);
                const ctx = canvas.context;
                ctx.clearRect(0, 0, 64, 64);
                const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
                grad.addColorStop(0, 'rgba(147, 86, 219, 0.28)');
                grad.addColorStop(0.7, 'rgba(80, 40, 130, 0.12)');
                grad.addColorStop(1, 'rgba(30, 15, 55, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(32, 32, 30, 0, Math.PI * 2);
                ctx.fill();
                canvas.refresh();
            }
        }

        colorToHex(colorNum) {
            return '#' + colorNum.toString(16).padStart(6, '0');
        }
    }

    window.PumpkinPanic.BootScene = BootScene;
})();
