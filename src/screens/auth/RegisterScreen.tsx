import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { signUp, createDocument, uploadFile } from '../../services/firebaseAPI';
import { sendSMSVerificationCode, verifySMSCode } from '../../services/smsService';
import { AuthStackParamList } from '../../navigation/AuthStack';
import CustomAlert from '../../components/CustomAlert';
import ImagePickerModal from '../../components/ImagePickerModal';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;
type UserType = 'client' | 'driver';

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export default function RegisterScreen({ navigation }: Props) {
  const [userType, setUserType] = useState<UserType>('client');
  const [loading, setLoading] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);

  // Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  // Image picker states
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [currentImageType, setCurrentImageType] = useState<'roadsideAssistance' | 'iaala' | 'driverPhoto'>('roadsideAssistance');

  // Основни полета
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Шофьорски полета
  const [companyName, setCompanyName] = useState('');
  const [companyBulstat, setCompanyBulstat] = useState('');
  const [roadsideAssistanceCert, setRoadsideAssistanceCert] = useState<string | null>(null);
  const [iaalaLicense, setIaalaLicense] = useState<string | null>(null);
  const [driverPhoto, setDriverPhoto] = useState<string | null>(null);

  // Helper function to show custom alert
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const pickImage = async (type: 'roadsideAssistance' | 'iaala' | 'driverPhoto') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Грешка', 'Нужно е разрешение за достъп до галерията', 'error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      switch (type) {
        case 'roadsideAssistance':
          setRoadsideAssistanceCert(imageUri);
          break;
        case 'iaala':
          setIaalaLicense(imageUri);
          break;
        case 'driverPhoto':
          setDriverPhoto(imageUri);
          break;
      }
    }
    setImagePickerVisible(false);
  };

  const takePhoto = async (type: 'roadsideAssistance' | 'iaala' | 'driverPhoto') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Грешка', 'Нужно е разрешение за достъп до камерата', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      switch (type) {
        case 'roadsideAssistance':
          setRoadsideAssistanceCert(imageUri);
          break;
        case 'iaala':
          setIaalaLicense(imageUri);
          break;
        case 'driverPhoto':
          setDriverPhoto(imageUri);
          break;
      }
    }
    setImagePickerVisible(false);
  };

  const showImagePicker = (type: 'roadsideAssistance' | 'iaala' | 'driverPhoto') => {
    setCurrentImageType(type);
    setImagePickerVisible(true);
  };

  const sendVerificationCode = async () => {
    if (!phone || phone.length < 9) {
      showAlert('Грешка', 'Моля, въведете валиден телефонен номер (поне 9 цифри)', 'error');
      return;
    }

    setVerifyingPhone(true);
    
    try {
      await sendSMSVerificationCode(phone);
      setShowVerificationCode(true);
      showAlert(
        'Код изпратен', 
        `Изпратихме верификационен код на ${phone} чрез SMS.\n\n🔔 В ДЕМО РЕЖИМ:\nКодът се показва като pop-up alert и в конзолата на браузъра/телефона.\n\n⏰ Кодът е валиден 5 минути.`,
        'success'
      );
    } catch (error: any) {
      showAlert('Грешка', error.message, 'error');
    }
    
    setVerifyingPhone(false);
  };

  const verifyPhoneCodeHandler = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      showAlert('Грешка', 'Моля, въведете 6-цифрения код', 'error');
      return;
    }

    setVerifyingPhone(true);

    try {
      await verifySMSCode(phone, verificationCode);
      setPhoneVerified(true);
      setShowVerificationCode(false);
      showAlert('Успех', 'Телефонният номер е верифициран!', 'success');
    } catch (error: any) {
      showAlert('Грешка', error.message, 'error');
    }

    setVerifyingPhone(false);
  };

  const handleRegister = async () => {
    if (!email || !password || !fullName || !phone) {
      showAlert('Грешка', 'Моля, попълнете всички основни полета', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Грешка', 'Паролите не съвпадат', 'error');
      return;
    }

    if (userType === 'driver') {
      if (!companyName || !companyBulstat) {
        showAlert('Грешка', 'Моля, попълнете данните за фирмата', 'error');
        return;
      }
      if (!roadsideAssistanceCert || !iaalaLicense || !driverPhoto) {
        showAlert('Грешка', 'Моля, качете всички документи и снимка', 'error');
        return;
      }
    }

    setLoading(true);

    try {
      const userData = await signUp(email, password);
      
      let userProfile: any = {
        email,
        fullName,
        phone,
        phoneVerified: false,
        userType,
        createdAt: new Date(),
      };

      if (userType === 'driver') {
        // Качване на документите
        const [roadsideCertUrl, iaalaUrl, photoUrl] = await Promise.all([
          uploadFile(roadsideAssistanceCert!, `roadside_cert_${userData.localId}`, userData.idToken),
          uploadFile(iaalaLicense!, `iaala_license_${userData.localId}`, userData.idToken),
          uploadFile(driverPhoto!, `driver_photo_${userData.localId}`, userData.idToken),
        ]);

        userProfile = {
          ...userProfile,
          companyInfo: {
            name: companyName,
            bulstat: companyBulstat,
          },
          documents: {
            roadsideAssistanceCert: roadsideCertUrl.name,
            iaalaLicense: iaalaUrl.name,
            driverPhoto: photoUrl.name,
          },
          // Initialize document verification status
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
          },
          status: 'pending',
          isActive: false,
        };
      }

      await createDocument('users', userProfile, userData.idToken);
      
      // Регистрацията е успешна
      console.log('Registration successful!');
      
      let successMessage = 'Регистрацията е успешна!';
      
      if (__DEV__) {
        successMessage += '\n\n🔧 DEVELOPMENT MODE:\n';
        successMessage += '• Файловете се обработват в демо режим\n';
        successMessage += '• Всички данни се запазват правилно\n';
        successMessage += '• Това е нормално поведение за тестване\n\n';
        successMessage += '⏳ След одобрение от администратор ще можете да приемате заявки.';
      } else {
        successMessage += '\n\n⏳ След одобрение от администратор ще можете да приемате заявки.';
      }
      
      showAlert(
        'Успех!', 
        successMessage,
        'success'
      );
      
      // Прехвърляме към LoginScreen
      navigation.navigate('Login');
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
      let message = 'Възникна грешка при регистрацията';
      
      // Firebase Auth errors
      if (error.message === 'EMAIL_EXISTS') {
        message = 'Потребител с този имейл вече съществува';
      } else if (error.message === 'WEAK_PASSWORD') {
        message = 'Паролата трябва да е поне 6 символа';
      } else if (error.message === 'INVALID_EMAIL') {
        message = 'Невалиден имейл адрес';
      } 
      // Firestore errors
      else if (error.code === 'permission-denied') {
        message = 'Няма разрешение за запис на данните';
      } else if (error.code === 'unavailable') {
        message = 'Услугата временно не е достъпна. Моля, опитайте отново';
      } 
      // Storage errors
      else if (error.message?.includes('storage')) {
        message = 'Грешка при качване на документите. Моля, опитайте отново';
      }
      // Network errors
      else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        message = 'Няма интернет връзка. Моля, проверете връзката си';
      }
      // Show the actual error message for debugging in development
      else if (__DEV__) {
        message = `Грешка: ${error.message || JSON.stringify(error)}`;
      }
      
      showAlert('Грешка', message, 'error');
    }

    setLoading(false);
  };

  const renderUserTypeSelector = () => (
    <View style={styles.userTypeContainer}>
      <TouchableOpacity
        style={[styles.userTypeButton, userType === 'client' && styles.userTypeButtonActive]}
        onPress={() => setUserType('client')}
      >
        <Text style={[styles.userTypeText, userType === 'client' && styles.userTypeTextActive]}>
          Клиент
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.userTypeButton, userType === 'driver' && styles.userTypeButtonActive]}
        onPress={() => setUserType('driver')}
      >
        <Text style={[styles.userTypeText, userType === 'driver' && styles.userTypeTextActive]}>
          Шофьор
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderImagePicker = (
    title: string, 
    imageUri: string | null, 
    type: 'roadsideAssistance' | 'iaala' | 'driverPhoto'
  ) => (
    <View style={styles.imagePickerContainer}>
      <Text style={styles.imagePickerLabel}>{title}</Text>
      <TouchableOpacity 
        style={styles.imagePickerButton}
        onPress={() => showImagePicker(type)}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.pickedImage} />
        ) : (
          <Text style={styles.imagePickerText}>Добави снимка</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderDriverFields = () => (
    <>
      <Text style={styles.sectionTitle}>Данни за фирмата</Text>
      <TextInput
        style={styles.input}
        placeholder="Име на фирма"
        value={companyName}
        onChangeText={setCompanyName}
      />
      <TextInput
        style={styles.input}
        placeholder="Булстат на фирма"
        value={companyBulstat}
        onChangeText={setCompanyBulstat}
        keyboardType="numeric"
      />

      <Text style={styles.sectionTitle}>Документи</Text>
      {renderImagePicker('Удостоверение за пътна помощ', roadsideAssistanceCert, 'roadsideAssistance')}
      {renderImagePicker('Лиценз от ИААА', iaalaLicense, 'iaala')}
      {renderImagePicker('Снимка на шофьор', driverPhoto, 'driverPhoto')}
    </>
  );

  const getImagePickerTitle = () => {
    switch (currentImageType) {
      case 'roadsideAssistance':
        return 'Удостоверение за пътна помощ';
      case 'iaala':
        return 'Лиценз от ИААА';
      case 'driverPhoto':
        return 'Снимка на шофьор';
      default:
        return 'Избор на снимка';
    }
  };

  return (
    <>
      <KeyboardAwareScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        extraHeight={120}
        extraScrollHeight={120}
        keyboardOpeningTime={0}
        resetScrollToCoords={{ x: 0, y: 0 }}
      >
        <Text style={styles.title}>Регистрация</Text>
        <Text style={styles.subtitle}>Създайте нов профил</Text>

        {renderUserTypeSelector()}

        <Text style={styles.sectionTitle}>Основни данни</Text>
        <TextInput
          style={styles.input}
          placeholder="Име и фамилия"
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          style={styles.input}
          placeholder="Телефон"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Имейл"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Парола"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder="Потвърди парола"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        {userType === 'driver' && renderDriverFields()}

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.buttonText}>Регистрирай се</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Имате профил?</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Влезте тук</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />

      <ImagePickerModal
        visible={imagePickerVisible}
        title={getImagePickerTitle()}
        onCamera={() => takePhoto(currentImageType)}
        onGallery={() => pickImage(currentImageType)}
        onCancel={() => setImagePickerVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  userTypeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 30,
    padding: 4,
  },
  userTypeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  userTypeButtonActive: {
    backgroundColor: colors.primary,
  },
  userTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  userTypeTextActive: {
    color: colors.textOnPrimary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 15,
  },
  inputVerified: {
    borderColor: colors.success,
    backgroundColor: '#F8FFF8',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  phoneInput: {
    flex: 1,
    marginRight: 10,
    marginBottom: 15,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  verifyButtonText: {
    color: colors.textOnPrimary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  verifiedIcon: {
    backgroundColor: colors.success,
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  verifiedText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  verificationContainer: {
    marginBottom: 15,
  },
  imagePickerContainer: {
    marginBottom: 20,
  },
  imagePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
  },
  imagePickerButton: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  pickedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: colors.textOnPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  loginButton: {
    marginTop: 10,
    paddingHorizontal: 30,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
  },
  loginButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 