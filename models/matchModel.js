const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema(
    {
        _id: String
    }
);

module.exports = mongoose.model('matches', matchSchema);