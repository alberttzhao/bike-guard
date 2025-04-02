import React, { useState } from 'react';
import './Settings.css';
import Account from './Account';
import Support from './Support';
import Bluetooth from './Bluetooth';
import Notifications from './Notifications';
import MyBikeGuard from './MyBikeGuard';

const Settings = ({ onBack, userData }) => {
  const [showAccount, setShowAccount] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showBluetooth, setShowBluetooth] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMyBikeGuard, setShowMyBikeGuard] = useState(false);


  if (showAccount) {
    return <Account onBack={() => setShowAccount(false)} userData={userData} />;
  }

  if (showSupport) {
    return <Support onBack={() => setShowSupport(false)} />;
  }

  if (showBluetooth) {
    return <Bluetooth onBack={() => setShowBluetooth(false)} />;
  }
  
  if (showNotifications) {
    return <Notifications notificationData={userData.notifications} onBack={() => setShowNotifications(false)} />;
  }

  if (showMyBikeGuard) {
    return <MyBikeGuard onBack={() => setShowMyBikeGuard(false)} />;
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
          <li onClick={() => setShowNotifications(true)}>Notifications</li>
          <li onClick={() =>setShowMyBikeGuard(true)}>MyBikeGuard</li>
          <li onClick={() => setShowSupport(true)}>Support</li>
          <li onClick={() => setShowBluetooth(true)}>Connect My Device</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;
