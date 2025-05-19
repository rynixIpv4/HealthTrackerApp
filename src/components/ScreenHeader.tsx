import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Platform, 
  StatusBar,
  ViewStyle,
  TextStyle
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BackButton from './BackButton';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

interface ScreenHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  useGradient?: boolean;
}

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBackButton = true,
  onBackPress,
  rightComponent,
  style,
  titleStyle,
  useGradient = false
}) => {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  // If using gradient background
  if (useGradient) {
    return (
      <LinearGradient
        colors={['#5E60CE', '#6930C3', '#7400B8']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={[styles.gradientHeader, style]}
      >
        <View style={styles.headerContent}>
          <View style={styles.leftContainer}>
            {showBackButton ? (
              <BackButton onPress={handleBackPress} inGradientHeader={true} />
            ) : (
              <View style={styles.emptySpace} />
            )}
          </View>
          
          <Text 
            style={[
              styles.gradientTitle, 
              titleStyle
            ]} 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          
          <View style={styles.rightContainer}>
            {rightComponent || <View style={styles.emptySpace} />}
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Default header with no gradient
  return (
    <View style={[
      styles.header, 
      { 
        backgroundColor: colors.background,
        borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      },
      style
    ]}>
      <View style={styles.leftContainer}>
        {showBackButton ? (
          <BackButton onPress={handleBackPress} color={colors.text} />
        ) : (
          <View style={styles.emptySpace} />
        )}
      </View>
      
      <Text 
        style={[
          styles.title, 
          { color: colors.text },
          titleStyle
        ]} 
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {title}
      </Text>
      
      <View style={styles.rightContainer}>
        {rightComponent || <View style={styles.emptySpace} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginTop: Platform.OS === 'android' ? 8 : 0,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight + 16) : 15,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftContainer: {
    width: 44,
    height: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  rightContainer: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  gradientTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  emptySpace: {
    width: 44,
  }
});

export default ScreenHeader; 