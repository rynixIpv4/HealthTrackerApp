import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator 
} from 'react-native';
import { COLORS, SIZES, ELEVATION_STYLES } from '../constants';

interface ButtonProps {
  title: string;
  onPress: () => void;
  type?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  iconPosition = 'left',
}) => {
  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = { ...styles.button };

    // Button type styling
    switch (type) {
      case 'primary':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: COLORS.primary,
          ...ELEVATION_STYLES.medium,
        };
        break;
      case 'secondary':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: COLORS.secondary,
          ...ELEVATION_STYLES.small,
        };
        break;
      case 'outline':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: COLORS.primary,
          ...ELEVATION_STYLES.small,
        };
        break;
      case 'ghost':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: 'transparent',
        };
        break;
    }

    // Button size styling
    switch (size) {
      case 'small':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: SIZES.base,
          paddingHorizontal: SIZES.medium,
          borderRadius: SIZES.base,
        };
        break;
      case 'medium':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: SIZES.small,
          paddingHorizontal: SIZES.large,
          borderRadius: SIZES.small,
        };
        break;
      case 'large':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: SIZES.medium,
          paddingHorizontal: SIZES.xlarge,
          borderRadius: SIZES.medium,
        };
        break;
    }

    // Disabled styling
    if (disabled) {
      buttonStyle = {
        ...buttonStyle,
        opacity: 0.5,
      };
    }

    return buttonStyle;
  };

  const getTextStyle = (): TextStyle => {
    let textStyling: TextStyle = { ...styles.buttonText };

    // Button type text styling
    switch (type) {
      case 'primary':
      case 'secondary':
        textStyling = {
          ...textStyling,
          color: COLORS.white,
        };
        break;
      case 'outline':
      case 'ghost':
        textStyling = {
          ...textStyling,
          color: COLORS.primary,
        };
        break;
    }

    // Button size text styling
    switch (size) {
      case 'small':
        textStyling = {
          ...textStyling,
          fontSize: SIZES.font,
        };
        break;
      case 'medium':
        textStyling = {
          ...textStyling,
          fontSize: SIZES.medium,
        };
        break;
      case 'large':
        textStyling = {
          ...textStyling,
          fontSize: SIZES.large,
        };
        break;
    }

    return textStyling;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={type === 'primary' || type === 'secondary' ? COLORS.white : COLORS.primary}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text style={[getTextStyle(), textStyle]}>{title}</Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.medium,
    padding: SIZES.medium,
    ...ELEVATION_STYLES.medium,
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    ...ELEVATION_STYLES.small,
  },
});

export default Button; 