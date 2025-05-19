import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES } from '../../constants';
import { useBluetooth } from '../../contexts/BluetoothContext';
import { useTheme, getThemeColors } from '../../contexts/ThemeContext';
import Svg, { Circle, Path } from 'react-native-svg';

type NavigationProps = StackNavigationProp<any>;

const AddRingScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { scanForDevices } = useBluetooth();
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // We'll use a consistent dark background for this process regardless of app theme
  // to maintain a focused UI for device connection
  const backgroundStyle = isDarkMode ? colors.background : COLORS.darkBackground;
  const textColor = isDarkMode ? colors.text : COLORS.white;
  const cardBgColor = isDarkMode ? colors.surface : COLORS.white;
  const cardTextColor = isDarkMode ? colors.text : COLORS.dark;
  const cardSubtextColor = isDarkMode ? colors.textSecondary : COLORS.gray;

  const handleAddDevice = async () => {
    // Start scanning and navigate to the scanning screen
    scanForDevices();
    navigation.navigate('ScanningDevices');
  };

  const showHelp = () => {
    Alert.alert(
      "Connect Your Ring Device",
      "1. Make sure your ring device is charged and turned on.\n\n" +
      "2. Ensure Bluetooth is enabled on your phone.\n\n" +
      "3. Place your ring device near your phone during pairing.\n\n" +
      "4. Press 'Start' to begin scanning for your device.\n\n" +
      "5. When your device appears in the list, tap on it to connect.\n\n" +
      "If you have trouble connecting, try restarting your ring device and try again.",
      [{ text: "OK", onPress: () => console.log("Help dialog closed") }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: backgroundStyle }]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundStyle} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: "#000000" }]}>Add Ring</Text>
        <TouchableOpacity onPress={showHelp}>
          <Text style={[styles.helpText, { color: "#000000" }]}>Help</Text>
        </TouchableOpacity>
      </View>
      
      {/* Card container */}
      <View style={[styles.cardContainer, { backgroundColor: cardBgColor }]}>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: cardTextColor }]}>Connect Ring</Text>
          <Text style={[styles.cardDescription, { color: cardSubtextColor }]}>Lets connect your wearable</Text>
          
          {/* Plus Button Circle */}
          <TouchableOpacity 
            style={styles.plusButtonContainer} 
            onPress={handleAddDevice}
          >
            <View style={styles.plusButton}>
              <Svg width={150} height={150} viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="45" fill={isDarkMode ? "#352D52" : "#E8E6FF"} />
                <Path d="M50 30 L50 70 M30 50 L70 50" stroke={isDarkMode ? colors.primary : "#FFFFFF"} strokeWidth="3" />
              </Svg>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.startButton, { backgroundColor: isDarkMode ? colors.primary : COLORS.dark }]} 
            onPress={handleAddDevice}
          >
            <Text style={styles.startButtonText}>Start</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : SIZES.medium,
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
    marginBottom: SIZES.large + 90,
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
  plusButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButton: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startButton: {
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.xlarge,
    borderRadius: SIZES.small,
    marginTop: 'auto',
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddRingScreen; 