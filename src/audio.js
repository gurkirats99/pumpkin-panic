/**
 * PUMPKIN PANIC.IO - Upgraded Audio & Music System
 * Procedural Web Audio API with a catchy 128 BPM Halloween arcade soundtrack,
 * punchy bass, drums, arpeggios, and crisp sound effects.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};

    class AudioManager {
        constructor() {
            this.ctx = null;
            this.isMuted = localStorage.getItem('pumpkin_panic_muted') === 'true';
            this.masterGain = null;
            this.bgmGain = null;
            this.sfxGain = null;
            this.initialized = false;

            // Music Sequencer state
            this.bpm = 126;
            this.stepTime = (60 / this.bpm) / 4; // 16th note duration
            this.currentStep = 0;
            this.totalSteps = 64; // 4-bar loop
            this.musicTimer = null;
            this.isPlayingMusic = false;
        }

        init() {
            if (this.initialized) return;
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;

            try {
                this.ctx = new AudioContext();

                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);

                this.sfxGain = this.ctx.createGain();
                this.sfxGain.gain.value = 0.95;
                this.sfxGain.connect(this.masterGain);

                this.bgmGain = this.ctx.createGain();
                this.bgmGain.gain.value = 0.42; // crisp, pleasant background level
                this.bgmGain.connect(this.masterGain);

                this.initialized = true;
                this.startCatchySoundtrack();
            } catch (e) {
                console.warn('AudioContext failed to initialize:', e);
            }
        }

        resumeContext() {
            if (!this.initialized) {
                this.init();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            if (!this.isPlayingMusic && this.initialized) {
                this.startCatchySoundtrack();
            }
        }

        toggleMute() {
            this.isMuted = !this.isMuted;
            localStorage.setItem('pumpkin_panic_muted', this.isMuted);
            if (this.masterGain && this.ctx) {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.85, this.ctx.currentTime);
            }
            return this.isMuted;
        }

        mute() {
            if (this.masterGain && this.ctx) {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            }
        }

        unmute() {
            if (this.isMuted) return; // respect user preference
            if (this.masterGain && this.ctx) {
                this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
                this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
            }
        }

        muteOnVisibility(hidden) {
            if (hidden) {
                if (this.masterGain && this.ctx) {
                    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
                }
            } else {
                if (!this.isMuted && this.masterGain && this.ctx) {
                    this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
                }
                if (this.ctx && this.ctx.state === 'suspended') {
                    this.ctx.resume();
                }
            }
        }

        // ==========================================
        // CATCHY HALLOWEEN BACKGROUND SOUNDTRACK
        // ==========================================

        startCatchySoundtrack() {
            if (!this.ctx || this.isPlayingMusic) return;
            this.isPlayingMusic = true;
            this.currentStep = 0;

            // High-precision Web Audio lookahead scheduling
            let nextNoteTime = this.ctx.currentTime + 0.1;
            const scheduleAheadTime = 0.2;

            const scheduler = () => {
                if (!this.isPlayingMusic || !this.ctx) return;

                while (nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
                    this.scheduleStep(this.currentStep, nextNoteTime);
                    nextNoteTime += this.stepTime;
                    this.currentStep = (this.currentStep + 1) % this.totalSteps;
                }

                this.musicTimer = setTimeout(scheduler, 50);
            };

            scheduler();
        }

        scheduleStep(step, time) {
            if (this.isMuted) return;

            // 1. Kick Drum (Beats 0, 4, 8, 12 in every 16 steps)
            if (step % 4 === 0) {
                this.playSynthKick(time);
            }

            // 2. Snappy Snare / Clack (Beats 4, 12 in every 16 steps)
            if (step % 8 === 4) {
                this.playSynthSnare(time);
            }

            // 3. Hi-Hat Groove (offbeats & 16th shuffles)
            if (step % 2 === 1 || (step % 8 === 6)) {
                this.playSynthHiHat(time, step % 4 === 2);
            }

            // 4. Driving Spooky Bassline (8th notes in C minor)
            const bassStep = step % 16;
            const bassPattern = [
                65.41, 0, 65.41, 77.78, 65.41, 0, 87.31, 82.41, // C2, C2, Eb2, C2, F2, E2
                65.41, 0, 65.41, 77.78, 98.00, 0, 87.31, 77.78  // C2, C2, Eb2, G2, F2, Eb2
            ];
            const bassFreq = bassPattern[bassStep];
            if (bassFreq > 0) {
                this.playSynthBass(bassFreq, time, this.stepTime * 1.4);
            }

            // 5. Catchy Spooky Lead Arpeggio (Upbeat 16th notes)
            const arpNotes = [
                // Bar 1 & 2 (C minor / Halloween spooky tension)
                261.63, 311.13, 392.00, 493.88, 523.25, 493.88, 392.00, 311.13,
                261.63, 311.13, 392.00, 466.16, 523.25, 466.16, 392.00, 349.23,
                // Bar 3 & 4 (Climactic variation)
                261.63, 311.13, 415.30, 493.88, 523.25, 622.25, 523.25, 493.88,
                392.00, 493.88, 523.25, 659.25, 783.99, 659.25, 523.25, 392.00
            ];
            const arpFreq = arpNotes[step % arpNotes.length];
            if (arpFreq > 0 && step % 2 === 0) {
                this.playSynthArp(arpFreq, time, this.stepTime * 1.1);
            }
        }

        playSynthKick(time) {
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.frequency.setValueAtTime(130, time);
                osc.frequency.exponentialRampToValueAtTime(35, time + 0.12);

                gain.gain.setValueAtTime(0.55, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.13);

                osc.connect(gain);
                gain.connect(this.bgmGain);

                osc.start(time);
                osc.stop(time + 0.14);
            } catch (e) {}
        }

        playSynthSnare(time) {
            try {
                // Noise burst for snare
                const bufferSize = this.ctx.sampleRate * 0.08;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(1200, time);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(0.25, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.bgmGain);

                noise.start(time);
                noise.stop(time + 0.09);
            } catch (e) {}
        }

        playSynthHiHat(time, accent = false) {
            try {
                const bufferSize = this.ctx.sampleRate * 0.03;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }

                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(5500, time);

                const gain = this.ctx.createGain();
                gain.gain.setValueAtTime(accent ? 0.12 : 0.06, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(this.bgmGain);

                noise.start(time);
                noise.stop(time + 0.035);
            } catch (e) {}
        }

        playSynthBass(freq, time, duration) {
            try {
                const osc = this.ctx.createOscillator();
                const filter = this.ctx.createBiquadFilter();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, time);

                // Punchy resonant filter envelope
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, time);
                filter.frequency.exponentialRampToValueAtTime(180, time + duration);
                filter.Q.value = 3.5;

                gain.gain.setValueAtTime(0.28, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.bgmGain);

                osc.start(time);
                osc.stop(time + duration);
            } catch (e) {}
        }

        playSynthArp(freq, time, duration) {
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, time);

                gain.gain.setValueAtTime(0.16, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

                osc.connect(gain);
                gain.connect(this.bgmGain);

                osc.start(time);
                osc.stop(time + duration);
            } catch (e) {}
        }

        // ==========================================
        // SOUND EFFECTS
        // ==========================================

        playShoot() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.07);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.08);
        }

        playHit() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;

            const bufferSize = this.ctx.sampleRate * 0.06;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, now);
            filter.Q.value = 2.0;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.38, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            noise.start(now);
            noise.stop(now + 0.06);
        }

        playSeedCollect(isSuper = false) {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            const startFreq = isSuper ? 659.25 : 523.25;
            const endFreq = isSuper ? 1046.50 : 880.00;

            osc.frequency.setValueAtTime(startFreq, now);
            osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.13);
        }

        playCoinSound() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            // Cheerful two-tone cha-ching
            const osc1 = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(987.77, now); // B5
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(1318.51, now + 0.06); // E6

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(this.sfxGain);

            osc1.start(now);
            osc1.stop(now + 0.07);
            osc2.start(now + 0.06);
            osc2.stop(now + 0.22);
        }

        playSkinUnlock() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major triumph
            chord.forEach((freq, idx) => {
                const noteTime = now + idx * 0.08;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.3, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(noteTime);
                osc.stop(noteTime + 0.28);
            });
        }

        playLevelUp() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const notes = [440, 554.37, 659.25, 880];

            notes.forEach((freq, idx) => {
                const noteTime = now + idx * 0.07;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.28, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.18);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(noteTime);
                osc.stop(noteTime + 0.18);
            });
        }

        playStormWarning() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(140, now + 0.4);

            gain.gain.setValueAtTime(0.22, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.45);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.45);
        }

        playDefeat() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.4);
        }

        playVictory() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            notes.forEach((freq, idx) => {
                const noteTime = now + idx * 0.1;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.35, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(noteTime);
                osc.stop(noteTime + 0.35);
            });
        }

        playWeaponPickup() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            // Ascending powerup chord
            const freqs = [329.63, 440.00, 659.25, 987.77];
            freqs.forEach((freq, i) => {
                const noteTime = now + i * 0.05;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.24, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.16);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(noteTime);
                osc.stop(noteTime + 0.16);
            });
        }

        playExplosion() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;

            // Deep rumble noise burst
            const bufferSize = this.ctx.sampleRate * 0.35;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, now);
            filter.frequency.exponentialRampToValueAtTime(60, now + 0.35);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.sfxGain);

            noise.start(now);
            noise.stop(now + 0.36);
        }

        playFuseWarning() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.sfxGain);

            osc.start(now);
            osc.stop(now + 0.06);
        }

        playEliminationSound() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const notes = [440, 659.25, 880];
            notes.forEach((freq, idx) => {
                const noteTime = now + idx * 0.06;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.32, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

                osc.connect(gain);
                gain.connect(this.sfxGain);

                osc.start(noteTime);
                osc.stop(noteTime + 0.2);
            });
        }

        playShotgun() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            
            // Heavy metallic punch + low boom
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);
            gain.gain.setValueAtTime(0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.18);

            // Noise burst for buckshot punch
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.12);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);
            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(0.45, now);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.sfxGain);
            noise.start(now);
            noise.stop(now + 0.13);
        }

        playGhostfire() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(620, now);
            osc.frequency.linearRampToValueAtTime(880, now + 0.05);
            osc.frequency.exponentialRampToValueAtTime(240, now + 0.12);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.12);
        }

        playHoming() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(380, now);
            osc.frequency.exponentialRampToValueAtTime(940, now + 0.14);
            gain.gain.setValueAtTime(0.24, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(now);
            osc.stop(now + 0.15);
        }

        playKillstreak(streak) {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            let freqs = [523.25, 659.25, 783.99]; // Default Double
            if (streak >= 12) freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
            else if (streak >= 8) freqs = [440, 554.37, 659.25, 880, 1108.73];
            else if (streak >= 5) freqs = [392, 493.88, 587.33, 783.99];
            else if (streak >= 3) freqs = [349.23, 440, 523.25, 698.46];

            freqs.forEach((freq, idx) => {
                const noteTime = now + idx * 0.07;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0.35, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(noteTime);
                osc.stop(noteTime + 0.28);
            });
        }

        playPinataLoot() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            // Cascading gold chime flurry
            const notes = [659.25, 783.99, 987.77, 1174.66, 1318.51, 1567.98, 1975.53];
            notes.forEach((freq, idx) => {
                const noteTime = now + idx * 0.045;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0.3, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(noteTime);
                osc.stop(noteTime + 0.2);
            });
        }

        playHeartbeat() {
            if (this.isMuted || !this.ctx) return;
            const now = this.ctx.currentTime;
            // Thump-thump
            [0, 0.16].forEach(offset => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(75, now + offset);
                osc.frequency.exponentialRampToValueAtTime(32, now + offset + 0.12);
                gain.gain.setValueAtTime(0.45, now + offset);
                gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.12);
                osc.connect(gain);
                gain.connect(this.sfxGain);
                osc.start(now + offset);
                osc.stop(now + offset + 0.13);
            });
        }

        destroy() {
            this.isPlayingMusic = false;
            if (this.musicTimer) {
                clearTimeout(this.musicTimer);
                this.musicTimer = null;
            }
            if (this.ctx) {
                this.ctx.close();
                this.ctx = null;
            }
            this.initialized = false;
        }
    }

    window.PumpkinPanic.AudioSystem = new AudioManager();

    // Auto-resume AudioContext on first player interaction (iOS WebKit / Chrome policy)
    const unlockAudio = () => {
        if (window.PumpkinPanic.AudioSystem) {
            window.PumpkinPanic.AudioSystem.resumeContext();
        }
    };
    ['click', 'touchstart', 'touchend', 'keydown'].forEach(evt => {
        document.addEventListener(evt, unlockAudio, { passive: true });
    });

    // Handle tab visibility pause/resume
    document.addEventListener('visibilitychange', () => {
        if (window.PumpkinPanic.AudioSystem) {
            window.PumpkinPanic.AudioSystem.muteOnVisibility(document.hidden);
        }
    });
})();
