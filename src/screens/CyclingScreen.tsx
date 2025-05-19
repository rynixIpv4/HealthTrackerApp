import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { ELEVATION_STYLES } from '../constants';
import { useBluetooth } from '../contexts/BluetoothContext';
import bluetoothService from '../services/bluetooth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoalSettingModal from '../components/GoalSettingModal';
import { updateGoal, getGoalProgress, generateChartLabels } from '../utils/goalsUtils';

interface CyclingScreenProps {
  navigation: any;
  route: any;
}

const CyclingScreen: React.FC<CyclingScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<string>('Daily');
  const [distanceData, setDistanceData] = useState<number[]>([5.2, 7.8, 3.5, 8.2, 6.5, 9.3, 4.6]);
  const [durationData, setDurationData] = useState<number[]>([25, 38, 17, 40, 32, 45, 23]);
  const [cyclingLabels, setCyclingLabels] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [distance, setDistance] = useState<number>(4.6);
  const [duration, setDuration] = useState<number>(23);
  const [calories, setCalories] = useState<number>(185);
  const [avgSpeed, setAvgSpeed] = useState<number>(12);
  const [cyclingGoal, setCyclingGoal] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  
  // Access data from the BluetoothContext
  const { selectedDevice, userGoals, setUserGoals } = useBluetooth();

  // Check if device is connected
  const isDeviceConnected = selectedDevice?.connected || false;

  // Get theme colors
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  const screenWidth = Dimensions.get('window').width - 40;
  
  // Load data from device if connected
  useEffect(() => {
    // Initial data load
    updateDataForTab(activeTab);
  }, [isDeviceConnected]); // Remove activeTab dependency to prevent loops
  
  // Update local cycling goal when userGoals changes
  useEffect(() => {
    if (userGoals && userGoals.cycling) {
      setCyclingGoal(userGoals.cycling);
    } else {
      // If cycling goal doesn't exist in userGoals, initialize it
      const initializeCyclingGoal = async () => {
        try {
          const updatedGoals = {
            ...userGoals,
            cycling: cyclingGoal
          };
          
          setUserGoals(updatedGoals);
          await AsyncStorage.setItem('health_tracker_user_goals', JSON.stringify(updatedGoals));
        } catch (error) {
          console.error('Error initializing cycling goal:', error);
        }
      };
      
      initializeCyclingGoal();
    }
  }, [userGoals]);
  
  const loadCyclingData = async () => {
    try {
      setIsLoading(true);
      
      // Get cycling data from device
      try {
        const cyclingData = await bluetoothService.getCyclingData();
        setDistance(cyclingData.distance);
        setDuration(cyclingData.duration);
        setCalories(cyclingData.calories);
        
        // Calculate average speed
        const avgSpeedCalc = cyclingData.distance / (cyclingData.duration / 60);
        setAvgSpeed(Math.round(avgSpeedCalc * 10) / 10);
        
        // Update historical data based on real data
        generateHistoricalDataFromReal(cyclingData.distance, cyclingData.duration, activeTab);
      } catch (error) {
        console.error('Error fetching cycling data:', error);
        // Fall back to placeholder data
        setPlaceholderData(activeTab);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading cycling data:', error);
      setIsLoading(false);
    }
  };
  
  // Update data for the selected tab
  const updateDataForTab = (tab: string) => {
    if (isDeviceConnected) {
      loadCyclingData();
    } else {
      setPlaceholderData(tab);
    }
  };
  
  // Generate placeholder data when no real data is available
  const setPlaceholderData = (tab: string) => {
    // Use our utility function to get consistent labels
    const labels = generateChartLabels(tab);
    setCyclingLabels(labels);
    
    if (tab === 'Daily') {
      // For daily view, create a progression throughout the day
      const distances = [0.5, 0, 1.2, 0, 0.8, 1.5, 4.6];
      const durations = [3, 0, 6, 0, 4, 7, 23];
      
      // Make sure arrays match the length of labels
      const adjustedDistances = distances.slice(0, labels.length);
      const adjustedDurations = durations.slice(0, labels.length);
      
      // Pad arrays if needed
      while (adjustedDistances.length < labels.length) {
        adjustedDistances.push(0);
      }
      while (adjustedDurations.length < labels.length) {
        adjustedDurations.push(0);
      }
      
      setDistanceData(adjustedDistances);
      setDurationData(adjustedDurations);
      setDistance(4.6);
      setDuration(23);
      setCalories(185);
      setAvgSpeed(12);
    } 
    else if (tab === 'Weekly') {
      // Generate weekly data that matches our week labels
      const distances = Array(labels.length).fill(0).map(() => 
        Math.round((Math.random() * 5 + 3) * 10) / 10); // 3-8km with 1 decimal
      
      const durations = distances.map(dist => 
        Math.round(dist * 5)); // Approximately 5 minutes per km
      
      setDistanceData(distances);
      setDurationData(durations);
      
      // Set current values to the most recent week's data
      setDistance(distances[distances.length - 1]);
      setDuration(durations[durations.length - 1]);
      setCalories(Math.round(distances[distances.length - 1] * 40)); // ~40 calories per km
      setAvgSpeed(Math.round((distances[distances.length - 1] / durations[durations.length - 1] * 60) * 10) / 10);
    }
    else if (tab === 'Monthly') {
      // Generate monthly data that matches our month labels
      const distances = Array(labels.length).fill(0).map(() => 
        Math.round((Math.random() * 20 + 15) * 10) / 10); // 15-35km with 1 decimal
      
      const durations = distances.map(dist => 
        Math.round(dist * 5)); // Approximately 5 minutes per km
      
      setDistanceData(distances);
      setDurationData(durations);
      
      // Set current values to the most recent month's data
      setDistance(distances[distances.length - 1] / 30); // Daily average
      setDuration(durations[distances.length - 1] / 30); // Daily average
      setCalories(Math.round(distances[distances.length - 1] * 40 / 30)); // Daily average
      setAvgSpeed(Math.round((distances[distances.length - 1] / durations[durations.length - 1] * 60) * 10) / 10);
    }
  };
  
  // Generate historical data based on real current values
  const generateHistoricalDataFromReal = (currentDistance: number, currentDuration: number, tab: string) => {
    // Use our utility function to get consistent labels across the app
    const labels = generateChartLabels(tab);
    setCyclingLabels(labels);
    
    if (tab === 'Daily') {
      // For daily view, show hourly activity
      // Create progression building up to current values
      const distanceFactor = currentDistance / labels.length;
      const durationFactor = currentDuration / labels.length;
      
      const distances = labels.map((_, index) => {
        const factor = index === labels.length - 1 ? 1 : (0.5 + Math.random() * 0.5) * (index + 1) / labels.length;
        return Math.round(distanceFactor * factor * labels.length * 10) / 10;
      });
      
      const durations = labels.map((_, index) => {
        const factor = index === labels.length - 1 ? 1 : (0.5 + Math.random() * 0.5) * (index + 1) / labels.length;
        return Math.round(durationFactor * factor * labels.length);
      });
      
      // Ensure the last point is the actual current value
      distances[distances.length - 1] = currentDistance;
      durations[durations.length - 1] = currentDuration;
      
      setDistanceData(distances);
      setDurationData(durations);
    } 
    else if (tab === 'Weekly') {
      // Generate weekly data that matches our new week labels
      const distances = Array(labels.length).fill(0).map((_, index) => {
        const factor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3 variation
        return Math.round(currentDistance * factor * (index + 1) / labels.length * 10) / 10;
      });
      
      const durations = Array(labels.length).fill(0).map((_, index) => {
        const factor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3 variation
        return Math.round(currentDuration * factor * (index + 1) / labels.length);
      });
      
      setDistanceData(distances);
      setDurationData(durations);
    } 
    else if (tab === 'Monthly') {
      // Generate monthly data that matches our month labels
      const weeklyDistance = currentDistance * 7; // Estimate weekly from daily
      const weeklyDuration = currentDuration * 7; // Estimate weekly from daily
      
      const distances = Array(labels.length).fill(0).map((_, index) => {
        const factor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 variation
        // More recent months have higher values
        return Math.round(weeklyDistance * 4 * factor * (0.5 + (index / labels.length) * 0.5) * 10) / 10;
      });
      
      const durations = Array(labels.length).fill(0).map((_, index) => {
        const factor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2 variation
        // More recent months have higher values
        return Math.round(weeklyDuration * 4 * factor * (0.5 + (index / labels.length) * 0.5));
      });
      
      setDistanceData(distances);
      setDurationData(durations);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    updateDataForTab(tab);
  };
  
  const getCyclingProgress = () => {
    return getGoalProgress('cycling', distance, userGoals);
  };
  
  const handleGoalSave = async (newGoal: number) => {
    setCyclingGoal(newGoal);
    
    try {
      // Use the utility function to update the goal
      const updatedGoals = await updateGoal('cycling', newGoal);
      
      // Update context with all updated goals
      setUserGoals(updatedGoals);
      console.log('Cycling goal saved:', newGoal);
    } catch (error) {
      console.error('Error saving cycling goal:', error);
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FeatherIcon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Cycling</Text>
        <View style={{width: 24}} />
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

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Main Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statsHeader}>
            <View style={styles.statsIconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: colors.cardCycling }]}>
                <Icon name="bike" size={28} color={colors.chartGreen} />
              </View>
              <View>
                <Text style={[styles.statsTitle, { color: colors.text }]}>Cycling Distance</Text>
                <Text style={[styles.statsValue, { color: colors.chartGreen }]}>{distance.toFixed(1)} km</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.goalButton, { backgroundColor: colors.cardCycling }]}
              onPress={() => setShowGoalModal(true)}
            >
              <Text style={styles.goalButtonText}>Goal: {cyclingGoal} km</Text>
            </TouchableOpacity>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.divider }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getCyclingProgress()}%`, backgroundColor: colors.chartGreen }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {Math.round(getCyclingProgress())}% of daily goal
            </Text>
          </View>
        </View>
        
        {/* Additional Stats */}
        <View style={[styles.additionalStatsContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <FeatherIcon name="clock" size={24} color={colors.chartGreen} />
            <Text style={[styles.statValue, { color: colors.text }]}>{duration} min</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Duration</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <FeatherIcon name="zap" size={24} color={colors.chartGreen} />
            <Text style={[styles.statValue, { color: colors.text }]}>{calories}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calories</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <FeatherIcon name="trending-up" size={24} color={colors.chartGreen} />
            <Text style={[styles.statValue, { color: colors.text }]}>{avgSpeed} km/h</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Speed</Text>
          </View>
        </View>
        
        {/* Distance Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {activeTab === 'Daily' ? 'Today\'s Distance' : 
             activeTab === 'Weekly' ? 'Weekly Distance' : 'Monthly Distance'}
          </Text>
          
          <LineChart
            data={{
              labels: cyclingLabels,
              datasets: [
                {
                  data: distanceData,
                  color: () => colors.chartGreen,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 1,
              color: () => colors.chartGreen,
              labelColor: () => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: colors.surface,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          
          <View style={styles.averageContainer}>
            <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>Average:</Text>
            <Text style={[styles.averageValue, { color: colors.text }]}>
              {(distanceData.reduce((a, b) => a + b, 0) / distanceData.length).toFixed(1)} km
            </Text>
          </View>
        </View>
        
        {/* Duration Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {activeTab === 'Daily' ? 'Today\'s Duration' : 
             activeTab === 'Weekly' ? 'Weekly Duration' : 'Monthly Duration'}
          </Text>
          
          <LineChart
            data={{
              labels: cyclingLabels,
              datasets: [
                {
                  data: durationData,
                  color: () => colors.chartLightGreen,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth}
            height={220}
            chartConfig={{
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: () => colors.chartLightGreen,
              labelColor: () => colors.textSecondary,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: colors.surface,
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
          
          <View style={styles.averageContainer}>
            <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>Average:</Text>
            <Text style={[styles.averageValue, { color: colors.text }]}>
              {Math.round(durationData.reduce((a, b) => a + b, 0) / durationData.length)} min
            </Text>
          </View>
        </View>
        
        {/* Tips Card */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.tipsHeader}>
            <FeatherIcon name="info" size={20} color={colors.chartGreen} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Cycling Tips</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.chartGreen }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Maintain proper bike fit and posture to prevent injuries
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.chartGreen }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Use interval training to improve both endurance and speed
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.chartGreen }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Stay hydrated and fuel properly for longer rides
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Goal Setting Modal */}
      <GoalSettingModal
        isVisible={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        goalType="cycling"
        currentGoal={cyclingGoal}
        onSaveGoal={handleGoalSave}
        colorAccent={colors.chartGreen}
      />
    </SafeAreaView>
  );
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 8 : 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
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
    color: 'white',
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  statsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...ELEVATION_STYLES.small,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statsIconContainer: {
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
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  goalButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'right',
  },
  additionalStatsContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...ELEVATION_STYLES.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E0E0E0',
  },
  chartCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...ELEVATION_STYLES.small,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  averageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
  },
  averageLabel: {
    fontSize: 14,
    marginRight: 5,
  },
  averageValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...ELEVATION_STYLES.small,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  tipsList: {
    marginLeft: 10,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
});

export default CyclingScreen; 