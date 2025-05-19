import React from 'react';
import { StatusBar, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/**
 * A StatusBar component that automatically adapts to the current theme
 */
const ThemedStatusBar = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <StatusBar 
      barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
      backgroundColor={isDarkMode ? '#121212' : '#5E60CE'}
      translucent={Platform.OS === 'android'}
    />
  );
};

export default ThemedStatusBar; 