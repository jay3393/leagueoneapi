const mongoose = require('mongoose');

const buildSchema = new mongoose.Schema(
    {
        championId: Number,
        championName: String,
        matches: Number,
        wins: Number,
        roles: [{
            role: String,
            matches: Number,
            wins: Number,
            runes: {
                stats: [{
                    matches: Number,
                    wins: Number,
                    winRate: Number,
                    picks: Array
                }],
                styles: {
                    primary: [{
                        primaryStyle: Number,
                        matches: Number,
                        wins: Number,
                        winRate: Number,
                        selections: [{
                            matches: Number,
                            wins: Number,
                            winRate: Number,
                            picks: Array
                        }]
                    }],
                    secondary: [{
                        secondaryStyle: Number,
                        matches: Number,
                        wins: Number,
                        winRate: Number,
                        selections: [{
                            matches: Number,
                            wins: Number,
                            winRate: Number,
                            picks: Array
                        }]
                    }]
                }
            },
            summonerSpells: [{
                matches: Number,
                wins: Number,
                winRate: Number,
                spells: Array
            }],
            skillPath: [{
                matches: Number,
                wins: Number,
                winRate: Number,
                path: Array
            }],
            fullItems: {
                core: {
                    mythic: [{
                        itemId: Number,
                        matches: Number,
                        wins: Number,
                        winRate: Number
                    }],
                    boot: [{
                        itemId: Number,
                        matches: Number,
                        wins: Number,
                        winRate: Number
                    }],
                    second: [{
                        itemId: Number,
                        matches: Number,
                        wins: Number,
                        winRate: Number
                    }]
                },
                fourth: [{
                    itemId: Number,
                    matches: Number,
                    wins: Number,
                    winRate: Number
                }],
                fifth: [{
                    itemId: Number,
                    matches: Number,
                    wins: Number,
                    winRate: Number
                }],
                sixth: [{
                    itemId: Number,
                    matches: Number,
                    wins: Number,
                    winRate: Number
                }]
            },
            starterItems: [{
                matches: Number,
                wins: Number,
                winRate: Number,
                items: Array
            }]
        }]
    }
);

module.exports = mongoose.model('Build', buildSchema);