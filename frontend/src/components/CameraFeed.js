import React, { useRef, useEffect } from 'react';
import './Components.css';

function CameraFeed() {
  const videoRef = useRef(null);

  useEffect(() => {
    // Function to start the video stream
    const startStream = async () => {
      try {
        // Replace this URL with your Raspberry Pi's video stream URL
        const videoUrl = 'http://your-raspberry-pi-url/video-stream';
        
        if (videoRef.current) {
          videoRef.current.src = videoUrl;
        }
      } catch (error) {
        console.error('Error starting video stream:', error);
      }
    };

    startStream();
  }, []);

  return (
    <div className="camera-feed-container">
      <div className="camera-header">
        <h2 className="section-title">Live View</h2>
        <div className="camera-controls">
          <button className="camera-control-btn">
            <span className="material-icons">volume_up</span>
          </button>
          <button className="camera-control-btn">
            <span className="material-icons">fullscreen</span>
          </button>
        </div>
      </div>
      <div className="video-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-player"
        />
      </div>
    </div>
  );
}

export default CameraFeed;