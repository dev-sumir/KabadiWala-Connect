import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace these placeholders with your actual Firebase project configuration
// You can get this from Firebase Console -> Project Settings -> General -> Web App
const firebaseConfig = {
  apiKey: "AIzaSyBhvjVkepRTLGTAvYNSdLe8YVIxgoN51e0",
  authDomain: "kabadiwala-connect-7dccc.firebaseapp.com",
  projectId: "kabadiwala-connect-7dccc",
  storageBucket: "kabadiwala-connect-7dccc.firebasestorage.app",
  messagingSenderId: "223177847905",
  appId: "1:223177847905:web:50d972f3105b227cf2a620",
  measurementId: "G-TT03LHPHGV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
