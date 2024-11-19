import React from 'react';
import './App.css';
import Notifications from './components/Notifications';
import CameraFeed from './components/CameraFeed';

function App() {
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

  return (
    <div className="app-container">
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
    </div>
  );
}

export default App;