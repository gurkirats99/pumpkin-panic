const schema = require('@colyseus/schema');
const { Schema, MapSchema, type } = schema;

class PlayerState extends Schema {
    constructor() {
        super();
        this.id = "";
        this.sessionId = "";
        this.name = "Pumpkin";
        this.skin = "classic";
        this.isBot = false;
        this.x = 1600;
        this.y = 1600;
        this.vx = 0;
        this.vy = 0;
        this.aimAngle = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.xp = 0;
        this.kills = 0;
        this.score = 0;
        this.isDead = false;
        this.activeWeapon = "NORMAL";
        this.weaponTimeRemaining = 0;
        this.gun = "SEED_PISTOL";
    }
}
type("string")(PlayerState.prototype, "id");
type("string")(PlayerState.prototype, "sessionId");
type("string")(PlayerState.prototype, "name");
type("string")(PlayerState.prototype, "skin");
type("string")(PlayerState.prototype, "gun");
type("boolean")(PlayerState.prototype, "isBot");
type("number")(PlayerState.prototype, "x");
type("number")(PlayerState.prototype, "y");
type("number")(PlayerState.prototype, "vx");
type("number")(PlayerState.prototype, "vy");
type("number")(PlayerState.prototype, "aimAngle");
type("number")(PlayerState.prototype, "health");
type("number")(PlayerState.prototype, "maxHealth");
type("number")(PlayerState.prototype, "level");
type("number")(PlayerState.prototype, "xp");
type("number")(PlayerState.prototype, "kills");
type("number")(PlayerState.prototype, "score");
type("boolean")(PlayerState.prototype, "isDead");
type("string")(PlayerState.prototype, "activeWeapon");
type("number")(PlayerState.prototype, "weaponTimeRemaining");

class ProjectileState extends Schema {
    constructor() {
        super();
        this.id = "";
        this.ownerId = "";
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.damage = 22;
        this.mutationType = "NORMAL";
        this.bouncesLeft = 0;
    }
}
type("string")(ProjectileState.prototype, "id");
type("string")(ProjectileState.prototype, "ownerId");
type("number")(ProjectileState.prototype, "x");
type("number")(ProjectileState.prototype, "y");
type("number")(ProjectileState.prototype, "vx");
type("number")(ProjectileState.prototype, "vy");
type("number")(ProjectileState.prototype, "damage");
type("string")(ProjectileState.prototype, "mutationType");
type("number")(ProjectileState.prototype, "bouncesLeft");

class SeedState extends Schema {
    constructor() {
        super();
        this.id = "";
        this.x = 0;
        this.y = 0;
        this.isSuper = false;
        this.active = true;
    }
}
type("string")(SeedState.prototype, "id");
type("number")(SeedState.prototype, "x");
type("number")(SeedState.prototype, "y");
type("boolean")(SeedState.prototype, "isSuper");
type("boolean")(SeedState.prototype, "active");

class RuneState extends Schema {
    constructor() {
        super();
        this.id = "";
        this.x = 0;
        this.y = 0;
        this.weaponType = "TRIPLE";
        this.active = true;
    }
}
type("string")(RuneState.prototype, "id");
type("number")(RuneState.prototype, "x");
type("number")(RuneState.prototype, "y");
type("string")(RuneState.prototype, "weaponType");
type("boolean")(RuneState.prototype, "active");

class ExplosiveSeedState extends Schema {
    constructor() {
        super();
        this.id = "";
        this.x = 0;
        this.y = 0;
        this.isTriggered = false;
        this.active = true;
    }
}
type("string")(ExplosiveSeedState.prototype, "id");
type("number")(ExplosiveSeedState.prototype, "x");
type("number")(ExplosiveSeedState.prototype, "y");
type("boolean")(ExplosiveSeedState.prototype, "isTriggered");
type("boolean")(ExplosiveSeedState.prototype, "active");

class StormState extends Schema {
    constructor() {
        super();
        this.centerX = 1600;
        this.centerY = 1600;
        this.currentRadius = 1500;
        this.targetRadius = 1500;
        this.state = "DELAY";
        this.timeLeft = 20;
    }
}
type("number")(StormState.prototype, "centerX");
type("number")(StormState.prototype, "centerY");
type("number")(StormState.prototype, "currentRadius");
type("number")(StormState.prototype, "targetRadius");
type("string")(StormState.prototype, "state");
type("number")(StormState.prototype, "timeLeft");

class PumpkinArenaState extends Schema {
    constructor() {
        super();
        this.players = new MapSchema();
        this.projectiles = new MapSchema();
        this.seeds = new MapSchema();
        this.runes = new MapSchema();
        this.explosives = new MapSchema();
        this.storm = new StormState();
        this.matchActive = false;
        this.matchOver = false;
        this.winnerName = "";
        this.roomCode = "";
        this.matchTime = 0;
    }
}
type({ map: PlayerState })(PumpkinArenaState.prototype, "players");
type({ map: ProjectileState })(PumpkinArenaState.prototype, "projectiles");
type({ map: SeedState })(PumpkinArenaState.prototype, "seeds");
type({ map: RuneState })(PumpkinArenaState.prototype, "runes");
type({ map: ExplosiveSeedState })(PumpkinArenaState.prototype, "explosives");
type(StormState)(PumpkinArenaState.prototype, "storm");
type("boolean")(PumpkinArenaState.prototype, "matchActive");
type("boolean")(PumpkinArenaState.prototype, "matchOver");
type("string")(PumpkinArenaState.prototype, "winnerName");
type("string")(PumpkinArenaState.prototype, "roomCode");
type("number")(PumpkinArenaState.prototype, "matchTime");

module.exports = {
    PlayerState,
    ProjectileState,
    SeedState,
    RuneState,
    ExplosiveSeedState,
    StormState,
    PumpkinArenaState
};
