import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Switch,
  TextInput,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatePicker from 'react-native-date-picker';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import BackButton from '../components/BackButton';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, ELEVATION_STYLES } from '../constants';
import { firestore, getCurrentUser } from '../services/firebase';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';

interface HealthData {
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: string;
  bloodType: string;
  medicalConditions: string;
  medications: string;
  allergies: string;
  isPregnant: boolean;
  photoURL: string;
}

// Helper component to show edit guidance
const EditModeGuide = ({ colors }: { colors: any }) => {
  return (
    <View style={[styles.guideCard, { backgroundColor: `${colors.primary}20` }]}>
      <Text style={[styles.guideText, { color: colors.text }]}>
        Tap on any field to enter your health information. Fields will clear automatically when you tap them.
      </Text>
    </View>
  );
};

const HealthDetailsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [healthData, setHealthData] = useState<HealthData>({
    dateOfBirth: 'Not set',
    gender: 'Not set',
    height: 'Not set',
    weight: 'Not set',
    bloodType: 'Not set',
    medicalConditions: 'None',
    medications: 'None',
    allergies: 'None',
    isPregnant: false,
    photoURL: '',
  });

  // Theme context
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  // Initial fetch
  useEffect(() => {
    fetchHealthData();
  }, []);

  // Add a focus effect to reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('Health Details screen is focused, fetching data again');
      fetchHealthData();
      return () => {
        // This runs when screen loses focus
        console.log('Health Details screen lost focus');
      };
    }, [])
  );

  const fetchHealthData = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      console.log('Fetching health details from AsyncStorage for user:', user.uid);

      // Check if data exists in AsyncStorage
      const storedData = await AsyncStorage.getItem(`health_details_${user.uid}`);
      
      if (storedData) {
        // Parse and use the data from AsyncStorage
        const localHealthData = JSON.parse(storedData);
        console.log('Found health details in AsyncStorage');
          setHealthData({
          ...localHealthData,
            photoURL: user.photoURL || '',
          });
        } else {
        // If no data found, just set default values
        console.log('No health details found in AsyncStorage');
          setHealthData({
          dateOfBirth: 'Not set',
          gender: 'Not set',
          height: 'Not set',
          weight: 'Not set',
          bloodType: 'Not set',
          medicalConditions: 'None',
          medications: 'None',
          allergies: 'None',
          isPregnant: false,
            photoURL: user.photoURL || '',
          });
      }
    } catch (error) {
      console.error('Error fetching health data from AsyncStorage:', error);
      // Set default values in case of error
      setHealthData({
        dateOfBirth: 'Not set',
        gender: 'Not set',
        height: 'Not set',
        weight: 'Not set',
        bloodType: 'Not set',
        medicalConditions: 'None',
        medications: 'None',
        allergies: 'None',
        isPregnant: false,
        photoURL: user.photoURL || '',
      });
    }
  };

  const navigateBack = () => {
    if (editMode) {
      Alert.alert(
        "Discard Changes?",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          { 
            text: "Discard", 
            onPress: () => {
              setEditMode(false);
              fetchHealthData(); // Reset to original data
            }
          }
        ]
      );
    } else {
    navigation.goBack();
    }
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleInputChange = (field: keyof HealthData, value: string | boolean) => {
    setHealthData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Function to handle date selection from date picker
  const handleDateSelection = (date: Date) => {
    // Format the date as YYYY-MM-DD
    const formattedDate = date.toISOString().split('T')[0];
    handleInputChange('dateOfBirth', formattedDate);
    setDatePickerOpen(false);
  };

  // Helper function to focus text input and clear "Not set" placeholder
  const handleFocus = (field: keyof HealthData) => {
    if (healthData[field] === 'Not set') {
      setHealthData(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const saveHealthData = async () => {
    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save health details');
      return;
    }

    // Format and validate data before saving
    const formattedData = {
      dateOfBirth: healthData.dateOfBirth.trim() === '' ? 'Not set' : healthData.dateOfBirth.trim(),
      gender: healthData.gender.trim() === '' ? 'Not set' : healthData.gender.trim(),
      height: healthData.height.trim() === '' ? 'Not set' : healthData.height.trim(),
      weight: healthData.weight.trim() === '' ? 'Not set' : healthData.weight.trim(),
      bloodType: healthData.bloodType.trim() === '' ? 'Not set' : healthData.bloodType.trim(),
      medicalConditions: healthData.medicalConditions.trim() === '' ? 'None' : healthData.medicalConditions.trim(),
      medications: healthData.medications.trim() === '' ? 'None' : healthData.medications.trim(),
      allergies: healthData.allergies.trim() === '' ? 'None' : healthData.allergies.trim(),
      isPregnant: healthData.isPregnant,
    };

    try {
      setIsSubmitting(true);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(`health_details_${user.uid}`, JSON.stringify(formattedData));
      console.log('Saved health details to AsyncStorage');

      // Update local state with formatted data
      setHealthData({
        ...healthData,
        ...formattedData
      });

      setEditMode(false);
      Alert.alert('Success', 'Health details saved successfully');
    } catch (error) {
      console.error('Error saving health data:', error);
      Alert.alert('Error', 'Failed to save health details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBasicInfoSection = () => {
    if (editMode) {
  return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }]}>
              <Text style={styles.sectionIcon}>👤</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Date of Birth</Text>
            <TouchableOpacity 
              style={[styles.input, { color: colors.text, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
              onPress={() => setDatePickerOpen(true)}
            >
              <Text style={{ color: healthData.dateOfBirth === 'Not set' ? (isDarkMode ? "#999" : "#999") : colors.text }}>
                {healthData.dateOfBirth === 'Not set' ? 'Select Date' : healthData.dateOfBirth}
              </Text>
              <Feather name="calendar" size={20} color={colors.primary} />
            </TouchableOpacity>
            
            <DatePicker
              modal
              open={datePickerOpen}
              mode="date"
              date={(() => {
                try {
                  if (healthData.dateOfBirth === 'Not set') {
                    return new Date(2000, 0, 1); // Default date - January 1, 2000
                  } else {
                    const parsedDate = new Date(healthData.dateOfBirth);
                    // Check if the date is valid
                    return isNaN(parsedDate.getTime()) ? new Date(2000, 0, 1) : parsedDate;
                  }
                } catch (error) {
                  console.error('Error parsing date:', error);
                  return new Date(2000, 0, 1); // Fallback to default date
                }
              })()}
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              onConfirm={handleDateSelection}
              onCancel={() => setDatePickerOpen(false)}
              title="Select Date of Birth"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Gender</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }]}
              value={healthData.gender}
              onChangeText={(value) => handleInputChange('gender', value)}
              placeholder="Male, Female, Other"
              placeholderTextColor={isDarkMode ? "#999" : "#999"}
              onFocus={() => handleFocus('gender')}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Height</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }]}
              value={healthData.height}
              onChangeText={(value) => handleInputChange('height', value)}
              placeholder="e.g. 5'11 or 180 cm"
              placeholderTextColor={isDarkMode ? "#999" : "#999"}
              onFocus={() => handleFocus('height')}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Weight</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }]}
              value={healthData.weight}
              onChangeText={(value) => handleInputChange('weight', value)}
              placeholder="e.g. 80 kg"
              placeholderTextColor={isDarkMode ? "#999" : "#999"}
              keyboardType="decimal-pad"
              onFocus={() => handleFocus('weight')}
            />
      </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Blood Type</Text>
            <TextInput 
              style={[styles.input, { color: colors.text, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }]}
              value={healthData.bloodType}
              onChangeText={(value) => handleInputChange('bloodType', value)}
              placeholder="A+, B-, O+, etc."
              placeholderTextColor={isDarkMode ? "#999" : "#999"}
              onFocus={() => handleFocus('bloodType')}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }]}>
            <Text style={styles.sectionIcon}>👤</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
        </View>

            <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Date of Birth</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{healthData.dateOfBirth}</Text>
            </View>
        <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F0F0F0' }]} />

            <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoIcon}>⚧</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Gender</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{healthData.gender}</Text>
            </View>
        <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F0F0F0' }]} />

            <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoIcon}>📏</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Height</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{healthData.height}</Text>
            </View>
        <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F0F0F0' }]} />

            <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoIcon}>⚖️</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Weight</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{healthData.weight}</Text>
            </View>
        <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F0F0F0' }]} />

            <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoIcon}>🩸</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Blood Type</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{healthData.bloodType}</Text>
        </View>
      </View>
    );
  };

  const renderMedicalInfoSection = () => {
    if (editMode) {
      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }]}>
              <Text style={styles.sectionIcon}>🏥</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Medical Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Medical Conditions</Text>
            <TextInput 
              style={[
                styles.input, 
                styles.multilineInput,
                { color: colors.text, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }
              ]}
              value={healthData.medicalConditions}
              onChangeText={(value) => handleInputChange('medicalConditions', value)}
              placeholder="List any medical conditions"
              placeholderTextColor={isDarkMode ? "#999" : "#999"}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={() => healthData.medicalConditions === 'None' && handleInputChange('medicalConditions', '')}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Medications</Text>
            <TextInput 
              style={[
                styles.input, 
                styles.multilineInput,
                { color: colors.text, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }
              ]}
              value={healthData.medications}
              onChangeText={(value) => handleInputChange('medications', value)}
              placeholder="List any medications"
              placeholderTextColor={isDarkMode ? "#999" : "#999"}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={() => healthData.medications === 'None' && handleInputChange('medications', '')}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Allergies</Text>
            <TextInput 
              style={[
                styles.input, 
                styles.multilineInput,
                { color: colors.text, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }
              ]}
              value={healthData.allergies}
              onChangeText={(value) => handleInputChange('allergies', value)}
              placeholder="List any allergies"
              placeholderTextColor={isDarkMode ? "#999" : "#999"}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onFocus={() => healthData.allergies === 'None' && handleInputChange('allergies', '')}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }]}>
            <Text style={styles.sectionIcon}>🏥</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Medical Information</Text>
        </View>

            <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoIcon}>🩺</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Medical Conditions</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{healthData.medicalConditions}</Text>
            </View>
        <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F0F0F0' }]} />

            <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoIcon}>💊</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Medications</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{healthData.medications}</Text>
            </View>
        <View style={[styles.divider, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F0F0F0' }]} />

            <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoIcon}>⚠️</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Allergies</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{healthData.allergies}</Text>
        </View>
      </View>
    );
  };

  const renderPregnancySection = () => {
    if (healthData.gender?.toLowerCase() !== 'female') {
      return null;
    }

    if (editMode) {
      return (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }]}>
              <Text style={styles.sectionIcon}>🤰</Text>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Pregnancy Status</Text>
          </View>

          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: colors.text }]}>Currently Pregnant</Text>
            <Switch
              trackColor={{ false: '#E0E0E0', true: `${colors.primary}80` }}
              thumbColor={healthData.isPregnant ? colors.primary : isDarkMode ? "#888" : "#BDBDBD"}
              ios_backgroundColor="#E0E0E0"
              onValueChange={(value) => handleInputChange('isPregnant', value)}
              value={healthData.isPregnant}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.sectionIconContainer, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA' }]}>
            <Text style={styles.sectionIcon}>🤰</Text>
          </View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pregnancy Status</Text>
            </View>

        <View style={styles.infoRow}>
          <View style={styles.infoLabelContainer}>
            <Text style={styles.infoIcon}>🍼</Text>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Currently Pregnant</Text>
          </View>
          <Text style={[styles.infoValue, { color: colors.text }]}>{healthData.isPregnant ? 'Yes' : 'No'}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
          <BackButton onPress={navigateBack} inGradientHeader={true} />
          <Text style={styles.headerTitle}>Health Details</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={toggleEditMode}
          >
            <Feather 
              name={editMode ? 'check' : 'edit-2'} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
          {editMode && <EditModeGuide colors={colors} />}
        
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
        >
          {renderBasicInfoSection()}
          {renderMedicalInfoSection()}
              {healthData.gender === 'Female' && renderPregnancySection()}
      </ScrollView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
        
        {editMode && (
          <View style={[styles.actionButtonsContainer, { 
            backgroundColor: colors.background,
            borderTopColor: colors.border
          }]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f5f5f5' }]}
              onPress={() => {
                setEditMode(false);
                fetchHealthData(); // Reset to original data
              }}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={saveHealthData}
              disabled={isSubmitting}
            >
              <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  editButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 180 : 150, // Increased bottom padding to avoid button overlap
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    maxWidth: '50%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 16,
  },
  guideCard: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  guideText: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HealthDetailsScreen; 