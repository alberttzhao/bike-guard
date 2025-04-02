import React from 'react';
import './MyBikeGuard.css';

const MyBikeGuard = ({ onBack }) => {
  return (
    <div className="mybikeguard-page">
      <button className="back-button" onClick={onBack}>
        Back
      </button>
      <h2>My BikeGuard</h2>
    </div>
  );
};

export default MyBikeGuard;
