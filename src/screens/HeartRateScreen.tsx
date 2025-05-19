import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  Dimensions,
  Animated,
  Platform
} from 'react-native';
import { useBluetooth } from '../contexts/BluetoothContext';
import bluetoothService from '../services/bluetooth';
import { COLORS, SIZES, ELEVATION_STYLES } from '../constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { 
  STORAGE_KEYS, 
  loadAllHealthData, 
  saveAllHealthData, 
  generateHistoricalData 
} from '../utils/healthDataUtils';
import CustomLineChart from '../components/CustomLineChart';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateChartLabels } from '../utils/goalsUtils';

interface HeartRateScreenProps {
  navigation: any;
  route: any;
}

interface HeartRateData {
  timestamp: Date;
  value: number;
}

// Add type for heart rate events
interface HeartRateEvent {
  timestamp: Date;
  value: number;
  source: 'manual' | 'auto';
}

// Heart pulsing animation component 
const PulsingHeart = () => {
  console.log('Rendering PulsingHeart');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    console.log('Setting up pulse animation');
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      // Proper cleanup
      pulseAnim.stopAnimation();
    };
  }, [pulseAnim]);
  
  return (
    <Animated.View
      style={{
        transform: [{ scale: pulseAnim }],
      }}
    >
      <Icon name="heart-pulse" size={32} color="#FF5E5E" />
    </Animated.View>
  );
};

const HeartRateScreen: React.FC<HeartRateScreenProps> = ({ navigation, route }) => {
  const [activeTab, setActiveTab] = useState<string>('Daily');
  const [loading, setLoading] = useState<boolean>(true);
  const [heartRateData, setHeartRateData] = useState<HeartRateData[]>([]);
  const [currentHeartRate, setCurrentHeartRate] = useState<number>(0);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [restingHeartRate, setRestingHeartRate] = useState<number>(62);
  const [maxHeartRate, setMaxHeartRate] = useState<number>(0);
  const [minHeartRate, setMinHeartRate] = useState<number>(200);
  const [avgHeartRate, setAvgHeartRate] = useState<number>(0);
  const [heartRateLabels, setHeartRateLabels] = useState<string[]>([]);
  const [heartRateHistory, setHeartRateHistory] = useState<number[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [autoMonitoringEnabled, setAutoMonitoringEnabled] = useState<boolean>(true);
  const [lastAutoMonitorTime, setLastAutoMonitorTime] = useState<number>(0);
  const [heartRateEvents, setHeartRateEvents] = useState<HeartRateEvent[]>([]);
  const [showEventsHistory, setShowEventsHistory] = useState<boolean>(false);
  
  // Theme and device state
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  const { selectedDevice } = useBluetooth();
  const isDeviceConnected = selectedDevice?.connected || false;
  
  // Timer reference for auto monitoring
  const autoMonitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get screen dimensions for chart
  const screenWidth = Dimensions.get('window').width - 32;

  // Line chart data
  const getChartData = () => {
    // Use cached/generated data for consistency
    return {
      labels: heartRateLabels,
      datasets: [
        {
          data: heartRateHistory.length > 0 ? heartRateHistory : [72],
          color: () => colors.chartRed,
          strokeWidth: 3
        }
      ],
      legend: ['Heart Rate (BPM)']
    };
  };
  
  // Load cached data from AsyncStorage
  const loadCachedData = async () => {
    try {
      const cachedData = await loadAllHealthData();
      
      if (cachedData) {
        if (cachedData.activeTab) setActiveTab(cachedData.activeTab);
        if (cachedData.heartRateHistory) setHeartRateHistory(cachedData.heartRateHistory);
        if (cachedData.heartRateLabels) setHeartRateLabels(cachedData.heartRateLabels);
        if (cachedData.currentHeartRate) setCurrentHeartRate(cachedData.currentHeartRate);
        if (cachedData.lastUpdated) setLastUpdated(cachedData.lastUpdated);
        
        // Set derived stats
        if (cachedData.heartRateHistory && cachedData.heartRateHistory.length > 0) {
          const rates = cachedData.heartRateHistory;
          setMaxHeartRate(Math.max(...rates));
          setMinHeartRate(Math.min(...rates));
          setAvgHeartRate(Math.round(rates.reduce((a, b) => a + b, 0) / rates.length));
        }
        
        setDataLoaded(true);
      }
    } catch (error) {
      console.error('Error loading cached heart rate data:', error);
    }
  };
  
  // Save data to cache
  const saveDataToCache = async () => {
    try {
      const timestamp = await saveAllHealthData({
        activeTab,
        heartRateHistory,
        heartRateLabels,
        currentHeartRate
      });
      
      if (timestamp) {
        setLastUpdated(timestamp);
      }
    } catch (error) {
      console.error('Error saving heart rate data to cache:', error);
    }
  };
  
  // Save heart rate event
  const saveHeartRateEvent = (value: number, source: 'manual' | 'auto') => {
    const newEvent: HeartRateEvent = {
      timestamp: new Date(),
      value,
      source
    };
    
    // Add to events list
    setHeartRateEvents(prevEvents => {
      // Keep up to 50 events
      const updatedEvents = [newEvent, ...prevEvents];
      if (updatedEvents.length > 50) {
        return updatedEvents.slice(0, 50);
      }
      return updatedEvents;
    });
    
    // Store events in AsyncStorage
    AsyncStorage.setItem('heartRateEvents', JSON.stringify(
      heartRateEvents.map(event => ({
        timestamp: event.timestamp.toISOString(),
        value: event.value,
        source: event.source
      }))
    )).catch(err => console.error('Error saving heart rate events:', err));
  };
  
  // Load heart rate events from AsyncStorage
  const loadHeartRateEvents = async () => {
    try {
      const eventsJson = await AsyncStorage.getItem('heartRateEvents');
      if (eventsJson) {
        const parsedEvents = JSON.parse(eventsJson);
        // Convert string timestamps back to Date objects
        setHeartRateEvents(
          parsedEvents.map((event: any) => ({
            timestamp: new Date(event.timestamp),
            value: event.value,
            source: event.source
          }))
        );
      }
    } catch (error) {
      console.error('Error loading heart rate events:', error);
    }
  };
  
  // Format timestamp for display
  const formatEventTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    }) + ', ' + date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Function to start real-time heart rate monitoring
  const startHeartRateMonitoring = useCallback(async (isAuto = false) => {
    if (!isDeviceConnected) {
      setError('No device connected');
      setLoading(false);
      return;
    }
    
    try {
      if (!isAuto) {
        // Only show monitoring state for manual requests
      setIsMonitoring(true);
      }
      setError(null);
      
      // Store current time for auto-monitoring tracking
      const monitorStartTime = Date.now();
      if (isAuto) {
        setLastAutoMonitorTime(monitorStartTime);
      }
      
      // Create a buffer to smooth heart rate values
      const heartRateBuffer: number[] = [];
      const bufferSize = 3; // Use last 3 readings for smoothing
      
      let stopMonitoringFunction: (() => void) | null = null;
      let finalHeartRate = 0;
      
      try {
        stopMonitoringFunction = await bluetoothService.startRealtimeHeartRate((heartRate) => {
          if (heartRate === undefined || heartRate === null || heartRate === 0) {
            return;
          }
          
          // Update current heart rate if valid
          if (heartRate >= 40 && heartRate <= 200) {
            // Add to buffer for smoothing
            heartRateBuffer.push(heartRate);
            // Keep buffer at desired size
            if (heartRateBuffer.length > bufferSize) {
              heartRateBuffer.shift();
            }
            
            // Calculate smoothed heart rate (average of buffer)
            const smoothedRate = Math.round(
              heartRateBuffer.reduce((sum, val) => sum + val, 0) / heartRateBuffer.length
            );
            
            // Update final heart rate for event logging
            finalHeartRate = smoothedRate;
            
            // Only update if the change is significant or at regular intervals
            const lastValue = currentHeartRate || 0;
            const isSignificantChange = Math.abs(smoothedRate - lastValue) >= 3;
            const isTimeToUpdate = heartRateData.length % 3 === 0; // Update every 3rd reading regardless
            
            if (isSignificantChange || isTimeToUpdate) {
              setCurrentHeartRate(smoothedRate);
        
            // Update min/max heart rates
              setMaxHeartRate(prev => Math.max(prev, smoothedRate));
              setMinHeartRate(prev => smoothedRate < prev ? smoothedRate : prev);
            
            // Add to data array
        setHeartRateData(prev => [
          ...prev,
                { timestamp: new Date(), value: smoothedRate }
            ]);
            
            // Calculate running average
            setAvgHeartRate(prev => {
                const newTotal = prev * heartRateData.length + smoothedRate;
              return Math.round(newTotal / (heartRateData.length + 1));
            });
              
              // Update heart rate history using the shared data system
              // Only update chart occasionally to avoid flicker
              if (isSignificantChange || heartRateData.length % 5 === 0) {
                updateDataForTab(activeTab, smoothedRate);
                
                // Save to cache
                saveDataToCache();
              }
            }
          }
        });
      } catch (monitorError) {
        console.error('Error starting heart rate monitoring:', monitorError);
        if (!isAuto) {
        setError('Failed to start heart rate monitoring');
        setIsMonitoring(false);
        }
        setLoading(false);
        return;
      }
      
      // Monitoring ref for cleanup
      const monitoringRef = { current: stopMonitoringFunction };
      
      // For manual monitoring, run for 30 seconds
      // For auto monitoring, run for 15 seconds to be less battery intensive
      const duration = isAuto ? 15000 : 30000;
      
      // Stop after duration
      const monitoringTimeout = setTimeout(() => {
        if (monitoringRef.current) {
          try {
            monitoringRef.current();
            
            // Save heart rate event when monitoring completes
            if (finalHeartRate >= 40) {
              saveHeartRateEvent(finalHeartRate, isAuto ? 'auto' : 'manual');
            }
          } catch (stopError) {
            console.error('Error stopping monitoring:', stopError);
          }
          if (!isAuto) {
          setIsMonitoring(false);
        }
        }
      }, duration);
      
      // Return cleanup function
      return () => {
        clearTimeout(monitoringTimeout);
        if (monitoringRef.current) {
          try {
            monitoringRef.current();
          } catch (cleanupError) {
            console.error('Cleanup error:', cleanupError);
          }
        }
      };
    } catch (error) {
      console.error('Setup error:', error);
      if (!isAuto) {
      setError('Failed to setup monitoring');
      setIsMonitoring(false);
      }
      setLoading(false);
      return null;
    } finally {
      setLoading(false);
    }
  }, [isDeviceConnected, heartRateData.length, activeTab, currentHeartRate]);
  
  // Function to toggle auto monitoring
  const toggleAutoMonitoring = () => {
    const newState = !autoMonitoringEnabled;
    setAutoMonitoringEnabled(newState);
    
    // If turning on and device is connected, start the interval
    if (newState && isDeviceConnected) {
      startAutoMonitoringInterval();
    } else {
      // Otherwise, clear any existing interval
      stopAutoMonitoringInterval();
    }
  };
  
  // Start auto monitoring interval
  const startAutoMonitoringInterval = useCallback(() => {
    // Clear any existing interval first
    stopAutoMonitoringInterval();
    
    // Check heart rate immediately if we don't have recent data
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    const shouldCheckNow = now - lastAutoMonitorTime > hourInMs;
    
    if (shouldCheckNow) {
      console.log('Auto monitoring: Checking heart rate now');
      startHeartRateMonitoring(true);
    }
    
    // Set up interval for hourly checks
    const intervalId = setInterval(() => {
      if (isDeviceConnected && autoMonitoringEnabled) {
        console.log('Auto monitoring: Hourly heart rate check');
        startHeartRateMonitoring(true);
      }
    }, hourInMs);
    
    autoMonitorIntervalRef.current = intervalId;
    
    return () => {
      stopAutoMonitoringInterval();
    };
  }, [isDeviceConnected, autoMonitoringEnabled, lastAutoMonitorTime, startHeartRateMonitoring]);
  
  // Stop auto monitoring interval
  const stopAutoMonitoringInterval = () => {
    if (autoMonitorIntervalRef.current) {
      clearInterval(autoMonitorIntervalRef.current);
      autoMonitorIntervalRef.current = null;
    }
  };
  
  // Load data when component mounts
  useEffect(() => {
    console.log('HeartRateScreen mounted');
    
    // Load heart rate events
    loadHeartRateEvents();
    
    // First load cached data
    loadCachedData().then(() => {
      if (!dataLoaded) {
        updateDataForTab(activeTab);
      }
    
    let cleanupFunction: (() => void) | null = null;
    
      if (isDeviceConnected) {
        // Start real-time monitoring if device is connected
        startHeartRateMonitoring().then(cleanup => {
          cleanupFunction = cleanup;
          setLoading(false);
          
          // Start auto monitoring interval if enabled
          if (autoMonitoringEnabled) {
            startAutoMonitoringInterval();
          }
        }).catch(error => {
          console.error('Failed to start monitoring:', error);
          setError('Could not establish monitoring');
          setLoading(false);
        });
      } else {
        // Use cached data
        setLoading(false);
      }
    
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
        stopAutoMonitoringInterval();
      };
    });
  }, [isDeviceConnected, startHeartRateMonitoring, startAutoMonitoringInterval]);
  
  // Monitor connection changes to start/stop auto monitoring
  useEffect(() => {
    if (isDeviceConnected && autoMonitoringEnabled) {
      startAutoMonitoringInterval();
    } else {
      stopAutoMonitoringInterval();
    }
    
    return () => {
      stopAutoMonitoringInterval();
    };
  }, [isDeviceConnected, autoMonitoringEnabled, startAutoMonitoringInterval]);
  
  // Update data when tab changes
  useEffect(() => {
    if (dataLoaded) {
      updateDataForTab(activeTab);
    }
  }, [activeTab, dataLoaded]);
  
  // Update data based on the selected tab
  const updateDataForTab = (tab: string, currentRate?: number) => {
    // Only update the heart rate history and labels if we have a new measurement
    // or if we're just changing tabs (not during continuous monitoring)
    if (currentRate || !isMonitoring) {
      // Store the current active tab to ensure consistency between renders
      const rate = currentRate || currentHeartRate || 72;
      
      // Use our utility function to get consistent labels across the app
      const labels = generateChartLabels(tab);
      
      // Generate appropriate data points based on the tab
      let dataPoints: number[];
      
      if (tab === 'Daily') {
        // Use existing historical data generation for daily view
        const { dataPoints: dailyData } = generateHistoricalData(tab, rate, 'heartRate');
        dataPoints = dailyData;
      }
      else if (tab === 'Weekly') {
        // Generate weekly data that matches our week labels
        dataPoints = Array(labels.length).fill(0).map((_, index) => {
          const factor = 0.85 + Math.random() * 0.3; // 0.85 to 1.15 variation
          // More recent weeks have values closer to current
          const weekFactor = 0.7 + (index / labels.length) * 0.3;
          return Math.round(rate * factor * weekFactor);
        });
      }
      else if (tab === 'Monthly') {
        // Generate monthly data that matches our month labels
        dataPoints = Array(labels.length).fill(0).map((_, index) => {
          const factor = 0.85 + Math.random() * 0.3; // 0.85 to 1.15 variation
          // More recent months have values closer to current
          const monthFactor = 0.7 + (index / labels.length) * 0.3;
          return Math.round(rate * factor * monthFactor);
        });
      }
      else {
        // Fallback to existing historical data generation
        const { dataPoints: defaultData } = generateHistoricalData(tab, rate, 'heartRate');
        dataPoints = defaultData;
      }
      
      // Update state with new data - do it atomically to prevent flickering
      setHeartRateHistory(dataPoints);
      setHeartRateLabels(labels);
      
      // Save the updated data
      // Throttle cache updates to prevent too many writes during monitoring
      if (!isMonitoring || heartRateData.length % 5 === 0) {
        saveDataToCache();
      }
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    updateDataForTab(tab);
  };
  
  // Get heart rate zone based on current rate
  const getHeartRateZone = () => {
    if (currentHeartRate === 0) return 'Unavailable';
    
    if (currentHeartRate < 60) return 'Resting';
    if (currentHeartRate < 70) return 'Relaxed';
    if (currentHeartRate < 90) return 'Light Activity';
    if (currentHeartRate < 110) return 'Moderate';
    if (currentHeartRate < 130) return 'Cardio';
    return 'Peak';
  };
  
  // Get zone color
  const getZoneColor = () => {
    const zone = getHeartRateZone();
    switch (zone) {
      case 'Resting':
        return colors.success;
      case 'Relaxed':
        return '#4CAF50';
      case 'Light Activity':
        return '#8BC34A';
      case 'Moderate':
        return '#FFC107';
      case 'Cardio':
        return '#FF9800';
      case 'Peak':
        return colors.danger;
      default:
        return colors.textSecondary;
    }
  };
  
  // Start heart rate monitor
  const handleStartMonitoring = () => {
    if (isMonitoring) return;
    
    setHeartRateData([]);
    startHeartRateMonitoring(false);
  };

  // Toggle events history visibility
  const toggleEventsHistory = () => {
    setShowEventsHistory(!showEventsHistory);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FeatherIcon name="chevron-left" size={28} color={colors.text} />
          </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Heart Rate</Text>
        <TouchableOpacity onPress={toggleEventsHistory} style={styles.infoButton}>
          <FeatherIcon name="clock" size={24} color={colors.text} />
        </TouchableOpacity>
        </View>

      {/* Tab Selector */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Daily' && [styles.activeTab, { backgroundColor: colors.primary }]]}
          onPress={() => handleTabChange('Daily')}
        >
          <Text style={[styles.tabText, activeTab === 'Daily' && styles.activeTabText]}>Daily</Text>
        </TouchableOpacity>
            <TouchableOpacity
          style={[styles.tab, activeTab === 'Weekly' && [styles.activeTab, { backgroundColor: colors.primary }]]}
          onPress={() => handleTabChange('Weekly')}
        >
          <Text style={[styles.tabText, activeTab === 'Weekly' && styles.activeTabText]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'Monthly' && [styles.activeTab, { backgroundColor: colors.primary }]]}
          onPress={() => handleTabChange('Monthly')}
        >
          <Text style={[styles.tabText, activeTab === 'Monthly' && styles.activeTabText]}>Monthly</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {!isDeviceConnected && lastUpdated && (
          <View style={[styles.offlineNoteContainer, { backgroundColor: colors.cardHeart }]}>
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

        {isDeviceConnected && (
          <View style={[styles.autoMonitorContainer, { backgroundColor: autoMonitoringEnabled ? colors.cardHeart : colors.surface }]}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Icon name="clock-time-eight-outline" size={18} color={colors.text} />
              <Text style={[styles.autoMonitorText, { color: colors.text }]}>
                {autoMonitoringEnabled ? 'Auto-monitoring every hour' : 'Auto-monitoring disabled'}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.autoMonitorToggle, { backgroundColor: autoMonitoringEnabled ? colors.surface : colors.primary }]}
              onPress={toggleAutoMonitoring}
            >
              <Text style={[styles.autoMonitorToggleText, { color: autoMonitoringEnabled ? colors.text : '#FFF' }]}>
                {autoMonitoringEnabled ? 'Disable' : 'Enable'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {showEventsHistory && (
          <View style={[styles.eventsHistoryContainer, { backgroundColor: colors.surface }]}>
            <View style={styles.eventsHistoryHeader}>
              <Text style={[styles.eventsHistoryTitle, { color: colors.text }]}>Heart Rate History</Text>
              <TouchableOpacity onPress={toggleEventsHistory}>
                <FeatherIcon name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.eventsList} nestedScrollEnabled={true}>
              {heartRateEvents.length === 0 ? (
                <Text style={[styles.noEventsText, { color: colors.textSecondary }]}>
                  No heart rate readings recorded yet.
                </Text>
              ) : (
                heartRateEvents.map((event, index) => (
                  <View key={index} style={[
                    styles.eventItem, 
                    { borderBottomColor: colors.divider }
                  ]}>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Icon 
                        name={event.source === 'manual' ? 'hand-heart' : 'clock-outline'} 
                        size={16} 
                        color={event.source === 'manual' ? colors.chartRed : colors.chartBlue} 
                      />
                      <Text style={[styles.eventValue, { color: colors.text }]}>
                        {event.value} <Text style={{fontSize: 12, color: colors.textSecondary}}>bpm</Text>
                      </Text>
                    </View>
                    <Text style={[styles.eventTime, { color: colors.textSecondary }]}>
                      {formatEventTime(event.timestamp)} • {event.source === 'manual' ? 'Manual' : 'Auto'}
                    </Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        )}
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading heart rate data...</Text>
          </View>
        ) : (
          <>
            {/* Current Heart Rate Display */}
            <View style={[styles.currentHRContainer, { backgroundColor: colors.surface }]}>
              <View style={styles.hrValueSection}>
                <PulsingHeart />
                <Text style={[styles.currentHRValue, { color: colors.text }]}>
                  {currentHeartRate > 0 ? currentHeartRate : '--'}
                </Text>
                <Text style={[styles.currentHRUnit, { color: colors.textSecondary }]}>bpm</Text>
              </View>
              
              <View style={styles.hrZoneSection}>
                <Text style={[styles.hrZoneLabel, { color: colors.textSecondary }]}>Current Zone</Text>
                <Text style={[styles.hrZoneValue, { color: getZoneColor() }]}>
                  {getHeartRateZone()}
                </Text>
              </View>
            </View>
            
            {/* Chart Container */}
            <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.chartTitle, { color: colors.text }]}>Heart Rate Trend</Text>
              
              {/* Main Chart */}
              <CustomLineChart
                data={heartRateHistory}
                labels={heartRateLabels}
                color={colors.chartRed}
                height={220}
              />
              
              {isDeviceConnected && lastUpdated && (
                <Text style={[styles.lastUpdatedText, { color: colors.textSecondary }]}>
                  Last updated: {lastUpdated}
                </Text>
              )}
            </View>
            
            {/* Heart Rate Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Icon name="heart-pulse" size={22} color={colors.chartRed} />
                <Text style={[styles.statValue, { color: colors.text }]}>{avgHeartRate || "--"}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg BPM</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Icon name="arrow-up" size={22} color={colors.danger} />
                <Text style={[styles.statValue, { color: colors.text }]}>{maxHeartRate || "--"}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Max BPM</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Icon name="arrow-down" size={22} color={colors.success} />
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {minHeartRate !== 200 ? minHeartRate : "--"}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Min BPM</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <Icon name="sleep" size={22} color={colors.chartBlue} />
                <Text style={[styles.statValue, { color: colors.text }]}>{restingHeartRate}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Resting</Text>
              </View>
            </View>
            
            {/* Action Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: isMonitoring ? colors.divider : colors.primary }
              ]}
              onPress={handleStartMonitoring}
              disabled={isMonitoring || !isDeviceConnected}
            >
              <Text style={styles.actionButtonText}>
                {isMonitoring ? 'Monitoring...' : 'Start Monitoring'}
              </Text>
              {isMonitoring && <ActivityIndicator size="small" color={colors.text} style={{ marginLeft: 10 }} />}
            </TouchableOpacity>
            
            {/* Health Insights */}
            <View style={[styles.insightsCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.insightsTitle, { color: colors.text }]}>Health Insights</Text>
              
              <View style={styles.insightRow}>
                <View style={[styles.insightIcon, { backgroundColor: colors.cardHeart }]}>
                  <Icon name="heart-pulse" size={16} color={colors.chartRed} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    Your heart rate is {getHeartRateDescription()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.insightRow}>
                <View style={[styles.insightIcon, { backgroundColor: colors.cardActivity }]}>
                  <FeatherIcon name="activity" size={16} color={colors.chartGreen} />
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {getActivitySuggestion()}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
  
  function getHeartRateDescription() {
    if (!currentHeartRate) return 'unavailable';
    if (currentHeartRate < 60) return 'lower than average, indicating good cardiac health';
    if (currentHeartRate < 80) return 'within normal resting range';
    if (currentHeartRate < 100) return 'slightly elevated, possibly due to activity';
    return 'elevated, which could be due to exercise or stress';
  }
  
  function getActivitySuggestion() {
    const zone = getHeartRateZone();
    switch (zone) {
      case 'Resting':
      case 'Relaxed':
        return 'You could engage in light physical activity to improve circulation.';
      case 'Light Activity':
        return 'This is an ideal range for fat burning activities like walking.';
      case 'Moderate':
        return 'Great for cardiovascular health. Try to maintain this intensity.';
      case 'Cardio':
      case 'Peak':
        return 'Consider taking a break soon to prevent overexertion.';
      default:
        return 'Connect your device to get personalized activity suggestions.';
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: Platform.OS === 'android' ? 8 : 0,
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  infoButton: {
    padding: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 24,
    padding: 4,
    ...ELEVATION_STYLES.small,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    ...ELEVATION_STYLES.small,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9E9E9E',
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  currentHRContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    ...ELEVATION_STYLES.small,
  },
  hrValueSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentHRValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  currentHRUnit: {
    fontSize: 16,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  hrZoneSection: {
    alignItems: 'center',
  },
  hrZoneLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  hrZoneValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...ELEVATION_STYLES.small,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDeviceWarning: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    ...ELEVATION_STYLES.small,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 28,
    marginBottom: 16,
    ...ELEVATION_STYLES.small,
  },
  actionButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  insightsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...ELEVATION_STYLES.small,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  insightRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  insightContent: {
    flex: 1,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
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
  autoMonitorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  autoMonitorText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  autoMonitorToggle: {
    padding: 10,
    borderRadius: 10,
  },
  autoMonitorToggleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  lastUpdatedText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  eventsHistoryContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...ELEVATION_STYLES.small,
  },
  eventsHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventsHistoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventsList: {
    maxHeight: 200,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  eventValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  eventTime: {
    fontSize: 12,
  },
  noEventsText: {
    textAlign: 'center',
    padding: 20,
    fontStyle: 'italic',
  },
});

export default HeartRateScreen; 