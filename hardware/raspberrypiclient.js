const { spawn } = require("child_process");
const WebSocket = require("ws");

const serverUrl = "ws://128.197.180.190:3000"; 
const ws = new WebSocket(serverUrl);

ws.on("open", () => {
  console.log("Connected to server");

  // Use raspivid or libcamera-vid for video capture
  const raspivid = spawn("libcamera-vid", [
    "--output", "-",        // Stream to stdout
    "--width", "180",      // Resolution
    "--height", "720",      // Resolution
    "--framerate", "10",    // Frame rate
    "--timeout", "100000",       // No timeout, continuous streaming
    "--codec", "h264",       // Encoding format
    "--shutter", "5000",       // exposure time in microseconds
    "--gain", "4"           // analog gain
  ]);


  // Send video data to server
  raspivid.stdout.on("data", (data) => {
    ws.send(data);
    console.log("successfully sent some data");
  });

  raspivid.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
  });

  raspivid.on("close", (code) => {
    console.log(`raspivid process exited with code ${code}`);
    ws.close();
  });

  ws.on("close", () => {
    console.log("WebSocket closed");
    raspivid.kill();
  });
});

