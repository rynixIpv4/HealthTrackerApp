import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../../constants';
import { useTheme, getThemeColors } from '../../contexts/ThemeContext';
import { useBluetooth } from '../../contexts/BluetoothContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type NavigationProps = StackNavigationProp<any>;
const { width: screenWidth } = Dimensions.get('window');

const BluetoothSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const { deviceId } = route.params as { deviceId: string };
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  const { selectedDevice, deviceData } = useBluetooth();
  
  // Animation values
  const popupScale = useRef(new Animated.Value(0.8)).current;
  const popupOpacity = useRef(new Animated.Value(0)).current;
  const successIconScale = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  const deviceInfoOpacity = useRef(new Animated.Value(0)).current;
  
  // Run entrance animations
  useEffect(() => {
    // Sequence the animations
    Animated.sequence([
      // First show the popup
      Animated.parallel([
        Animated.timing(popupScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(popupOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      
      // Then show the success icon
      Animated.timing(successIconScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.elastic(1.5)),
        useNativeDriver: true,
      }),
      
      // Then animate the checkmark
      Animated.parallel([
        Animated.timing(checkmarkScale, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.elastic(1)),
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      
      // Finally show the device info
      Animated.timing(deviceInfoOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Auto navigate to home after 4 seconds
    const timer = setTimeout(() => {
      navigation.navigate('Home');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const handleContinue = () => {
    navigation.navigate('Home');
  };
  
  const handleViewDevice = () => {
    navigation.navigate('ConnectedDevice');
  };

  // Get theme-specific colors
  const backgroundColor = isDarkMode ? colors.background : '#FFFFFF';
  const textColor = isDarkMode ? colors.text : '#333';
  const secondaryTextColor = isDarkMode ? colors.textSecondary : '#666';
  const successBgColor = isDarkMode ? `${colors.success}20` : '#F0FFF0';
  const successBorderColor = isDarkMode ? `${colors.success}40` : '#E0FFE0';
  const cardBgColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const deviceType = selectedDevice?.name || 'Smart Ring';
  const batteryLevel = deviceData?.battery || '0';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={backgroundColor} 
      />
      
      <Animated.View 
        style={[
          styles.popupCard,
          { 
            backgroundColor: cardBgColor,
            transform: [{ scale: popupScale }],
            opacity: popupOpacity,
            shadowColor: isDarkMode ? '#000' : '#888',
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.successIconContainer, 
            { 
              backgroundColor: successBgColor,
              borderColor: successBorderColor,
              transform: [{ scale: successIconScale }],
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.checkmarkContainer, 
              { 
                opacity: checkmarkOpacity,
                transform: [{ scale: checkmarkScale }] 
              }
            ]}
          >
            <Icon name="check" size={50} color={colors.success} />
          </Animated.View>
        </Animated.View>
        
        <Text style={[styles.title, { color: textColor }]}>Connection Successful!</Text>
        
        <Text style={[styles.message, { color: secondaryTextColor }]}>
          Your device has been successfully paired and is ready to use.
        </Text>
        
        <Animated.View 
          style={[
            styles.deviceInfoCard, 
            { 
              backgroundColor: isDarkMode ? '#2C2C2E' : '#F7F7F9',
              opacity: deviceInfoOpacity 
            }
          ]}
        >
          <View style={styles.deviceInfoRow}>
            <View style={styles.smartRingIconSmall}>
              <View style={[styles.ringOuterSmall, { borderColor: colors.primary }]} />
              <View style={styles.ringInnerSmall}>
                <Icon name="pulse" size={8} color={colors.primary} />
              </View>
            </View>
            <Text style={[styles.deviceInfoText, { color: textColor }]}>
              {deviceType}
            </Text>
          </View>
          
          <View style={styles.deviceInfoRow}>
            <Icon name="signal" size={18} color={colors.success} />
            <Text style={[styles.deviceInfoText, { color: textColor }]}>
              Signal strength: Good
            </Text>
          </View>
        </Animated.View>
        
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue to Dashboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.deviceButton, { borderColor: colors.primary }]}
          onPress={handleViewDevice}
        >
          <Text style={[styles.deviceButtonText, { color: colors.primary }]}>View Device</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupCard: {
    width: screenWidth - 48,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
  },
  checkmarkContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  deviceInfoCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  deviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deviceInfoText: {
    fontSize: 15,
    marginLeft: 12,
  },
  continueButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  deviceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  smartRingIconSmall: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringOuterSmall: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    position: 'absolute',
  },
  ringInnerSmall: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BluetoothSuccessScreen; 