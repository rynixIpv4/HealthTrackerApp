import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
  PermissionsAndroid,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useBluetooth } from '../../contexts/BluetoothContext';
import { COLORS, SIZES } from '../../constants';

type NavigationProps = StackNavigationProp<any>;

const AvailableDevicesScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { 
    availableDevices, 
    scanForDevices, 
    isScanning, 
    selectDevice,
    isBluetoothEnabled,
    connectionError 
  } = useBluetooth();
  const [refreshing, setRefreshing] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Check permissions and start scanning when component mounts
  useEffect(() => {
    checkPermissions();
  }, []);
  
  // Check if Bluetooth is not enabled
  useEffect(() => {
    if (!isBluetoothEnabled && !isScanning) {
      Alert.alert(
        'Bluetooth is not enabled',
        'Please enable Bluetooth to scan for devices.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings',
            onPress: openBluetoothSettings
          }
        ]
      );
    }
  }, [isBluetoothEnabled]);

  const checkPermissions = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 31) {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          ]);

          const allGranted = 
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
            granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

          setPermissionsGranted(allGranted);
          if (allGranted) {
            startScan();
          } else {
            Alert.alert(
              'Permission required',
              'Bluetooth and location permissions are required to scan for devices.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings',
                  onPress: openAppSettings
                }
              ]
            );
          }
        } else {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          
          setPermissionsGranted(granted === PermissionsAndroid.RESULTS.GRANTED);
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            startScan();
          } else {
            Alert.alert(
              'Permission required',
              'Location permission is required to scan for Bluetooth devices.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Open Settings',
                  onPress: openAppSettings
                }
              ]
            );
          }
        }
      } else {
        setPermissionsGranted(true);
        startScan();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };
  
  const openBluetoothSettings = () => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
    } else {
      Linking.openURL('App-Prefs:Bluetooth');
    }
  };

  // Start scanning for devices
  const startScan = async () => {
    if (!permissionsGranted) {
      checkPermissions();
      return;
    }
    
    if (!isBluetoothEnabled) {
      Alert.alert('Bluetooth is not enabled', 'Please enable Bluetooth to scan for devices.');
      return;
    }
    
    setRefreshing(true);
    try {
      await scanForDevices();
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDevicePress = (deviceId: string) => {
    selectDevice(deviceId);
    navigation.navigate('PairingScreen');
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {isScanning ? (
        <>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Scanning for devices...</Text>
        </>
      ) : (
        <>
          <Icon name="bluetooth-off" size={60} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No devices found</Text>
          <Text style={styles.emptySubtext}>
            Make sure your device is turned on and in pairing mode
          </Text>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={startScan}
          >
            <Text style={styles.scanButtonText}>Scan Again</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  const calculateSignalStrength = (rssi: number | undefined) => {
    if (!rssi) return 0;
    // RSSI typically ranges from -100 (weak) to -30 (strong)
    const absRssi = Math.abs(rssi);
    if (absRssi < 60) return 4;
    if (absRssi < 70) return 3;
    if (absRssi < 80) return 2;
    return 1;
  };

  const getSignalIcon = (rssi: number | undefined) => {
    const strength = calculateSignalStrength(rssi);
    return `signal-${strength}`;
  };

  const renderDeviceItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.deviceItem} 
      onPress={() => handleDevicePress(item.id)}
    >
      <View style={styles.deviceInfo}>
        <Icon name="bluetooth" size={24} color={COLORS.primary} />
        <View style={styles.deviceTextContainer}>
          <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
          <Text style={styles.deviceId}>{item.id}</Text>
        </View>
      </View>
      <View style={styles.deviceMeta}>
        {item.rssi && (
          <Icon 
            name={getSignalIcon(item.rssi)} 
            size={18} 
            color={COLORS.gray} 
            style={styles.signalIcon} 
          />
        )}
        <Icon name="chevron-right" size={24} color={COLORS.gray} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Available Devices</Text>
        <TouchableOpacity 
          style={styles.scanIconButton} 
          onPress={startScan} 
          disabled={isScanning}
        >
          <Icon 
            name={isScanning ? "bluetooth-searching" : "refresh"} 
            size={24} 
            color={isScanning ? COLORS.lightGray : COLORS.white} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {isScanning && (
          <View style={styles.scanningIndicator}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.scanningText}>Scanning for devices...</Text>
          </View>
        )}
        
        {connectionError && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle-outline" size={20} color={COLORS.white} />
            <Text style={styles.errorText}>{connectionError}</Text>
          </View>
        )}
        
        <FlatList
          data={availableDevices}
          renderItem={renderDeviceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyList}
          refreshing={refreshing}
          onRefresh={startScan}
        />
      </View>
      
      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Icon name="information-outline" size={20} color={COLORS.white} />
        <Text style={styles.infoText}>
          Make sure your device is powered on and in pairing mode
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.medium,
  },
  backButton: {
    padding: SIZES.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scanIconButton: {
    padding: SIZES.small,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: SIZES.large,
    borderTopRightRadius: SIZES.large,
    overflow: 'hidden',
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.small,
    backgroundColor: COLORS.lightBackground,
  },
  scanningText: {
    marginLeft: SIZES.small,
    color: COLORS.dark,
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    padding: SIZES.small,
  },
  errorText: {
    color: COLORS.white,
    marginLeft: SIZES.small,
    flex: 1,
  },
  listContainer: {
    flexGrow: 1,
    paddingBottom: SIZES.large,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.medium,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBackground,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceTextContainer: {
    marginLeft: SIZES.medium,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.dark,
  },
  deviceId: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  deviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalIcon: {
    marginRight: SIZES.small,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xlarge,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: SIZES.large,
    marginBottom: SIZES.small,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.large,
  },
  scanButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.large,
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
    marginTop: SIZES.large,
  },
  scanButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkGray,
    paddingVertical: SIZES.medium,
    paddingHorizontal: SIZES.large,
  },
  infoText: {
    color: COLORS.white,
    marginLeft: SIZES.small,
    fontSize: 14,
  },
});

export default AvailableDevicesScreen; 