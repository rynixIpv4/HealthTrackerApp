import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar, useColorScheme, Platform } from 'react-native';

// Define theme types
export type ThemeType = 'light' | 'dark';

// Dark Theme Colors
const DarkTheme = {
  primary: '#4285F4',
  secondary: '#3367D6',
  accent: '#03DAC6',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  border: '#2C2C2C',
  icon: '#BEBEBE',
  card: '#1E1E1E',
  error: '#CF6679',
  warning: '#FFCA28',
  success: '#4CAF50',
  buttonText: '#FFFFFF',
  disabled: '#666666',
  // Chart colors 
  chartRed: '#F44336',
  chartBlue: '#2196F3',
  chartGreen: '#4CAF50',
  chartOrange: '#FF9800',
  chartPurple: '#9C27B0',
  // Card background colors
  cardHeart: '#1E1E1E',
  cardSteps: '#1E1E1E',
  cardSleep: '#1E1E1E',
  cardCycling: '#1E1E1E',
  // Additional UI colors
  divider: '#2C2C2C',
  cardHeaderBg: '#262626',
  tabActive: '#4285F4',
  tabInactive: '#555555',
  darkBackground: '#121212',
  lightBackground: '#1F1F1F',
};

// Light Theme Colors
const LightTheme = {
  primary: '#4285F4',
  secondary: '#3367D6',
  accent: '#03DAC6',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#757575',
  border: '#E0E0E0',
  icon: '#757575',
  card: '#FFFFFF',
  error: '#B00020',
  warning: '#FFA000',
  success: '#4CAF50',
  buttonText: '#FFFFFF',
  disabled: '#BDBDBD',
  // Chart colors
  chartRed: '#F44336',
  chartBlue: '#2196F3',
  chartGreen: '#4CAF50',
  chartOrange: '#FF9800',
  chartPurple: '#9C27B0',
  // Card background colors
  cardHeart: '#FFFFFF',
  cardSteps: '#FFFFFF',
  cardSleep: '#FFFFFF',
  cardCycling: '#FFFFFF',
  // Additional UI colors
  divider: '#EEEEEE',
  cardHeaderBg: '#F8F8F8',
  tabActive: '#4285F4',
  tabInactive: '#BDBDBD',
  darkBackground: '#121212',
  lightBackground: '#FFFFFF',
};

// Get theme colors based on theme type
export const getThemeColors = (theme: ThemeType) => {
  return theme === 'dark' ? DarkTheme : LightTheme;
};

// Theme context props
interface ThemeContextProps {
  theme: ThemeType;
  toggleTheme: () => void;
  isDarkMode: boolean;
  colors: ReturnType<typeof getThemeColors>;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  toggleTheme: () => {},
  isDarkMode: false,
  colors: getThemeColors('light')
});

// Storage key for theme preference
const THEME_STORAGE_KEY = 'app_theme_mode';

// Theme provider component
export const ThemeProvider: React.FC<{children: React.ReactNode, forcedTheme?: ThemeType}> = ({ 
  children, 
  forcedTheme 
}) => {
  // Always get system preference first
  const systemColorScheme = useColorScheme() as ThemeType || 'light';
  const [theme, setTheme] = useState<ThemeType>(forcedTheme || 'light'); // Default to light or forced theme
  const [isLoaded, setIsLoaded] = useState(forcedTheme ? true : false);
  
  useEffect(() => {
    // If forcedTheme is provided, use it and skip loading
    if (forcedTheme) {
      setTheme(forcedTheme);
      setIsLoaded(true);
      return;
    }
    
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        // If a theme was saved, use it
        if (savedTheme) {
          setTheme(savedTheme as ThemeType);
        } else {
          // Otherwise use system preference
          setTheme(systemColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
        // Use system preference as fallback
        setTheme(systemColorScheme);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadTheme();
  }, [systemColorScheme, forcedTheme]);
  
  // Toggle theme
  const toggleTheme = async () => {
    // If using forced theme, don't allow toggling
    if (forcedTheme) return;
    
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };
  
  const isDarkMode = theme === 'dark';
  const colors = getThemeColors(theme);
  
  // Return a loading placeholder until theme is loaded
  if (!isLoaded) {
    return (
      <ThemeContext.Provider 
        value={{
          theme: 'light',
          toggleTheme,
          isDarkMode: false,
          colors: getThemeColors('light')
        }}
      >
        {children}
      </ThemeContext.Provider>
    );
  }
  
  // Provide theme context
  return (
    <ThemeContext.Provider 
      value={{
        theme,
        toggleTheme,
        isDarkMode,
        colors
      }}
    >
      {/* StatusBar is now managed by App.tsx */}
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => useContext(ThemeContext); 