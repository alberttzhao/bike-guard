import React, { useState } from 'react';
import './App.css';
import Notifications from './components/Notifications';
import CameraFeed from './components/CameraFeed';
import Settings from './components/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard'); // State to track page

  const handleAlarmTrigger = async () => {
    try {
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

  const handleStopAlarm = async () => {
    try {
      const response = await fetch('http://your-backend-url/stop-alarm', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Alarm stopped successfully!');
      } else {
        alert('Failed to stop alarm');
      }
    } catch (error) {
      console.error('Error stopping alarm:', error);
      alert('Error stopping alarm');
    }
  };

  return (
    <div className="app-container">
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
            <CameraFeed />

            <div className="controls-section">
              <button className="alarm-button" onClick={handleAlarmTrigger}>
                <span className="material-icons">alarm</span>
                Sound Alarm
              </button>
              <button className="alarm-button stop-alarm" onClick={handleStopAlarm}>
                <span className="material-icons">alarm_off</span>
                Stop Alarm
              </button>
            </div>

            <Notifications />
          </>
        ) : (
          <Settings onBack={() => setCurrentPage('dashboard')} />
        )}
      </main>
    </div>
  );
}

export default App;
