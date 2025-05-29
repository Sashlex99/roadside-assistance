import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "roadside-assistance-app-aa0e8",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }),
  storageBucket: "roadside-assistance-app-aa0e8.appspot.com"
});

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const bucket = admin.storage().bucket();
const db = admin.firestore();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Upload request received');
    
    if (!req.file) {
      console.log('No file in request');
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.buffer.length
    });

    const fileName = `uploads/${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    console.log('Creating upload stream for:', fileName);

    const stream = file.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    stream.on('error', (err) => {
      console.error('Upload stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Upload failed', details: err.message });
      }
    });

    stream.on('finish', async () => {
      try {
        console.log('Upload completed, making file public...');
        
        // Make file public
        await file.makePublic();
        
        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        
        console.log('File uploaded successfully:', publicUrl);
        if (!res.headersSent) {
          res.json({ url: publicUrl, fileName });
        }
      } catch (error) {
        console.error('Error making file public:', error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Upload completed but failed to make public' });
        }
      }
    });

    stream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (!res.headersSent) {
      res.status(500).json({ error: 'Server error', details: errorMessage });
    }
  }
});

// Save image to Firestore (fallback method)
app.post('/api/save-image', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Saving image data to Firestore...');
    
    const imageData = req.body;
    
    if (!imageData.base64 || !imageData.fileName) {
      res.status(400).json({ error: 'Missing required image data' });
      return;
    }

    // Add server timestamp
    imageData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    
    const docRef = await db.collection('image_uploads').add(imageData);
    
    console.log('Image data saved to Firestore with ID:', docRef.id);
    res.json({ id: docRef.id, message: 'Image saved to Firestore' });
    
  } catch (error) {
    console.error('Firestore save error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Failed to save to Firestore', details: errorMessage });
  }
});

// Test endpoint to verify Firebase connection
app.get('/api/test-firebase', async (req: Request, res: Response): Promise<void> => {
  try {
    const testRef = db.collection('test').doc('connection');
    await testRef.set({ timestamp: new Date(), test: true });
    res.json({ success: true, message: 'Firebase connection working' });
  } catch (error) {
    console.error('Firebase test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: 'Firebase connection failed', details: errorMessage });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Admin Panel Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔥 Firebase test: http://localhost:${PORT}/api/test-firebase`);
  console.log(`📸 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`💾 Firestore save: http://localhost:${PORT}/api/save-image`);
}); 