// // src/config.js
// export const CONFIG = {
//     //backendUrl: 'http://128.197.180.214:5001',
//     backendUrl: 'http://localhost:5001',
//     apiEndpoints: {
//       videoFeed: '/api/video-feed',
//       notifications: '/api/notifications',
//       triggerAlarm: '/api/trigger-alarm',
//       stopAlarm: '/api/stop-alarm'
//     }
//   };

// config.js
// const getBackendUrl = () => {
//   // For development on localhost
//   if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
//     return 'http://localhost:5001';
//   }
  
//   // Check if we're connecting to Raspberry Pi on local network
//   // Using common local network patterns and the bikeguard.local hostname
//   const isRaspberryPiNetwork = window.location.hostname.includes('192.168') || 
//                                window.location.hostname.includes('10.0') ||
//                                window.location.hostname === 'bikeguard.local';
  
//   if (isRaspberryPiNetwork) {
//     // Return local network Raspberry Pi's address - use the actual IP on your local network
//     return 'http://128.197.180.214:5001'; // Using the Pi's IP you provided
//   }
  
//   // Default for production deployment (Firebase hosting, etc.)
//   return 'http://128.197.180.214:5001'; // Using the same Pi IP for production
// };

// export const CONFIG = {
//   backendUrl: getBackendUrl(),
//   apiEndpoints: {
//     videoFeed: '/api/video-feed',
//     notifications: '/api/notifications',
//     triggerAlarm: '/api/trigger-alarm',
//     stopAlarm: '/api/stop-alarm'
//   }
// };

// config.js
const getBackendUrl = () => {
  // For development on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Check if we want to use local backend or Raspberry Pi
    const useLocalBackend = false; // Set this to false to use Raspberry Pi from localhost
    
    if (useLocalBackend) {
      return 'http://localhost:5001';
    } else {
      return 'http://128.197.180.214:5001';
    }
  }
  
  // For any other hostname, use the Raspberry Pi
  return 'http://128.197.180.214:5001';
};

// Split endpoints by service if needed
const getCameraUrl = () => {
  // Always use Raspberry Pi for camera feed
  return 'http://128.197.180.214:5001';
};

export const CONFIG = {
  backendUrl: getBackendUrl(),
  cameraUrl: getCameraUrl(), // Separate URL for camera
  apiEndpoints: {
    videoFeed: '/api/video-feed',
    notifications: '/api/notifications',
    triggerAlarm: '/api/trigger-alarm',
    stopAlarm: '/api/stop-alarm'
  }
};