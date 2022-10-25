// const store = {};

module.exports.aggregate = function (dataPack, store) {
    const { matchId, queueId, data, rank, division } = dataPack;

    for (let d of data) {
        const { 
            championId, 
            championName, 
            lane, 
            win, 
            summoner1Id, 
            summoner2Id,
            defense,
            flex, 
            offense,
            primaryStyle,
            subStyle,
            primarySelections,
            subSelections,
            skillPath,
            itemPath,
            startItems
        } = d;

        const addWin = win ? 1 : 0;

        // Check if championId exists
        // Check if lane exists
        let championIdExists = store[championId];
        if (championIdExists === undefined) {
            championIdExists = {
                championName,
                wins: addWin,
                matches: 1,
                lane: {
                    [lane]: {
                        wins: addWin,
                        matches: 1,
                        skillPath: [
                            {
                                wins: addWin,
                                matches: 1,
                                path: skillPath
                            }
                        ]
                    }
                }
            }
        } else if (championIdExists['lane'][lane] === undefined) {
            championIdExists['wins'] += addWin;
            championIdExists['matches'] += 1;
            championIdExists['lane'][lane] = {
                wins: addWin,
                matches: 1,
                skillPath: [
                    {
                        wins: addWin,
                        matches: 1,
                        path: skillPath
                    }
                ]
            }
        } else {
            const aggr = championIdExists['lane'][lane];
            aggr['wins'] = aggr['wins'] + addWin;
            aggr['matches'] = aggr['matches'] + 1;
            const existingSkillPath = aggr['skillPath'].find(s => s['path'] === skillPath);
            if (existingSkillPath !== undefined) {
                existingSkillPath['wins'] = existingSkillPath['wins'] + addWin;
                existingSkillPath['matches'] = existingSkillPath['matches'] + 1;
            } else {
                aggr['skillPath'].push({
                    wins: addWin,
                    matches: 1,
                    path: skillPath
                });
            }
        }
        
        store[championId] = championIdExists;
    }
}