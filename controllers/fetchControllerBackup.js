const axios = require('axios');
const { packData } = require('./packController.js');
const { aggregate } = require('./aggregateController.js');
const MatchModel = require('../models/matchModel');
const { sleep } = require('../util/sleep');

require('dotenv').config();
const CONFIG = require('../config.json');
const APIKEY1 = process.env.RIOT_API_KEY;
const APIKEY2 = process.env.RIOT_API_KEY_2;

// Constantly fetch until all puuids are gotten
async function fetch(rank='PLATINUM', division='IV') {

    async function fetchLeagueExp(delay=0) {
        try {
            const { data } = await axios.get(`https://na1.api.riotgames.com/lol/league-exp/v4/entries/RANKED_SOLO_5x5/${rank}/${division}?page=${Math.floor(Math.random() * 100) + 1}&api_key=${process.env.RIOT_API_KEY}`);
            const ids = data.map(entry => entry.summonerId);
            console.log('Fetched league-exp', ids.length);
            return ids;
        } catch {
            console.log(`Failed to retrieve league-exp. Retrying in ${delay}ms...`);
            delay += 1000;
            await sleep(delay);
            await fetchLeagueExp(delay);
        }
    }
   
    async function fetchPuuids(ids, puuids, delay=0, index=0) {
        if (index === ids?.length - 1) {
            return puuids;
        }
        try {
            const { data } = await axios.get(`https://na1.api.riotgames.com/lol/summoner/v4/summoners/${ids[index]}?api_key=${process.env.RIOT_API_KEY}`);
            puuids.push(data.puuid);
            console.log(data.puuid);
            await fetchPuuids(ids, puuids, 0, index + 1);
        } catch {
            delay += 1000;
            console.log(`Failed to get puuid for ${ids[index]}. Retrying in ${delay}ms...`);
            await sleep(delay);
            await fetchPuuids(ids, puuids, delay, index);
        }
    }

    const ids = await fetchLeagueExp();
    const puuids = new Array();
    await fetchPuuids(ids.splice(0, 2), puuids);
    // await fetchPuuids(ids, puuids);

   
    return puuids;
}

/**
 * Gets recent matches for player
 * @param {string} puuid 
 * @returns {[String]} List of match ids for player
 */
async function fetchMatches(puuid) {
    try {
        const { data } = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&api_key=${process.env.RIOT_API_KEY}`);
        return data;
    } catch (ex) {
        console.log(`Failed to get player's recent matches: ${ex.response.statusText}\nTrying again in ${CONFIG.TIMEOUT}`);
        await sleep(CONFIG.TIMEOUT);
        await fetchMatches(puuid);
    }
}

/**
 * Gets the match data for a match
 * @param {String} matchId 
 * @param {String} apikey 
 * @returns {Object} Object of match data
 */
async function fetchMatchData(matchId, apikey) {
    try {
        const { data } = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${apikey}`);
        return data;
    } catch (ex){
        console.log(`Failed to get match data: ${ex.response.statusText}\nTrying again in ${CONFIG.TIMEOUT}`);
        await sleep(CONFIG.TIMEOUT);
        await fetchMatchData(matchId, apikey);
    }
}

/**
 * Gets the match timeline for a match
 * @param {String} matchId 
 * @param {String} apikey 
 * @returns {Object} Object of match timeline
 */
async function fetchMatchTimeline(matchId, apikey) {
    try {
        const { data } = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline?api_key=${apikey}`);
        return data;
    } catch (ex) {
        console.log(`Failed to get match timeline: ${ex.response.statusText}\nTrying again in ${CONFIG.TIMEOUT}`);
        await sleep(CONFIG.TIMEOUT);
        await fetchMatchTimeline(matchId, apikey);
    }
}

/**
 * Continuously find matches to aggregate onto database
 */
async function run() {

    const puuids = await fetch();

    for (let puuid of puuids) {
        let matchIds = await fetchMatches(puuid);
        matchIds = matchIds.slice(0, 2);
        if (!matchIds) {
            console.log(`matchIds is empty? ${matchIds}`);
            continue;
        };
        matchIds = matchIds.filter(async(x) => {
            return await MatchModel.findById(x) !== undefined;
        });
        if (matchIds !== undefined) {
            for (let matchId of matchIds) {
                if (await MatchModel.findById(matchId)) continue;
                let timeSinceLastRequest = Date.now();
                await sleep(1200);
                let oldtime;

                const doSomething = (mdata, tdata) => {
                    const matchData = mdata.value;
                    const matchTimeline = tdata.value;
                    if (matchData !== undefined && matchTimeline !== undefined) {
                        const data = packData(matchData, matchTimeline);
                        // console.log(`Pack data: ${Date.now() - oldtime}ms`);
                        try {
                            MatchModel.create({
                                _id: matchId
                            })
                            .then(async () => {
                                oldtime = Date.now();
                                await aggregate(data);
                                // aggregate(data);
                                console.log(`[Completed] ${matchId} (${(Date.now() - oldtime) / 1000}s)`);
                            });
                        } catch (ex) {
                            console.log(`[ERR] Duplicate key`);
                        }
                    
                        // console.log(`Aggregate: ${(Date.now() - oldtime)}ms`);
                    }
                    // console.log(`[Completed] ${matchId}`);
                }

                try {
                    oldtime = Date.now();
                    const matchData = fetchMatchData(matchId, APIKEY1);
                    const matchTimeline = fetchMatchTimeline(matchId, APIKEY2);

                    Promise.allSettled([matchData, matchTimeline])
                    .then((results) => {
                        console.log(`[Fetched] ${matchId} (${(Date.now() - oldtime) / 1000}s)`);
                        doSomething(results[0], results[1])
                    });
                    console.log(`[Sent] ${matchId} (${(Date.now() - timeSinceLastRequest) / 1000}s)`);
                    timeSinceLastRequest = new Date();
                } catch (ex){
                    console.log(ex);
                }
            }
        }
    }
    // run();    
}

run();