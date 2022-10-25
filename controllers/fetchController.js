const axios = require('axios');
const { packData } = require('./buildController.js');
const { aggregate } = require('./aggregateController.js');
require('dotenv').config();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
    await fetchPuuids(ids.splice(0, 2), puuids);
   
    return puuids;
}

async function fetchMatches(puuid) {
    try {
        const { data } = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?type=ranked&start=0&api_key=${process.env.RIOT_API_KEY}`);
        return data;
    } catch (ex) {
        return undefined;
    }
}

async function fetchMatchData(matchId) {
    try {
        const { data } = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}?api_key=${process.env.RIOT_API_KEY}`);
        return data;
    } catch {
        return undefined;
    }
}

async function fetchMatchTimeline(matchId) {
    try {
        const { data } = await axios.get(`https://americas.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline?api_key=${process.env.RIOT_API_KEY}`);
        return data;
    } catch {
        return undefined;
    }
}

const store = {};

async function run() {
    const puuids = await fetch();
    for (let puuid of puuids) {
        const matchIds = await fetchMatches(puuid);

        if (matchIds !== undefined) {
            for (let matchId of matchIds) {

                try {
                    const matchData = await fetchMatchData(matchId);
                    const matchTimeline = await fetchMatchTimeline(matchId);
                    if (matchData !== undefined && matchTimeline !== undefined) {
                        const data = packData(matchData, matchTimeline);
                        console.log('Successfully got required data');
                        // console.log(data);
                        aggregate(data, store);
                    }
                } catch (ex){
                    console.log(ex);
                }
            }
        }
    }    
    console.log(store);
}

run();