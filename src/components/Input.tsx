import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle,
  TouchableOpacity,
  KeyboardTypeOptions,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  Platform,
} from 'react-native';
import { COLORS, SIZES } from '../constants';
import Feather from 'react-native-vector-icons/Feather';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  isPassword?: boolean;
  error?: string;
  disabled?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  autoFocus?: boolean;
  onBlur?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  onFocus?: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
  backgroundColor?: string;
  textColor?: string;
  isDarkMode?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  isPassword = false,
  error,
  disabled = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  style,
  inputStyle,
  labelStyle,
  leftIcon,
  rightIcon,
  multiline = false,
  numberOfLines = 1,
  maxLength,
  autoFocus = false,
  onBlur,
  onFocus,
  backgroundColor,
  textColor,
  isDarkMode,
}) => {
  const [secureTextEntry, setSecureTextEntry] = useState(isPassword);
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  };

  const toggleSecureTextEntry = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, labelStyle, textColor && { color: textColor }]}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedInput,
          error && styles.errorInput,
          disabled && styles.disabledInput,
          backgroundColor && { backgroundColor: backgroundColor },
          isDarkMode && { borderColor: 'rgba(255, 255, 255, 0.15)', backgroundColor: 'rgba(255, 255, 255, 0.05)' }
        ]}
      >
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            isPassword && styles.passwordInput,
            inputStyle,
            isDarkMode && { color: '#FFFFFF' },
            !isDarkMode && { color: COLORS.black },
            textColor && { color: textColor }
          ]}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#a0a0a0'}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoFocus={autoFocus}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        
        {isPassword && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={toggleSecureTextEntry}
            activeOpacity={0.7}
          >
            <Feather
              name={secureTextEntry ? 'eye' : 'eye-off'}
              size={20}
              color={isDarkMode ? 'rgba(255, 255, 255, 0.7)' : COLORS.gray}
            />
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <View style={styles.iconContainer}>{rightIcon}</View>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.medium,
  },
  label: {
    fontSize: SIZES.font,
    color: COLORS.black,
    marginBottom: SIZES.base,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.small,
    backgroundColor: COLORS.white,
  },
  focusedInput: {
    borderColor: COLORS.primary,
  },
  errorInput: {
    borderColor: COLORS.danger,
  },
  disabledInput: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.medium,
    fontSize: SIZES.medium,
    color: COLORS.black,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  passwordInput: {
    paddingRight: 0,
  },
  iconContainer: {
    paddingHorizontal: SIZES.small,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: SIZES.font,
    color: COLORS.danger,
    marginTop: SIZES.base,
  },
});

export default Input; 