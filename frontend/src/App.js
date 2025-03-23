import React, { useState, useEffect } from 'react';
import './App.css';
import Notifications from './components/Notifications';
import CameraFeed from './components/CameraFeed';
import Settings from './components/Settings';
import LiveMap from './components/LiveMap';
import AuthForm from './components/AuthForm';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { io } from 'socket.io-client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [socket, setSocket] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userData, setUserData] = useState(null);
  
  // Bike data from the backend
  const [bikeData, setBikeData] = useState({
    location: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
    battery: 100,
    is_locked: true,
    is_alarm_active: false,
    last_updated: null
  });
  
  // Function to save bike location to Firestore
  const saveBikeLocation = async (userId, location) => {
    if (!userId || !location) return false;

    try {
      // Add to location history collection
      await addDoc(collection(db, 'users', userId, 'locationHistory'), {
        lat: location.lat,
        lng: location.lng,
        timestamp: serverTimestamp()
      });
      
      // Update current location in user document
      await setDoc(doc(db, 'users', userId), {
        bikeData: {
          currentLocation: location,
          lastUpdated: serverTimestamp()
        }
      }, { merge: true });
      
      console.log('Bike location saved to Firestore');
      return true;
    } catch (error) {
      console.error('Error saving location to Firestore:', error);
      return false;
    }
  };

  // Function to save notification to Firestore
  const saveNotification = async (userId, notification) => {
    if (!userId || !notification) return false;
    
    try {
      // Add to notifications collection
      await addDoc(collection(db, 'users', userId, 'notifications'), {
        ...notification,
        read: false,
        timestamp: serverTimestamp()
      });
      
      console.log('Notification saved to Firestore');
      return true;
    } catch (error) {
      console.error('Error saving notification to Firestore:', error);
      return false;
    }
  };
  
  // Handle online/offline status
  useEffect(() => {
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);
  
  // Handle Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        console.log('Firebase auth state: User is signed in', user);
        
        const userInfo = {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          picture: user.photoURL
        };
        
        setUserData(userInfo);
        setIsLoggedIn(true);
        
        // Save login state to localStorage for offline access
        try {
          localStorage.setItem('bikeGuardUserLoggedIn', 'true');
          localStorage.setItem('bikeGuardUserData', JSON.stringify(userInfo));
          
          // Update last login time in Firestore
          setDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp(),
            displayName: userInfo.name,
            email: user.email,
            photoURL: user.photoURL
          }, { merge: true }).catch(error => {
            console.error('Error updating last login:', error);
          });
          
        } catch (e) {
          console.error('Failed to save user data to localStorage:', e);
        }
      } else {
        // Check localStorage as fallback for PWA
        try {
          const wasLoggedIn = localStorage.getItem('bikeGuardUserLoggedIn') === 'true';
          const storedUserData = JSON.parse(localStorage.getItem('bikeGuardUserData'));
          
          if (wasLoggedIn && storedUserData) {
            setIsLoggedIn(true);
            setUserData(storedUserData);
          } else {
            setIsLoggedIn(false);
            setUserData(null);
          }
        } catch (e) {
          console.error('Failed to retrieve login state from localStorage:', e);
          setIsLoggedIn(false);
          setUserData(null);
        }
      }
    });

    return () => unsubscribe();
  }, []);
  
  // Connect to backend Socket.io when logged in
  useEffect(() => {
    if (!isLoggedIn || !isOnline) return;
    
    // Get your Raspberry Pi's IP address from the environment or configure it
    const backendUrl = 'http://128.197.180.238';
    
    console.log('Connecting to Socket.io server at:', backendUrl);
    
    // Connect to your Flask backend with Socket.IO
    const newSocket = io(backendUrl);
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });
    
    newSocket.on('bike_data', (data) => {
      console.log('Received bike data:', data);
      setBikeData(data);
      
      // Save to Firestore if we have user data
      if (userData?.uid && data.location) {
        saveBikeLocation(userData.uid, data.location);
      }
    });
    
    newSocket.on('new_notification', (notification) => {
      console.log('Received notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      
      // Save to Firestore if we have user data
      if (userData?.uid) {
        saveNotification(userData.uid, notification);
      }
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
        
        // Save initial notifications to Firestore
        if (userData?.uid) {
          data.forEach(notification => {
            saveNotification(userData.uid, notification);
          });
        }
      })
      .catch(error => {
        console.error('Error fetching notifications:', error);
      });
    
    // Cleanup on unmount or logout
    return () => {
      console.log('Disconnecting socket');
      newSocket.disconnect();
    };
  }, [isLoggedIn, isOnline, userData]);

  const handleAlarmTrigger = async () => {
    if (!isOnline) {
      alert('Cannot trigger alarm while offline');
      return;
    }
    
    try {
      // Get your Raspberry Pi's IP address
      const backendUrl = 'http://128.197.180.238';
      
      // Use Socket.IO if connected
      if (socket && socket.connected) {
        console.log('Triggering alarm via socket');
        socket.emit('trigger_alarm');
        
        // Save alarm event to Firestore
        if (userData?.uid) {
          await addDoc(collection(db, 'users', userData.uid, 'alarmEvents'), {
            type: 'alarm_triggered',
            timestamp: serverTimestamp(),
            method: 'socket'
          });
        }
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
        
        // Save alarm event to Firestore
        if (userData?.uid) {
          await addDoc(collection(db, 'users', userData.uid, 'alarmEvents'), {
            type: 'alarm_triggered',
            timestamp: serverTimestamp(),
            method: 'rest_api'
          });
        }
      } else {
        alert('Failed to trigger alarm');
      }
    } catch (error) {
      console.error('Error triggering alarm:', error);
      alert('Error triggering alarm');
    }
  };

  const handleStopAlarm = async () => {
    if (!isOnline) {
      alert('Cannot stop alarm while offline');
      return;
    }
    
    try {
      // Get your Raspberry Pi's IP address
      const backendUrl = 'http://128.197.180.238';
      
      // Use Socket.IO if connected
      if (socket && socket.connected) {
        console.log('Stopping alarm via socket');
        socket.emit('stop_alarm');
        
        // Save alarm event to Firestore
        if (userData?.uid) {
          await addDoc(collection(db, 'users', userData.uid, 'alarmEvents'), {
            type: 'alarm_stopped',
            timestamp: serverTimestamp(),
            method: 'socket'
          });
        }
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
        
        // Save alarm event to Firestore
        if (userData?.uid) {
          await addDoc(collection(db, 'users', userData.uid, 'alarmEvents'), {
            type: 'alarm_stopped',
            timestamp: serverTimestamp(),
            method: 'rest_api'
          });
        }
      } else {
        alert('Failed to stop alarm');
      }
    } catch (error) {
      console.error('Error stopping alarm:', error);
      alert('Error stopping alarm');
    }
  };

  const handleGoogleLoginSuccess = (credentialResponse) => {
    // This will be handled by Firebase Auth now through the AuthForm component
    console.log('Google login success - Firebase Auth will handle this');
  };

  const handleGoogleLoginError = () => {
    console.log('Google login failed');
  };
  
  // Update logout function
  const handleLogout = () => {
    signOut(auth).then(() => {
      // Remove from localStorage
      localStorage.removeItem('bikeGuardUserLoggedIn');
      localStorage.removeItem('bikeGuardUserData');
      setIsLoggedIn(false);
      setUserData(null);
    }).catch((error) => {
      console.error('Logout error:', error);
    });
  };
  
  // Toggle tracking
  const handleTrackingToggle = () => {
    setIsTracking(!isTracking);
    
    // Save user preference to Firestore
    if (userData?.uid) {
      setDoc(doc(db, 'users', userData.uid), {
        settings: {
          trackingEnabled: !isTracking,
          lastUpdated: serverTimestamp()
        }
      }, { merge: true }).catch(error => {
        console.error('Error saving tracking preference:', error);
      });
    }
  };
  
  // Offline banner component
  const OfflineBanner = () => (
    <div className="offline-banner">
      <span className="material-icons">cloud_off</span>
      <span>You're offline. Some features may be limited.</span>
    </div>
  );

  return (
    <GoogleOAuthProvider clientId="778034392296-684g0b5av6d68m1tqbn7rtael8ic106s.apps.googleusercontent.com">
      <div className="app-container">
        {!isOnline && isLoggedIn && <OfflineBanner />}
        
        {!isLoggedIn ? (
          <div className="login-container">
            <div className="login-logo">
              {/* Make sure to place logo file in the public folder */}
              <img src="/bike-guard-logo.png" alt="BikeGuard Logo" className="logo-image" />
            </div>
            <h1>Welcome to BikeGuard</h1>
            <p>Your personal bicycle security system. Sign in to monitor and protect your bike in real-time.</p>
            
            {!isOnline ? (
              <div className="offline-login-message">
                <span className="material-icons">cloud_off</span>
                <p>Internet connection required to sign in</p>
              </div>
            ) : (
              // Use the new AuthForm component instead of just the Google login button
              <AuthForm 
                onGoogleLoginSuccess={handleGoogleLoginSuccess}
                onGoogleLoginError={handleGoogleLoginError}
              />
            )}
            
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
                {userData?.picture && (
                  <div className="user-profile">
                    <img src={userData.picture} alt="Profile" className="user-avatar" />
                  </div>
                )}
                <button className="settings-btn" onClick={() => setCurrentPage('settings')}>
                  <span className="material-icons">settings</span>
                </button>
                <button 
                  className="logout-btn" 
                  onClick={handleLogout}
                >
                  <span className="material-icons">logout</span>
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
                    <button 
                      className="alarm-button" 
                      onClick={handleAlarmTrigger}
                      disabled={!isOnline}
                    >
                      <span className="material-icons">alarm</span>
                      Sound Alarm
                    </button>
                    <button 
                      className="alarm-button stop-alarm" 
                      onClick={handleStopAlarm}
                      disabled={!isOnline}
                    >
                      <span className="material-icons">alarm_off</span>
                      Stop Alarm
                    </button>
                    <button 
                      className={`tracking-button ${isTracking ? 'active' : ''}`} 
                      onClick={handleTrackingToggle}
                      disabled={!isOnline}
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
                <Settings 
                  onBack={() => setCurrentPage('dashboard')} 
                  userData={userData}
                />
              )}
            </main>
          </>
        )}
        
        {/* Full offline screen - shown only if completely offline and can't function */}
        {!isOnline && !isLoggedIn && (
          <div className="offline-screen">
            <div className="offline-message">
              <span className="material-icons">cloud_off</span>
              <h2>You're offline</h2>
              <p>Please connect to the internet to use BikeGuard.</p>
            </div>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;