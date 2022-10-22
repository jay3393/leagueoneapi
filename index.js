const express = require('express');

const app = express();
const mongoose = require('mongoose');

const buildRoutes = require('./routes/buildRoute');

app.use(express.json());

// Routes
// app.use('/api/champion/build', buildRoutes);

mongoose.connect('mongodb://localhost:27017/testbuilds', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("Connected to mongoose database.");
})
.catch((err) => {
    console.log(err.message);
});

app.listen(3000, () => {
    console.log('App is running...');
});