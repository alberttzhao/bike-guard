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
          imgRef.current.src = 'http://128.197.180.238:5000/api/video-feed';
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
    <div className="video-container">
      <div className="map-header">
        <h3>Live View</h3>
        <div className="camera-controls">
          <button className="camera-control-btn">
            <span className="material-icons">fullscreen</span>
          </button>
        </div>
      </div>
      <img
        ref={imgRef}
        className="video-player"
        alt="Camera Feed"
      />
    </div>
  );
}

export default CameraFeed;