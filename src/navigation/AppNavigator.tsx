import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { COLORS, SCREENS } from '../constants';
import { auth } from '../services/firebase';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import CustomTabBar from './TabBar';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import DeviceConnectScreen from '../screens/DeviceConnectScreen';
import SettingsScreen from '../screens/SettingsScreen';
import HeartRateScreen from '../screens/HeartRateScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import BluetoothScanScreen from '../screens/bluetooth/BluetoothScanScreen';
import BluetoothSuccessScreen from '../screens/bluetooth/BluetoothSuccessScreen';
import HealthDetailsScreen from '../screens/HealthDetailsScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import SecurityScreen from '../screens/SecurityScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import AboutAppScreen from '../screens/AboutAppScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import StepsScreen from '../screens/StepsScreen';
import SleepScreen from '../screens/SleepScreen';
import CyclingScreen from '../screens/CyclingScreen';
import ConnectedDeviceScreen from '../screens/bluetooth/ConnectedDeviceScreen';

// Define the types for our navigation parameters
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  [SCREENS.HOME]: undefined;
  [SCREENS.DASHBOARD]: undefined;
  [SCREENS.PROFILE]: undefined;
  [SCREENS.DEVICE_CONNECT]: undefined;
  [SCREENS.SLEEP_TRACKER]: undefined;
  [SCREENS.HEART_RATE]: undefined;
  [SCREENS.ACTIVITY]: undefined;
  [SCREENS.SETTINGS]: undefined;
  [SCREENS.NOTIFICATIONS]: undefined;
  [SCREENS.LOGIN]: undefined;
  [SCREENS.REGISTER]: undefined;
  [SCREENS.FORGOT_PASSWORD]: undefined;
  [SCREENS.STEPS]: undefined;
  [SCREENS.SLEEP]: undefined;
  [SCREENS.CYCLING]: undefined;
  HealthDetails: undefined;
  EmergencyContacts: undefined;
  Security: undefined;
  AboutApp: undefined;
  ProfileAccount: undefined;
  PrivacyPolicy: undefined;
};

export type AuthStackParamList = {
  [SCREENS.LOGIN]: undefined;
  [SCREENS.REGISTER]: undefined;
  [SCREENS.FORGOT_PASSWORD]: undefined;
};

export type MainTabParamList = {
  [SCREENS.HOME]: undefined;
  [SCREENS.ACTIVITY]: undefined;
  [SCREENS.DEVICE_CONNECT]: undefined;
  [SCREENS.SETTINGS]: undefined;
};

// Create the navigation stacks
const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Auth Navigator (Login, Register, Forgot Password)
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <AuthStack.Screen name={SCREENS.LOGIN} component={LoginScreen} />
      <AuthStack.Screen name={SCREENS.REGISTER} component={RegisterScreen} />
      <AuthStack.Screen name={SCREENS.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
};

// Main Tab Navigator (Home, Activity, Device Connect, Settings)
const MainTabNavigator = () => {
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  return (
    <MainTab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}
    >
      <MainTab.Screen name={SCREENS.HOME} component={HomeScreen} />
      <MainTab.Screen name={SCREENS.ACTIVITY} component={ActivityScreen} />
      <MainTab.Screen name={SCREENS.DEVICE_CONNECT} component={DeviceStack} />
      <MainTab.Screen name={SCREENS.SETTINGS} component={SettingsScreen} />
    </MainTab.Navigator>
  );
};

// Device Stack Navigator
const DeviceStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DeviceConnect" component={DeviceConnectScreen} />
      <Stack.Screen name="BluetoothScan" component={BluetoothScanScreen} />
      <Stack.Screen name="BluetoothSuccess" component={BluetoothSuccessScreen} />
      <Stack.Screen name="ConnectedDevice" component={ConnectedDeviceScreen} />
    </Stack.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  useEffect(() => {
    console.log("Setting up auth state listener");
    
    // Listen for auth state changes
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user) {
        console.log("User is signed in");
        setIsAuthenticated(true);
      } else {
        console.log("User is signed out");
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });
    
    // Clean up the listener on unmount
    return unsubscribe;
  }, []);
  
  // Show loading screen while authentication state is being determined
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      </View>
    );
  }
  
  // Main navigation structure
  return (
    <NavigationContainer
      theme={{
        dark: isDarkMode,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen name="HeartRate" component={HeartRateScreen} />
            <Stack.Screen name="Steps" component={StepsScreen} />
            <Stack.Screen name="Sleep" component={SleepScreen} />
            <Stack.Screen name="Cycling" component={CyclingScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="ProfileAccount" component={ProfileScreen} />
            <Stack.Screen name="HealthDetails" component={HealthDetailsScreen} />
            <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="AboutApp" component={AboutAppScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  }
});

export default AppNavigator; 