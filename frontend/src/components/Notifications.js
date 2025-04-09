import React, { useState, useEffect } from 'react';
import './Components.css';
import { CONFIG } from '../config';


function Notifications({ notificationData, userData }) {
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications from REST API on component mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const userId = userData?.uid || JSON.parse(localStorage.getItem('bikeGuardUserData'))?.uid;
        
        if (!userId) {
          console.log('No user ID available, skipping notification fetch');
          setNotifications([]);
          return;
        }
        
        console.log('Fetching notifications for user:', userId);
        const url = `${CONFIG.backendUrl}${CONFIG.apiEndpoints.notifications}?user_id=${userId}`;
        console.log('Fetch URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        console.log('Notifications received:', data);
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