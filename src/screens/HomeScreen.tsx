import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { COLORS, SIZES, ELEVATION_STYLES } from '../constants';
import { getCurrentUser } from '../services/firebase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useBluetooth } from '../contexts/BluetoothContext';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import bluetoothService from '../services/bluetooth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAllHealthData, STORAGE_KEYS } from '../utils/healthDataUtils';

// Import default profile image
const DEFAULT_PROFILE = require('../assets/images/default-profile.png');
const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  // Theme hooks - placed at the top level
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // State hooks - also at the top level
  const [userName, setUserName] = useState('Dipesh Tabdar');
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // Cached data state for when device is not connected
  const [cachedHealthData, setCachedHealthData] = useState({
    steps: 0,
    heartRate: 0,
    sleep: 0,
    cycling: 0
  });
  
  // Bluetooth context hook - at the top level
  const { 
    selectedDevice, 
    deviceData, 
    syncDeviceData, 
    connectionError,
    disconnectDevice,
    isBluetoothEnabled,
    hasHistoricalData
  } = useBluetooth();
  
  // Derived values - not hooks, so they can be after hooks
  const isDeviceConnected = selectedDevice?.connected || false;
  
  // Values from device data - not hooks
  const heartRate = deviceData?.heartRate || cachedHealthData.heartRate || 0;
  const steps = deviceData?.steps || cachedHealthData.steps || 0;
  const sleepHours = deviceData?.sleep?.totalSleep || cachedHealthData.sleep || 0; 
  const distance = deviceData?.distance || cachedHealthData.cycling || 0;
  const calories = deviceData?.calories || 0;
  const bloodOxygen = deviceData?.bloodOxygen || 0;
  const battery = deviceData?.battery || 0;
  
  // Load cached health data from AsyncStorage
  useEffect(() => {
    const loadCachedHealthData = async () => {
      try {
        // Load all health data
        const data = await loadAllHealthData();
        
        if (data) {
          const cached = {
            steps: data.currentSteps || 0,
            heartRate: data.currentHeartRate || 0,
            sleep: 0,
            cycling: 0
          };
          
          // Get sleep data if available
          try {
            const sleepJson = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP_HISTORY);
            if (sleepJson) {
              const sleepData = JSON.parse(sleepJson);
              // Get the last item in the sleep history array
              if (sleepData && sleepData.length > 0) {
                const lastSleep = sleepData[sleepData.length - 1];
                cached.sleep = lastSleep;
              }
            }
          } catch (error) {
            console.error('Error loading sleep data:', error);
          }
          
          // Get cycling data if available
          try {
            const cyclingJson = await AsyncStorage.getItem(STORAGE_KEYS.CYCLING_HISTORY);
            if (cyclingJson) {
              const cyclingData = JSON.parse(cyclingJson);
              // Get the last item in the cycling history array
              if (cyclingData && cyclingData.length > 0) {
                const lastCycling = cyclingData[cyclingData.length - 1];
                cached.cycling = lastCycling;
              }
            }
          } catch (error) {
            console.error('Error loading cycling data:', error);
          }
          
          setCachedHealthData(cached);
        }
      } catch (error) {
        console.error('Error loading cached health data:', error);
      }
    };
    
    // Load cached data if device is not connected
    if (!isDeviceConnected || !deviceData) {
      loadCachedHealthData();
    }
  }, [isDeviceConnected, deviceData]);
  
  // Update lastSyncTime when deviceData changes
  useEffect(() => {
    if (deviceData?.lastSynced) {
      setLastSyncTime(deviceData.lastSynced);
    }
  }, [deviceData]);
  
  // Format the last sync time display string
  const getLastSyncText = () => {
    if (!lastSyncTime) return 'Not synced';
    
    const now = new Date();
    const syncDate = new Date(lastSyncTime);
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };
  
  // Define the refresh function as a callback at the top level
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await syncDeviceData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [syncDeviceData]);
  
  // Use another ref for tracking sync attempts
  const syncRef = useRef({
    lastSync: 0,
    isSyncing: false
  });
  
  useEffect(() => {
    // Attempt to load user profile data
    const loadUserProfile = async () => {
      try {
      const user = getCurrentUser();
      if (user) {
        setUserName(user.displayName || 'User');
          
          // First check AsyncStorage for cached profile image
          try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const cachedImage = await AsyncStorage.getItem(`profileImage_${user.uid}`);
            
            if (cachedImage) {
              console.log('Found cached profile image, using it');
              setProfileImage({ uri: cachedImage });
              return;
            }
          } catch (cacheError) {
            console.log('Error accessing cached profile image:', cacheError);
          }
          
          // Check if user has a profile image from Firebase Auth
        if (user.photoURL) {
            console.log('Using profile image from Firebase:', user.photoURL);
          setProfileImage({ uri: user.photoURL });
          } else {
            console.log('No profile image found, using default');
            setProfileImage(DEFAULT_PROFILE);
          }
        }
      } catch (error) {
        console.log('Error loading user profile, using default image');
        setProfileImage(DEFAULT_PROFILE);
      }
    };
    
    loadUserProfile();
    
    // Set up a listener to update the profile when the component is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserProfile();
    });
    
    // Clean up the listener
    return unsubscribe;
  }, [navigation]);
  
  // Function to sync data from the device
  const syncData = useCallback(async () => {
    if (!isDeviceConnected) {
      console.log('Cannot sync: Device not connected');
      return;
    }
    
    try {
      console.log('Manual sync requested');
      await syncDeviceData();
    } catch (error) {
      console.error('Manual sync error:', error);
    }
  }, [isDeviceConnected, syncDeviceData]);
  
  // Sync data when component mounts if device is connected
  useEffect(() => {
    if (isDeviceConnected) {
      console.log('Device connected, initiating sync');
      // Add a small delay to ensure connection is stable before syncing
      const syncTimer = setTimeout(() => {
      syncData();
      }, 2000);
      
      return () => clearTimeout(syncTimer);
    }
  }, [isDeviceConnected, syncData]);
  
  // Always try to sync when the component mounts
  useEffect(() => {
    let mounted = true;
    let syncTimerId = null;
    let errorRetryTimerId = null;

    // Define sync function inside the effect
    const syncData = async () => {
      // Don't sync if not mounted or already syncing or no device
      if (!mounted || syncRef.current.isSyncing || !isDeviceConnected) {
        return;
      }
      
      try {
        // Set syncing flag
        syncRef.current.isSyncing = true;
        
        // Only sync if it's been more than 15 seconds since last sync (reduced from 30)
        const now = Date.now();
        if (now - syncRef.current.lastSync > 15000) {
          console.log('Auto-syncing device data');
          await syncDeviceData();
          syncRef.current.lastSync = now;
          
          // Add extra console log to confirm sync completion
          console.log('Auto-sync completed successfully');
        }
      } catch (error) {
        console.error('Error syncing data:', error);
        
        // If we got an error, try again after a short delay (auto-recovery)
        if (mounted && isDeviceConnected) {
          errorRetryTimerId = setTimeout(() => {
            console.log('Attempting recovery sync after error');
            syncData();
          }, 10000); // Retry in 10 seconds after error
        }
      } finally {
        if (mounted) {
          syncRef.current.isSyncing = false;
        }
      }
    };
    
    // Check if device is connected and Bluetooth is enabled
    if (isDeviceConnected && isBluetoothEnabled) {
      // Run initial sync with a slight delay to ensure connection is ready
      setTimeout(() => {
      syncData();
      }, 3000);
      
      // Set up periodic sync - every 30 seconds instead of every minute
      syncTimerId = setInterval(() => {
        syncData();
      }, 30000);
    }
    
    return () => {
      mounted = false;
      if (syncTimerId) {
        clearInterval(syncTimerId);
      }
      if (errorRetryTimerId) {
        clearTimeout(errorRetryTimerId);
      }
    };
  }, [isDeviceConnected, syncDeviceData, isBluetoothEnabled]);
  
  // Add listener for screen focus to refresh data when returning to screen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Check if device is connected before trying to sync
      if (isDeviceConnected) {
        console.log('Screen focused, initiating sync');
        syncData();
      }
    });
    
    return unsubscribe;
  }, [navigation, isDeviceConnected, syncData]);
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
        {/* Header with Gradient Background */}
        <LinearGradient
          colors={['#5E60CE', '#6930C3', '#7400B8']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.headerGradient}
        >
          <View style={styles.welcomeContainer}>
            <View>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.nameText}>{userName}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ProfileAccount')}>
              <View style={styles.profileCircle}>
              <Image
                source={profileImage}
                style={styles.profileImage}
                defaultSource={DEFAULT_PROFILE}
                onError={async (e) => {
                  console.log('Failed to load profile image:', e.nativeEvent.error);
                  // Try to get the cached image as fallback
                  try {
                    const user = getCurrentUser();
                    if (user) {
                      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                      const cachedImage = await AsyncStorage.getItem(`profileImage_${user.uid}`);
                      if (cachedImage) {
                        console.log('Using cached image as fallback after load error');
                        setProfileImage({ uri: cachedImage });
                        return;
                      }
                    }
                  } catch (error) {
                    console.log('Error getting cached image:', error);
                  }
                  
                  // If all else fails, use default
                  setProfileImage(DEFAULT_PROFILE);
                }}
              />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
          
        {/* Device Connection Card */}
        <View style={styles.sectionContainer}>
          <TouchableOpacity 
            style={[styles.deviceCard, { backgroundColor: colors.surface }]}
            onPress={() => navigation.navigate('DeviceConnect')}
          >
            <View style={[styles.deviceIconContainer, { 
              backgroundColor: isDeviceConnected 
                ? (isDarkMode ? '#1B3A27' : '#DCFCE7') 
                : (isDarkMode ? '#2D1E24' : '#FEE2E2') 
            }]}>
              <Feather 
                name="bluetooth" 
                size={24} 
                color={isDeviceConnected ? '#10B981' : '#FF6B6B'} 
              />
            </View>
            <View style={styles.deviceTextContainer}>
              <Text style={[styles.deviceTitle, { color: colors.text }]}>
                {isDeviceConnected 
                  ? (selectedDevice?.name || 'Smart Ring Connected') 
                  : 'No Ring Connected'}
              </Text>
              <Text style={[styles.deviceSubtitle, { color: colors.textSecondary }]}>
                {isDeviceConnected 
                  ? (battery > 0 ? `Battery: ${battery}%` : 'Connected') 
                  : (hasHistoricalData ? 'Showing saved data' : 'Tap to connect your device')}
              </Text>
              {!isDeviceConnected && hasHistoricalData && (
                <Text style={styles.cachedDataInfo}>
                  Last synced: {getLastSyncText()}
                </Text>
              )}
            </View>
            <Feather 
              name={isDeviceConnected ? "check-circle" : "chevron-right"} 
              size={24} 
              color={isDeviceConnected ? '#10B981' : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>

        {/* Health Metrics Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Health Metrics</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {/* Health Metrics Grid */}
          <View style={styles.metricsGrid}>
            {/* Heart Rate Card */}
            <TouchableOpacity 
              style={[styles.metricCard, { backgroundColor: colors.cardHeart }]}
              onPress={() => navigation.navigate('HeartRate')}
            >
              <View style={[styles.metricIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)' }]}>
                <Icon name="heart-pulse" size={24} color={colors.chartRed} />
              </View>
              <Text style={[styles.metricTitle, { color: colors.text }]}>Heart Rate</Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {heartRate > 0 ? heartRate : '--'}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>bpm</Text>
              </View>
              
            </TouchableOpacity>

            {/* Steps Card */}
            <TouchableOpacity 
              style={[styles.metricCard, { backgroundColor: colors.cardSteps }]}
              onPress={() => navigation.navigate('Steps')}
            >
              <View style={[styles.metricIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)' }]}>
                <Icon name="shoe-print" size={24} color={colors.chartPurple} />
              </View>
              <Text style={[styles.metricTitle, { color: colors.text }]}>Steps</Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {steps > 0 ? steps : '--'}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>steps</Text>
              </View>
              
            </TouchableOpacity>

            {/* Sleep Card */}
            <TouchableOpacity 
              style={[styles.metricCard, { backgroundColor: colors.cardSleep }]}
              onPress={() => navigation.navigate('Sleep')}
            >
              <View style={[styles.metricIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)' }]}>
                <Icon name="sleep" size={24} color={colors.chartBlue} />
              </View>
              <Text style={[styles.metricTitle, { color: colors.text }]}>Sleep</Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {sleepHours > 0 ? sleepHours.toFixed(1) : '--'}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>hrs</Text>
              </View>

            </TouchableOpacity>
          
            {/* Cycling Card */}
            <TouchableOpacity 
              style={[styles.metricCard, { backgroundColor: colors.cardCycling }]}
              onPress={() => navigation.navigate('Cycling')}
            >
              <View style={[styles.metricIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)' }]}>
                <Icon name="bike" size={24} color={colors.chartGreen} />
              </View>
              <Text style={[styles.metricTitle, { color: colors.text }]}>Cycling</Text>
              <View style={styles.metricValueContainer}>
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {distance > 0 ? distance.toFixed(1) : '--'}
                </Text>
                <Text style={[styles.metricUnit, { color: colors.textSecondary }]}>km</Text>
              </View>
              
            </TouchableOpacity>
          </View>
          

          </View>
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Increased from 80 to 100 to give more space for tab bar
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  sectionContainer: {
    padding: 20,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    ...ELEVATION_STYLES.small,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deviceTextContainer: {
    flex: 1,
  },
  deviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  deviceSubtitle: {
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 60) / 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...ELEVATION_STYLES.small,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  metricUnit: {
    fontSize: 14,
    marginLeft: 4,
    marginBottom: 2,
  },
  dataNoticeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  dataNoticeText: {
    fontSize: 12,
    color: '#FFA500',
    marginLeft: 8,
    flex: 1,
  },
});

export default HomeScreen; 