module.exports = {
    WORLD: {
        WIDTH: 5400,
        HEIGHT: 5400,
        MAX_SPEED: 320,
        PLAYER_RADIUS: 28,
        OBSTACLES: []
    },
    PLAYER: {
        BASE_HEALTH: 160,
        BASE_SPEED: 255,
        BASE_DAMAGE: 24,
        FIRE_COOLDOWN: 190,
        BULLET_SPEED: 720,
        BULLET_LIFETIME: 900,
        INVULN_TIME: 250
    },
    GROWTH: {
        MAX_LEVEL: 15,
        XP_THRESHOLDS: [
            0, 40, 100, 180, 280, 400, 550, 720, 920, 1150, 1420, 1730, 2100, 2550, 3100
        ],
        HP_PER_LEVEL: 22,
        DAMAGE_PER_LEVEL: 2.5,
        SPEED_PENALTY_PER_LEVEL: 4.5,
        MIN_SPEED: 185
    },
    SEEDS: {
        NORMAL_COUNT: 380,
        SUPER_COUNT: 50,
        NORMAL_XP: 14,
        NORMAL_HEAL: 6,
        SUPER_XP: 55,
        SUPER_HEAL: 26,
        RESPAWN_DELAY: 3200
    },
    WEAPONS: {
        TRIPLE: {
            duration: 16000,
            damageMultiplier: 0.82,
            spreadRad: 0.24
        },
        RAPID: {
            duration: 14000,
            cooldownMultiplier: 0.40,
            damageMultiplier: 0.65,
            speedMultiplier: 1.25
        },
        BOUNCING: {
            duration: 18000,
            damageMultiplier: 1.18,
            maxBounces: 2
        },
        SHOTGUN: {
            duration: 15000,
            count: 5,
            spreadRad: 0.35,
            damageMultiplier: 0.68,
            cooldownMultiplier: 1.5
        },
        GHOSTFIRE: {
            duration: 14000,
            cooldownMultiplier: 0.28,
            damageMultiplier: 0.45,
            speedMultiplier: 1.2
        },
        HOMING: {
            duration: 16000,
            damageMultiplier: 1.05
        }
    },
    EXPLOSIVE_SEEDS: {
        COUNT: 18,
        FUSE_MS: 1200,
        BLAST_RADIUS: 220,
        BLAST_DAMAGE: 75,
        RESPAWN_DELAY: 14000
    },
    STORM: {
        INITIAL_DELAY: 28,
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
    GUNS: {
        SEED_PISTOL: { id: 'SEED_PISTOL', name: 'Classic Spitter', type: 'SINGLE', damageMultiplier: 1.0, cooldownMultiplier: 1.0, speedMultiplier: 1.0 },
        DOUBLE_TAP: { id: 'DOUBLE_TAP', name: 'Twin Spitter', type: 'TWIN', damageMultiplier: 0.85, cooldownMultiplier: 0.95, speedMultiplier: 1.05 },
        PUMPKIN_SMG: { id: 'PUMPKIN_SMG', name: 'Vine Blaster', type: 'RAPID', damageMultiplier: 0.65, cooldownMultiplier: 0.45, speedMultiplier: 1.15 },
        PUMPKIN_SHOTGUN: { id: 'PUMPKIN_SHOTGUN', name: 'Harvest Buckshot', type: 'SHOTGUN', count: 5, spreadRad: 0.32, damageMultiplier: 0.72, cooldownMultiplier: 1.45, speedMultiplier: 1.12 },
        SNIPER_SEED: { id: 'SNIPER_SEED', name: 'Haunted Longshot', type: 'SNIPER', damageMultiplier: 2.2, cooldownMultiplier: 2.1, speedMultiplier: 1.7 },
        TRIPLE_FAN: { id: 'TRIPLE_FAN', name: 'Emerald Broadside', type: 'TRIPLE', count: 3, spreadRad: 0.23, damageMultiplier: 0.85, cooldownMultiplier: 1.05, speedMultiplier: 1.0 },
        GHOSTFIRE: { id: 'GHOSTFIRE', name: 'Soul Flamethrower', type: 'GHOSTFIRE', damageMultiplier: 0.48, cooldownMultiplier: 0.28, speedMultiplier: 1.35 },
        BOUNCER_CRYSTAL: { id: 'BOUNCER_CRYSTAL', name: 'Violet Ricochet', type: 'BOUNCING', maxBounces: 2, damageMultiplier: 1.25, cooldownMultiplier: 1.15, speedMultiplier: 1.0 },
        HOMING_SPECTRE: { id: 'HOMING_SPECTRE', name: 'Phantom Seeker', type: 'HOMING', damageMultiplier: 1.15, cooldownMultiplier: 1.1, speedMultiplier: 0.94 },
        MINIGUN: { id: 'MINIGUN', name: 'Gatling Gourd', type: 'MINIGUN', damageMultiplier: 0.55, cooldownMultiplier: 0.22, speedMultiplier: 1.28 },
        TOXIC_SPITTER: { id: 'TOXIC_SPITTER', name: 'Venom Dart', type: 'TOXIC', damageMultiplier: 1.35, cooldownMultiplier: 1.15, speedMultiplier: 1.1 },
        PLASMA_CANNON: { id: 'PLASMA_CANNON', name: 'Cyber Pulse', type: 'PLASMA', damageMultiplier: 1.75, cooldownMultiplier: 1.6, speedMultiplier: 1.22 },
        HEX_BURST: { id: 'HEX_BURST', name: "Witch's Hexgun", type: 'HEX', count: 3, damageMultiplier: 0.8, cooldownMultiplier: 0.75, speedMultiplier: 1.2 },
        CROSS_FIRE: { id: 'CROSS_FIRE', name: 'Grave Crossbow', type: 'CROSS', count: 4, damageMultiplier: 0.95, cooldownMultiplier: 1.25, speedMultiplier: 1.15 },
        METEOR_LAUNCHER: { id: 'METEOR_LAUNCHER', name: 'Inferno Catapult', type: 'METEOR', damageMultiplier: 2.1, cooldownMultiplier: 1.8, speedMultiplier: 1.05 },
        SPIRIT_ORB: { id: 'SPIRIT_ORB', name: 'Banshee Scream', type: 'SPIRIT', damageMultiplier: 1.4, cooldownMultiplier: 0.95, speedMultiplier: 1.12 },
        CHAIN_LIGHTNING: { id: 'CHAIN_LIGHTNING', name: 'Storm Arc', type: 'LIGHTNING', damageMultiplier: 1.55, cooldownMultiplier: 0.85, speedMultiplier: 1.85 },
        VOID_BEAM: { id: 'VOID_BEAM', name: 'Nether Ray', type: 'VOID', damageMultiplier: 2.4, cooldownMultiplier: 1.7, speedMultiplier: 1.6 },
        REAPER_SCYTHE: { id: 'REAPER_SCYTHE', name: 'Soul Carver', type: 'SCYTHE', damageMultiplier: 1.8, cooldownMultiplier: 1.1, speedMultiplier: 1.25 },
        DOOM_BLASTER: { id: 'DOOM_BLASTER', name: 'Apocalypse Gourd', type: 'DOOM', damageMultiplier: 2.8, cooldownMultiplier: 1.75, speedMultiplier: 1.35 },
        CELESTIAL_STAR: { id: 'CELESTIAL_STAR', name: 'God Gourd Supernova', type: 'STAR', damageMultiplier: 3.2, cooldownMultiplier: 1.6, speedMultiplier: 1.45 },
        NEON_DISC: { id: 'NEON_DISC', name: 'Cyber Slicer', type: 'DISC', damageMultiplier: 3.6, cooldownMultiplier: 1.3, speedMultiplier: 1.75, maxBounces: 2 }
    },
    BOTS: {
        TARGET_MATCH_PLAYERS: 16,
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
            'classic', 'toxic', 'candy', 'frost', 'zombie', 'ghost', 'shadow', 'blood', 
            'radioactive', 'royal', 'midnight', 'emerald', 'sakura', 'skeleton', 'clown', 
            'cyber', 'golden', 'cosmic', 'magma', 'steampunk', 'ninja', 'sunfire', 
            'abyssal', 'amethyst', 'ruby', 'obsidian', 'plasma', 'inferno', 'necromancer', 
            'chronos', 'celestial', 'apocalypse'
        ]
    }
};
