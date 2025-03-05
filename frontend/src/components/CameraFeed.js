import React, { useRef, useEffect, useState } from 'react';
import './Components.css';

const CameraFeed = () => {
  const imgRef = useRef(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Function to start the stream
    const startStream = () => {
      try {
        if (imgRef.current) {
          // Set the src directly to the stream URL
          imgRef.current.src = 'http://128.197.180.238:5000/api/video-feed';
          
          // Add error event listener to detect loading failures
          imgRef.current.onerror = () => {
            setConnectionError(true);
          };
          
          // Add load event to clear error state if image loads successfully
          imgRef.current.onload = () => {
            setConnectionError(false);
          };
        }
      } catch (error) {
        console.error('Error starting video stream:', error);
        setConnectionError(true);
      }
    };

    startStream();

    // Set a timeout to check if feed is working
    const connectionTimeout = setTimeout(() => {
      if (imgRef.current && (!imgRef.current.complete || imgRef.current.naturalHeight === 0)) {
        setConnectionError(true);
      }
    }, 5000); // Wait 5 seconds before showing error

    // Cleanup function
    return () => {
      clearTimeout(connectionTimeout);
      if (imgRef.current) {
        imgRef.current.src = '';
        imgRef.current.onerror = null;
        imgRef.current.onload = null;
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
      
      {connectionError ? (
        <div className="camera-error">
          <span className="material-icons">error_outline</span>
          <p>Error connecting to bike's security camera</p>
        </div>
      ) : (
        <img
          ref={imgRef}
          className="video-player"
          alt="Camera Feed"
        />
      )}
    </div>
  );
}

export default CameraFeed;