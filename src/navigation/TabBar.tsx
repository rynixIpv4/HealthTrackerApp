import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { ELEVATION_STYLES } from '../constants';

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.surface }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Determine which icon to use based on route name
        let iconName;
        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Activity':
            iconName = 'activity';
            break;
          case 'DeviceConnect':
            iconName = 'bluetooth';
            break;
          case 'Settings':
            iconName = 'settings';
            break;
          default:
            iconName = 'circle';
        }

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Feather
              name={iconName}
              size={24}
              color={isFocused ? colors.primary : colors.icon}
            />
            {isFocused && (
              <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 25,
    left: 16,
    right: 16,
    height: 60,
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    ...ELEVATION_STYLES.medium,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    position: 'absolute',
    bottom: -5,
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});

export default CustomTabBar; 