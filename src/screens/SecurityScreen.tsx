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
  
  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Status states
  const [passwordError, setPasswordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    console.log('SecurityScreen: Initializing');
    
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
    setPasswordError('');
    
    try {
      const user = auth().currentUser;
      
      // Reauthenticate user before changing password
      const credential = auth.EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      
      await user.reauthenticateWithCredential(credential);
      
      // Change password
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
      } else {
        setPasswordError('Failed to change password: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const checkFirestorePermissions = async (userId) => {
    try {
      // Try to read a dummy doc to see if permissions are working
      const testRead = await firestore().collection('permission_test').doc(userId).get();
      console.log('Read permission test result:', testRead.exists);
      
      // Try to write a dummy doc to see if permissions are working
      await firestore().collection('permission_test').doc(userId).set({
        test: 'value',
        timestamp: firestore.FieldValue.serverTimestamp()
      });
      console.log('Write permission test succeeded');
      
      return { read: true, write: true };
    } catch (error) {
      console.error('Permission test error:', error);
      return { read: false, write: false, error: error.message };
    }
  };

  const dismissPasswordModal = () => {
    setIsChangingPassword(false);
    setPasswordError('');
  };

  const renderPasswordModal = () => {
    if (!isChangingPassword) return null;
    
    return (
      <Modal
        visible={isChangingPassword}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissPasswordModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
              <TouchableOpacity onPress={dismissPasswordModal}>
                <MaterialIcons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Current Password</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                  />
                  <Feather name="lock" size={20} color={colors.textSecondary} />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Enter new password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                  />
                  <Feather name="lock" size={20} color={colors.textSecondary} />
                </View>
              </View>
              
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm New Password</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
                  />
                  <Feather name="lock" size={20} color={colors.textSecondary} />
                </View>
              </View>
              
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
              
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={submitPasswordChange}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent 
      />
      
      {/* Header with gradient */}
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
            <Text style={styles.logoutAllText}>Sign Out From All Devices</Text>
          </TouchableOpacity>
        </View>
        
        {/* Data & Privacy Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data & Privacy</Text>
          
          <TouchableOpacity 
            style={styles.settingRow}
            onPress={() => {
              navigation.navigate('PrivacyPolicy');
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <LinearGradient
                colors={['#2196F3', '#03A9F4']}
                style={styles.iconContainerGradient}
              >
                <Feather name="shield" size={22} color="#FFF" />
              </LinearGradient>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Privacy Policy</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  View our data handling policies
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
            onPress={() => {
              Alert.alert(
                'Delete Account',
                'Are you sure you want to delete your account? This action cannot be undone and all your data will be lost.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => {
                      // In a real app, you'd implement account deletion logic here
                      Alert.alert('Account Deletion', 'This feature is not implemented in the demo app.');
                    }
                  }
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <LinearGradient
                colors={['#F44336', '#E53935']}
                style={styles.iconContainerGradient}
              >
                <Feather name="user-x" size={22} color="#FFF" />
              </LinearGradient>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Delete Account</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Permanently delete your account and data
                </Text>
              </View>
            </View>
            <View style={[styles.arrowContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
              <Feather name="chevron-right" size={22} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionInfo}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Version 1.0.0 (100)
          </Text>
        </View>
      </ScrollView>
      
      {/* Modals */}
      {renderPasswordModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalBody: {
    // Add any additional styles for the modal body
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    color: '#FF5252',
    marginTop: 8,
  },
  submitButton: {
    marginTop: 24,
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  versionInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
  },
});

export default SecurityScreen; 