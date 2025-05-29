import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAAgzduiR-UoVmuAGViFVrjJuxbktKF_ac",
  authDomain: "roadside-assistance-app-aa0e8.firebaseapp.com",
  projectId: "roadside-assistance-app-aa0e8",
  storageBucket: "roadside-assistance-app-aa0e8.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app; 