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
import { 
  STORAGE_KEYS, 
  loadAllHealthData, 
  saveAllHealthData, 
  generateHistoricalData 
} from '../utils/healthDataUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoalSettingModal from '../components/GoalSettingModal';
import { updateGoal, getGoalProgress, generateChartLabels } from '../utils/goalsUtils';

interface StepsScreenProps {
  navigation: any;
  route: any;
}

const StepsScreen: React.FC<StepsScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<string>('Daily');
  const [stepsData, setStepsData] = useState<number[]>([2500, 5000, 7500, 8200, 10000, 12000, 9500]);
  const [stepsLabels, setStepsLabels] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [currentSteps, setCurrentSteps] = useState<number>(9500);
  const [stepsGoal, setStepsGoal] = useState<number>(10000);
  const [distance, setDistance] = useState<number>(7.2);
  const [calories, setCalories] = useState<number>(380);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  
  // Access data from the BluetoothContext
  const { selectedDevice, userGoals, setUserGoals } = useBluetooth();

  // Check if device is connected
  const isDeviceConnected = selectedDevice?.connected || false;

  // Get theme colors
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  const screenWidth = Dimensions.get('window').width - 40;
  
  // Load cached data first, then device data if connected
  useEffect(() => {
    loadCachedData().then(() => {
    if (isDeviceConnected) {
      loadStepsData();
    } else {
        // Use cached data or generate new data if needed
        if (!dataLoaded) {
          updateDataForTab(activeTab);
        }
      }
    });
  }, [isDeviceConnected]);
  
  // Update local steps goal when userGoals changes
  useEffect(() => {
    if (userGoals && userGoals.steps) {
      setStepsGoal(userGoals.steps);
    }
  }, [userGoals]);
  
  // Load cached data from AsyncStorage
  const loadCachedData = async () => {
    try {
      const cachedData = await loadAllHealthData();
      
      if (cachedData) {
        // Set active tab if available
        if (cachedData.activeTab) setActiveTab(cachedData.activeTab);
        
        // Use the steps data from cache
        if (cachedData.stepsHistory && cachedData.stepsLabels) {
          setStepsData(cachedData.stepsHistory);
          setStepsLabels(cachedData.stepsLabels);
        }
        
        // Use current steps count
        if (cachedData.currentSteps) {
          setCurrentSteps(cachedData.currentSteps);
          // Calculate estimated distance and calories based on steps
          setDistance(Math.round(cachedData.currentSteps * 0.0008 * 10) / 10); // Approx 0.8m per step
          setCalories(Math.round(cachedData.currentSteps * 0.04)); // Approx 0.04 calories per step
        }
        
        if (cachedData.lastUpdated) {
          setLastUpdated(cachedData.lastUpdated);
        }
        
        setDataLoaded(true);
      }
    } catch (error) {
      console.error('Error loading cached data:', error);
    }
  };
  
  // Save data to cache
  const saveDataToCache = async () => {
    try {
      const timestamp = await saveAllHealthData({
        activeTab,
        stepsHistory: stepsData,
        stepsLabels,
        currentSteps
      });
      
      if (timestamp) {
        setLastUpdated(timestamp);
      }
    } catch (error) {
      console.error('Error saving data to cache:', error);
    }
  };
  
  const loadStepsData = async () => {
    try {
      setIsLoading(true);
      
      // Get step count data from device
      try {
        const stepData = await bluetoothService.getStepCount();
        setCurrentSteps(stepData.steps);
        setDistance(stepData.distance || Math.round(stepData.steps * 0.0008 * 10) / 10);
        setCalories(stepData.calories || Math.round(stepData.steps * 0.04));
        
        // Update historical data with real data
        updateDataForTab(activeTab, stepData.steps);
        
        // Save updated data to cache
        saveDataToCache();
      } catch (error) {
        console.error('Error fetching step data:', error);
        // Fall back to existing cached data or generate new data
        updateDataForTab(activeTab);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading steps data:', error);
      setIsLoading(false);
    }
  };
  
  const updateDataForTab = (tab: string, currentStepCount?: number) => {
    const stepsCount = currentStepCount || currentSteps;
    
    // Use the new utility function to get consistent labels
    const labels = generateChartLabels(tab);
      
    // Get data points based on the tab
    let dataPoints: number[];
    
    if (tab === 'Daily') {
      // Daily data logic - use historical data utility if available
      const { dataPoints: dailyData } = generateHistoricalData(tab, stepsCount, 'steps');
      dataPoints = dailyData;
    }
    else if (tab === 'Weekly') {
      // Generate weekly data - simulated or from historical source
      // Number of data points should match the number of weekly labels
      dataPoints = Array(labels.length).fill(0).map((_, index) => {
        // Generate representative data or use real historical data if available
        const baseValue = stepsCount * (0.7 + Math.random() * 0.6);
        return Math.round(baseValue * (index + 1) / labels.length);
      });
    }
    else if (tab === 'Monthly') {
      // Generate monthly data - simulated or from historical source
      // Number of data points should match the number of month labels
      dataPoints = Array(labels.length).fill(0).map((_, index) => {
        // Generate representative data or use real historical data if available
        const baseValue = stepsCount * 30 * (0.7 + Math.random() * 0.6); // 30 days avg
        return Math.round(baseValue * (0.5 + (index / labels.length) * 0.5));
      });
    }
    else {
      // Fallback to default data
      const { dataPoints: defaultData } = generateHistoricalData(tab, stepsCount, 'steps');
      dataPoints = defaultData;
    }
    
    setStepsData(dataPoints);
    setStepsLabels(labels);
    
    // Save the updated data
    saveDataToCache();
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    updateDataForTab(tab);
  }
  
  const getStepsProgress = () => {
    return getGoalProgress('steps', currentSteps, userGoals);
  };
  
  const handleGoalSave = async (newGoal: number) => {
    setStepsGoal(newGoal);
    
    try {
      // Use the utility function to update the goal
      const updatedGoals = await updateGoal('steps', newGoal);
      
      // Update context with all updated goals
      setUserGoals(updatedGoals);
      console.log('Steps goal saved:', newGoal);
    } catch (error) {
      console.error('Error saving steps goal:', error);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Steps</Text>
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
        {!isDeviceConnected && lastUpdated && (
          <View style={[styles.offlineNoteContainer, { backgroundColor: colors.cardSteps }]}>
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
        
        {/* Main Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statsHeader}>
            <View style={styles.statsIconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: colors.cardSteps }]}>
                <FeatherIcon name="trending-up" size={28} color={colors.chartOrange} />
              </View>
              <View>
                <Text style={[styles.statsTitle, { color: colors.text }]}>Steps</Text>
                <Text style={[styles.statsValue, { color: colors.chartOrange }]}>{currentSteps.toLocaleString()}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.goalButton, { backgroundColor: colors.cardSteps }]}
              onPress={() => setShowGoalModal(true)}
            >
              <Text style={styles.goalButtonText}>Goal: {stepsGoal.toLocaleString()}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.divider }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getStepsProgress()}%`, backgroundColor: colors.chartOrange }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {Math.round(getStepsProgress())}% of daily goal
            </Text>
          </View>
        </View>
        
        {/* Additional Stats */}
        <View style={[styles.additionalStatsContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <FeatherIcon name="map" size={24} color={colors.chartOrange} />
            <Text style={[styles.statValue, { color: colors.text }]}>{distance.toFixed(1)} km</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Distance</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <FeatherIcon name="zap" size={24} color={colors.chartOrange} />
            <Text style={[styles.statValue, { color: colors.text }]}>{calories}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Calories</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <FeatherIcon name="clock" size={24} color={colors.chartOrange} />
            <Text style={[styles.statValue, { color: colors.text }]}>{Math.round(distance * 12)} min</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active Time</Text>
          </View>
        </View>
        
        {/* Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {activeTab === 'Daily' ? 'Today\'s Steps' : 
             activeTab === 'Weekly' ? 'This Week\'s Steps' : 'This Month\'s Steps'}
          </Text>
          
          <LineChart
            data={{
              labels: stepsLabels,
              datasets: [
                {
                  data: stepsData,
                  color: () => colors.chartOrange,
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
              color: () => colors.chartOrange,
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
              {Math.round(stepsData.reduce((a, b) => a + b, 0) / stepsData.length).toLocaleString()} steps
            </Text>
          </View>
        </View>
        
        {/* Tips Card */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.tipsHeader}>
            <FeatherIcon name="info" size={20} color={colors.chartOrange} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips for Increasing Steps</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.chartOrange }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Take the stairs instead of the elevator
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.chartOrange }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Park farther away from your destination
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.chartOrange }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Set a reminder to take a short walk every hour
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Goal Setting Modal */}
      <GoalSettingModal
        isVisible={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        goalType="steps"
        currentGoal={stepsGoal}
        onSaveGoal={handleGoalSave}
        colorAccent={colors.chartOrange}
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
});

export default StepsScreen; 