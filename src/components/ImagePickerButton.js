import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  View,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const ImagePickerButton = ({ onImageSelected }) => {
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    
    try {
      if (parseInt(Platform.Version, 10) >= 33) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.CAMERA
        ]);
        
        return (
          granted['android.permission.READ_MEDIA_IMAGES'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.CAMERA
        ]);
        
        return (
          granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
        );
      }
    } catch (err) {
      console.error('Permission request error:', err);
      return false;
    }
  };

  const handleSelectImage = async () => {
    try {
      setIsLoading(true);
      
      // Request permissions first
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Camera and storage permissions are required to select images',
          [{ text: 'OK' }]
        );
        setIsLoading(false);
        return;
      }
      
      // Basic options - keep it simple
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      };
      
      console.log('Image Picker: Launching library with options:', options);
      
      launchImageLibrary(options, (response) => {
        console.log('Image Picker Response:', JSON.stringify(response));
        
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } 
        else if (response.errorCode) {
          console.error(`ImagePicker Error: ${response.errorCode}`, response.errorMessage);
          Alert.alert('Error', `Image picker error: ${response.errorMessage}`);
        }
        else if (response.assets && response.assets.length > 0) {
          const selectedImage = response.assets[0];
          console.log('Selected image:', selectedImage.uri);
          
          if (onImageSelected && selectedImage.uri) {
            onImageSelected(selectedImage.uri);
          }
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error in image picker:', error);
      Alert.alert('Error', 'Failed to open image picker');
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.button} 
      onPress={handleSelectImage}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={styles.buttonText}>Select Image</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4a86f7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImagePickerButton; 