const BuildModel = require('../models/buildModel.js');
const { arrEquals } = require('../util/arrayEquals');
const { timeElapsed } = require('../util/timeElapsed');

// Debugging
const DEBUG = false;
let debugMatchHigh=0;
let debugMatchTotal=0;
let debugMatchCount=0;

let debugSkillHigh=0;
let debugSkillTotal=0;
let debugSkillCount=0;

let debugStartingHigh=0;
let debugStartingTotal=0;
let debugStartingCount=0;

let debugItemsHigh=0;
let debugItemsTotal=0;
let debugItemsCount=0;

let debugRunesHigh=0;
let debugRunesTotal=0;
let debugRunesCount=0;

let debugSpellHigh=0;
let debugSpellTotal=0;
let debugSpellCount=0;

let debugFindIdHigh=0;
let debugFindIdTotal=0;
let debugFindIdCount=0; 

let debugFindIdsHigh=0;
let debugFindIdsTotal=0;
let debugFindIdsCount=0; 

module.exports.aggregate = async function (dataPack) {
    // Handles undefined dataPack
    if (!dataPack) {
        console.log('undefined datapack', dataPack);
        return;
    };
    const { matchId, queueId, data, rank, division } = dataPack;
    let oldtime;
    let diff;
    let totalDiff=0;
    oldtime = new Date();
    const championIds = data.map(x=>x.championId);
    const findIds = await BuildModel.find({ _id: { $in: championIds}});
    diff = new Date() - oldtime;
    totalDiff+=diff;
    debugFindIdsHigh = Math.max(debugFindIdsHigh, diff);
    debugFindIdsCount++;
    debugFindIdsTotal+=diff;

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
            specialSkillPath,
            itemPath,
            startItems,
            mythicItem,
            bootsItem,
        } = d;

        const addWin = win ? 1 : 0;
        const runeStats = `${defense}${flex}${offense}`;
        const summonerSpell = [summoner1Id, summoner2Id].sort((a,b) => a - b);
        const skillArray = skillPath.split('');

        const [item2, item3, item4, item5, item6] = itemPath ? itemPath.match(/.{1,4}/g) : [];

        // Aggregation
        try {
            oldtime = new Date();
            // const idExists = await BuildModel.findById(championId);
            const idExists = findIds.find(x => x._id === championId);
            diff = new Date() - oldtime;
            totalDiff+=diff;
            debugFindIdHigh = Math.max(debugFindIdHigh, diff);
            debugFindIdCount++;
            debugFindIdTotal+=diff;
            // Initialize champion data structure
            if (!idExists) {
                console.log('Creating champion');
                if (championId.toString().length >= 6) continue;
                await BuildModel.create({
                    _id: championId,
                    championName,
                    matches: 1,
                    wins: addWin,
                    roles: [{
                        role: lane,
                        matches: 1,
                        wins: addWin,
                        runes: {
                            stats: [{
                                matches: 1,
                                wins: addWin,
                                picks: runeStats
                            }],
                            primary: [{
                                primaryStyle: primaryStyle,
                                matches: 1,
                                wins: addWin,
                                selections: [{
                                    matches: 1,
                                    wins: addWin,
                                    picks: primarySelections
                                }]
                            }],
                            secondary: [{
                                secondaryStyle: subStyle,
                                matches: 1,
                                wins: addWin,
                                selections: [{
                                    matches: 1,
                                    wins: addWin,
                                    picks: subSelections
                                }]
                            }]
                        },
                        summonerSpells: [{
                            matches: 1,
                            wins: addWin,
                            spells: summonerSpell
                        }],
                        skillPath: [...Array(18).keys()].map((i) => {
                            return {
                                position: i + 1,
                                skills: [{
                                    matches: 1,
                                    wins: addWin,
                                    skill: skillArray[i] ? skillArray[i] : -1
                                }]
                            }
                        }),
                        mythic: [{
                            itemId: mythicItem ? mythicItem : null,
                            matches: 1,
                            wins: addWin,
                        }],
                        boots: [{
                            itemId: bootsItem ? bootsItem : null,
                            matches: 1,
                            wins: addWin,
                        }],
                        second: [{
                            itemId: item2 ? item2 : null,
                            matches: 1,
                            wins: addWin,
                        }],
                        third: [{
                            itemId: item3 ? item3 : null,
                            matches: 1,
                            wins: addWin,
                        }],
                        fourth: [{
                            itemId: item4 ? item4 : null,
                            matches: 1,
                            wins: addWin,
                        }],
                        fifth: [{
                            itemId: item5 ? item5 : null,
                            matches: 1,
                            wins: addWin,
                        }],
                        sixth: [{
                            itemId: item6 ? item6 : null,
                            matches: 1,
                            wins: addWin,
                        }],
                        starterItems: [{
                            matches: 1,
                            wins: addWin,
                            items: startItems ? startItems : null
                        }],
                    }]
                });
            } 
            
            // Update all properties if the role exists within the document
            else if (idExists.roles.find(x => x.role === lane)) {
                // Update match and wins
                oldtime = new Date();
                await BuildModel.updateOne({_id: championId, "roles.role": lane },
                    {
                        $inc: { matches: 1, wins: addWin, "roles.$.matches": 1, "roles.$.wins": addWin }
                    }    
                );
                diff = new Date() - oldtime;
                totalDiff+=diff;
                debugMatchHigh = Math.max(debugMatchHigh, diff);
                debugMatchCount++;
                debugMatchTotal+=diff;

                const laneExists = idExists.roles.find(x => x.role === lane);
                
                oldtime = new Date();
                // Update skill path
                const oldSkillPath = laneExists.skillPath;
                for (let i = 0; i < skillArray.length; i++) {
                    const skillPosition = oldSkillPath.find(x => x.position === i + 1);
                    const skillExists = skillPosition.skills.find(x => x.skill == skillArray[i]);
                    if (skillExists) {
                        skillExists.matches++;
                        skillExists.wins += addWin;
                    } 
                    
                    // Push new skill path
                    else {
                        skillPosition.skills.push(
                            {
                                matches: 1,
                                wins: addWin,
                                skill: skillArray[i]
                            }
                        )
                    }
                   
                }
                await BuildModel.updateOne({ _id: championId, "roles.role": lane },
                    {
                        $set: { "roles.$.skillPath": oldSkillPath }
                    }
                );
                diff = new Date() - oldtime;
                totalDiff+=diff;
                debugSkillHigh = Math.max(debugSkillHigh, diff);
                debugSkillCount++;
                debugSkillTotal+=diff;
                          

                oldtime = new Date();
                // Update starting items
                const starterItemExists = laneExists.starterItems.find(x => x.items === startItems);
                if (starterItemExists) {
                    try {
                        await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                            $inc: { 
                                "roles.$.starterItems.$[i].matches" : 1,
                                "roles.$.starterItems.$[i].wins": addWin
                            }
                        }, {
                            arrayFilters: [
                                { "i.items": startItems }
                            ]
                        });

                    } catch (ex) {
                        console.log(`[ERR] Failed to update starting items: ${ex}`);
                    }
                } 
                // Push new starting items
                else {
                    try {
                        await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                            $push: { "roles.$.starterItems": 
                            {
                                matches: 1, 
                                wins: addWin,
                                items: startItems
                            }
                        }
                        });
                    } catch (ex) {
                        console.log(`[ERR] Failed to push new starting items: ${ex}`);
                    }
                }
                diff = new Date() - oldtime;
                totalDiff+=diff;
                debugStartingHigh = Math.max(debugStartingHigh, diff);
                debugStartingCount++;
                debugStartingTotal+=diff;

                // Update all items
                const itemKeys = {
                    mythic: mythicItem ? mythicItem : null,
                    boots: bootsItem ? bootsItem : null,
                    second: item2 ? item2 : null,
                    third: item3 ? item3 : null,
                    fourth: item4 ? item4 : null,
                    fifth: item5 ? item5 : null,
                    sixth: item6 ? item6 : null,
                };

                oldtime = new Date();
                const oldItems = laneExists;
                for (let item of Object.keys(itemKeys)) {
                    const itemExists = oldItems[item].find(x => x.itemId == itemKeys[item]);
                    
                    // Update matches and wins for item
                    if (itemExists) {
                        itemExists.matches++;
                        itemExists.wins += addWin;
                    } 
                    
                    
                    // Push new item
                    else {
                        oldItems[item].push(
                            {
                                itemId: itemKeys[item],
                                matches: 1,
                                wins: addWin
                            }
                        )
                    }
                }
                await BuildModel.updateOne({ _id: championId, "roles.role": lane }, 
                    {
                        $set: { 
                            "roles.$.mythic": oldItems.mythic,
                            "roles.$.boots": oldItems.boots,
                            "roles.$.second": oldItems.second,
                            "roles.$.third": oldItems.third,
                            "roles.$.fourth": oldItems.fourth,
                            "roles.$.fifth": oldItems.fifth,
                            "roles.$.sixth": oldItems.sixth,
                         }
                    }
                )
                diff = new Date() - oldtime;
                totalDiff+=diff;
                debugItemsHigh = Math.max(debugItemsHigh, diff);
                debugItemsCount++;
                debugItemsTotal+=diff;


                oldtime = new Date();
                // Update runes
                try {
                    // Update matches and wins for rune stats
                    const runeStatsExist = laneExists.runes.stats.find(x => x.picks === runeStats);
                    if (runeStatsExist) {
                        await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                            $inc: { "roles.$.runes.stats.$[i].matches": 1, "roles.$.runes.stats.$[i].wins": addWin }
                        },
                        {
                            arrayFilters: [
                                {"i.picks": runeStats}
                            ]
                        })
                    } 
                    
                    
                    // Push new rune stats
                    else {
                        await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                            $push: { "roles.$.runes.stats": 
                                {
                                    matches: 1,
                                    wins: addWin,
                                    picks: runeStats
                                }
                            }
                        });
                    }


                    // Update primary rune
                    const primaryRuneExists = laneExists.runes.primary.find(x => x.primaryStyle == primaryStyle);
                    if (primaryRuneExists) {
                        await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                            $inc: { "roles.$.runes.primary.$[i].matches" : 1, "roles.$.runes.primary.$[i].wins": addWin}
                        }, {
                            arrayFilters: [
                                { "i.primaryStyle": primaryStyle}
                            ]
                        });

                        // Update primary rune selections
                        const primarySelectionExists = primaryRuneExists.selections.find(x => x.picks === primarySelections);
                        if (primarySelectionExists) {
                            await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                                $inc: { 
                                    "roles.$.runes.primary.$[i].selections.$[j].matches" : 1, 
                                    "roles.$.runes.primary.$[i].selections.$[j].wins": addWin
                                }
                            }, {
                                arrayFilters: [
                                    { "i.primaryStyle": primaryStyle },
                                    { "j.picks": primarySelections } 
                                ]
                            });
                        } 
                        
                        
                        // Push new primary rune selections
                        else {
                            await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                                $push: { "roles.$.runes.primary.$[i].selections": 
                                    {
                                        matches: 1,
                                        wins: addWin,
                                        picks: primarySelections
                                    }
                                }
                            }, {
                                arrayFilters: [
                                    { "i.primaryStyle": primaryStyle}
                                ]
                            });
                        }
                    } 
                    
                    
                    // Push new primary rune
                    else {
                        // Add primary rune to styles
                        await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                            $push: { "roles.$.runes.primary": 
                            {
                                primaryStyle,
                                matches: 1,
                                wins: addWin,
                                selections: [{
                                    matches: 1,
                                    wins: addWin,
                                    picks: primarySelections
                                }]
                            }
                        }
                        });                        
                    }


                    // Update secondary rune        
                    const secondaryRuneExists = laneExists.runes.secondary.find(x => x.secondaryStyle == subStyle);
                    if (secondaryRuneExists) {
                        await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                            $inc: { "roles.$.runes.secondary.$[i].matches" : 1, "roles.$.runes.secondary.$[i].wins": addWin}
                        }, {
                            arrayFilters: [
                                { "i.secondaryStyle": subStyle}
                            ]
                        });


                        // Update matches and wins for secondary rune
                        const secondarySelectionExists = secondaryRuneExists.selections.find(x => x.picks === subSelections);
                        if (secondarySelectionExists) {
                            await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                                $inc: { 
                                    "roles.$.runes.secondary.$[i].selections.$[j].matches" : 1, 
                                    "roles.$.runes.secondary.$[i].selections.$[j].wins": addWin
                                }
                            }, {
                                arrayFilters: [
                                    { "i.secondaryStyle": subStyle },
                                    { "j.picks": subSelections } 
                                ]
                            });
                        } 
                        
                        
                        // Push new secondary rune selections
                        else {
                            await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                                $push: { "roles.$.runes.secondary.$[i].selections": 
                                    {
                                        matches: 1,
                                        wins: addWin,
                                        picks: subSelections
                                    }
                                }
                            }, {
                                arrayFilters: [
                                    { "i.secondaryStyle": subStyle}
                                ]
                            });
                        }
                    } 
                    
                    
                    // Push new secondary rune
                    else {
                        // Add secondary rune to styles
                        await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                            $push: { "roles.$.runes.secondary": 
                            {
                                secondaryStyle: subStyle,
                                matches: 1,
                                wins: addWin,
                                selections: [{
                                    matches: 1,
                                    wins: addWin,
                                    picks: subSelections
                                }]
                            }
                        }
                        });
                    }
                } catch (ex){
                    console.log(`[ERR] Failed to update runes: ${ex}`);
                }
                diff = new Date() - oldtime;
                totalDiff+=diff;
                debugRunesHigh = Math.max(debugRunesHigh, diff);
                debugRunesCount++;
                debugRunesTotal+=diff;

                oldtime = new Date();
                // Update summoner spells
                try {
                    // Update matches and wins for summoner spells
                    const summonerSpellExist = laneExists.summonerSpells.find(x => arrEquals(x.spells, summonerSpell));
                    if (summonerSpellExist) {
                        await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                            $inc: { 
                                "roles.$.summonerSpells.$[i].matches": 1, 
                                "roles.$.summonerSpells.$[i].wins": addWin
                            }
                        }, {
                            arrayFilters: [
                                { "i.spells": summonerSpell }
                            ]
                        })
                    } 
                    
                    
                    // Push new summoner spells
                    else {
                        await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                            $push: { "roles.$.summonerSpells": 
                            {
                                matches: 1,
                                wins: addWin,
                                spells: summonerSpell
                            }
                        }
                        });
                    }
                } catch (ex) {
                    console.log(`[ERR] Failed to update summoner spells: ${ex}`);
                }
                diff = new Date() - oldtime;
                totalDiff+=diff;
                debugSpellHigh = Math.max(debugSpellHigh, diff);
                debugSpellCount++;
                debugSpellTotal+=diff;
            } 
            
            
            // Pushing new lane to champion
            else {
                await BuildModel.updateOne({_id: championId}, 
                    {
                        $inc: { matches: 1, wins: addWin }
                        ,  
                        $push: { 
                            roles: {
                                role: lane,
                                matches: 1,
                                wins: addWin,
                                runes: {
                                    stats: [{
                                        matches: 1,
                                        wins: addWin,
                                        picks: runeStats,
                                    }],
                                    primary: [{
                                        primaryStyle: primaryStyle,
                                        matches: 1,
                                        wins: addWin,
                                        selections: [{
                                            matches: 1,
                                            wins: addWin,
                                            picks: primarySelections
                                        }]
                                    }],
                                    secondary: [{
                                        secondaryStyle: subStyle,
                                        matches: 1,
                                        wins: addWin,
                                        selections: [{
                                            matches: 1,
                                            wins: addWin,
                                            picks: subSelections
                                        }]
                                    }]
                                },
                                summonerSpells: [{
                                    matches: 1,
                                    wins: addWin,
                                    spells: summonerSpell
                                }],
                                skillPath: [...Array(18).keys()].map((i) => {
                                    return {
                                        position: i + 1,
                                        skills: [{
                                            matches: 1,
                                            wins: addWin,
                                            skill: skillArray[i] ? skillArray[i] : -1
                                        }]
                                    }
                                }),
                                mythic: [{
                                    itemId: mythicItem ? mythicItem : null,
                                    matches: 1,
                                    wins: addWin,
                                }],
                                boots: [{
                                    itemId: bootsItem ? bootsItem : null,
                                    matches: 1,
                                    wins: addWin,                                    
                                }],
                                second: [{
                                    itemId: item2 ? item2 : null,
                                    matches: 1,
                                    wins: addWin,
                                }],
                                third: [{
                                    itemId: item3 ? item3 : null,
                                    matches: 1,
                                    wins: addWin,
                                }],
                                fourth: [{
                                    itemId: item4 ? item4 : null,
                                    matches: 1,
                                    wins: addWin,
                                }],
                                fifth: [{
                                    itemId: item5 ? item5 : null,
                                    matches: 1,
                                    wins: addWin,
                                }],
                                sixth: [{
                                    itemId: item6 ? item6 : null,
                                    matches: 1,
                                    wins: addWin,
                                }],
                                starterItems: [{
                                    matches: 1,
                                    wins: addWin,
                                    items: startItems ? startItems : null
                                }],
                            }
                        }
                    }
                );
            }
        } catch (ex) {
            console.log(`[ERR] Error while aggregating: ${matchId} ${ex}`);
        }   
    }
    
    if (DEBUG) {
        console.log(`
        Match
        Match highest: ${debugMatchHigh/1000}
        Match avg: ${(debugMatchTotal / debugMatchCount)/1000}
        `);
        console.log(`
        Skill
        Match highest: ${debugSkillHigh/1000}
        Match avg: ${(debugSkillTotal / debugSkillCount)/1000}
        `);
        console.log(`
        Starting
        Match highest: ${debugStartingHigh/1000}
        Match avg: ${(debugStartingTotal / debugStartingCount)/1000}
        `);
        console.log(`
        Items
        Match highest: ${debugItemsHigh/1000}
        Match avg: ${(debugItemsTotal / debugItemsCount)/1000}
        `);
        console.log(`
        Runes
        Match highest: ${debugRunesHigh/1000}
        Match avg: ${(debugRunesTotal / debugRunesCount)/1000}
        `);
        console.log(`
        Spell
        Match highest: ${debugSpellHigh/1000}
        Match avg: ${(debugSpellTotal / debugSpellCount)/1000}
        `);
        console.log(`
        Find Id
        Match highest: ${debugFindIdHigh/1000}
        Match avg: ${(debugFindIdTotal / debugFindIdCount)/1000}
        `);
        console.log(`
        Find Ids
        Match highest: ${debugFindIdsHigh/1000}
        Match avg: ${(debugFindIdsTotal / debugFindIdsCount)/1000}
        `);
        console.log(`
        Total: ${totalDiff/1000}
        `);
    }
    
    return;
}