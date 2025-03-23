import React, { useState, useEffect } from 'react';
import './Account.css';
import { doc, getDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth, db } from '../firebase';

const Account = ({ onBack }) => {
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  // Get user data from localStorage and Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get basic info from localStorage
        const localData = JSON.parse(localStorage.getItem('bikeGuardUserData'));
        if (!localData || !localData.uid) return;

        setUserData(localData);
        setEmail(localData.email || '');

        // Get additional info from Firestore
        const userDoc = await getDoc(doc(db, 'users', localData.uid));
        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          setUserData(prev => ({
            ...prev,
            ...firestoreData
          }));
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!userData || !auth.currentUser) {
        throw new Error('User not authenticated');
      }

      // Update email if changed
      if (email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, email);
      }

      // Update in Firestore
      await updateUserInFirestore();
      
      setSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserInFirestore = async () => {
    if (!userData || !userData.uid) return;
    
    try {
      await db.collection('users').doc(userData.uid).update({
        email: email
      });
    } catch (error) {
      console.error('Error updating Firestore:', error);
      throw error;
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!userData || !auth.currentUser) {
        throw new Error('User not authenticated');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);
      
      setSuccess('Password updated successfully!');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordChange(false);
    } catch (error) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else {
        setError('Failed to update password: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="account-page">
      <button className="back-button" onClick={onBack}>
        Back
      </button>

      <div className="account-container">
        <h2 className="account-title">Account Settings</h2>

        {userData && (
          <div className="user-profile-section">
            {userData.photoURL && (
              <img src={userData.photoURL} alt="Profile" className="profile-picture" />
            )}
            <div className="user-info">
              <h3>{userData.firstName} {userData.lastName}</h3>
              <p className="user-email">{userData.email}</p>
              <p className="auth-method">
                Sign in method: {userData.authProvider === 'google' ? 'Google' : 'Email and Password'}
              </p>
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form className="account-form" onSubmit={handleUpdateProfile}>
          <label>
            Email:
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              disabled={userData?.authProvider === 'google'}
            />
            {userData?.authProvider === 'google' && (
              <p className="field-note">Email is managed by your Google account</p>
            )}
          </label>

          {userData?.authProvider !== 'google' && (
            <button 
              type="button" 
              className="secondary-button"
              onClick={() => setShowPasswordChange(!showPasswordChange)}
            >
              {showPasswordChange ? 'Cancel Password Change' : 'Change Password'}
            </button>
          )}

          {!userData?.authProvider || userData.authProvider === 'email' ? (
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Save Changes'}
            </button>
          ) : null}
        </form>

        {showPasswordChange && userData?.authProvider !== 'google' && (
          <form className="password-form" onSubmit={handlePasswordChange}>
            <h3>Change Password</h3>
            <label>
              Current Password:
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
              />
            </label>
            <label>
              New Password:
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required
                minLength="6"
              />
            </label>
            <label>
              Confirm New Password:
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Account;