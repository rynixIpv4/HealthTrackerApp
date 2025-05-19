import React, { useState, useEffect, createContext, useContext } from 'react';
import ToastNotification from './ToastNotification';

interface ToastOptions {
  message: string;
  icon?: string;
  iconColor?: string;
  backgroundColor?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [icon, setIcon] = useState('bluetooth');
  const [iconColor, setIconColor] = useState('#4cceac');
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');
  const [duration, setDuration] = useState(3000);
  const [lastToastTime, setLastToastTime] = useState(0);

  const showToast = ({
    message,
    icon = 'bluetooth',
    iconColor = '#4cceac',
    backgroundColor = '#1a1a1a',
    duration = 3000,
  }: ToastOptions) => {
    // Prevent multiple rapid toasts
    const now = Date.now();
    if (now - lastToastTime < 300) return;
    
    setLastToastTime(now);
    
    // If a toast is already visible, hide it first
    if (visible) {
      setVisible(false);
      setTimeout(() => {
        updateToast(message, icon, iconColor, backgroundColor, duration);
      }, 300);
    } else {
      updateToast(message, icon, iconColor, backgroundColor, duration);
    }
  };

  const updateToast = (
    message: string,
    icon: string,
    iconColor: string,
    backgroundColor: string,
    duration: number
  ) => {
    setMessage(message);
    setIcon(icon);
    setIconColor(iconColor);
    setBackgroundColor(backgroundColor);
    setDuration(duration);
    setVisible(true);
  };

  const hideToast = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastNotification
        visible={visible}
        message={message}
        icon={icon}
        iconColor={iconColor}
        backgroundColor={backgroundColor}
        duration={duration}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
}; 