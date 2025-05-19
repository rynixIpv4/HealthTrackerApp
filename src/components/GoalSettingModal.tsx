import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storing user goals
const USER_GOALS_KEY = 'health_tracker_user_goals';

interface GoalSettingModalProps {
  isVisible: boolean;
  onClose: () => void;
  goalType: 'steps' | 'cycling' | 'sleep' | 'heartRate';
  currentGoal: number;
  onSaveGoal: (newGoal: number) => void;
  colorAccent?: string;
}

const DEFAULT_GOALS = {
  steps: 10000,
  cycling: 10,
  sleep: 8,
  heartRate: 60,
};

const GOAL_SETTINGS = {
  steps: {
    title: 'Step Goal',
    icon: 'trending-up',
    description: 'Set your daily step goal',
    min: 1000,
    max: 50000,
    step: 1000,
    unit: 'steps',
    presets: [5000, 7500, 10000, 12500, 15000],
  },
  cycling: {
    title: 'Cycling Goal',
    icon: 'bike',
    description: 'Set your daily cycling distance goal',
    min: 1,
    max: 100,
    step: 1,
    unit: 'km',
    presets: [5, 10, 15, 20, 30],
  },
  sleep: {
    title: 'Sleep Goal',
    icon: 'moon',
    description: 'Set your daily sleep duration goal',
    min: 5,
    max: 12,
    step: 0.5,
    unit: 'hours',
    presets: [6, 7, 8, 9, 10],
  },
  heartRate: {
    title: 'Heart Rate Goal',
    icon: 'heart',
    description: 'Set your target heart rate range',
    min: 50,
    max: 180,
    step: 5,
    unit: 'bpm',
    presets: [60, 80, 100, 120, 140],
  },
};

const GoalSettingModal: React.FC<GoalSettingModalProps> = ({
  isVisible,
  onClose,
  goalType,
  currentGoal,
  onSaveGoal,
  colorAccent,
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  
  const [goal, setGoal] = useState<string>(currentGoal.toString());
  const [error, setError] = useState<string | null>(null);
  
  const settings = GOAL_SETTINGS[goalType];
  const accentColor = colorAccent || colors.primary;
  
  // Reset goal value when modal opens
  useEffect(() => {
    if (isVisible) {
      setGoal(currentGoal.toString());
      setError(null);
    }
  }, [isVisible, currentGoal]);
  
  const handleGoalChange = (text: string) => {
    // Remove non-numeric characters except decimal point for sleep
    const sanitizedText = goalType === 'sleep' 
      ? text.replace(/[^0-9.]/g, '') 
      : text.replace(/[^0-9]/g, '');
    
    setGoal(sanitizedText);
    
    // Validate input
    const numValue = parseFloat(sanitizedText);
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
    } else if (numValue < settings.min) {
      setError(`Minimum goal is ${settings.min} ${settings.unit}`);
    } else if (numValue > settings.max) {
      setError(`Maximum goal is ${settings.max} ${settings.unit}`);
    } else {
      setError(null);
    }
  };
  
  const handleSave = () => {
    const numValue = parseFloat(goal);
    
    if (!isNaN(numValue) && numValue >= settings.min && numValue <= settings.max) {
      onSaveGoal(goalType === 'sleep' ? parseFloat(numValue.toFixed(1)) : Math.round(numValue));
      onClose();
    } else {
      setError(`Please enter a value between ${settings.min} and ${settings.max}`);
    }
  };
  
  const handlePresetSelect = (preset: number) => {
    setGoal(preset.toString());
    setError(null);
  };
  
  const handleIncrement = () => {
    const numValue = parseFloat(goal);
    if (!isNaN(numValue) && numValue < settings.max) {
      const newValue = numValue + settings.step;
      setGoal(newValue.toString());
      setError(null);
    }
  };
  
  const handleDecrement = () => {
    const numValue = parseFloat(goal);
    if (!isNaN(numValue) && numValue > settings.min) {
      const newValue = numValue - settings.step;
      setGoal(newValue.toString());
      setError(null);
    }
  };
  
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
              <Icon name={settings.icon} size={24} color={accentColor} />
              <Text style={[styles.title, { color: colors.text }]}>{settings.title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {settings.description}
            </Text>
            
            <View style={styles.inputContainer}>
              <TouchableOpacity 
                onPress={handleDecrement} 
                style={[styles.inputButton, { backgroundColor: accentColor + '30' }]}
              >
                <Icon name="minus" size={20} color={accentColor} />
              </TouchableOpacity>
              
              <View style={[styles.textInputContainer, { borderColor: colors.border }]}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={goal}
                  onChangeText={handleGoalChange}
                  keyboardType="numeric"
                  maxLength={6}
                  selectTextOnFocus
                />
                <Text style={[styles.unitText, { color: colors.textSecondary }]}>
                  {settings.unit}
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={handleIncrement} 
                style={[styles.inputButton, { backgroundColor: accentColor + '30' }]}
              >
                <Icon name="plus" size={20} color={accentColor} />
              </TouchableOpacity>
            </View>
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
            
            <Text style={[styles.presetsTitle, { color: colors.textSecondary }]}>
              Suggested Goals
            </Text>
            
            <View style={styles.presetContainer}>
              {settings.presets.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    {
                      backgroundColor: parseFloat(goal) === preset ? accentColor : accentColor + '20',
                    },
                  ]}
                  onPress={() => handlePresetSelect(preset)}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color: parseFloat(goal) === preset ? '#fff' : accentColor,
                      },
                    ]}
                  >
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: accentColor }]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 25,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  inputButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 60,
    flex: 1,
    marginHorizontal: 10,
  },
  input: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 16,
    marginLeft: 5,
  },
  errorText: {
    color: '#f44336',
    marginBottom: 15,
    textAlign: 'center',
  },
  presetsTitle: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  presetButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 50,
    marginBottom: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  presetText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveButton: {
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

export default GoalSettingModal; 