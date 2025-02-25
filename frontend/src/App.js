import React, { useState, useEffect } from 'react';
import './App.css';
import Notifications from './components/Notifications';
import CameraFeed from './components/CameraFeed';
import Settings from './components/Settings';
import LiveMap from './components/LiveMap';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { io } from 'socket.io-client';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [socket, setSocket] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  // Bike data from the backend
  const [bikeData, setBikeData] = useState({
    location: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
    battery: 100,
    is_locked: true,
    is_alarm_active: false,
    last_updated: null
  });
  
  // Connect to backend Socket.io when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    
    // Get your Raspberry Pi's IP address from the environment or configure it
    // Replace this with your actual Raspberry Pi IP or hostname
    const backendUrl = 'http://128.197.180.238'; //Change it to match your Raspberry Pi's IP address, for example:
    
    console.log('Connecting to Socket.io server at:', backendUrl);
    
    // Connect to your Flask backend with Socket.IO
    const newSocket = io(backendUrl);
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });
    
    newSocket.on('bike_data', (data) => {
      console.log('Received bike data:', data);
      setBikeData(data);
    });
    
    newSocket.on('new_notification', (notification) => {
      console.log('Received notification:', notification);
      setNotifications(prev => [notification, ...prev]);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
    
    setSocket(newSocket);
    
    // Fetch initial notifications when logged in
    fetch(`${backendUrl}/api/notifications`)
      .then(response => response.json())
      .then(data => {
        console.log('Fetched notifications:', data);
        setNotifications(data);
      })
      .catch(error => {
        console.error('Error fetching notifications:', error);
      });
    
    // Cleanup on unmount or logout
    return () => {
      console.log('Disconnecting socket');
      newSocket.disconnect();
    };
  }, [isLoggedIn]);

  const handleAlarmTrigger = async () => {
    try {
      // Get your Raspberry Pi's IP address
      const backendUrl = 'http://128.197.180.238';
      
      // Use Socket.IO if connected
      if (socket && socket.connected) {
        console.log('Triggering alarm via socket');
        socket.emit('trigger_alarm');
        return;
      }
      
      // Fallback to REST API
      console.log('Triggering alarm via REST API');
      const response = await fetch(`${backendUrl}/api/trigger-alarm`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Alarm response:', data);
        alert('Alarm triggered successfully!');
      } else {
        alert('Failed to trigger alarm');
      }
    } catch (error) {
      console.error('Error triggering alarm:', error);
      alert('Error triggering alarm');
    }
  };

  const handleStopAlarm = async () => {
    try {
      // Get your Raspberry Pi's IP address
      const backendUrl = 'http://128.197.180.238';
      
      // Use Socket.IO if connected
      if (socket && socket.connected) {
        console.log('Stopping alarm via socket');
        socket.emit('stop_alarm');
        return;
      }
      
      // Fallback to REST API
      console.log('Stopping alarm via REST API');
      const response = await fetch(`${backendUrl}/api/stop-alarm`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stop alarm response:', data);
        alert('Alarm stopped successfully!');
      } else {
        alert('Failed to stop alarm');
      }
    } catch (error) {
      console.error('Error stopping alarm:', error);
      alert('Error stopping alarm');
    }
  };

  const handleGoogleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log('Logged in user:', decoded);
    setIsLoggedIn(true);
  };

  const handleGoogleLoginError = () => {
    console.log('Google login failed');
  };

  return (
    <GoogleOAuthProvider clientId="778034392296-684g0b5av6d68m1tqbn7rtael8ic106s.apps.googleusercontent.com">
      <div className="app-container">
        {!isLoggedIn ? (
          <div className="login-container">
            <div className="login-logo">
              {/* Make sure to place logo file in the public folder */}
              <img src="/bike-guard-logo.png" alt="BikeGuard Logo" className="logo-image" />
            </div>
            <h1>Welcome to BikeGuard</h1>
            <p>Your personal bicycle security system. Sign in to monitor and protect your bike in real-time.</p>
            
            <div className="login-button-container">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap
                theme="filled_blue"
                shape="pill"
                size="large"
                text="signin_with"
                locale="en"
              />
            </div>
            
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">
                  <span className="material-icons">videocam</span>
                </div>
                <p>Live Video</p>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">
                  <span className="material-icons">location_on</span>
                </div>
                <p>GPS Tracking</p>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon">
                  <span className="material-icons">security</span>
                </div>
                <p>Protection</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <header className="app-header">
              <h1>BikeGuard</h1>
              <div className="header-controls">
                <button className="settings-btn" onClick={() => setCurrentPage('settings')}>
                  <span className="material-icons">settings</span>
                </button>
              </div>
            </header>

            <main className="dashboard-content">
              {currentPage === 'dashboard' ? (
                <>
                  <div className="content-grid">
                    <CameraFeed />
                    <LiveMap 
                      bikeLocation={bikeData.location} 
                      isTracking={isTracking}
                      isAlarmActive={bikeData.is_alarm_active}
                    />
                  </div>
                  
                  <div className="controls-section">
                    <button className="alarm-button" onClick={handleAlarmTrigger}>
                      <span className="material-icons">alarm</span>
                      Sound Alarm
                    </button>
                    <button className="alarm-button stop-alarm" onClick={handleStopAlarm}>
                      <span className="material-icons">alarm_off</span>
                      Stop Alarm
                    </button>
                    <button 
                      className={`tracking-button ${isTracking ? 'active' : ''}`} 
                      onClick={() => setIsTracking(!isTracking)}
                    >
                      <span className="material-icons">
                        {isTracking ? 'location_on' : 'location_off'}
                      </span>
                      {isTracking ? 'Tracking On' : 'Tracking Off'}
                    </button>
                  </div>
                  
                  <Notifications notificationData={notifications} />
                </>
              ) : (
                <Settings onBack={() => setCurrentPage('dashboard')} />
              )}
            </main>
          </>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;