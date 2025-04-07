import React, { useState, useEffect } from 'react';
import './Components.css';
import { CONFIG } from '../config';


function Notifications({ notificationData, userData }) {
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from REST API on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      
      // newly added for notifications
      const userId = userData?.uid || JSON.parse(localStorage.getItem('bikeGuardUserData'))?.uid;
    
      let url = `${CONFIG.backendUrl}${CONFIG.apiEndpoints.notifications}`;
      if (userId) {
        url += `?user_id=${userId}`;
      }

      try {
        const userId = userData?.uid || JSON.parse(localStorage.getItem('bikeGuardUserData'))?.uid;
  
        let url = `${CONFIG.backendUrl}${CONFIG.apiEndpoints.notifications}`;
        if (userId) {
          url += `?user_id=${userId}`;
        }
      
        console.log('Fetching notifications from URL:', url);
        console.log('User ID:', userId);

        // Use the url variable with the user_id parameter instead of the hardcoded URL
        const response = await fetch(url);
        const data = await response.json();
        console.log('Notifications response:', data);
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Fetch immediately
    fetchNotifications();

    // Poll every 5 seconds only if socket notifications aren't available
    const interval = !notificationData ? setInterval(fetchNotifications, 5000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [notificationData, userData]);

  // Update notifications when socket data is received
  useEffect(() => {
    if (notificationData && notificationData.length > 0) {
      setNotifications(notificationData);
    }
  }, [notificationData]);

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return 'Unknown time';
    }
  };

  // Function to get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'movement':
        return 'warning';
      case 'alarm':
        return 'notifications_active';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'notifications';
    }
  };

  return (
    <div className="notifications-container">
      <h2 className="section-title">Recent Events</h2>
      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="no-notifications">
            <p>No recent events</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="notification-item">
              <div className="notification-icon">
                <span className="material-icons">
                  {getNotificationIcon(notification.type)}
                </span>
              </div>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">
                  {formatTimestamp(notification.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;