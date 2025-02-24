import React, { useState } from 'react';
import './App.css';
import Notifications from './components/Notifications';
import CameraFeed from './components/CameraFeed';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // State to track login status

  const handleAlarmTrigger = async () => {
    try {
      // Replace with your backend URL
      const response = await fetch('http://your-backend-url/trigger-alarm', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Alarm triggered successfully!');
      } else {
        alert('Failed to trigger alarm');
      }
    } catch (error) {
      console.error('Error triggering alarm:', error);
      alert('Error triggering alarm');
    }
  };

  const handleGoogleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    console.log('Logged in user:', decoded);
    setIsLoggedIn(true); // Set login status to true
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
              {/* Option 1: Use your image logo - make sure file is in public folder */}
              <img src="/bike-guard-logo.png" alt="BikeGuard Logo" className="logo-image" />
              
              {/* Option 2: Use icon as logo - uncomment if you prefer this instead */}
              {/* 
              <div className="logo-icon">
                <span className="material-icons">pedal_bike</span>
              </div>
              */}
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
                  <span className="material-icons">notifications</span>
                </div>
                <p>Alerts</p>
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
                <button className="settings-btn">
                  <span className="material-icons">settings</span>
                </button>
              </div>
            </header>

            <main className="dashboard-content">
              <CameraFeed />

              <div className="controls-section">
                <button
                  className="alarm-button"
                  onClick={handleAlarmTrigger}
                >
                  <span className="material-icons">alarm</span>
                  Sound Alarm
                </button>
              </div>

              <Notifications />
            </main>
          </>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;