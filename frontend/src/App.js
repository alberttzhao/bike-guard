import React, { useState, useEffect } from 'react';
import './App.css';
import Notifications from './components/Notifications';
import CameraFeed from './components/CameraFeed';
import Settings from './components/Settings';
import LiveMap from './components/LiveMap';
import AuthForm from './components/AuthForm';
import { BluetoothStatus } from './components/BluetoothComponents';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { io } from 'socket.io-client';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { jwtDecode } from 'jwt-decode';
import { CONFIG } from './config';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [socket, setSocket] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [userData, setUserData] = useState(null);
  const [isBluetoothConnected, setIsBluetoothConnected] = useState(false);

  
  // Bike data from the backend
  const [bikeData, setBikeData] = useState({
    location: { lat: 42.349, lng: -71.106 }, // Default to Photonics now
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

  // In your App.js or wherever you're sending notifications
  // function to include user_id when sending POST requests for notifications
  const sendNotification = async (message, type) => {
    try {
      const userId = userData?.uid;
      const response = await fetch(
        `${CONFIG.getBackendUrl('notifications')}${CONFIG.apiEndpoints.notifications}?user_id=${userId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: message,
            type: type || 'info'
          })
        }
      );
      
      if (response.ok) {
        console.log('Notification sent successfully');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
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

        // try to extract first and last name from DisplayName
        let firstName = '';
        let lastName = '';

        if (user.displayName) {
          const nameParts = user.displayName.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        const userInfo = {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          firstName: firstName,
          lastName: lastName,
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
            firstName: firstName,
            lastName: lastName,
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

  // Check for Bluetooth connection in localStorage
  useEffect(() => {
    // Check for saved Bluetooth connection in localStorage
    const savedDevice = localStorage.getItem('bikeGuardBluetoothDevice');
    if (savedDevice) {
      try {
        // Set connected state if we have a saved device
        setIsBluetoothConnected(true);
      } catch (e) {
        console.error('Error parsing saved Bluetooth device:', e);
      }
    }
  }, []);

  // function to handle Bluetooth icon click
  const handleBluetoothClick = () => {
    setCurrentPage('settings');
    // Store a flag to open the Bluetooth setup page directly
    sessionStorage.setItem('openBluetoothSetup', 'true');
  };

  // constantly check for notifications 
  useEffect(() => {
    if (!isLoggedIn || !userData?.uid) return;
    
    // Poll for new notifications every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn, userData?.uid]);
  
  // Connect to backend Socket.io when logged in
  useEffect(() => {
    if (!isLoggedIn || !isOnline || !userData?.uid) return;
  
    const backendUrl = CONFIG.getBackendUrl();
    console.log('Connecting to Socket.io server at:', backendUrl);
    
    const newSocket = io(backendUrl, {
      query: { user_id: userData.uid },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000 // 20 seconds timeout
    });
  
    // Notification handler with deduplication
    const handleNotification = (notification) => {
      console.log('Real-time notification:', notification);
      setNotifications(prev => {
        // Check if notification already exists
        const exists = prev.some(n => n.id === notification.id);
        if (exists) {
          console.log('Duplicate notification skipped');
          return prev;
        }
        // Keep only the 50 most recent notifications
        return [notification, ...prev].slice(0, 50);
      });
    };
  
    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected with ID:', newSocket.id);
      console.log('Subscribed to room:', userData.uid);
      
      // Fetch any potentially missed notifications on reconnect
      fetchNotifications();
    });
  
    newSocket.on('bike_data', (data) => {
      console.log('Bike data update:', data);
      setBikeData(data);
      if (userData?.uid && data.location) {
        saveBikeLocation(userData.uid, data.location);
      }
    });
  
    newSocket.on('new_notification', handleNotification);
  
    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });
  
    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  
    setSocket(newSocket);
  
    // Initial notifications load
    fetchNotifications();
  
    // Cleanup function
    return () => {
      console.log('Cleaning up socket connection');
      newSocket.off('connect');
      newSocket.off('bike_data');
      newSocket.off('new_notification', handleNotification);
      newSocket.off('disconnect');
      newSocket.off('connect_error');
      newSocket.off('error');
      newSocket.disconnect();
    };
  }, [isLoggedIn, isOnline, userData?.uid]); // Only re-run if these values change

  const fetchNotifications = async () => {
    try {
      const response = await fetch(
        `${CONFIG.getBackendUrl('notifications')}${CONFIG.apiEndpoints.notifications}?user_id=${userData?.uid}&limit=10`
      );
      const data = await response.json();
      console.log("Initial notifications loaded:", data);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const handleAlarmTrigger = async () => {
    if (!isOnline) {
      alert('Cannot trigger alarm while offline');
      return;
    }
    
    try {
      const backendUrl = CONFIG.getBackendUrl();
      
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
      const response = await fetch(`${backendUrl}${CONFIG.apiEndpoints.triggerAlarm}?user_id=${userData.uid}`, {
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
      const backendUrl = CONFIG.getBackendUrl();
      
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
      const response = await fetch(`${backendUrl}${CONFIG.apiEndpoints.stopAlarm}?user_id=${userData.uid}`, {
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
    const decoded = jwtDecode(credentialResponse.credential);
    console.log('Logged in user:', decoded);
    
    // Extract first and last name from the full name
    // const nameParts = decoded.name.split(' ');
    // const firstName = nameParts[0] || '';
    // const lastName = nameParts.slice(1).join(' ') || '';
    const firstName = decoded.firstName || (decoded.name ? decoded.name.split(' ')[0] : '');
    const lastName = decoded.lastName || (decoded.name ? decoded.name.split(' ').slice(1).join(' ') : '');

    
    // Create user data object
    const userDataObj = {
      uid: decoded.sub,
      email: decoded.email,
      firstName: firstName,
      lastName: lastName,
      displayName: decoded.name,
      photoURL: decoded.picture,
      lastLogin: serverTimestamp(),
      authProvider: decoded.authProvider || 'google'
    };
    
    // Immediately update state with first name
    setUserData(userDataObj);
    setIsLoggedIn(true);
    
    // Save to Firestore
    setDoc(doc(db, "users", decoded.sub), userDataObj, { merge: true })
      .catch(error => console.error("Error saving Google user data:", error));
    
    // Save login state to localStorage for offline access
    try {
      localStorage.setItem('bikeGuardUserLoggedIn', 'true');
      localStorage.setItem('bikeGuardUserData', JSON.stringify(userDataObj));
    } catch (e) {
      console.error('Failed to save user data to localStorage:', e);
    }
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
    const newTrackingState = !isTracking;
    setIsTracking(!isTracking);

    // Optionally stop any active location updates if tracking is turned off
    if (!newTrackingState && socket && socket.connected) {
      socket.emit('stop_tracking');
    } else if (newTrackingState && socket && socket.connected) {
      socket.emit('start_tracking');
    }
    
    // Save user preference to Firestore
    if (userData?.uid) {
      setDoc(doc(db, 'users', userData.uid), {
        settings: {
          trackingEnabled: newTrackingState,
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
              <h1>BikeGuard {userData?.firstName ? `| ${userData.firstName}` : (userData?.name ? `| ${userData.name.split(' ')[0]}` : '')}</h1>
              <div className="header-controls">
                <BluetoothStatus 
                  isConnected={isBluetoothConnected} 
                  onClick={handleBluetoothClick}
                />
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
                      {isTracking ? 'Tracking On' : 'Location Off'}
                    </button>
                  </div>
                  
                  <Notifications notificationData={notifications} userData={userData} />
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