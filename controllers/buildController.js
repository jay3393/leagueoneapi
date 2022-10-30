const deconstructMatchData = function (data) {
    const { metadata: { matchId }, info: { participants: matchParticipants, queueId, teams } } = data;

    const isWin = (teamId) => {
        return true ? teams.find(team => team['teamId'] === teamId) : false;
    };

    const getLane = (lane, role) => {
        switch (true) {
            case (lane === 'MIDDLE' && role === 'SOLO'): lane = 'MIDDLE'; break;
            case (lane === 'TOP' && role === 'SOLO'): lane = 'TOP'; break;
            case (lane === 'JUNGLE' && role === 'NONE'): lane = 'JUNGLE'; break;
            case (lane === 'BOTTOM' && role === 'CARRY'): lane = 'BOTTOM'; break;
            case (lane === 'BOTTOM' && role === 'SUPPORT'): lane = 'SUPPORT'; break;
            default: break;
        }
        return lane;
    };

    const packs = [];

    for (let i of matchParticipants) {
        const { championId, championName, participantId, lane, perks, role, summoner1Id, summoner2Id, teamId } = i;
        const { statPerks: { defense, flex, offense }, styles } = perks;
        const [primaryStyle, subStyle] = styles;


        const pack = {
            participantId,
            championId,
            championName,
            lane: getLane(lane, role),
            win: isWin(teamId).win,
            summoner1Id,
            summoner2Id,
            defense,
            flex,
            offense,
            primaryStyle: primaryStyle.style,
            subStyle: subStyle.style,
            primarySelections: primaryStyle.selections.map(selection => selection.perk).join(''),
            subSelections: subStyle.selections.map(selection => selection.perk).join(''),
        }

        packs.push(pack);
    }

    const obj = {
        matchId,
        queueId,
        data: packs,
    }

    return obj;
} 



const deconstructTimelineData = function(data) {
    const { metadata: { matchId }, info: { frames } } = data;

    const participants = new Array(10).fill().map(e => ({ skillPath: "", specialSkillPath: "", itemPath: [], startItems: [], mythicItem: "", bootsItem: "" }));

    const validTypes = [
        'SKILL_LEVEL_UP', // level up skill
        "ITEM_PURCHASED", // item purchased
        "ITEM_DESTROYED", // item consumed
        "ITEM_UNDO",      // item undo
        "ITEM_SOLD"       // item sold
    ];

    for (let i = 0; i < frames.length; i++) {
        const { events } = frames[i];

        const frameStack = new Array(10).fill().map(e => ([ ]));

        // Handler for valid events
        for (let event of events) {
            if (validTypes.includes(event.type)) {
                const { participantId, type } = event;
                if (type === 'SKILL_LEVEL_UP') {
                    if (event.levelUpType === 'EVOLVE') {
                        participants[participantId - 1].specialSkillPath += event.skillSlot;;
                    } else if (event.levelUpType === 'NORMAL') {
                        participants[participantId - 1].skillPath += event.skillSlot;
                    }
                } else {
                    if (type === 'ITEM_PURCHASED') {
                        frameStack[participantId - 1].push(event.itemId);
                    } else if (type === 'ITEM_UNDO') {
                        frameStack[participantId - 1].pop();
                    } else if (type === 'ITEM_SOLD') {
                        const index = frameStack[participantId - 1].indexOf(event.itemId);
                        frameStack[participantId - 1].splice(index, 1);
                    }
                }
            }
        }

        const mythics = [
            2065, 3001, 3068, 3078,
            3152, 3190, 4005, 4633,
            4636, 4644, 6617, 6630,
            6631, 6632, 6653, 6655,
            6656, 6662, 6664, 6671,
            6672, 6673, 6691, 6692,
            6693
        ];
        const boots = [3006, 3009, 3158, 3111, 3117, 3047, 3020];
        // const validItems = [1001, 1082, 2051, 2065, 3001, 3003, 3004, 3006, 3009, 3020, 3047, 3068, 3078, 3111, 3112, 3117, 3119, 3152, 3158, 3177, 3184, 3190, 3851, 3855, 3859, 3863, 4005, 4633, 4636, 4638, 4643, 4644, 6617, 6630, 6631, 6632, 6653, 6655, 6656, 6662, 6664, 6671, 6672, 6673, 6691, 6692, 6693, 8020, 3011, 3026, 3031, 3033, 3036, 3040, 3041, 3042, 3046, 3050, 3053, 3065, 3071, 3072, 3074, 3075, 3083, 3085, 3089, 3091, 3094, 3095, 3100, 3102, 3107, 3109, 3110, 3115, 3116, 3121, 3124, 3135, 3139, 3142, 3143, 3153, 3156, 3157, 3165, 3179, 3181, 3193, 3222, 3504, 3508, 3742, 3748, 3814, 3853, 3857, 3860, 3864, 4401, 4628, 4629, 4637, 4645, 6035, 6333, 6609, 6616, 6675, 6676, 6694, 6695, 6696, 8001]
        const validItems = [2065,3001,3068,3078,3152,3190,4005,4633,4636,4644,6617,6630,6631,6632,6653,6655,6656,6662,6664,6671,6672,6673,6691,6692,6693,3003,3004,3011,3026,3031,3033,3036,3040,3041,3042,3046,3050,3053,3065,3071,3072,3074,3075,3083,3085,3089,3091,3094,3095,3100,3102,3107,3109,3110,3115,3116,3119,3121,3124,3135,3139,3142,3143,3153,3156,3157,3165,3179,3181,3193,3222,3504,3508,3742,3748,3814,3853,3857,3860,3864,4401,4628,4629,4637,4643,4645,6035,6333,6609,6616,6675,6676,6694,6695,6696,8001,8020,1035,1039,1040,1054,1055,1056,1082,1083,2051,3070,3112,3177,3184,3850,3854,3858,3862,3006,3009,3020,3047,3111,3117,3158,]

        // Keep all items bought in 1st frame
        // In the rest of the frames, all items are removed if they're not full items or boots
        if (i > 1) {
            for (let k = 0; k < 10; k++) {
                frameStack[k] = frameStack[k].filter(item => validItems.includes(item));
            }
        }

        for (let j = 0; j < 10; j++) {
            // if (i == 1) participants[j].startItems.push([i, frameStack[j]]);
            if (i == 1) participants[j].startItems = (frameStack[j].sort((a, b) => a - b)).join('');
            // else if (frameStack[j].length > 0) participants[j].itemPath.push([i, frameStack[j]]);
            else if (frameStack[j].length > 0) {
                frameStack[j].forEach(x => {
                    if (mythics.includes(x)) participants[j].mythicItem = x.toString();
                    else if (boots.includes(x)) participants[j].bootsItem = x.toString();
                    else participants[j].itemPath.push(x.toString());
                });
                // participants[j].itemPath.push(frameStack[j].join(''));
            }
        }
    }

    participants.forEach(p => p.itemPath = p.itemPath.sort((a, b) => a - b).join(''));

    return participants;
}



module.exports.packData = function(matchData, timelineData, rank='PLATINUM', division='IV') {
    const matchObj = deconstructMatchData(matchData);
    const timelineObj = deconstructTimelineData(timelineData);


    // Handle edge case when game exits as soon as starts
    for (let i = 0; i < 10; i++) {
        const participantData = timelineObj[i];
        for (let key of Object.keys(participantData)) {
            matchObj.data[i][key] = participantData[key];
        }
    }

    matchObj.rank = rank;
    matchObj.division = division;

    return matchObj;
}
