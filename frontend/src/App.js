import React, { useState, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import Notifications from './components/Notifications';
import Status from './components/Status';

function App() {
  const [notifications, setNotifications] = useState([]);

  // Request notification permission on load
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Function to send browser notifications
  const sendNotification = (message) => {
    if (Notification.permission === "granted") {
      new Notification(message);
    }
  };

  // Simulate receiving a new notification every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const exampleNotification = { message: "Suspicious activity detected!", time: new Date().toLocaleTimeString() };
      setNotifications((prevNotifications) => [...prevNotifications, exampleNotification]);
      sendNotification(exampleNotification.message);
    }, 10000); // 10 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  return (
    <div className="App">
      <h1>Bike Guard System</h1>
      <CameraFeed />
      <Notifications notifications={notifications} />
      <Status />
    </div>
  );
}

export default App;