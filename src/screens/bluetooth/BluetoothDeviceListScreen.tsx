import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES } from '../../constants';
import { useBluetooth } from '../../contexts/BluetoothContext';
import { useTheme, getThemeColors } from '../../contexts/ThemeContext';

type NavigationProps = StackNavigationProp<any>;

interface DeviceItemProps {
  id: string;
  name: string;
  rssi?: number;
  onSelect: (id: string) => void;
  themeColors: any;
}

const DeviceItem: React.FC<DeviceItemProps> = ({ id, name, rssi, onSelect, themeColors }) => {
  // Calculate signal strength based on RSSI
  const getSignalStrength = (rssi?: number) => {
    if (!rssi) return 'Unknown';
    if (rssi > -60) return 'Excellent';
    if (rssi > -70) return 'Good';
    if (rssi > -80) return 'Fair';
    return 'Poor';
  };

  const getSignalIcon = (rssi?: number) => {
    if (!rssi) return '📡';
    if (rssi > -60) return '📶';
    if (rssi > -70) return '📶';
    if (rssi > -80) return '📶';
    return '📶';
  };

  return (
    <TouchableOpacity
      style={[styles.deviceItem, { backgroundColor: themeColors.surface }]}
      onPress={() => onSelect(id)}
    >
      <View style={styles.deviceIcon}>
        <Text style={styles.deviceIconText}>💍</Text>
      </View>
      <View style={styles.deviceInfo}>
        <Text style={[styles.deviceName, { color: themeColors.text }]}>{name || 'Unknown Device'}</Text>
        <Text style={[styles.deviceDetails, { color: themeColors.textSecondary }]}>
          Signal: {getSignalStrength(rssi)} {getSignalIcon(rssi)}
        </Text>
      </View>
      <View style={styles.connectButtonContainer}>
        <View style={[styles.connectButton, { backgroundColor: themeColors.primary }]}>
          <Text style={styles.connectButtonText}>Connect</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const BluetoothDeviceListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const { 
    availableDevices, 
    scanForDevices, 
    stopScan, 
    connectToDevice, 
    isScanning,
    connectionError,
    isBluetoothEnabled
  } = useBluetooth();
  
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // We'll use a consistent dark background for this process regardless of app theme
  const backgroundStyle = isDarkMode ? colors.background : COLORS.darkBackground;
  const textColor = isDarkMode ? colors.text : COLORS.white;
  
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start scanning when component mounts
  useEffect(() => {
    handleRefresh();
    
    // Clean up when component unmounts
    return () => {
      stopScan();
    };
  }, []);

  // Handle refresh/scanning
  const handleRefresh = async () => {
    try {
      setError(null);
      setRefreshing(true);
      
      // Check if Bluetooth is enabled
      if (!isBluetoothEnabled) {
        setError('Bluetooth is not enabled. Please enable Bluetooth and try again.');
        setRefreshing(false);
        return;
      }
      
      await scanForDevices();
    } catch (err) {
      setError('Failed to scan for devices. Please try again.');
      console.error('Scan error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle device selection
  const handleDeviceSelect = async (deviceId: string) => {
    try {
      stopScan();
      const success = await connectToDevice(deviceId);
      
      if (success) {
        navigation.navigate('PairingDevice', { deviceId });
      } else {
        Alert.alert('Connection Failed', 'Could not connect to device. Please try again.');
      }
    } catch (err) {
      console.error('Connection error:', err);
      Alert.alert('Connection Error', 'An error occurred while connecting to the device.');
    }
  };

  // Render an individual device
  const renderDevice = ({ item }) => (
    <DeviceItem
      id={item.id}
      name={item.name}
      rssi={item.rssi}
      onSelect={handleDeviceSelect}
      themeColors={colors}
    />
  );

  // Render empty state
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {isScanning ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: textColor }]}>Scanning for devices...</Text>
        </>
      ) : (
        <>
          <View style={styles.bluetoothIconContainer}>
            <Text style={styles.bluetoothIcon}>📶</Text>
          </View>
          <Text style={[styles.emptyText, { color: textColor }]}>No devices found</Text>
          <Text style={[styles.emptySubText, { color: isDarkMode ? colors.textSecondary : '#E0E0E0' }]}>
            Make sure your device is nearby and in pairing mode
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]} 
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: backgroundStyle }]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundStyle} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.backButtonText, { color: textColor }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Available Devices</Text>
        <View style={styles.rightHeaderPlaceholder} />
      </View>
      
      {/* Display any errors */}
      {(error || connectionError) && (
        <View style={[styles.errorContainer, { backgroundColor: colors.danger + '20' }]}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error || connectionError}</Text>
        </View>
      )}
      
      <View style={{ flex: 1, paddingBottom: 80 }}>
        <FlatList
          data={availableDevices}
          renderItem={renderDevice}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rightHeaderPlaceholder: {
    width: 24,
  },
  listContent: {
    padding: 20,
    paddingBottom: 150,
    flexGrow: 1,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  deviceIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  deviceIconText: {
    fontSize: 24,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  deviceDetails: {
    fontSize: 14,
  },
  connectButtonContainer: {
    marginLeft: 10,
  },
  connectButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  connectButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
    paddingBottom: 100,
  },
  bluetoothIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bluetoothIcon: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 30,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorContainer: {
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },
  errorText: {
    fontWeight: '500',
  },
});

export default BluetoothDeviceListScreen; 