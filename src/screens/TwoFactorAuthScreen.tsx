import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Animated
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, SIZES, SCREENS } from '../constants';
import { 
  auth, 
  firestore,
  startPhoneVerification,
  confirmPhoneVerificationCode,
  verifyTotpCode,
  completeMfaVerification, 
  getUserMfaSettings
} from '../services/firebase';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import ScreenHeader from '../components/ScreenHeader';


interface RouteParams {
  userCredential: any;
  userId: string;
  phoneNumber: string;
}

const TwoFactorAuthScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  const params = route.params as RouteParams;
  const { userCredential, userId, phoneNumber } = params || {};
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState('sms');
  const [mfaSettings, setMfaSettings] = useState<any>(null);
  
  // Animation value for the input focus effect
  const inputFocusAnim = useRef(new Animated.Value(0)).current;
  
  // Individual code inputs for better UX
  const [codeInputs, setCodeInputs] = useState(['', '', '', '', '', '']);
  const codeInputRefs = useRef<Array<TextInput | null>>([]);
  
  const timer = useRef<NodeJS.Timeout | null>(null);

  // Load user MFA settings
  useEffect(() => {
    const loadMfaSettings = async () => {
      try {
        if (userId) {
          const settings = await getUserMfaSettings(userId);
          setMfaSettings(settings);
          
          // Set verification method based on user preferences
          if (settings && settings.preferredMethod) {
            setVerificationMethod(settings.preferredMethod);
          }
        }
      } catch (error) {
        console.error('Error loading MFA settings:', error);
      }
    };
    
    loadMfaSettings();
  }, [userId]);
  
  // Start phone verification when component mounts
  useEffect(() => {
    if (verificationMethod === 'sms') {
      sendVerificationCode();
    }
    
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [verificationMethod]);
  
  // Animation effects for input focus
  useEffect(() => {
    Animated.timing(inputFocusAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, []);
  
  // Handle code input changes for better UX
  const handleCodeInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;
    
    // Update the code input state
    const newCodeInputs = [...codeInputs];
    newCodeInputs[index] = value;
    setCodeInputs(newCodeInputs);
    
    // Combine all inputs into verification code
    setVerificationCode(newCodeInputs.join(''));
    
    // Auto-focus next input if current input has a value
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
    
    // If full code is entered, trigger verification
    if (index === 5 && value && newCodeInputs.every(c => c !== '')) {
      setTimeout(() => handleVerifyCode(), 300);
    }
  };
  
  // Handle backspace for code input
  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && index > 0 && !codeInputs[index]) {
      // If current field is empty and backspace is pressed, focus previous input
      codeInputRefs.current[index - 1]?.focus();
    }
  };
  
  const sendVerificationCode = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Format phone number if needed
      let formattedPhone = phoneNumber;
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = `+${formattedPhone}`;
      }
      
      // Start verification
      const confirmation = await startPhoneVerification(formattedPhone);
      setConfirmationResult(confirmation);
      
      // Start countdown timer
      setTimeLeft(60);
      setCanResend(false);
      
      if (timer.current) {
        clearInterval(timer.current);
      }
      
      timer.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer.current);
            setCanResend(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error sending verification code:', error);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendCode = () => {
    if (canResend) {
      sendVerificationCode();
    }
  };
  
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 6) {
      setError('Please enter a valid verification code');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (verificationMethod === 'sms') {
        // Verify the SMS code
        if (!confirmationResult) {
          setError('Verification session expired. Please request a new code.');
          setIsLoading(false);
          return;
        }
        
        await confirmPhoneVerificationCode(confirmationResult, verificationCode);
      } else {
        // Verify TOTP code
        const isValid = await verifyTotpCode(userId, verificationCode);
        if (!isValid) {
          setError('Invalid verification code. Please try again.');
          setIsLoading(false);
          return;
        }
      }
      
      // Mark MFA as completed
      await completeMfaVerification(userId);
      
      // On successful verification, navigate to the dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    // Sign out the user
    auth().signOut();
    
    // Navigate back to the login screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth' }],
    });
  };
  
  const switchVerificationMethod = () => {
    // Only allow switching if both methods are available
    if (mfaSettings && mfaSettings.totpEnabled) {
      setVerificationMethod(verificationMethod === 'sms' ? 'totp' : 'sms');
      setVerificationCode('');
      setCodeInputs(['', '', '', '', '', '']);
      setError('');
    }
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Two-Factor Authentication</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[
            styles.securityIconContainer,
            { 
              backgroundColor: colors.primary + '20',
              transform: [{ 
                scale: inputFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                })
              }]
            }
          ]}>
            <MaterialIcons 
              name={verificationMethod === 'sms' ? 'sms' : 'security'} 
              size={60} 
              color={colors.primary}
            />
          </Animated.View>
          
          <Text style={[styles.title, { color: colors.text }]}>Verification Required</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {verificationMethod === 'sms' 
              ? `We've sent a verification code to your phone number ending in ${phoneNumber?.slice(-4) || '****'}.`
              : 'Enter the authentication code from your authenticator app.'}
          </Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <View style={styles.codeInputContainer}>
            {codeInputs.map((code, index) => (
              <TextInput
                key={`code-${index}`}
                ref={(ref) => { codeInputRefs.current[index] = ref }}
                style={[
                  styles.codeDigitInput,
                  { 
                    backgroundColor: isDarkMode ? '#1F2937' : '#F5F7FA',
                    color: colors.text,
                    borderColor: error ? COLORS.danger : code ? colors.primary : colors.border
                  }
                ]}
                value={code}
                onChangeText={(value) => handleCodeInputChange(index, value)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>
          
          <TouchableOpacity 
            style={[
              styles.verifyButton, 
              { 
                backgroundColor: colors.primary, 
                opacity: isLoading || verificationCode.length < 6 ? 0.7 : 1 
              }
            ]}
            onPress={handleVerifyCode}
            disabled={isLoading || verificationCode.length < 6}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
          
          {verificationMethod === 'sms' && (
            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity onPress={handleResendCode}>
                  <Text style={[styles.resendText, { color: colors.primary }]}>Resend Code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.timerText, { color: colors.textSecondary }]}>
                  Resend code in {timeLeft}s
                </Text>
              )}
            </View>
          )}
          
          {/* Method switcher - only show if TOTP is enabled */}
          {mfaSettings && mfaSettings.totpEnabled && (
            <TouchableOpacity 
              style={styles.switchMethodContainer} 
              onPress={switchVerificationMethod}
            >
              <MaterialIcons 
                name={verificationMethod === 'sms' ? 'security' : 'sms'} 
                size={20} 
                color={colors.primary} 
              />
              <Text style={[styles.switchMethodText, { color: colors.primary }]}>
                Use {verificationMethod === 'sms' ? 'authenticator app' : 'SMS'} instead
              </Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.securityTipsContainer}>
            <Text style={[styles.securityTipsTitle, { color: colors.text }]}>Security Tips</Text>
            <View style={styles.securityTipItem}>
              <MaterialIcons name="check-circle" size={18} color={colors.primary} />
              <Text style={[styles.securityTipText, { color: colors.textSecondary }]}>
                Never share your verification code with anyone
              </Text>
            </View>
            <View style={styles.securityTipItem}>
              <MaterialIcons name="check-circle" size={18} color={colors.primary} />
              <Text style={[styles.securityTipText, { color: colors.textSecondary }]}>
                The code expires after 10 minutes
              </Text>
            </View>
            <View style={styles.securityTipItem}>
              <MaterialIcons name="check-circle" size={18} color={colors.primary} />
              <Text style={[styles.securityTipText, { color: colors.textSecondary }]}>
                Contact support if you don't receive a code
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  securityIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  icon: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: COLORS.danger,
    marginLeft: 8,
    flex: 1,
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  codeDigitInput: {
    width: 48,
    height: 56,
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    borderWidth: 1.5,
  },
  codeInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    textAlign: 'center',
    letterSpacing: 8,
    width: '100%',
  },
  verifyButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resendContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resendText: {
    fontSize: 16,
    fontWeight: '500',
  },
  timerText: {
    fontSize: 16,
  },
  switchMethodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 24,
  },
  switchMethodText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  securityTipsContainer: {
    width: '100%',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  securityTipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  securityTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  securityTipText: {
    fontSize: 14,
    marginLeft: 8,
    lineHeight: 20,
    flex: 1,
  },
});

export default TwoFactorAuthScreen; 