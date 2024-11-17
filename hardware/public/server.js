const express = require('express');
const app = express();
const port = 8000; // You can choose any available port

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html'); // Serve your HTML file
});

app.listen(port, () => {
    console.log(`Server running at http://128.197.180.227:${port}`);
});


