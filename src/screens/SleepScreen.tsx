import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { ELEVATION_STYLES, SCREENS } from '../constants';
import { useBluetooth } from '../contexts/BluetoothContext';
import bluetoothService from '../services/bluetooth';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { LineChart } from 'react-native-chart-kit';

interface SleepScreenProps {
  navigation: any;
  route: any;
}

const SleepScreen: React.FC<SleepScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<string>('Daily');
  const [deepSleepData, setDeepSleepData] = useState<number[]>([2, 3, 2.5, 3.2, 2.8, 3.3, 2.9]);
  const [lightSleepData, setLightSleepData] = useState<number[]>([4, 3.5, 4.5, 3.8, 4.2, 3.7, 4.1]);
  const [sleepLabels, setSleepLabels] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [deepSleep, setDeepSleep] = useState<number>(2.9);
  const [lightSleep, setLightSleep] = useState<number>(4.1);
  const [awakeTime, setAwakeTime] = useState<number>(0.5);
  const [totalSleep, setTotalSleep] = useState<number>(7);
  const [sleepGoal, setSleepGoal] = useState<number>(8);
  const [sleepScore, setSleepScore] = useState<number>(85);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Access data from the BluetoothContext
  const { selectedDevice } = useBluetooth();

  // Check if device is connected
  const isDeviceConnected = selectedDevice?.connected || false;

  // Get theme colors
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  const screenWidth = Dimensions.get('window').width - 40;
  
  // Load data from device if connected
  useEffect(() => {
    if (isDeviceConnected) {
      loadSleepData();
    } else {
      // Use placeholder data when no device is connected
      setPlaceholderData();
    }
  }, [isDeviceConnected]);
  
  const loadSleepData = async () => {
    try {
      setIsLoading(true);
      
      // Get sleep data from device
      try {
        const sleepData = await bluetoothService.getSleepData();
        setDeepSleep(sleepData.deepSleep / 60); // Convert minutes to hours
        setLightSleep(sleepData.lightSleep / 60); // Convert minutes to hours
        setAwakeTime(sleepData.awake / 60); // Convert minutes to hours
        setTotalSleep(sleepData.totalSleep / 60); // Convert minutes to hours
        
        // Calculate sleep score (example algorithm)
        const idealSleepHours = 8;
        const sleepEfficiency = (sleepData.totalSleep - sleepData.awake) / sleepData.totalSleep;
        const sleepDurationScore = Math.min(sleepData.totalSleep / 60 / idealSleepHours, 1) * 50;
        const sleepQualityScore = sleepEfficiency * 50;
        setSleepScore(Math.round(sleepDurationScore + sleepQualityScore));
        
        // Update historical data with real data - pass the active tab explicitly
        generateHistoricalDataFromReal(sleepData.deepSleep / 60, sleepData.lightSleep / 60, activeTab);
      } catch (error) {
        console.error('Error fetching sleep data:', error);
        // Fall back to placeholder data
        setPlaceholderData();
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading sleep data:', error);
      setIsLoading(false);
    }
  };
  
  // Set placeholder data when real data isn't available
  const setPlaceholderData = () => {
    if (activeTab === 'Daily') {
      // For daily view, just show one day with sleep cycles
      const hours = ['10PM', '12AM', '2AM', '4AM', '6AM', '8AM'];
      setSleepLabels(hours);
      
      // Deep sleep cycles tend to be earlier in the night
      setDeepSleepData([0, 1.2, 0.8, 0.9, 0, 0]);
      setLightSleepData([0.5, 0.8, 1.2, 0.7, 0.6, 0.3]);
      
      // Set consistent placeholder values for current metrics
      setDeepSleep(2.9);
      setLightSleep(4.1);
      setAwakeTime(0.5);
      setTotalSleep(7);
      setSleepScore(85);
    } else if (activeTab === 'Weekly') {
      // Generate daily sleep for the week
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      setSleepLabels(days);
      
      // Use consistent placeholder values
      setDeepSleepData([2.5, 2.8, 2.2, 3.0, 2.7, 2.5, 2.9]);
      setLightSleepData([3.7, 3.9, 4.2, 3.5, 4.0, 3.8, 4.1]);
      
      // Set consistent placeholder values for current metrics
      setDeepSleep(2.9);
      setLightSleep(4.1);
      setAwakeTime(0.5);
      setTotalSleep(7);
      setSleepScore(85);
    } else if (activeTab === 'Monthly') {
      // Generate weekly sleep for the month
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      setSleepLabels(weeks);
      
      // Use consistent placeholder values
      setDeepSleepData([2.8, 2.9, 2.7, 3.0]);
      setLightSleepData([4.0, 3.8, 4.1, 3.9]);
      
      // Set consistent placeholder values for current metrics
      setDeepSleep(2.9);
      setLightSleep(4.1);
      setAwakeTime(0.5);
      setTotalSleep(7);
      setSleepScore(85);
    }
  };
  
  // Generate historical data based on real current values
  const generateHistoricalDataFromReal = (currentDeepSleep: number, currentLightSleep: number, tab: string) => {
    if (tab === 'Daily') {
      // For daily view, just show one day with sleep cycles
      const hours = ['10PM', '12AM', '2AM', '4AM', '6AM', '8AM'];
      setSleepLabels(hours);
      
      // Create realistic sleep pattern with real totals distributed
      const deepFactor = currentDeepSleep / 3; // Distribute across ~3 hours
      const lightFactor = currentLightSleep / 4; // Distribute across ~4 hours
      
      // Deep sleep cycles tend to be earlier in the night
      setDeepSleepData([
        0, 
        Math.round(deepFactor * 1.2 * 10) / 10, 
        Math.round(deepFactor * 1.0 * 10) / 10, 
        Math.round(deepFactor * 0.8 * 10) / 10, 
        0, 
        0
      ]);
      
      setLightSleepData([
        Math.round(lightFactor * 0.4 * 10) / 10,
        Math.round(lightFactor * 0.8 * 10) / 10,
        Math.round(lightFactor * 1.0 * 10) / 10, 
        Math.round(lightFactor * 0.8 * 10) / 10,
        Math.round(lightFactor * 0.6 * 10) / 10,
        Math.round(lightFactor * 0.4 * 10) / 10
      ]);
    } else if (tab === 'Weekly') {
      // Generate daily sleep for the week
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      setSleepLabels(days);
      
      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
      const adjustedToday = today === 0 ? 6 : today - 1; // Convert to 0 = Monday, 6 = Sunday
      
      // Create data with real values for days up to today
      const deepSleepValues: number[] = [];
      const lightSleepValues: number[] = [];
      
      for (let i = 0; i < 7; i++) {
        if (i <= adjustedToday) {
          // Use variation of the real data for past days
          const variation = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
          deepSleepValues.push(Math.round(currentDeepSleep * variation * 10) / 10);
          lightSleepValues.push(Math.round(currentLightSleep * variation * 10) / 10);
        } else {
          // Future days have no data
          deepSleepValues.push(0);
          lightSleepValues.push(0);
        }
      }
      
      // Ensure today has the actual current values
      deepSleepValues[adjustedToday] = currentDeepSleep;
      lightSleepValues[adjustedToday] = currentLightSleep;
      
      setDeepSleepData(deepSleepValues);
      setLightSleepData(lightSleepValues);
    } else if (tab === 'Monthly') {
      // Generate weekly sleep for the month
      const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      setSleepLabels(weeks);
      
      // Get current week of month (approximate)
      const currentDay = new Date().getDate();
      const currentWeek = Math.min(Math.ceil(currentDay / 7), 4) - 1; // 0-indexed
      
      // Create data with real values for weeks up to current week
      const deepSleepValues: number[] = [];
      const lightSleepValues: number[] = [];
      
      for (let i = 0; i < 4; i++) {
        if (i <= currentWeek) {
          // For past weeks, use weekly averages with variation
          const variation = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
          deepSleepValues.push(Math.round(currentDeepSleep * variation * 10) / 10);
          lightSleepValues.push(Math.round(currentLightSleep * variation * 10) / 10);
        } else {
          // Future weeks have no data yet
          deepSleepValues.push(0);
          lightSleepValues.push(0);
        }
      }
      
      // Ensure current week has the actual values
      deepSleepValues[currentWeek] = currentDeepSleep;
      lightSleepValues[currentWeek] = currentLightSleep;
      
      setDeepSleepData(deepSleepValues);
      setLightSleepData(lightSleepValues);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (isDeviceConnected) {
      // When connected to device, we need to regenerate data for the new tab
      // We already have the current sleep data, so we can just regenerate historical data
      generateHistoricalDataFromReal(deepSleep, lightSleep, tab);
    } else {
      setPlaceholderData();
    }
  };
  
  const getSleepProgress = () => {
    return Math.min((totalSleep / sleepGoal) * 100, 100);
  };
  
  const getAverageSleep = () => {
    // Calculate average from valid data points only
    const validDeepSleep = deepSleepData.filter(value => value > 0);
    const validLightSleep = lightSleepData.filter(value => value > 0);
    
    const avgDeep = validDeepSleep.length > 0 
      ? validDeepSleep.reduce((sum, val) => sum + val, 0) / validDeepSleep.length 
      : 0;
      
    const avgLight = validLightSleep.length > 0
      ? validLightSleep.reduce((sum, val) => sum + val, 0) / validLightSleep.length
      : 0;
      
    return {
      deep: avgDeep.toFixed(1),
      light: avgLight.toFixed(1),
      total: (avgDeep + avgLight).toFixed(1)
    };
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.background} barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <FeatherIcon name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sleep</Text>
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
        {/* Sleep Score Card */}
        <View style={[styles.scoreCard, { backgroundColor: colors.surface }]}>
          <View style={styles.scoreHeader}>
            <Text style={[styles.scoreTitle, { color: colors.text }]}>Sleep Score</Text>
            <Text style={[styles.scoreValue, { color: colors.chartBlue }]}>{sleepScore}</Text>
          </View>
          
          <Text style={[styles.scoreDescription, { color: colors.textSecondary }]}>
            {sleepScore >= 90 ? 'Excellent sleep quality!' :
             sleepScore >= 80 ? 'Very good sleep quality' :
             sleepScore >= 70 ? 'Good sleep quality' :
             sleepScore >= 60 ? 'Fair sleep quality' :
             'Poor sleep quality - try to improve your sleep habits'}
          </Text>
        </View>
      
        {/* Main Stats Card */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statsHeader}>
            <View style={styles.statsIconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: colors.cardSleep }]}>
                <FeatherIcon name="moon" size={28} color={colors.chartBlue} />
              </View>
              <View>
                <Text style={[styles.statsTitle, { color: colors.text }]}>Sleep Duration</Text>
                <Text style={[styles.statsValue, { color: colors.chartBlue }]}>{totalSleep.toFixed(1)} hrs</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.goalButton, { backgroundColor: colors.cardSleep }]}
              onPress={() => {
                // Handle setting goal
              }}
            >
              <Text style={styles.goalButtonText}>Goal: {sleepGoal} hrs</Text>
            </TouchableOpacity>
          </View>
          
          {/* Progress bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.divider }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${getSleepProgress()}%`, backgroundColor: colors.chartBlue }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {Math.round(getSleepProgress())}% of daily goal
            </Text>
          </View>
        </View>
        
        {/* Sleep Breakdown */}
        <View style={[styles.breakdownCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.breakdownTitle, { color: colors.text }]}>Sleep Breakdown</Text>
          
          <View style={styles.sleepTypes}>
            <View style={styles.sleepTypeItem}>
              <View style={styles.sleepTypeHeader}>
                <View style={[styles.sleepTypeIndicator, { backgroundColor: colors.chartDarkBlue }]} />
                <Text style={[styles.sleepTypeTitle, { color: colors.text }]}>Deep Sleep</Text>
              </View>
              <Text style={[styles.sleepTypeValue, { color: colors.chartDarkBlue }]}>{deepSleep.toFixed(1)} hrs</Text>
              <Text style={[styles.sleepTypePercent, { color: colors.textSecondary }]}>
                {Math.round((deepSleep / totalSleep) * 100)}%
              </Text>
            </View>
            
            <View style={styles.sleepTypeItem}>
              <View style={styles.sleepTypeHeader}>
                <View style={[styles.sleepTypeIndicator, { backgroundColor: colors.chartBlue }]} />
                <Text style={[styles.sleepTypeTitle, { color: colors.text }]}>Light Sleep</Text>
              </View>
              <Text style={[styles.sleepTypeValue, { color: colors.chartBlue }]}>{lightSleep.toFixed(1)} hrs</Text>
              <Text style={[styles.sleepTypePercent, { color: colors.textSecondary }]}>
                {Math.round((lightSleep / totalSleep) * 100)}%
              </Text>
            </View>
            
            <View style={styles.sleepTypeItem}>
              <View style={styles.sleepTypeHeader}>
                <View style={[styles.sleepTypeIndicator, { backgroundColor: colors.textSecondary }]} />
                <Text style={[styles.sleepTypeTitle, { color: colors.text }]}>Awake</Text>
              </View>
              <Text style={[styles.sleepTypeValue, { color: colors.textSecondary }]}>{awakeTime.toFixed(1)} hrs</Text>
              <Text style={[styles.sleepTypePercent, { color: colors.textSecondary }]}>
                {Math.round((awakeTime / (totalSleep + awakeTime)) * 100)}%
              </Text>
            </View>
          </View>
        </View>
        
        {/* Chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            {activeTab === 'Daily' ? 'Sleep Cycles' : 
             activeTab === 'Weekly' ? 'Weekly Sleep Pattern' : 'Monthly Sleep Pattern'}
          </Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              <LineChart
                data={{
                  labels: sleepLabels,
                  datasets: [
                    {
                      data: deepSleepData,
                      color: () => colors.chartDarkBlue,
                      strokeWidth: 2,
                    },
                    {
                      data: lightSleepData,
                      color: () => colors.chartBlue,
                      strokeWidth: 2,
                    },
                  ],
                  legend: ['Deep Sleep', 'Light Sleep']
                }}
                width={screenWidth}
                height={220}
                chartConfig={{
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 1,
                  color: () => colors.chartBlue,
                  labelColor: () => colors.textSecondary,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: colors.surface,
                  },
                  propsForLabels: {
                    fontSize: 11,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                legendStyle={{ marginBottom: 10 }}
              />
              
              <View style={styles.averageContainer}>
                <Text style={[styles.averageLabel, { color: colors.textSecondary }]}>Average Total Sleep:</Text>
                <Text style={[styles.averageValue, { color: colors.text }]}>
                  {getAverageSleep().total} hrs
                </Text>
              </View>
            </>
          )}
        </View>
        
        {/* Tips Card */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.tipsHeader}>
            <FeatherIcon name="info" size={20} color={colors.chartBlue} />
            <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips for Better Sleep</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.chartBlue }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Maintain a consistent sleep schedule
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.chartBlue }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Avoid caffeine and electronics before bedtime
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <View style={[styles.tipDot, { backgroundColor: colors.chartBlue }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                Create a cool, dark and quiet sleep environment
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  scoreCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...ELEVATION_STYLES.small,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreDescription: {
    fontSize: 14,
    marginTop: 10,
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
  breakdownCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...ELEVATION_STYLES.small,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  sleepTypes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sleepTypeItem: {
    flex: 1,
    alignItems: 'center',
  },
  sleepTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  sleepTypeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  sleepTypeTitle: {
    fontSize: 14,
  },
  sleepTypeValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sleepTypePercent: {
    fontSize: 14,
    marginTop: 3,
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
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SleepScreen; 