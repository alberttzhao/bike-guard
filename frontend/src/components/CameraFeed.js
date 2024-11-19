import React, { useRef, useEffect } from 'react';
import './Components.css';

const CameraFeed = () => {
  const imgRef = useRef(null);

  useEffect(() => {
    // Function to start the stream
    const startStream = () => {
      try {
        if (imgRef.current) {
          // Set the src directly to the stream URL
          imgRef.current.src = 'http://128.197.180.227:8000/video_stream';
        }
      } catch (error) {
        console.error('Error starting video stream:', error);
      }
    };

    startStream();

    // Cleanup function
    return () => {
      if (imgRef.current) {
        imgRef.current.src = '';
      }
    };
  }, []);

  return (
    <div className="camera-feed-container">
      <div className="camera-header">
        <h2 className="section-title">Live View</h2>
        <div className="camera-controls">
          <button className="camera-control-btn">
            <span className="material-icons">fullscreen</span>
          </button>
        </div>
      </div>
      <div className="video-container">
        <img
          ref={imgRef}
          className="video-player"
          alt="Camera Feed"
        />
      </div>
    </div>
  );
}

export default CameraFeed;