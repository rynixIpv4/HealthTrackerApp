import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useBluetooth } from '../../contexts/BluetoothContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SCREENS } from '../../constants';
import { useTheme, getThemeColors } from '../../contexts/ThemeContext';
import BackButton from '../../components/BackButton';

type NavigationProps = StackNavigationProp<any>;

const BluetoothScanScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const { availableDevices, scanForDevices: startScan, stopScan, isScanning } = useBluetooth();
  const [scanTimeout, setScanTimeout] = useState<NodeJS.Timeout | null>(null);

  // Theme context
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Function to safely start scanning
    const safeStartScan = async () => {
      try {
        if (mounted) {
          // Only start if the component is still mounted
          await startScan();
          
          // Set a timeout to stop scanning after 15 seconds
          timeoutId = setTimeout(() => {
            if (mounted) {
              stopScan();
            }
          }, 15000);
          
          // Update local state
          if (mounted) {
            setScanTimeout(timeoutId);
          }
        }
      } catch (error) {
        console.error('Error starting scan in BluetoothScanScreen:', error);
        // Don't update state if unmounted
        if (mounted) {
          // Just stop any scan in progress
          stopScan();
        }
      }
    };
    
    // Start scanning safely
    safeStartScan();
    
    // Clean up on component unmount
    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (scanTimeout) {
        clearTimeout(scanTimeout);
      }
      stopScan();
    };
  }, []);

  const handleDeviceSelect = (deviceId: string) => {
    // Navigate to the device details screen
    navigation.navigate('BluetoothDevice', { deviceId });
  };

  // Handle scan button press
  const handleScanButtonPress = async () => {
    // Clear any existing timeout
    if (scanTimeout) {
      clearTimeout(scanTimeout);
      setScanTimeout(null);
    }
    
    // Stop any existing scan first
    stopScan();
    
    try {
      // Start a new scan
      await startScan();
      
      // Set a new timeout
      const timeout = setTimeout(() => {
        stopScan();
      }, 15000);
      
      setScanTimeout(timeout);
    } catch (error) {
      console.error('Error starting scan from button press:', error);
      // Just stop scanning in case of error
      stopScan();
    }
  };

  const renderDeviceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => handleDeviceSelect(item.id)}
    >
      <View style={styles.deviceInfo}>
        <View style={styles.deviceIconContainer}>
          <Text style={styles.deviceIcon}>💍</Text>
        </View>
        <View>
          <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.deviceId}>ID: {item.id.substring(0, 8)}...</Text>
        </View>
      </View>
      <View style={styles.signalContainer}>
        <Text style={styles.signalStrength}>
          {item.rssi > -60 ? '●●●' : item.rssi > -70 ? '●●○' : '●○○'}
        </Text>
        <Text style={styles.signalText}>Signal</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} color={colors.text} />
        <Text style={[styles.title, { color: colors.text }]}>Find your device</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {isScanning && availableDevices.length === 0 ? (
          <View style={styles.scanningContainer}>
            <View style={styles.bluetoothIconContainer}>
              <Text style={styles.bluetoothIcon}>📶</Text>
            </View>
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.activityIndicator} />
            <Text style={styles.scanningText}>Scanning for devices...</Text>
            <Text style={styles.scanningSubtext}>
              Make sure your device is nearby and in pairing mode
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Available Devices</Text>
            {availableDevices.length > 0 ? (
              <FlatList
                data={availableDevices}
                renderItem={renderDeviceItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.deviceList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.noDevicesContainer}>
                <Text style={styles.noDevicesText}>No devices found</Text>
                <Text style={styles.noDevicesSubtext}>
                  Make sure your device is nearby and in pairing mode
                </Text>
              </View>
            )}
          </>
        )}
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={handleScanButtonPress}
          disabled={isScanning}
        >
          <Text style={styles.scanButtonText}>
            {isScanning ? 'Scanning...' : 'Scan for Devices'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: Platform.OS === 'ios' ? 10 : 5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  deviceList: {
    paddingBottom: 20,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFEFEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deviceIcon: {
    fontSize: 24,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 12,
    color: '#888',
  },
  signalContainer: {
    alignItems: 'center',
  },
  signalStrength: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 4,
  },
  signalText: {
    fontSize: 12,
    color: '#888',
  },
  scanningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bluetoothIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  bluetoothIcon: {
    fontSize: 50,
  },
  activityIndicator: {
    marginBottom: 24,
  },
  scanningText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  scanningSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  noDevicesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noDevicesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  noDevicesSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default BluetoothScanScreen; 