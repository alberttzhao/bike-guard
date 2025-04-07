// BluetoothComponents.js
import React, { useState, useEffect } from 'react';
import './BluetoothComponents.css';

// Bluetooth connection icon component for the header
export const BluetoothStatus = ({ isConnected, onClick }) => {
  return (
    <button 
      className={`bluetooth-status ${isConnected ? 'connected' : ''}`} 
      title={isConnected ? 'Bluetooth Connected' : 'Bluetooth Disconnected'}
      onClick={onClick}
    >
      <span className="material-icons">bluetooth</span>
    </button>
  );
};

// Bluetooth setup page component
export const BluetoothSetup = ({ onBack }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [error, setError] = useState('');
  
  // Simulate scanning for devices
  const handleStartScan = () => {
    setIsScanning(true);
    setError('');
    
    // Simulate finding devices
    setTimeout(() => {
      setDevices([
        { id: '00:11:22:33:44:55', name: 'BikeGuard Device', rssi: -65 },
        { id: '11:22:33:44:55:66', name: 'Unknown Device', rssi: -78 },
      ]);
      setIsScanning(false);
    }, 2000);
  };
  
  // Simulate connecting to a device
  const handleConnect = (device) => {
    setError('');
    setConnectedDevice(null);
    
    // Show connection progress
    setDevices(prev => prev.map(d => 
      d.id === device.id ? { ...d, connecting: true } : d
    ));
    
    // Simulate connection success/failure
    setTimeout(() => {
      if (device.name === 'BikeGuard Device') {
        setConnectedDevice(device);
        setDevices(prev => prev.map(d => 
          d.id === device.id ? { ...d, connecting: false, connected: true } : d
        ));
        
        // Store connection in localStorage
        localStorage.setItem('bikeGuardBluetoothDevice', JSON.stringify(device));
      } else {
        setError('Failed to connect to device. Please make sure this is a BikeGuard device.');
        setDevices(prev => prev.map(d => 
          d.id === device.id ? { ...d, connecting: false } : d
        ));
      }
    }, 1500);
  };
  
  const handleDisconnect = () => {
    setConnectedDevice(null);
    localStorage.removeItem('bikeGuardBluetoothDevice');
    setDevices(prev => prev.map(d => ({ ...d, connected: false })));
  };
  
  // Check for previously connected device on component mount
  useEffect(() => {
    const savedDevice = localStorage.getItem('bikeGuardBluetoothDevice');
    if (savedDevice) {
      try {
        const device = JSON.parse(savedDevice);
        setConnectedDevice(device);
        setDevices([{ ...device, connected: true }]);
      } catch (e) {
        console.error('Error parsing saved Bluetooth device:', e);
      }
    }
  }, []);
  
  return (
    <div className="bluetooth-setup-page">
      <button className="back-button" onClick={onBack}>
        <span className="material-icons">arrow_back</span> Back
      </button>
      
      <div className="bluetooth-setup-container">
        <h2 className="bluetooth-title">Bluetooth Setup</h2>
        
        <div className="bluetooth-status-section">
          <h3>Connection Status</h3>
          <div className="bluetooth-status-indicator">
            <span className={`status-dot ${connectedDevice ? 'connected' : 'disconnected'}`}></span>
            <span className="status-text">
              {connectedDevice ? `Connected to ${connectedDevice.name}` : 'Not Connected'}
            </span>
          </div>
        </div>
        
        {error && <div className="bluetooth-error">{error}</div>}
        
        {connectedDevice ? (
          <div className="connected-device-section">
            <h3>Connected Device</h3>
            <div className="device-info">
              <p><strong>Name:</strong> {connectedDevice.name}</p>
              <p><strong>ID:</strong> {connectedDevice.id}</p>
              <p><strong>Signal Strength:</strong> {connectedDevice.rssi} dBm</p>
            </div>
            <button className="disconnect-button" onClick={handleDisconnect}>
              Disconnect
            </button>
          </div>
        ) : (
          <>
            <div className="scan-section">
              <button 
                className="scan-button" 
                onClick={handleStartScan}
                disabled={isScanning}
              >
                {isScanning ? 'Scanning...' : 'Scan for Devices'}
              </button>
            </div>
            
            {devices.length > 0 && (
              <div className="devices-list-section">
                <h3>Available Devices</h3>
                <ul className="devices-list">
                  {devices.map(device => (
                    <li key={device.id} className="device-item">
                      <div className="device-info">
                        <div className="device-name">{device.name}</div>
                        <div className="device-id">{device.id}</div>
                        <div className="device-rssi">Signal: {device.rssi} dBm</div>
                      </div>
                      <button 
                        className="connect-button"
                        onClick={() => handleConnect(device)}
                        disabled={device.connecting || device.connected}
                      >
                        {device.connecting ? 'Connecting...' : 
                         device.connected ? 'Connected' : 'Connect'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        
        <div className="bluetooth-help-section">
          <h3>Having trouble?</h3>
          <ul className="help-list">
            <li>Make sure your BikeGuard device is powered on</li>
            <li>Ensure Bluetooth is enabled on your device</li>
            <li>Try moving closer to your BikeGuard</li>
            <li>Restart your BikeGuard device if necessary</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default { BluetoothStatus, BluetoothSetup };