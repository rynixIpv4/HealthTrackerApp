import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  ImageBackground
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, SIZES, SCREENS } from '../constants';
import { 
  loginUser, 
  loginWithCaptchaVerification, 
  initializeCaptchaVerifier 
} from '../services/firebase';
import Input from '../components/Input';
import Svg, { Path } from 'react-native-svg';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(Platform.OS !== 'web');
  
  // Refs for CAPTCHA
  const captchaVerifierRef = useRef(null);
  const captchaContainerRef = useRef(null);
  
  // Theme context
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  // Initialize CAPTCHA for web
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Set timeout to ensure DOM is ready
      setTimeout(() => {
        try {
          const verifier = initializeCaptchaVerifier('recaptcha-container', () => {
            // CAPTCHA verified callback
            setCaptchaVerified(true);
          });
          captchaVerifierRef.current = verifier;
        } catch (error) {
          console.error("Failed to initialize CAPTCHA:", error);
        }
      }, 1000);
    }
    
    return () => {
      // Clean up CAPTCHA
      if (Platform.OS === 'web' && window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {
          console.error("Error clearing CAPTCHA:", e);
        }
      }
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    // On web, check if CAPTCHA is verified
    if (Platform.OS === 'web' && !captchaVerified) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      let loginResult;
      
      // Use CAPTCHA verification on web
      if (Platform.OS === 'web') {
        loginResult = await loginWithCaptchaVerification(email, password, captchaVerifierRef.current);
      } else {
        loginResult = await loginUser(email, password);
      }
      
      // Check if 2FA is required
      if (loginResult.requiresMfa) {
        // Navigate to 2FA screen with necessary params
        navigation.navigate(SCREENS.TWO_FACTOR_AUTH, {
          userCredential: loginResult.user,
          userId: loginResult.user.uid,
          phoneNumber: loginResult.mfaSettings?.phoneNumber || ''
        });
      }
      // If 2FA is not required, authentication state change in Firebase will trigger the AuthNavigator to switch screens
      
    } catch (error: any) {
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'CAPTCHA verification failed. Please try again.';
        // Reset CAPTCHA on failure
        if (Platform.OS === 'web' && window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          initializeCaptchaVerifier('recaptcha-container', () => {
            setCaptchaVerified(true);
          });
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate(SCREENS.FORGOT_PASSWORD);
  };

  const handleRegister = () => {
    navigation.navigate(SCREENS.REGISTER);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <LinearGradient
          colors={[colors.primary, colors.secondary || '#8C55F6']}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.8, y: 0.3 }}
          style={styles.gradientHeader}
        >
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Welcome back</Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
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
            placeholder="Enter your password"
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
          
          {Platform.OS === 'web' && (
            <View style={styles.captchaContainer}>
              <View id="recaptcha-container" ref={captchaContainerRef} style={styles.recaptcha} />
              {captchaVerified && (
                <View style={styles.captchaVerifiedBadge}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M20 6L9 17l-5-5" />
                  </Svg>
                  <Text style={styles.captchaVerifiedText}>Verified</Text>
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.forgotPassword} 
            onPress={handleForgotPassword}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.loginButton, 
              (!email || !password || (Platform.OS === 'web' && !captchaVerified)) && styles.loginButtonDisabled,
              { backgroundColor: colors.primary }
            ]} 
            onPress={handleLogin}
            disabled={isLoading || !email || !password || (Platform.OS === 'web' && !captchaVerified)}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.buttonText || '#FFFFFF'} />
            ) : (
              <Text style={[styles.loginButtonText, { color: colors.buttonText || '#FFFFFF' }]}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.footerContainer}>
          <View style={styles.registerContainer}>
            <Text style={[styles.registerText, { color: colors.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  gradientHeader: {
    height: height * 0.3,
    width: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: 'flex-end',
    padding: SIZES.large,
    paddingBottom: SIZES.xxlarge,
  },
  headerTextContainer: {
    maxWidth: '80%',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  formContainer: {
    paddingHorizontal: SIZES.large,
    paddingTop: SIZES.xlarge,
    flex: 1,
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
  captchaContainer: {
    marginTop: SIZES.medium,
    position: 'relative',
  },
  recaptcha: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SIZES.medium,
    width: '100%',
  },
  captchaVerifiedBadge: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: SIZES.small,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  captchaVerifiedText: {
    color: '#4CAF50',
    fontSize: 12,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: SIZES.small,
    marginBottom: SIZES.large,
  },
  forgotPasswordText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  loginButton: {
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
  loginButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerContainer: {
    alignItems: 'center',
    marginBottom: height * 0.05,
    paddingHorizontal: SIZES.large,
  },
  registerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    fontSize: SIZES.medium,
  },
  registerLink: {
    fontSize: SIZES.medium,
    fontWeight: '600',
  },
});

export default LoginScreen; 