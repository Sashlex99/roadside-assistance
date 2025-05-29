import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import { 
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import { uploadTestImage } from '../services/imageTestService';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImageTestDialog({ open, onClose }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setError(null);
        setUploadedImageUrl(null);
        setSuccess(null);
      } else {
        setError('Моля, изберете изображение (JPG, PNG, GIF, etc.)');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Моля, изберете файл за качване');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      console.log('🚀 Starting upload process...');
      
      const downloadUrl = await uploadTestImage(selectedFile);
      
      console.log('🎉 Upload successful! URL:', downloadUrl);
      
      setUploadedImageUrl(downloadUrl);
      setSuccess(`Снимката е качена успешно! Размер: ${(selectedFile.size / 1024).toFixed(1)} KB`);
      
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      setError(`Грешка при качване: ${error.message || 'Неизвестна грешка'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadedImageUrl(null);
    setError(null);
    setSuccess(null);
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ImageIcon />
          Тест за качване на снимка
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          
          {/* File Input */}
          <Paper sx={{ p: 2, border: '2px dashed #ccc', textAlign: 'center' }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="image-upload-test"
            />
            <label htmlFor="image-upload-test">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                sx={{ mb: 1 }}
              >
                Избери снимка
              </Button>
            </label>
            
            {selectedFile && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Избран файл: {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Размер: {(selectedFile.size / 1024).toFixed(1)} KB
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Upload Progress */}
          {uploading && (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Качване на снимката...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert severity="success">
              {success}
            </Alert>
          )}

          {/* Uploaded Image Preview */}
          {uploadedImageUrl && (
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                ✅ Качената снимка:
              </Typography>
              <Paper sx={{ p: 1 }}>
                <img
                  src={uploadedImageUrl}
                  alt="Качена тест снимка"
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: '4px'
                  }}
                />
              </Paper>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                URL: {uploadedImageUrl}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          Затвори
        </Button>
        <Button 
          onClick={handleUpload} 
          variant="contained" 
          disabled={!selectedFile || uploading}
          startIcon={<UploadIcon />}
        >
          {uploading ? 'Качва...' : 'Изпрати'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 