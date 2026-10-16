/**
 * PUMPKIN PANIC.IO - Live Leaderboard & Match Score System
 * Computes live rankings, tracks alive counts, and formats leaderboard data.
 */
(function() {
    window.PumpkinPanic = window.PumpkinPanic || {};

    class LeaderboardSystem {
        constructor(scene) {
            this.scene = scene;
            this.lastUpdateTime = 0;
            this.updateInterval = 400; // ms
            this.currentRankings = [];
            this.playerRank = 1;
            this.aliveCount = 0;
            this.totalInitialPumpkins = 0;
        }

        init(totalPumpkins) {
            this.totalInitialPumpkins = totalPumpkins;
            this.aliveCount = totalPumpkins;
        }

        update(time, delta) {
            if (time - this.lastUpdateTime < this.updateInterval) return;
            this.lastUpdateTime = time;

            this.computeRankings();
        }

        computeRankings() {
            const list = [];
            let alive = 0;

            // Player
            const player = this.scene.player;
            if (player) {
                if (!player.isDead) alive++;
                list.push({
                    id: player.id,
                    name: player.name,
                    isPlayer: true,
                    isBot: false,
                    isDead: player.isDead,
                    level: player.level,
                    kills: player.kills,
                    xp: player.xp,
                    score: player.score
                });
            }

            // Bots (Local practice mode)
            if (this.scene.bots && this.scene.bots.length > 0) {
                for (let i = 0; i < this.scene.bots.length; i++) {
                    const bot = this.scene.bots[i];
                    if (bot) {
                        if (!bot.isDead) alive++;
                        list.push({
                            id: bot.id,
                            name: bot.name,
                            isPlayer: false,
                            isHumanPlayer: false,
                            isBot: true,
                            isDead: bot.isDead,
                            level: bot.level,
                            kills: bot.kills,
                            xp: bot.xp,
                            score: bot.score
                        });
                    }
                }
            }

            // Remote Players & Server Bots (Online multiplayer mode)
            if (this.scene.remoteEntities && this.scene.remoteEntities.size > 0) {
                this.scene.remoteEntities.forEach(remote => {
                    if (remote) {
                        if (!remote.isDead) alive++;
                        list.push({
                            id: remote.id,
                            name: remote.name,
                            isPlayer: false,
                            isHumanPlayer: !remote.isBot,
                            isBot: !!remote.isBot,
                            isDead: remote.isDead,
                            level: remote.level,
                            kills: remote.kills,
                            xp: remote.xp,
                            score: remote.score
                        });
                    }
                });
            }

            this.aliveCount = alive;

            // Sort: living players first, then highest score, then level, then kills
            list.sort((a, b) => {
                if (a.isDead !== b.isDead) {
                    return a.isDead ? 1 : -1;
                }
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                if (b.level !== a.level) {
                    return b.level - a.level;
                }
                return b.kills - a.kills;
            });

            this.currentRankings = list;

            // Determine human player rank
            const pIndex = list.findIndex(item => item.isPlayer);
            this.playerRank = pIndex >= 0 ? (pIndex + 1) : list.length;

            // Emit to UI
            this.scene.events.emit('leaderboard_updated', {
                rankings: this.currentRankings.slice(0, 6),
                playerRank: this.playerRank,
                aliveCount: this.aliveCount,
                totalInitial: this.totalInitialPumpkins
            });
        }
    }

    window.PumpkinPanic.LeaderboardSystem = LeaderboardSystem;
})();
