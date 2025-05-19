import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for health data
export const STORAGE_KEYS = {
  STEPS_HISTORY: 'stepsHistory',
  HEART_RATE_HISTORY: 'heartRateHistory',
  SLEEP_HISTORY: 'sleepHistory',
  CYCLING_HISTORY: 'cyclingHistory',
  STEPS_LABELS: 'stepsLabels',
  HEART_RATE_LABELS: 'heartRateLabels', 
  SLEEP_LABELS: 'sleepLabels',
  CYCLING_LABELS: 'cyclingLabels',
  CURRENT_STEPS: 'currentSteps',
  CURRENT_HEART_RATE: 'currentHeartRate',
  LAST_UPDATED: 'lastUpdated',
  ACTIVE_TAB: 'activeTab'
};

// Save health data to AsyncStorage
export const saveHealthData = async (key: string, data: any) => {
  try {
    const jsonValue = typeof data === 'string' ? data : JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
    return true;
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
    return false;
  }
};

// Load health data from AsyncStorage
export const loadHealthData = async (key: string) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    if (jsonValue !== null) {
      try {
        // Try to parse as JSON first
        return JSON.parse(jsonValue);
      } catch (e) {
        // If not JSON, return as is (string)
        return jsonValue;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return null;
  }
};

// Save all health data for a session
export const saveAllHealthData = async (data: {
  stepsHistory?: number[];
  heartRateHistory?: number[];
  sleepHistory?: number[];
  cyclingHistory?: number[];
  stepsLabels?: string[];
  heartRateLabels?: string[];
  sleepLabels?: string[];
  cyclingLabels?: string[];
  currentSteps?: number;
  currentHeartRate?: number;
  activeTab?: string;
}) => {
  try {
    const currentTime = new Date().toLocaleString();
    
    // Save each data point if provided
    if (data.stepsHistory) await saveHealthData(STORAGE_KEYS.STEPS_HISTORY, data.stepsHistory);
    if (data.heartRateHistory) await saveHealthData(STORAGE_KEYS.HEART_RATE_HISTORY, data.heartRateHistory);
    if (data.sleepHistory) await saveHealthData(STORAGE_KEYS.SLEEP_HISTORY, data.sleepHistory);
    if (data.cyclingHistory) await saveHealthData(STORAGE_KEYS.CYCLING_HISTORY, data.cyclingHistory);
    if (data.stepsLabels) await saveHealthData(STORAGE_KEYS.STEPS_LABELS, data.stepsLabels);
    if (data.heartRateLabels) await saveHealthData(STORAGE_KEYS.HEART_RATE_LABELS, data.heartRateLabels);
    if (data.sleepLabels) await saveHealthData(STORAGE_KEYS.SLEEP_LABELS, data.sleepLabels);
    if (data.cyclingLabels) await saveHealthData(STORAGE_KEYS.CYCLING_LABELS, data.cyclingLabels);
    if (data.currentSteps) await saveHealthData(STORAGE_KEYS.CURRENT_STEPS, data.currentSteps.toString());
    if (data.currentHeartRate) await saveHealthData(STORAGE_KEYS.CURRENT_HEART_RATE, data.currentHeartRate.toString());
    if (data.activeTab) await saveHealthData(STORAGE_KEYS.ACTIVE_TAB, data.activeTab);
    
    // Always update last saved timestamp
    await saveHealthData(STORAGE_KEYS.LAST_UPDATED, currentTime);
    
    return currentTime;
  } catch (error) {
    console.error('Error saving all health data:', error);
    return null;
  }
};

// Load all health data 
export const loadAllHealthData = async () => {
  try {
    const stepsHistory = await loadHealthData(STORAGE_KEYS.STEPS_HISTORY);
    const heartRateHistory = await loadHealthData(STORAGE_KEYS.HEART_RATE_HISTORY);
    const sleepHistory = await loadHealthData(STORAGE_KEYS.SLEEP_HISTORY);
    const cyclingHistory = await loadHealthData(STORAGE_KEYS.CYCLING_HISTORY);
    const stepsLabels = await loadHealthData(STORAGE_KEYS.STEPS_LABELS);
    const heartRateLabels = await loadHealthData(STORAGE_KEYS.HEART_RATE_LABELS);
    const sleepLabels = await loadHealthData(STORAGE_KEYS.SLEEP_LABELS);
    const cyclingLabels = await loadHealthData(STORAGE_KEYS.CYCLING_LABELS);
    const currentSteps = await loadHealthData(STORAGE_KEYS.CURRENT_STEPS);
    const currentHeartRate = await loadHealthData(STORAGE_KEYS.CURRENT_HEART_RATE);
    const activeTab = await loadHealthData(STORAGE_KEYS.ACTIVE_TAB);
    const lastUpdated = await loadHealthData(STORAGE_KEYS.LAST_UPDATED);
    
    return {
      stepsHistory,
      heartRateHistory,
      sleepHistory,
      cyclingHistory,
      stepsLabels,
      heartRateLabels,
      sleepLabels,
      cyclingLabels,
      currentSteps: currentSteps ? parseInt(currentSteps) : null,
      currentHeartRate: currentHeartRate ? parseInt(currentHeartRate) : null,
      activeTab,
      lastUpdated
    };
  } catch (error) {
    console.error('Error loading all health data:', error);
    return null;
  }
};

// Get Day Name
const getDayName = (day: number): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[day];
};

// Get Month Name
const getMonthName = (month: number): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month];
};

// Generate historical data (for when real data isn't available)
export const generateHistoricalData = (
  activeTab: string, 
  currentValue: number,
  type: 'steps' | 'heartRate' | 'sleep' | 'cycling'
) => {
  const now = new Date();
  let dataPoints: number[] = [];
  let labels: string[] = [];
  
  // Create a stable seed based on current date to ensure consistent values for the same day
  const dateSeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  
  // Simple seeded random function to get consistent "random" values for the same day
  const seededRandom = (seed: number, index: number) => {
    const x = Math.sin(seed + index) * 10000;
    return x - Math.floor(x);
  };
  
  if (activeTab === 'Daily') {
    // Generate hourly data for the day
    labels = ['6AM', '9AM', '12PM', '3PM', '6PM', '9PM'];
    
    switch(type) {
      case 'steps':
        dataPoints = [
          Math.floor(Math.random() * 1000) + 500,
          Math.floor(Math.random() * 1500) + 1000,
          Math.floor(Math.random() * 2000) + 2000,
          Math.floor(Math.random() * 2000) + 4000,
          Math.floor(Math.random() * 2000) + 6000,
          currentValue
        ];
        break;
      case 'heartRate':
        // Use more stable values with less randomness for heart rate
        // Create a baseline heart rate determined by the current value
        const baseRate = Math.max(60, currentValue - 10);
        
        // Generate a smooth progression with minimal variation
        dataPoints = labels.map((_, index) => {
          // Use seeded random to ensure same pattern across renderings
          const variation = Math.floor(seededRandom(dateSeed, index) * 5); 
          
          if (index === labels.length - 1) {
            return currentValue; // Last point is always current value
          } else {
            // Create a smooth transition building up to the current value
            const progress = index / (labels.length - 1); // 0 to 1
            const progressiveIncrease = Math.floor((currentValue - baseRate) * progress);
            return baseRate + progressiveIncrease + variation;
          }
        });
        break;
      case 'sleep':
        dataPoints = [6.5, 7.2, 6.8, 7.5, 6.2, currentValue];
        break;
      case 'cycling':
        dataPoints = [2.5, 3.1, 4.2, 3.5, 5.1, currentValue];
        break;
    }
  } else if (activeTab === 'Weekly') {
    // Generate daily data for the week
    // Get current day of week (0-6, where 0 is Sunday)
    const today = now.getDay();
    
    // Generate labels for past 7 days
    labels = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(getDayName(date.getDay()));
    }
    
    switch(type) {
      case 'steps':
        // Generate a realistic weekly step pattern
        dataPoints = [
          Math.floor(Math.random() * 2000) + 7000, // Higher on weekend
          Math.floor(Math.random() * 2000) + 6000, // Monday lower
          Math.floor(Math.random() * 2000) + 8500, // Tuesday higher
          Math.floor(Math.random() * 2000) + 9000, // Wednesday peak
          Math.floor(Math.random() * 2000) + 8000, // Thursday good
          Math.floor(Math.random() * 2000) + 7500, // Friday taper
          Math.floor(Math.random() * 2000) + 10000, // Saturday highest
        ];
        break;
      case 'heartRate':
        // Weekly heart rate pattern - more stable with minimal variation
        // Find the current day of the week (0-6)
        const todayIdx = now.getDay();
        
        // Create pattern with the current value for today
        dataPoints = [
          65 + Math.floor(seededRandom(dateSeed, 0) * 4), // Sunday
          68 + Math.floor(seededRandom(dateSeed, 1) * 3), // Monday
          69 + Math.floor(seededRandom(dateSeed, 2) * 3), // Tuesday
          72 + Math.floor(seededRandom(dateSeed, 3) * 2), // Wednesday
          70 + Math.floor(seededRandom(dateSeed, 4) * 2), // Thursday
          71 + Math.floor(seededRandom(dateSeed, 5) * 3), // Friday
          67 + Math.floor(seededRandom(dateSeed, 6) * 4)  // Saturday
        ];
        
        // Make sure current day shows current value
        dataPoints[todayIdx] = currentValue;
        break;
      case 'sleep':
        // Weekly sleep pattern
        dataPoints = [
          7.5, // Weekend longer sleep
          6.2, // Monday less sleep
          6.5, // Tuesday improving
          6.7, // Wednesday normal
          6.3, // Thursday less
          6.1, // Friday least
          7.8, // Saturday most
        ];
        break;
      case 'cycling':
        // Weekly cycling pattern
        dataPoints = [
          4.5, // Weekend longer ride
          0.0, // Monday no ride
          2.5, // Tuesday short ride
          3.5, // Wednesday medium
          1.5, // Thursday short
          0.0, // Friday no ride
          6.0, // Saturday longest
        ];
        break;
    }
  } else if (activeTab === 'Monthly') {
    // Generate weekly data for the month
    const currentMonth = now.getMonth();
    const daysInMonth = new Date(now.getFullYear(), currentMonth + 1, 0).getDate();
    const weeks = Math.ceil(daysInMonth / 7);
    
    // Generate 4-5 week labels for the month
    labels = [];
    for (let i = 0; i < weeks; i++) {
      labels.push(`Week ${i + 1}`);
    }
    
    // Get current week of month (1-indexed)
    const currentDay = now.getDate();
    const currentWeek = Math.min(Math.ceil(currentDay / 7), weeks);
    
    switch(type) {
      case 'steps':
        // Monthly steps with progression pattern
        dataPoints = labels.map((_, index) => {
          // Gradually increase steps through the month
          const baseSteps = 40000 + (index * 5000);
          return baseSteps + Math.floor(Math.random() * 10000);
        });
        break;
      case 'heartRate':
        // Monthly heart rate trend with consistent values
        dataPoints = labels.map((_, index) => {
          // Create a stable pattern with minimal variations
          const baseRate = 67;
          const weekTrend = index * 1.2; // Slight upward trend
          const variation = Math.floor(seededRandom(dateSeed, index + 10) * 3); // Very small variations
          
          // If this is the current week, use current value
          if (index === currentWeek - 1) {
            return currentValue;
          }
          
          return Math.round(baseRate + weekTrend + variation);
        });
        break;
      case 'sleep':
        // Monthly sleep pattern - declining then recovery
        dataPoints = labels.map((_, index) => {
          if (index < labels.length / 2) {
            // First half of month - gradually decreasing sleep
            return 7.5 - (index * 0.3) + (Math.random() * 0.5);
          } else {
            // Second half - recovery to better sleep
            return 6.5 + ((index - Math.floor(labels.length / 2)) * 0.3) + (Math.random() * 0.5);
          }
        });
        break;
      case 'cycling':
        // Monthly cycling distance with progress
        dataPoints = labels.map((_, index) => {
          // Increased training through the month
          const baseDistance = 12 + (index * 3);
          return baseDistance + Math.floor(Math.random() * 8);
        });
        break;
    }
  }
  
  return { dataPoints, labels };
}; 