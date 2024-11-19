import React, { useState, useEffect } from 'react';
import './Components.css';

function Notifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Function to fetch notifications from your backend
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://your-backend-url/notifications');
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    // Fetch immediately
    fetchNotifications();

    // Set up polling every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

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
                {/* You can add different icons based on notification type */}
                <span className="material-icons">notifications</span>
              </div>
              <div className="notification-content">
                <p className="notification-message">{notification.message}</p>
                <span className="notification-time">{notification.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;