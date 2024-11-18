const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;

// Serve a simple web page for clients to view the video
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Broadcast incoming video data to all connected clients
  ws.on("message", (data) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
