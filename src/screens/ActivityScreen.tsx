import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { COLORS, SIZES, ELEVATION_STYLES, SCREENS } from '../constants';
import { useBluetooth } from '../contexts/BluetoothContext';
import bluetoothService from '../services/bluetooth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { safeNavigate } from '../utils/navigationUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  STORAGE_KEYS, 
  saveAllHealthData, 
  loadAllHealthData
} from '../utils/healthDataUtils';
import CustomLineChart from '../components/CustomLineChart';

interface ActivityScreenProps {
  navigation: any;
  route: any;
}

const ActivityScreen: React.FC<ActivityScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<string>('Daily');
  const [stepsHistory, setStepsHistory] = useState<number[]>([100, 250, 400, 600, 800, 1050]);
  const [stepsLabels, setStepsLabels] = useState<string[]>(['6AM', '9AM', '12PM', '3PM', '6PM', '9PM']);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([72, 75, 80, 78, 82, 79]);
  const [heartRateLabels, setHeartRateLabels] = useState<string[]>(['6AM', '9AM', '12PM', '3PM', '6PM', '9PM']);
  const [sleepHistory, setSleepHistory] = useState<number[]>([2, 4, 7, 5, 6, 8]);
  const [sleepLabels, setSleepLabels] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [cyclingHistory, setCyclingHistory] = useState<number[]>([1, 3, 5, 2, 4, 6]);
  const [cyclingLabels, setCyclingLabels] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [stepsGoal, setStepsGoal] = useState<number>(10000);
  const [currentSteps, setCurrentSteps] = useState<number>(2000);
  const [heartRateGoal] = useState<number>(70);
  const [currentHeartRate, setCurrentHeartRate] = useState<number>(71);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [heartRateMonitorActive, setHeartRateMonitorActive] = useState<boolean>(false);
  const [bloodOxygenMonitorActive, setBloodOxygenMonitorActive] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(3); // Notification counter
  
  // Access data from the BluetoothContext
  const { selectedDevice } = useBluetooth();

  // Check if device is connected
  const isDeviceConnected = selectedDevice?.connected || false;

  // Get theme colors
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  // Load cached data from AsyncStorage
  const loadCachedData = async () => {
    try {
      const cachedData = await loadAllHealthData();
      
      if (cachedData) {
        if (cachedData.activeTab) setActiveTab(cachedData.activeTab);
        if (cachedData.stepsHistory) setStepsHistory(cachedData.stepsHistory);
        if (cachedData.stepsLabels) setStepsLabels(cachedData.stepsLabels);
        if (cachedData.heartRateHistory) setHeartRateHistory(cachedData.heartRateHistory);
        if (cachedData.heartRateLabels) setHeartRateLabels(cachedData.heartRateLabels);
        if (cachedData.sleepHistory) setSleepHistory(cachedData.sleepHistory);
        if (cachedData.sleepLabels) setSleepLabels(cachedData.sleepLabels);
        if (cachedData.cyclingHistory) setCyclingHistory(cachedData.cyclingHistory);
        if (cachedData.cyclingLabels) setCyclingLabels(cachedData.cyclingLabels);
        if (cachedData.currentSteps) setCurrentSteps(cachedData.currentSteps);
        if (cachedData.currentHeartRate) setCurrentHeartRate(cachedData.currentHeartRate);
        if (cachedData.lastUpdated) setLastUpdated(cachedData.lastUpdated);
      }
      
      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };

  // Save data to AsyncStorage
  const cacheData = async () => {
    try {
      const timestamp = await saveAllHealthData({
        activeTab,
        stepsHistory,
        stepsLabels,
        heartRateHistory,
        heartRateLabels,
        sleepHistory,
        sleepLabels,
        cyclingHistory,
        cyclingLabels,
        currentSteps,
        currentHeartRate
      });
      
      if (timestamp) {
        setLastUpdated(timestamp);
      }
    } catch (error) {
      console.error('Error caching data:', error);
    }
  };

  // Function to load real-time data from the device
  const loadRealTimeData = useCallback(async () => {
    try {
      if (!isDeviceConnected) {
        console.log('No device connected, only showing previously cached data');
        return;
      }
      
      // Get step count data
      try {
        const stepData = await bluetoothService.getStepCount();
        if (stepData && stepData.steps > 0) {
          setCurrentSteps(stepData.steps);
          
          // Store in history at the most recent time slot
          if (stepsHistory.length > 0) {
            const newHistory = [...stepsHistory];
            newHistory[newHistory.length - 1] = stepData.steps;
            setStepsHistory(newHistory);
          }
        }
      } catch (error) {
        console.error('Error fetching step data:', error);
      }
      
      // Start real-time heart rate monitor
      if (!heartRateMonitorActive) {
        try {
          const stopHeartRateMonitor = await bluetoothService.startRealtimeHeartRate((heartRate) => {
            setCurrentHeartRate(heartRate);
            
            // Store in history at the most recent time slot
            if (heartRateHistory.length > 0) {
              const newHistory = [...heartRateHistory];
              newHistory[newHistory.length - 1] = heartRate;
              setHeartRateHistory(newHistory);
            }
          });
          
          setHeartRateMonitorActive(true);
          
          // Stop monitoring after 10 seconds
          setTimeout(() => {
            stopHeartRateMonitor();
            setHeartRateMonitorActive(false);
          }, 10000);
        } catch (error) {
          console.error('Error with heart rate monitoring:', error);
        }
      }
      
      // Get sleep data (if implemented in bluetoothService)
      try {
        const sleepData = await bluetoothService.getSleepData();
        if (sleepData && sleepData.totalSleep > 0) {
          // Store in history at the most recent time slot
          if (sleepHistory.length > 0) {
            const newHistory = [...sleepHistory];
            newHistory[newHistory.length - 1] = sleepData.totalSleep;
            setSleepHistory(newHistory);
          }
        }
      } catch (error) {
        console.error('Error fetching sleep data:', error);
      }
      
      // Get cycling data (if implemented in bluetoothService)
      try {
        const cyclingData = await bluetoothService.getCyclingData();
        if (cyclingData && cyclingData.distance > 0) {
          // Store in history at the most recent time slot
          if (cyclingHistory.length > 0) {
            const newHistory = [...cyclingHistory];
            newHistory[newHistory.length - 1] = cyclingData.distance;
            setCyclingHistory(newHistory);
          }
        }
      } catch (error) {
        console.error('Error fetching cycling data:', error);
      }
      
      // Cache the updated data
      cacheData();
    } catch (error) {
      console.error('Error loading data from ring:', error);
      
      if (isDeviceConnected) {
        Alert.alert('Error', 'Failed to load data from your ring.');
      }
    }
  }, [isDeviceConnected, activeTab, heartRateMonitorActive, bloodOxygenMonitorActive, stepsHistory, heartRateHistory, sleepHistory, cyclingHistory]);

  // Load data when component mounts or device connection changes
  useEffect(() => {
    // Create a setup function to handle async loading
    const setupData = async () => {
      try {
        // First try to load cached data immediately
        if (!dataLoaded) {
          setIsLoading(true);
          await loadCachedData();
          setDataLoaded(true);
          setIsLoading(false);
        }
        
        // Then load real-time data in the background WITHOUT showing loading indicator
        if (isDeviceConnected) {
          setIsRefreshing(true);
          await loadRealTimeData().finally(() => {
            setIsRefreshing(false);
          });
        }
      } catch (error) {
        console.error('Error setting up data:', error);
        setIsLoading(false);
      }
    };
    
    // Run the setup
    setupData();
    
    // Set up refresh interval
    const refreshInterval = setInterval(() => {
      if (isDeviceConnected && !isLoading && !isRefreshing) {
        setIsRefreshing(true);
        loadRealTimeData().finally(() => {
          setIsRefreshing(false);
        });
      }
    }, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, [isDeviceConnected, loadRealTimeData]);

  // Save data when tab changes
  useEffect(() => {
    if (dataLoaded) {
      cacheData();
    }
  }, [activeTab]);
  
  // Handle tab change without generating fake data
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Only cache the updated tab preference
    cacheData();
  };
  
  const getStepsProgress = () => {
    return Math.min((currentSteps / stepsGoal) * 100, 100);
  };
  
  const getHeartRateProgress = () => {
    // For the UI, we'll show 99% as in the image
    return 99;
  };
  
  // Function to handle refreshing manually
  const handleRefresh = () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    loadRealTimeData().finally(() => {
      setIsRefreshing(false);
    });
  };
  
  const navigateToDetails = (screen: string) => {
    console.log(`Attempting to navigate to screen: ${screen}`);
    
    // Debug check if the screen is available
    const screenExists = () => {
      try {
        const availableScreens = navigation.dangerouslyGetState?.() 
          ? navigation.dangerouslyGetState().routeNames 
          : navigation.getState?.() 
            ? navigation.getState().routeNames 
            : ['unknown'];
        
        console.log('Available screens:', JSON.stringify(availableScreens));
        return availableScreens.includes(screen);
      } catch (error) {
        console.error('Error checking available screens:', error);
        return false;
      }
    };
    
    const exists = screenExists();
    console.log(`Screen ${screen} exists in navigation state: ${exists}`);
    
    // Use our safe navigation utility
    if (screen === SCREENS.SLEEP) {
      return safeNavigate(navigation, 'Sleep');
    } else if (screen === SCREENS.STEPS) {
      return safeNavigate(navigation, 'Steps');
    } else if (screen === SCREENS.HEART_RATE) {
      return safeNavigate(navigation, 'HeartRate');
    } else if (screen === SCREENS.CYCLING) {
      return safeNavigate(navigation, 'Cycling');
    } else {
      console.error('Unknown screen:', screen);
      return false;
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Loading indicator at the top when refreshing */}
      {isRefreshing && (
        <View style={styles.refreshingIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.refreshingText}>Syncing with ring...</Text>
        </View>
      )}
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Activity</Text>
        <TouchableOpacity 
          onPress={() => {
            navigation.navigate('Notifications');
            setUnreadNotifications(0); // Reset notification count when visiting notifications
          }}
          style={styles.notificationButton}
        >
          <IonIcon name="notifications-outline" size={24} color={colors.text} />
            {unreadNotifications > 0 && (
    <View style={[styles.notificationBadge, { backgroundColor: colors.danger }]}>
      <Text style={styles.notificationBadgeText}>
        {unreadNotifications > 9 ? '9+' : unreadNotifications}
      </Text>
    </View>
  )}
        </TouchableOpacity>
      </View>
      
      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === 'Daily' && [
              styles.activeTab, 
              { backgroundColor: colors.primary }
            ]
          ]}
          onPress={() => handleTabChange('Daily')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'Daily' && [
                styles.activeTabText, 
                { color: '#FFFFFF' }
              ],
              { color: activeTab === 'Daily' ? '#FFFFFF' : colors.textSecondary }
            ]}
          >
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === 'Weekly' && [
              styles.activeTab, 
              { backgroundColor: colors.primary }
            ]
          ]}
          onPress={() => handleTabChange('Weekly')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'Weekly' && [
                styles.activeTabText, 
                { color: '#FFFFFF' }
              ],
              { color: activeTab === 'Weekly' ? '#FFFFFF' : colors.textSecondary }
            ]}
          >
            Weekly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab, 
            activeTab === 'Monthly' && [
              styles.activeTab, 
              { backgroundColor: colors.primary }
            ]
          ]}
          onPress={() => handleTabChange('Monthly')}
        >
          <Text 
            style={[
              styles.tabText, 
              activeTab === 'Monthly' && [
                styles.activeTabText, 
                { color: '#FFFFFF' }
              ],
              { color: activeTab === 'Monthly' ? '#FFFFFF' : colors.textSecondary }
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>
      </View>
      
      {stepsHistory.length === 0 && !isDeviceConnected ? (
        <View style={styles.noDeviceContainer}>
          <FeatherIcon name="bluetooth" size={80} color={colors.primary} />
          <Text style={[styles.noDeviceText, { color: colors.text }]}>No Ring Connected</Text>
          <Text style={[styles.noDeviceSubtext, { color: colors.textSecondary }]}>
            Connect your Colmi R02 Ring to view your activity data
          </Text>
          <TouchableOpacity 
            style={[styles.connectButtonLarge, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('DeviceConnect')}
          >
            <Text style={styles.connectButtonLargeText}>Connect Ring</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
          {!isDeviceConnected && (
            <View style={[styles.offlineNoteContainer, { backgroundColor: colors.cardCycling }]}>
              <FeatherIcon name="bluetooth-off" size={18} color={colors.text} />
              <Text style={[styles.offlineNoteText, { color: colors.text }]}>
                Showing data from last connection • {lastUpdated}
              </Text>
              <TouchableOpacity 
                style={styles.connectButton}
                onPress={() => navigation.navigate('DeviceConnect')}
              >
                <Text style={[styles.connectButtonText, { color: colors.primary }]}>Connect</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Steps Card */}
            <TouchableOpacity
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
            onPress={() => navigateToDetails(SCREENS.STEPS)}
          >
            <View style={styles.metricHeader}>
              <View style={styles.metricTitleSection}>
                <View style={[styles.iconBackground, { backgroundColor: colors.cardSteps }]}>
                  <Icon 
                    name="shoe-print" 
                    size={28} 
                    color={colors.chartOrange} 
                  />
                </View>
                <View>
                  <Text style={[styles.metricTitle, { color: colors.text }]}>Steps Overview</Text>
                  <Text style={[styles.metricValue, { color: colors.textSecondary }]}>{currentSteps} steps</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.detailsButton} onPress={() => navigateToDetails(SCREENS.STEPS)}>
                <Text style={{ color: colors.chartOrange, ...styles.detailsText }}>Details</Text>
                <FeatherIcon name="chevron-right" size={16} color={colors.chartOrange} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.divider }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getStepsProgress()}%`, backgroundColor: colors.chartOrange }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>{getStepsProgress().toFixed(0)}% of daily goal</Text>
          </View>
            
            <CustomLineChart 
              data={stepsHistory} 
              labels={stepsLabels} 
              color={colors.chartOrange} 
              height={160}
            />
            
            <Text style={[styles.tapForMore, { color: colors.textSecondary }]}>Tap for detailed view</Text>
          </TouchableOpacity>
          
          {/* Heart Rate Card */}
          <TouchableOpacity 
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
            onPress={() => navigateToDetails(SCREENS.HEART_RATE)}
          >
            <View style={styles.metricHeader}>
              <View style={styles.metricTitleSection}>
                <View style={[styles.iconBackground, { backgroundColor: colors.cardHeart }]}>
                  <Icon 
                    name="heart-pulse" 
                    size={28} 
                    color={colors.chartRed} 
                  />
                </View>
                <View>
                  <Text style={[styles.metricTitle, { color: colors.text }]}>Heart Rate</Text>
                  <Text style={[styles.metricValue, { color: colors.textSecondary }]}>{currentHeartRate} bpm</Text>
          </View>
        </View>
              <TouchableOpacity style={styles.detailsButton} onPress={() => navigateToDetails(SCREENS.HEART_RATE)}>
                <Text style={{ color: colors.chartRed, ...styles.detailsText }}>Details</Text>
                <FeatherIcon name="chevron-right" size={16} color={colors.chartRed} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.divider }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${getHeartRateProgress()}%`, backgroundColor: colors.chartRed }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>{getHeartRateProgress()}% of daily goal</Text>
            </View>
            
            <CustomLineChart 
              data={heartRateHistory} 
              labels={heartRateLabels} 
              color={colors.chartRed} 
              height={160}
            />
            
            <Text style={[styles.tapForMore, { color: colors.textSecondary }]}>Tap for detailed view</Text>
          </TouchableOpacity>
          
          {/* Cycling Card */}
            <TouchableOpacity
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
            onPress={() => navigateToDetails(SCREENS.CYCLING)}
          >
            <View style={styles.metricHeader}>
              <View style={styles.metricTitleSection}>
                <View style={[styles.iconBackground, { backgroundColor: colors.cardCycling }]}>
                  <Icon name="bike" size={28} color={colors.chartGreen} />
                </View>
                <View>
                  <Text style={[styles.metricTitle, { color: colors.text }]}>Cycling</Text>
                  <Text style={[styles.metricValue, { color: colors.textSecondary }]}>{cyclingHistory[cyclingHistory.length-1]} km</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.detailsButton} onPress={() => navigateToDetails(SCREENS.CYCLING)}>
                <Text style={{ color: colors.chartGreen, ...styles.detailsText }}>Details</Text>
                <FeatherIcon name="chevron-right" size={16} color={colors.chartGreen} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { backgroundColor: colors.divider }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: '75%', backgroundColor: colors.chartGreen }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, { color: colors.textSecondary }]}>75% of daily goal</Text>
          </View>
            
            <CustomLineChart 
              data={cyclingHistory} 
              labels={cyclingLabels} 
              color={colors.chartGreen} 
              height={160}
            />
            
            <Text style={[styles.tapForMore, { color: colors.textSecondary }]}>Tap for detailed view</Text>
          </TouchableOpacity>
          
          {/* Sleep Card */}
          <TouchableOpacity 
            style={[styles.metricCard, { backgroundColor: colors.surface }]}
            onPress={() => {
              console.log('Sleep card pressed');
              safeNavigate(navigation, 'Sleep');
            }}
          >
            <View style={styles.metricHeader}>
              <View style={styles.metricTitleSection}>
                <View style={[styles.iconBackground, { backgroundColor: colors.cardSleep }]}>
                  <FeatherIcon name="moon" size={24} color={colors.chartBlue} />
                </View>
                <View>
                  <Text style={[styles.metricTitle, { color: colors.text }]}>Sleep</Text>
                  <Text style={[styles.metricValue, { color: colors.textSecondary }]}>{sleepHistory[sleepHistory.length-1]} hours</Text>
          </View>
        </View>
              <TouchableOpacity style={styles.detailsButton} onPress={() => {
                console.log('Sleep details button pressed');
                safeNavigate(navigation, 'Sleep');
              }}>
                <Text style={{ color: colors.chartBlue, ...styles.detailsText }}>Details</Text>
                <FeatherIcon name="chevron-right" size={16} color={colors.chartBlue} />
              </TouchableOpacity>
            </View>
            
            <CustomLineChart 
              data={sleepHistory} 
              labels={sleepLabels} 
              color={colors.chartBlue} 
              height={160}
            />
            
            <Text style={[styles.tapForMore, { color: colors.textSecondary }]}>Tap for detailed view</Text>
          </TouchableOpacity>
      </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 8 : 0,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 50,
    padding: 5,
    ...ELEVATION_STYLES.small,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 50,
  },
  activeTab: {
    ...ELEVATION_STYLES.small,
  },
  tabText: {
    color: '#9E9E9E',
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 140,
  },
  metricCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...ELEVATION_STYLES.small,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  metricTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  metricIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  metricTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricValue: {
    fontSize: 16,
    marginTop: 2,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 5,
  },
  progressBarContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 5,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'right',
  },
  chartContainer: {
    marginBottom: 10,
  },
  tapForMore: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
  },
  noDeviceContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDeviceText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  noDeviceSubtext: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  connectButtonLarge: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  connectButtonLargeText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  offlineNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    marginBottom: 20,
    borderRadius: 10,
    opacity: 0.8,
  },
  offlineNoteText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 10,
  },
  connectButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  connectButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF3B30', // Using a fixed color instead of dynamic colors.danger
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  refreshingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 5,
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  refreshingText: {
    fontSize: 12,
    marginLeft: 8,
    color: '#666',
    fontWeight: '500',
  },
});

export default ActivityScreen; 