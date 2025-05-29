import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../../constants/colors';
import { signIn } from '../../services/firebaseAPI';
import { AuthStackParamList } from '../../navigation/AuthStack';
import CustomAlert from '../../components/CustomAlert';
// import { signInWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '../../services/firebase';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Alert states
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'info'>('info');

  // Helper function to show custom alert
  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Грешка', 'Моля, попълнете всички полета', 'error');
      return;
    }
  
    setLoading(true);
  
    try {
      const userData = await signIn(email, password);
      showAlert('Успех', 'Успешен вход!', 'success');
      // По-късно ще запазим userData.idToken
    } catch (error: any) {
      let message = 'Грешен имейл или парола';
      
      if (error.message === 'EMAIL_NOT_FOUND') {
        message = 'Не съществува потребител с този имейл';
      } else if (error.message === 'INVALID_PASSWORD') {
        message = 'Грешна парола';
      } else if (error.message === 'INVALID_EMAIL') {
        message = 'Невалиден имейл адрес';
      }
      
      showAlert('Грешка', message, 'error');
    }
  
    setLoading(false);
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
        <Text style={styles.title}>Добре дошли!</Text>
        <Text style={styles.subtitle}>Влезте в профила си</Text>

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

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.buttonText}>Вход</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton}>
          <Text style={styles.linkText}>Нямате профил?</Text>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerButtonText}>Регистрирайте се</Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 60,
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
    marginBottom: 40,
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
  registerButton: {
    marginTop: 10,
    paddingHorizontal: 30,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 20,
  },
  registerButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});