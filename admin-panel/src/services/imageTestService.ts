import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

// Image Test Service with Backend Upload
const BACKEND_URL = 'http://localhost:3001';

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix to get pure base64
      const pureBase64 = base64.split(',')[1];
      resolve(pureBase64);
    };
    reader.onerror = error => reject(error);
  });
};

export const uploadTestImage = async (file: File): Promise<string> => {
  try {
    console.log('🚀 Starting upload via backend...', file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    console.log('📡 Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('✅ Upload successful:', data.url);
    
    return data.url;
  } catch (error) {
    console.error('❌ Backend upload error:', error);
    
    // Fallback to Firestore base64 storage
    console.log('🔄 Trying fallback to Firestore...');
    return await uploadImageToFirestore(file);
  }
};

// Fallback method - save base64 to Firestore
export const uploadImageToFirestore = async (file: File): Promise<string> => {
  try {
    console.log('💾 Converting to base64 and saving to Firestore...');
    
    const base64 = await fileToBase64(file);
    const imageData = {
      base64: base64,
      fileName: file.name,
      contentType: file.type,
      timestamp: new Date().toISOString(),
      uploadMethod: 'firestore_fallback'
    };

    // Save to Firestore collection
    const docRef = await fetch(`${BACKEND_URL}/api/save-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(imageData)
    });

    if (!docRef.ok) {
      throw new Error('Failed to save to Firestore');
    }

    const result = await docRef.json();
    console.log('✅ Saved to Firestore with ID:', result.id);
    
    // Return a placeholder URL indicating Firestore storage
    return `firestore://${result.id}`;
  } catch (error) {
    console.error('❌ Firestore fallback failed:', error);
    throw new Error(`All upload methods failed: ${error.message}`);
  }
};

// Test backend connection
export const testBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return false;
  }
};

// Test Firebase connection via backend
export const testFirebaseConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/test-firebase`);
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
};

export const deleteTestImage = async (fileName: string): Promise<void> => {
  try {
    console.log('🗑️ Would delete:', fileName);
    // Note: Implementation depends on whether it's Storage or Firestore
  } catch (error) {
    console.error('❌ Delete error:', error);
    throw error;
  }
}; 