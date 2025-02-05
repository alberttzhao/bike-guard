import React from 'react';
import './Settings.css';

const Settings = ({ onBack }) => {
  return (
    <div className="settings-page">
      {/* Back button positioned outside the settings container */}
      <button className="back-button" onClick={onBack}>
        Back
      </button>

      {/* Settings Container */}
      <div className="settings-container">
        <h2 className="settings-title">Settings</h2>

        <ul className="settings-list">
          <li>Account</li>
          <li>Notifications</li>
          <li>My BikeGuard</li>
          <li>Support</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;
