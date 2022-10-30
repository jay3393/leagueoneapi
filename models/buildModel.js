const mongoose = require('mongoose');

const buildSchema = new mongoose.Schema(
    {
        _id: Number,
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
                    picks: String
                }],
                primary: [{
                    primaryStyle: Number,
                    matches: Number,
                    wins: Number,
                    selections: [{
                        matches: Number,
                        wins: Number,
                        picks: String
                    }]
                }],
                secondary: [{
                    secondaryStyle: Number,
                    matches: Number,
                    wins: Number,
                    selections: [{
                        matches: Number,
                        wins: Number,
                        picks: String
                    }]
                }]
            },
            summonerSpells: [{
                matches: Number,
                wins: Number,
                spells: Array
            }],
            skillPath: [{
                position: Number,
                skills: [{
                    matches: Number,
                    wins: Number,
                    skill: Number
                }]
            }],
            mythic: [{
                itemId: Number,
                matches: Number,
                wins: Number,
            }],
            boots: [{
                itemId: Number,
                matches: Number,
                wins: Number,
            }],
            second: [{
                itemId: Number,
                matches: Number,
                wins: Number,
            }],
            third: [{
                itemId: Number,
                matches: Number,
                wins: Number,
            }],
            fourth: [{
                itemId: Number,
                matches: Number,
                wins: Number,
            }],
            fifth: [{
                itemId: Number,
                matches: Number,
                wins: Number,
            }],
            sixth: [{
                itemId: Number,
                matches: Number,
                wins: Number,
            }],
            starterItems: [{
                matches: Number,
                wins: Number,
                items: String
            }]
        }]
    }
);

module.exports = mongoose.model('champions', buildSchema);