const BuildModel = require('../models/buildModel');

module.exports.getRawData = async(req, res) => {
    const { championId } = req.params;
    const { lane } = req.query;

    try {
        const championExists = await BuildModel.findById(championId);

        if (championExists) {
            if (lane) {
                const laneExists = championExists.roles.find(x => x.role === lane);
                if (laneExists) res.status(200).json({ ok: true, data: laneExists });
                else res.status(400).json({ ok: false, msg: `Lane does not exist` });
                return;
            }
            res.status(200).json({ ok: true, data: championExists });
        } else {
            res.status(400).json({ ok: false, msg: `Champion ID ${championId} doesn't exist!`});
        }
    } catch (ex) {
        res.status(500).json({ ok: false, msg: `Internal server error` });
        console.log(ex);
    }
}

module.exports.getBuild = async(req, res) => {
    const { championId } = req.params;
    const { lane } = req.query;

    try {
        const championExists = await BuildModel.findById(championId);

        if (championExists) {
            if (lane) {
                const laneExists = championExists.roles.find(x => x.role === lane);
                const matches = laneExists.matches;
                const wins = laneExists.wins;

                if (laneExists) {
                    const skillPath = new Array(laneExists.skillPath.length);
                    for (let s = 0; s < laneExists.skillPath.length; s++) {
                        skillPath[s] = laneExists.skillPath.find(x => x.position === s + 1).skills.sort((a, b) => b.matches - a.matches)[0].skill;
                    }

                    const stats = laneExists.runes.stats.sort((a, b) => b.matches - a.matches)[0];

                    let primaryRune = laneExists.runes.primary.sort((a, b) => b.matches - a.matches)[0];
                    const primarySelections = primaryRune.selections.sort((a, b) => b.matches - a.matches)[0];
                    primaryRune.selections = undefined;

                    let secondaryRune = laneExists.runes.secondary.sort((a, b) => b.matches - a.matches)[0];
                    const secondarySelections = secondaryRune.selections.sort((a, b) => b.matches - a.matches)[0];
                    secondaryRune.selections = undefined;

                    const summonerSpells = laneExists.summonerSpells.sort((a, b) => b.matches - a.matches)[0];
                    delete summonerSpells._id;
                    
                    const startingItems = laneExists.starterItems.sort((a, b) => b.matches - a.matches)[0];
                    delete startingItems._id;

                    const items = ['mythic', 'boots', 'second', 'third', 'fourth', 'fifth', 'sixth'];
                    const insertItems = [];
                    const obj = {};

                    for (let item of items) {
                        // console.log(laneExists[item].filter(x => !insertItems.includes(x.itemId)));
                        const bestItem = laneExists[item].filter(x => !insertItems.includes(x.itemId)).sort((a, b) => {
                            if (a.itemId === null) return 1;
                            else if (b.itemId === null) return -1;
                            else return b.matches - a.matches;
                        })[0];
                        obj[item] = {
                            _id: bestItem?._id,
                            itemId: bestItem?.itemId,
                            matches: bestItem?.matches,
                            wins: bestItem?.wins,
                        };
                        insertItems.push(bestItem);
                    }

                    obj.stats = stats;
                    obj.primaryRune = primaryRune;
                    obj.primarySelections = primarySelections;
                    obj.secondaryRune = secondaryRune;
                    obj.secondarySelections = secondarySelections;
                    obj.summonerSpells = summonerSpells;
                    obj.skillPath = skillPath;
                    obj.startingItems = startingItems;

                    res.set({
                        'Access-Control-Allow-Origin': '*'
                    });

                    res.status(200).json({ ok: true, data: obj });
                    return;
                }
            } else {
                res.status(400).json({ ok: false, msg: `Specify a lane (TOP, JUNGLE, MIDDLE, BOTTOM, SUPPORT)` });
                return;
            }
            res.status(200).json({ ok: false, msg: `Not enough data` });
        } else {
            res.status(400).json({ ok: false, msg: `Champion ID ${championId} doesn't exist!`});
        }
    } catch (ex) {
        res.status(500).json({ ok: false, msg: `Internal server error` });
        console.log(ex);
    }
}