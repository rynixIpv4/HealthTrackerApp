import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Dimensions, 
  TouchableWithoutFeedback
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

interface ToastProps {
  visible: boolean;
  message: string;
  icon?: string;
  iconColor?: string;
  backgroundColor?: string;
  duration?: number;
  onHide?: () => void;
}

const ToastNotification: React.FC<ToastProps> = ({
  visible,
  message,
  icon = 'bluetooth',
  iconColor = '#4cceac',
  backgroundColor = '#1a1a1a',
  duration = 3000,
  onHide
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    // Hide animation
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  if (!visible) return null;

  return (
    <TouchableWithoutFeedback onPress={hideToast}>
      <Animated.View 
        style={[
          styles.container, 
          { 
            opacity, 
            transform: [{ translateY }],
            backgroundColor: backgroundColor,
          }
        ]}
      >
        <View style={styles.contentContainer}>
          <Icon name={icon} size={20} color={iconColor} style={styles.icon} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: (width - 300) / 2,
    width: 300,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  message: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  }
});

export default ToastNotification; 