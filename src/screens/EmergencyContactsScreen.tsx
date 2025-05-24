import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Image,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS, ELEVATION_STYLES } from '../constants';
import BackButton from '../components/BackButton';
import { firestore, getCurrentUser } from '../services/firebase';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  photoUrl?: string;
}

const EmergencyContactsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | null>(null);

  // Theme context
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  // Form states
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relationship, setRelationship] = useState('');

  useEffect(() => {
    fetchEmergencyContacts();
  }, []);

  const fetchEmergencyContacts = async () => {
    const user = getCurrentUser();
    if (!user) return;

    try {
      setLoading(true);
      
      // First try to get contacts from AsyncStorage
      try {
        const storedContacts = await AsyncStorage.getItem(`emergency_contacts_${user.uid}`);
        if (storedContacts) {
          console.log('Retrieved emergency contacts from AsyncStorage');
          setContacts(JSON.parse(storedContacts));
          setLoading(false);
          return; // Exit if we successfully loaded from AsyncStorage
        }
      } catch (asyncError) {
        console.error('Error retrieving from AsyncStorage:', asyncError);
        // Continue to try Firestore if AsyncStorage fails
      }
      
      // Try Firestore if AsyncStorage is empty or failed
      try {
        // First, ensure the user document exists
        await firestore()
          .collection('users')
          .doc(user.uid)
          .set({
            updatedAt: firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        
        // Then fetch emergency contacts
        const snapshot = await firestore()
          .collection('users')
          .doc(user.uid)
          .collection('emergencyContacts')
          .get();

        const fetchedContacts: EmergencyContact[] = [];
        snapshot.forEach(doc => {
          fetchedContacts.push({
            id: doc.id,
            ...doc.data()
          } as EmergencyContact);
        });

        // Save to AsyncStorage for offline use
        await AsyncStorage.setItem(`emergency_contacts_${user.uid}`, JSON.stringify(fetchedContacts));
        
        setContacts(fetchedContacts);
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        // Handle specific error messages
        if (firestoreError.toString().includes('permission-denied')) {
          console.log('Firestore permission denied. Detailed error:', firestoreError);
          Alert.alert(
            'Offline Mode',
            'Unable to connect to the server. Working with locally saved contacts.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Connection Error', 
            'Unable to connect to the server. Working with locally saved contacts.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error in fetchEmergencyContacts:', error);
      Alert.alert('Error', 'An unexpected error occurred while loading contacts.');
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = () => {
    navigation.goBack();
  };

  const openAddModal = () => {
    // Reset form fields
    setName('');
    setPhoneNumber('');
    setRelationship('');
    setSelectedContact(null);
    setShowAddModal(true);
  };

  const openEditModal = (contact: EmergencyContact) => {
    setName(contact.name);
    setPhoneNumber(contact.phoneNumber);
    setRelationship(contact.relationship);
    setSelectedContact(contact);
    setShowAddModal(true);
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a contact name');
      return false;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter a phone number');
      return false;
    }
    if (!relationship.trim()) {
      Alert.alert('Error', 'Please enter your relationship to the contact');
      return false;
    }
    return true;
  };

  const saveContact = async () => {
    if (!validateForm()) return;

    const user = getCurrentUser();
    if (!user) {
      Alert.alert('Error', 'You must be logged in to manage emergency contacts');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create contact object
      const contactData = {
        name,
        phoneNumber,
        relationship,
        updatedAt: new Date().toISOString(),
      };
      
      let updatedContacts = [...contacts];
      let savedToFirestore = false;
      
      // Try to save to Firestore first
      try {
        // First, ensure the user document exists
        await firestore()
          .collection('users')
          .doc(user.uid)
          .set({
            updatedAt: firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        
        if (selectedContact) {
          // Update existing contact
          await firestore()
            .collection('users')
            .doc(user.uid)
            .collection('emergencyContacts')
            .doc(selectedContact.id)
            .update({
              ...contactData,
              updatedAt: firestore.FieldValue.serverTimestamp(),
            });
            
          updatedContacts = contacts.map(contact => 
            contact.id === selectedContact.id 
              ? { ...contact, ...contactData }
              : contact
          );
        } else {
          // Add new contact
          const docRef = await firestore()
            .collection('users')
            .doc(user.uid)
            .collection('emergencyContacts')
            .add({
              ...contactData,
              createdAt: firestore.FieldValue.serverTimestamp(),
            });

          // Add the new contact with the Firestore-generated ID
          updatedContacts = [
            ...contacts,
            { 
              id: docRef.id,
              ...contactData
            } as EmergencyContact
          ];
        }
        
        savedToFirestore = true;
      } catch (firestoreError) {
        console.error('Error saving to Firestore:', firestoreError);
        
        // If Firestore fails, we'll continue and just save to AsyncStorage
        if (!selectedContact) {
          // For new contacts, generate a local ID
          const localId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          updatedContacts = [
            ...contacts,
            { 
              id: localId,
              ...contactData
            } as EmergencyContact
          ];
        } else {
          // For existing contacts
          updatedContacts = contacts.map(contact => 
            contact.id === selectedContact.id 
              ? { ...contact, ...contactData }
              : contact
          );
        }
      }
      
      // Always update AsyncStorage with latest contacts
      await AsyncStorage.setItem(`emergency_contacts_${user.uid}`, JSON.stringify(updatedContacts));
      
      // Update state with our changes
      setContacts(updatedContacts);
      
      setShowAddModal(false);
      
      if (savedToFirestore) {
        Alert.alert('Success', selectedContact ? 'Emergency contact updated successfully' : 'Emergency contact added successfully');
      } else {
        Alert.alert('Saved Locally', 'Contact saved to your device. It will sync when you reconnect to the internet.');
      }
    } catch (error) {
      console.error('Error saving emergency contact:', error);
      Alert.alert('Error', 'Failed to save emergency contact. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    const user = getCurrentUser();
    if (!user) return;

    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this emergency contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedContacts = contacts.filter(contact => contact.id !== contactId);
              
              // Try to delete from Firestore
              try {
                await firestore()
                  .collection('users')
                  .doc(user.uid)
                  .collection('emergencyContacts')
                  .doc(contactId)
                  .delete();
              } catch (firestoreError) {
                console.error('Error deleting from Firestore:', firestoreError);
                // We'll continue even if Firestore delete fails
              }
              
              // Always update AsyncStorage
              await AsyncStorage.setItem(`emergency_contacts_${user.uid}`, JSON.stringify(updatedContacts));
              
              // Update local state
              setContacts(updatedContacts);
              Alert.alert('Success', 'Contact deleted successfully');
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact');
            }
          }
        }
      ]
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <MaterialIcons name="people" size={80} color={isDarkMode ? "#555555" : "#CCCCCC"} style={styles.emptyStateIcon} />
      <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Emergency Contacts</Text>
      <Text style={[styles.emptyStateDescription, { color: colors.textSecondary }]}>
        Add emergency contacts who should be
        notified in case of a medical emergency.
      </Text>
      <TouchableOpacity 
        style={[styles.addButton, { backgroundColor: colors.primary }]} 
        onPress={openAddModal}
      >
        <Text style={[styles.addButtonText, { color: colors.buttonText }]}>Add Emergency Contact</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContactItem = ({ item }: { item: EmergencyContact }) => (
    <View style={[styles.contactItem, { backgroundColor: colors.surface }]}>
      <View style={styles.contactInfo}>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.contactPhoto} />
        ) : (
          <View style={[styles.contactInitials, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E3F2FD' }]}>
            <Text style={styles.initialsText}>{item.name.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.contactDetails}>
          <Text style={[styles.contactName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.contactRelationship, { color: colors.textSecondary }]}>{item.relationship}</Text>
          <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{item.phoneNumber}</Text>
        </View>
      </View>
      <View style={styles.contactActions}>
        <TouchableOpacity 
          style={[styles.contactActionButton, { backgroundColor: isDarkMode ? 'rgba(94, 96, 206, 0.1)' : '#F5F7FA' }]}
          onPress={() => openEditModal(item)}
        >
          <MaterialIcons name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.contactActionButton, styles.deleteButton, { backgroundColor: isDarkMode ? 'rgba(244, 67, 54, 0.1)' : '#FFEBEE' }]}
          onPress={() => deleteContact(item.id)}
        >
          <MaterialIcons name="delete" size={20} color="#FF5252" />
      </TouchableOpacity>
      </View>
    </View>
  );

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
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <TouchableOpacity 
          style={styles.addIcon}
          onPress={openAddModal}
        >
            <Feather name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
      {contacts.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contactsList}
          showsVerticalScrollIndicator={false}
        />
      )}
      </View>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedContact ? 'Edit Contact' : 'Add Contact'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Name</Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0'
                  }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor={isDarkMode ? "#999" : "#999"}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0'
                  }]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="(123) 456-7890"
                  placeholderTextColor={isDarkMode ? "#999" : "#999"}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Relationship</Text>
                <TextInput
                  style={[styles.input, { 
                    color: colors.text,
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#F5F7FA',
                    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0'
                  }]}
                  value={relationship}
                  onChangeText={setRelationship}
                  placeholder="Spouse, Parent, Friend, etc."
                  placeholderTextColor={isDarkMode ? "#999" : "#999"}
                />
              </View>

              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={saveContact}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>Saving...</Text>
                ) : (
                  <Text style={[styles.saveButtonText, { color: colors.buttonText }]}>Save Contact</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addIcon: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: 8,
  },
  contactsList: {
    padding: 16,
  },
  contactItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  contactInitials: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  initialsText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  contactRelationship: {
    fontSize: 14,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 14,
  },
  contactActions: {
    flexDirection: 'row',
  },
  contactActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    marginLeft: 8,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  addButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmergencyContactsScreen; 