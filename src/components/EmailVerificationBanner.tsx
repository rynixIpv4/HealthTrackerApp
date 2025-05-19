import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { resendVerificationEmail, isEmailVerified, getCurrentUser } from '../services/firebase';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface EmailVerificationBannerProps {
  onVerified?: () => void;
}

const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({ onVerified }) => {
  const [isSending, setIsSending] = useState(false);
  const [shouldShow, setShouldShow] = useState(true);
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  // Use useEffect to check email verification status
  useEffect(() => {
    const user = getCurrentUser();
    const verified = user && isEmailVerified();
    
    if (!user || verified) {
      setShouldShow(false);
      if (onVerified) {
        onVerified();
      }
    } else {
      setShouldShow(true);
    }
  }, [onVerified]);
  
  const handleResend = async () => {
    setIsSending(true);
    try {
      await resendVerificationEmail();
      Alert.alert(
        'Verification Email Sent',
        'Please check your inbox and follow the link to verify your email address.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification email. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };
  
  // Don't render anything if we shouldn't show the banner
  if (!shouldShow) {
    return null;
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.warning }]}>
      <View style={styles.content}>
        <MaterialIcons name="warning" size={20} color="#FFFFFF" />
        <Text style={styles.text}>
          Please verify your email address to access all features.
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleResend}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Resend</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default EmailVerificationBanner; 