import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import { useBluetooth } from '../../contexts/BluetoothContext';

const BluetoothDebugScreen = () => {
  const {
    scanForDevices,
    stopScan,
    isScanning,
    connectionError,
    allDiscoveredDevices,
    connectToDevice
  } = useBluetooth();

  useEffect(() => {
    // Start scanning when the component mounts
    handleStartScan();

    // Clean up when the component unmounts
    return () => {
      stopScan();
    };
  }, []);

  const handleStartScan = async () => {
    try {
      await scanForDevices();
    } catch (error) {
      console.error('Error starting scan:', error);
      Alert.alert('Scan Error', 'Failed to start scanning for devices.');
    }
  };

  const handleDevicePress = async (deviceId: string) => {
    try {
      stopScan();
      Alert.alert(
        'Connect to Device',
        'Do you want to connect to this device?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Connect',
            onPress: async () => {
              const success = await connectToDevice(deviceId);
              if (success) {
                Alert.alert('Connected', 'Successfully connected to the device.');
              } else {
                Alert.alert('Connection Failed', 'Could not connect to the device.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error handling device press:', error);
      Alert.alert('Error', 'An error occurred while trying to connect to the device.');
    }
  };

  const renderDeviceItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.deviceItem} 
        onPress={() => handleDevicePress(item.id)}
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.deviceId}>ID: {item.id}</Text>
          <Text style={styles.deviceRssi}>Signal Strength: {item.rssi || 'N/A'} dBm</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bluetooth Debug</Text>
        </View>

        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>
            Status: {isScanning ? 'Scanning...' : 'Idle'}
          </Text>
          {connectionError && (
            <Text style={styles.errorText}>Error: {connectionError}</Text>
          )}
        </View>

        <View style={styles.scanButtonContainer}>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={handleStartScan}
            disabled={isScanning}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? 'Scanning...' : 'Start Scan'}
            </Text>
            {isScanning && (
              <ActivityIndicator size="small" color="#FFFFFF" style={styles.spinner} />
            )}
          </TouchableOpacity>
          
          {isScanning && (
            <TouchableOpacity
              style={[styles.scanButton, styles.stopButton]}
              onPress={stopScan}
            >
              <Text style={styles.scanButtonText}>Stop Scan</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.devicesContainer}>
          <Text style={styles.sectionTitle}>
            All Discovered Devices ({allDiscoveredDevices.length})
          </Text>

          {allDiscoveredDevices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {isScanning ? 'Searching for devices...' : 'No devices found. Try scanning again.'}
              </Text>
              {isScanning && <ActivityIndicator size="large" color="#5E60CE" />}
            </View>
          ) : (
            <FlatList
              data={allDiscoveredDevices}
              renderItem={renderDeviceItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.devicesList}
              ListFooterComponent={isScanning ? <ActivityIndicator size="large" color="#5E60CE" /> : null}
            />
          )}
        </View>
        
        <Text style={styles.helpText}>
          Note: Unnamed devices might represent your smart ring.
          {Platform.OS === 'android' && ' On Android, some devices advertise without names.'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    marginTop: 4,
  },
  scanButtonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  scanButton: {
    backgroundColor: '#5E60CE',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  stopButton: {
    backgroundColor: '#F44336',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  spinner: {
    marginLeft: 8,
  },
  devicesContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  devicesList: {
    paddingBottom: 16,
  },
  deviceItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#8D9AA5',
    marginBottom: 2,
  },
  deviceRssi: {
    fontSize: 12,
    color: '#8D9AA5',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#8D9AA5',
    textAlign: 'center',
    marginBottom: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#8D9AA5',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});

export default BluetoothDebugScreen; 