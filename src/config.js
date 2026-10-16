/**
 * PUMPKIN PANIC.IO - Game Configuration & Balance Tuning
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};

    window.PumpkinPanic.Config = {
        // World & Arena Settings (Massive 5400x5400 Battle Arena)
        WORLD: {
            WIDTH: 5400,
            HEIGHT: 5400,
            BG_COLOR: 0x160c28,
            GRID_SIZE: 64,
            TREE_COUNT: 110,
            TOMBSTONE_COUNT: 120,
            FENCE_COUNT: 50,
            GRASS_TUFT_COUNT: 280
        },

        // Online Multiplayer Settings
        MULTIPLAYER: {
            DEFAULT_SERVER_URL: 'ws://localhost:2567',
            STORAGE_KEY: 'pumpkin_server_url',
            ROOM_NAME: 'pumpkin_arena',
            HEALTH_TIMEOUT_MS: 3000,
            INTERPOLATION_LERP: 0.24,
            getServerUrl: function() {
                try {
                    const params = new URLSearchParams(window.location.search);
                    const queryServer = params.get('server');
                    if (queryServer) return queryServer;

                    const stored = localStorage.getItem('pumpkin_server_url');
                    if (stored && stored.trim()) return stored.trim();

                    if (window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && window.location.protocol.startsWith('http')) {
                        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                        return `${protocol}//${window.location.hostname}:2567`;
                    }
                } catch (e) {}

                return 'ws://localhost:2567';
            }
        },

        // Economy & Coins (Prestige Progression & Harder Unlocks)
        ECONOMY: {
            STARTING_COINS: 25,
            COIN_PER_NORMAL_SEED: 1,
            COIN_PER_SUPER_SEED: 5,
            COINS_PER_KILL: 25,
            VICTORY_COINS: 350,
            TOP3_COINS: 180,
            TOP10_COINS: 80,
            PARTICIPATION_COINS: 25
        },

        // Player & Entity Base Stats (Buffed Survivability & Spawn Shield)
        PLAYER: {
            BASE_HEALTH: 160, // Buffed from 100 so player has substantial HP!
            BASE_SPEED: 255,
            BASE_RADIUS: 28,
            BASE_DAMAGE: 24,
            FIRE_COOLDOWN: 190, // ms between shots
            BULLET_SPEED: 720,
            BULLET_LIFETIME: 900, // ms
            BULLET_RADIUS: 8,
            INVULN_TIME: 250, // ms grace period after hit
            SPAWN_SHIELD_DURATION: 4000, // 4.0s golden spawn protection
            ADRENALINE_RATIO: 0.30, // Trigger below 30% HP
            ADRENALINE_SPEED_BOOST: 1.16 // +16% panic speed boost to clutch & escape!
        },

        // Growth & Level System
        GROWTH: {
            MAX_LEVEL: 15,
            XP_THRESHOLDS: [
                0,    // Lvl 1
                40,   // Lvl 2
                100,  // Lvl 3
                180,  // Lvl 4
                280,  // Lvl 5
                400,  // Lvl 6
                550,  // Lvl 7
                720,  // Lvl 8
                920,  // Lvl 9
                1150, // Lvl 10
                1420, // Lvl 11
                1730, // Lvl 12
                2100, // Lvl 13
                2550, // Lvl 14
                3100  // Lvl 15
            ],
            SCALE_PER_LEVEL: 0.055,
            SPEED_PENALTY_PER_LEVEL: 4.5,
            MIN_SPEED: 185,
            HP_PER_LEVEL: 22,
            DAMAGE_PER_LEVEL: 2.5,
            BULLET_SCALE_PER_LEVEL: 0.04
        },

        // Seed Pickups (Dense arena loot & enhanced healing)
        SEEDS: {
            NORMAL_COUNT: 380, // Scaled for massive 5400x5400 arena
            SUPER_COUNT: 50,
            NORMAL_XP: 14,
            NORMAL_HEAL: 6, // Buffed healing so eating seeds saves your life!
            SUPER_XP: 55,
            SUPER_HEAL: 26,
            RESPAWN_DELAY: 3200,
            DROP_SEEDS_ON_DEATH_MIN: 6,
            DROP_SEEDS_ON_DEATH_MAX: 12
        },

        // Bots AI Settings (50 Players Total Match)
        BOTS: {
            COUNT: 49, // 49 bots + 1 player = 50 PLAYERS TOTAL!
            NAMES: [
                "JackO'Slasher [BOT]", "GourdGuzzler [BOT]", "SpookySpectre [BOT]", "CandyCorpse [BOT]",
                "CobwebCrusher [BOT]", "Vampkin [BOT]", "BoneBiter [BOT]", "GhostlyGourd [BOT]",
                "NightStalker [BOT]", "PumpkinReaper [BOT]", "ShadowFiend [BOT]", "CrimsonFang [BOT]",
                "WitchsCauldron [BOT]", "RottenRemnant [BOT]", "PhantomMenace [BOT]", "GraveDigger [BOT]",
                "SinisterStem [BOT]", "GrimHallow [BOT]", "CursedCrown [BOT]", "DoomGourd [BOT]",
                "ToxicTerror [BOT]", "BrimstoneBane [BOT]", "HarvestHunter [BOT]", "SoulStalker [BOT]",
                "BansheeBite [BOT]", "SpectreStrike [BOT]", "HexHollow [BOT]", "CryptCrawler [BOT]",
                "DreadPumpkin [BOT]", "SkullMasher [BOT]", "VenomVine [BOT]", "GloomGourd [BOT]",
                "NocturneKnight [BOT]", "GhastlyGhost [BOT]", "HauntedHorror [BOT]", "EerieExecutioner [BOT]",
                "ReaperRune [BOT]", "InfernoImp [BOT]", "DarkDecap [BOT]", "WickedWight [BOT]",
                "MidnightMauler [BOT]", "VoidVanquisher [BOT]", "PlaguePumpkin [BOT]", "SpitefulSprout [BOT]",
                "RancidRoot [BOT]", "BlazingBeast [BOT]", "CarnageKing [BOT]", "TerrorTitan [BOT]", "FinalHarvest [BOT]"
            ],
            SKINS: [
                'toxic', 'ghost', 'blood', 'midnight', 
                'candy', 'cyber', 'golden', 'classic', 'inferno'
            ],
            VISION_RADIUS: 540,
            ATTACK_RANGE: 420,
            RETREAT_HP_RATIO: 0.25,
            FIRE_ACCURACY: 0.65 // Fair early-game aim so player doesn't get laser-beamed!
        },

        // Pumpkin Storm (Danger Zone for 5400x5400 Arena)
        STORM: {
            INITIAL_DELAY: 28, // 28s early harvest freedom
            WARNING_TIME: 12,
            SHRINK_TIME: 26,
            DAMAGE_INTERVAL: 1000,
            DAMAGE_PERCENT: 0.07,
            PHASES: [
                { safeRadius: 2100 },
                { safeRadius: 1500 },
                { safeRadius: 950 },
                { safeRadius: 450 },
                { safeRadius: 180 }
            ]
        },

        // 22 Unique Guns Catalog for the Weapon Armory Shop & Firing Mechanics
        GUNS: {
            SEED_PISTOL: {
                id: 'SEED_PISTOL',
                name: 'Classic Spitter',
                badge: '🌱 CLASSIC SPITTER',
                price: 0,
                rarity: 'Common',
                color: 0xffaa00,
                bulletColor: '#ffaa00',
                damageMultiplier: 1.0,
                cooldownMultiplier: 1.0,
                speedMultiplier: 1.0,
                bulletTexture: 'bullet_seed',
                icon: '🌱',
                type: 'SINGLE',
                desc: 'Reliable single pumpkin seed shooter.'
            },
            DOUBLE_TAP: {
                id: 'DOUBLE_TAP',
                name: 'Twin Spitter',
                badge: '🌿 TWIN SPITTER',
                price: 150,
                rarity: 'Common',
                color: 0x84cc16,
                bulletColor: '#84cc16',
                damageMultiplier: 0.85,
                cooldownMultiplier: 0.95,
                speedMultiplier: 1.05,
                bulletTexture: 'bullet_double',
                icon: '🌿',
                type: 'TWIN',
                desc: 'Fires two parallel seeds simultaneously.'
            },
            PUMPKIN_SMG: {
                id: 'PUMPKIN_SMG',
                name: 'Vine Blaster',
                badge: '⚡ VINE BLASTER',
                price: 350,
                rarity: 'Rare',
                color: 0x06b6d4,
                bulletColor: '#06b6d4',
                damageMultiplier: 0.65,
                cooldownMultiplier: 0.45,
                speedMultiplier: 1.15,
                bulletTexture: 'bullet_smg',
                icon: '⚡',
                type: 'RAPID',
                desc: 'Rapid-firing light vine thorns.'
            },
            PUMPKIN_SHOTGUN: {
                id: 'PUMPKIN_SHOTGUN',
                name: 'Harvest Buckshot',
                badge: '💥 HARVEST BUCKSHOT',
                price: 650,
                rarity: 'Rare',
                color: 0xf97316,
                bulletColor: '#f97316',
                damageMultiplier: 0.72,
                cooldownMultiplier: 1.45,
                speedMultiplier: 1.12,
                count: 5,
                bulletTexture: 'bullet_shotgun',
                icon: '💥',
                type: 'SHOTGUN',
                desc: 'Fires 5 fiery pellets with heavy point-blank punch.'
            },
            SNIPER_SEED: {
                id: 'SNIPER_SEED',
                name: 'Haunted Longshot',
                badge: '🎯 HAUNTED LONGSHOT',
                price: 1100,
                rarity: 'Rare',
                color: 0xec4899,
                bulletColor: '#ec4899',
                damageMultiplier: 2.2,
                cooldownMultiplier: 2.1,
                speedMultiplier: 1.7,
                bulletTexture: 'bullet_sniper',
                icon: '🎯',
                type: 'SNIPER',
                desc: 'High-velocity long-range armor piercer.'
            },
            TRIPLE_FAN: {
                id: 'TRIPLE_FAN',
                name: 'Emerald Broadside',
                badge: '💚 EMERALD BROADSIDE',
                price: 1600,
                rarity: 'Epic',
                color: 0x10b981,
                bulletColor: '#10b981',
                damageMultiplier: 0.85,
                cooldownMultiplier: 1.05,
                speedMultiplier: 1.0,
                count: 3,
                bulletTexture: 'bullet_triple',
                icon: '☘️',
                type: 'TRIPLE',
                desc: 'Wide 3-way emerald seed broadside.'
            },
            GHOSTFIRE: {
                id: 'GHOSTFIRE',
                name: 'Soul Flamethrower',
                badge: '🔥 GHOSTFIRE STREAM',
                price: 2200,
                rarity: 'Epic',
                color: 0xa855f7,
                bulletColor: '#a855f7',
                damageMultiplier: 0.48,
                cooldownMultiplier: 0.28,
                speedMultiplier: 1.35,
                bulletTexture: 'bullet_ghostfire',
                icon: '🔥',
                type: 'GHOSTFIRE',
                desc: 'Continuous searing soul-flame stream.'
            },
            BOUNCER_CRYSTAL: {
                id: 'BOUNCER_CRYSTAL',
                name: 'Violet Ricochet',
                badge: '🔮 VIOLET RICOCHET',
                price: 2900,
                rarity: 'Epic',
                color: 0xd946ef,
                bulletColor: '#d946ef',
                damageMultiplier: 1.25,
                cooldownMultiplier: 1.15,
                speedMultiplier: 1.0,
                maxBounces: 2,
                bulletTexture: 'bullet_bouncing',
                icon: '🔮',
                type: 'BOUNCING',
                desc: 'Spooky violet crystals that ricochet off walls.'
            },
            HOMING_SPECTRE: {
                id: 'HOMING_SPECTRE',
                name: 'Phantom Seeker',
                badge: '👻 PHANTOM SEEKER',
                price: 3700,
                rarity: 'Epic',
                color: 0x38bdf8,
                bulletColor: '#38bdf8',
                damageMultiplier: 1.15,
                cooldownMultiplier: 1.1,
                speedMultiplier: 0.94,
                bulletTexture: 'bullet_homing',
                icon: '👻',
                type: 'HOMING',
                desc: 'Curving phantom seeds that seek nearby enemies.'
            },
            MINIGUN: {
                id: 'MINIGUN',
                name: 'Gatling Gourd',
                badge: '⚙️ GATLING GOURD',
                price: 4600,
                rarity: 'Legendary',
                color: 0xeab308,
                bulletColor: '#eab308',
                damageMultiplier: 0.55,
                cooldownMultiplier: 0.22,
                speedMultiplier: 1.28,
                bulletTexture: 'bullet_minigun',
                icon: '⚙️',
                type: 'MINIGUN',
                desc: 'Devastating heavy seed vulcan with crazy fire rate.'
            },
            TOXIC_SPITTER: {
                id: 'TOXIC_SPITTER',
                name: 'Venom Dart',
                badge: '🧪 VENOM DART',
                price: 5600,
                rarity: 'Legendary',
                color: 0x22c55e,
                bulletColor: '#22c55e',
                damageMultiplier: 1.35,
                cooldownMultiplier: 1.15,
                speedMultiplier: 1.1,
                bulletTexture: 'bullet_toxic',
                icon: '🧪',
                type: 'TOXIC',
                desc: 'Corrosive toxic slime darts that melt through foes.'
            },
            PLASMA_CANNON: {
                id: 'PLASMA_CANNON',
                name: 'Cyber Pulse',
                badge: '💠 CYBER PULSE',
                price: 6800,
                rarity: 'Legendary',
                color: 0x00f0ff,
                bulletColor: '#00f0ff',
                damageMultiplier: 1.75,
                cooldownMultiplier: 1.6,
                speedMultiplier: 1.22,
                bulletTexture: 'bullet_plasma',
                icon: '💠',
                type: 'PLASMA',
                desc: 'Concentrated neon plasma balls with heavy impact.'
            },
            HEX_BURST: {
                id: 'HEX_BURST',
                name: "Witch's Hexgun",
                badge: '🧙‍♀️ WITCH HEXGUN',
                price: 8100,
                rarity: 'Legendary',
                color: 0x9333ea,
                bulletColor: '#9333ea',
                damageMultiplier: 0.8,
                cooldownMultiplier: 0.75,
                speedMultiplier: 1.2,
                count: 3,
                bulletTexture: 'bullet_hex',
                icon: '✨',
                type: 'HEX',
                desc: '3-burst magical hex sparks that disorient foes.'
            },
            CROSS_FIRE: {
                id: 'CROSS_FIRE',
                name: 'Grave Crossbow',
                badge: '✝️ GRAVE CROSSBOW',
                price: 9500,
                rarity: 'Legendary',
                color: 0xf43f5e,
                bulletColor: '#f43f5e',
                damageMultiplier: 0.95,
                cooldownMultiplier: 1.25,
                speedMultiplier: 1.15,
                count: 4,
                bulletTexture: 'bullet_cross',
                icon: '✝️',
                type: 'CROSS',
                desc: 'Fires in 4 cardinal directions simultaneously!'
            },
            METEOR_LAUNCHER: {
                id: 'METEOR_LAUNCHER',
                name: 'Inferno Catapult',
                badge: '☄️ INFERNO CATAPULT',
                price: 11000,
                rarity: 'Legendary',
                color: 0xff4500,
                bulletColor: '#ff4500',
                damageMultiplier: 2.1,
                cooldownMultiplier: 1.8,
                speedMultiplier: 1.05,
                bulletTexture: 'bullet_meteor',
                icon: '☄️',
                type: 'METEOR',
                desc: 'Heavy exploding molten meteors with splash sparks.'
            },
            SPIRIT_ORB: {
                id: 'SPIRIT_ORB',
                name: 'Banshee Scream',
                badge: '👻 BANSHEE SCREAM',
                price: 12800,
                rarity: 'Legendary',
                color: 0x67e8f9,
                bulletColor: '#67e8f9',
                damageMultiplier: 1.4,
                cooldownMultiplier: 0.95,
                speedMultiplier: 1.12,
                bulletTexture: 'bullet_spirit',
                icon: '🌀',
                type: 'SPIRIT',
                desc: 'Oscillating wave projectiles that confuse enemy evasions.'
            },
            CHAIN_LIGHTNING: {
                id: 'CHAIN_LIGHTNING',
                name: 'Storm Arc',
                badge: '⚡ STORM ARC',
                price: 14800,
                rarity: 'Legendary',
                color: 0x3b82f6,
                bulletColor: '#3b82f6',
                damageMultiplier: 1.55,
                cooldownMultiplier: 0.85,
                speedMultiplier: 1.85,
                bulletTexture: 'bullet_lightning',
                icon: '⚡',
                type: 'LIGHTNING',
                desc: 'Ultra-fast electric blue bolts with instant strike.'
            },
            VOID_BEAM: {
                id: 'VOID_BEAM',
                name: 'Nether Ray',
                badge: '🌌 NETHER RAY',
                price: 17000,
                rarity: 'Mythic',
                color: 0x7c3aed,
                bulletColor: '#7c3aed',
                damageMultiplier: 2.4,
                cooldownMultiplier: 1.7,
                speedMultiplier: 1.6,
                bulletTexture: 'bullet_void',
                icon: '🌌',
                type: 'VOID',
                desc: 'Dense dark-matter beam that cuts through armor.'
            },
            REAPER_SCYTHE: {
                id: 'REAPER_SCYTHE',
                name: 'Soul Carver',
                badge: '☠️ SOUL CARVER',
                price: 19500,
                rarity: 'Mythic',
                color: 0xe11d48,
                bulletColor: '#e11d48',
                damageMultiplier: 1.8,
                cooldownMultiplier: 1.1,
                speedMultiplier: 1.25,
                bulletTexture: 'bullet_scythe',
                icon: '⚔️',
                type: 'SCYTHE',
                desc: 'Spinning crescent scythes that slice everything.'
            },
            DOOM_BLASTER: {
                id: 'DOOM_BLASTER',
                name: 'Apocalypse Gourd',
                badge: '💀 APOCALYPSE GOURD',
                price: 23000,
                rarity: 'Mythic',
                color: 0xff0055,
                bulletColor: '#ff0055',
                damageMultiplier: 2.8,
                cooldownMultiplier: 1.75,
                speedMultiplier: 1.35,
                bulletTexture: 'bullet_doom',
                icon: '💀',
                type: 'DOOM',
                desc: 'Demonic molten core that demolishes rivals.'
            },
            CELESTIAL_STAR: {
                id: 'CELESTIAL_STAR',
                name: 'God Gourd Supernova',
                badge: '🌟 CELESTIAL SUPERNOVA',
                price: 28000,
                rarity: 'Mythic',
                color: 0xfff07c,
                bulletColor: '#fff07c',
                damageMultiplier: 3.2,
                cooldownMultiplier: 1.6,
                speedMultiplier: 1.45,
                bulletTexture: 'bullet_star',
                icon: '🌟',
                type: 'STAR',
                desc: 'Shining starburst core of pure solar divinity.'
            },
            NEON_DISC: {
                id: 'NEON_DISC',
                name: 'Cyber Slicer',
                badge: '💿 CYBER SLICER',
                price: 32000,
                rarity: 'Godly 👑',
                color: 0x00ffcc,
                bulletColor: '#00ffcc',
                damageMultiplier: 3.6,
                cooldownMultiplier: 1.3,
                speedMultiplier: 1.75,
                bulletTexture: 'bullet_disc',
                icon: '💿',
                type: 'DISC',
                desc: 'Hyper-advanced spinning photon disc with maximum lethality.'
            }
        },

        // Legacy In-Game Pickups Reference (Synchronized with GUNS)
        WEAPONS: {
            TRIPLE: {
                id: 'TRIPLE_FAN',
                name: 'TRIPLE SHOT',
                badge: '💚 TRIPLE SHOT',
                color: 0x10b981,
                bulletColor: '#10b981',
                duration: 16000,
                spreadDeg: 24,
                count: 3,
                damageMultiplier: 0.85,
                bulletTexture: 'bullet_triple',
                icon: '🌿'
            },
            RAPID: {
                id: 'PUMPKIN_SMG',
                name: 'RAPID FIRE',
                badge: '⚡ RAPID NEEDLES',
                color: 0x00f0ff,
                bulletColor: '#00f0ff',
                duration: 14000,
                cooldownMultiplier: 0.40,
                damageMultiplier: 0.65,
                bulletTexture: 'bullet_rapid',
                icon: '⚡'
            },
            BOUNCING: {
                id: 'BOUNCER_CRYSTAL',
                name: 'BOUNCING CRYSTALS',
                badge: '🔮 BOUNCING SEEDS',
                color: 0xd946ef,
                bulletColor: '#d946ef',
                duration: 18000,
                maxBounces: 2,
                damageMultiplier: 1.25,
                bulletTexture: 'bullet_bouncing',
                icon: '🔮'
            },
            SHOTGUN: {
                id: 'PUMPKIN_SHOTGUN',
                name: 'PUMPKIN SHOTGUN',
                badge: '💥 BUCKSHOT CANNON',
                color: 0xff6600,
                bulletColor: '#ff6600',
                duration: 15000,
                spreadDeg: 36,
                count: 5,
                damageMultiplier: 0.72,
                cooldownMultiplier: 1.45,
                bulletTexture: 'bullet_shotgun',
                icon: '💥'
            },
            GHOSTFIRE: {
                id: 'GHOSTFIRE',
                name: 'SOUL FLAMETHROWER',
                badge: '🔥 GHOSTFIRE STREAM',
                color: 0xa855f7,
                bulletColor: '#a855f7',
                duration: 14000,
                cooldownMultiplier: 0.28,
                damageMultiplier: 0.48,
                bulletTexture: 'bullet_ghostfire',
                icon: '🔥'
            },
            HOMING: {
                id: 'HOMING_SPECTRE',
                name: 'HOMING SPECTRES',
                badge: '👻 HOMING SEEDS',
                color: 0x38bdf8,
                bulletColor: '#38bdf8',
                duration: 16000,
                damageMultiplier: 1.15,
                bulletTexture: 'bullet_homing',
                icon: '👻',
                homingTurnRate: 0.085,
                homingRange: 550
            }
        },

        // Rare Explosive Seed Pickups
        EXPLOSIVE_SEEDS: {
            COUNT: 18,
            FUSE_MS: 1200,
            BLAST_RADIUS: 220,
            BLAST_DAMAGE: 75,
            RESPAWN_DELAY: 14000
        },

        // Progressive Bot Difficulty Scaling
        BOT_SCALING: {
            PHASE_MID_TIME: 45,
            PHASE_LATE_TIME: 90,
            SPEED_MID: 1.08,
            SPEED_LATE: 1.18,
            ACCURACY_MID: 0.72,
            ACCURACY_LATE: 0.85,
            COOLDOWN_LATE: 0.88,
            VISION_MID: 1.1,
            VISION_LATE: 1.25
        },

        // Growth Tiers & Milestone Appearances
        TIERS: [
            { minLevel: 1, name: 'Sproutling', title: '🌱 SPROUTLING' },
            { minLevel: 4, name: 'Carved Beast', title: '🎃 CARVED BEAST', collar: true },
            { minLevel: 8, name: 'Gourd Colossus', title: '⚡ GOURD COLOSSUS', flames: true, thorns: true },
            { minLevel: 12, name: 'Harvest Titan', title: '👑 HARVEST TITAN', titanHalo: true, aura: true }
        ],

        // 32 Distinct Pumpkin Skins Catalog & Price Matrix
        SKINS: {
            classic: {
                id: 'classic',
                name: "Classic Harvest",
                price: 0,
                rarity: "Common",
                bodyColor: 0xfa6400,
                ribColor: 0xd44800,
                glowColor: 0xffe600,
                stemColor: 0x48a02c,
                eyeColor: 0xffdd00,
                tagline: "The timeless Halloween pumpkin"
            },
            toxic: {
                id: 'toxic',
                name: "Toxic Slime",
                price: 250,
                rarity: "Rare",
                bodyColor: 0x2cd448,
                ribColor: 0x1a8f2e,
                glowColor: 0x88ff00,
                stemColor: 0x9028d0,
                eyeColor: 0xadff2f,
                tagline: "Radioactive and dangerously slimy"
            },
            candy: {
                id: 'candy',
                name: "Candy Corn",
                price: 600,
                rarity: "Rare",
                bodyColor: 0xf5a623,
                ribColor: 0xf8e71c,
                glowColor: 0xffffff,
                stemColor: 0xf5f5f5,
                eyeColor: 0xffffff,
                tagline: "Sweet outside, deadly inside"
            },
            frost: {
                id: 'frost',
                name: "Frostbite Jack",
                price: 850,
                rarity: "Rare",
                bodyColor: 0x38bdf8,
                ribColor: 0x0284c7,
                glowColor: 0xe0f2fe,
                stemColor: 0xbae6fd,
                eyeColor: 0x00f0ff,
                tagline: "Frozen glacial ice with subzero bite"
            },
            zombie: {
                id: 'zombie',
                name: "Undead Ghoul",
                price: 1100,
                rarity: "Rare",
                bodyColor: 0x4d7c0f,
                ribColor: 0x365314,
                glowColor: 0xa3e635,
                stemColor: 0x1f2937,
                eyeColor: 0xfacc15,
                tagline: "Decaying moss rind with stitched grin"
            },
            ghost: {
                id: 'ghost',
                name: "Spectral Phantom",
                price: 1400,
                rarity: "Epic",
                bodyColor: 0xe8ecf5,
                ribColor: 0xb4c0d8,
                glowColor: 0x5df2d6,
                stemColor: 0x6e82a0,
                eyeColor: 0x00f5d4,
                tagline: "Float like an icy cemetery ghost"
            },
            shadow: {
                id: 'shadow',
                name: "Shadow Stalker",
                price: 1800,
                rarity: "Epic",
                bodyColor: 0x262626,
                ribColor: 0x171717,
                glowColor: 0xa855f7,
                stemColor: 0x525252,
                eyeColor: 0xc084fc,
                tagline: "Creeps unseen in the darkest corners"
            },
            blood: {
                id: 'blood',
                name: "Blood Moon Slasher",
                price: 2400,
                rarity: "Epic",
                bodyColor: 0xbe122a,
                ribColor: 0x820919,
                glowColor: 0xff3838,
                stemColor: 0x222222,
                eyeColor: 0xff5555,
                tagline: "Carved under the crimson lunar eclipse"
            },
            radioactive: {
                id: 'radioactive',
                name: "Atomic Meltdown",
                price: 2900,
                rarity: "Epic",
                bodyColor: 0xeab308,
                ribColor: 0xa16207,
                glowColor: 0x84cc16,
                stemColor: 0x15803d,
                eyeColor: 0x22c55e,
                tagline: "Hazardous isotope core glowing bright"
            },
            royal: {
                id: 'royal',
                name: "Royal Monarch",
                price: 3500,
                rarity: "Epic",
                bodyColor: 0x6b21a8,
                ribColor: 0x4c1d95,
                glowColor: 0xfacc15,
                stemColor: 0xeab308,
                eyeColor: 0xfde047,
                tagline: "Imperial purple adorned with pure gold"
            },
            midnight: {
                id: 'midnight',
                name: "Void Shadow",
                price: 4200,
                rarity: "Epic",
                bodyColor: 0x582496,
                ribColor: 0x361066,
                glowColor: 0xbf55ec,
                stemColor: 0x110524,
                eyeColor: 0xe056fd,
                tagline: "Infused with dark dark matter"
            },
            emerald: {
                id: 'emerald',
                name: "Jade Emperor",
                price: 4800,
                rarity: "Epic",
                bodyColor: 0x059669,
                ribColor: 0x047857,
                glowColor: 0x34d399,
                stemColor: 0x064e3b,
                eyeColor: 0x6ee7b7,
                tagline: "Carved from an unbroken boulder of jade"
            },
            sakura: {
                id: 'sakura',
                name: "Sakura Blossom",
                price: 5400,
                rarity: "Epic",
                bodyColor: 0xf472b6,
                ribColor: 0xdb2777,
                glowColor: 0xfce7f3,
                stemColor: 0x78350f,
                eyeColor: 0xffffff,
                tagline: "Gentle cherry blossom with thorns"
            },
            skeleton: {
                id: 'skeleton',
                name: "Ossuary Bone",
                price: 6000,
                rarity: "Epic",
                bodyColor: 0xd6d3d1,
                ribColor: 0xa8a29e,
                glowColor: 0x38bdf8,
                stemColor: 0x57534e,
                eyeColor: 0x0284c7,
                tagline: "Bleached bone shell from ancient catacombs"
            },
            clown: {
                id: 'clown',
                name: "Creepy Jester",
                price: 6600,
                rarity: "Epic",
                bodyColor: 0x7e22ce,
                ribColor: 0xa21caf,
                glowColor: 0xef4444,
                stemColor: 0x22c55e,
                eyeColor: 0xef4444,
                tagline: "A sinister smile that never fades"
            },
            cyber: {
                id: 'cyber',
                name: "Cyberpunk Jack",
                price: 7500,
                rarity: "Legendary",
                bodyColor: 0x1e293b,
                ribColor: 0x0f172a,
                glowColor: 0x00f0ff,
                stemColor: 0xff0055,
                eyeColor: 0x00f0ff,
                tagline: "High-tech neon assassin from 2077"
            },
            golden: {
                id: 'golden',
                name: "Royal Midas Gold",
                price: 8500,
                rarity: "Legendary",
                bodyColor: 0xf7b731,
                ribColor: 0xeb9800,
                glowColor: 0xfff07c,
                stemColor: 0xd48806,
                eyeColor: 0xfffa65,
                tagline: "Cast in solid 24K enchanted gold"
            },
            cosmic: {
                id: 'cosmic',
                name: "Galaxy Nebula",
                price: 9600,
                rarity: "Legendary",
                bodyColor: 0x312e81,
                ribColor: 0x1e1b4b,
                glowColor: 0xec4899,
                stemColor: 0x818cf8,
                eyeColor: 0xa855f7,
                tagline: "Stardust and distant cosmos in your eyes"
            },
            magma: {
                id: 'magma',
                name: "Magma Core",
                price: 10800,
                rarity: "Legendary",
                bodyColor: 0x7f1d1d,
                ribColor: 0x450a0a,
                glowColor: 0xf97316,
                stemColor: 0x18181b,
                eyeColor: 0xfbbf24,
                tagline: "Basalt rock cracked by molten lava"
            },
            steampunk: {
                id: 'steampunk',
                name: "Brass Steamtech",
                price: 12000,
                rarity: "Legendary",
                bodyColor: 0xb45309,
                ribColor: 0x78350f,
                glowColor: 0xfde047,
                stemColor: 0x713f12,
                eyeColor: 0x38bdf8,
                tagline: "Whirring gears and copper steam pipes"
            },
            ninja: {
                id: 'ninja',
                name: "Shinobi Night",
                price: 13200,
                rarity: "Legendary",
                bodyColor: 0x18181b,
                ribColor: 0x09090b,
                glowColor: 0xef4444,
                stemColor: 0x3f3f46,
                eyeColor: 0xdc2626,
                tagline: "Silent as midnight, sharp as a shuriken"
            },
            sunfire: {
                id: 'sunfire',
                name: "Solar Flare",
                price: 14500,
                rarity: "Legendary",
                bodyColor: 0xf59e0b,
                ribColor: 0xd97706,
                glowColor: 0xffedd5,
                stemColor: 0xb45309,
                eyeColor: 0xffffff,
                tagline: "Blinding solar radiation and solar corona"
            },
            abyssal: {
                id: 'abyssal',
                name: "Deep Ocean Abyssal",
                price: 15800,
                rarity: "Legendary",
                bodyColor: 0x0f766e,
                ribColor: 0x115e59,
                glowColor: 0x2dd4bf,
                stemColor: 0x042f2e,
                eyeColor: 0x14b8a6,
                tagline: "Bioluminescent leviathan from the deep trench"
            },
            amethyst: {
                id: 'amethyst',
                name: "Crystal Amethyst",
                price: 17200,
                rarity: "Legendary",
                bodyColor: 0x7e22ce,
                ribColor: 0x581c87,
                glowColor: 0xd8b4fe,
                stemColor: 0x3b0764,
                eyeColor: 0xe9d5ff,
                tagline: "Faceted geometric purple gemstone"
            },
            ruby: {
                id: 'ruby',
                name: "Crimson Ruby",
                price: 18600,
                rarity: "Legendary",
                bodyColor: 0x9f1239,
                ribColor: 0x881337,
                glowColor: 0xfb7185,
                stemColor: 0x4c0519,
                eyeColor: 0xffe4e6,
                tagline: "Faceted royal jewel reflecting pure flame"
            },
            obsidian: {
                id: 'obsidian',
                name: "Obsidian Knight",
                price: 20000,
                rarity: "Legendary",
                bodyColor: 0x0a0a0a,
                ribColor: 0x000000,
                glowColor: 0xe2e8f0,
                stemColor: 0x64748b,
                eyeColor: 0xf8fafc,
                tagline: "Volcanic glass forged in the underworld"
            },
            plasma: {
                id: 'plasma',
                name: "Neon Synthwave",
                price: 21500,
                rarity: "Legendary",
                bodyColor: 0xdb2777,
                ribColor: 0x9d174d,
                glowColor: 0x06b6d4,
                stemColor: 0xec4899,
                eyeColor: 0x00f0ff,
                tagline: "Outrun 1984 neon laser aesthetic"
            },
            inferno: {
                id: 'inferno',
                name: "🔥 INFERNAL VOID LORD",
                price: 24000,
                rarity: "MYTHIC 🔥",
                bodyColor: 0x210606,
                ribColor: 0x500a0a,
                glowColor: 0xff3b00,
                stemColor: 0xff6600,
                eyeColor: 0xff2200,
                tagline: "THE ULTIMATE BOMB! Molten lava horns & demonic fury"
            },
            necromancer: {
                id: 'necromancer',
                name: "Lich King",
                price: 26500,
                rarity: "MYTHIC 💀",
                bodyColor: 0x1e1b4b,
                ribColor: 0x0f172a,
                glowColor: 0x38bdf8,
                stemColor: 0xe2e8f0,
                eyeColor: 0x0284c7,
                tagline: "Master of dark soul resurrection and frost"
            },
            chronos: {
                id: 'chronos',
                name: "Time Weaver",
                price: 29000,
                rarity: "MYTHIC ⏳",
                bodyColor: 0xd97706,
                ribColor: 0x92400e,
                glowColor: 0x67e8f9,
                stemColor: 0x78350f,
                eyeColor: 0x00f0ff,
                tagline: "Bends match time and spatial dimensions"
            },
            celestial: {
                id: 'celestial',
                name: "Celestial Archon",
                price: 32000,
                rarity: "MYTHIC 🕊️",
                bodyColor: 0xf8fafc,
                ribColor: 0xe2e8f0,
                glowColor: 0xfacc15,
                stemColor: 0xfef08a,
                eyeColor: 0xeab308,
                tagline: "Heavenly radiance with holy golden aura"
            },
            apocalypse: {
                id: 'apocalypse',
                name: "⚡ DOOM HARBINGER",
                price: 38000,
                rarity: "GODLY 👑",
                bodyColor: 0x110202,
                ribColor: 0x3b0707,
                glowColor: 0xff0044,
                stemColor: 0xff0033,
                eyeColor: 0xff0066,
                tagline: "THE SUPREME GOD GOURD: Unstoppable end of days!"
            }
        }
    };
})();
