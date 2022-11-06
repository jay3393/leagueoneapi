const MatchModel = require('../models/matchModel');

const BuildModel = require('../models/buildModel');

const started = new Date();

module.exports.getStatus = async(req, res) => {
    // Seconds to days:hours:minutes:seconds
    const getUptime = () => {
        let seconds = Math.floor((new Date() - started)/1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        let days = Math.floor(hours / 24);
        seconds %= 60;
        minutes %= 60;
        hours %= 60;
        return `Uptime: ${days}d:${hours}h:${minutes}m:${seconds}s`;
    }
   
    return res.status(200).json({ ok: true, uptime: getUptime() });
}

module.exports.getMatches = async(req, res) => {
    try {
        const matches = await MatchModel.count({});
        const obj = {
            matches: matches
        }
        res.status(200).json({ ok: true, data: obj });
    } catch (ex) {
        res.status(400).json({ ok: false, msg: `Failed to get status` });
    }
}

module.exports.getChampions = async(req, res) => {
    try {
        let data = await BuildModel.find({});
        data = data.map(x => ({'label': x.championName, 'id': x._id}));
        res.status(200).json({ data: data });
    } catch {
        console.log('hi');
    }
}