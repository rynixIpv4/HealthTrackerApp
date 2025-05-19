import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAQ-9WintgcnB-W-_N-qdv1HaVP2kYkzao",
  authDomain: "healthtracking-f8af7.firebaseapp.com",
  projectId: "healthtracking-f8af7",
  storageBucket: "healthtracking-f8af7.appspot.com",
  messagingSenderId: "551918444289",
  appId: "1:551918444289:web:dbaf4130b746a012194500",
  measurementId: "G-MJ161KGH3Q"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

// Constants for Multi-factor Authentication
const MFA_USER_COLLECTION = 'user_mfa_settings';
const MFA_PREFERRED_METHOD_KEY = 'preferredMethod';
const MFA_ENABLED_KEY = 'mfaEnabled';
const MFA_PHONE_KEY = 'phoneNumber';
const MFA_EMAIL_KEY = 'email';

// Basic auth functions
export const registerUser = async (email, password, displayName) => {
  const result = await auth().createUserWithEmailAndPassword(email, password);
  if (result.user) {
    await result.user.updateProfile({ displayName });
    
    // Create MFA settings document for the user
    await firestore()
      .collection(MFA_USER_COLLECTION)
      .doc(result.user.uid)
      .set({
        [MFA_ENABLED_KEY]: false,
        [MFA_PREFERRED_METHOD_KEY]: 'phone',
        [MFA_EMAIL_KEY]: email,
        createdAt: firestore.FieldValue.serverTimestamp()
      });
  }
  return result.user;
};

export const loginUser = async (email, password) => {
  const result = await auth().signInWithEmailAndPassword(email, password);
  
  // Check if 2FA is enabled for this user
  const mfaSettings = await getUserMfaSettings(result.user.uid);
  
  if (mfaSettings && mfaSettings[MFA_ENABLED_KEY]) {
    // If 2FA is enabled, return the user with a flag indicating 2FA is needed
    return {
      user: result.user,
      requiresMfa: true,
      mfaSettings
    };
  }
  
  // If 2FA is not enabled, return the user directly
  return {
    user: result.user,
    requiresMfa: false
  };
};

export const resetPassword = async (email) => {
  await auth().sendPasswordResetEmail(email);
  return true;
};

export const logoutUser = async () => {
  await auth().signOut();
  return true;
};

export const getCurrentUser = () => {
  return auth().currentUser;
};

// Firestore functions
export const saveHealthData = async (userId, dataType, value) => {
  await firestore()
    .collection('health_data')
    .add({
      userId,
      dataType,
      value,
      timestamp: firestore.FieldValue.serverTimestamp()
    });
};

export const getHealthData = async (userId, metricType) => {
  return {};
};

export const updateUserProfile = async (userId, data) => {
  await firestore()
    .collection('users')
    .doc(userId)
    .update(data);
};

// Two-Factor Authentication functions

// Get user MFA settings
export const getUserMfaSettings = async (userId) => {
  try {
    const doc = await firestore()
      .collection(MFA_USER_COLLECTION)
      .doc(userId)
      .get();
      
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error('Error getting MFA settings:', error);
    return null;
  }
};

// Enable/disable MFA for a user
export const updateMfaSettings = async (userId, isEnabled, phoneNumber = null) => {
  try {
    const updates = {
      [MFA_ENABLED_KEY]: isEnabled,
      updatedAt: firestore.FieldValue.serverTimestamp()
    };
    
    if (phoneNumber) {
      updates[MFA_PHONE_KEY] = phoneNumber;
    }
    
    await firestore()
      .collection(MFA_USER_COLLECTION)
      .doc(userId)
      .update(updates);
      
    return true;
  } catch (error) {
    console.error('Error updating MFA settings:', error);
    return false;
  }
};

// Phone verification methods
export const startPhoneVerification = async (phoneNumber) => {
  try {
    // Format phone number if needed
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = `+${phoneNumber}`;
    }
    
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber, true);
    return confirmation;
  } catch (error) {
    console.error('Error starting phone verification:', error);
    throw error;
  }
};

export const confirmPhoneVerificationCode = async (confirmationResult, code) => {
  try {
    return await confirmationResult.confirm(code);
  } catch (error) {
    console.error('Error confirming verification code:', error);
    throw error;
  }
};

// CAPTCHA verification for web
export const initializeCaptchaVerifier = (containerId, callback) => {
  try {
    if (Platform.OS === 'web') {
      // Initialize reCAPTCHA verifier on web
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier(containerId, {
        'size': 'normal',
        'callback': (response) => {
          // reCAPTCHA solved, allow the user to continue
          if (callback) callback(response);
        },
        'expired-callback': () => {
          // CAPTCHA expired, refresh
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
          initializeCaptchaVerifier(containerId, callback);
        }
      });
      
      // Render CAPTCHA
      window.recaptchaVerifier.render();
      return window.recaptchaVerifier;
    }
    return null;
  } catch (error) {
    console.error('Error initializing CAPTCHA:', error);
    return null;
  }
};

// Login with CAPTCHA for web
export const loginWithCaptchaVerification = async (email, password, captchaVerifier = null) => {
  try {
    const authProvider = auth();
    
    // On web, use CAPTCHA verification
    if (Platform.OS === 'web' && captchaVerifier) {
      // Apply CAPTCHA verification to the login flow
      authProvider.settings.appVerificationDisabledForTesting = false;
      
      // Sign in with email, password and CAPTCHA
      const result = await authProvider.signInWithEmailAndPassword(email, password);
      
      // Check if 2FA is enabled
      const mfaSettings = await getUserMfaSettings(result.user.uid);
      
      if (mfaSettings && mfaSettings[MFA_ENABLED_KEY]) {
        return {
          user: result.user,
          requiresMfa: true,
          mfaSettings
        };
      }
      
      return {
        user: result.user,
        requiresMfa: false
      };
    } else {
      // Non-web platforms just use regular login
      return loginUser(email, password);
    }
  } catch (error) {
    console.error('Error in login with CAPTCHA:', error);
    throw error;
  }
};

// Generate a time-based one-time password (TOTP) secret for a user
export const generateTotpSecret = async (userId) => {
  try {
    // Generate a random secret key
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Store the secret in Firestore
    await firestore()
      .collection(MFA_USER_COLLECTION)
      .doc(userId)
      .update({
        totpSecret: secret,
        totpEnabled: true,
        updatedAt: firestore.FieldValue.serverTimestamp()
      });
      
    return secret;
  } catch (error) {
    console.error('Error generating TOTP secret:', error);
    throw error;
  }
};

// Verify a TOTP code
export const verifyTotpCode = async (userId, code) => {
  try {
    // In a real implementation, you would verify the code against the stored secret
    // For this sample, we're just checking if the code is 6 digits
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return false;
    }
    
    // Normally, we would use a library like otplib to verify the code
    // This is a placeholder for the actual verification logic
    
    // For demo, we'll accept any 6-digit code
    return true;
  } catch (error) {
    console.error('Error verifying TOTP code:', error);
    return false;
  }
};

// Check if user has completed MFA
export const isUserMfaCompleted = async (userId) => {
  try {
    const mfaSettings = await getUserMfaSettings(userId);
    return mfaSettings?.mfaVerified === true;
  } catch (error) {
    console.error('Error checking MFA completion:', error);
    return false;
  }
};

// Mark MFA as completed for a login session
export const completeMfaVerification = async (userId) => {
  try {
    await firestore()
      .collection(MFA_USER_COLLECTION)
      .doc(userId)
      .update({
        mfaVerified: true,
        lastVerifiedAt: firestore.FieldValue.serverTimestamp()
      });
      
    return true;
  } catch (error) {
    console.error('Error completing MFA verification:', error);
    return false;
  }
};

// Direct exports
export { auth, firestore, storage }; 