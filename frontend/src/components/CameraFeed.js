// import React, { useRef, useEffect, useState } from 'react';
// import './Components.css';
// import { CONFIG } from '../config';  // Adjust the path as needed

// const CameraFeed = () => {
//   const imgRef = useRef(null);
//   const [connectionError, setConnectionError] = useState(false);

//   useEffect(() => {
//     // Function to start the stream
//     const startStream = () => {
//       try {
//         if (imgRef.current) {
//           // Set the src directly to the stream URL
//           imgRef.current.src = 'http://128.197.180.214:5001/api/video-feed';
//           // imgRef.current.src = `${CONFIG.backendUrl}${CONFIG.apiEndpoints.videoFeed}`;
//           // imgRef.current.src = `${CONFIG.cameraUrl}${CONFIG.apiEndpoints.videoFeed}`;

//           // Add error event listener to detect loading failures
//           imgRef.current.onerror = () => {
//             setConnectionError(true);
//           };
          
//           // Add load event to clear error state if image loads successfully
//           imgRef.current.onload = () => {
//             setConnectionError(false);
//           };
//         }
//       } catch (error) {
//         console.error('Error starting video stream:', error);
//         setConnectionError(true);
//       }
//     };

//     startStream();

//     // Set a timeout to check if feed is working
//     const connectionTimeout = setTimeout(() => {
//       if (imgRef.current && (!imgRef.current.complete || imgRef.current.naturalHeight === 0)) {
//         setConnectionError(true);
//       }
//     }, 5000); // Wait 5 seconds before showing error

//     // Cleanup function
//     return () => {
//       clearTimeout(connectionTimeout);
//       if (imgRef.current) {
//         imgRef.current.src = '';
//         imgRef.current.onerror = null;
//         imgRef.current.onload = null;
//       }
//     };
//   }, []);

//   return (
//     <div className="video-container">
//       <div className="map-header">
//         <h3>Live View</h3>
//         <div className="camera-controls">
//           <button className="camera-control-btn">
//             <span className="material-icons">fullscreen</span>
//           </button>
//         </div>
//       </div>
      
//       {connectionError ? (
//         <div className="camera-error">
//           <span className="material-icons">error_outline</span>
//           <p>Error connecting to bike's security camera</p>
//         </div>
//       ) : (
//         <img
//           ref={imgRef}
//           className="video-player"
//           alt="Camera Feed"
//         />
//       )}
//     </div>
//   );
// }

// export default CameraFeed;

// BELOW IS CURRENT WORKING VERSION BEFORE TRYING THE HARDCODE USER

// import React, { useRef, useEffect, useState } from 'react';
// import './Components.css';
// import { CONFIG } from '../config';

// const CameraFeed = () => {
//   const imgRef = useRef(null);
//   const [connectionError, setConnectionError] = useState(false);

//   useEffect(() => {
//     // Function to start the stream
//     const startStream = () => {
//       try {
//         if (imgRef.current) {
//           // Use config to get the camera URL
//           const cameraUrl = CONFIG.getBackendUrl('camera');
//           imgRef.current.src = `${cameraUrl}/api/video-feed`;

//           // Add error event listener to detect loading failures
//           imgRef.current.onerror = () => {
//             setConnectionError(true);
//           };
          
//           // Add load event to clear error state if image loads successfully
//           imgRef.current.onload = () => {
//             setConnectionError(false);
//           };
//         }
//       } catch (error) {
//         console.error('Error starting video stream:', error);
//         setConnectionError(true);
//       }
//     };

//     startStream();

//     // Set a timeout to check if feed is working
//     const connectionTimeout = setTimeout(() => {
//       if (imgRef.current && (!imgRef.current.complete || imgRef.current.naturalHeight === 0)) {
//         setConnectionError(true);
//       }
//     }, 5000); // Wait 5 seconds before showing error

//     // Cleanup function
//     return () => {
//       clearTimeout(connectionTimeout);
//       if (imgRef.current) {
//         imgRef.current.src = '';
//         imgRef.current.onerror = null;
//         imgRef.current.onload = null;
//       }
//     };
//   }, []);

//   return (
//     <div className="video-container">
//       <div className="map-header">
//         <h3>Live View</h3>
//         <div className="camera-controls">
//           <button className="camera-control-btn">
//             <span className="material-icons">fullscreen</span>
//           </button>
//         </div>
//       </div>
      
//       {connectionError ? (
//         <div className="camera-error">
//           <span className="material-icons">error_outline</span>
//           <p>Error connecting to bike's security camera</p>
//         </div>
//       ) : (
//         <img
//           ref={imgRef}
//           className="video-player"
//           alt="Camera Feed"
//         />
//       )}
//     </div>
//   );
// }

// export default CameraFeed;


import React, { useRef, useEffect, useState } from 'react';
import './Components.css';
import { CONFIG } from '../config';
import { getAuth } from 'firebase/auth';

const CameraFeed = ({ userData }) => {
  const imgRef = useRef(null);
  const [connectionError, setConnectionError] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // The authorized user ID - replace with your specific ID
  const AUTHORIZED_USER_ID = "ppGAWdLVilX4vGTaAl3xrCt9AJ02";

  useEffect(() => {
    // Check if the current user is authorized
    const checkAuthorization = () => {
      // First check from passed userData
      if (userData && userData.uid) {
        console.log("Current User UID:", userData.uid);
        return userData.uid === AUTHORIZED_USER_ID;
      }
      
      // Fallback to checking Firebase Auth directly
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log("Current User UID from Firebase Auth:", currentUser.uid);
          return currentUser.uid === AUTHORIZED_USER_ID;
        }
      } catch (error) {
        console.error("Error checking Firebase auth:", error);
      }
      
      return false;
    };
    
    setIsAuthorized(checkAuthorization());
  }, [userData]);

  useEffect(() => {
    // Only start the stream if the user is authorized
    if (!isAuthorized) return;
    
    // Function to start the stream
    const startStream = () => {
      try {
        if (imgRef.current) {
          // Use config to get the camera URL
          const cameraUrl = CONFIG.getBackendUrl('camera');
          imgRef.current.src = `${cameraUrl}/api/video-feed`;

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
  }, [isAuthorized]);

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
      
      {!isAuthorized ? (
        <div className="camera-error">
          <span className="material-icons">error_outline</span>
          <p>No Camera Feed Available</p>
        </div>
      ) : connectionError ? (
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