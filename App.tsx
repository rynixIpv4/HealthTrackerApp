/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, LogBox, Platform, AppState, AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { BluetoothProvider } from './src/contexts/BluetoothContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import notificationService, { setupNotificationChannels, requestPermissions } from './src/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedStatusBar from './src/components/ThemedStatusBar';
import { ToastProvider } from './src/components/ToastManager';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Reanimated 2', 
  "[react-native-gesture-handler]",
  "Failed to get size for image",
  "ViewPropTypes will be removed from React Native",
]);

// App content that has access to theme context
const AppContent = () => {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ThemedStatusBar />
      <AppErrorBoundary>
        <BluetoothProvider>
          <ToastProvider>
            <AppNavigator />
          </ToastProvider>
        </BluetoothProvider>
      </AppErrorBoundary>
    </View>
  );
};

function App(): React.JSX.Element {
  // Initialize notification service and app state tracking
  useEffect(() => {
    const initNotifications = async () => {
      try {
        // Set up notification channels for Android
        await setupNotificationChannels();
        console.log('Notification channels set up successfully');
        
        // Request permissions (will prompt the user)
        const granted = await requestPermissions();
        console.log('Notification permissions granted:', granted);
        
        // Load notification settings from AsyncStorage
        const settingsJson = await AsyncStorage.getItem('health_tracker_notification_settings');
        
        // If no settings exist yet, create default settings
        if (!settingsJson) {
          const defaultSettings = {
            generalNotifications: true,
            sound: true,
            vibration: true,
            lockScreen: true,
            inactivityReminders: true,
            goalProgress: true,
            achievementAlerts: true,
            sleepInsights: true,
            heartRateAlerts: true,
            weeklyReports: true
          };
          
          // Save default settings
          await AsyncStorage.setItem(
            'health_tracker_notification_settings',
            JSON.stringify(defaultSettings)
          );
          console.log('Default notification settings created');
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    // Set up app state change handler for notifications
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App has come to the foreground
        console.log('App is active, checking for pending notifications');
        
        // Get latest device data from storage
        const checkStoredData = async () => {
          try {
            const today = new Date();
            const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            // Check if we have today's data
            const storedData = await AsyncStorage.getItem(`HEALTH_DATA_${dateKey}`);
            
            if (storedData) {
              const deviceData = JSON.parse(storedData);
              
              // Get user goals
              const userGoalsJson = await AsyncStorage.getItem('health_tracker_user_goals');
              const userGoals = userGoalsJson 
                ? JSON.parse(userGoalsJson) 
                : { steps: 10000, sleep: 8, heartRate: { min: 60, max: 100 } };
              
              // Process stored data for motivational notifications
              await notificationService.processSmartRingData(
                deviceData,
                userGoals,
                { name: "User" } // Default user profile
              );
            }
          } catch (error) {
            console.error('Error checking stored data for notifications:', error);
          }
        };
        
        checkStoredData();
      }
    });

    // Initialize notifications
    initNotifications();
    
    // Cleanup
    return () => {
      appStateSubscription.remove();
    };
  }, []);

  // Return app with theme support
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

// Basic error boundary component
class AppErrorBoundary extends React.Component<{children: React.ReactNode}> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when there's an error
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong!</Text>
          <Text style={styles.errorMessage}>{this.state.error?.toString()}</Text>
          <Text style={styles.errorHint}>Please restart the app</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5252',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#212121',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: '#757575',
  },
});

export default App;
