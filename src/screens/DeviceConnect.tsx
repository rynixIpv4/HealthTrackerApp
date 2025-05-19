import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useBluetooth } from '../contexts/BluetoothContext';
import { CONNECTION_STATUS } from '../constants';
import { useToast } from '../components/ToastManager';

const DeviceConnect = () => {
  const navigation = useNavigation();
  const toast = useToast();
  const {
    isInitialized,
    isConnected,
    connectionStatus,
    isScanning,
    discoveredDevices,
    connectedDevice,
    scanForDevices,
    stopScan,
    connectToDevice,
    disconnectDevice,
    resetBluetooth
  } = useBluetooth();

  // Local state
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Start scan when component mounts if bluetooth is initialized
  useEffect(() => {
    if (isInitialized && !isConnected) {
      handleStartScan();
    }
    
    // Clear scan on unmount
    return () => {
      stopScan();
    };
  }, [isInitialized]);

  // Add auto-retry for scanning if no devices are found
  useEffect(() => {
    // If we're not actively scanning and have no devices yet, retry up to 3 times
    if (!isScanning && discoveredDevices.length === 0 && scanAttempts < 3) {
      const timer = setTimeout(() => {
        console.log(`Auto-retrying scan (attempt ${scanAttempts + 1}/3)...`);
        setScanAttempts(prev => prev + 1);
        handleStartScan();
      }, 3000); // Wait 3 seconds between attempts
      
      return () => clearTimeout(timer);
    }
  }, [isScanning, discoveredDevices.length, scanAttempts]);

  // Handle starting the scan with improved error handling
  const handleStartScan = async () => {
    if (isScanning) return;
    
    try {
      // Clear any previous errors
      setErrorMessage(null);
      
      // Reset Bluetooth before scanning if this isn't the first attempt
      if (scanAttempts > 0) {
        console.log('Resetting Bluetooth before retry scan...');
        await resetBluetooth();
      }
      
      await scanForDevices();
    } catch (error) {
      console.error('Error starting scan:', error);
      setErrorMessage('Could not scan for devices. Please try again.');
      Alert.alert('Scan Error', 'Could not scan for devices. Please try again.');
    }
  };

  // Enhanced connect function with better preparation and single-attempt logic
  const handleConnectToDevice = useCallback(async (deviceId: string) => {
    if (!deviceId || isConnecting) return;
    
    setIsConnecting(true);
    setErrorMessage(null);
    
    try {
      // Prepare connection environment first
      if (Platform.OS === 'android') {
        toast.showToast({
          message: 'Preparing connection...',
          icon: 'bluetooth',
          iconColor: '#4cceac',
          backgroundColor: '#1a1a1a'
        });
      }
      
      // Reset Bluetooth before attempting to connect
      console.log('Resetting Bluetooth to prepare for clean connection...');
      await resetBluetooth();
      
      // Wait for Bluetooth reset to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Now attempt the connection with a fully reset environment
      if (Platform.OS === 'android') {
        toast.showToast({
          message: 'Connecting to device...',
          icon: 'bluetooth',
          iconColor: '#4cceac',
          backgroundColor: '#1a1a1a'
        });
      }
      
      console.log('Making optimized connection attempt...');
      const success = await connectToDevice(deviceId);
      
      if (success) {
        console.log('Successfully connected to device');
        // Navigate to success screen after successful connection
        navigation.navigate('BluetoothSuccessScreen', { deviceId });
      } else {
        console.error('Failed to connect to device');
        setErrorMessage('Connection failed. Please ensure your device is nearby and try again.');
        if (Platform.OS === 'android') {
          toast.showToast({
            message: 'Connection failed. Please try again.',
            icon: 'bluetooth',
            iconColor: '#ff6b6b',
            backgroundColor: '#1a1a1a',
            duration: 4000
          });
        } else {
          Alert.alert('Connection Failed', 'Could not connect to the device. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error during connection:', error);
      setErrorMessage('Connection error. Please try again.');
      
      // Add error toast
      if (Platform.OS === 'android') {
        toast.showToast({
          message: 'Connection error. Please try again.',
          icon: 'alert-circle',
          iconColor: '#ff6b6b',
          backgroundColor: '#1a1a1a',
          duration: 4000
        });
      }
      
    } finally {
      setIsConnecting(false);
    }
  }, [connectToDevice, resetBluetooth, navigation, isConnecting, toast]);

  // Handle selecting a device
  const handleSelectDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connect to Device</Text>
      
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
      
      <View style={styles.scanContainer}>
        <TouchableOpacity 
          style={[styles.scanButton, isScanning && styles.scanningButton]} 
          onPress={handleStartScan}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Scan for Devices'}
          </Text>
          {isScanning && <ActivityIndicator size="small" color="#fff" style={styles.spinner} />}
        </TouchableOpacity>
      </View>

      {isScanning && (
        <Text style={styles.statusText}>Looking for nearby devices...</Text>
      )}
      
      {!isScanning && discoveredDevices.length === 0 && (
        <Text style={styles.statusText}>
          {scanAttempts > 0 
            ? 'No devices found. Try moving closer to your device or restart it.' 
            : 'No devices found. Tap "Scan for Devices" to search.'}
        </Text>
      )}

      <FlatList
        data={discoveredDevices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.deviceItem,
              selectedDeviceId === item.id && styles.selectedDevice
            ]}
            onPress={() => handleSelectDevice(item.id)}
          >
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
              <Text style={styles.deviceId}>ID: {item.id}</Text>
              <Text style={styles.signalStrength}>
                Signal: {item.rssi ? `${item.rssi} dBm` : 'Unknown'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.connectButton,
            (!selectedDeviceId || isConnecting) && styles.disabledButton
          ]}
          onPress={() => selectedDeviceId && handleConnectToDevice(selectedDeviceId)}
          disabled={!selectedDeviceId || isConnecting}
        >
          <Text style={styles.connectButtonText}>
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Text>
          {isConnecting && <ActivityIndicator size="small" color="#fff" style={styles.spinner} />}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.resetButton}
          onPress={resetBluetooth}
        >
          <Text style={styles.resetButtonText}>Reset Bluetooth</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  scanContainer: {
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#5c6bc0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  scanningButton: {
    backgroundColor: '#3949ab',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  selectedDevice: {
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
    borderColor: '#2196f3',
  },
  deviceInfo: {
    flexDirection: 'column',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  signalStrength: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    marginTop: 16,
  },
  connectButton: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#a5d6a7',
    opacity: 0.7,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  spinner: {
    marginLeft: 8,
  },
  statusText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  resetButton: {
    backgroundColor: '#ff9800',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ef9a9a',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
});

export default DeviceConnect; 