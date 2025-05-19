import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../components/BackButton';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();
  
  // Theme context
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  const navigateBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
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
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 32 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.lastUpdated, { color: colors.textSecondary }]}>
          Last updated: June 15, 2023
        </Text>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Introduction</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          HealthTracker app is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by HealthTracker when you use our mobile application ("App").
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          By using the App, you agree to the collection and use of information in accordance with this policy.
        </Text>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Information We Collect</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We collect several different types of information for various purposes to provide and improve our service to you:
        </Text>
        
        <Text style={[styles.subSectionTitle, { color: colors.text }]}>Personal Data</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          While using our App, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. This may include:
        </Text>
        <View style={styles.bulletPoints}>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Email address</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• First name and last name</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Date of birth</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Gender</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Emergency contact information</Text>
        </View>
        
        <Text style={[styles.subSectionTitle, { color: colors.text }]}>Health Data</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          Our App collects health-related data that you provide or that is collected through connected devices, including:
        </Text>
        <View style={styles.bulletPoints}>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Heart rate measurements</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Activity and exercise information</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Sleep data</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Medical conditions</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Height and weight</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Blood type</Text>
        </View>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>How We Use Your Information</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We use the collected data for various purposes:
        </Text>
        <View style={styles.bulletPoints}>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• To provide and maintain our service</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• To notify you about changes to our service</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• To provide customer support</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• To gather analysis or valuable information so that we can improve our service</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• To detect, prevent, and address technical issues</Text>
        </View>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Security</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          The security of your data is important to us. We implement appropriate security measures to protect your personal information, including encryption of sensitive health data. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Data Rights</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You have the right to:
        </Text>
        <View style={styles.bulletPoints}>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Access your personal information</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Correct inaccurate information</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Delete your data</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Export your data in a common format</Text>
          <Text style={[styles.bulletPoint, { color: colors.text }]}>• Restrict or object to certain processing of your data</Text>
        </View>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You can exercise these rights through the Settings section of the App or by contacting us.
        </Text>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Changes to This Privacy Policy</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
        </Text>
        
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Us</Text>
        <Text style={[styles.paragraph, { color: colors.text }]}>
          If you have any questions about this Privacy Policy, please contact us through the App's feedback feature or through our support channels accessible from the Settings screen.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 15,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 20,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletPoints: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6,
  },
});

export default PrivacyPolicyScreen; 