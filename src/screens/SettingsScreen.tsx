import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, ELEVATION_STYLES } from '../constants';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

type NavigationProps = StackNavigationProp<any>;

const SettingsScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  const navigateTo = (screen: string) => {
      navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent
      />
      
      {/* Gradient Header */}
      <LinearGradient
        colors={['#5E60CE', '#6930C3', '#7400B8']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Groups */}
        <View style={styles.settingsContainer}>
          {/* Preferences Group */}
          <View style={styles.settingsGroup}>
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>PREFERENCES</Text>
            
          {/* Dark Mode Toggle */}
            <View style={[styles.settingCard, { backgroundColor: colors.surface }]}>
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={isDarkMode ? ['#424242', '#212121'] : ['#FFECB3', '#FFD54F']}
                  style={styles.iconContainer}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                >
                  <Feather name={isDarkMode ? "moon" : "sun"} size={22} color={isDarkMode ? "#FFF" : "#FB8C00"} />
                </LinearGradient>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                  </Text>
            </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
                trackColor={{ false: '#D1D5DB', true: colors.primary + '70' }}
                thumbColor={isDarkMode ? colors.primary : '#F9FAFB'}
                ios_backgroundColor="#D1D5DB"
            />
            </View>
          </View>
          
          {/* Account Group */}
          <View style={styles.settingsGroup}>
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>ACCOUNT</Text>
          
          {/* Profile & Account */}
          <TouchableOpacity 
              style={[styles.settingCard, { backgroundColor: colors.surface }]} 
            onPress={() => navigateTo('ProfileAccount')}
              activeOpacity={0.7}
          >
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={['#5E60CE', '#6930C3']}
                  style={styles.iconContainer}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                >
                  <Feather name="user" size={22} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: colors.text }]}>Profile & Account</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Manage your profile information
                  </Text>
            </View>
            </View>
              <View style={[styles.arrowContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Feather name="chevron-right" size={22} color={colors.textSecondary} />
              </View>
          </TouchableOpacity>

          {/* Security */}
          <TouchableOpacity 
              style={[styles.settingCard, { backgroundColor: colors.surface }]} 
            onPress={() => navigateTo('Security')}
              activeOpacity={0.7}
          >
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={['#4CAF50', '#009688']}
                  style={styles.iconContainer}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                >
                  <Feather name="shield" size={22} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: colors.text }]}>Security</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Password and login settings
                  </Text>
                </View>
              </View>
              <View style={[styles.arrowContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Feather name="chevron-right" size={22} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Notifications Group */}
          <View style={styles.settingsGroup}>
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>NOTIFICATIONS</Text>
            
            {/* Notifications */}
            <TouchableOpacity 
              style={[styles.settingCard, { backgroundColor: colors.surface }]} 
              onPress={() => navigateTo('Notifications')}
              activeOpacity={0.7}
            >
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={['#2196F3', '#3F51B5']}
                  style={styles.iconContainer}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                >
                  <Feather name="bell" size={22} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Configure alerts and reminders
                  </Text>
        </View>
            </View>
              <View style={[styles.arrowContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
            <Feather name="chevron-right" size={22} color={colors.textSecondary} />
              </View>
          </TouchableOpacity>
          </View>
          
          {/* About Group */}
          <View style={styles.settingsGroup}>
            <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>ABOUT</Text>
          
          {/* About the app */}
          <TouchableOpacity 
              style={[styles.settingCard, { backgroundColor: colors.surface }]} 
            onPress={() => navigateTo('AboutApp')}
              activeOpacity={0.7}
          >
              <View style={styles.settingLeft}>
                <LinearGradient
                  colors={['#FF9800', '#FF5722']}
                  style={styles.iconContainer}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                >
                  <Feather name="info" size={22} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingText, { color: colors.text }]}>About</Text>
                  <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                    Version, licenses, and policies
                  </Text>
                </View>
              </View>
              <View style={[styles.arrowContainer, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Feather name="chevron-right" size={22} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100, // Additional padding for tab bar
  },
  settingsContainer: {
    width: '100%',
  },
  settingsGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    ...ELEVATION_STYLES.small,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
  }
});

export default SettingsScreen; 