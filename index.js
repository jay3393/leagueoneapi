require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const port = process.env.PORT || 5000;


mongoose.connect(process.env.MONGO_DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("Connected to mongoose database.");
})
.catch((err) => {
    console.log(err.message);
});

app.listen(port, () => {
    console.log('App is running...');
});