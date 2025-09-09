import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAhF7wHFmNNVBDA0YIao_LsSZZra7jjS8",
  authDomain: "hospital-management-282.firebaseapp.com",
  projectId: "hospital-management-282",
  storageBucket: "hospital-management-282.firebasestorage.app",
  messagingSenderId: "1066519152072",
  appId: "1:1066519152072:web:9e0ca267cecc1b44e7acfd",
  measurementId: "G-XSLHBHZZL1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;