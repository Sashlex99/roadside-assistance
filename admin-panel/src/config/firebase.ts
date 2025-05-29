import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAAgzduiR-UoVmuAGViFVrjJuxbktKF_ac",
  authDomain: "roadside-assistance-app-aa0e8.firebaseapp.com",
  projectId: "roadside-assistance-app-aa0e8",
  storageBucket: "roadside-assistance-app-aa0e8.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); 