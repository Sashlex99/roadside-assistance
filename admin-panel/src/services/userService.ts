import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { User } from '../types/User';

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    const users: User[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      users.push({
        id: doc.id,
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        phoneVerified: data.phoneVerified,
        userType: data.userType,
        createdAt: data.createdAt?.toDate() || new Date(),
        companyInfo: data.companyInfo,
        documents: data.documents,
        documentsStatus: data.documentsStatus,
        documentsVerifiedAt: data.documentsVerifiedAt,
        documentsRejectionReasons: data.documentsRejectionReasons,
        status: data.status,
        isActive: data.isActive
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // Get user data first to check for documents
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      // Delete user documents from storage if they exist
      if (userData.documents) {
        const documents = userData.documents;
        const deletePromises = Object.values(documents).map(async (fileName) => {
          try {
            const fileRef = ref(storage, fileName as string);
            await deleteObject(fileRef);
          } catch (error) {
            console.warn(`Error deleting file ${fileName}:`, error);
          }
        });
        
        await Promise.all(deletePromises);
      }
    }
    
    // Delete user document
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getImageUrl = async (fileName: string): Promise<string> => {
  try {
    // Check if this is a mock/demo file name
    if (fileName && (fileName.includes('demo') || fileName.includes('mock'))) {
      // For demo files, return a placeholder image URL
      console.log(`🔧 Demo mode: Using placeholder image for ${fileName}`);
      return 'https://via.placeholder.com/300x200/0066CC/FFFFFF?text=Demo+Document';
    }

    const imageRef = ref(storage, fileName);
    return await getDownloadURL(imageRef);
  } catch (error) {
    console.error('Error getting image URL for', fileName, ':', error);
    
    // Fallback to placeholder image if file not found
    console.log(`🔧 Fallback: Using placeholder image for ${fileName}`);
    return 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Document+Not+Found';
  }
};

export const toggleUserStatus = async (userId: string, currentStatus: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isActive: !currentStatus
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    throw error;
  }
};

export const approveDriver = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: 'approved',
      isActive: true
    });
  } catch (error) {
    console.error('Error approving driver:', error);
    throw error;
  }
};

export const rejectDriver = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: 'rejected',
      isActive: false
    });
  } catch (error) {
    console.error('Error rejecting driver:', error);
    throw error;
  }
};

export const togglePhoneVerification = async (userId: string, currentStatus: boolean): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      phoneVerified: !currentStatus
    });
  } catch (error) {
    console.error('Error toggling phone verification:', error);
    throw error;
  }
};

export const approveDocument = async (
  userId: string, 
  documentType: 'roadsideAssistanceCert' | 'iaalaLicense' | 'driverPhoto'
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`documentsStatus.${documentType}`]: 'approved',
      [`documentsVerifiedAt.${documentType}`]: new Date(),
      [`documentsRejectionReasons.${documentType}`]: null
    });
  } catch (error) {
    console.error('Error approving document:', error);
    throw error;
  }
};

export const rejectDocument = async (
  userId: string, 
  documentType: 'roadsideAssistanceCert' | 'iaalaLicense' | 'driverPhoto',
  reason: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`documentsStatus.${documentType}`]: 'rejected',
      [`documentsVerifiedAt.${documentType}`]: new Date(),
      [`documentsRejectionReasons.${documentType}`]: reason
    });
  } catch (error) {
    console.error('Error rejecting document:', error);
    throw error;
  }
};

export const approveAllDocuments = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const now = new Date();
    await updateDoc(userRef, {
      'documentsStatus.roadsideAssistanceCert': 'approved',
      'documentsStatus.iaalaLicense': 'approved', 
      'documentsStatus.driverPhoto': 'approved',
      'documentsVerifiedAt.roadsideAssistanceCert': now,
      'documentsVerifiedAt.iaalaLicense': now,
      'documentsVerifiedAt.driverPhoto': now,
      'documentsRejectionReasons.roadsideAssistanceCert': null,
      'documentsRejectionReasons.iaalaLicense': null,
      'documentsRejectionReasons.driverPhoto': null,
      status: 'approved',
      isActive: true
    });
  } catch (error) {
    console.error('Error approving all documents:', error);
    throw error;
  }
};

export const getDocumentVerificationSummary = (user: User): {
  allApproved: boolean;
  pendingCount: number;
  rejectedCount: number;
  approvedCount: number;
} => {
  if (!user.documentsStatus) {
    return { allApproved: false, pendingCount: 3, rejectedCount: 0, approvedCount: 0 };
  }

  const statuses = Object.values(user.documentsStatus);
  const pendingCount = statuses.filter(s => s === 'pending').length;
  const rejectedCount = statuses.filter(s => s === 'rejected').length;
  const approvedCount = statuses.filter(s => s === 'approved').length;
  const allApproved = approvedCount === 3 && pendingCount === 0 && rejectedCount === 0;

  return { allApproved, pendingCount, rejectedCount, approvedCount };
}; 