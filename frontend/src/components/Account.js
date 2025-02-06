import React from 'react';
import './Account.css'; // Optional: Create a CSS file for styling

const Account = ({ onBack }) => {
  return (
    <div className="account-page">
      {/* Back button to navigate back */}
      <button className="back-button" onClick={onBack}>
        Back
      </button>

      {/* Account settings container */}
      <div className="account-container">
        <h2 className="account-title">Account Settings</h2>

        <form className="account-form">
          <label>
            Username:
            <input type="text" name="username" />
          </label>

          <label>
            Email:
            <input type="email" name="email" />
          </label>

          <label>
            Password:
            <input type="password" name="password" />
          </label>

          <button type="submit">Save Changes</button>
        </form>

        {/* Forgot Password button */}
        <button className="forgot-password-button">Forgot Password?</button>
      </div>
    </div>
  );
};

export default Account;
