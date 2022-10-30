const axios = require('axios');
const { packData } = require('./buildController.js');
const { aggregate } = require('./aggregateController.js');
const MatchModel = require('../models/matchModel');
const { sleep } = require('../util/sleep');
require('dotenv').config();

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
        if (index === ids.length - 1) {
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
    // await fetchPuuids(ids.splice(0, 2), puuids);
    await fetchPuuids(ids, puuids);

   
    return puuids;
}

async function fetchMatches(puuid) {
    try {
        const { data } = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&api_key=${process.env.RIOT_API_KEY}`);
        return data;
    } catch (ex) {
        // make this recursive
        console.log('failed to fetch matches');
        return undefined;
    }
}

async function fetchMatchData(matchId, apikey) {
    try {
        const { data } = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${apikey}`);
        return data;
    } catch (ex){
        console.log(matchId, ex.response.status, ex.response.statusText);
        return undefined;
    }
}

async function fetchMatchTimeline(matchId, apikey) {
    try {
        const { data } = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline?api_key=${apikey}`);
        return data;
    } catch (ex) {
        return fetchMatchTimeline(matchId);
    }
}

const store = {};

async function run() {
    const puuids = await fetch();
    let apikeys = [
        process.env.RIOT_API_KEY,
        process.env.RIOT_API_KEY_2
    ];

    for (let puuid of puuids) {
        let matchIds = await fetchMatches(puuid);
        if (!matchIds) continue;
        matchIds = matchIds.filter(async(x) => {
            return await MatchModel.findById(x) !== undefined;
        });
        if (matchIds !== undefined) {
            for (let matchId of matchIds) {
                if (await MatchModel.findById(matchId)) continue;
                await sleep(1200);
                let oldtime;
                const totaltime = Date.now();

                const doSomething = (mdata, tdata) => {
                    console.log(`[Received] ${matchId}`);
                    const matchData = mdata.value;
                    const matchTimeline = tdata.value;
                    if (matchData !== undefined && matchTimeline !== undefined) {
                        oldtime = Date.now();
                        const data = packData(matchData, matchTimeline);
                        // console.log(`Pack data: ${Date.now() - oldtime}ms`);
                        oldtime = Date.now();
                        try {
                            MatchModel.create({
                                _id: matchId
                            })
                            .then(() => aggregate(data, store));
                        } catch (ex) {
                            console.log(`[ERR] Duplicate key`);
                        }
                    
                        // console.log(`Aggregate: ${(Date.now() - oldtime)}ms`);
                    }
                    console.log(`[Completed] ${matchId}`);
                }

                try {
                    oldtime = Date.now();
                    const matchData = fetchMatchData(matchId, apikeys[0]);
                    const matchTimeline = fetchMatchTimeline(matchId, apikeys[1]);

                    Promise.allSettled([matchData, matchTimeline])
                    .then((results) => doSomething(results[0], results[1]));
                    console.log(`[Sent] ${matchId}`);
                } catch (ex){
                    console.log(ex);
                }
            }
        }
    }    
    // console.log(store);
}

run();