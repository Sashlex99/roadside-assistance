import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const migrateUsersAddDocumentFields = async (): Promise<void> => {
  try {
    console.log('🔄 Starting user migration...');
    
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);
    
    let processedCount = 0;
    let updatedCount = 0;
    
    for (const userDoc of snapshot.docs) {
      const data = userDoc.data();
      processedCount++;
      
      console.log(`📄 Processing user ${processedCount}: ${data.fullName}`);
      
      // Check if user is a driver and missing document status fields
      if (data.userType === 'driver' && !data.documentsStatus) {
        console.log(`🔧 Updating driver: ${data.fullName}`);
        
        const updates: any = {
          documentsStatus: {
            roadsideAssistanceCert: 'pending',
            iaalaLicense: 'pending',
            driverPhoto: 'pending',
          },
          documentsVerifiedAt: {
            roadsideAssistanceCert: null,
            iaalaLicense: null,
            driverPhoto: null,
          },
          documentsRejectionReasons: {
            roadsideAssistanceCert: null,
            iaalaLicense: null,
            driverPhoto: null,
          }
        };
        
        // If phoneVerified is missing, set to false
        if (data.phoneVerified === undefined) {
          updates.phoneVerified = false;
        }
        
        // If isActive is missing, set to true for existing users
        if (data.isActive === undefined) {
          updates.isActive = true;
        }
        
        // If status is missing, set to pending
        if (!data.status) {
          updates.status = 'pending';
        }
        
        const userRef = doc(db, 'users', userDoc.id);
        await updateDoc(userRef, updates);
        
        updatedCount++;
        console.log(`✅ Updated ${data.fullName}`);
      } else {
        console.log(`⏭️ Skipping ${data.fullName} (${data.userType || 'unknown type'})`);
      }
    }
    
    console.log(`🎉 Migration completed!`);
    console.log(`📊 Processed: ${processedCount} users`);
    console.log(`🔧 Updated: ${updatedCount} drivers`);
    
    alert(`Миграция завършена успешно!\nОбработени: ${processedCount} потребители\nОбновени: ${updatedCount} шофьори`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    alert('Грешка при миграция: ' + error);
    throw error;
  }
}; 