import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  StatusBar,
  Dimensions,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, ELEVATION_STYLES } from '../constants';
import BackButton from '../components/BackButton';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

// Simple device interface
interface Device {
  id: string;
  name: string;
  platform: string;
  lastActive: string;
}

const SecurityScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // Basic states
  const [currentDevice] = useState<Device>({
    id: `device_${Platform.OS}_${Date.now()}`,
    name: Platform.OS === 'ios' ? 'iPhone' : 'Android Device',
    platform: Platform.OS,
    lastActive: new Date().toISOString()
  });
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [step2FA, setStep2FA] = useState(1);
  const [confirm, setConfirm] = useState(null);
  
  // Status states
  const [passwordError, setPasswordError] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Security score calculation
  const calculateSecurityScore = () => {
    let score = 50; // Base score
    
    // Add points for 2FA
    if (twoFactorEnabled) score += 30;
    
    // Assume password strength check (in a real app you'd have actual logic here)
    // We're just simulating it here
    score += 15;
    
    return Math.min(score, 100); // Cap at 100
  };
  
  const securityScore = calculateSecurityScore();
  const getScoreColor = () => {
    if (securityScore >= 80) return '#4CAF50'; // Good
    if (securityScore >= 60) return '#FFC107'; // Medium
    return '#F44336'; // Poor
  };
  
  useEffect(() => {
    console.log('SecurityScreen: Initializing');
    loadAuthSettings();
    
    // Test Firebase permissions when the screen loads
    const user = auth().currentUser;
    if (user) {
      console.log('Testing Firebase permissions on init');
      checkFirestorePermissions(user.uid)
        .then(result => {
          console.log('Permission check result:', result);
        })
        .catch(err => {
          console.error('Permission check error:', err);
        });
    } else {
      console.log('No user logged in for permission check');
    }
  }, []);

  const loadAuthSettings = async () => {
    try {
      const user = auth().currentUser;
      if (!user) {
        console.log('No authenticated user found');
        return;
      }

      console.log('Checking 2FA status for user:', user.uid);
      
      // First check user_mfa_settings collection
      try {
        const mfaDoc = await firestore()
          .collection('user_mfa_settings')
          .doc(user.uid)
          .get();
          
        if (mfaDoc.exists) {
          const mfaData = mfaDoc.data();
          if (mfaData?.mfaEnabled) {
            console.log('2FA is enabled in user_mfa_settings');
            setTwoFactorEnabled(true);
            return;
          }
        }
      } catch (mfaError) {
        console.log('Error checking user_mfa_settings:', mfaError);
      }
      
      // If we get here, user_mfa_settings didn't have enabled 2FA, check users collection
      try {
      const doc = await firestore()
        .collection('users')
        .doc(user.uid)
        .get();

      if (doc.exists) {
        const userData = doc.data();
        if (userData?.securitySettings?.twoFactorEnabled) {
            console.log('2FA is enabled in users collection');
          setTwoFactorEnabled(true);
        } else {
          console.log('2FA is not enabled for this user');
          setTwoFactorEnabled(false);
        }
      } else {
          console.log('User document does not exist in users collection');
          setTwoFactorEnabled(false);
        }
      } catch (userError) {
        console.log('Error checking users collection:', userError);
        setTwoFactorEnabled(false);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
      setTwoFactorEnabled(false);
    }
  };

  const handleChangePassword = () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to change your password');
      return;
    }
    
    setIsChangingPassword(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const submitPasswordChange = async () => {
    // Validate inputs
    if (!currentPassword) {
      setPasswordError('Current password is required');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const user = auth().currentUser;
      if (!user || !user.email) {
        throw new Error('User not authenticated');
      }
      
      // Reauthenticate first
      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);
      
      // Then update password
      await user.updatePassword(newPassword);
      
      // Success
      setIsChangingPassword(false);
      Alert.alert('Success', 'Your password has been updated');
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError('New password is too weak');
      } else if (error.code === 'auth/requires-recent-login') {
        setPasswordError('Please log out and log back in to change your password');
      } else {
        setPasswordError('Failed to change password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTwoFactor = () => {
    const user = auth().currentUser;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to manage two-factor authentication');
      return;
    }
    
    if (twoFactorEnabled) {
      // Turn off 2FA
      Alert.alert(
        'Disable Two-Factor Authentication',
        'Are you sure you want to disable two-factor authentication? This will make your account less secure.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Disable', 
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              try {
                // Try to update both collections for consistency
                try {
                  // First update user_mfa_settings collection
                  await firestore()
                    .collection('user_mfa_settings')
                    .doc(user.uid)
                    .set({
                      mfaEnabled: false,
                      disabledAt: firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                  
                  console.log('Successfully disabled 2FA in user_mfa_settings');
                } catch (mfaError) {
                  console.error('Error updating user_mfa_settings:', mfaError);
                }
                
                try {
                  // Then update users collection as well
                await firestore()
                  .collection('users')
                  .doc(user.uid)
                  .set({
                    securitySettings: {
                      twoFactorEnabled: false,
                      disabledAt: firestore.FieldValue.serverTimestamp()
                    }
                  }, { merge: true });
                  
                  console.log('Successfully disabled 2FA in users collection');
                } catch (userError) {
                  console.error('Error updating users collection:', userError);
                }
                
                setTwoFactorEnabled(false);
                Alert.alert('Success', 'Two-factor authentication has been disabled');
              } catch (error) {
                console.error('Error disabling 2FA:', error);
                Alert.alert('Error', 'Failed to disable two-factor authentication');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } else {
      // Set up 2FA
      setIsSettingUp2FA(true);
      setStep2FA(1);
      setPhoneNumber('+');
      setVerificationCode('');
      setVerificationError('');
      setConfirm(null);
    }
  };

  const formatPhoneNumber = (number) => {
    // Remove all spaces and dashes
    let cleaned = number.replace(/[\s-]/g, '');
    
    // If the number doesn't start with +, add it
    if (!cleaned.startsWith('+')) {
      // If it starts with a leading 0, try to format as international
    if (cleaned.startsWith('0')) {
        // For Australian numbers, replace 0 with +61
      return '+61' + cleaned.substring(1);
      } else {
        // We need a '+' for Firebase phone auth
        return '+' + cleaned;
      }
    }
    
    return cleaned;
  };

  const validatePhoneNumber = (number) => {
    // Basic international phone validation
    // Must start with + followed by at least 7 digits
    const regex = /^\+\d{7,15}$/;
    return regex.test(number);
  };

  const checkFirestorePermissions = async (userId) => {
    console.log('Checking Firestore permissions for user:', userId);
    
    try {
      // Test if we can read the user_mfa_settings collection
      console.log('Testing read access to user_mfa_settings collection...');
      try {
        const mfaRef = firestore().collection('user_mfa_settings').doc(userId);
        const mfaDoc = await mfaRef.get();
        console.log('Read access to user_mfa_settings:', mfaDoc.exists ? 'Document exists' : 'Document does not exist');
      } catch (e) {
        console.error('Failed to read from user_mfa_settings:', e);
      }
      
      // Test if we can read the users collection
      console.log('Testing read access to users collection...');
      try {
        const userRef = firestore().collection('users').doc(userId);
        const userDoc = await userRef.get();
        console.log('Read access to users:', userDoc.exists ? 'Document exists' : 'Document does not exist');
      } catch (e) {
        console.error('Failed to read from users:', e);
      }
      
      // Test if we can write to a test document
      console.log('Testing write access with test document...');
      try {
        const testRef = firestore().collection('user_mfa_settings').doc(`${userId}_test`);
        await testRef.set({ test: true, timestamp: firestore.FieldValue.serverTimestamp() });
        console.log('Write test successful');
        await testRef.delete();
        console.log('Delete test successful');
      } catch (e) {
        console.error('Failed write test:', e);
      }
      
      return true;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  };

  const sendVerificationCode = async () => {
    setIsLoading(true);
    setVerificationError('');
    
    try {
      // Validate phone number
      if (!phoneNumber || phoneNumber.trim() === '+61') {
        throw new Error('Please enter a valid phone number');
      }
      
      // Format and validate the phone number
      const formattedNumber = formatPhoneNumber(phoneNumber);
      
      if (!validatePhoneNumber(formattedNumber)) {
        throw new Error('Please enter a valid international mobile number (e.g. +14155552671)');
      }
      
      console.log('Sending code to:', formattedNumber);
      
      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 30000)
      );
      
      // Use signInWithPhoneNumber instead of verifyPhoneNumber
      const confirmationResult = await Promise.race([
        auth().signInWithPhoneNumber(formattedNumber, true),
        timeoutPromise
      ]);
      
      if (!confirmationResult) {
        throw new Error('Failed to send verification code');
      }
      
      // Store the confirmation result
      setConfirm(confirmationResult);
      setStep2FA(2);
      Alert.alert('Code Sent', `A verification code has been sent to ${formattedNumber}`);
    } catch (error) {
      console.error('Error sending verification code:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-phone-number') {
        setVerificationError('The phone number is invalid. Please enter a valid international mobile number.');
      } else if (error.code === 'auth/quota-exceeded') {
        setVerificationError('Too many verification attempts. Please try again later.');
      } else if (error.code === 'auth/too-many-requests') {
        setVerificationError('Too many requests. Please try again later.');
      } else {
        setVerificationError(error.message || 'Failed to send verification code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPhoneNumber = async () => {
    setIsLoading(true);
    setVerificationError('');
    
    try {
      // Validate code
      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }
      
      // Check if confirmation exists
      if (!confirm) {
        throw new Error('Verification session expired. Please request a new code.');
      }
      
      // Get current user and verify authentication state
      const user = auth().currentUser;
      if (!user) {
        throw new Error('You must be logged in');
      }
      
      // Force token refresh to ensure we have the latest authentication state
      await auth().currentUser.getIdToken(true);
      console.log('Authentication token refreshed');
      
      // Set a timeout for the verification
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Verification timed out. Please try again.')), 30000)
      );
      
      // Confirm the code
      await Promise.race([
        confirm.confirm(verificationCode),
        timeoutPromise
      ]);
      
      // Format phone number for storage
      const formattedNumber = formatPhoneNumber(phoneNumber);
      
      // Make sure user documents exist before updating them
      try {
        console.log('Beginning Firestore updates...');
        
        // First check if user_mfa_settings document exists, create it if not
        const mfaDoc = await firestore().collection('user_mfa_settings').doc(user.uid).get();
        
        if (!mfaDoc.exists) {
          console.log('Creating new user_mfa_settings document');
          await firestore().collection('user_mfa_settings').doc(user.uid).set({
            email: user.email || '',
            createdAt: firestore.FieldValue.serverTimestamp()
          });
        }
        
        // Then update the user_mfa_settings document
        console.log('Updating user_mfa_settings document');
        await firestore().collection('user_mfa_settings').doc(user.uid).update({
          mfaEnabled: true,
          preferredMethod: 'phone',
        phoneNumber: formattedNumber,
          updatedAt: firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Successfully updated user_mfa_settings collection');
        
        // Now check if users document exists
        const userDoc = await firestore().collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
          console.log('Creating new users document');
          await firestore().collection('users').doc(user.uid).set({
            email: user.email || '',
            displayName: user.displayName || '',
            createdAt: firestore.FieldValue.serverTimestamp()
          });
        }
        
        // Then update the users document
        console.log('Updating users document');
        await firestore().collection('users').doc(user.uid).update({
          phoneNumber: formattedNumber,
          'securitySettings.twoFactorEnabled': true,
          'securitySettings.twoFactorMethod': 'phone',
          'securitySettings.twoFactorPhone': formattedNumber,
          'securitySettings.enabledAt': firestore.FieldValue.serverTimestamp()
        });
        
        console.log('Successfully updated users collection');
      } catch (error) {
        console.error('Error updating Firestore:', error);
        // Try with set() and merge as a last resort
        try {
          console.log('Trying with merge operation as fallback...');
          await firestore().collection('user_mfa_settings').doc(user.uid).set({
            mfaEnabled: true,
            preferredMethod: 'phone',
            phoneNumber: formattedNumber,
            updatedAt: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
          
          console.log('Fallback 1 successful');
        } catch (e) {
          console.error('Final fallback error:', e);
        }
      }
      
      // Success
      setTwoFactorEnabled(true);
      setIsSettingUp2FA(false);
      Alert.alert('Success', 'Two-factor authentication has been enabled');
    } catch (error) {
      console.error('Error verifying code:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/invalid-verification-code') {
        setVerificationError('The verification code is invalid. Please try again.');
      } else if (error.code === 'auth/code-expired') {
        setVerificationError('The verification code has expired. Please request a new code.');
      } else if (error.code === 'firestore/permission-denied') {
        console.error('Firestore permission denied:', error);
        
        // Run permission diagnostic
        await checkFirestorePermissions(user.uid);
        
        // Show more informative error
        setVerificationError('Permission denied. We are diagnosing the issue.');
        Alert.alert(
          'Permission Error',
          'There was a permissions error when updating your security settings. We have logged diagnostic information that will help resolve this issue. Please try again in a few minutes or contact support if the problem persists.'
        );
      } else {
        setVerificationError(error.message || 'Failed to verify code');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const completeSetup = async () => {
    // [Function code unchanged]
  };

  const dismissPasswordModal = () => {
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const dismiss2FAModal = () => {
    setIsSettingUp2FA(false);
    setPhoneNumber('+');
    setVerificationCode('');
    setVerificationError('');
    setStep2FA(1);
  };

  // Render password change dialog
  const renderPasswordModal = () => {
    return (
        <Modal
          visible={isChangingPassword}
          transparent={true}
          animationType="slide"
        onRequestClose={dismissPasswordModal}
        >
          <KeyboardAvoidingView 
            style={styles.modalContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
              
              {passwordError ? (
              <View style={styles.errorContainer}>
                <Feather name="alert-circle" size={18} color="#FF5252" />
                <Text style={styles.errorText}>{passwordError}</Text>
              </View>
              ) : null}
              
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { 
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: colors.text,
                }]}
                placeholder="Current Password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
            </View>
              
            <View style={styles.inputContainer}>
              <Feather name="key" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { 
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: colors.text,
                }]}
                placeholder="New Password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>
              
            <View style={styles.inputContainer}>
              <Feather name="check-circle" size={20} color={colors.primary} style={styles.inputIcon} />
              <TextInput 
                style={[styles.input, { 
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  color: colors.text,
                }]}
                placeholder="Confirm New Password"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </View>
              
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={dismissPasswordModal}
                  disabled={isLoading}
                >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, styles.modalSubmitButton, { backgroundColor: colors.primary }]}
                  onPress={submitPasswordChange}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                  <Text style={styles.modalSubmitButtonText}>Update</Text>
                  )}
                </TouchableOpacity>
          </View>
        </View>
          </KeyboardAvoidingView>
        </Modal>
    );
  };

  // Render 2FA setup dialog
  const render2FAModal = () => {
    if (!isSettingUp2FA) return null;
    
    return (
        <Modal
          visible={isSettingUp2FA}
          transparent={true}
        animationType="fade"
        onRequestClose={dismiss2FAModal}
        >
          <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {step2FA === 1 ? 'Set Up Two-Factor Authentication' : 'Verify Phone Number'}
              </Text>
              <TouchableOpacity onPress={dismiss2FAModal}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
              
              {step2FA === 1 ? (
              // Step 1: Enter phone number
                <>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Enter your phone number to receive verification codes
                  </Text>
                  
                  <TextInput 
                  style={[
                    styles.modalInput, 
                    { 
                      backgroundColor: isDarkMode ? '#1F2937' : '#F5F7FA',
                      color: colors.text,
                      borderColor: verificationError ? COLORS.danger : colors.border
                    }
                  ]}
                  placeholder="Phone Number (e.g. +14155552671)"
                    placeholderTextColor={colors.textSecondary}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  autoCapitalize="none"
                  />
                
                {verificationError ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={16} color={COLORS.danger} />
                    <Text style={styles.errorText}>{verificationError}</Text>
                  </View>
                ) : null}
                  
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalCancelButton, { borderColor: colors.border }]}
                    onPress={dismiss2FAModal}
                      disabled={isLoading}
                    >
                    <Text style={[styles.modalButtonText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalSubmitButton, { backgroundColor: colors.primary }]}
                      onPress={sendVerificationCode}
                    disabled={isLoading || !phoneNumber || phoneNumber.length < 7}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                      <Text style={styles.modalSubmitButtonText}>Send Code</Text>
                      )}
                    </TouchableOpacity>
                </View>
                </>
              ) : (
              // Step 2: Enter verification code
                <>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    Enter the 6-digit verification code sent to {phoneNumber}
                  </Text>
                  
                  <TextInput 
                  style={[
                    styles.modalInput, 
                    { 
                      backgroundColor: isDarkMode ? '#1F2937' : '#F5F7FA',
                      color: colors.text,
                      borderColor: verificationError ? COLORS.danger : colors.border,
                      letterSpacing: 8,
                      textAlign: 'center',
                      fontSize: 18
                    }
                  ]}
                  placeholder="------"
                    placeholderTextColor={colors.textSecondary}
                    value={verificationCode}
                  onChangeText={(text) => {
                    // Only allow digits and max 6 characters
                    if (/^\d*$/.test(text) && text.length <= 6) {
                      setVerificationCode(text);
                    }
                  }}
                    keyboardType="number-pad"
                    maxLength={6}
                />
                
                {verificationError ? (
                  <View style={styles.errorContainer}>
                    <MaterialIcons name="error-outline" size={16} color={COLORS.danger} />
                    <Text style={styles.errorText}>{verificationError}</Text>
                  </View>
                ) : null}
                  
                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalCancelButton, { borderColor: colors.border }]}
                    onPress={() => setStep2FA(1)}
                      disabled={isLoading}
                    >
                    <Text style={[styles.modalButtonText, { color: colors.text }]}>Back</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.modalButton, styles.modalSubmitButton, { backgroundColor: colors.primary }]}
                      onPress={verifyPhoneNumber}
                    disabled={isLoading || verificationCode.length !== 6}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                      <Text style={styles.modalSubmitButtonText}>Verify</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
                )}
              </View>
          </KeyboardAvoidingView>
        </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Gradient Header */}
      <LinearGradient
        colors={['#5E60CE', '#6930C3', '#7400B8']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <BackButton 
            onPress={() => navigation.goBack()} 
            inGradientHeader={true} 
          />
          
          <Text style={styles.headerTitle}>Security</Text>
          
          <View style={{ width: 32 }}>
            {/* Empty view for even spacing */}
        </View>
        </View>
      </LinearGradient>
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { backgroundColor: colors.background }]}
      >
        {/* Security Score Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security Status</Text>
          
          <View style={styles.securityScoreContainer}>
            <View style={styles.scoreCircleContainer}>
              <LinearGradient
                colors={[getScoreColor(), getScoreColor() + '80']}
                style={styles.scoreCircleOuter}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
              >
                <View style={[styles.scoreCircle, { borderColor: getScoreColor() + '30' }]}>
                  <Text style={styles.scoreText}>{securityScore}%</Text>
                </View>
              </LinearGradient>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                Your Score
              </Text>
            </View>
            
            <View style={styles.securityRecommendations}>
              <Text style={[styles.securityStatus, { color: colors.text }]}>
                {securityScore >= 80 ? 'Good Security' : 
                 securityScore >= 60 ? 'Fair Security' : 'Improve Security'}
              </Text>
              
              {!twoFactorEnabled && (
                <View style={styles.recommendationItem}>
                  <MaterialIcons name="error-outline" size={16} color="#FFC107" />
                  <Text style={[styles.recommendationText, { color: colors.textSecondary, marginLeft: 6 }]}>
                    Enable two-factor authentication
                  </Text>
                </View>
              )}
              
              <View style={styles.recommendationItem}>
                <MaterialIcons 
                  name={securityScore >= 70 ? "check-circle" : "error-outline"} 
                  size={16} 
                  color={securityScore >= 70 ? "#4CAF50" : "#FFC107"} 
                />
                <Text style={[styles.recommendationText, { color: colors.textSecondary, marginLeft: 6 }]}>
                  Use a strong password
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Security Settings Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Security Settings</Text>
          
                    <TouchableOpacity 
            style={styles.settingRow}
            onPress={handleChangePassword}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <LinearGradient
                colors={['#4CAF50', '#009688']}
                style={styles.iconContainerGradient}
              >
                <Feather name="lock" size={22} color="#FFF" />
              </LinearGradient>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Change Password</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Update your account password
                </Text>
              </View>
            </View>
            <View style={[styles.arrowContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Feather name="chevron-right" size={22} color={colors.textSecondary} />
            </View>
                    </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    <TouchableOpacity 
            style={styles.settingRow}
            onPress={toggleTwoFactor}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <LinearGradient
                colors={['#673AB7', '#3F51B5']}
                style={styles.iconContainerGradient}
                    >
                <MaterialCommunityIcons name="two-factor-authentication" size={22} color="#FFF" />
              </LinearGradient>
              <View style={styles.settingInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Two-Factor Authentication
                  </Text>
                  {twoFactorEnabled && (
                    <View style={styles.securityBadge}>
                      <Text style={styles.securityBadgeText}>ON</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  {twoFactorEnabled 
                    ? 'Added security is enabled' 
                    : 'Add extra security to your account'}
                  </Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={toggleTwoFactor}
              trackColor={{ false: '#D1D5DB', true: colors.primary + '70' }}
              thumbColor={twoFactorEnabled ? colors.primary : '#F9FAFB'}
              ios_backgroundColor="#D1D5DB"
            />
          </TouchableOpacity>
        </View>
        
        {/* Devices Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Devices</Text>
          
          <View style={styles.deviceInfoContainer}>
            <LinearGradient
              colors={['#5E60CE', '#7400B8']}
              style={styles.deviceIconContainer}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <Feather 
                name={Platform.OS === 'ios' ? 'smartphone' : 'tablet'} 
                size={30} 
                color="#FFFFFF" 
              />
            </LinearGradient>
            
            <View style={styles.deviceDetails}>
              <Text style={[styles.deviceName, { color: colors.text }]}>
                {currentDevice.name}
                    </Text>
              <View style={styles.deviceMetadata}>
                <View style={styles.deviceStatusBadge}>
                  <Feather name="check-circle" size={12} color="#FFFFFF" />
                  <Text style={styles.deviceStatusText}>Active</Text>
                </View>
                <Text style={[styles.devicePlatform, {color: colors.textSecondary}]}>
                  {Platform.OS} {Platform.Version}
                </Text>
              </View>
              <Text style={[styles.deviceLastActive, { color: colors.textSecondary }]}>
                Last activity: Just now
              </Text>
            </View>
          </View>
          
                    <TouchableOpacity 
            style={styles.logoutAllButton}
            onPress={() => {
              Alert.alert(
                'Sign Out Everywhere',
                'Are you sure you want to sign out from all devices?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Sign Out', 
                    style: 'destructive',
                    onPress: async () => {
                      setIsLoading(true);
                      try {
                        // Implement sign out
                        await auth().signOut();
                      } catch (error) {
                        console.error('Error signing out:', error);
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }
                ]
              );
            }}
                    >
            <LinearGradient
              colors={['#5E60CE50', '#7400B850']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.logoutButtonGradient}
            >
              <Feather name="log-out" size={18} color={colors.primary} />
              <Text style={[styles.logoutAllText, { color: colors.primary }]}>
                Sign Out of All Devices
              </Text>
            </LinearGradient>
                    </TouchableOpacity>
                  </View>
      </ScrollView>
      
      {/* Render modals */}
      {renderPasswordModal()}
      {render2FAModal()}
      
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
              </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    ...ELEVATION_STYLES.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recommendationText: {
    fontSize: 14,
  },
  // Security Score Styles
  securityScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  scoreCircleOuter: {
    padding: 5,
    borderRadius: 35,
    marginBottom: 5,
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  securityRecommendations: {
    flex: 1,
    justifyContent: 'center',
  },
  securityStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  // Setting Styles
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainerGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  securityBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  securityBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Device Section Styles
  deviceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  deviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  deviceMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  deviceStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 10,
  },
  deviceStatusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  devicePlatform: {
    fontSize: 13,
  },
  deviceLastActive: {
    fontSize: 12,
  },
  logoutAllButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  logoutAllText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    ...ELEVATION_STYLES.medium,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF5252',
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  input: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 44,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalCancelButton: {
    borderWidth: 1,
  },
  modalSubmitButton: {},
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    ...ELEVATION_STYLES.level3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 16,
  },
  modalInput: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    marginLeft: 8,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelButton: {
    marginRight: 10,
    borderWidth: 1,
  },
  modalSubmitButton: {
    marginLeft: 10,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SecurityScreen; 