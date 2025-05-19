import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  View
} from 'react-native';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import Feather from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';

interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  color?: string;
  iconSize?: number;
  inGradientHeader?: boolean;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  onPress, 
  style, 
  color, 
  iconSize = 20,
  inGradientHeader = false
}) => {
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  const iconColor = color || (inGradientHeader ? '#FFFFFF' : colors.text);
  
  // If the button is already in a gradient header, use a simple transparent background
  if (inGradientHeader) {
    return (
      <TouchableOpacity 
        style={[styles.inGradientButton, style]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Feather name="chevron-left" size={iconSize} color={iconColor} />
      </TouchableOpacity>
    );
  }
  
  // For standard usage, create a button with subtle gradient or solid background
  return (
    <TouchableOpacity 
      style={[styles.buttonContainer, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={
          isDarkMode 
            ? ['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)'] 
            : [colors.background, colors.background]
        }
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientContainer}
      >
        <Feather name="chevron-left" size={iconSize} color={iconColor} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  inGradientButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  }
});

export default BackButton; 