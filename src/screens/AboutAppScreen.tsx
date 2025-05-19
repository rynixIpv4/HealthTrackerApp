import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import BackButton from '../components/BackButton';
import { COLORS, ELEVATION_STYLES } from '../constants';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const AboutAppScreen = () => {
  const navigation = useNavigation();
  
  // Theme context
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // App information - replace with actual values in a production app
  const appInfo = {
    version: '1.0.0',
    buildNumber: '100',
    releaseDate: 'May 20, 2025',
    developer: 'HealthTracker Team',
    website: 'https://healthtracker.example.com',
    email: 'support@healthtracker.example.com',
    privacyPolicy: 'https://healthtracker.example.com/privacy',
    termsOfService: 'https://healthtracker.example.com/terms',
  };

  const navigateBack = () => {
    navigation.goBack();
  };

  const handleOpenLink = (url) => {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.log(`Cannot open URL: ${url}`);
      }
    });
  };

  const handleContactSupport = () => {
    Linking.openURL(`mailto:${appInfo.email}`);
  };

  const navigateToPrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="light-content" 
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
          <BackButton 
            onPress={navigateBack} 
            inGradientHeader={true} 
          />
          <Text style={styles.headerTitle}>About</Text>
          <View style={{ width: 32 }} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={[styles.scrollView, { backgroundColor: colors.background }]} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.appInfoContainer}>
          <Text style={[styles.appName, { color: colors.text }]}>HealthTracker</Text>
          <Text style={[styles.appDescription, { color: colors.textSecondary }]}>
            Your personal health companion
          </Text>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>
            Version {appInfo.version} ({appInfo.buildNumber})
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{appInfo.version}</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Build</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{appInfo.buildNumber}</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Release Date</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{appInfo.releaseDate}</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Platform</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{Platform.OS} {Platform.Version}</Text>
          </View>
          
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Developer</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{appInfo.developer}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy Policy</Text>
          
          <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
            We take your privacy seriously. The HealthTracker app collects and processes 
            personal health data to provide you with the best experience. Your data is:
          </Text>
          
          <View style={styles.privacyPoints}>
            <View style={styles.privacyPoint}>
              <Feather name="check-circle" size={18} color={colors.primary} style={styles.pointIcon} />
              <Text style={[styles.pointText, { color: colors.text }]}>
                Securely stored and encrypted
              </Text>
            </View>
            
            <View style={styles.privacyPoint}>
              <Feather name="check-circle" size={18} color={colors.primary} style={styles.pointIcon} />
              <Text style={[styles.pointText, { color: colors.text }]}>
                Not shared with third parties without consent
              </Text>
            </View>
            
            <View style={styles.privacyPoint}>
              <Feather name="check-circle" size={18} color={colors.primary} style={styles.pointIcon} />
              <Text style={[styles.pointText, { color: colors.text }]}>
                Only used to provide health tracking functionality
              </Text>
            </View>
            
            <View style={styles.privacyPoint}>
              <Feather name="check-circle" size={18} color={colors.primary} style={styles.pointIcon} />
              <Text style={[styles.pointText, { color: colors.text }]}>
                Accessible to you for export or deletion at any time
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.privacyButton, { borderColor: colors.primary + '50' }]}
            onPress={navigateToPrivacyPolicy}
          >
            <Text style={[styles.privacyButtonText, { color: colors.primary }]}>Read Full Privacy Policy</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Links</Text>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => handleOpenLink('https://github.com')}
          >
            <View style={styles.contactItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#303F9F20' : '#F0EEFF' }]}>
                <Feather name="github" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.contactItemText, { color: colors.text }]}>GitHub Repository</Text>
            </View>
            <Feather name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            © 2023 HealthTracker. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  appInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 16,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    ...ELEVATION_STYLES.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
  },
  privacyText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  privacyPoints: {
    marginBottom: 16,
  },
  privacyPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  pointIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  privacyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginTop: 8,
  },
  privacyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  contactItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  footerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
});

export default AboutAppScreen; 