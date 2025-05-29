import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import { uploadTestImage, testBackendConnection, testFirebaseConnection } from '../services/imageTestService';

interface ImageTestDialogProps {
  open: boolean;
  onClose: () => void;
}

const ImageTestDialog: React.FC<ImageTestDialogProps> = ({ open, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<boolean | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);

  const testConnections = async () => {
    setTesting(true);
    setError(null);
    
    try {
      console.log('🔍 Testing backend connection...');
      const backendOk = await testBackendConnection();
      setBackendStatus(backendOk);
      
      if (backendOk) {
        console.log('🔍 Testing Firebase connection via backend...');
        const firebaseOk = await testFirebaseConnection();
        setFirebaseStatus(firebaseOk);
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setError('Connection test failed');
      setBackendStatus(false);
      setFirebaseStatus(false);
    } finally {
      setTesting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      console.log('📤 Starting upload test...');
      const imageUrl = await uploadTestImage(file);
      setResult(imageUrl);
      console.log('✅ Upload test successful!');
    } catch (error) {
      console.error('❌ Upload test failed:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setBackendStatus(null);
    setFirebaseStatus(null);
    onClose();
  };

  const getStatusColor = (status: boolean | null) => {
    if (status === null) return 'default';
    return status ? 'success' : 'error';
  };

  const getStatusText = (status: boolean | null) => {
    if (status === null) return 'Not tested';
    return status ? 'Connected' : 'Failed';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        🧪 Тест на качване на снимки
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Статус на връзките:
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <Chip 
              label={`Backend: ${getStatusText(backendStatus)}`}
              color={getStatusColor(backendStatus)}
              variant="outlined"
            />
            <Chip 
              label={`Firebase: ${getStatusText(firebaseStatus)}`}
              color={getStatusColor(firebaseStatus)}
              variant="outlined"
            />
            <Button 
              variant="outlined" 
              size="small" 
              onClick={testConnections}
              disabled={testing}
            >
              {testing ? 'Тествам...' : 'Тест връзки'}
            </Button>
          </Box>

          {testing && <LinearProgress sx={{ mb: 2 }} />}
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Тест на качване:
          </Typography>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ marginBottom: '1rem' }}
            disabled={uploading}
          />
          
          {uploading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Качвам снимка...
              </Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Грешка при качване:</Typography>
            {error}
          </Alert>
        )}

        {result && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              ✅ Успешно качване!
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              URL: {result}
            </Typography>
            
            {result.startsWith('http') && (
              <Box sx={{ mt: 2 }}>
                <img 
                  src={result} 
                  alt="Uploaded test" 
                  style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }}
                  onError={(e) => {
                    console.log('Image failed to load');
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </Box>
            )}

            {result.startsWith('firestore://') && (
              <Typography variant="caption" color="text.secondary">
                📄 Снимката е запазена в Firestore като fallback
              </Typography>
            )}
          </Alert>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <Typography variant="subtitle2" gutterBottom>
            📋 Информация за тестване:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Първо се тества Backend сървъра на localhost:3001<br/>
            • Ако Backend работи, се тества Firebase Admin SDK<br/>
            • При качване се опитва Firebase Storage → Firestore fallback<br/>
            • Firestore fallback запазва base64 данни
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>
          Затвори
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageTestDialog; 