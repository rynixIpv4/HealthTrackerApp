import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing user goals
export const USER_GOALS_KEY = 'health_tracker_user_goals';

// Define default goals
export const DEFAULT_GOALS = {
  steps: 10000,
  sleep: 8,
  cycling: 10,
  heartRate: { min: 60, max: 140 }
};

// Define goal types
export type GoalType = 'steps' | 'sleep' | 'cycling' | 'heartRate';

// Interface for user goals
export interface UserGoals {
  steps: number;
  sleep: number;
  cycling: number;
  heartRate: { min: number; max: number };
  [key: string]: any; // Allow for future goal types
}

/**
 * Load user goals from AsyncStorage
 * @returns Promise that resolves to user goals object
 */
export const loadUserGoals = async (): Promise<UserGoals> => {
  try {
    const savedGoals = await AsyncStorage.getItem(USER_GOALS_KEY);
    if (savedGoals) {
      const parsedGoals = JSON.parse(savedGoals);
      // Ensure we have all default goals
      return { ...DEFAULT_GOALS, ...parsedGoals };
    }
    return DEFAULT_GOALS;
  } catch (error) {
    console.error('Error loading user goals:', error);
    return DEFAULT_GOALS;
  }
};

/**
 * Save user goals to AsyncStorage
 * @param goals The user goals to save
 * @returns Promise that resolves when goals are saved
 */
export const saveUserGoals = async (goals: UserGoals): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_GOALS_KEY, JSON.stringify(goals));
    console.log('User goals saved successfully');
  } catch (error) {
    console.error('Error saving user goals:', error);
  }
};

/**
 * Update a specific goal type
 * @param goalType The type of goal to update
 * @param value The new value for the goal
 * @returns Promise that resolves to the updated goals object
 */
export const updateGoal = async (
  goalType: GoalType, 
  value: number | { min: number; max: number }
): Promise<UserGoals> => {
  try {
    // Load current goals
    const currentGoals = await loadUserGoals();
    
    // Update the specific goal
    const updatedGoals = {
      ...currentGoals,
      [goalType]: value
    };
    
    // Save the updated goals
    await saveUserGoals(updatedGoals);
    
    // Return the updated goals
    return updatedGoals;
  } catch (error) {
    console.error(`Error updating ${goalType} goal:`, error);
    throw error;
  }
};

/**
 * Get the progress percentage for a goal
 * @param goalType The type of goal to check
 * @param currentValue The current value to compare against the goal
 * @param goals Optional goals object. If not provided, will use default goals.
 * @returns Progress percentage (0-100)
 */
export const getGoalProgress = (
  goalType: GoalType,
  currentValue: number,
  goals?: UserGoals
): number => {
  const targetGoals = goals || DEFAULT_GOALS;
  
  switch (goalType) {
    case 'steps':
      return Math.min((currentValue / targetGoals.steps) * 100, 100);
    
    case 'sleep':
      return Math.min((currentValue / targetGoals.sleep) * 100, 100);
    
    case 'cycling':
      return Math.min((currentValue / targetGoals.cycling) * 100, 100);
    
    case 'heartRate':
      // For heart rate, check if in target range
      if (currentValue >= targetGoals.heartRate.min && currentValue <= targetGoals.heartRate.max) {
        return 100; // In range = 100% success
      } else if (currentValue < targetGoals.heartRate.min) {
        // Below range, calculate percentage to min
        return Math.min((currentValue / targetGoals.heartRate.min) * 100, 99);
      } else {
        // Above range, inverse percentage (higher = worse)
        const overage = currentValue - targetGoals.heartRate.max;
        const range = targetGoals.heartRate.max * 0.5; // 50% buffer zone
        return Math.max(100 - (overage / range) * 100, 0);
      }
    
    default:
      return 0;
  }
};

/**
 * Generate chart labels based on the selected time period
 * @param tab The selected tab (Daily/Weekly/Monthly)
 * @returns Array of labels for the chart
 */
export const generateChartLabels = (tab: string): string[] => {
  const now = new Date();
  
  if (tab === 'Daily') {
    // For daily view, show hours
    return ['8AM', '10AM', '12PM', '2PM', '4PM', '6PM', '8PM'];
  } 
  else if (tab === 'Weekly') {
    // For weekly view, show Week 1, Week 2, etc.
    const currentWeek = Math.ceil(now.getDate() / 7);
    const weeksInMonth = 5; // Maximum possible weeks in a month
    
    const weekLabels: string[] = [];
    for (let i = 1; i <= weeksInMonth; i++) {
      if (i <= currentWeek) {
        weekLabels.push(`Week ${i}`);
      }
    }
    
    // Ensure we have at least 4 weeks
    while (weekLabels.length < 4) {
      weekLabels.push(`Week ${weekLabels.length + 1}`);
    }
    
    return weekLabels;
  } 
  else if (tab === 'Monthly') {
    // For monthly view, show month names
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const currentMonth = now.getMonth();
    const monthLabels: string[] = [];
    
    // Show current month and previous months up to 12
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - i + 12) % 12; // Ensure positive index
      monthLabels.unshift(months[monthIndex]); // Add to beginning
      
      // Limit to 6 months for readability
      if (monthLabels.length >= 6) {
        break;
      }
    }
    
    return monthLabels;
  }
  
  // Default fallback
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
}; 