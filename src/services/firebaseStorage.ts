import storage from '@react-native-firebase/storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Constants for AsyncStorage keys
const PROFILE_IMAGE_CACHE_KEY = 'profileImage_';

/**
 * Save profile image data to AsyncStorage
 * @param userId - User ID
 * @param imageData - Data to save (URL or base64)
 */
export const cacheProfileImage = async (userId, imageData) => {
  try {
    console.log('Caching profile image for user:', userId);
    await AsyncStorage.setItem(`${PROFILE_IMAGE_CACHE_KEY}${userId}`, imageData);
    return true;
  } catch (error) {
    console.log('Error caching profile image:', error);
    return false;
  }
};

/**
 * Get cached profile image from AsyncStorage
 * @param userId - User ID
 * @returns The cached image URL or null
 */
export const getCachedProfileImage = async (userId) => {
  try {
    const cachedImage = await AsyncStorage.getItem(`${PROFILE_IMAGE_CACHE_KEY}${userId}`);
    return cachedImage;
  } catch (error) {
    console.log('Error getting cached profile image:', error);
    return null;
  }
};

/**
 * Uploads a profile picture to Firebase Storage and updates the user profile
 * @param {string} uri - Local URI of the image to upload
 * @returns {Promise<string>} The download URL of the uploaded image
 */
export const uploadProfilePicture = async (uri) => {
  try {
    // Validate parameters
    if (!uri) {
      throw new Error('Image URI is required');
    }
    
    const user = auth().currentUser;
    if (!user) {
      throw new Error('User must be logged in to upload profile picture');
    }
    
    console.log('Starting profile picture upload for user:', user.uid);
    
    // Save to AsyncStorage immediately for fallback
    await cacheProfileImage(user.uid, uri);
    console.log('Profile image cached locally');
    
    try {
      // Simplify the approach - create a reference and try to upload directly
      // Firebase Storage should create necessary directories
      const timestamp = new Date().getTime();
      const filename = `profile_${user.uid}_${timestamp}.jpg`;
      const storageRef = storage().ref(`profilePictures/${user.uid}/${filename}`);
      
      // Make sure the file URI is properly formatted
      let fileUri = uri;
      
      // For Android, if URI doesn't have a proper prefix, add 'file://'
      if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
        fileUri = 'file://' + uri;
        console.log('Modified file URI for Android:', fileUri);
      }
      
      // Upload directly without extra checks
      console.log('Uploading image from URI:', fileUri);
      const task = storageRef.putFile(fileUri);
    
    // Monitor upload progress (optional)
    task.on('state_changed', 
      (taskSnapshot) => {
        const percentage = (taskSnapshot.bytesTransferred / taskSnapshot.totalBytes) * 100;
        console.log(`Upload is ${percentage}% complete`);
      },
      (error) => {
        console.error('Upload error:', error);
        throw error;
      }
    );
    
    // Wait for upload to complete
    await task;
    
    // Get the download URL
    const downloadURL = await storageRef.getDownloadURL();
    console.log('Upload successful, download URL:', downloadURL);
      
      // Also cache the download URL
      await cacheProfileImage(user.uid, downloadURL);
    
    // Update user profile with the new photo URL
    await user.updateProfile({
      photoURL: downloadURL
    });
    
      // Also update in Firestore to ensure consistency
    await firestore()
      .collection('users')
      .doc(user.uid)
      .set({
        photoURL: downloadURL,
        lastUpdated: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    
    return downloadURL;
    } catch (storageError) {
      console.log('Firebase Storage error:', storageError);
      
      // Log specific error details
      if (storageError.code) {
        console.log('Error code:', storageError.code);
      }
      
      console.log('Using locally cached image as fallback');
      
      // If Firebase Storage fails, use the locally cached version
      return uri; // Return the local URI as fallback
    }
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Gets the profile picture URL for a user
 * @param {string} userId - User ID (optional, defaults to current user)
 * @returns {Promise<string>} The download URL of the profile picture or null
 */
export const getProfilePictureUrl = async (userId = null) => {
  try {
    // If userId not provided, use current user
    if (!userId) {
      const currentUser = auth().currentUser;
      if (!currentUser) return null;
      userId = currentUser.uid;
    }
    
    console.log(`Attempting to get profile picture for user ${userId}`);
    
    // First check AsyncStorage cache for the fastest response
    const cachedImage = await getCachedProfileImage(userId);
    if (cachedImage) {
      console.log('Found cached profile image');
      
      // Validate the cached URL
      if (cachedImage.startsWith('http://') || 
          cachedImage.startsWith('https://') || 
          cachedImage.startsWith('file://') ||
          cachedImage.startsWith('content://')) {
        return cachedImage;
      } else {
        console.log('Cached image URL format is invalid, continuing search');
      }
    }
    
    // Next, try to check Firestore for the most up-to-date URL
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      if (userDoc.exists && userDoc.data()?.photoURL) {
        console.log('Found profile image URL in Firestore');
        
        // Validate the URL before returning
        const photoURL = userDoc.data().photoURL;
        if (photoURL.startsWith('https://') || photoURL.startsWith('http://')) {
          // For Firebase Storage URLs, verify the image exists
          if (photoURL.includes('firebasestorage.googleapis.com')) {
            try {
              // Test if the image is accessible
              await storage().refFromURL(photoURL).getMetadata();
              console.log('Verified Firebase Storage image exists');
              
              // Cache this URL for future use
              await cacheProfileImage(userId, photoURL);
              
              return photoURL;
            } catch (storageError) {
              console.log('Firebase Storage image not accessible:', storageError.message);
              // Continue to try alternative methods
            }
          } else {
            // For external URLs, just return as is
            // Also cache this for future use
            await cacheProfileImage(userId, photoURL);
            return photoURL;
          }
        } else {
          console.log('URL format is invalid:', photoURL);
        }
      }
    } catch (firestoreError) {
      console.log('Error getting profile URL from Firestore:', firestoreError.message);
      // Continue to try Firebase Storage
    }
    
    // If not found in Firestore or URL was invalid, try to get from storage
    // First try with the new filename pattern that includes timestamp
    try {
      const storageDir = storage().ref(`profilePictures/${userId}`);
      const files = await storageDir.listAll();
      
      // If we have files, get the most recent one (should be named with the latest timestamp)
      if (files.items.length > 0) {
        console.log(`Found ${files.items.length} profile images in storage`);
        
        // Sort by name to get the most recent one if multiple exist
        // (Assuming names include timestamps that can be sorted)
        const sortedFiles = files.items.sort((a, b) => {
          // Extract timestamp from filename if possible or default to name comparison
          const aName = a.name;
          const bName = b.name;
          return bName.localeCompare(aName); // Descending order
        });
        
        // Get the URL of the most recent file
        try {
          const downloadURL = await sortedFiles[0].getDownloadURL();
          console.log('Found profile image in storage:', sortedFiles[0].name);
          
          // Cache this URL for future use
          await cacheProfileImage(userId, downloadURL);
          
          return downloadURL;
        } catch (urlError) {
          console.log('Error getting download URL:', urlError.message);
          // Try next file if available
          if (files.items.length > 1) {
            try {
              const fallbackURL = await sortedFiles[1].getDownloadURL();
              console.log('Using fallback profile image:', sortedFiles[1].name);
              
              // Cache this URL for future use
              await cacheProfileImage(userId, fallbackURL);
              
              return fallbackURL;
            } catch (fallbackError) {
              console.log('Fallback image also failed:', fallbackError.message);
            }
          }
        }
      } else {
        console.log('No profile images found in storage directory');
      }
    } catch (listError) {
      console.log('Error listing profile pictures:', listError.message);
      // Continue to legacy approach
    }
    
    // Try legacy approach with specific filename pattern
    try {
      const specificStorageRef = storage().ref(`profilePictures/${userId}/profile_${userId}.jpg`);
      const legacyUrl = await specificStorageRef.getDownloadURL();
      
      // Cache this URL for future use
      await cacheProfileImage(userId, legacyUrl);
      
      return legacyUrl;
    } catch (error) {
      console.log('Profile picture not found with specific name pattern:', error.message);
      return null;
    }
  } catch (error) {
    console.error('Error getting profile picture URL:', error.message || error);
    return null;
  }
}; 