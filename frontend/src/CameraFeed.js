import React, { useRef, useEffect } from 'react';

const CameraFeed = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error("Error accessing the camera:", err);
      });
  }, []);

  return (
    <div>
      <h2>Live Camera Feed</h2>
      <video ref={videoRef} autoPlay width="100%" />
    </div>
  );
};

export default CameraFeed;