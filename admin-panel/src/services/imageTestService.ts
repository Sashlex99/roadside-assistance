import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../config/firebase';

// Convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export const uploadTestImage = async (file: File): Promise<string> => {
  try {
    console.log('📸 Starting test image upload...');
    console.log('📄 File info:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Try Firebase Storage first
    try {
      console.log('🔄 Method 1: Trying Firebase Storage...');
      
      const timestamp = Date.now();
      const fileName = `test_images/test_${timestamp}_${file.name}`;
      
      console.log('📁 Upload path:', fileName);

      const storageRef = ref(storage, fileName);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ Firebase Storage upload successful:', downloadURL);
      return downloadURL;
      
    } catch (storageError) {
      console.log('❌ Firebase Storage failed:', storageError);
      console.log('🔄 Method 2: Trying Firestore fallback...');
      
      // Fallback: Save to Firestore as base64
      const base64Data = await fileToBase64(file);
      
      const testImageDoc = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        base64Data: base64Data,
        uploadedAt: serverTimestamp(),
        uploadMethod: 'firestore_fallback'
      };
      
      const docRef = await addDoc(collection(db, 'test_images'), testImageDoc);
      
      // Return the base64 data URL for immediate display
      console.log('✅ Firestore fallback successful, doc ID:', docRef.id);
      console.log('📄 Image saved as base64 in Firestore');
      
      return base64Data; // Return base64 data URL for display
    }
    
  } catch (error) {
    console.error('❌ All upload methods failed:', error);
    throw error;
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