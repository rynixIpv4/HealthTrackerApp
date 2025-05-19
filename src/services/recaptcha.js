import { NativeModules, Platform } from 'react-native';
import auth from '@react-native-firebase/auth';

// Important: Replace with your actual site key from the Firebase console
const RECAPTCHA_SITE_KEY = '6LeRvwApAAAAAK1TazuGGlQyaW5iqbA7k2TxK2Co';
const { RecaptchaModule } = NativeModules;

/**
 * Provides in-app reCAPTCHA verification for Firebase Phone Auth
 */
export const initializeRecaptcha = async () => {
  // For Android, try to use the native module
  if (Platform.OS === 'android' && RecaptchaModule) {
    try {
      await RecaptchaModule.initRecaptcha();
      console.log('Native reCAPTCHA initialized successfully');
      return true;
    } catch (error) {
      console.warn('Failed to initialize native reCAPTCHA:', error);
      // Fall back to web flow if native fails
    }
  }
  
  console.log('Using web-based reCAPTCHA verification');
  return false;
};

/**
 * Verifies phone number using in-app verification if available
 */
export const verifyPhoneNumber = async (phoneNumber) => {
  // Check if native module is available
  if (Platform.OS === 'android' && RecaptchaModule) {
    try {
      // Try to use the native module first
      const token = await RecaptchaModule.verifyForPhoneAuth();
      console.log('Successfully verified with native reCAPTCHA');
      
      // Use the token with Firebase Auth
      const authSettings = {
        // Configure settings here
        forceRecaptchaFlow: false
      };
      
      return auth().signInWithPhoneNumber(phoneNumber, false);
    } catch (error) {
      console.warn('Native verification failed:', error);
      // Fall back to web flow if needed
    }
  }
  
  // Default to the normal method which might show a web view
  return auth().signInWithPhoneNumber(phoneNumber);
};

export default {
  initializeRecaptcha,
  verifyPhoneNumber
}; 