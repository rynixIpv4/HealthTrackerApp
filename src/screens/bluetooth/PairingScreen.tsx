import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useBluetooth } from '../../contexts/BluetoothContext';
import { COLORS, SIZES } from '../../constants';
import { useTheme, getThemeColors } from '../../contexts/ThemeContext';

type NavigationProps = StackNavigationProp<any>;

const PairingScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { selectedDevice, cancelPairing, connectToDevice } = useBluetooth();
  const [pairingProgress, setPairingProgress] = useState(0);
  const [pairingFailed, setPairingFailed] = useState(false);
  const [pairingComplete, setPairingComplete] = useState(false);
  
  // Move Animated.Value to useRef to prevent re-creation on every render
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Theme context
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // For consistent UI, use the same background style as other Bluetooth screens
  const backgroundStyle = isDarkMode ? colors.background : COLORS.darkBackground;
  const textColor = isDarkMode ? colors.text : COLORS.white;
  const contentBgColor = isDarkMode ? colors.surface : COLORS.white;
  const contentTextColor = isDarkMode ? colors.text : COLORS.dark;
  const contentSubtextColor = isDarkMode ? colors.textSecondary : COLORS.gray;

  // Save interval ID in a ref so we can clean it up
  const progressIntervalRef = useRef(null);

  useEffect(() => {
    if (!selectedDevice) {
      navigation.goBack();
      return;
    }

    // Start the real pairing process immediately
    startRealPairing();
    
    // Clean up on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [selectedDevice]);

  const handleCancel = () => {
    cancelPairing();
    navigation.goBack();
  };

  const handleRetry = () => {
    // Reset state and start again
    setPairingFailed(false);
    setPairingComplete(false);
    setPairingProgress(0);
    progressAnim.setValue(0);
    
    // Use the actual connection methods from the Bluetooth context
    startRealPairing();
  };

  const startRealPairing = () => {
    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Simulate pairing process - in a real app, you would use actual Bluetooth calls here
    let currentProgress = 0;
    
    const simulatePairing = async () => {
      try {
        // If we have the device, try to connect to it
        if (selectedDevice && connectToDevice) {
          const success = await connectToDevice(selectedDevice.id);
          
          if (success) {
            // Connection successful, complete the pairing
            setPairingComplete(true);
            setPairingProgress(100);
            Animated.timing(progressAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: false,
            }).start();
            
            // Navigate to success screen
            setTimeout(() => {
              navigation.navigate('BluetoothSuccess', { deviceId: selectedDevice.id });
            }, 1500);
          } else {
            // Connection failed
            setPairingFailed(true);
          }
        } else {
          // No device selected or no connectToDevice function
          setPairingFailed(true);
        }
      } catch (error) {
        console.error('Error during pairing:', error);
        setPairingFailed(true);
      }
    };
    
    // Show visual progress with an interval
    progressIntervalRef.current = setInterval(() => {
      if (currentProgress < 90) {
        // Increment progress by random amount (1-5)
        const increment = Math.floor(Math.random() * 5) + 1;
        currentProgress += increment;
        setPairingProgress(currentProgress);
        
        // Update animation value
        progressAnim.setValue(currentProgress / 100);
      } else if (!pairingComplete && !pairingFailed) {
        // Clear interval when we reach 90%
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
        
        // Attempt actual connection
        simulatePairing();
      }
    }, 300);
    
    // For safety, clear interval after 15 seconds if not cleared already
    setTimeout(() => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
        
        // If we hit this timeout and pairing isn't complete or failed, mark as failed
        if (!pairingComplete && !pairingFailed) {
          setPairingFailed(true);
        }
      }
    }, 15000);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: backgroundStyle }]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundStyle} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleCancel}
        >
          <Icon name="close" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Pairing Device</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Content */}
      <View style={[styles.content, { backgroundColor: contentBgColor }]}>
        {pairingFailed ? (
          <View style={styles.centerContainer}>
            <View style={styles.errorIcon}>
              <Icon name="close-circle" size={60} color={colors.danger || COLORS.error} />
            </View>
            <Text style={[styles.statusTitle, { color: contentTextColor }]}>Pairing Failed</Text>
            <Text style={[styles.statusMessage, { color: contentSubtextColor }]}>
              Unable to pair with the device. Please make sure the device is in pairing mode and try again.
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.secondaryButton, { borderColor: colors.border }]} 
                onPress={handleCancel}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: colors.primary }]} 
                onPress={handleRetry}
              >
                <Text style={styles.primaryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : pairingComplete ? (
          <View style={styles.centerContainer}>
            <View style={styles.successIcon}>
              <Icon name="check-circle" size={60} color={colors.success || COLORS.success} />
            </View>
            <Text style={[styles.statusTitle, { color: contentTextColor }]}>Pairing Complete</Text>
            <Text style={[styles.statusMessage, { color: contentSubtextColor }]}>
              Your device has been successfully paired.
            </Text>
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <View style={styles.animationContainer}>
              {/* Animated connection graphic */}
              <View style={[styles.deviceIconContainer, { backgroundColor: isDarkMode ? colors.cardSteps : COLORS.lightBackground }]}>
                <View style={[styles.customRingIconContainer, { borderColor: colors.primary }]}>
                  <Icon name="cellphone-wireless" size={20} color={colors.primary} />
                  <View style={[styles.customRingCircle, { borderColor: colors.primary }]} />
                </View>
              </View>
              <View style={[styles.connectionLine, { backgroundColor: isDarkMode ? colors.border : COLORS.lightGray }]}>
                <Animated.View 
                  style={[
                    styles.progressLine,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%']
                      }),
                      backgroundColor: colors.primary
                    }
                  ]} 
                />
              </View>
              <View style={[styles.phoneIconContainer, { backgroundColor: isDarkMode ? colors.cardSteps : COLORS.lightBackground }]}>
                <Icon name="cellphone" size={40} color={colors.primary} />
              </View>
            </View>
            
            <Text style={[styles.deviceName, { color: contentTextColor }]}>
              {selectedDevice?.name || 'Unknown Device'}
            </Text>
            
            <Text style={[styles.statusMessage, { color: contentSubtextColor }]}>
              Connecting to your device...
            </Text>
            
            <Text style={[styles.progressText, { color: colors.primary }]}>
              {pairingProgress}%
            </Text>
            
            <TouchableOpacity 
              style={[styles.cancelButton, { borderColor: colors.border }]} 
              onPress={handleCancel}
            >
              <Text style={[styles.cancelButtonText, { color: colors.danger || COLORS.error }]}>
                Cancel Pairing
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.medium,
  },
  backButton: {
    padding: SIZES.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    borderTopLeftRadius: SIZES.large,
    borderTopRightRadius: SIZES.large,
    overflow: 'hidden',
    marginBottom: SIZES.large + 70, // Add padding for tab bar
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.large,
  },
  animationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.xlarge,
    width: '100%',
  },
  deviceIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionLine: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    flex: 1,
    marginHorizontal: SIZES.medium,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressLine: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  deviceName: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SIZES.large,
  },
  progressText: {
    textAlign: 'right',
    fontSize: 14,
    color: COLORS.gray,
  },
  pairingInstructions: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.xlarge,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SIZES.large,
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
  },
  cancelButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  errorIcon: {
    marginBottom: SIZES.large,
  },
  successIcon: {
    marginBottom: SIZES.large,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SIZES.medium,
  },
  statusMessage: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.xlarge,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.large,
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
    marginLeft: SIZES.medium,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SIZES.large,
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  customRingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  customRingCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.lightBackground,
    borderWidth: 1,
    position: 'absolute',
  },
});

export default PairingScreen; 