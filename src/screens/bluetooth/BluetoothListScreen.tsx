import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useBluetooth } from '../../contexts/BluetoothContext';
import { useNavigation } from '@react-navigation/native';

const BluetoothListScreen = () => {
  const navigation = useNavigation();
  const { 
    availableDevices, 
    pairedDevices, 
    isScanning, 
    scanForDevices, 
    stopScan, 
    connectToDevice,
    isConnecting,
    selectDevice
  } = useBluetooth();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    // Start scanning when the screen loads
    scanForDevices();

    return () => {
      // Stop scanning when the screen unmounts
      stopScan();
    };
  }, []);

  const handleDevicePress = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    selectDevice(deviceId);
    navigation.navigate('BluetoothPairingScreen', { deviceId });
  };

  const handleRescan = () => {
    stopScan();
    scanForDevices();
  };

  // Render item for the device list
  const renderDevice = ({ item }) => {
    // Calculate signal strength icon
    let signalIcon = 'signal-off';
    if (item.rssi) {
      const rssi = Math.abs(item.rssi);
      if (rssi < 70) signalIcon = 'signal-cellular-3';
      else if (rssi < 80) signalIcon = 'signal-cellular-2';
      else signalIcon = 'signal-cellular-1';
    }

    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          selectedDeviceId === item.id && styles.selectedDevice
        ]}
        onPress={() => handleDevicePress(item.id)}
        disabled={isConnecting}
      >
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          {item.type && <Text style={styles.deviceType}>{item.type}</Text>}
        </View>
        <View style={styles.deviceMeta}>
          <Icon name={signalIcon} size={18} color="#666" style={styles.signalIcon} />
          {item.connected && (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderPairedSection = () => {
    if (pairedDevices.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paired Devices</Text>
        <FlatList
          data={pairedDevices}
          renderItem={renderDevice}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect Device</Text>
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRescan}
          disabled={isScanning}
        >
          <Icon name="refresh" size={24} color={isScanning ? "#ccc" : "#000"} />
        </TouchableOpacity>
      </View>

      {renderPairedSection()}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Devices</Text>
          {isScanning && <ActivityIndicator size="small" color="#0066CC" />}
        </View>

        {availableDevices.length > 0 ? (
          <FlatList
            data={availableDevices}
            renderItem={renderDevice}
            keyExtractor={item => item.id}
          />
        ) : (
          <View style={styles.emptyState}>
            {isScanning ? (
              <Text style={styles.emptyText}>Searching for devices...</Text>
            ) : (
              <>
                <Text style={styles.emptyText}>No devices found</Text>
                <TouchableOpacity 
                  style={styles.rescanButton} 
                  onPress={handleRescan}
                >
                  <Text style={styles.rescanText}>Scan Again</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDevice: {
    backgroundColor: '#f0f7ff',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
  },
  deviceType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalIcon: {
    marginRight: 8,
  },
  connectedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connectedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  rescanButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  rescanText: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default BluetoothListScreen; 