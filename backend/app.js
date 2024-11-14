// steps
// 1. setup basic express server in application.js
// 2. listen to port defined in .env File

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/test', (req, res) => {
    res.send('Server is running');
});

const bikeRoutes = require('./routes/bikeRoutes');
app.use('/api', bikeRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
