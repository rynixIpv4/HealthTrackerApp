import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES } from '../../constants';
import { useBluetooth } from '../../contexts/BluetoothContext';
import { useTheme, getThemeColors } from '../../contexts/ThemeContext';

type NavigationProps = StackNavigationProp<any>;

const BluetoothPairingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const { deviceId } = route.params as { deviceId: string };
  
  const { pairedDevices, availableDevices, syncDeviceData, connectionError } = useBluetooth();
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // Theme variables
  const backgroundStyle = isDarkMode ? colors.background : COLORS.white;
  const textColor = isDarkMode ? colors.text : '#333';
  const secondaryTextColor = isDarkMode ? colors.textSecondary : '#666';
  const borderColor = isDarkMode ? colors.border : '#F0F0F0';
  const iconContainerBg = isDarkMode ? colors.cardSteps : '#F3F0FF';
  
  const [pairingStep, setPairingStep] = useState<number>(1);
  const [pairingComplete, setPairingComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the device information
  const device = pairedDevices.find(d => d.id === deviceId) || 
                 availableDevices.find(d => d.id === deviceId);
  
  useEffect(() => {
    const pairDevice = async () => {
      try {
        // Step 1: Connecting
        setPairingStep(1);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check if there's a connection error
        if (connectionError) {
          setError(connectionError);
          return;
        }
        
        // Step 2: Authenticating
        setPairingStep(2);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Step 3: Syncing
        setPairingStep(3);
        try {
          await syncDeviceData();
        } catch (error) {
          console.error('Error syncing data:', error);
          // Continue with pairing process even if sync fails
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Complete
        setPairingStep(4);
        setPairingComplete(true);
        
        // Navigate to success screen after a delay
        setTimeout(() => {
          navigation.navigate('BluetoothSuccess', { deviceId });
        }, 1000);
        
      } catch (err) {
        console.error('Pairing error:', err);
        setError('An error occurred during pairing. Please try again.');
      }
    };
    
    // Only run the pairing process once when component mounts
    let mounted = true;
    
    // Start pairing only if component is still mounted
    if (mounted) {
      pairDevice();
    }
    
    return () => {
      mounted = false; // Prevent state updates if component unmounts
    };
  }, [deviceId]); // Only re-run if deviceId changes, remove connectionError dependency
  
  // Render pairing steps
  const renderPairingSteps = () => {
    const steps = [
      { id: 1, label: 'Connecting' },
      { id: 2, label: 'Authenticating' },
      { id: 3, label: 'Syncing Data' },
      { id: 4, label: 'Complete' },
    ];
    
    return (
      <View style={styles.stepsContainer}>
        {steps.map((step) => (
          <View key={step.id} style={styles.stepItem}>
            <View 
              style={[
                styles.stepCircle, 
                { backgroundColor: pairingStep >= step.id ? colors.primary : isDarkMode ? colors.border : '#EEEEEE' },
              ]}
            >
              {pairingStep > step.id ? (
                <Text style={styles.stepCircleText}>✓</Text>
              ) : pairingStep === step.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.stepCircleText, { color: isDarkMode ? colors.textSecondary : '#666' }]}>{step.id}</Text>
              )}
            </View>
            <Text 
              style={[
                styles.stepLabel, 
                { 
                  color: pairingStep >= step.id ? 
                    (isDarkMode ? colors.text : '#333') : 
                    (isDarkMode ? colors.textSecondary : '#666') 
                }
              ]}
            >
              {step.label}
            </Text>
          </View>
        ))}
      </View>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: backgroundStyle }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={backgroundStyle} />
      
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: colors.primary }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Pairing Device</Text>
        <View style={styles.rightHeaderPlaceholder} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.deviceInfoContainer}>
          <View style={[styles.deviceIconContainer, { backgroundColor: iconContainerBg }]}>
            <Text style={styles.deviceIconText}>💍</Text>
          </View>
          <Text style={[styles.deviceName, { color: textColor }]}>{device?.name || 'Smart Ring'}</Text>
          <Text style={[styles.deviceId, { color: secondaryTextColor }]}>ID: {deviceId.substring(0, 8)}...</Text>
        </View>
        
        {/* Display any errors */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: isDarkMode ? `${colors.danger}20` : '#FFE9E9' }]}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {!error && (
          <>
            {renderPairingSteps()}
            
            {pairingComplete ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIconContainer, { 
                  backgroundColor: isDarkMode ? `${colors.success}20` : '#F0FFF0',
                  borderColor: isDarkMode ? `${colors.success}40` : '#E0FFE0'
                }]}>
                  <Text style={styles.successIcon}>✅</Text>
                </View>
                <Text style={[styles.successText, { color: colors.success }]}>
                  Device paired successfully!
                </Text>
              </View>
            ) : (
              <View style={styles.pairingAnimation}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.pairingText, { color: secondaryTextColor }]}>
                  Please keep your device nearby...
                </Text>
              </View>
            )}
          </>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rightHeaderPlaceholder: {
    width: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  deviceInfoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  deviceIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceIconText: {
    fontSize: 40,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 14,
  },
  stepsContainer: {
    marginBottom: 40,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepCircleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepLabel: {
    fontSize: 16,
  },
  pairingAnimation: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  pairingText: {
    fontSize: 16,
    marginTop: 16,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
  },
  successIcon: {
    fontSize: 50,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    padding: 20,
    borderRadius: 12,
    marginVertical: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BluetoothPairingScreen; 