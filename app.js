const express = require('express');
const app = express();
const path = require('path');

const buildRoutes = require('./routes/buildRoute');
const statusRoutes = require('./routes/statusRoute');
require('./controllers/fetchController.js'); // initialize automatic scrapping

// Middleware
app.use(express.json());
app.use(express.static(path.resolve(__dirname, './build')));

// Routes
app.use('/api/build', buildRoutes);
app.use('/api/status', statusRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, './build', 'index.html'));
});

module.exports = app;