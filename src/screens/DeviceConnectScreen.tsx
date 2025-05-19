import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants';
import AddRingScreen from './bluetooth/AddRingScreen';
import ScanningScreen from './bluetooth/ScanningScreen';
import ChooseDeviceScreen from './bluetooth/ChooseDeviceScreen';
import PairingScreen from './bluetooth/PairingScreen';
import BluetoothDeviceListScreen from './bluetooth/BluetoothDeviceListScreen';
import BluetoothPairingScreen from './bluetooth/BluetoothPairingScreen';
import BluetoothSuccessScreen from './bluetooth/BluetoothSuccessScreen';
import ConnectedDeviceScreen from './bluetooth/ConnectedDeviceScreen';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';

// Create a navigator for the Bluetooth flow
const BluetoothStack = createStackNavigator();

const DeviceConnectScreen = () => {
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // We'll use a dark theme for the Bluetooth connection flow regardless of app theme
  // to maintain the focused UI for this important task
  const backgroundStyle = isDarkMode ? colors.background : COLORS.darkBackground;

  return (
    <View style={[styles.container, { backgroundColor: backgroundStyle }]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundStyle} />
      
      <BluetoothStack.Navigator
        initialRouteName="AddRing"
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: backgroundStyle }
        }}
      >
        <BluetoothStack.Screen name="AddRing" component={AddRingScreen} />
        <BluetoothStack.Screen name="ScanningDevices" component={ScanningScreen} />
        <BluetoothStack.Screen name="ChooseDevice" component={ChooseDeviceScreen} />
        <BluetoothStack.Screen name="PairingDevice" component={PairingScreen} />
        <BluetoothStack.Screen name="BluetoothDeviceList" component={BluetoothDeviceListScreen} />
        <BluetoothStack.Screen name="BluetoothPairing" component={BluetoothPairingScreen} />
        <BluetoothStack.Screen name="BluetoothSuccess" component={BluetoothSuccessScreen} />
        <BluetoothStack.Screen name="ConnectedDevice" component={ConnectedDeviceScreen} />
      </BluetoothStack.Navigator>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});

export default DeviceConnectScreen; 