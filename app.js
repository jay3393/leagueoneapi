const express = require('express');
const app = express();

const buildRoutes = require('./routes/buildRoute');
const statusRoutes = require('./routes/statusRoute');
require('./controllers/fetchController.js'); // initialize automatic scrapping

// Middleware
app.use(express.json());

// Routes
app.use('/api/build', buildRoutes);
app.use('/api/status', statusRoutes)

module.exports = app;