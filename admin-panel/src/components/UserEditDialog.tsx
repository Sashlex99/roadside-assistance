import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Chip,
  Stack,
  Tabs,
  Tab,
  IconButton,
  Modal,
  Card,
  CardContent,
  Divider,
  Alert
} from '@mui/material';
import { 
  PhotoLibrary as PhotoIcon, 
  Close as CloseIcon, 
  CheckCircle as ApproveIcon, 
  Cancel as RejectIcon,
  Pending as PendingIcon 
} from '@mui/icons-material';
import { User } from '../types/User';
import { 
  updateUser, 
  getImageUrl, 
  togglePhoneVerification,
  approveDocument,
  rejectDocument,
  approveAllDocuments,
  getDocumentVerificationSummary
} from '../services/userService';

interface Props {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function UserEditDialog({ open, user, onClose, onUserUpdated }: Props) {
  const [formData, setFormData] = useState<Partial<User>>({});
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState<string | null>(null);

  // Helper function to safely format dates
  const formatDate = (date: any): string => {
    try {
      if (!date) return 'Няма данни';
      if (date instanceof Date) {
        return date.toLocaleDateString('bg-BG');
      }
      if (date.toDate && typeof date.toDate === 'function') {
        return date.toDate().toLocaleDateString('bg-BG');
      }
      if (typeof date === 'string') {
        return new Date(date).toLocaleDateString('bg-BG');
      }
      return 'Невалидна дата';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Грешка при форматиране';
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        companyInfo: user.companyInfo || { name: '', bulstat: '' },
        isActive: user.isActive
      });
      
      // Автоматично отваряме документите за шофьори
      if (user.userType === 'driver') {
        setTabValue(2); // Документи таб
        if (user.documents) {
          loadDocumentImages(user.documents);
        }
      } else {
        setTabValue(0); // Основни данни за клиенти
      }
    }
  }, [user]);

  const loadDocumentImages = async (documents: any) => {
    const urls: { [key: string]: string } = {};
    const loadingStates: { [key: string]: boolean } = {};
    
    try {
      if (!documents) {
        return;
      }
      
      for (const [key, fileName] of Object.entries(documents)) {
        if (fileName) {
          loadingStates[key] = true;
          setImageLoading(prev => ({ ...prev, ...loadingStates }));
          
          try {
            const url = await getImageUrl(fileName as string);
            urls[key] = url;
          } catch (error) {
            console.error(`❌ Error loading image ${key}:`, error);
          } finally {
            loadingStates[key] = false;
          }
        }
      }
      
      setImageUrls(urls);
      setImageLoading(loadingStates);
    } catch (error) {
      console.error('❌ Error loading images:', error);
    }
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    
    if (field.startsWith('companyInfo.')) {
      const companyField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        companyInfo: {
          name: prev.companyInfo?.name || '',
          bulstat: prev.companyInfo?.bulstat || '',
          ...prev.companyInfo,
          [companyField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleTogglePhoneVerification = async () => {
    if (!user) return;
    
    try {
      await togglePhoneVerification(user.id, user.phoneVerified);
      onUserUpdated();
      // Update local form data to reflect the change
      setFormData(prev => ({
        ...prev,
        phoneVerified: !user.phoneVerified
      }));
    } catch (error) {
      console.error('Error toggling phone verification:', error);
      alert('Грешка при промяна на верификацията');
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await updateUser(user.id, formData);
      onUserUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Грешка при запазване на промените');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTabValue(0);
    setSelectedImage(null);
    onClose();
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleApproveDocument = async (documentType: 'roadsideAssistanceCert' | 'iaalaLicense' | 'driverPhoto') => {
    if (!user) return;
    
    try {
      await approveDocument(user.id, documentType);
      onUserUpdated();
      alert('Документът е одобрен успешно!');
    } catch (error) {
      console.error('Error approving document:', error);
      alert('Грешка при одобряване на документа');
    }
  };

  const handleRejectDocument = async (documentType: 'roadsideAssistanceCert' | 'iaalaLicense' | 'driverPhoto') => {
    if (!user || !rejectionReason.trim()) {
      alert('Моля, въведете причина за отхвърляне');
      return;
    }
    
    try {
      await rejectDocument(user.id, documentType, rejectionReason);
      onUserUpdated();
      setRejectionReason('');
      setShowRejectionInput(null);
      alert('Документът е отхвърлен успешно');
    } catch (error) {
      console.error('Error rejecting document:', error);
      alert('Грешка при отхвърляне на документа');
    }
  };

  const handleApproveAllDocuments = async () => {
    if (!user) return;
    
    try {
      await approveAllDocuments(user.id);
      onUserUpdated();
      alert('Всички документи са одобрени! Шофьорът може да получава заявки.');
    } catch (error) {
      console.error('Error approving all documents:', error);
      alert('Грешка при одобряване на документите');
    }
  };

  const getDocumentStatusIcon = (status?: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved': return <ApproveIcon sx={{ color: 'success.main' }} />;
      case 'rejected': return <RejectIcon sx={{ color: 'error.main' }} />;
      default: return <PendingIcon sx={{ color: 'warning.main' }} />;
    }
  };

  const getDocumentStatusColor = (status?: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Редактиране на {user.userType === 'driver' ? 'шофьор' : 'клиент'}: {user.fullName}
        </DialogTitle>
        
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Основни данни" />
            {user.userType === 'driver' && <Tab label="Фирмени данни" />}
            {user.userType === 'driver' && (
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    📄 Документи за проверка
                    {(() => {
                      const summary = getDocumentVerificationSummary(user);
                      if (summary.allApproved) {
                        return <Chip label="✅" color="success" size="small" />;
                      } else if (summary.rejectedCount > 0) {
                        return <Chip label={`❌${summary.rejectedCount}`} color="error" size="small" />;
                      } else {
                        return <Chip label={`⏳${summary.pendingCount}`} color="warning" size="small" />;
                      }
                    })()}
                  </Box>
                } 
              />
            )}
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Име и фамилия"
                  value={formData.fullName || ''}
                  onChange={handleInputChange('fullName')}
                />
                <TextField
                  fullWidth
                  label="Имейл"
                  value={formData.email || ''}
                  onChange={handleInputChange('email')}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  label="Телефон"
                  value={formData.phone || ''}
                  onChange={handleInputChange('phone')}
                />
                <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={user.userType === 'driver' ? 'Шофьор' : 'Клиент'} 
                      color="primary" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`Създаден: ${formatDate(user.createdAt)}`} 
                      variant="outlined"
                    />
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    color={user.phoneVerified ? "success" : "warning"}
                    onClick={handleTogglePhoneVerification}
                  >
                    {user.phoneVerified ? "Премахни верификация" : "Верифицирай телефон"}
                  </Button>
                </Box>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.phoneVerified || false}
                    onChange={handleInputChange('phoneVerified')}
                  />
                }
                label="Телефонът е верифициран"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive || false}
                    onChange={handleInputChange('isActive')}
                  />
                }
                label="Активен профил"
              />
            </Stack>
          </TabPanel>

          {user.userType === 'driver' && (
            <TabPanel value={tabValue} index={1}>
              <Stack spacing={2} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Име на фирма"
                  value={formData.companyInfo?.name || ''}
                  onChange={handleInputChange('companyInfo.name')}
                />
                <TextField
                  fullWidth
                  label="Булстат"
                  value={formData.companyInfo?.bulstat || ''}
                  onChange={handleInputChange('companyInfo.bulstat')}
                />
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Статус на заявката:
                  </Typography>
                  <Chip 
                    label={
                      user.status === 'pending' ? 'Очаква одобрение' :
                      user.status === 'approved' ? 'Одобрен' : 
                      user.status === 'rejected' ? 'Отхвърлен' : 'Неизвестен'
                    }
                    color={
                      user.status === 'approved' ? 'success' :
                      user.status === 'rejected' ? 'error' : 'warning'
                    }
                  />
                </Box>
              </Stack>
            </TabPanel>
          )}

          {user.userType === 'driver' && (
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ mt: 2 }}>
                {/* Summary */}
                {(() => {
                  const summary = getDocumentVerificationSummary(user);
                  return (
                    <Alert 
                      severity={summary.allApproved ? "success" : summary.rejectedCount > 0 ? "error" : "warning"}
                      sx={{ mb: 3 }}
                    >
                      <Typography variant="h6">Статус на документите</Typography>
                      <Typography>
                        Одобрени: {summary.approvedCount}/3 | 
                        Чакащи: {summary.pendingCount} | 
                        Отхвърлени: {summary.rejectedCount}
                      </Typography>
                      {summary.allApproved && (
                        <Typography color="success.main" fontWeight="bold">
                          ✅ Всички документи са одобрени! Шофьорът може да получава заявки.
                        </Typography>
                      )}
                    </Alert>
                  );
                })()}

                {/* Quick Actions */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<ApproveIcon />}
                    onClick={handleApproveAllDocuments}
                    disabled={getDocumentVerificationSummary(user).allApproved}
                  >
                    Одобри всички документи
                  </Button>
                </Box>

                {/* Documents */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {['roadsideAssistanceCert', 'iaalaLicense', 'driverPhoto'].map((docType) => {
                    const titles = {
                      roadsideAssistanceCert: 'Удостоверение за пътна помощ',
                      iaalaLicense: 'Лиценз от ИААА',
                      driverPhoto: 'Снимка на шофьор'
                    };
                    
                    const docStatus = user.documentsStatus?.[docType as keyof typeof user.documentsStatus] || 'pending';
                    const rejectionReason = user.documentsRejectionReasons?.[docType as keyof typeof user.documentsRejectionReasons];
                    
                    return (
                      <Card key={docType} sx={{ flex: '1 1 300px', minWidth: 300 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            {getDocumentStatusIcon(docStatus)}
                            <Typography variant="h6">
                              {titles[docType as keyof typeof titles]}
                            </Typography>
                            <Chip 
                              label={
                                docStatus === 'approved' ? 'Одобрен' :
                                docStatus === 'rejected' ? 'Отхвърлен' : 'Чака'
                              }
                              color={getDocumentStatusColor(docStatus) as any}
                              size="small"
                            />
                          </Box>
                          
                          {/* Image */}
                          {imageLoading[docType] ? (
                            <Box 
                              sx={{ 
                                width: '100%', 
                                height: 200, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                border: '1px solid #ddd',
                                borderRadius: 1,
                                color: 'text.secondary',
                                mb: 2
                              }}
                            >
                              Зарежда се...
                            </Box>
                          ) : imageUrls[docType] ? (
                            <Box sx={{ position: 'relative', mb: 2 }}>
                              <Box
                                component="img"
                                src={imageUrls[docType]}
                                alt={titles[docType as keyof typeof titles]}
                                onClick={() => handleImageClick(imageUrls[docType])}
                                sx={{
                                  width: '100%',
                                  height: 200,
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  border: '1px solid #ddd',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    opacity: 0.8
                                  }
                                }}
                              />
                              <IconButton
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  right: 8,
                                  backgroundColor: 'rgba(0,0,0,0.5)',
                                  color: 'white',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.7)'
                                  }
                                }}
                                onClick={() => handleImageClick(imageUrls[docType])}
                              >
                                <PhotoIcon />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box 
                              sx={{ 
                                width: '100%', 
                                height: 200, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                border: '1px dashed #ddd',
                                borderRadius: 1,
                                color: 'text.secondary',
                                mb: 2
                              }}
                            >
                              Няма качена снимка
                            </Box>
                          )}

                          {/* Rejection Reason */}
                          {docStatus === 'rejected' && rejectionReason && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                              <Typography variant="subtitle2">Причина за отхвърляне:</Typography>
                              <Typography variant="body2">{rejectionReason}</Typography>
                            </Alert>
                          )}

                          {/* Verification Actions */}
                          {docStatus !== 'approved' && (
                            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                              {/* Approve Button */}
                              <Button
                                variant="contained"
                                color="success"
                                size="small"
                                startIcon={<ApproveIcon />}
                                onClick={() => handleApproveDocument(docType as any)}
                                disabled={!imageUrls[docType]}
                              >
                                Одобри документ
                              </Button>

                              {/* Reject Button */}
                              {showRejectionInput === docType ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                  <TextField
                                    size="small"
                                    placeholder="Причина за отхвърляне..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    multiline
                                    rows={2}
                                  />
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                      size="small"
                                      color="error"
                                      onClick={() => handleRejectDocument(docType as any)}
                                    >
                                      Потвърди отхвърляне
                                    </Button>
                                    <Button
                                      size="small"
                                      onClick={() => {
                                        setShowRejectionInput(null);
                                        setRejectionReason('');
                                      }}
                                    >
                                      Отказ
                                    </Button>
                                  </Box>
                                </Box>
                              ) : (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  startIcon={<RejectIcon />}
                                  onClick={() => setShowRejectionInput(docType)}
                                  disabled={!imageUrls[docType]}
                                >
                                  Отхвърли документ
                                </Button>
                              )}
                            </Box>
                          )}

                          {/* Approved Status */}
                          {docStatus === 'approved' && (
                            <Alert severity="success">
                              <Typography variant="body2">
                                ✅ Документът е одобрен
                              </Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              </Box>
            </TabPanel>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Отказ</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            {loading ? 'Запазване...' : 'Запази'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Modal */}
      <Modal
        open={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            outline: 'none',
          }}
        >
          <IconButton
            onClick={() => setSelectedImage(null)}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              zIndex: 1,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.7)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImage && (
            <Box
              component="img"
              src={selectedImage}
              alt="Документ"
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: 2,
                boxShadow: 3,
              }}
            />
          )}
        </Box>
      </Modal>
    </>
  );
} 