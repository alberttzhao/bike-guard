import React from 'react';
import './Bluetooth.css';

const Bluetooth = ({ onBack }) => {
  return (
    <div className="bluetooth-page">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      <h2>Bluetooth Settings</h2>
      <p>Manage your Bluetooth connections here.</p>
    </div>
  );
};

export default Bluetooth;
