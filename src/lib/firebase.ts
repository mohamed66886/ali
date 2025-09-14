// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCGUPD0WVwaZNqGn412W7xYBhMfpAr9h8I",
  authDomain: "alipk-da772.firebaseapp.com",
  projectId: "alipk-da772",
  storageBucket: "alipk-da772.firebasestorage.app",
  messagingSenderId: "1034335344257",
  appId: "1:1034335344257:web:3e534a5c4037d0b8141f80",
  measurementId: "G-WJVV1757MH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getFirestore(app);
const auth = getAuth(app);

export { db, analytics, auth };
export default app;
