import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import BackButton from '../components/BackButton';
import { COLORS, ELEVATION_STYLES } from '../constants';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notificationService from '../services/notificationService';
import { useBluetooth } from '../contexts/BluetoothContext';
import LinearGradient from 'react-native-linear-gradient';

// Key for storing notification settings
const NOTIFICATION_SETTINGS_KEY = 'health_tracker_notification_settings';

// Keys for storing user goals
const USER_GOALS_KEY = 'health_tracker_user_goals';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // Get bluetooth context for device data
  const { 
    deviceData, 
    selectedDevice, 
    syncDeviceData, 
    userGoals, 
    setUserGoals 
  } = useBluetooth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    generalNotifications: true,
    sound: true,
    vibration: true,
    doNotDisturb: false,
    lockScreen: true,
    // Specific notification types
    inactivityReminders: true,
    goalProgress: true,
    achievementAlerts: true,
    sleepInsights: true,
    heartRateAlerts: true,
    weeklyReports: true
  });

  // Load saved settings on mount
  useEffect(() => {
    const loadSavedSettings = async () => {
      try {
        // Load notification settings
        const savedSettings = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
        if (savedSettings) {
          setNotificationSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };

    loadSavedSettings();
  }, []);

  // Save settings when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(
          NOTIFICATION_SETTINGS_KEY,
          JSON.stringify(notificationSettings)
        );

        // Request notification permissions if enabled
        if (notificationSettings.generalNotifications) {
          const permissionGranted = await notificationService.requestPermissions();
          
          if (!permissionGranted) {
            // If permissions were denied, show an alert
            Alert.alert(
              "Permission Required",
              "Notification permissions are required to send you activity updates and reminders.",
              [{ text: "OK" }]
            );
          }
        }
      } catch (error) {
        console.error('Error saving notification settings:', error);
      }
    };

    saveSettings();
  }, [notificationSettings]);

  // Toggle switch for notification settings
  const toggleSwitch = (setting) => {
    if (setting === 'generalNotifications' && notificationSettings.generalNotifications) {
      // Show confirmation when turning off all notifications
      Alert.alert(
        "Turn off all notifications?",
        "You won't receive any motivational reminders or updates about your health goals.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Turn Off", 
            style: "destructive",
            onPress: () => {
              setNotificationSettings(prevState => ({
                ...prevState,
                generalNotifications: false
              }));
            }
          }
        ]
      );
    } else {
      setNotificationSettings(prevState => ({
        ...prevState,
        [setting]: !prevState[setting]
      }));
    }
  };

  // Process current device data for notifications
  const processNotifications = async () => {
    if (!notificationSettings.generalNotifications) {
      Alert.alert(
        "Notifications Disabled",
        "Please enable notifications to receive health insights and motivation.",
        [{ text: "OK" }]
      );
      return;
    }

    if (!deviceData || !selectedDevice) {
      Alert.alert(
        "No Device Connected",
        "Please connect your smart ring to receive personalized notifications.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setIsProcessing(true);
      
      // First sync the latest data from the device
      await syncDeviceData();
      
      // Save today's data for future reference
      await notificationService.saveDailyHealthData(deviceData);
      
      // Process the data for notifications with the current user's goal settings
      await notificationService.processSmartRingData(
        deviceData,
        userGoals,
        { name: "User" } // We would normally get this from user profile
      );
      
      // Show confirmation
      Alert.alert(
        "Notifications Set",
        "Based on your health data, you'll receive personalized motivational notifications to help you achieve your goals.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error processing notifications:', error);
      Alert.alert(
        "Notification Error",
        "There was an error processing your health data for notifications. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor="transparent"
        translucent 
      />
      
      {/* Gradient Header */}
      <LinearGradient
        colors={['#5E60CE', '#6930C3', '#7400B8']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <BackButton 
            onPress={() => navigation.goBack()} 
            inGradientHeader={true}
          />
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 32 }} />
      </View>
      </LinearGradient>

      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main toggle for all notifications */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#F0EEFF' }]}>
                <Feather name="bell" size={22} color={colors.primary} />
              </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Notifications</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Enable or disable all notifications
              </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: isDarkMode ? "#555" : "#E0E0E0", true: `${colors.primary}50` }}
              thumbColor={notificationSettings.generalNotifications ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor={isDarkMode ? "#555" : "#E0E0E0"}
              onValueChange={() => toggleSwitch('generalNotifications')}
              value={notificationSettings.generalNotifications}
            />
          </View>
        </View>

        {/* Notification preferences */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#E8F5E9' }]}>
                <Feather name="volume-2" size={22} color={colors.primary} />
              </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Sound</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Play sound with notifications
              </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: isDarkMode ? "#555" : "#E0E0E0", true: `${colors.primary}50` }}
              thumbColor={notificationSettings.sound ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor={isDarkMode ? "#555" : "#E0E0E0"}
              onValueChange={() => toggleSwitch('sound')}
              value={notificationSettings.sound && notificationSettings.generalNotifications}
              disabled={!notificationSettings.generalNotifications}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#E4F3FF' }]}>
                <Feather name="smartphone" size={22} color={colors.primary} />
              </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Vibration</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Vibrate with notifications
              </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: isDarkMode ? "#555" : "#E0E0E0", true: `${colors.primary}50` }}
              thumbColor={notificationSettings.vibration ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor={isDarkMode ? "#555" : "#E0E0E0"}
              onValueChange={() => toggleSwitch('vibration')}
              value={notificationSettings.vibration && notificationSettings.generalNotifications}
              disabled={!notificationSettings.generalNotifications}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#FFF8E1' }]}>
                <Feather name="lock" size={22} color={colors.primary} />
              </View>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Lock Screen</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Show notifications on lock screen
              </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: isDarkMode ? "#555" : "#E0E0E0", true: `${colors.primary}50` }}
              thumbColor={notificationSettings.lockScreen ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor={isDarkMode ? "#555" : "#E0E0E0"}
              onValueChange={() => toggleSwitch('lockScreen')}
              value={notificationSettings.lockScreen && notificationSettings.generalNotifications}
              disabled={!notificationSettings.generalNotifications}
            />
          </View>
        </View>

        {/* Health Notification Types */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Notifications</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#FFEEEE' }]}>
                <Feather name="activity" size={22} color={colors.primary} />
              </View>
            <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Inactivity Reminders</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Reminds you to move when inactive for too long
              </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: isDarkMode ? "#555" : "#E0E0E0", true: `${colors.primary}50` }}
              thumbColor={notificationSettings.inactivityReminders ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor={isDarkMode ? "#555" : "#E0E0E0"}
              onValueChange={() => toggleSwitch('inactivityReminders')}
              value={notificationSettings.inactivityReminders && notificationSettings.generalNotifications}
              disabled={!notificationSettings.generalNotifications}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#E8F5E9' }]}>
                <Feather name="trending-up" size={22} color={colors.primary} />
              </View>
            <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Goal Progress</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Updates on progress toward daily goals
              </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: isDarkMode ? "#555" : "#E0E0E0", true: `${colors.primary}50` }}
              thumbColor={notificationSettings.goalProgress ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor={isDarkMode ? "#555" : "#E0E0E0"}
              onValueChange={() => toggleSwitch('goalProgress')}
              value={notificationSettings.goalProgress && notificationSettings.generalNotifications}
              disabled={!notificationSettings.generalNotifications}
            />
        </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#F0EEFF' }]}>
                <Feather name="award" size={22} color={colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Achievement Alerts</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Celebrate when you reach your goals
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: isDarkMode ? "#555" : "#E0E0E0", true: `${colors.primary}50` }}
              thumbColor={notificationSettings.achievementAlerts ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor={isDarkMode ? "#555" : "#E0E0E0"}
              onValueChange={() => toggleSwitch('achievementAlerts')}
              value={notificationSettings.achievementAlerts && notificationSettings.generalNotifications}
              disabled={!notificationSettings.generalNotifications}
            />
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#E4F3FF' }]}>
                <Feather name="moon" size={22} color={colors.primary} />
              </View>
            <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Sleep Insights</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Daily sleep quality analysis and tips
              </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: isDarkMode ? "#555" : "#E0E0E0", true: `${colors.primary}50` }}
              thumbColor={notificationSettings.sleepInsights ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor={isDarkMode ? "#555" : "#E0E0E0"}
              onValueChange={() => toggleSwitch('sleepInsights')}
              value={notificationSettings.sleepInsights && notificationSettings.generalNotifications}
              disabled={!notificationSettings.generalNotifications}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#FFEEEE' }]}>
                <Feather name="heart" size={22} color={colors.primary} />
              </View>
            <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Heart Rate Alerts</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Notifications about heart rate patterns
              </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: isDarkMode ? "#555" : "#E0E0E0", true: `${colors.primary}50` }}
              thumbColor={notificationSettings.heartRateAlerts ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor={isDarkMode ? "#555" : "#E0E0E0"}
              onValueChange={() => toggleSwitch('heartRateAlerts')}
              value={notificationSettings.heartRateAlerts && notificationSettings.generalNotifications}
              disabled={!notificationSettings.generalNotifications}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#E8F5E9' }]}>
                <Feather name="bar-chart-2" size={22} color={colors.primary} />
              </View>
            <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Weekly Reports</Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Weekly summary of your health progress
              </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: isDarkMode ? "#555" : "#E0E0E0", true: `${colors.primary}50` }}
              thumbColor={notificationSettings.weeklyReports ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor={isDarkMode ? "#555" : "#E0E0E0"}
              onValueChange={() => toggleSwitch('weeklyReports')}
              value={notificationSettings.weeklyReports && notificationSettings.generalNotifications}
              disabled={!notificationSettings.generalNotifications}
            />
          </View>
        </View>

        {/* Apply Now Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: notificationSettings.generalNotifications ? colors.primary : colors.border,
              opacity: notificationSettings.generalNotifications && !isProcessing ? 1 : 0.5
            }
          ]}
          onPress={processNotifications}
          disabled={!notificationSettings.generalNotifications || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.actionButtonText}>
              Apply Notification Settings
            </Text>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.noteText, { color: colors.textSecondary }]}>
          Notifications are personalized based on your health data and will motivate you to reach your goals.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    ...ELEVATION_STYLES.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  actionButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noteText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    fontStyle: 'italic'
  }
});

export default NotificationsScreen; 