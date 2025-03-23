// src/components/AuthForm.js
import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import './AuthForm.css';

// Import Firebase auth methods
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation for signup
    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      let userCredential;
      
      if (isSignUp) {
        // Create new user
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Set display name (optional)
        await updateProfile(userCredential.user, {
          displayName: email.split('@')[0] // Simple display name from email
        });
        
        // Create user document in Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email,
          displayName: email.split('@')[0],
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
        name: user.displayName || email.split('@')[0],
        authProvider: 'email'
      }));
      
      // Create a credential-like object for the onGoogleLoginSuccess handler
      const credentialObj = {
        credential: JSON.stringify({
          name: user.displayName || email.split('@')[0],
          email: user.email,
          sub: user.uid,
          picture: user.photoURL || null
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
              required
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