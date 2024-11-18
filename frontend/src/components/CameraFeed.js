import React, { useRef, useEffect } from "react";
import { Card, CardContent, Typography } from "@mui/material";

function CameraFeed() {
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
      });
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Live Camera Feed
        </Typography>
        <video
          ref={videoRef}
          autoPlay
          style={{ width: "100%", borderRadius: "10px" }}
        />
      </CardContent>
    </Card>
  );
}

export default CameraFeed;