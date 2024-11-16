const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.post('/data', (req, res) => {
  console.log('Data received:', req.body); 
  res.send('Data received successfully');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
