// src/components/AuthForm.js (updated)
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './AuthForm.css';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthForm = ({ onGoogleLoginSuccess, onGoogleLoginError }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation for signup
    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      if (firstName.trim() === '' || lastName.trim() === '') {
        setError('First name and last name are required');
        setLoading(false);
        return;
      }
    }

    try {
      let userCredential;
      
      if (isSignUp) {
        // Create new user
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Set display name as "First Last"
        const fullName = `${firstName} ${lastName}`;
        await updateProfile(userCredential.user, {
          displayName: fullName
        });
        
        // Create user document in Firestore with first and last name
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email,
          firstName: firstName,
          lastName: lastName,
          displayName: fullName,
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          settings: {
            notificationsEnabled: true
          }
        });
      } else {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Update last login time
        await setDoc(doc(db, "users", userCredential.user.uid), {
          lastLogin: serverTimestamp()
        }, { merge: true });
      }
      
      const user = userCredential.user;
      
      // Store user info in localStorage for PWA offline access
      localStorage.setItem('bikeGuardUserLoggedIn', 'true');
      localStorage.setItem('bikeGuardUserData', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        firstName: firstName || (user.displayName ? user.displayName.split(' ')[0] : ''),
        lastName: lastName || (user.displayName ? user.displayName.split(' ')[1] || '' : ''),
        authProvider: 'email'
      }));
      
      // Create a credential-like object for the onGoogleLoginSuccess handler
      const credentialObj = {
        credential: JSON.stringify({
          name: user.displayName,
          email: user.email,
          sub: user.uid,
          picture: user.photoURL || null,
          firstName: firstName,
          lastName: lastName
        })
      };
      
      onGoogleLoginSuccess(credentialObj);
    } catch (error) {
      // Handle specific Firebase errors with user-friendly messages
      if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format');
      } else {
        setError('Authentication failed: ' + error.message);
      }
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <button 
          className={`auth-tab ${!isSignUp ? 'active' : ''}`}
          onClick={() => setIsSignUp(false)}
        >
          Sign In
        </button>
        <button 
          className={`auth-tab ${isSignUp ? 'active' : ''}`}
          onClick={() => setIsSignUp(true)}
        >
          Sign Up
        </button>
      </div>
      
      <form onSubmit={handleEmailAuth} className="auth-form">
        {error && <div className="auth-error">{error}</div>}
        
        {isSignUp && (
          <div className="name-fields">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required={isSignUp}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required={isSignUp}
              />
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {isSignUp && (
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required={isSignUp}
            />
          </div>
        )}
        
        <button 
          type="submit" 
          className="auth-button"
          disabled={loading}
        >
          {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      
      <div className="auth-divider">
        <span>OR</span>
      </div>
      
      <div className="login-button-container">
        <GoogleLogin
          onSuccess={onGoogleLoginSuccess}
          onError={onGoogleLoginError}
          useOneTap
          theme="filled_blue"
          shape="pill"
          size="large"
          text="signin_with"
          locale="en"
        />
      </div>
    </div>
  );
};

export default AuthForm;