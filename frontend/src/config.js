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
const getBackendUrl = () => {
  // For development on localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001';
  }
  
  // Check if we're connecting to Raspberry Pi on local network
  // Using common local network patterns and the bikeguard.local hostname
  const isRaspberryPiNetwork = window.location.hostname.includes('192.168') || 
                               window.location.hostname.includes('10.0') ||
                               window.location.hostname === 'bikeguard.local';
  
  if (isRaspberryPiNetwork) {
    // Return local network Raspberry Pi's address - use the actual IP on your local network
    return 'http://128.197.180.214:5001'; // Using the Pi's IP you provided
  }
  
  // Default for production deployment (Firebase hosting, etc.)
  return 'http://128.197.180.214:5001'; // Using the same Pi IP for production
};

export const CONFIG = {
  backendUrl: getBackendUrl(),
  apiEndpoints: {
    videoFeed: '/api/video-feed',
    notifications: '/api/notifications',
    triggerAlarm: '/api/trigger-alarm',
    stopAlarm: '/api/stop-alarm'
  }
};