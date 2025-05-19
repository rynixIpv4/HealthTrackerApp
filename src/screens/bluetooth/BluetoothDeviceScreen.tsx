import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../../constants';
import { useBluetooth } from '../../contexts/BluetoothContext';

type NavigationProps = StackNavigationProp<any>;

const BluetoothDeviceScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const route = useRoute();
  const { deviceId } = route.params as { deviceId: string };
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStep, setConnectionStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const { availableDevices, connectToDevice } = useBluetooth();
  
  // Get the device information
  const device = availableDevices.find(d => d.id === deviceId);
  
  useEffect(() => {
    // No simulation - just use the device state
    if (!device) {
      setError('Device not found');
    }
  }, [device]);
  
  const handleConnect = () => {
    setIsConnecting(true);
    setConnectionStep(1);
    setError(null);
    
    // Use the real connection method
    connectToDevice(deviceId)
      .then(success => {
        if (success) {
          // Connection successful
          setConnectionStep(3);
          setTimeout(() => {
            setIsConnecting(false);
            navigation.navigate('BluetoothSuccess', { deviceId });
          }, 1000);
        } else {
          // Connection failed
          setError('Failed to connect to device. Please try again.');
          setIsConnecting(false);
        }
      })
      .catch(err => {
        console.error('Error connecting to device:', err);
        setError('Connection error: ' + (err.message || 'Unknown error'));
        setIsConnecting(false);
      });
  };
  
  const handleCancel = () => {
    if (isConnecting) {
      setIsConnecting(false);
    } else {
      navigation.goBack();
    }
  };
  
  const getStepLabel = (step: number) => {
    switch (step) {
      case 1:
        return 'Initializing connection...';
      case 2:
        return 'Pairing with device...';
      case 3:
        return 'Finalizing connection...';
      default:
        return 'Connecting...';
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Text style={styles.backButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.deviceIconContainer}>
          <Text style={styles.deviceIcon}>💍</Text>
        </View>
        
        <Text style={styles.deviceName}>{device?.name || 'Unknown Device'}</Text>
        <Text style={styles.deviceId}>ID: {deviceId.substring(0, 8)}...</Text>
        
        {isConnecting ? (
          <View style={styles.connectingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.connectingText}>{getStepLabel(connectionStep)}</Text>
            <Text style={styles.connectingSubtext}>
              Please keep your device nearby and wait for the connection process to complete.
            </Text>
          </View>
        ) : (
          <View style={styles.infoContainer}>
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : (
              <>
                <Text style={styles.infoTitle}>About to connect</Text>
                <Text style={styles.infoText}>
                  You are about to pair with this ring. Make sure it's nearby and
                  in pairing mode.
                </Text>
                
                <View style={styles.featureItem}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.featureText}>Automatic health tracking</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.featureText}>Real-time data syncing</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.featureText}>Low power consumption</Text>
                </View>
              </>
            )}
          </View>
        )}
      </View>
      
      <View style={styles.footer}>
        {!isConnecting && (
          <TouchableOpacity 
            style={[styles.connectButton, error && styles.retryButton]} 
            onPress={handleConnect}
          >
            <Text style={styles.connectButtonText}>{error ? 'Retry' : 'Connect'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  deviceIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  deviceIcon: {
    fontSize: 60,
  },
  deviceName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  deviceId: {
    fontSize: 14,
    color: '#888',
    marginBottom: 32,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 18,
    color: COLORS.success,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#555',
  },
  connectingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  connectingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 12,
  },
  connectingSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default BluetoothDeviceScreen; 