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
  StatusBar,
  Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, SIZES, SCREENS } from '../constants';
import { resetPassword } from '../services/firebase';
import Input from '../components/Input';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Theme context
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resetPassword(email);
      setIsEmailSent(true);
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email. Please try again.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={navigateToLogin} style={[styles.backButton, { backgroundColor: isDarkMode ? colors.surface : COLORS.lightGray }]}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>We'll send you a link to reset it</Text>
          </View>
        </View>

        {isEmailSent ? (
          <View style={styles.successContainer}>
            <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
              <Circle cx={12} cy={12} r={10} stroke={COLORS.success} strokeWidth={2} />
              <Path d="M9 12l2 2 4-4" stroke={COLORS.success} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={[styles.successTitle, { color: colors.text }]}>Email Sent</Text>
            <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
              We've sent a password reset link to {email}. Please check your inbox and follow the instructions.
            </Text>
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: colors.primary }]}
              onPress={navigateToLogin}
            >
              <Text style={[styles.loginButtonText, { color: colors.buttonText }]}>Return to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formContainer}>
            <View style={[styles.infoContainer, { backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.1)' }]}>
              <Text style={[styles.description, { color: isDarkMode ? colors.textSecondary : COLORS.darkBlue }]}>
                Enter your email address, and we'll send you a link to reset your password.
              </Text>
            </View>

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

            <TouchableOpacity
              style={[
                styles.resetButton,
                !email && styles.resetButtonDisabled,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleResetPassword}
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <Text style={[styles.resetButtonText, { color: colors.buttonText }]}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>Remember your password? </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={[styles.loginLink, { color: colors.primary }]}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    padding: SIZES.large,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.large,
    marginTop: height * 0.02,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: SIZES.small / 2,
  },
  subtitle: {
    fontSize: SIZES.medium,
  },
  formContainer: {
    marginTop: SIZES.large,
  },
  infoContainer: {
    padding: SIZES.medium,
    borderRadius: SIZES.small,
    marginBottom: SIZES.large,
  },
  description: {
    fontSize: SIZES.medium,
    lineHeight: 22,
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
  resetButton: {
    paddingVertical: SIZES.medium + 2,
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
  resetButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  resetButtonText: {
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
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.large,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: SIZES.xlarge,
    marginBottom: SIZES.medium,
  },
  successMessage: {
    fontSize: SIZES.medium,
    textAlign: 'center',
    marginBottom: SIZES.xlarge,
    lineHeight: 22,
  },
  loginButton: {
    width: '100%',
    paddingVertical: SIZES.medium + 2,
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
  loginButtonText: {
    fontSize: SIZES.medium,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default ForgotPasswordScreen; 