import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Animated,
  Easing
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES } from '../../constants';
import { useBluetooth } from '../../contexts/BluetoothContext';
import { useTheme, getThemeColors } from '../../contexts/ThemeContext';
import Svg, { Circle } from 'react-native-svg';

type NavigationProps = StackNavigationProp<any>;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ScanningScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { stopScan, availableDevices, connectionError } = useBluetooth();
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // For consistent UI, use the same background style as other Bluetooth screens
  const backgroundStyle = isDarkMode ? colors.background : COLORS.darkBackground;
  const textColor = isDarkMode ? colors.text : COLORS.white;
  const cardBgColor = isDarkMode ? colors.surface : COLORS.white;
  const cardTextColor = isDarkMode ? colors.text : COLORS.dark;
  const cardSubtextColor = isDarkMode ? colors.textSecondary : COLORS.gray;
  
  // Animation values
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;
  const pulseAnim4 = useRef(new Animated.Value(0)).current;
  const pulseAnim5 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Handle navigation to the choose device screen once devices are found
  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to choose device screen after 5 seconds
      if (availableDevices.length > 0) {
        navigation.navigate('ChooseDevice');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [availableDevices, navigation]);

  // Set up pulse animations
  useEffect(() => {
    const createPulseAnimation = (animValue, delay, duration) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: duration,
            delay: delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      );
    };

    // Create rotating animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    
    // Start animations with different durations and delays for a more organic effect
    createPulseAnimation(pulseAnim1, 0, 2000).start();
    createPulseAnimation(pulseAnim2, 400, 2200).start();
    createPulseAnimation(pulseAnim3, 800, 2400).start();
    createPulseAnimation(pulseAnim4, 1200, 2600).start();
    createPulseAnimation(pulseAnim5, 1600, 2800).start();
    rotateAnimation.start();

    return () => {
      // Stop animations on unmount
      pulseAnim1.stopAnimation();
      pulseAnim2.stopAnimation();
      pulseAnim3.stopAnimation();
      pulseAnim4.stopAnimation();
      pulseAnim5.stopAnimation();
      rotateAnim.stopAnimation();
    };
  }, []);

  // Interpolate animations
  const scale1 = pulseAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.1]
  });
  
  const scale2 = pulseAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1.15]
  });
  
  const scale3 = pulseAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2]
  });
  
  const scale4 = pulseAnim4.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1.25]
  });
  
  const scale5 = pulseAnim5.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.3]
  });
  
  const opacity1 = pulseAnim1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.5, 0.3]
  });
  
  const opacity2 = pulseAnim2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.5, 0.7, 0.5]
  });
  
  const opacity3 = pulseAnim3.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.7, 0.9, 0.7]
  });
  
  const opacity4 = pulseAnim4.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 1, 0.8]
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handleCancel = () => {
    stopScan();
    navigation.navigate('AddRing');
  };

  // Animation circle colors
  const pulseCircleFill = isDarkMode ? colors.cardSteps : "#E8E6FF";
  const centerDotFill = isDarkMode ? colors.primary : "#FFFFFF";
  const pulsingDotColor = isDarkMode ? `${colors.primary}40` : 'rgba(132, 94, 247, 0.3)';
  const innerDotColor = isDarkMode ? colors.primary : '#845EF7';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: backgroundStyle }]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundStyle} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Scanning</Text>
        <Text style={[styles.helpText, { color: textColor }]}>Help</Text>
      </View>
      
      {/* Card container */}
      <View style={[styles.cardContainer, { backgroundColor: cardBgColor }]}>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: cardTextColor }]}>Connect Ring</Text>
          <Text style={[styles.cardDescription, { color: cardSubtextColor }]}>
            {availableDevices.length > 0 
              ? `Found ${availableDevices.length} device(s)`
              : 'Scanning for Smart Ring'
            }
          </Text>
          
          {/* Display error message if any */}
          {connectionError && (
            <Text style={styles.errorText}>{connectionError}</Text>
          )}

          {/* Device list if found any */}
          {availableDevices.length > 0 && (
            <View style={styles.deviceListContainer}>
              {availableDevices.slice(0, 3).map((device) => (
                <Text key={device.id} style={[styles.deviceItem, { color: cardTextColor }]}>
                  • {device.name} {device.rssi ? `(${device.rssi} dBm)` : ''}
                </Text>
              ))}
              {availableDevices.length > 3 && (
                <Text style={[styles.deviceItem, { color: cardSubtextColor }]}>
                  ...and {availableDevices.length - 3} more
                </Text>
              )}
            </View>
          )}
          
          {/* Scanning animation */}
          <View style={styles.scanningContainer}>
            <Animated.View
              style={[
                styles.svgContainer,
                { transform: [{ rotate }] }
              ]}
            >
              <Svg width={220} height={220} viewBox="0 0 100 100">
                <AnimatedCircle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill={pulseCircleFill} 
                  opacity={opacity1}
                  style={{ transform: [{ scale: scale1 }] }}
                />
                <AnimatedCircle 
                  cx="50" 
                  cy="50" 
                  r="35" 
                  fill={pulseCircleFill} 
                  opacity={opacity2}
                  style={{ transform: [{ scale: scale2 }] }}
                />
                <AnimatedCircle 
                  cx="50" 
                  cy="50" 
                  r="25" 
                  fill={pulseCircleFill} 
                  opacity={opacity3}
                  style={{ transform: [{ scale: scale3 }] }}
                />
                <AnimatedCircle 
                  cx="50" 
                  cy="50" 
                  r="15" 
                  fill={pulseCircleFill} 
                  opacity={opacity4}
                  style={{ transform: [{ scale: scale4 }] }}
                />
                <AnimatedCircle 
                  cx="50" 
                  cy="50" 
                  r="5" 
                  fill={centerDotFill}
                  style={{ transform: [{ scale: scale5 }] }}
                />
              </Svg>
            </Animated.View>
          </View>
          
          <Text style={[styles.scanTip, { color: cardSubtextColor }]}>
            Make sure your Colmi R02 Ring is nearby and in pairing mode
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.cancelButton, { borderColor: colors.primary }]} 
            onPress={handleCancel}
          >
            <Text style={[styles.cancelButtonText, { color: colors.primary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SIZES.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.large,
    paddingBottom: SIZES.medium,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 16,
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: SIZES.large,
    marginBottom: SIZES.large + 70,
    borderRadius: SIZES.large,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: SIZES.large,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    marginBottom: 40,
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svgContainer: {
    position: 'relative',
  },
  pulsingDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  cancelButton: {
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.xlarge,
    borderRadius: SIZES.small,
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deviceListContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignSelf: 'stretch',
  },
  deviceItem: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'left',
  },
  scanTip: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  buttonsContainer: {
    padding: SIZES.medium,
    width: '100%',
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
    marginVertical: 8,
    fontSize: 14,
  }
});

export default ScanningScreen; 