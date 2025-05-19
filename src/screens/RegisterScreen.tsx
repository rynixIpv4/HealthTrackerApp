import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, SIZES, SCREENS } from '../constants';
import { registerUser } from '../services/firebase';
import Input from '../components/Input';
import Svg, { Path } from 'react-native-svg';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const RegisterScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Theme context
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('Attempting to register user with email:', email);
      await registerUser(email, password, name);
      console.log('Registration successful');
      // Authentication state change in Firebase will trigger the AuthNavigator to switch screens
    } catch (error: any) {
      console.error('Registration error caught in component:', error);
      let errorMessage = 'Registration failed. Please try again.';
      
      // Handle Firebase specific errors
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please use a different email.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. Please use at least 6 characters.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          default:
            // If it's a Firebase error with a message
            if (error.message) {
              errorMessage = `Registration failed: ${error.message}`;
            }
        }
      } else if (error.message) {
        // For non-Firebase errors that have a message
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate(SCREENS.LOGIN);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <LinearGradient
        colors={[colors.primary, colors.secondary || '#8C55F6']}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.8, y: 0.3 }}
        style={styles.gradientHeader}
      >
        <TouchableOpacity onPress={navigateToLogin} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.createAccountText}>Create Account</Text>
        </View>
      </LinearGradient>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formContainer}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              leftIcon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <Path d="M12 7a4 4 0 100-8 4 4 0 000 8z" />
                </Svg>
              }
              isDarkMode={isDarkMode}
              backgroundColor={colors.surface}
              textColor={colors.text}
            />

            <Input
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <Path d="M22 6l-10 7L2 6" />
                </Svg>
              }
              isDarkMode={isDarkMode}
              backgroundColor={colors.surface}
              textColor={colors.text}
            />

            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              isPassword
              autoCapitalize="none"
              leftIcon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </Svg>
              }
              isDarkMode={isDarkMode}
              backgroundColor={colors.surface}
              textColor={colors.text}
            />

            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              isPassword
              autoCapitalize="none"
              leftIcon={
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </Svg>
              }
              isDarkMode={isDarkMode}
              backgroundColor={colors.surface}
              textColor={colors.text}
            />

            <TouchableOpacity
              style={[
                styles.registerButton,
                (!name || !email || !password || !confirmPassword) && styles.registerButtonDisabled,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleRegister}
              disabled={isLoading || !name || !email || !password || !confirmPassword}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.buttonText || '#FFFFFF'} />
              ) : (
                <Text style={[styles.registerButtonText, { color: colors.buttonText || '#FFFFFF' }]}>Create Account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientHeader: {
    height: height * 0.25,
    width: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: 'flex-end',
    padding: SIZES.large,
    paddingBottom: SIZES.xxlarge,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'absolute',
    top: SIZES.large,
    left: SIZES.large,
  },
  headerTextContainer: {
    maxWidth: '80%',
  },
  createAccountText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SIZES.large,
    paddingTop: SIZES.xlarge,
    paddingBottom: SIZES.xxlarge,
  },
  errorContainer: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: SIZES.medium,
    borderRadius: SIZES.small,
    marginBottom: SIZES.medium,
  },
  errorText: {
    color: COLORS.danger,
  },
  formContainer: {
    marginTop: SIZES.small,
  },
  registerButton: {
    paddingVertical: SIZES.medium + 4,
    borderRadius: SIZES.medium,
    alignItems: 'center',
    marginTop: SIZES.large,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  registerButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonText: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.large,
    paddingVertical: SIZES.medium,
  },
  loginText: {
    fontSize: SIZES.medium,
  },
  loginLink: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
});

export default RegisterScreen; 