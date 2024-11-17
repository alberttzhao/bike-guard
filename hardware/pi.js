const { spawn } = require("child_process");
const fs = require("fs");

const recordVideo = () => {
  console.log("Starting video recording...");

  // Command for libcamera-vid (adjust if using raspivid)
  const videoFile = "video.mp4";
  const process = spawn("libcamera-vid", ["-o", videoFile, "-t", 
"10000"]);

  process.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  process.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  process.on("close", (code) => {
    console.log(`Recording finished with code ${code}`);
    if (fs.existsSync(videoFile)) {
      console.log(`Video saved as ${videoFile}`);
    } else {
      console.error("Failed to save video.");
    }
  });
};

// Start recording
recordVideo();

