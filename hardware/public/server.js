const express = require('express');
const app = express();
const port = 3000; // You can choose any available port

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html'); // Serve your HTML file
});

app.listen(port, () => {
    console.log(`Server running at http://192.168.1.37:${port}`);
});


