const express = require('express');
const router = express.Router(); // Make sure this line is included

// define the /alert route
router.post('/alert', (req, res) => {
    // place holder
    res.json({ message: 'Alert received' });
});

// define the /status route
router.get('/status', (req, res) => {
    // place holder
    res.json({ message: 'Current status' });
});

module.exports = router; // Make sure to export router