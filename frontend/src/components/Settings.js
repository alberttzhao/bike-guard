import React, { useState } from 'react';
import './Settings.css';
import Account from './Account';
import Support from './Support';

const Settings = ({ onBack, userData }) => {
  const [showAccount, setShowAccount] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  if (showAccount) {
    return <Account onBack={() => setShowAccount(false)} userData={userData} />;
  }

  if (showSupport) {
    return <Support onBack={() => setShowSupport(false)} />;
  }

  return (
    <div className="settings-page">
      <button className="back-button" onClick={onBack}>
        Back
      </button>

      <div className="settings-container">
        <h2 className="settings-title">Settings</h2>

        <ul className="settings-list">
          <li onClick={() => setShowAccount(true)}>Account</li>
          <li>Notifications</li>
          <li>My BikeGuard</li>
          <li onClick={() => setShowSupport(true)}>Support</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;