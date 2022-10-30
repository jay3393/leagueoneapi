const BuildModel = require('../models/buildModel.js');
const { arrEquals } = require('../util/arrayEquals');

module.exports.aggregate = async function (dataPack, store) {
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
            const idExists = await BuildModel.findById(championId);


            // Initialize champion data structure
            if (!idExists) {
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
                await BuildModel.updateOne({_id: championId, "roles.role": lane },
                    {
                        $inc: { matches: 1, wins: addWin, "roles.$.matches": 1, "roles.$.wins": addWin }
                    }    
                );

                const laneExists = idExists.roles.find(x => x.role === lane);

                // Update skill path
                for (let i = 0; i < skillArray.length; i++) {

                    const skillPosition = laneExists.skillPath.find(x => x.position === i + 1);
                    const skillExists = skillPosition.skills.find(x => x.skill == skillArray[i]);
                    if (skillExists) {
                        try {
                            await BuildModel.updateOne({_id: championId, "roles.role": lane }, {
                                $inc: { "roles.$.skillPath.$[i].skills.$[j].matches": 1, "roles.$.skillPath.$[i].skills.$[j].wins": addWin }
                            },
                            {
                                arrayFilters: [
                                    {"i.position": i + 1},
                                    {"j.skill": skillArray[i]}
                                ]
                            });
                        } catch (ex) {
                            console.log(`[ERR] Failed to update skill path: ${ex}`);
                        }
                    } 
                    
                    // Push new skill path
                    else {
                        try {
                            await BuildModel.updateOne({_id: championId, "roles.role": lane }, {
                                $push: { "roles.$.skillPath.$[i].skills": {
                                    matches: 1,
                                    wins: addWin,
                                    skill: skillArray[i]
                                }}
                            }, {
                                arrayFilters: [
                                    {"i.position": i + 1}
                                ]
                            });
                        } catch (ex) {
                            console.log(`[ERR] Failed to push new skill path: ${ex}`);
                        }
                    }
                }
                

                
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
                        })
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

                for (let item of Object.keys(itemKeys)) {
                    const itemExists = laneExists[item].find(x => x.itemId == itemKeys[item]);
                    
                    // Update matches and wins for item
                    if (itemExists) {
                        try {
                            await BuildModel.updateOne({ _id: championId }, {
                                $inc: { [`roles.$[i].${item}.$[j].matches`]: 1, [`roles.$[i].${item}.$[j].wins`]: addWin }
                            },
                            {
                                arrayFilters: [
                                    {"i.role": lane},
                                    {"j.itemId": itemKeys[item]}
                                ]
                            });
                        } catch (ex) {
                            console.log(`[ERR] Failed to update item: ${ex}`);
                        }
                    } 
                    
                    
                    // Push new item
                    else {
                        try {
                            await BuildModel.updateOne({ _id: championId, "roles.role": lane }, {
                                $push: { [`roles.$.${item}`]:
                                    {
                                        itemId: itemKeys[item],
                                        matches: 1,
                                        wins: addWin,
                                    }
                                }
                            });    
                        } catch (ex) {
                            console.log(`[ERR] Failed to push new item: ${ex}`);
                        }
                    }
                }


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
                
                // console.log();
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
            console.log(`[ERR] Error while aggregating: ${ex}`);
        }   
    }
}