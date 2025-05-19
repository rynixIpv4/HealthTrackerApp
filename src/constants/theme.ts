export const COLORS = {
  primary: '#5E60CE',
  secondary: '#64DFDF',
  tertiary: '#7400B8',
  background: '#F5F7FA',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#8D9AA5',
  lightGray: '#EAEDF2',
  success: '#4CAF50',
  danger: '#F44336',
  warning: '#FFC107',
  purple: '#6200EA',
  teal: '#00BCD4',
  pink: '#E91E63',
  blue: '#2196F3',
  darkBlue: '#0D47A1',
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  xlarge: 24,
  xxlarge: 32,
  xxxlarge: 48,
  width: 375, // Design screen width
  height: 812, // Design screen height
};

export const FONTS = {
  regular: 'Roboto-Regular',
  medium: 'Roboto-Medium',
  bold: 'Roboto-Bold',
  light: 'Roboto-Light',
};

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
};

export default { COLORS, SIZES, FONTS, SHADOWS }; 