import React, { useState, useEffect } from 'react';
import './Settings.css';
import Account from './Account';
import Support from './Support';
import { BluetoothSetup } from './BluetoothComponents';

const Settings = ({ onBack, userData }) => {
  const [showAccount, setShowAccount] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showBluetoothSetup, setShowBluetoothSetup] = useState(false);
  
  // Check if we should directly open the Bluetooth setup page
  useEffect(() => {
    const shouldOpenBluetooth = sessionStorage.getItem('openBluetoothSetup');
    if (shouldOpenBluetooth === 'true') {
      setShowBluetoothSetup(true);
      sessionStorage.removeItem('openBluetoothSetup');
    }
  }, []);

  if (showAccount) {
    return <Account onBack={() => setShowAccount(false)} userData={userData} />;
  }

  if (showSupport) {
    return <Support onBack={() => setShowSupport(false)} />;
  }
  
  if (showBluetoothSetup) {
    return <BluetoothSetup onBack={() => setShowBluetoothSetup(false)} />;
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
          <li onClick={() => setShowBluetoothSetup(true)}>
            My BikeGuard
            <span className="setting-description">Bluetooth pairing and device settings</span>
          </li>
          <li onClick={() => setShowSupport(true)}>Support</li>
        </ul>
      </div>
    </div>
  );
};

export default Settings;