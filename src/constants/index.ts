// Direct exports of all constants
export const COLORS = {
  primary: '#5E60CE',
  secondary: '#64DFDF',
  tertiary: '#7400B8',
  background: '#F5F7FA',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8D9AA5',
  lightGray: '#EAEDF2',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FFC107',
  purple: '#6200EA',
  teal: '#00BCD4',
  pink: '#E91E63',
  blue: '#2196F3',
  darkBlue: '#0D47A1',
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  xlarge: 24,
  xxlarge: 32,
  xxxlarge: 48,
  width: 375, // Design screen width
  height: 812, // Design screen height
};

export const FONTS = {
  regular: 'Roboto-Regular',
  medium: 'Roboto-Medium',
  bold: 'Roboto-Bold',
  light: 'Roboto-Light',
};

// Rename SHADOWS to ELEVATION_STYLES to avoid any potential conflicts
export const ELEVATION_STYLES = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
};

// Health metrics constants
export const HEALTH_METRICS = {
  HEART_RATE: 'heart_rate',
  STEPS: 'steps',
  CALORIES: 'calories',
  SLEEP: 'sleep',
  BLOOD_OXYGEN: 'blood_oxygen',
  TEMPERATURE: 'temperature',
};

// Screen names for navigation
export const SCREENS = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  HOME: 'Home',
  DASHBOARD: 'Dashboard',
  PROFILE: 'Profile',
  DEVICE_CONNECT: 'DeviceConnect',
  SLEEP_TRACKER: 'SleepTracker',
  HEART_RATE: 'HeartRate',
  ACTIVITY: 'Activity',
  SETTINGS: 'Settings',
  NOTIFICATIONS: 'Notifications',
  STEPS: 'Steps',
  SLEEP: 'Sleep',
  CYCLING: 'Cycling',
};

// Time periods for data filtering
export const TIME_PERIODS = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
};

// Device connection status
export const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  SEARCHING: 'searching',
  ERROR: 'error',
};

// Firebase collections
export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  HEALTH_DATA: 'health_data',
  ACTIVITIES: 'activities',
  SLEEP_DATA: 'sleep_data',
};

export const SPACING = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

// Screen dimensions
export const SCREEN = {
  padding: 16,
  borderRadius: 12,
};

// Device Types
export const DEVICE_TYPES = {
  RING: 'ring',
  WATCH: 'watch',
  BAND: 'band',
}; 