import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../constants';
import { logoutUser, getCurrentUser, storage, firestore } from '../services/firebase';
import { uploadProfilePicture, getProfilePictureUrl, getCachedProfileImage } from '../services/firebaseStorage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import BackButton from '../components/BackButton';
import * as ImagePicker from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';

// Import default profile image
const DEFAULT_PROFILE_IMAGE = require('../assets/images/default-profile.png');

// Profile screen component
const ProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    photoURL: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Theme context
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const colors = getThemeColors(theme);

  useEffect(() => {
    // Get current user data from Firebase
    loadUserProfile();
    
    // Also try to refresh the profile image from storage
    refreshProfileImage();
  }, []);
  
  // Add a function to specifically handle profile image refresh
  const refreshProfileImage = async () => {
    try {
      const user = getCurrentUser();
      if (!user) return;

      console.log('Attempting to refresh profile image');
      
      // First check if user already has a photoURL in their profile
      if (user.photoURL) {
        console.log('User has photoURL in profile:', user.photoURL);
        // Set it temporarily while we check for newer versions
        setUserData(prevData => ({
          ...prevData,
          photoURL: user.photoURL
        }));
      }
      
      // Use the getProfilePictureUrl utility with AsyncStorage priority
      const freshImageUrl = await getProfilePictureUrl();
      
      if (freshImageUrl) {
        console.log('Found fresh profile image URL:', freshImageUrl);
        // Only update if the URL is different from current
        if (freshImageUrl !== userData.photoURL) {
          setUserData(prevData => ({
            ...prevData,
            photoURL: freshImageUrl
          }));
          
          // If the user's auth profile is out of sync, update it
          if (user.photoURL !== freshImageUrl) {
            try {
              await user.updateProfile({
                photoURL: freshImageUrl
              });
              console.log('Updated user auth profile with fresh image URL');
            } catch (updateError) {
              console.log('Non-critical: Failed to update auth profile:', updateError);
            }
          }
        }
      } else {
        // If we couldn't get a fresh URL but have a user profile URL
        if (user.photoURL) {
          console.log('Using existing user profile URL as no fresh image found');
        } else {
          console.log('No profile image found, using default');
          // Clear photoURL to use default image
          setUserData(prevData => ({
            ...prevData,
            photoURL: ''
          }));
        }
      }
    } catch (error) {
      console.log('Error refreshing profile image:', error);
      // Non-fatal error - user can still use the app
    }
  };

  const loadUserProfile = () => {
    const user = getCurrentUser();
    if (user) {
      // Start with default values
      const profileData = {
        name: user.displayName || 'User',
        email: user.email || '',
        photoURL: '',
      };
      
      // If user has a photo URL, validate it
      if (user.photoURL) {
        try {
          // Only accept valid URLs that start with http/https or file:// 
          if (
            (user.photoURL.startsWith('http://') || 
             user.photoURL.startsWith('https://') ||
             user.photoURL.startsWith('file://'))
          ) {
            // For Firebase Storage URLs, we'll validate it exists later via the Image component
            // This just sets it in state, and the onError handler will catch any issues
            profileData.photoURL = user.photoURL;
            console.log('Using profile image URL:', user.photoURL);
          } else {
            console.log('Invalid URL format, not using:', user.photoURL);
          }
        } catch (error) {
          console.log('Error processing profile image URL:', error);
          // Keep photoURL empty to use default
        }
      } else {
        console.log('User has no profile image URL');
      }
      
      setUserData(profileData);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            setIsLoading(true);
            try {
              await logoutUser();
              // The auth state change listener in AppNavigator will handle navigation
            } catch (error) {
              console.error('Error signing out: ', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Add this function before handleProfilePictureUpload
  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    
    try {
      let result;
      
      if (parseInt(Platform.Version.toString(), 10) >= 33) {
        // Android 13+
        result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          {
            title: "Photo Access Permission",
            message: "HealthTracker needs access to your photos to update your profile picture",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
          }
        );
      } else {
        // Earlier Android versions
        const results = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        ], {
            title: "Storage Access Permission",
            message: "HealthTracker needs access to your storage to update your profile picture",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK"
        });
        
        result = (
          results[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
          results[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED
        ) ? PermissionsAndroid.RESULTS.GRANTED : PermissionsAndroid.RESULTS.DENIED;
      }
      
      console.log('Permission request result:', result);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error('Error requesting permission:', err);
      return false;
    }
  };

  const handleProfilePictureUpload = async () => {
    try {
      // Request permissions first
      if (Platform.OS === 'android') {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          Alert.alert(
            'Permission Required',
            'Storage access is needed to select a profile picture',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      // Simple options - less is more
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        quality: 0.8, // Reduce quality slightly to improve upload speed
        maxWidth: 800, // Limit size for better performance
        maxHeight: 800,
      };

      console.log('Opening image picker...');
      
      const response = await ImagePicker.launchImageLibrary(options);
      
      console.log('Image picker response received');
      
      // Handle cancellation
      if (response.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      
      // Handle errors
      if (response.errorCode) {
        console.error('Image picker error:', response.errorCode, response.errorMessage);
        throw new Error(`Image picker error: ${response.errorMessage}`);
      }
      
      // Process the selected image
      if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0];
        
        if (selectedImage.uri) {
          console.log('Selected image URI:', selectedImage.uri);
          console.log('Image size:', selectedImage.fileSize, 'bytes, Type:', selectedImage.type);
          
          // Validate URI format
          const validUriPrefix = selectedImage.uri.startsWith('file://') || 
                                selectedImage.uri.startsWith('content://') ||
                                selectedImage.uri.startsWith('http://') ||
                                selectedImage.uri.startsWith('https://');
                                
          if (!validUriPrefix) {
            console.log('Adding file:// prefix to URI');
            selectedImage.uri = 'file://' + selectedImage.uri;
          }
          
          // Start upload process
          setIsUploadingImage(true);
          
          // Get current user
          const user = getCurrentUser();
          if (!user) {
            throw new Error('User not logged in');
          }
          
          try {
            // Use the enhanced uploadProfilePicture function
            const photoURL = await uploadProfilePicture(selectedImage.uri);
            
            console.log('Profile image updated with URL:', photoURL);
          
            // Update local state
            setUserData(prevData => ({
              ...prevData,
              photoURL: photoURL
            }));
          
            // Explicitly save to AsyncStorage for immediate access across the app
            try {
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.setItem(`profileImage_${user.uid}`, photoURL);
              console.log('Profile image URL saved to AsyncStorage');
            } catch (storageError) {
              console.log('Non-critical: Failed to save profile image to AsyncStorage:', storageError);
            }
          
          // Show success message
          Alert.alert('Success', 'Profile picture updated successfully');
          } catch (error) {
            console.error('Profile update error:', error);
            throw error;
          }
        } else {
          throw new Error('Selected image has no URI');
        }
      } else {
        throw new Error('No image selected');
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile picture');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const navigateToHealthDetails = () => {
    navigation.navigate('HealthDetails');
  };

  const navigateToEmergencyContacts = () => {
    navigation.navigate('EmergencyContacts');
  };

  const navigateToProfileAccount = () => {
    navigation.navigate('ProfileAccount');
  };

  // Function to render the profile image
  const renderProfileImage = () => {
    return (
      <View style={styles.profileImageContainer}>
        {isUploadingImage ? (
          <View style={[styles.profileImage, styles.loadingContainer]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Uploading...</Text>
          </View>
        ) : userData.photoURL ? (
          <Image 
            source={{ uri: userData.photoURL }} 
            style={styles.profileImage}
            defaultSource={DEFAULT_PROFILE_IMAGE}
            onError={(e) => {
              console.log('Profile image load error:', e.nativeEvent.error);
              console.log('Falling back to default profile image');
              // Update state to use default image
              setUserData(prevData => ({...prevData, photoURL: ''}));
              
              // Try to refresh from AsyncStorage if the network load failed
              if (getCurrentUser()) {
                getCachedProfileImage(getCurrentUser().uid)
                  .then(cachedImage => {
                    if (cachedImage) {
                      console.log('Found cached image, using as fallback');
                      setUserData(prevData => ({...prevData, photoURL: cachedImage}));
                    }
                  })
                  .catch(err => console.log('Failed to get cached image:', err));
              }
            }}
          />
        ) : (
          <Image 
            source={DEFAULT_PROFILE_IMAGE} 
            style={styles.profileImage} 
          />
        )}
        <TouchableOpacity 
          style={[styles.editImageButton, { backgroundColor: colors.primary }]}
          onPress={handleProfilePictureUpload}
          disabled={isUploadingImage}
        >
          <Feather name="camera" size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  // Check if this screen is being used as ProfileAccount
  const isProfileAccount = route.name === 'ProfileAccount';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent"
        translucent 
      />
      
      {/* Gradient Header */}
      <LinearGradient
        colors={['#5E60CE', '#6930C3', '#7400B8']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          {isProfileAccount ? (
            <BackButton onPress={() => navigation.goBack()} inGradientHeader={true} />
          ) : (
            <View style={{ width: 36 }} />
          )}
          <Text style={styles.headerTitle}>
            {isProfileAccount ? 'Profile & Account' : 'Profile'}
          </Text>
          {!isProfileAccount ? (
            <TouchableOpacity style={styles.profileButton} onPress={navigateToProfileAccount}>
              {userData.photoURL ? (
                <Image 
                  source={{ uri: userData.photoURL }} 
                  style={[styles.headerProfileImage, { borderColor: 'rgba(255, 255, 255, 0.3)' }]}
                  defaultSource={DEFAULT_PROFILE_IMAGE}
                  onError={(e) => {
                    console.log('Header profile image load error:', e.nativeEvent.error);
                    // Update state to use default image
                    setUserData(prevData => ({...prevData, photoURL: ''}));
                    
                    // Try to refresh from AsyncStorage if the network load failed
                    if (getCurrentUser()) {
                      getCachedProfileImage(getCurrentUser().uid)
                        .then(cachedImage => {
                          if (cachedImage) {
                            console.log('Found cached header image, using as fallback');
                            setUserData(prevData => ({...prevData, photoURL: cachedImage}));
                          }
                        })
                        .catch(err => console.log('Failed to get cached image for header:', err));
                    }
                  }}
                />
              ) : (
                <Image 
                  source={DEFAULT_PROFILE_IMAGE} 
                  style={[styles.headerProfileImage, { borderColor: 'rgba(255, 255, 255, 0.3)' }]} 
                />
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </LinearGradient>
        
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileHeader}>
            {renderProfileImage()}
            <Text style={[styles.profileName, { color: colors.text }]}>{userData.name}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userData.email}</Text>
          </View>
          
          <View style={[styles.menuContainer, { backgroundColor: colors.surface, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
            {/* Health Details */}
            <TouchableOpacity style={styles.menuItem} onPress={navigateToHealthDetails}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#293462' : '#E8F4F8' }]}>
                  <Ionicons name="heart" size={24} color={colors.primary} />
            </View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Health Details</Text>
          </View>
              <Feather name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            {/* Emergency Contacts */}
            <TouchableOpacity style={styles.menuItem} onPress={navigateToEmergencyContacts}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#293462' : '#F5E8FA' }]}>
                  <Feather name="phone" size={24} color={colors.primary} />
                </View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Emergency Contacts</Text>
              </View>
              <Feather name="chevron-right" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            {/* Log Out */}
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#3A2840' : '#FFEBEE' }]}>
                  <Feather name="log-out" size={24} color={isDarkMode ? '#FF7582' : '#FF5252'} />
            </View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Log Out</Text>
            </View>
              <Feather name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 15,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  profileButton: {
    padding: 4,
  },
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#7B68EE',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
  },
  menuContainer: {
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 8,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeState: {
    fontSize: 14,
    marginRight: 8,
  },
});

export default ProfileScreen; 