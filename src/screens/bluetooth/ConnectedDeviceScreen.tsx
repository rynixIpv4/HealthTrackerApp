import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useBluetooth } from '../../contexts/BluetoothContext';
import { COLORS, SIZES } from '../../constants';

const ConnectedDeviceScreen = () => {
  const navigation = useNavigation();
  const { 
    selectedDevice, 
    disconnectDevice, 
    deviceData,
    syncDeviceData,
    connectionError
  } = useBluetooth();
  const [notifications, setNotifications] = useState(true);
  const [autoConnect, setAutoConnect] = useState(true);
  const [dataSyncing, setDataSyncing] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncDeviceData();
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert('Sync Failed', 'Unable to sync data from your device. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Device',
      `Are you sure you want to disconnect from ${selectedDevice?.name || 'this device'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnectDevice();
            navigation.navigate('BluetoothDeviceList');
          },
        },
      ]
    );
  };

  const handleForget = () => {
    Alert.alert(
      'Forget Device',
      `Are you sure you want to forget ${selectedDevice?.name || 'this device'}? You'll need to pair it again to use it.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Forget',
          style: 'destructive',
          onPress: async () => {
            await disconnectDevice();
            // Additional logic to remove from paired devices
            navigation.navigate('DevicesScreen');
          },
        },
      ]
    );
  };

  const formatLastSynced = (date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const syncDate = new Date(date);
    const diffMs = now.getTime() - syncDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    
    return syncDate.toLocaleDateString();
  };

  if (!selectedDevice) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBackground} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Device</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.content}>
          <View style={styles.centerContainer}>
            <Icon name="bluetooth-off" size={60} color={COLORS.gray} />
            <Text style={styles.noDeviceTitle}>No Device Connected</Text>
            <Text style={styles.noDeviceMessage}>
              Please connect a device to see its details here.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('BluetoothDeviceList')}
            >
              <Text style={styles.primaryButtonText}>Connect a Device</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>Connected Device</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Device Info Card */}
        <View style={styles.deviceCard}>
          <View style={styles.deviceHeader}>
            <View style={styles.deviceIconContainer}>
              <View style={styles.customSmartRingIcon}>
                <View style={[styles.ringOuter, { borderColor: COLORS.primary }]} />
                <View style={styles.ringInner}>
                  <Icon name="pulse" size={24} color={COLORS.primary} />
                </View>
              </View>
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{selectedDevice.name}</Text>
              <View style={styles.statusContainer}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connected</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.batteryContainer}>
            <Icon 
              name={(deviceData?.battery && Number(deviceData.battery) > 50) ? "battery-high" : 
                   (deviceData?.battery && Number(deviceData.battery) > 20) ? "battery" : "battery-low"} 
              size={20} 
              color={(deviceData?.battery && Number(deviceData.battery) > 50) ? COLORS.success : 
                    (deviceData?.battery && Number(deviceData.battery) > 20) ? COLORS.warning : COLORS.error} 
            />
            <Text style={styles.batteryText}>
              {deviceData?.battery ? `${deviceData.battery}%` : 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.syncContainer}>
            <Text style={styles.lastSyncText}>
              Last synced: {formatLastSynced(deviceData?.lastSynced)}
            </Text>
            <TouchableOpacity 
              style={styles.syncButton}
              onPress={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Icon name="sync" size={16} color={COLORS.white} />
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Device Data</Text>
          
          {/* Health Data Display */}
          <View style={styles.healthDataContainer}>
            <View style={styles.healthDataItem}>
              <Icon name="heart-pulse" size={24} color={COLORS.primary} />
              <Text style={styles.healthDataValue}>{deviceData?.heartRate || '--'}</Text>
              <Text style={styles.healthDataLabel}>BPM</Text>
            </View>
            
            <View style={styles.healthDataItem}>
              <Icon name="shoe-print" size={24} color={COLORS.primary} />
              <Text style={styles.healthDataValue}>{deviceData?.steps?.toLocaleString() || '--'}</Text>
              <Text style={styles.healthDataLabel}>Steps</Text>
            </View>
            
            <View style={styles.healthDataItem}>
              <Icon name="fire" size={24} color={COLORS.primary} />
              <Text style={styles.healthDataValue}>{deviceData?.calories || '--'}</Text>
              <Text style={styles.healthDataLabel}>Calories</Text>
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Device Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Device ID</Text>
            <Text style={styles.infoValue}>{selectedDevice.id.substring(0, 8)}...</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Signal Strength</Text>
            <Text style={styles.infoValue}>{selectedDevice.rssi || '--'} dBm</Text>
          </View>
          
          {connectionError && (
            <View style={styles.errorContainer}>
              <Icon name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{connectionError}</Text>
            </View>
          )}
        </View>
        
        {/* Settings Card */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Device Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive alerts from this device
              </Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primaryLight }}
              thumbColor={notifications ? COLORS.primary : COLORS.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Auto-Connect</Text>
              <Text style={styles.settingDescription}>
                Automatically connect when in range
              </Text>
            </View>
            <Switch
              value={autoConnect}
              onValueChange={setAutoConnect}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primaryLight }}
              thumbColor={autoConnect ? COLORS.primary : COLORS.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingName}>Data Syncing</Text>
              <Text style={styles.settingDescription}>
                Keep device data in sync with app
              </Text>
            </View>
            <Switch
              value={dataSyncing}
              onValueChange={setDataSyncing}
              trackColor={{ false: COLORS.lightGray, true: COLORS.primaryLight }}
              thumbColor={dataSyncing ? COLORS.primary : COLORS.white}
            />
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionCard}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleDisconnect}
          >
            <Icon name="bluetooth-off" size={24} color={COLORS.dark} />
            <Text style={styles.actionButtonText}>Disconnect Device</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleForget}
          >
            <Icon name="delete-outline" size={24} color={COLORS.error} />
            <Text style={[styles.actionButtonText, { color: COLORS.error }]}>
              Forget This Device
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    backgroundColor: COLORS.lightBackground,
    borderTopLeftRadius: SIZES.large,
    borderTopRightRadius: SIZES.large,
  },
  scrollContent: {
    padding: SIZES.medium,
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xlarge,
  },
  deviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.medium,
    padding: SIZES.large,
    marginBottom: SIZES.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  deviceIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.lightBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.medium,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SIZES.tiny,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: SIZES.tiny,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.success,
  },
  batteryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBackground,
    borderRadius: SIZES.small,
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
    alignSelf: 'flex-start',
    marginBottom: SIZES.medium,
  },
  batteryText: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
    marginLeft: SIZES.tiny,
  },
  syncContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  lastSyncText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.medium,
    paddingVertical: SIZES.small,
    borderRadius: SIZES.small,
  },
  syncButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  healthDataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SIZES.medium,
  },
  healthDataItem: {
    alignItems: 'center',
    flex: 1,
  },
  healthDataValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginVertical: 4,
  },
  healthDataLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginVertical: SIZES.medium,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: SIZES.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.small,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.dark,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    padding: SIZES.small,
    borderRadius: SIZES.small,
    marginTop: SIZES.small,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.error,
    marginLeft: SIZES.small,
  },
  settingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.medium,
    padding: SIZES.large,
    marginBottom: SIZES.medium,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.medium,
  },
  settingInfo: {
    flex: 1,
    marginRight: SIZES.medium,
  },
  settingName: {
    fontSize: 16,
    color: COLORS.dark,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  actionCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.medium,
    padding: SIZES.medium,
    marginBottom: SIZES.large,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.medium,
  },
  actionButtonText: {
    fontSize: 16,
    color: COLORS.dark,
    marginLeft: SIZES.medium,
  },
  noDeviceTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.dark,
    marginTop: SIZES.large,
    marginBottom: SIZES.small,
  },
  noDeviceMessage: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.xlarge,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.large,
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  customSmartRingIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  ringOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    position: 'absolute',
  },
  ringInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
});

export default ConnectedDeviceScreen; 