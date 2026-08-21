import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const isPlaceholder = (val) => {
  if (!val || typeof val !== 'string') return true;
  const lower = val.trim().toLowerCase();
  return lower === '' || lower.includes('your_') || lower.includes('your-project') || lower.includes('example');
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(val => Boolean(val) && !isPlaceholder(val));

if (!hasFirebaseConfig) {
  console.warn('Firebase configuration is missing or incomplete. Add valid VITE_FIREBASE_* values to frontend/.env.');
}

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

