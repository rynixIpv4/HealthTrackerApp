import AsyncStorage from '@react-native-async-storage/async-storage';

// Define data structures for health metrics
export interface HeartRateData {
  timestamp: number;
  value: number;
}

export interface StepData {
  timestamp: number;
  steps: number;
  distance: number;
  calories: number;
}

export interface SleepData {
  timestamp: number;
  deepSleep: number;
  lightSleep: number;
  awake: number;
  totalSleep: number;
}

export interface BatteryData {
  timestamp: number;
  level: number;
}

export interface HealthData {
  heartRate: HeartRateData[];
  steps: StepData[];
  sleep: SleepData[];
  battery: BatteryData[];
}

// Storage keys
const STORAGE_KEYS = {
  HEALTH_DATA: 'HEALTH_TRACKER_HISTORY',
  HEART_RATE: 'HEALTH_TRACKER_HEART_RATE',
  STEPS: 'HEALTH_TRACKER_STEPS',
  SLEEP: 'HEALTH_TRACKER_SLEEP',
  BATTERY: 'HEALTH_TRACKER_BATTERY',
};

// Maximum number of records to keep per metric
const MAX_RECORDS = {
  HEART_RATE: 500, // About a week of frequent readings
  STEPS: 90, // 3 months of daily data
  SLEEP: 90, // 3 months of sleep data
  BATTERY: 100, // Battery level history
};

class HealthDataService {
  private heartRateData: HeartRateData[] = [];
  private stepData: StepData[] = [];
  private sleepData: SleepData[] = [];
  private batteryData: BatteryData[] = [];
  private isLoaded: boolean = false;

  constructor() {
    // Load data when the service is instantiated
    this.loadData();
  }

  // Load all health data from storage
  private async loadData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load heart rate data
      const heartRateJson = await AsyncStorage.getItem(STORAGE_KEYS.HEART_RATE);
      if (heartRateJson) {
        this.heartRateData = JSON.parse(heartRateJson);
      }

      // Load step data
      const stepJson = await AsyncStorage.getItem(STORAGE_KEYS.STEPS);
      if (stepJson) {
        this.stepData = JSON.parse(stepJson);
      }

      // Load sleep data
      const sleepJson = await AsyncStorage.getItem(STORAGE_KEYS.SLEEP);
      if (sleepJson) {
        this.sleepData = JSON.parse(sleepJson);
      }

      // Load battery data
      const batteryJson = await AsyncStorage.getItem(STORAGE_KEYS.BATTERY);
      if (batteryJson) {
        this.batteryData = JSON.parse(batteryJson);
      }

      this.isLoaded = true;
      console.log('Health data loaded from storage');
    } catch (error) {
      console.error('Error loading health data:', error);
    }
  }

  // Save all data to storage
  private async saveData(): Promise<void> {
    try {
      // Save heart rate data
      await AsyncStorage.setItem(STORAGE_KEYS.HEART_RATE, JSON.stringify(this.heartRateData));
      
      // Save step data
      await AsyncStorage.setItem(STORAGE_KEYS.STEPS, JSON.stringify(this.stepData));
      
      // Save sleep data
      await AsyncStorage.setItem(STORAGE_KEYS.SLEEP, JSON.stringify(this.sleepData));
      
      // Save battery data
      await AsyncStorage.setItem(STORAGE_KEYS.BATTERY, JSON.stringify(this.batteryData));
      
      console.log('Health data saved to storage');
    } catch (error) {
      console.error('Error saving health data:', error);
    }
  }

  // Add a heart rate reading
  public async addHeartRate(value: number): Promise<void> {
    await this.ensureLoaded();
    
    if (value <= 0) return; // Don't store invalid readings
    
    const newReading: HeartRateData = {
      timestamp: Date.now(),
      value
    };
    
    this.heartRateData.push(newReading);
    
    // Limit the number of records
    if (this.heartRateData.length > MAX_RECORDS.HEART_RATE) {
      this.heartRateData = this.heartRateData.slice(-MAX_RECORDS.HEART_RATE);
    }
    
    await this.saveData();
  }

  // Add step data
  public async addStepData(steps: number, distance: number, calories: number): Promise<void> {
    await this.ensureLoaded();
    
    if (steps <= 0) return; // Don't store invalid readings
    
    const newReading: StepData = {
      timestamp: Date.now(),
      steps,
      distance,
      calories
    };
    
    // Check if we already have an entry for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const existingTodayIndex = this.stepData.findIndex(item => {
      const itemDate = new Date(item.timestamp);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === todayTimestamp;
    });
    
    if (existingTodayIndex >= 0) {
      // Update today's entry
      this.stepData[existingTodayIndex] = newReading;
    } else {
      // Add new entry
      this.stepData.push(newReading);
    }
    
    // Limit the number of records
    if (this.stepData.length > MAX_RECORDS.STEPS) {
      this.stepData = this.stepData.slice(-MAX_RECORDS.STEPS);
    }
    
    await this.saveData();
  }

  // Add sleep data
  public async addSleepData(deepSleep: number, lightSleep: number, awake: number, totalSleep: number): Promise<void> {
    await this.ensureLoaded();
    
    if (totalSleep <= 0) return; // Don't store invalid readings
    
    const newReading: SleepData = {
      timestamp: Date.now(),
      deepSleep,
      lightSleep,
      awake,
      totalSleep
    };
    
    // Check if we already have an entry for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();
    
    const existingTodayIndex = this.sleepData.findIndex(item => {
      const itemDate = new Date(item.timestamp);
      itemDate.setHours(0, 0, 0, 0);
      return itemDate.getTime() === todayTimestamp;
    });
    
    if (existingTodayIndex >= 0) {
      // Update today's entry
      this.sleepData[existingTodayIndex] = newReading;
    } else {
      // Add new entry
      this.sleepData.push(newReading);
    }
    
    // Limit the number of records
    if (this.sleepData.length > MAX_RECORDS.SLEEP) {
      this.sleepData = this.sleepData.slice(-MAX_RECORDS.SLEEP);
    }
    
    await this.saveData();
  }

  // Add battery level
  public async addBatteryLevel(level: number): Promise<void> {
    await this.ensureLoaded();
    
    if (level <= 0 || level > 100) return; // Don't store invalid readings
    
    const newReading: BatteryData = {
      timestamp: Date.now(),
      level
    };
    
    // Only add if the level has changed by at least 1% from the last reading
    const lastReading = this.batteryData[this.batteryData.length - 1];
    if (!lastReading || Math.abs(lastReading.level - level) >= 1) {
      this.batteryData.push(newReading);
      
      // Limit the number of records
      if (this.batteryData.length > MAX_RECORDS.BATTERY) {
        this.batteryData = this.batteryData.slice(-MAX_RECORDS.BATTERY);
      }
      
      await this.saveData();
    }
  }

  // Get heart rate data for a specific time period
  public async getHeartRateData(period: 'day' | 'week' | 'month' | 'all' = 'day'): Promise<HeartRateData[]> {
    await this.ensureLoaded();
    return this.filterDataByPeriod(this.heartRateData, period);
  }

  // Get step data for a specific time period
  public async getStepData(period: 'day' | 'week' | 'month' | 'all' = 'day'): Promise<StepData[]> {
    await this.ensureLoaded();
    return this.filterDataByPeriod(this.stepData, period);
  }

  // Get sleep data for a specific time period
  public async getSleepData(period: 'day' | 'week' | 'month' | 'all' = 'day'): Promise<SleepData[]> {
    await this.ensureLoaded();
    return this.filterDataByPeriod(this.sleepData, period);
  }

  // Get battery data for a specific time period
  public async getBatteryData(period: 'day' | 'week' | 'month' | 'all' = 'day'): Promise<BatteryData[]> {
    await this.ensureLoaded();
    return this.filterDataByPeriod(this.batteryData, period);
  }

  // Get heart rate statistics
  public async getHeartRateStats(period: 'day' | 'week' | 'month' | 'all' = 'day'): Promise<{
    avg: number;
    max: number;
    min: number;
    resting: number;
  }> {
    await this.ensureLoaded();
    
    const filteredData = this.filterDataByPeriod(this.heartRateData, period);
    
    if (filteredData.length === 0) {
      return { avg: 0, max: 0, min: 0, resting: 0 };
    }
    
    // Calculate max, min, and average
    const values = filteredData.map(item => item.value);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = Math.round(sum / values.length);
    
    // Estimate resting heart rate (average of lowest 10% of readings)
    const sortedValues = [...values].sort((a, b) => a - b);
    const lowestCount = Math.max(Math.ceil(sortedValues.length * 0.1), 1);
    const lowestValues = sortedValues.slice(0, lowestCount);
    const restingSum = lowestValues.reduce((acc, val) => acc + val, 0);
    const resting = Math.round(restingSum / lowestValues.length);
    
    return { avg, max, min, resting };
  }

  // Get step statistics
  public async getStepStats(period: 'day' | 'week' | 'month' | 'all' = 'day'): Promise<{
    totalSteps: number;
    avgSteps: number;
    totalDistance: number;
    totalCalories: number;
  }> {
    await this.ensureLoaded();
    
    const filteredData = this.filterDataByPeriod(this.stepData, period);
    
    if (filteredData.length === 0) {
      return { totalSteps: 0, avgSteps: 0, totalDistance: 0, totalCalories: 0 };
    }
    
    const totalSteps = filteredData.reduce((acc, item) => acc + item.steps, 0);
    const avgSteps = Math.round(totalSteps / filteredData.length);
    const totalDistance = filteredData.reduce((acc, item) => acc + item.distance, 0);
    const totalCalories = filteredData.reduce((acc, item) => acc + item.calories, 0);
    
    return { totalSteps, avgSteps, totalDistance, totalCalories };
  }

  // Get sleep statistics
  public async getSleepStats(period: 'day' | 'week' | 'month' | 'all' = 'day'): Promise<{
    avgTotalSleep: number;
    avgDeepSleep: number;
    avgLightSleep: number;
    avgAwake: number;
  }> {
    await this.ensureLoaded();
    
    const filteredData = this.filterDataByPeriod(this.sleepData, period);
    
    if (filteredData.length === 0) {
      return { avgTotalSleep: 0, avgDeepSleep: 0, avgLightSleep: 0, avgAwake: 0 };
    }
    
    const totalSleepSum = filteredData.reduce((acc, item) => acc + item.totalSleep, 0);
    const deepSleepSum = filteredData.reduce((acc, item) => acc + item.deepSleep, 0);
    const lightSleepSum = filteredData.reduce((acc, item) => acc + item.lightSleep, 0);
    const awakeSum = filteredData.reduce((acc, item) => acc + item.awake, 0);
    
    const avgTotalSleep = parseFloat((totalSleepSum / filteredData.length).toFixed(1));
    const avgDeepSleep = parseFloat((deepSleepSum / filteredData.length).toFixed(1));
    const avgLightSleep = parseFloat((lightSleepSum / filteredData.length).toFixed(1));
    const avgAwake = parseFloat((awakeSum / filteredData.length).toFixed(1));
    
    return { avgTotalSleep, avgDeepSleep, avgLightSleep, avgAwake };
  }

  // Helper method to ensure data is loaded
  private async ensureLoaded(): Promise<void> {
    if (!this.isLoaded) {
      await this.loadData();
    }
  }

  // Helper method to filter data by time period
  private filterDataByPeriod<T extends { timestamp: number }>(data: T[], period: 'day' | 'week' | 'month' | 'all'): T[] {
    if (period === 'all') return [...data];
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (period) {
      case 'day':
        cutoffDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case 'month':
        cutoffDate.setMonth(cutoffDate.getMonth() - 1);
        break;
    }
    
    const cutoffTime = cutoffDate.getTime();
    return data.filter(item => item.timestamp >= cutoffTime);
  }

  // Clear all data
  public async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.HEART_RATE,
        STORAGE_KEYS.STEPS,
        STORAGE_KEYS.SLEEP,
        STORAGE_KEYS.BATTERY
      ]);
      
      this.heartRateData = [];
      this.stepData = [];
      this.sleepData = [];
      this.batteryData = [];
      
      console.log('All health data cleared');
    } catch (error) {
      console.error('Error clearing health data:', error);
    }
  }
}

// Export a singleton instance
export const healthDataService = new HealthDataService();
export default healthDataService; 