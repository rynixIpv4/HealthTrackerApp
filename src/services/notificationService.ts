import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification channels for Android
const CHANNELS = {
  ACTIVITY: 'activity_channel',
  MOTIVATION: 'motivation_channel',
  ACHIEVEMENTS: 'achievements_channel',
  REMINDERS: 'reminders_channel',
};

// Notification types to categorize different notifications
export const NOTIFICATION_TYPES = {
  INACTIVITY: 'inactivity',
  GOAL_REACHED: 'goal_reached',
  STREAK: 'streak',
  HEART_RATE_ALERT: 'heart_rate_alert',
  GOOD_SLEEP: 'good_sleep',
  PROGRESS_UPDATE: 'progress_update',
};

// Time thresholds for notification frequency
const TIME_THRESHOLDS = {
  INACTIVITY_REMINDER: 3 * 60 * 60 * 1000, // 3 hours
  DAILY_SUMMARY: 24 * 60 * 60 * 1000, // 24 hours
  WEEKLY_REPORT: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Store when notifications were last sent to avoid spamming
const lastNotificationSent = {
  [NOTIFICATION_TYPES.INACTIVITY]: 0,
  [NOTIFICATION_TYPES.GOAL_REACHED]: 0,
  [NOTIFICATION_TYPES.STREAK]: 0,
  [NOTIFICATION_TYPES.HEART_RATE_ALERT]: 0,
  [NOTIFICATION_TYPES.GOOD_SLEEP]: 0,
  [NOTIFICATION_TYPES.PROGRESS_UPDATE]: 0,
};

// Motivation messages for different notification types
const MOTIVATION_MESSAGES = {
  inactivity: [
    "Time to move! Even a short walk can boost your energy.",
    "Hey there! How about a quick stretch? Your body will thank you.",
    "Your smart ring noticed you've been still for a while. Ready for some movement?",
    "Stand up, stretch out! Just 5 minutes of activity can improve your focus.",
  ],
  lowSteps: [
    "Only {steps} steps today - let's aim for a quick walk to boost those numbers!",
    "Your body thrives on movement! Add a few more steps to reach your daily goal.",
    "Walking more today will help you sleep better tonight. How about a quick stroll?",
  ],
  goalReminder: [
    "You're just {stepsLeft} steps away from your daily goal!",
    "Almost there! Just a short walk to hit your target for today.",
    "So close to your daily goal! Finish strong and celebrate your achievement.",
  ],
};

// Praise messages for when users meet or exceed goals
const PRAISE_MESSAGES = {
  stepGoal: [
    "Amazing job! You've reached your step goal for today! 🎉",
    "Look at you go! Step goal smashed for today! 🚶‍♂️💯",
    "Incredible effort! You've hit your step target today! 👟⭐",
  ],
  streak: [
    "Wow! You've maintained your activity streak for {days} days! 🔥",
    "Consistency champion! {days} days of meeting your goals! 🏆",
    "Unstoppable! {days} day streak of reaching your targets! 💪",
  ],
  improvement: [
    "You've increased your average daily steps by {percent}%! Great progress! 📈",
    "Your activity level is up {percent}% compared to last week. Keep it up! 🌟",
    "Impressive improvement! Your activity has increased by {percent}%! 🚀",
  ],
  goodSleep: [
    "Great sleep last night! {hours} hours with {deepPercent}% deep sleep - that's excellent! 😴",
    "Your sleep quality was exceptional! {hours} hours with good deep sleep cycles. 💤",
    "You're mastering sleep! {hours} hours of quality rest will boost your energy today. 🌙",
  ],
  heartRate: [
    "Your heart health is looking good! Your resting heart rate is in the optimal range. ❤️",
    "Great cardio session detected! Your heart will thank you for that workout. 💓",
    "Your heart rate variability is improving - a sign of good heart health! 📊",
  ],
};

// Initialize Notifee when the module is imported
let isNotifeeInitialized = false;

/**
 * Initialize Notifee module
 */
async function initializeNotifee() {
  if (!isNotifeeInitialized) {
    try {
      // This call will ensure the native module is properly initialized
      await notifee.isChannelCreated('dummy_channel');
      isNotifeeInitialized = true;
      console.log('Notifee initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Notifee:', error);
    }
  }
}

/**
 * Initialize notification channels for Android
 */
export async function setupNotificationChannels() {
  // Ensure Notifee is initialized first
  await initializeNotifee();
  
  if (Platform.OS === 'android') {
    try {
      await notifee.createChannel({
        id: CHANNELS.ACTIVITY,
        name: 'Activity Updates',
        description: 'Notifications about your activity and goals',
        importance: AndroidImportance.HIGH,
      });

      await notifee.createChannel({
        id: CHANNELS.MOTIVATION,
        name: 'Motivation',
        description: 'Motivational reminders to keep you active',
        importance: AndroidImportance.DEFAULT,
      });

      await notifee.createChannel({
        id: CHANNELS.ACHIEVEMENTS,
        name: 'Achievements',
        description: 'Notifications about your achievements and milestones',
        importance: AndroidImportance.HIGH,
      });

      await notifee.createChannel({
        id: CHANNELS.REMINDERS,
        name: 'Reminders',
        description: 'Daily reminders about your goals',
        importance: AndroidImportance.DEFAULT,
      });
      
      console.log('Notification channels created successfully');
    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  }
}

/**
 * Request notification permissions
 * @returns {Promise<boolean>} Whether permissions were granted
 */
export async function requestPermissions(): Promise<boolean> {
  // Ensure Notifee is initialized first
  await initializeNotifee();
  
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // 1 = AUTHORIZED
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Display a notification
 * @param {string} title Notification title
 * @param {string} body Notification body text
 * @param {string} channelId Android channel ID
 * @param {Object} data Additional data to include with notification
 */
async function displayNotification(
  title: string,
  body: string,
  channelId: string = CHANNELS.ACTIVITY,
  data: any = {}
): Promise<string> {
  return await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      smallIcon: 'ic_notification',
      color: '#5E60CE',
      pressAction: {
        id: 'default',
      },
    },
    data,
  });
}

/**
 * Send an inactivity reminder if user has been inactive
 * @param {number} lastActivity Timestamp of last detected activity
 * @param {number} currentSteps Current step count for the day
 * @param {number} stepGoal User's daily step goal
 */
async function checkAndSendInactivityReminder(
  lastActivity: number,
  currentSteps: number,
  stepGoal: number
): Promise<void> {
  const now = Date.now();
  const inactiveTime = now - lastActivity;
  const timeThreshold = TIME_THRESHOLDS.INACTIVITY_REMINDER;
  const lastSent = lastNotificationSent[NOTIFICATION_TYPES.INACTIVITY];

  // Only send if user has been inactive for the threshold and we haven't recently sent one
  if (inactiveTime >= timeThreshold && (now - lastSent) >= timeThreshold) {
    // Pick a random message
    const messages = MOTIVATION_MESSAGES.inactivity;
    const message = messages[Math.floor(Math.random() * messages.length)];

    await displayNotification(
      'Time to Move!',
      message,
      CHANNELS.MOTIVATION,
      { type: NOTIFICATION_TYPES.INACTIVITY }
    );
    
    lastNotificationSent[NOTIFICATION_TYPES.INACTIVITY] = now;
  } else if (currentSteps < stepGoal * 0.5 && (now - lastSent) >= timeThreshold) {
    // If user is below 50% of their step goal and it's afternoon, send a gentle reminder
    const currentHour = new Date().getHours();
    if (currentHour >= 14) {  // After 2 PM
      const messages = MOTIVATION_MESSAGES.lowSteps;
      const message = messages[Math.floor(Math.random() * messages.length)]
        .replace('{steps}', currentSteps.toString());
      
      await displayNotification(
        'Boost Your Steps',
        message,
        CHANNELS.MOTIVATION,
        { type: NOTIFICATION_TYPES.INACTIVITY }
      );
      
      lastNotificationSent[NOTIFICATION_TYPES.INACTIVITY] = now;
    }
  }
}

/**
 * Send a goal reached notification
 * @param {string} goalType Type of goal reached (steps, sleep, etc.)
 * @param {number} value The value achieved
 * @param {number} target The target value
 */
async function sendGoalReachedNotification(
  goalType: string,
  value: number,
  target: number
): Promise<void> {
  const now = Date.now();
  const lastSent = lastNotificationSent[NOTIFICATION_TYPES.GOAL_REACHED];
  
  // Only send if we haven't sent one recently
  if ((now - lastSent) >= 6 * 60 * 60 * 1000) {  // 6 hours
    let title, body, channelId;
    
    switch (goalType) {
      case 'steps':
        title = 'Daily Step Goal Reached!';
        const messages = PRAISE_MESSAGES.stepGoal;
        body = messages[Math.floor(Math.random() * messages.length)];
        channelId = CHANNELS.ACHIEVEMENTS;
        break;
      case 'sleep':
        title = 'Great Sleep Quality!';
        body = `You got ${value} hours of sleep, with good sleep quality.`;
        channelId = CHANNELS.ACHIEVEMENTS;
        break;
      default:
        title = 'Goal Reached!';
        body = `You've reached your ${goalType} goal for today!`;
        channelId = CHANNELS.ACHIEVEMENTS;
    }
    
    await displayNotification(
      title,
      body,
      channelId,
      { type: NOTIFICATION_TYPES.GOAL_REACHED, goalType }
    );
    
    lastNotificationSent[NOTIFICATION_TYPES.GOAL_REACHED] = now;
  }
}

/**
 * Send a streak achievement notification
 * @param {number} days Number of consecutive days goal was met
 * @param {string} goalType Type of goal (steps, activity, etc)
 */
async function sendStreakNotification(days: number, goalType: string): Promise<void> {
  const now = Date.now();
  const lastSent = lastNotificationSent[NOTIFICATION_TYPES.STREAK];
  
  // Only notify for significant streaks (3, 7, 14, 30 days etc.)
  const significantStreaks = [3, 7, 14, 21, 30, 60, 90, 100];
  
  if (significantStreaks.includes(days) && (now - lastSent) >= 24 * 60 * 60 * 1000) {
    // Get a praise message and replace the placeholder
    const messages = PRAISE_MESSAGES.streak;
    const message = messages[Math.floor(Math.random() * messages.length)]
      .replace('{days}', days.toString());
    
    await displayNotification(
      `${days} Day Streak!`,
      message,
      CHANNELS.ACHIEVEMENTS,
      { type: NOTIFICATION_TYPES.STREAK, days, goalType }
    );
    
    lastNotificationSent[NOTIFICATION_TYPES.STREAK] = now;
  }
}

/**
 * Send notification for good sleep quality
 * @param {number} sleepDuration Sleep duration in hours
 * @param {number} deepSleepPercentage Percentage of deep sleep
 */
async function sendGoodSleepNotification(
  sleepDuration: number,
  deepSleepPercentage: number
): Promise<void> {
  const now = Date.now();
  const lastSent = lastNotificationSent[NOTIFICATION_TYPES.GOOD_SLEEP];
  
  // Only send if it's good sleep (>7 hours with good deep sleep) and we haven't sent recently
  if (sleepDuration >= 7 && deepSleepPercentage >= 25 && (now - lastSent) >= 24 * 60 * 60 * 1000) {
    const messages = PRAISE_MESSAGES.goodSleep;
    const message = messages[Math.floor(Math.random() * messages.length)]
      .replace('{hours}', sleepDuration.toFixed(1))
      .replace('{deepPercent}', deepSleepPercentage.toString());
    
    await displayNotification(
      'Excellent Sleep Quality!',
      message,
      CHANNELS.ACHIEVEMENTS,
      { type: NOTIFICATION_TYPES.GOOD_SLEEP }
    );
    
    lastNotificationSent[NOTIFICATION_TYPES.GOOD_SLEEP] = now;
  }
}

/**
 * Send a notification for heart rate feedback
 * @param {string} type Type of heart rate feedback (resting, exercise, etc)
 * @param {number} value Heart rate value
 */
async function sendHeartRateNotification(type: string, value: number): Promise<void> {
  const now = Date.now();
  const lastSent = lastNotificationSent[NOTIFICATION_TYPES.HEART_RATE_ALERT];
  
  // Only send once per day
  if ((now - lastSent) >= 24 * 60 * 60 * 1000) {
    let title, body;
    
    if (type === 'resting' && value < 60) {
      // Good resting heart rate
      title = 'Excellent Resting Heart Rate';
      const messages = PRAISE_MESSAGES.heartRate;
      body = messages[0]; // First message is for resting heart rate
    } else if (type === 'exercise' && value > 120) {
      // Good exercise heart rate
      title = 'Great Workout Detected';
      const messages = PRAISE_MESSAGES.heartRate;
      body = messages[1]; // Second message is for exercise
    } else if (type === 'improvement') {
      // Heart rate variability improvement
      title = 'Heart Health Improving';
      const messages = PRAISE_MESSAGES.heartRate;
      body = messages[2]; // Third message is for variability/improvement
    } else {
      // Don't send notification for other scenarios
      return;
    }
    
    await displayNotification(
      title,
      body,
      CHANNELS.ACHIEVEMENTS,
      { type: NOTIFICATION_TYPES.HEART_RATE_ALERT }
    );
    
    lastNotificationSent[NOTIFICATION_TYPES.HEART_RATE_ALERT] = now;
  }
}

/**
 * Send a weekly progress update
 * @param {number} currentAvgSteps Average daily steps this week
 * @param {number} previousAvgSteps Average daily steps last week
 */
async function sendProgressUpdateNotification(
  currentAvgSteps: number,
  previousAvgSteps: number
): Promise<void> {
  const now = Date.now();
  const lastSent = lastNotificationSent[NOTIFICATION_TYPES.PROGRESS_UPDATE];
  
  // Only send weekly
  if ((now - lastSent) >= 7 * 24 * 60 * 60 * 1000) {
    // Calculate percentage improvement
    const percentImprovement = previousAvgSteps > 0 
      ? Math.round(((currentAvgSteps - previousAvgSteps) / previousAvgSteps) * 100)
      : 0;
    
    // Only notify for improvements
    if (percentImprovement > 5) {
      const messages = PRAISE_MESSAGES.improvement;
      const message = messages[Math.floor(Math.random() * messages.length)]
        .replace('{percent}', percentImprovement.toString());
      
      await displayNotification(
        'Your Activity is Improving!',
        message,
        CHANNELS.ACHIEVEMENTS,
        { type: NOTIFICATION_TYPES.PROGRESS_UPDATE }
      );
      
      lastNotificationSent[NOTIFICATION_TYPES.PROGRESS_UPDATE] = now;
    }
  }
}

/**
 * Send a reminder when user is close to daily step goal
 * @param {number} currentSteps Current step count
 * @param {number} goal Step goal
 */
async function sendStepGoalReminderNotification(currentSteps: number, goal: number): Promise<void> {
  const now = Date.now();
  const lastSent = lastNotificationSent[NOTIFICATION_TYPES.INACTIVITY];
  const currentHour = new Date().getHours();
  const stepsLeft = goal - currentSteps;
  
  // Send reminder if it's evening, user is close but hasn't reached goal yet
  if (currentHour >= 17 && currentHour <= 20 && // Between 5-8 PM
      currentSteps >= goal * 0.8 && currentSteps < goal && // 80-99% of goal
      (now - lastSent) >= 6 * 60 * 60 * 1000) { // Not sent in last 6 hours
    
    const messages = MOTIVATION_MESSAGES.goalReminder;
    const message = messages[Math.floor(Math.random() * messages.length)]
      .replace('{stepsLeft}', stepsLeft.toString());
    
    await displayNotification(
      'Almost There!',
      message,
      CHANNELS.REMINDERS,
      { type: NOTIFICATION_TYPES.INACTIVITY }
    );
    
    lastNotificationSent[NOTIFICATION_TYPES.INACTIVITY] = now;
  }
}

/**
 * Process device data to determine if notifications should be sent
 * @param {Object} deviceData Current health data from the device
 * @param {Object} previousData Previous health data for comparison
 * @param {Object} userGoals User's health goals
 */
async function processHealthDataForNotifications(
  deviceData: any,
  previousData: any = {},
  userGoals: any = { steps: 10000, sleep: 8 }
): Promise<void> {
  if (!deviceData) return;
  
  // Extract relevant data
  const { steps, heartRate, sleep, lastSynced } = deviceData;
  const now = Date.now();
  
  // 1. Check for inactivity (if we have step data)
  if (typeof steps === 'number') {
    await checkAndSendInactivityReminder(
      lastSynced?.getTime() || now,
      steps,
      userGoals.steps
    );
    
    // 2. Check if goal reached
    if (steps >= userGoals.steps) {
      await sendGoalReachedNotification('steps', steps, userGoals.steps);
    } else {
      // 2b. Or if close to goal, send reminder
      await sendStepGoalReminderNotification(steps, userGoals.steps);
    }
  }
  
  // 3. Check sleep quality if we have sleep data
  if (sleep && typeof sleep.deepSleep === 'number' && typeof sleep.lightSleep === 'number') {
    const totalSleepHours = (sleep.deepSleep + sleep.lightSleep) / 60; // Convert minutes to hours
    const deepSleepPercentage = sleep.deepSleep / (sleep.deepSleep + sleep.lightSleep) * 100;
    
    await sendGoodSleepNotification(totalSleepHours, deepSleepPercentage);
  }
  
  // 4. Check heart rate insights
  if (typeof heartRate === 'number') {
    // Example: good resting heart rate (assuming this is resting)
    const isNighttime = new Date().getHours() >= 22 || new Date().getHours() <= 6;
    if (isNighttime && heartRate < 60) {
      await sendHeartRateNotification('resting', heartRate);
    }
  }
  
  // 5. Check for streak (would require additional data tracking)
  // This is a placeholder - actual implementation would need streak data
  const userHasStreak = previousData.streakDays > 0;
  if (userHasStreak && previousData.streakDays && previousData.streakDays % 7 === 0) {
    await sendStreakNotification(previousData.streakDays, 'activity');
  }
  
  // 6. Check for weekly progress (Sunday evening)
  const isEndOfWeek = new Date().getDay() === 0 && new Date().getHours() >= 18;
  if (isEndOfWeek && previousData.lastWeekAvgSteps) {
    await sendProgressUpdateNotification(
      steps, // Example - would need actual weekly average
      previousData.lastWeekAvgSteps
    );
  }
}

/**
 * Process health data for notifications and motivation
 * Enhanced version that takes user goals into account and provides more targeted motivation
 * 
 * @param deviceData Health data from smart ring
 * @param userGoals User's health goals
 * @param userProfile User profile information for personalized messages
 */
export async function processSmartRingData(
  deviceData: any, 
  userGoals: any = { steps: 10000, sleep: 8, heartRate: { min: 60, max: 100 } },
  userProfile: any = { name: 'User' }
): Promise<void> {
  if (!deviceData) return;
  
  const now = Date.now();
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  
  // Extract relevant data
  const { steps, heartRate, sleep, bloodOxygen, lastSynced } = deviceData;
  
  // ===== STEP GOAL MOTIVATION =====
  if (typeof steps === 'number') {
    // Early morning check (7-9 AM)
    if (currentHour >= 7 && currentHour <= 9) {
      // Morning motivation based on yesterday's performance
      const yesterdayData = await getYesterdayData();
      if (yesterdayData && yesterdayData.steps) {
        if (yesterdayData.steps < userGoals.steps) {
          // Motivate to do better today
          await displayNotification(
            "New Day, New Goals! 🌅",
            `Good morning ${userProfile.name}! Yesterday you took ${yesterdayData.steps.toLocaleString()} steps. Ready to reach your ${userGoals.steps.toLocaleString()} step goal today?`,
            CHANNELS.MOTIVATION
          );
        } else {
          // Praise yesterday's achievement and encourage consistency
          await displayNotification(
            "Keep the Momentum Going! 🌟",
            `Morning ${userProfile.name}! Great job reaching your step goal yesterday! Let's keep that winning streak going today.`,
            CHANNELS.MOTIVATION
          );
        }
      }
    }
    
    // Mid-day check (12-2 PM)
    else if (currentHour >= 12 && currentHour <= 14) {
      const percentComplete = (steps / userGoals.steps) * 100;
      
      if (percentComplete < 30) {
        // Need significant activity
        await displayNotification(
          "Midday Check-In 🏃‍♂️",
          `You've taken ${steps.toLocaleString()} steps so far (${Math.round(percentComplete)}% of your goal). A short walk during lunch could give your steps a boost!`,
          CHANNELS.MOTIVATION
        );
      } else if (percentComplete >= 30 && percentComplete < 60) {
        // Good progress but need more
        await displayNotification(
          "Halfway There! 🚶‍♀️",
          `You've taken ${steps.toLocaleString()} steps (${Math.round(percentComplete)}% of today's goal). You're making good progress!`,
          CHANNELS.MOTIVATION
        );
      }
    }
    
    // Evening reminder (5-7 PM)
    else if (currentHour >= 17 && currentHour <= 19) {
      const stepsLeft = userGoals.steps - steps;
      const percentComplete = (steps / userGoals.steps) * 100;
      
      if (percentComplete >= 80 && percentComplete < 100) {
        // Almost there!
        await displayNotification(
          "So Close! 🏁",
          `Only ${stepsLeft.toLocaleString()} steps to go! A quick evening walk can help you reach your goal today.`,
          CHANNELS.ACHIEVEMENTS
        );
      } else if (percentComplete >= 50 && percentComplete < 80) {
        // Need more activity to reach goal
        await displayNotification(
          "Evening Boost 🌆",
          `You've taken ${steps.toLocaleString()} steps today. A 20-minute walk can help you get closer to your ${userGoals.steps.toLocaleString()} step goal!`,
          CHANNELS.MOTIVATION
        );
      }
    }
    
    // Achievement notification (anytime)
    if (steps >= userGoals.steps) {
      const lastGoalNotification = await AsyncStorage.getItem('LAST_GOAL_NOTIFICATION_DATE');
      const today = new Date().setHours(0, 0, 0, 0);
      
      // Only notify once per day when goal is achieved
      if (!lastGoalNotification || parseInt(lastGoalNotification) < today) {
        await displayNotification(
          "Goal Achieved! 🎉",
          `Congratulations ${userProfile.name}! You've reached your step goal of ${userGoals.steps.toLocaleString()} steps today. Amazing work!`,
          CHANNELS.ACHIEVEMENTS
        );
        
        // Save notification date to prevent duplicates
        await AsyncStorage.setItem('LAST_GOAL_NOTIFICATION_DATE', Date.now().toString());
      }
    }
  }
  
  // ===== HEART RATE INSIGHTS =====
  if (typeof heartRate === 'number') {
    // Check resting heart rate during sleep/rest hours
    if ((currentHour >= 22 || currentHour <= 6) && heartRate < 65) {
      await displayNotification(
        "Excellent Resting Heart Rate ❤️",
        "Your resting heart rate is looking great! This is a sign of good cardiovascular health.",
        CHANNELS.ACHIEVEMENTS
      );
    }
    
    // Heart rate too high during rest
    else if ((currentHour >= 22 || currentHour <= 6) && heartRate > 85) {
      await displayNotification(
        "Heart Rate Alert 💓",
        "Your heart rate is a bit elevated while resting. Try some deep breathing exercises to help it lower.",
        CHANNELS.REMINDERS
      );
    }
    
    // Check for exercise
    else if (heartRate > userGoals.heartRate.max) {
      // Check if we haven't sent a workout notification today
      const lastWorkoutNotification = await AsyncStorage.getItem('LAST_WORKOUT_NOTIFICATION_DATE');
      const today = new Date().setHours(0, 0, 0, 0);
      
      if (!lastWorkoutNotification || parseInt(lastWorkoutNotification) < today) {
        await displayNotification(
          "Great Workout Detected! 💪",
          "Your elevated heart rate suggests you're exercising. Keep going - you're building a stronger heart!",
          CHANNELS.ACHIEVEMENTS
        );
        
        // Save notification date
        await AsyncStorage.setItem('LAST_WORKOUT_NOTIFICATION_DATE', Date.now().toString());
      }
    }
  }
  
  // ===== SLEEP QUALITY INSIGHTS =====
  if (sleep && typeof sleep.deepSleep === 'number' && typeof sleep.lightSleep === 'number') {
    const totalSleepHours = (sleep.deepSleep + sleep.lightSleep) / 60; // Convert minutes to hours
    const deepSleepPercentage = sleep.deepSleep / (sleep.deepSleep + sleep.lightSleep) * 100;
    
    // Morning sleep quality report (7-9 AM)
    if (currentHour >= 7 && currentHour <= 9) {
      if (totalSleepHours >= userGoals.sleep) {
        await displayNotification(
          "Great Sleep Quality! 😴",
          `You got ${totalSleepHours.toFixed(1)} hours of sleep with ${deepSleepPercentage.toFixed(0)}% deep sleep. You're going to have a great day!`,
          CHANNELS.ACHIEVEMENTS
        );
      } else if (totalSleepHours >= userGoals.sleep * 0.75) {
        await displayNotification(
          "Sleep Insights 💤",
          `You got ${totalSleepHours.toFixed(1)} hours of sleep last night. Try to get to bed a bit earlier tonight to reach your ${userGoals.sleep} hour goal.`,
          CHANNELS.REMINDERS
        );
      } else {
        await displayNotification(
          "Sleep Matters 🌙",
          `You only got ${totalSleepHours.toFixed(1)} hours of sleep. Consider taking a short power nap today, and prioritize sleep tonight.`,
          CHANNELS.REMINDERS
        );
      }
    }
    
    // Evening reminder for better sleep (9-10 PM)
    else if (currentHour >= 21 && currentHour <= 22) {
      // If they didn't get enough sleep last night, remind them
      if (totalSleepHours < userGoals.sleep) {
        await displayNotification(
          "Bedtime Approaching 🌙",
          `Based on your sleep data, try to head to bed within the next hour to reach your ${userGoals.sleep} hour sleep goal.`,
          CHANNELS.REMINDERS
        );
      }
    }
  }
  
  // ===== BLOOD OXYGEN INSIGHTS =====
  if (typeof bloodOxygen === 'number' && bloodOxygen > 0) {
    if (bloodOxygen < 95) {
      // Low blood oxygen alert
      await displayNotification(
        "Blood Oxygen Alert 📊",
        "Your blood oxygen level is a bit low. Consider getting some fresh air or practicing deep breathing exercises.",
        CHANNELS.REMINDERS
      );
    } else if (bloodOxygen >= 98) {
      // Excellent blood oxygen
      await displayNotification(
        "Excellent Blood Oxygen 👍",
        "Your blood oxygen level is at an optimal range. Great job taking care of your respiratory health!",
        CHANNELS.ACHIEVEMENTS
      );
    }
  }
  
  // ===== INACTIVITY ALERTS =====
  if (lastSynced) {
    const lastActivity = new Date(lastSynced).getTime();
    const inactiveTime = now - lastActivity;
    
    // Alert after 3 hours of inactivity during daytime
    if (inactiveTime > 3 * 60 * 60 * 1000 && currentHour >= 9 && currentHour <= 20) {
      // Get last inactivity reminder time
      const lastInactivityReminder = await AsyncStorage.getItem('LAST_INACTIVITY_REMINDER');
      
      // Only send if we haven't sent one in the last 3 hours
      if (!lastInactivityReminder || now - parseInt(lastInactivityReminder) > 3 * 60 * 60 * 1000) {
        await displayNotification(
          "Time to Move! 🏃‍♂️",
          "You've been inactive for a while. Even a short 5-minute walk can improve your energy and focus.",
          CHANNELS.MOTIVATION
        );
        
        // Save reminder time
        await AsyncStorage.setItem('LAST_INACTIVITY_REMINDER', now.toString());
      }
    }
  }
}

/**
 * Get yesterday's health data from AsyncStorage
 * @returns Yesterday's health data or null if not available
 */
async function getYesterdayData(): Promise<any> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format as YYYY-MM-DD
    const dateKey = yesterday.toISOString().split('T')[0];
    
    const data = await AsyncStorage.getItem(`HEALTH_DATA_${dateKey}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting yesterday\'s data:', error);
    return null;
  }
}

/**
 * Save daily health data summary to AsyncStorage
 * @param deviceData Current device data to save
 */
export async function saveDailyHealthData(deviceData: any): Promise<void> {
  if (!deviceData) return;
  
  try {
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Save to AsyncStorage with today's date as key
    await AsyncStorage.setItem(`HEALTH_DATA_${dateKey}`, JSON.stringify(deviceData));
    console.log('Daily health data saved successfully');
  } catch (error) {
    console.error('Error saving daily health data:', error);
  }
}

// Export an object with all notification functions
export default {
  setupNotificationChannels,
  requestPermissions,
  displayNotification,
  checkAndSendInactivityReminder,
  sendGoalReachedNotification,
  sendStreakNotification,
  sendGoodSleepNotification,
  sendHeartRateNotification,
  sendProgressUpdateNotification,
  sendStepGoalReminderNotification,
  processHealthDataForNotifications,
  saveDailyHealthData,
  processSmartRingData,
  getYesterdayData
}; 