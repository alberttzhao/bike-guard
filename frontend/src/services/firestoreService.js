// In a new file src/services/firestoreService.js
import { doc, collection, addDoc, updateDoc, getDoc, getDocs, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Save bike location
export const saveBikeLocation = async (userId, location) => {
  try {
    // Add to location history
    await addDoc(collection(db, 'users', userId, 'locationHistory'), {
      lat: location.lat,
      lng: location.lng,
      timestamp: serverTimestamp()
    });
    
    // Update current location
    await updateDoc(doc(db, 'users', userId), {
      'bikeData.currentLocation': location,
      'bikeData.lastUpdated': serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error saving location:', error);
    return false;
  }
};

// Get bike location history
export const getBikeLocationHistory = async (userId, limit = 10) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'locationHistory'),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting location history:', error);
    return [];
  }
};

// Save notification
export const saveNotification = async (userId, notification) => {
  try {
    return await addDoc(collection(db, 'users', userId, 'notifications'), {
      ...notification,
      read: false,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving notification:', error);
    return null;
  }
};

// Get user notifications
export const getUserNotifications = async (userId, limit = 20) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'notifications'),
      orderBy('timestamp', 'desc'),
      limit(limit)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

// Update user settings
export const updateUserSettings = async (userId, settings) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      settings: settings
    });
    return true;
  } catch (error) {
    console.error('Error updating settings:', error);
    return false;
  }
};

// Get user data
export const getUserData = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('User document not found');
      return null;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};