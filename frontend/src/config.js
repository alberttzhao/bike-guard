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
  // You can update this detection logic based on your needs
  const isRaspberryPiNetwork = window.location.hostname.includes('192.168') || 
                               window.location.hostname.includes('10.0') ||
                               window.location.hostname === 'bikeguard.local';
  
  if (isRaspberryPiNetwork) {
    // Return Raspberry Pi's address
    return 'http://192.168.1.XXX:5001'; // Replace with your Pi's actual IP
  }
  
  // Default for production deployment (Firebase hosting, etc.)
  return 'http://128.197.180.214:5001'; // Your production backend address
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