import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// You'll get these values from your Firebase project settings
// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "your-project-id.firebaseapp.com",
//   projectId: "your-project-id",
//   storageBucket: "your-project-id.appspot.com",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID"
// };
const firebaseConfig = {
    apiKey: "AIzaSyAfpcj0TS0pn5efyfKeY2qG1msYsrlyv40",
    authDomain: "bike-guard-2025.firebaseapp.com",
    projectId: "bike-guard-2025",
    storageBucket: "bike-guard-2025.firebasestorage.app",
    messagingSenderId: "554711645048",
    appId: "1:554711645048:web:3532a6afd2dc0d475a268d",
    measurementId: "G-982GN4ZQLY"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };